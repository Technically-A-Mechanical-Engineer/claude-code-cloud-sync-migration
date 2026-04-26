import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { gitCheck } from '@localground/core';

describe('gitCheck', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns success for a valid git-initialized directory', async () => {
    // Use spawnSync with array args (never execSync or shell: true — security mandate)
    const initResult = spawnSync('git', ['init'], { cwd: tmpDir, encoding: 'utf8' });
    if (initResult.status !== 0) {
      throw new Error(`git init failed in fixture setup: ${initResult.stderr}`);
    }

    // Create an empty commit so HEAD exists (some git operations require a commit)
    spawnSync(
      'git',
      ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '--allow-empty', '-m', 'init'],
      { cwd: tmpDir, encoding: 'utf8' },
    );

    const result = await gitCheck(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.fsck.passed).toBe('boolean');
      expect(typeof result.data.fsck.output).toBe('string');
      expect(typeof result.data.status.clean).toBe('boolean');
      expect(typeof result.data.branch).toBe('string');
      expect(typeof result.data.commitHash).toBe('string');
      expect(typeof result.data.hasSubmodules).toBe('boolean');
      expect(typeof result.data.dubiousOwnership).toBe('boolean');
    }
  });

  it('returns not_a_git_repo for a directory with no .git folder', async () => {
    // tmpDir is a fresh directory with no git init — should fail
    const result = await gitCheck(tmpDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('not_a_git_repo');
      expect(result.detail).toContain('.git');
    }
  });

  it('returns a clean status for a newly initialized repo with no staged changes', async () => {
    spawnSync('git', ['init'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync(
      'git',
      ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '--allow-empty', '-m', 'init'],
      { cwd: tmpDir, encoding: 'utf8' },
    );

    const result = await gitCheck(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      // An empty repo with one empty commit should have a clean status
      expect(result.data.status.clean).toBe(true);
    }
  });

  it('reports hasSubmodules: false when no .gitmodules file exists', async () => {
    spawnSync('git', ['init'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync(
      'git',
      ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '--allow-empty', '-m', 'init'],
      { cwd: tmpDir, encoding: 'utf8' },
    );

    const result = await gitCheck(tmpDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasSubmodules).toBe(false);
    }
  });
});
