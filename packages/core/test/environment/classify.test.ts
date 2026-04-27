import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { classify } from '@localground/core';
import type { PathHashEntry } from '@localground/core';

describe('classify', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('classifies as undecodable when decodedPath is null', async () => {
    const entry: PathHashEntry = {
      hashDirName: 'some-hash',
      decodedPath: null,
      exists: false,
    };
    const result = await classify(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.classification).toBe('undecodable');
    }
  });

  it('classifies as stale when decoded path does not exist on disk', async () => {
    const entry: PathHashEntry = {
      hashDirName: 'some-hash',
      decodedPath: path.join(tmpDir, 'definitely-does-not-exist'),
      exists: true,
    };
    const result = await classify(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.classification).toBe('stale');
    }
  });

  it('classifies as orphan when decoded path exists but hash directory does not', async () => {
    // tmpDir itself exists (the decoded path is real), but exists: false means
    // the path-hash directory itself doesn't exist (unusual state)
    const entry: PathHashEntry = {
      hashDirName: 'some-hash',
      decodedPath: tmpDir,
      exists: false,
    };
    const result = await classify(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.classification).toBe('orphan');
    }
  });

  it('classifies as valid when both decoded path and hash directory exist', async () => {
    // tmpDir exists (decoded path is real), exists: true means hash dir also exists
    const entry: PathHashEntry = {
      hashDirName: 'some-hash',
      decodedPath: tmpDir,
      exists: true,
    };
    const result = await classify(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.classification).toBe('valid');
    }
  });

  it('passes through all PathHashEntry fields into the classified result', async () => {
    const entry: PathHashEntry = {
      hashDirName: 'my-hash-dir',
      decodedPath: tmpDir,
      exists: true,
    };
    const result = await classify(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hashDirName).toBe('my-hash-dir');
      expect(result.data.decodedPath).toBe(tmpDir);
      expect(result.data.exists).toBe(true);
    }
  });
});
