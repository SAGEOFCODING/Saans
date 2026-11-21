import { spawnSync } from 'child_process';
import type { SpawnSyncReturns } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Discovers a working bash or POSIX shell executable on the current system.
 */
function getShellExecutable(): string {
  if (process.platform === 'win32') {
    const gitBashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
    if (fs.existsSync(gitBashPath)) {
      return gitBashPath;
    }
    const systemBashPath = 'C:\\WINDOWS\\system32\\bash.exe';
    if (fs.existsSync(systemBashPath)) {
      return systemBashPath;
    }
    return 'bash';
  }
  return 'sh';
}

/**
 * Runs `scripts/check-size.sh` in the specified directory using the cross-platform shell.
 */
export function runSizeGuardScript(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env
): CliResult {
  const scriptPath = path.resolve(cwd, 'scripts/check-size.sh');
  const shell = getShellExecutable();

  // Normalize path with forward slashes for bash/sh
  const normalizedScriptPath = scriptPath.replace(/\\/g, '/');

  let res: SpawnSyncReturns<string>;
  try {
    res = spawnSync(shell, [normalizedScriptPath], {
      cwd,
      env: { ...env },
      encoding: 'utf-8',
      shell: false,
    });
  } catch (err) {
    // Fallback to shell: true if direct executable spawn fails
    res = spawnSync(shell, [`"${normalizedScriptPath}"`], {
      cwd,
      env: { ...env },
      encoding: 'utf-8',
      shell: true,
    });
  }

  return {
    status: res.status,
    stdout: (res.stdout || '').toString().trim(),
    stderr: (res.stderr || '').toString().trim(),
  };
}
