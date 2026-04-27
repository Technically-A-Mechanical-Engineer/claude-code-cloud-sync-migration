// packages/core/src/util/spawn.ts

import { spawnSync } from 'node:child_process';
import type { Result, SpawnOutput, SpawnFailureReason } from '../types.js';

/**
 * Safe child process spawn wrapper.
 * - Never throws — returns Result<SpawnOutput, SpawnFailureReason>
 * - Uses spawnSync (not execSync) to get exit code without throwing on non-zero
 * - Uses shell: true on Windows for correct path handling (MOD-3)
 * - 55-second timeout by default (fits within MCP 60s constraint, CRIT-4)
 */
export function spawnTool(
  command: string,
  args: string[],
  options?: {
    timeout?: number;
    cwd?: string;
    shell?: boolean;
  },
): Result<SpawnOutput, SpawnFailureReason> {
  const isWindows = process.platform === 'win32';
  const timeout = options?.timeout ?? 55_000;
  const shell = options?.shell ?? isWindows; // Default to shell: true on Windows (MOD-3)

  try {
    const result = spawnSync(command, args, {
      shell,
      encoding: 'utf8',
      timeout,
      cwd: options?.cwd,
      // Prevent inheriting stdin — we do not need interactive input
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error) {
      const errno = (result.error as NodeJS.ErrnoException).code;
      if (errno === 'ENOENT') {
        return {
          success: false,
          reason: 'not_found',
          detail: `${command} not found on PATH`,
        };
      }
      if (errno === 'EACCES' || errno === 'EPERM') {
        return {
          success: false,
          reason: 'permission_denied',
          detail: `Permission denied executing ${command}: ${result.error.message}`,
        };
      }
      if (errno === 'ETIMEDOUT' || result.error.message.includes('TIMEOUT')) {
        return {
          success: false,
          reason: 'timeout',
          detail: `${command} timed out after ${timeout}ms`,
        };
      }
      return {
        success: false,
        reason: 'unexpected_error',
        detail: result.error.message,
      };
    }

    return {
      success: true,
      data: {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        exitCode: result.status ?? 1,
      },
    };
  } catch (err: unknown) {
    // Catch-all: should not reach here with spawnSync, but TypeScript strict mode
    // requires handling the unknown error type (MIN-5)
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      reason: 'unexpected_error',
      detail: message,
    };
  }
}

/**
 * Check if a robocopy exit code represents success.
 * Robocopy uses exit codes 0-7 for success/informational states.
 * Only exit codes >= 8 are actual failures (CRIT-3).
 *
 * Bit flags: 0=no change, 1=files copied, 2=extra files, 4=mismatched files
 * Codes 8+=failed files, 16=fatal error
 */
export function isRobocopySuccess(exitCode: number): boolean {
  return exitCode >= 0 && exitCode < 8;
}
