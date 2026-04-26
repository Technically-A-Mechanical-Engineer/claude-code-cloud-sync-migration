import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { copy } from '@localground/core';

describe('copy', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('copies a directory with 3 files and returns success', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);

    // Create 3 small text files in the source
    for (const name of ['a.txt', 'b.txt', 'c.txt']) {
      await fs.writeFile(path.join(srcDir, name), `content of ${name}`, 'utf8');
    }

    const result = await copy(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      // CRIT-3 invariant: robocopy exit codes 0-7 are all success states
      expect(result.data.exitCode).toBeLessThanOrEqual(7);
      expect(result.data.exitCode).toBeGreaterThanOrEqual(0);
      expect(result.data.source).toBe(srcDir);
      expect(result.data.target).toBe(dstDir);
      expect(['robocopy', 'rsync']).toContain(result.data.tool);
    }

    // Verify destination has files (not just an empty dir from tool creation)
    const dstFiles = await fs.readdir(dstDir);
    expect(dstFiles.length).toBeGreaterThanOrEqual(3);
  });

  // MOD-3 / CRIT-3 invariant: paths with spaces, dashes, and commas must copy successfully.
  // This mirrors real OneDrive folder names like "OneDrive - ThermoTek, Inc".
  it('copies successfully from a source path with spaces, dashes, and commas (OneDrive invariant)', async () => {
    const srcDir = path.join(tmpDir, 'OneDrive - Test, Inc');
    const dstDir = path.join(tmpDir, 'dst-no-spaces');
    await fs.mkdir(srcDir);
    await fs.writeFile(path.join(srcDir, 'file.txt'), 'test content', 'utf8');

    const result = await copy(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exitCode).toBeLessThanOrEqual(7);
    }
  });

  it('refuses to overwrite an existing target directory (target_exists safety)', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);
    await fs.mkdir(dstDir); // Pre-create target to trigger the safety check
    await fs.writeFile(path.join(srcDir, 'file.txt'), 'content', 'utf8');

    const result = await copy(srcDir, dstDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('target_exists');
    }
  });

  it('returns source_not_found when source directory does not exist', async () => {
    const missing = path.join(tmpDir, 'does-not-exist');
    const dstDir = path.join(tmpDir, 'dst');

    const result = await copy(missing, dstDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('source_not_found');
    }
  });

  it('returns source_not_directory when source is a file not a directory', async () => {
    const srcFile = path.join(tmpDir, 'file.txt');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.writeFile(srcFile, 'content', 'utf8');

    const result = await copy(srcFile, dstDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('source_not_directory');
    }
  });
});
