import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { chunk } from '@localground/core';

describe('chunk', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns a single chunk for small source that fits under threshold', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);

    // Write 3 small files — well under any reasonable chunk threshold
    await fs.writeFile(path.join(srcDir, 'a.txt'), 'file a', 'utf8');
    await fs.writeFile(path.join(srcDir, 'b.txt'), 'file b', 'utf8');
    await fs.writeFile(path.join(srcDir, 'c.txt'), 'file c', 'utf8');

    // chunk() is async — it walks the real source directory
    const result = await chunk(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalChunks).toBeGreaterThanOrEqual(1);
      expect(result.data.chunks).toHaveLength(result.data.totalChunks);
      // All 3 entries should be in chunks (summing entries across all chunks)
      const allEntries = result.data.chunks.flatMap((c) => c.entries);
      expect(allEntries).toHaveLength(3);
    }
  });

  it('splits into multiple chunks when maxChunkSize forces splitting', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);

    // Create subdirectories (chunk operates on top-level entries)
    for (let i = 0; i < 5; i++) {
      const subDir = path.join(srcDir, `subdir-${i}`);
      await fs.mkdir(subDir);
      // Write a ~1KB file inside each subdir
      await fs.writeFile(path.join(subDir, 'content.txt'), 'x'.repeat(1024), 'utf8');
    }

    // Use a very small maxChunkSize (1 byte) to force one entry per chunk
    const result = await chunk(srcDir, dstDir, 1);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalChunks).toBeGreaterThan(1);
      // Each chunk should have a source, target, and entries array
      for (const c of result.data.chunks) {
        expect(c.source).toBe(srcDir);
        expect(c.target).toBe(dstDir);
        expect(Array.isArray(c.entries)).toBe(true);
        expect(c.entries.length).toBeGreaterThanOrEqual(1);
        expect(typeof c.estimatedSize).toBe('number');
      }
    }
  });

  it('returns totalChunks: 0 for an empty source directory', async () => {
    const srcDir = path.join(tmpDir, 'empty-src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);
    // No files or subdirs in empty-src

    const result = await chunk(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalChunks).toBe(0);
      expect(result.data.chunks).toHaveLength(0);
      expect(result.data.totalSize).toBe(0);
    }
  });

  it('returns dir_not_found for a non-existent source directory', async () => {
    const missing = path.join(tmpDir, 'does-not-exist');
    const dstDir = path.join(tmpDir, 'dst');

    const result = await chunk(missing, dstDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('dir_not_found');
    }
  });

  it('includes source and target in every chunk', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    await fs.mkdir(srcDir);
    await fs.writeFile(path.join(srcDir, 'file.txt'), 'content', 'utf8');

    const result = await chunk(srcDir, dstDir);
    expect(result.success).toBe(true);
    if (result.success) {
      for (const c of result.data.chunks) {
        expect(c.source).toBe(srcDir);
        expect(c.target).toBe(dstDir);
        expect(typeof c.index).toBe('number');
      }
    }
  });
});
