// packages/core/src/integrity/git.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, GitCheckResult } from '../types.js';
import { spawnTool } from '../util/spawn.js';

type GitCheckFailureReason = 'not_a_git_repo' | 'git_not_found' | 'check_error';

/**
 * Run git integrity checks on a project directory.
 *
 * CORE-07: Run git integrity checks (fsck, status, branch listing) via child_process.
 *
 * Checks performed:
 * 1. git fsck --no-dangling — object integrity check
 * 2. git status --short — working tree cleanliness
 * 3. git branch --show-current — current branch name
 * 4. git rev-parse HEAD — current commit hash
 * 5. .gitmodules existence — submodule detection
 * 6. dubious ownership check — safe.directory warning detection
 *
 * Read-only: all git commands are read-only (no modifications to the repo).
 */
export async function gitCheck(
  projectPath: string,
): Promise<Result<GitCheckResult, GitCheckFailureReason>> {
  // Verify .git directory exists
  const gitDir = path.join(projectPath, '.git');
  try {
    await fs.access(gitDir);
  } catch {
    return {
      success: false,
      reason: 'not_a_git_repo',
      detail: `No .git directory found in: ${projectPath}`,
    };
  }

  // Verify git is available
  const gitVersion = spawnTool('git', ['--version'], { cwd: projectPath });
  if (!gitVersion.success) {
    return {
      success: false,
      reason: 'git_not_found',
      detail: 'git is not installed or not on PATH',
    };
  }

  // 1. git fsck --no-dangling
  const fsckResult = spawnTool('git', ['fsck', '--no-dangling'], { cwd: projectPath });
  const fsckPassed = fsckResult.success && fsckResult.data.exitCode === 0;
  const fsckOutput = fsckResult.success
    ? (fsckResult.data.stderr || fsckResult.data.stdout || 'No issues found')
    : fsckResult.detail;

  // 2. git status --short
  const statusResult = spawnTool('git', ['status', '--short'], { cwd: projectPath });
  const statusClean = statusResult.success && statusResult.data.exitCode === 0 && statusResult.data.stdout.trim() === '';
  const statusOutput = statusResult.success
    ? (statusResult.data.stdout || 'Working tree clean')
    : statusResult.detail;

  // 3. git branch --show-current
  const branchResult = spawnTool('git', ['branch', '--show-current'], { cwd: projectPath });
  const branch = branchResult.success
    ? branchResult.data.stdout.trim()
    : 'unknown';

  // 4. git rev-parse HEAD
  const headResult = spawnTool('git', ['rev-parse', 'HEAD'], { cwd: projectPath });
  const commitHash = headResult.success
    ? headResult.data.stdout.trim()
    : 'unknown';

  // 5. Submodule detection
  const gitmodulesPath = path.join(projectPath, '.gitmodules');
  let hasSubmodules = false;
  try {
    await fs.access(gitmodulesPath);
    hasSubmodules = true;
  } catch {
    hasSubmodules = false;
  }

  // 6. Dubious ownership detection
  // git operations in directories owned by another user produce "dubious ownership" warnings
  const dubiousOwnership = fsckResult.success
    ? fsckResult.data.stderr.includes('dubious ownership')
    : false;

  return {
    success: true,
    data: {
      fsck: { passed: fsckPassed, output: fsckOutput },
      status: { clean: statusClean, output: statusOutput },
      branch,
      commitHash,
      hasSubmodules,
      dubiousOwnership,
    },
  };
}
