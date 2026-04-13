// packages/core/src/operations/verify.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, SeedManifest, VerifyResult, VerifyMarkerResult, SeedMarker } from '../types.js';
import { checksum } from '../integrity/checksum.js';
import { spawnTool } from '../util/spawn.js';

type VerifyFailureReason = 'manifest_not_found' | 'manifest_parse_error' | 'verify_error';

const SEED_MANIFEST_FILE_NAME = '.localground-seed-manifest.json';

/**
 * Verify seed markers against the manifest.
 *
 * CORE-10: Verify seed markers against manifest (checksum match, git tag presence, commit hash match).
 *
 * Reads the manifest file, then verifies each marker:
 * - test-file: computes SHA-256 and compares to manifest checksum
 * - git-tag: checks tag exists via `git tag -l` and commit hash via `git rev-parse`
 *
 * Read-only: this function never modifies the filesystem.
 */
export async function verify(
  projectPath: string,
  manifestPath?: string,
): Promise<Result<VerifyResult, VerifyFailureReason>> {
  // Locate manifest
  const actualManifestPath = manifestPath ?? path.join(projectPath, SEED_MANIFEST_FILE_NAME);

  // Read manifest
  let manifestContent: string;
  try {
    manifestContent = await fs.readFile(actualManifestPath, 'utf8');
  } catch {
    return {
      success: false,
      reason: 'manifest_not_found',
      detail: `Seed manifest not found: ${actualManifestPath}`,
    };
  }

  // Parse manifest
  let manifest: SeedManifest;
  try {
    manifest = JSON.parse(manifestContent) as SeedManifest;
  } catch (err: unknown) {
    return {
      success: false,
      reason: 'manifest_parse_error',
      detail: `Failed to parse manifest: ${(err as Error).message}`,
    };
  }

  // Verify each marker
  const results: VerifyMarkerResult[] = [];
  for (const marker of manifest.markers) {
    const markerResult = await verifyMarker(marker, projectPath);
    results.push(markerResult);
  }

  const allPassed = results.every((r) => r.passed);

  return {
    success: true,
    data: {
      manifestPath: actualManifestPath,
      allPassed,
      results,
    },
  };
}

/**
 * Verify a single seed marker.
 */
async function verifyMarker(
  marker: SeedMarker,
  projectPath: string,
): Promise<VerifyMarkerResult> {
  if (marker.type === 'test-file') {
    return verifyTestFile(marker);
  }
  if (marker.type === 'git-tag') {
    return verifyGitTag(marker, projectPath);
  }
  return {
    marker,
    passed: false,
    detail: `Unknown marker type: ${marker.type}`,
  };
}

/**
 * Verify test file marker: compute checksum and compare to expected.
 */
async function verifyTestFile(marker: SeedMarker): Promise<VerifyMarkerResult> {
  if (!marker.path || !marker.checksum) {
    return { marker, passed: false, detail: 'Marker missing path or checksum fields' };
  }

  const checksumResult = await checksum(marker.path);
  if (!checksumResult.success) {
    return { marker, passed: false, detail: `Checksum failed: ${checksumResult.detail}` };
  }

  const match = checksumResult.data.hash === marker.checksum;
  return {
    marker,
    passed: match,
    detail: match
      ? `Checksum matches: ${marker.checksum}`
      : `Checksum mismatch. Expected: ${marker.checksum}, Got: ${checksumResult.data.hash}`,
  };
}

/**
 * Verify git tag marker: check tag exists and commit hash matches.
 */
async function verifyGitTag(
  marker: SeedMarker,
  projectPath: string,
): Promise<VerifyMarkerResult> {
  if (!marker.tag) {
    return { marker, passed: false, detail: 'Marker missing tag field' };
  }

  // Check tag exists
  const tagList = spawnTool('git', ['tag', '-l', marker.tag], { cwd: projectPath });
  if (!tagList.success) {
    return { marker, passed: false, detail: `Failed to list git tags: ${tagList.detail}` };
  }

  const tagExists = tagList.data.stdout.trim() === marker.tag;
  if (!tagExists) {
    return { marker, passed: false, detail: `Git tag not found: ${marker.tag}` };
  }

  // If commit hash was recorded, verify it matches
  if (marker.commitHash && marker.commitHash !== 'unknown') {
    const revParse = spawnTool('git', ['rev-parse', marker.tag], { cwd: projectPath });
    if (revParse.success) {
      const actualHash = revParse.data.stdout.trim();
      if (actualHash !== marker.commitHash) {
        return {
          marker,
          passed: false,
          detail: `Git tag commit mismatch. Expected: ${marker.commitHash}, Got: ${actualHash}`,
        };
      }
    }
  }

  return {
    marker,
    passed: true,
    detail: `Git tag "${marker.tag}" found and verified`,
  };
}
