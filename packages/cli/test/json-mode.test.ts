// packages/cli/test/json-mode.test.ts
// JSON-mode invariant tests:
//   D-02: --json flag works both before and after subcommand (Phase 14 D-02 confirmed by Commander v13)
//   Phase 14-11: status lines route to stderr, gated on !jsonMode — suppressed in --json mode
//
// Spawns dist/index.js via process.execPath + array args (never shell mode, never execSync).

import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, '..', 'dist', 'index.js');

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], opts: { cwd?: string } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [DIST_PATH, ...args], {
      cwd: opts.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout!.on('data', (c: Buffer) => { stdout += c.toString('utf8'); });
    child.stderr!.on('data', (c: Buffer) => { stderr += c.toString('utf8'); });

    let settled = false;
    const watchdog = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error(`CLI run timeout for args: ${args.join(' ')}`));
      }
    }, 25000);

    child.on('close', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(watchdog);
        resolve({ exitCode: code ?? -1, stdout, stderr });
      }
    });

    child.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(watchdog);
        reject(err);
      }
    });
  });
}

describe('CLI JSON-mode invariants (D-02 + Phase 14-11)', () => {
  it('--json flag before subcommand produces parseable JSON (D-02 invariant)', async () => {
    const result = await runCli(['--json', 'detect']);
    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    const parsed = JSON.parse(result.stdout) as { platform?: unknown };
    expect(parsed).toHaveProperty('platform');
  });

  it('--json flag after subcommand produces parseable JSON (D-02 invariant)', async () => {
    const result = await runCli(['detect', '--json']);
    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    const parsed = JSON.parse(result.stdout) as { platform?: unknown };
    expect(parsed).toHaveProperty('platform');
  });

  it('--json before and --json after subcommand produce identical output (D-02 invariant)', async () => {
    const [before, after] = await Promise.all([
      runCli(['--json', 'detect']),
      runCli(['detect', '--json']),
    ]);
    expect(before.exitCode).toBe(0);
    expect(after.exitCode).toBe(0);
    // Both should be parseable JSON (exact values may differ on re-run due to timestamp; compare keys)
    const parsedBefore = JSON.parse(before.stdout) as Record<string, unknown>;
    const parsedAfter = JSON.parse(after.stdout) as Record<string, unknown>;
    expect(Object.keys(parsedBefore).sort()).toEqual(Object.keys(parsedAfter).sort());
  });

  it('audit --json suppresses status lines on stderr (Phase 14-11 invariant)', async () => {
    // Use --projects with the current working repo to avoid auto-discovery hanging
    // on cloud-synced paths in the developer environment. The stderr suppression
    // invariant applies regardless of which projects are audited.
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-audit-test-'));
    try {
      const { spawnSync } = await import('node:child_process');
      spawnSync('git', ['init'], { cwd: tmpDir, encoding: 'utf8' });
      spawnSync(
        'git',
        ['-c', 'user.email=test@test.com', '-c', 'user.name=Test', 'commit', '--allow-empty', '-m', 'init'],
        { cwd: tmpDir, encoding: 'utf8' },
      );

      const result = await runCli(['audit', '--projects', tmpDir, '--json']);
      // In JSON mode, the "Auditing N project(s)..." banner must NOT appear on stderr
      // (gated on !jsonMode per packages/cli/src/index.ts:535-537)
      expect(result.stderr).not.toContain('Auditing');
      // The per-project "[i/N] path" progress lines must also be absent
      expect(result.stderr).not.toMatch(/\[\d+\/\d+\]/);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('copy --json suppresses Copying status lines on stderr (Phase 14-11 invariant)', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localground-jsonmode-test-'));
    try {
      // Use a nonexistent source — we just need to confirm that even on the error path,
      // the "Copying from..." status block is suppressed in JSON mode
      // (the block is gated on !jsonMode before the copy() call)
      const src = path.join(tmpDir, 'nonexistent-src');
      const dst = path.join(tmpDir, 'dst');
      const result = await runCli(['copy', src, dst, '--json']);
      // Status lines "Copying from ..." are suppressed in JSON mode regardless of success/failure
      expect(result.stderr).not.toMatch(/Copying from/);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
