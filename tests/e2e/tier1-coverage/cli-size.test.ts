import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { runSizeGuardScript } from '../harness/cli';

describe('Tier 1 Coverage — Repo Size Budget Guard (scripts/check-size.sh)', () => {
  const scriptPath = path.resolve(process.cwd(), 'scripts/check-size.sh');

  it('TC-SIZE-01: verifies scripts/check-size.sh exists on disk', () => {
    // Authoritative source: ORIGINAL_REQUEST.md Phase 0, PROJECT.md Feature 3
    const exists = fs.existsSync(scriptPath);
    expect(exists, `Expected script to exist at ${scriptPath}`).toBe(true);

    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content.startsWith('#!')).toBe(true);
  });

  it('TC-SIZE-02: executes scripts/check-size.sh and exits with code 0 on compliant repository', () => {
    // Authoritative source: docs/architecture.md §13 ("repo < 2 MB, hard limit 10 MB"), AGENTS.md Part A
    const result = runSizeGuardScript();

    expect(result.status, `Script failed with error: ${result.stderr}`).toBe(0);
  }, 15000);

  it('TC-SIZE-03: stdout reports calculated size measurement', () => {
    // Authoritative source: ORIGINAL_REQUEST.md Phase 0
    const result = runSizeGuardScript();

    expect(result.status).toBe(0);
    const output = (result.stdout + ' ' + result.stderr).toLowerCase();
    const mentionsSize =
      output.includes('mb') ||
      output.includes('kb') ||
      output.includes('size') ||
      output.includes('bytes');
    expect(mentionsSize).toBe(true);
  });

  it('TC-SIZE-04: script enforces 5 MB threshold limit', () => {
    // Authoritative source: AGENTS.md Part A ("fails if repo > 5 MB (hard limit is 10 MB)")
    const content = fs.readFileSync(scriptPath, 'utf-8');
    // Verify script contains specific threshold check (e.g. 5000, 5120, MAX_KB, 5242880) without ambiguous '5'
    const hasThreshold =
      content.includes('5000') ||
      content.includes('5120') ||
      content.includes('MAX_KB') ||
      content.includes('5242880') ||
      content.includes('5 * 1024');
    expect(hasThreshold).toBe(true);
  });

  it('TC-SIZE-05: executes cleanly across POSIX-compliant shells without syntax errors', () => {
    // Authoritative source: TEST_INFRA.md §Caveats ("Cross-platform child-process runner")
    const result = runSizeGuardScript();

    expect(result.stderr).not.toContain('syntax error');
    expect(result.stderr).not.toContain('command not found');
  });

  it('TC-SIZE-06: returns exit code 1 when repository size > 5 MB', () => {
    // Authoritative source: AGENTS.md Part A ("fails if repo > 5 MB (hard limit is 10 MB)")
    const fixtureDir = path.resolve(process.cwd(), 'node_modules/.cache/test-size-overflow');
    try {
      fs.mkdirSync(fixtureDir, { recursive: true });
      // Create a dummy file larger than 5 MB (6 MB = 6,291,456 bytes)
      fs.writeFileSync(path.join(fixtureDir, 'large-blob.dat'), Buffer.alloc(6 * 1024 * 1024));

      // Also initialize git tracking in fixture so both `du` and `git ls-files` fallback detect overflow
      spawnSync('git', ['init'], { cwd: fixtureDir });
      spawnSync('git', ['add', 'large-blob.dat'], { cwd: fixtureDir });

      const result = runSizeGuardScript(fixtureDir);
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/exceeds 5 MB limit/i);
    } finally {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  it('TC-SIZE-07: returns exit code 1 when banned asset or binary file is tracked in git', () => {
    // Authoritative source: docs/architecture.md §13, AGENTS.md Part A ("No binaries, images, fonts")
    const fixtureDir = path.resolve(process.cwd(), 'node_modules/.cache/test-banned-assets');
    try {
      fs.mkdirSync(fixtureDir, { recursive: true });
      spawnSync('git', ['init'], { cwd: fixtureDir });

      // Track a banned binary extension (.png)
      fs.writeFileSync(path.join(fixtureDir, 'forbidden-photo.png'), 'fake-image-binary-content');
      spawnSync('git', ['add', 'forbidden-photo.png'], { cwd: fixtureDir });

      const result = runSizeGuardScript(fixtureDir);
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/banned binary or asset files detected in git tracking/i);
      expect(result.stderr).toContain('forbidden-photo.png');
    } finally {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });
});
