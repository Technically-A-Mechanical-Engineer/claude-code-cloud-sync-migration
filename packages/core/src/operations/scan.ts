// packages/core/src/operations/scan.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, ScanResult, ScanMatch } from '../types.js';

type ScanFailureReason = 'dir_not_found' | 'scan_error';

/**
 * File extensions to scan for cloud path references.
 */
const SCANNABLE_EXTENSIONS = new Set([
  '.md', '.json', '.txt', '.yml', '.yaml', '.toml', '.cfg', '.ini', '.env',
]);

/**
 * File names to specifically target for scanning.
 */
const SCANNABLE_FILENAMES = new Set([
  'CLAUDE.md', 'claude.md', '.clauderc',
  'settings.json', 'package.json',
  '.env', '.env.local',
]);

/**
 * Directories to skip during scanning.
 */
const SKIP_DIRS = new Set([
  '.git', 'node_modules', '__pycache__', 'vendor', '.venv', 'venv',
  'dist', 'build', '.next', '.nuxt',
]);

/**
 * Cloud storage path patterns to search for.
 */
const CLOUD_PATH_PATTERNS = [
  /OneDrive\b/i,
  /CloudStorage\/OneDrive/i,
  /\/Dropbox\//i,
  /\\Dropbox\\/i,
  /Google\s*Drive/i,
  /CloudStorage\/GoogleDrive/i,
  /Mobile Documents\/com~apple~CloudDocs/i,
  /iCloud/i,
];

/**
 * Scan project files for stale cloud storage path references.
 *
 * CORE-11: Scan for stale cloud storage path references in project files
 * (CLAUDE.md, memory files, settings).
 *
 * Read-only: this function never modifies the filesystem.
 *
 * Scans text files matching known extensions or filenames.
 * Skips binary files, .git/, node_modules/, __pycache__/, vendor/.
 */
export async function scan(
  dirPath: string,
): Promise<Result<ScanResult, ScanFailureReason>> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return { success: false, reason: 'dir_not_found', detail: `Not a directory: ${dirPath}` };
    }
  } catch {
    return { success: false, reason: 'dir_not_found', detail: `Directory not found: ${dirPath}` };
  }

  try {
    const matches: ScanMatch[] = [];
    let filesScanned = 0;

    async function walk(currentPath: string): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue;
          await walk(path.join(currentPath, entry.name));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const shouldScan =
            SCANNABLE_FILENAMES.has(entry.name) ||
            SCANNABLE_EXTENSIONS.has(ext);

          if (!shouldScan) continue;

          const fullPath = path.join(currentPath, entry.name);
          filesScanned++;

          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              for (const pattern of CLOUD_PATH_PATTERNS) {
                if (pattern.test(line)) {
                  const patternMatch = pattern.exec(line);
                  matches.push({
                    file: path.relative(dirPath, fullPath),
                    line: i + 1,
                    content: line.trim(),
                    cloudPath: patternMatch ? patternMatch[0] : '',
                  });
                  break; // One match per line is sufficient
                }
              }
            }
          } catch {
            // Skip files that can't be read (binary, permission issues)
          }
        }
      }
    }

    await walk(dirPath);

    return {
      success: true,
      data: {
        matches,
        filesScanned,
        matchCount: matches.length,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      reason: 'scan_error',
      detail: `Scan error: ${(err as Error).message}`,
    };
  }
}
