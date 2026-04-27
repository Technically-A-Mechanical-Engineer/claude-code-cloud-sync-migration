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

  it('every stdout line after a JSON-RPC request is valid JSON-RPC 2.0 (CRIT-1 full coverage)', async () => {
    const child = spawn(process.execPath, [DIST_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    try {
      // Single listener collects all lines AND resolves per-id waiters — avoids race conditions
      // from adding/removing separate listeners during the sequence.
      const allLines: string[] = [];
      const resolvers = new Map<number, (frame: unknown) => void>();
      let buffer = '';

      child.stdout!.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          allLines.push(line);
          try {
            const frame = JSON.parse(line) as { id?: unknown };
            if (typeof frame.id === 'number' && resolvers.has(frame.id)) {
              resolvers.get(frame.id)!(frame);
              resolvers.delete(frame.id);
            }
          } catch {
            // Non-JSON lines are caught by the final assertion loop below
          }
        }
      });

      function writeFrame(request: object): void {
        child.stdin!.write(JSON.stringify(request) + '\n');
      }

      function waitFor(id: number, timeoutMs = 15000): Promise<unknown> {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`No response for id=${id} within ${timeoutMs}ms`)),
            timeoutMs,
          );
          resolvers.set(id, (frame) => {
            clearTimeout(timer);
            resolve(frame);
          });
        });
      }

      // Step 1: initialize handshake
      writeFrame({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'discipline-test', version: '1.0' },
        },
      });
      await waitFor(1);

      // Step 2: send initialized notification (no id, no response expected)
      writeFrame({ jsonrpc: '2.0', method: 'notifications/initialized' });

      // Step 3: send tools/list to exercise request-handling path
      writeFrame({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
      await waitFor(2);

      // Step 4: every stdout line collected must parse as valid JSON-RPC 2.0
      expect(allLines.length).toBeGreaterThan(0); // at minimum initialize + tools/list responses
      for (const line of allLines) {
        let frame: Record<string, unknown>;
        expect(() => { frame = JSON.parse(line) as Record<string, unknown>; }, `Line is not valid JSON: ${line}`).not.toThrow();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        frame = JSON.parse(line) as Record<string, unknown>;
        expect(frame, `Missing jsonrpc field on line: ${line}`).toHaveProperty('jsonrpc', '2.0');
        expect(frame, `Missing id field on line: ${line}`).toHaveProperty('id');
        const hasResult = 'result' in frame;
        const hasError = 'error' in frame;
        expect(hasResult || hasError, `Line has neither result nor error: ${line}`).toBe(true);
      }
    } finally {
      child.kill();
    }
  });
});
