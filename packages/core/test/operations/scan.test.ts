import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { scan } from '@localground/core';

describe('scan', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns success with zero matches for a clean fixture directory', async () => {
    // A freshly-mkdtemp'd directory has no cloud path references
    await fs.writeFile(path.join(tmpDir, 'readme.txt'), 'local path content only', 'utf8');

    const result = await scan(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.matchCount).toBe(0);
      expect(result.data.matches).toHaveLength(0);
    }
  });

  it('detects OneDrive path references in a markdown file', async () => {
    // Write a CLAUDE.md file with a cloud path reference that scan() looks for
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    await fs.writeFile(claudeMd, 'Projects: C:\\Users\\bob\\OneDrive - Corp\\Projects', 'utf8');

    const result = await scan(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.matchCount).toBeGreaterThanOrEqual(1);
      const match = result.data.matches[0];
      expect(match.file).toContain('CLAUDE.md');
      expect(match.cloudPath).toBeTruthy();
    }
  });

  it('returns dir_not_found for a non-existent directory', async () => {
    const missing = path.join(tmpDir, 'does-not-exist');
    const result = await scan(missing);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('dir_not_found');
    }
  });

  it('returns structured result with filesScanned count', async () => {
    await fs.writeFile(path.join(tmpDir, 'readme.md'), 'some content', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'notes.txt'), 'other content', 'utf8');

    const result = await scan(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.filesScanned).toBe('number');
      expect(result.data.filesScanned).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.data.matches)).toBe(true);
    }
  });

  it('skips node_modules and .git directories', async () => {
    // Create a node_modules dir with a file containing a cloud path reference
    const nodeModulesDir = path.join(tmpDir, 'node_modules');
    await fs.mkdir(nodeModulesDir);
    await fs.writeFile(
      path.join(nodeModulesDir, 'package.json'),
      '{"path": "C:\\\\Users\\\\bob\\\\OneDrive - Corp\\\\node_modules"}',
      'utf8',
    );

    // Also create a .git dir with a config containing cloud paths
    const gitDir = path.join(tmpDir, '.git');
    await fs.mkdir(gitDir);
    await fs.writeFile(
      path.join(gitDir, 'config'),
      '[core]\n\tworktree = C:\\Users\\bob\\OneDrive - Corp\\Projects',
      'utf8',
    );

    // The scan should not report matches from skipped directories
    const result = await scan(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      for (const match of result.data.matches) {
        expect(match.file).not.toMatch(/node_modules/);
        expect(match.file).not.toMatch(/\.git/);
      }
    }
  });
});
