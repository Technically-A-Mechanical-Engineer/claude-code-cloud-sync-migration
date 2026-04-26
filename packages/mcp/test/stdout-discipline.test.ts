// packages/mcp/test/stdout-discipline.test.ts
// CRIT-1 invariant tests: MCP server must emit ONLY JSON-RPC on stdout.
// Any stray byte on stdout corrupts the Claude Code MCP transport layer.
//
// MIN-3 invariant: startup banner goes to stderr (not stdout).
//
// Spawns dist/index.js directly via process.execPath + array args (never shell mode).

import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, '..', 'dist', 'index.js');

describe('MCP server stdout discipline (CRIT-1)', () => {
  it('produces no stdout output before first JSON-RPC request', async () => {
    const child = spawn(process.execPath, [DIST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    try {
      let stdoutBuffer = '';
      child.stdout!.on('data', (chunk: Buffer) => {
        stdoutBuffer += chunk.toString('utf8');
      });

      // Wait for server startup — any startup logging would appear here
      await new Promise((r) => setTimeout(r, 500));

      expect(stdoutBuffer).toBe('');
    } finally {
      child.kill();
    }
  });

  it('emits startup banner to stderr, not stdout (MIN-3 mitigation)', async () => {
    const child = spawn(process.execPath, [DIST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    try {
      let stderrBuffer = '';
      child.stderr!.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString('utf8');
      });

      // Wait for server startup — banner appears on stderr during startup.
      // Windows Node.js startup can be slow; 2000ms is generous but avoids flakiness.
      await new Promise((r) => setTimeout(r, 2000));

      // 'running on stdio' is the literal from packages/mcp/src/index.ts:831
      // console.error(`${SERVER_NAME} MCP server v${SERVER_VERSION} running on stdio`)
      expect(stderrBuffer).toContain('running on stdio');
    } finally {
      child.kill();
    }
  });
});
