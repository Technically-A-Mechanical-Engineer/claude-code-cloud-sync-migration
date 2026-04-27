// packages/core/src/environment/detect.ts

import fs from 'node:fs/promises';
import type {
  Result, EnvironmentInfo, ProjectEntry, PathHashEntry,
} from '../types.js';
import { detectPlatform } from './platform.js';
import { detectCloudService } from './cloud.js';
import { getClaudeConfigDir, getClaudeProjectsDir } from '../util/paths.js';

type DetectFailureReason = 'unsupported_os' | 'home_dir_not_found' | 'config_dir_not_found';

/**
 * Detect the full environment: OS, shell, cloud service, project inventory, path-hash entries.
 *
 * CORE-01: Detect OS, shell type, and cloud service from filesystem paths.
 *
 * This is the primary entry point for environment analysis. It composes
 * platform detection, cloud detection, and Claude Code configuration scanning
 * into a single structured result.
 *
 * Read-only: this function never modifies the filesystem.
 */
export async function detect(): Promise<Result<EnvironmentInfo, DetectFailureReason>> {
  // 1. Detect platform
  const platformResult = detectPlatform();
  if (!platformResult.success) {
    return platformResult;
  }
  const platform = platformResult.data;

  // 2. Detect cloud service
  const cloudResult = await detectCloudService(platform.platform);
  if (!cloudResult.success) {
    return cloudResult;
  }
  const cloud = cloudResult.data;

  // 3. Scan Claude Code projects directory for path-hash entries
  const claudeConfigDir = getClaudeConfigDir();
  const projectsDir = getClaudeProjectsDir();

  let pathHashes: PathHashEntry[] = [];
  try {
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    pathHashes = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        hashDirName: e.name,
        decodedPath: null, // Decoding is done by decode() — separate function
        exists: true,
      }));
  } catch {
    // Projects directory doesn't exist — no path-hash entries
    // This is normal for new Claude Code installations
  }

  // 4. Build project inventory from path-hash directories
  // IMPORTANT (downstream contract): projects[] is intentionally always empty.
  // detect() inventories path-hash directories but does NOT decode them.
  // Callers must invoke decode() separately for each pathHashes[] entry
  // to populate project details. This keeps detect() fast and avoids
  // the combinatorial filesystem probing that decode() performs.
  const projects: ProjectEntry[] = [];

  return {
    success: true,
    data: {
      platform,
      cloud,
      projects,
      pathHashes,
      claudeConfigDir,
    },
  };
}
