// packages/core/src/integrity/compare.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, CompareResult } from '../types.js';

type CompareFailureReason = 'source_not_found' | 'target_not_found' | 'permission_denied' | 'scan_error';

/**
 * Compare source and target directories by file count, total size, and hidden directories.
 *
 * CORE-05: Compare source and target directories (file counts, total size, hidden directories).
 *
 * This is a read-only comparison — no files are modified.
 * Returns structured comparison with explicit match flags.
 */
export async function compare(
  source: string,
  target: string,
): Promise<Result<CompareResult, CompareFailureReason>> {
  // Verify both directories exist
  try {
    const sourceStat = await fs.stat(source);
    if (!sourceStat.isDirectory()) {
      return { success: false, reason: 'source_not_found', detail: `Source is not a directory: ${source}` };
    }
  } catch {
    return { success: false, reason: 'source_not_found', detail: `Source directory not found: ${source}` };
  }

  try {
    const targetStat = await fs.stat(target);
    if (!targetStat.isDirectory()) {
      return { success: false, reason: 'target_not_found', detail: `Target is not a directory: ${target}` };
    }
  } catch {
    return { success: false, reason: 'target_not_found', detail: `Target directory not found: ${target}` };
  }

  try {
    const [sourceInfo, targetInfo] = await Promise.all([
      scanDirectory(source),
      scanDirectory(target),
    ]);

    return {
      success: true,
      data: {
        source: {
          path: source,
          fileCount: sourceInfo.fileCount,
          totalSize: sourceInfo.totalSize,
          hiddenDirs: sourceInfo.hiddenDirs,
        },
        target: {
          path: target,
          fileCount: targetInfo.fileCount,
          totalSize: targetInfo.totalSize,
          hiddenDirs: targetInfo.hiddenDirs,
        },
        fileCountMatch: sourceInfo.fileCount === targetInfo.fileCount,
        sizeMatch: sourceInfo.totalSize === targetInfo.totalSize,
        hiddenDirMatch: arraysMatch(sourceInfo.hiddenDirs, targetInfo.hiddenDirs),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      reason: 'scan_error',
      detail: `Error scanning directories: ${(err as Error).message}`,
    };
  }
}

interface DirectoryScan {
  fileCount: number;
  totalSize: number;
  hiddenDirs: string[];
}

/**
 * Recursively scan a directory for file count, total size, and hidden directories.
 * Depth-limited (default 50) and symlink-safe to prevent infinite recursion.
 */
async function scanDirectory(dirPath: string, maxDepth: number = 50): Promise<DirectoryScan> {
  let fileCount = 0;
  let totalSize = 0;
  const hiddenDirs: string[] = [];

  async function walk(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip symlinks to prevent infinite loops from symlink cycles
      if (entry.isSymbolicLink()) continue;

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Track hidden directories (starting with .)
        if (entry.name.startsWith('.')) {
          hiddenDirs.push(path.relative(dirPath, fullPath));
        }
        await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        fileCount++;
        try {
          const stat = await fs.stat(fullPath);
          totalSize += stat.size;
        } catch {
          // Skip files we can't stat (permission issues, broken symlinks)
        }
      }
    }
  }

  await walk(dirPath, 0);
  return { fileCount, totalSize, hiddenDirs: hiddenDirs.sort() };
}

/**
 * Compare two sorted string arrays for equality.
 */
function arraysMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}
