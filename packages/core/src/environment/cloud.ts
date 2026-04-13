// packages/core/src/environment/cloud.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Result, CloudService, CloudServiceInfo, Platform } from '../types.js';

/**
 * Cloud service detection path patterns.
 * Each pattern is tested against the user's home directory contents.
 * Patterns sourced from v2.0.0 prompts (duplicated in all five prompts).
 */
interface CloudPattern {
  service: CloudService;
  /** Glob-like path patterns relative to home directory (Windows) */
  windowsPatterns: string[];
  /** Glob-like path patterns relative to home directory (macOS) */
  macosPatterns: string[];
  /** Glob-like path patterns relative to home directory (Linux) */
  linuxPatterns: string[];
}

const CLOUD_PATTERNS: CloudPattern[] = [
  {
    service: 'onedrive',
    windowsPatterns: ['OneDrive', 'OneDrive - *'],
    macosPatterns: ['Library/CloudStorage/OneDrive-*'],
    linuxPatterns: [], // OneDrive has no official Linux client
  },
  {
    service: 'dropbox',
    windowsPatterns: ['Dropbox'],
    macosPatterns: ['Dropbox'],
    linuxPatterns: ['Dropbox'],
  },
  {
    service: 'google-drive',
    windowsPatterns: ['Google Drive', 'My Drive'],
    macosPatterns: ['Library/CloudStorage/GoogleDrive-*', 'Google Drive'],
    linuxPatterns: [], // Google Drive has no official Linux client
  },
  {
    service: 'icloud',
    windowsPatterns: [], // iCloud on Windows uses a different path structure
    macosPatterns: ['Library/Mobile Documents/com~apple~CloudDocs'],
    linuxPatterns: [], // iCloud has no Linux client
  },
];

/**
 * Detect active cloud sync services by scanning the home directory for known patterns.
 * Returns the first matched service. If none found, returns service: 'none'.
 *
 * This is a read-only filesystem scan — it checks for directory existence only.
 */
export async function detectCloudService(
  platform: Platform,
): Promise<Result<CloudServiceInfo, 'home_dir_not_found'>> {
  const homeDir = os.homedir();

  try {
    await fs.access(homeDir);
  } catch {
    return {
      success: false,
      reason: 'home_dir_not_found',
      detail: `Home directory not accessible: ${homeDir}`,
    };
  }

  const patternKey: keyof CloudPattern =
    platform === 'windows'
      ? 'windowsPatterns'
      : platform === 'macos'
        ? 'macosPatterns'
        : 'linuxPatterns';

  for (const pattern of CLOUD_PATTERNS) {
    const paths = pattern[patternKey];
    for (const p of paths) {
      const matchedPath = await matchCloudPath(homeDir, p);
      if (matchedPath) {
        return {
          success: true,
          data: {
            service: pattern.service,
            syncRoot: matchedPath,
            isCloudSynced: true,
          },
        };
      }
    }
  }

  return {
    success: true,
    data: {
      service: 'none',
      syncRoot: null,
      isCloudSynced: false,
    },
  };
}

/**
 * Check if a path within a given directory is inside a cloud-synced folder.
 */
export function isPathCloudSynced(
  targetPath: string,
  cloudSyncRoot: string | null,
): boolean {
  if (!cloudSyncRoot) return false;
  const normalizedTarget = targetPath.toLowerCase().replace(/\\/g, '/');
  const normalizedRoot = cloudSyncRoot.toLowerCase().replace(/\\/g, '/');
  return normalizedTarget.startsWith(normalizedRoot);
}

/**
 * Match a cloud path pattern against the home directory.
 * Supports simple wildcard (*) for prefix matching.
 * Returns the matched directory path, or null.
 */
async function matchCloudPath(
  homeDir: string,
  pattern: string,
): Promise<string | null> {
  if (pattern.includes('*')) {
    // Wildcard: list parent directory and match prefix
    const prefix = pattern.split('*')[0];
    const parentDir = path.join(homeDir, path.dirname(prefix));
    const baseName = path.basename(prefix);

    try {
      const entries = await fs.readdir(parentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith(baseName)) {
          return path.join(parentDir, entry.name);
        }
      }
    } catch {
      // Directory doesn't exist — pattern doesn't match
    }
    return null;
  }

  // Exact match
  const fullPath = path.join(homeDir, pattern);
  try {
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      return fullPath;
    }
  } catch {
    // Path doesn't exist
  }
  return null;
}
