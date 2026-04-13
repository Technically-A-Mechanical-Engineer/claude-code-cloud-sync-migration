// packages/core/src/integrity/checksum.ts

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type { Result, ChecksumResult } from '../types.js';

type ChecksumFailureReason = 'file_not_found' | 'permission_denied' | 'read_error';

/**
 * Compute SHA-256 checksum of a file using Node.js crypto.
 *
 * CORE-04: Compute SHA-256 checksums using Node.js crypto (no shell dependency).
 *
 * This replaces the v2.0.0 platform-specific approach:
 * - Windows PowerShell: Get-FileHash -Algorithm SHA256
 * - macOS: shasum -a 256
 * - Linux: sha256sum
 *
 * Using Node.js crypto eliminates all platform differences (MIN-4 from PITFALLS.md).
 * Output is always lowercase hex, consistent across all platforms.
 *
 * Uses streaming for memory efficiency on large files.
 */
export async function checksum(
  filePath: string,
): Promise<Result<ChecksumResult, ChecksumFailureReason>> {
  // Verify file exists before attempting to read
  try {
    await fs.access(filePath);
  } catch (err: unknown) {
    const errno = (err as NodeJS.ErrnoException).code;
    if (errno === 'ENOENT') {
      return {
        success: false,
        reason: 'file_not_found',
        detail: `File not found: ${filePath}`,
      };
    }
    if (errno === 'EACCES' || errno === 'EPERM') {
      return {
        success: false,
        reason: 'permission_denied',
        detail: `Permission denied reading: ${filePath}`,
      };
    }
    return {
      success: false,
      reason: 'read_error',
      detail: `Cannot access file: ${filePath} — ${(err as Error).message}`,
    };
  }

  try {
    const hash = await computeFileHash(filePath);
    return {
      success: true,
      data: {
        filePath,
        algorithm: 'sha256',
        hash,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      reason: 'read_error',
      detail: `Failed to compute checksum for ${filePath}: ${(err as Error).message}`,
    };
  }
}

/**
 * Compute SHA-256 hash of a file using streaming.
 * Returns lowercase hex string.
 */
function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Compute SHA-256 hash of a string (for manifest verification).
 * Returns lowercase hex string.
 */
export function checksumString(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}
