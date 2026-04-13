// packages/core/src/environment/classify.ts

import fs from 'node:fs/promises';
import type {
  Result, PathHashEntry, PathHashClassification, ClassifiedPathHash,
} from '../types.js';

type ClassifyFailureReason = 'decode_failed';

/**
 * Classify a path-hash entry into one of four states.
 *
 * CORE-03: Classify path-hash entries (valid, stale, orphan, undecodable).
 *
 * Classification rules:
 * - valid:       decoded path exists, path-hash directory has content
 * - stale:       decoded path does NOT exist (project moved/deleted), path-hash directory remains
 * - orphan:      path-hash directory exists but has no CLAUDE.md or meaningful content
 * - undecodable: path-hash could not be decoded to any filesystem path
 */
export async function classify(
  entry: PathHashEntry,
): Promise<Result<ClassifiedPathHash, ClassifyFailureReason>> {
  // If decoding failed (decodedPath is null), it's undecodable
  if (entry.decodedPath === null) {
    return {
      success: true,
      data: {
        ...entry,
        classification: 'undecodable',
      },
    };
  }

  // Check if the decoded path still exists on the filesystem
  let pathExists = false;
  try {
    await fs.access(entry.decodedPath);
    pathExists = true;
  } catch {
    pathExists = false;
  }

  if (!pathExists) {
    // The project the path-hash pointed to no longer exists
    return {
      success: true,
      data: {
        ...entry,
        classification: 'stale',
      },
    };
  }

  // Path exists — check if the path-hash directory has meaningful content
  // A valid path-hash directory typically contains CLAUDE.md or other config
  // An orphan has the directory but no meaningful content
  if (!entry.exists) {
    // The path-hash directory itself doesn't exist (unusual state)
    return {
      success: true,
      data: {
        ...entry,
        classification: 'orphan',
      },
    };
  }

  // Both path and hash directory exist — this is a valid entry
  return {
    success: true,
    data: {
      ...entry,
      classification: 'valid',
    },
  };
}
