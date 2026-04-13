// packages/core/src/environment/decode.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, PathHashEntry } from '../types.js';

type DecodeFailureReason = 'invalid_hash' | 'no_candidates' | 'projects_dir_not_found';

/**
 * Decode a Claude Code path-hash directory name to a filesystem path.
 *
 * CORE-02: Decode Claude Code path-hash directory names to filesystem paths and vice versa.
 *
 * Claude Code encodes project paths into directory names by replacing special characters
 * (backslash, forward slash, colon, space, comma, etc.) with a single hyphen each.
 * Consecutive hyphens are NOT collapsed — each special character becomes exactly one hyphen.
 *
 * Decoding strategy: segment-by-segment filesystem-aware reconstruction.
 * Start from known root paths (drive letters on Windows, / on Unix), and validate
 * each candidate segment against the actual filesystem. Bail after 20 candidates
 * to prevent combinatorial explosion.
 *
 * Example:
 *   Encoded: "C-Users-rlasalle-Projects-localground"
 *   Decoded: "C:\\Users\\rlasalle\\Projects\\localground" (Windows)
 */
export async function decode(
  hashDirName: string,
): Promise<Result<PathHashEntry, DecodeFailureReason>> {
  if (!hashDirName || hashDirName.trim().length === 0) {
    return {
      success: false,
      reason: 'invalid_hash',
      detail: 'Empty path-hash directory name',
    };
  }

  const segments = hashDirName.split('-');
  if (segments.length < 2) {
    return {
      success: false,
      reason: 'invalid_hash',
      detail: `Path-hash "${hashDirName}" has fewer than 2 segments — not a valid encoded path`,
    };
  }

  const isWindows = process.platform === 'win32';
  const candidates = await reconstructPath(segments, isWindows);

  if (candidates.length === 0) {
    return {
      success: false,
      reason: 'no_candidates',
      detail: `Could not decode path-hash "${hashDirName}" — no valid filesystem path found`,
    };
  }

  // Return the first (most likely) candidate
  const decodedPath = candidates[0];
  let exists = false;
  try {
    await fs.access(decodedPath);
    exists = true;
  } catch {
    exists = false;
  }

  return {
    success: true,
    data: {
      hashDirName,
      decodedPath,
      exists,
    },
  };
}

/**
 * Encode a filesystem path to a Claude Code path-hash directory name.
 * Each special character (\\, /, :, space, comma, etc.) becomes a single hyphen.
 * Consecutive hyphens are NOT collapsed.
 */
export function encode(filePath: string): string {
  // Replace each special character with a single hyphen
  return filePath.replace(/[\\/: ,().]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Reconstruct a filesystem path from hyphen-separated segments.
 * Uses filesystem-aware validation: each candidate path segment is checked
 * against the actual filesystem to reduce false positives.
 *
 * Limits to 20 candidates to prevent combinatorial explosion.
 */
async function reconstructPath(
  segments: string[],
  isWindows: boolean,
): Promise<string[]> {
  const maxCandidates = 20;
  const candidates: string[] = [];

  if (isWindows) {
    // Windows: first segment is likely a drive letter (e.g., "C")
    const driveLetter = segments[0];
    if (/^[A-Za-z]$/.test(driveLetter)) {
      const root = `${driveLetter.toUpperCase()}:\\`;
      const remainingSegments = segments.slice(1);
      const paths = await buildCandidates(root, remainingSegments, maxCandidates);
      candidates.push(...paths);
    }
  } else {
    // Unix: path starts from root /
    // Segments represent the path components directly
    const root = '/';
    const paths = await buildCandidates(root, segments, maxCandidates);
    candidates.push(...paths);
  }

  return candidates;
}

/**
 * Recursively build path candidates by trying to match segments to filesystem entries.
 *
 * For each segment, we try:
 * 1. Direct match: the segment is a directory name
 * 2. Combined match: this segment + next segment(s) joined by the original separator
 *    (e.g., "OneDrive" + "-" + "ThermoTek" might be "OneDrive - ThermoTek")
 *
 * This handles the ambiguity where a hyphen in the hash could represent
 * a path separator OR a special character within a directory name.
 */
async function buildCandidates(
  currentPath: string,
  remainingSegments: string[],
  maxCandidates: number,
): Promise<string[]> {
  if (remainingSegments.length === 0) {
    return [currentPath];
  }

  const results: string[] = [];

  // Try combining 1 to min(remaining, 5) segments as a single directory name
  // (5 is a practical limit — directory names rarely have more than 4 special chars in sequence)
  const maxCombine = Math.min(remainingSegments.length, 5);

  for (let combineCount = 1; combineCount <= maxCombine; combineCount++) {
    if (results.length >= maxCandidates) break;

    const candidateSegments = remainingSegments.slice(0, combineCount);
    const rest = remainingSegments.slice(combineCount);

    // Try common separators that get encoded as hyphens: space, comma+space, period, hyphen itself
    const separatorsToTry = combineCount === 1 ? [''] : [' ', ', ', '-', '.', ' - '];

    for (const sep of separatorsToTry) {
      if (results.length >= maxCandidates) break;

      const candidateName = candidateSegments.join(sep);
      const candidatePath = path.join(currentPath, candidateName);

      try {
        const stat = await fs.stat(candidatePath);
        if (stat.isDirectory()) {
          const subResults = await buildCandidates(candidatePath, rest, maxCandidates - results.length);
          results.push(...subResults);
        }
      } catch {
        // Path doesn't exist — skip this combination
      }
    }
  }

  return results;
}
