import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { compare } from '@localground/core';

describe('compare', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns matching counts for two identical fixture directories', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);
    await fs.mkdir(dstDir);

    // Write identical content to both directories
    for (const name of ['a.txt', 'b.txt', 'c.txt']) {
      const content = `content of ${name}`;
      await fs.writeFile(path.join(srcDir, name), content, 'utf8');
      await fs.writeFile(path.join(dstDir, name), content, 'utf8');
    }

    const result = await compare(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source.fileCount).toBe(3);
      expect(result.data.target.fileCount).toBe(3);
      expect(result.data.fileCountMatch).toBe(true);
      expect(result.data.sizeMatch).toBe(true);
    }
  });

  it('detects file count mismatch when target has fewer files', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);
    await fs.mkdir(dstDir);

    await fs.writeFile(path.join(srcDir, 'a.txt'), 'a', 'utf8');
    await fs.writeFile(path.join(srcDir, 'b.txt'), 'b', 'utf8');
    await fs.writeFile(path.join(dstDir, 'a.txt'), 'a', 'utf8');
    // b.txt intentionally omitted from dst

    const result = await compare(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileCountMatch).toBe(false);
      expect(result.data.source.fileCount).toBe(2);
      expect(result.data.target.fileCount).toBe(1);
    }
  });

  it('returns source_not_found for a missing source directory', async () => {
    const missing = path.join(tmpDir, 'does-not-exist');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(dstDir);

    const result = await compare(missing, dstDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('source_not_found');
    }
  });

  it('returns target_not_found for a missing target directory', async () => {
    const srcDir = path.join(tmpDir, 'src');
    await fs.mkdir(srcDir);
    const missing = path.join(tmpDir, 'does-not-exist');

    const result = await compare(srcDir, missing);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('target_not_found');
    }
  });

  it('includes source and target paths in successful result', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);
    await fs.mkdir(dstDir);

    const result = await compare(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source.path).toBe(srcDir);
      expect(result.data.target.path).toBe(dstDir);
    }
  });
});
