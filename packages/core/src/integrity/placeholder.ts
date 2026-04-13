// packages/core/src/integrity/placeholder.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, PlaceholderCheckResult, Platform } from '../types.js';

type PlaceholderFailureReason = 'dir_not_found' | 'scan_error';

/** Percentage threshold above which placeholder files are flagged */
const PLACEHOLDER_THRESHOLD = 5;

/**
 * Detect Files On-Demand / Smart Sync placeholder files in a directory.
 *
 * CORE-06: Detect Files On-Demand / Smart Sync placeholder files per platform.
 *
 * Detection methods per platform:
 * - Windows OneDrive: FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS (0x00400000)
 *   Detected via 0-byte files (simplified — full attribute check requires native addon)
 * - macOS iCloud: files with .icloud extension
 * - Dropbox: detected via 0-byte percentage (simplified — xattr check requires native addon)
 * - Google Drive: virtual filesystem, 0-byte files
 * - Cross-platform: 0-byte file percentage > 5% flags potential placeholders
 *
 * Read-only: this function never modifies the filesystem.
 */
export async function placeholderDetect(
  dirPath: string,
  platform: Platform,
): Promise<Result<PlaceholderCheckResult, PlaceholderFailureReason>> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return { success: false, reason: 'dir_not_found', detail: `Not a directory: ${dirPath}` };
    }
  } catch {
    return { success: false, reason: 'dir_not_found', detail: `Directory not found: ${dirPath}` };
  }

  try {
    const details: string[] = [];
    let totalFiles = 0;
    let placeholderCount = 0;

    async function walk(currentPath: string): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and .git for performance
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          await walk(fullPath);
        } else if (entry.isFile()) {
          totalFiles++;

          // macOS iCloud placeholder detection: .icloud extension
          if (platform === 'macos' && entry.name.endsWith('.icloud')) {
            placeholderCount++;
            details.push(`iCloud placeholder: ${path.relative(dirPath, fullPath)}`);
            continue;
          }

          // Cross-platform: 0-byte file detection
          try {
            const fileStat = await fs.stat(fullPath);
            if (fileStat.size === 0) {
              // Exclude known legitimately empty files
              const knownEmpty = ['.gitkeep', '.keep', '.npmignore', '__init__.py'];
              if (!knownEmpty.includes(entry.name)) {
                placeholderCount++;
                details.push(`0-byte file (possible placeholder): ${path.relative(dirPath, fullPath)}`);
              }
            }
          } catch {
            // Skip files we can't stat
          }
        }
      }
    }

    await walk(dirPath);

    const percentage = totalFiles > 0 ? (placeholderCount / totalFiles) * 100 : 0;
    const hasPlaceholders = percentage > PLACEHOLDER_THRESHOLD;

    return {
      success: true,
      data: {
        hasPlaceholders,
        placeholderCount,
        totalFiles,
        percentage: Math.round(percentage * 100) / 100,
        details: hasPlaceholders ? details : [],
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      reason: 'scan_error',
      detail: `Error scanning for placeholders: ${(err as Error).message}`,
    };
  }
}
