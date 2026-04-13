// packages/core/src/operations/copy.ts

import fs from 'node:fs/promises';
import type { Result, CopyData } from '../types.js';
import { spawnTool, isRobocopySuccess } from '../util/spawn.js';

type CopyFailureReason =
  | 'target_exists'
  | 'source_not_found'
  | 'source_not_directory'
  | 'permission_denied'
  | 'robocopy_failed'
  | 'rsync_failed'
  | 'tool_not_found'
  | 'copy_error';

/**
 * Copy a directory from source to target using platform-specific tools.
 *
 * CORE-08: Copy directories via robocopy (Windows) or rsync (macOS/Linux)
 * with exit code handling (robocopy 1-7 = success).
 *
 * Safety (D-04): copy() REFUSES to overwrite an existing target directory.
 * If the target exists, it returns a failure with reason 'target_exists'.
 * The caller must handle this — either skip, use an alternate name, or
 * confirm the user wants to delete the existing target first.
 *
 * Platform selection:
 * - Windows (process.platform === 'win32'): robocopy /E /COPY:DAT /DCOPY:DAT /R:3 /W:5 /XJ
 * - macOS/Linux: rsync -avHE --progress
 *
 * Robocopy exit code handling (CRIT-3):
 * - Codes 0-7: success states (uses spawnTool + isRobocopySuccess)
 * - Codes 8+: actual failures
 */
export async function copy(
  source: string,
  target: string,
): Promise<Result<CopyData, CopyFailureReason>> {
  // D-04 Safety: refuse to overwrite existing target
  try {
    await fs.access(target);
    // Target exists — refuse to proceed
    return {
      success: false,
      reason: 'target_exists',
      detail: `Target directory already exists: ${target}. Refusing to overwrite (safety model).`,
    };
  } catch {
    // Target does not exist — safe to proceed
  }

  // Verify source exists and is a directory
  try {
    const stat = await fs.stat(source);
    if (!stat.isDirectory()) {
      return {
        success: false,
        reason: 'source_not_directory',
        detail: `Source is not a directory: ${source}`,
      };
    }
  } catch {
    return {
      success: false,
      reason: 'source_not_found',
      detail: `Source directory not found: ${source}`,
    };
  }

  const isWindows = process.platform === 'win32';

  // Robocopy creates the target directory itself — pre-creating it would
  // leave an empty directory artifact on copy failure. Only rsync needs
  // the target to exist before copying.
  if (!isWindows) {
    try {
      await fs.mkdir(target, { recursive: false });
    } catch (err: unknown) {
      const errno = (err as NodeJS.ErrnoException).code;
      if (errno === 'EACCES' || errno === 'EPERM') {
        return {
          success: false,
          reason: 'permission_denied',
          detail: `Permission denied creating target directory: ${target}`,
        };
      }
      if (errno !== 'EEXIST') {
        return {
          success: false,
          reason: 'copy_error',
          detail: `Failed to create target directory: ${(err as Error).message}`,
        };
      }
    }
  }

  if (isWindows) {
    return robocopy(source, target);
  }
  return rsync(source, target);
}

/**
 * Copy via robocopy (Windows).
 * Flags:
 *   /E       — copy subdirectories including empty ones
 *   /COPY:DAT — copy Data, Attributes, Timestamps
 *   /DCOPY:DAT — copy directory Data, Attributes, Timestamps
 *   /R:3     — retry 3 times on failure
 *   /W:5     — wait 5 seconds between retries
 *   /XJ      — exclude junction points (prevents infinite loops)
 *
 * Uses spawnTool wrapper which passes arguments as an array to spawnSync
 * (not string concatenation), preventing command injection.
 */
function robocopy(source: string, target: string): Result<CopyData, CopyFailureReason> {
  const args = [source, target, '/E', '/COPY:DAT', '/DCOPY:DAT', '/R:3', '/W:5', '/XJ'];
  const result = spawnTool('robocopy', args, { shell: false });

  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'tool_not_found', detail: 'robocopy not found on PATH' };
    }
    return { success: false, reason: 'robocopy_failed', detail: result.detail };
  }

  const exitCode = result.data.exitCode;

  // CRIT-3: robocopy exit codes 0-7 are success states
  if (!isRobocopySuccess(exitCode)) {
    return {
      success: false,
      reason: 'robocopy_failed',
      detail: `robocopy exit code ${exitCode} (failure). stderr: ${result.data.stderr}`,
    };
  }

  // Parse file count from robocopy output (best-effort)
  const filesCopied = parseRobocopyFileCount(result.data.stdout);

  return {
    success: true,
    data: {
      source,
      target,
      tool: 'robocopy',
      exitCode,
      filesCopied,
      summary: `robocopy completed with exit code ${exitCode} (success). ${filesCopied} files copied.`,
    },
  };
}

/**
 * Copy via rsync (macOS/Linux).
 * Flags:
 *   -a       — archive mode (recursive, preserves permissions, timestamps, etc.)
 *   -v       — verbose
 *   -H       — preserve hard links
 *   -E       — preserve executability (macOS)
 *   --progress — show progress
 *
 * Trailing slash on source: rsync interprets "source/" as "contents of source"
 * vs "source" as "the directory itself". We use trailing slash to copy contents
 * into the target directory.
 *
 * Uses spawnTool wrapper which passes arguments as an array to spawnSync
 * (not string concatenation), preventing command injection.
 */
function rsync(source: string, target: string): Result<CopyData, CopyFailureReason> {
  // Ensure trailing slash on source (copy contents, not the directory itself)
  const srcWithSlash = source.endsWith('/') ? source : source + '/';

  const args = ['-avHE', '--progress', srcWithSlash, target];

  const result = spawnTool('rsync', args, { shell: false });

  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'tool_not_found', detail: 'rsync not found on PATH' };
    }
    return { success: false, reason: 'rsync_failed', detail: result.detail };
  }

  if (result.data.exitCode !== 0) {
    return {
      success: false,
      reason: 'rsync_failed',
      detail: `rsync exit code ${result.data.exitCode}. stderr: ${result.data.stderr}`,
    };
  }

  const filesCopied = parseRsyncFileCount(result.data.stdout);

  return {
    success: true,
    data: {
      source,
      target,
      tool: 'rsync',
      exitCode: 0,
      filesCopied,
      summary: `rsync completed successfully. ${filesCopied} files copied.`,
    },
  };
}

/**
 * Parse file count from robocopy stdout (best-effort).
 * Robocopy summary format: "Files :   total   copied   skipped   mismatch   FAILED   extras"
 * We parse the second number (copied count), not the first (total).
 *
 * Locale limitation: robocopy output keywords are locale-sensitive on non-English
 * Windows. The "Files" keyword may differ, causing this parser to return 0.
 */
function parseRobocopyFileCount(stdout: string): number {
  // Match the Files summary line and capture the second number (copied count)
  const match = stdout.match(/Files\s*:\s*\d+\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parse file count from rsync stdout (best-effort).
 * Counts lines that represent transferred files.
 */
function parseRsyncFileCount(stdout: string): number {
  const lines = stdout.split('\n').filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith('sending') &&
      !trimmed.startsWith('sent') &&
      !trimmed.startsWith('total') &&
      !trimmed.startsWith('building')
    );
  });
  return lines.length;
}
