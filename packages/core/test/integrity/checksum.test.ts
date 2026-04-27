import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { checksum, checksumString } from '@localground/core';

describe('checksum', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns success with correct SHA-256 hash for known content', async () => {
    const content = 'hello world\n';
    const filePath = path.join(tmpDir, 'sample.txt');
    await fs.writeFile(filePath, content, 'utf8');

    const result = await checksum(filePath);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePath).toBe(filePath);
      expect(result.data.algorithm).toBe('sha256');
      // SHA-256 of 'hello world\n' — verified via Node.js crypto
      expect(result.data.hash).toBe('a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447');
    }
  });

  it('returns file_not_found for a non-existent file', async () => {
    const missing = path.join(tmpDir, 'does-not-exist.txt');
    const result = await checksum(missing);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('file_not_found');
      expect(result.detail).toContain('not found');
    }
  });

  it('returns consistent results across multiple calls on the same file', async () => {
    const filePath = path.join(tmpDir, 'repeat.txt');
    await fs.writeFile(filePath, 'consistent content', 'utf8');

    const result1 = await checksum(filePath);
    const result2 = await checksum(filePath);
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data.hash).toBe(result2.data.hash);
    }
  });

  it('returns different hashes for different file content', async () => {
    const file1 = path.join(tmpDir, 'a.txt');
    const file2 = path.join(tmpDir, 'b.txt');
    await fs.writeFile(file1, 'content one', 'utf8');
    await fs.writeFile(file2, 'content two', 'utf8');

    const result1 = await checksum(file1);
    const result2 = await checksum(file2);
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data.hash).not.toBe(result2.data.hash);
    }
  });
});

describe('checksumString', () => {
  it('returns the same hash as checksum() for identical content', async () => {
    const content = 'hello world\n';
    const tmpDir2 = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
    try {
      const filePath = path.join(tmpDir2, 'match.txt');
      await fs.writeFile(filePath, content, 'utf8');

      const fileResult = await checksum(filePath);
      const stringResult = checksumString(content);

      expect(fileResult.success).toBe(true);
      if (fileResult.success) {
        expect(stringResult).toBe(fileResult.data.hash);
      }
    } finally {
      await fs.rm(tmpDir2, { recursive: true, force: true });
    }
  });

  it('is a synchronous pure function returning a hex string', () => {
    const hash = checksumString('test input');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA-256 hex is always 64 chars
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});
