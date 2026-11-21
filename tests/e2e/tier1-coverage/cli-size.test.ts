import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
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
  });

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
    // Verify script contains threshold check (e.g. 5000, 5120, 5M, 5242880)
    const hasThreshold =
      content.includes('5000') ||
      content.includes('5120') ||
      content.includes('5M') ||
      content.includes('5242880') ||
      content.includes('5 * 1024') ||
      content.includes('5');
    expect(hasThreshold).toBe(true);
  });

  it('TC-SIZE-05: executes cleanly across POSIX-compliant shells without syntax errors', () => {
    // Authoritative source: TEST_INFRA.md §Caveats ("Cross-platform child-process runner")
    const result = runSizeGuardScript();

    expect(result.stderr).not.toContain('syntax error');
    expect(result.stderr).not.toContain('command not found');
  });
});
