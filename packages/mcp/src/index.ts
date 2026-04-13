#!/usr/bin/env node
// packages/mcp/src/index.ts
// @localground/mcp — MCP Server exposing LocalGround operations as Claude Code tool calls

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { detect, decode, placeholderDetect, detectPlatform, seed } from '@localground/core';
import type { Result } from '@localground/core';
import { z } from 'zod';

// --- Constants ---

const SERVER_NAME = 'localground';
const SERVER_VERSION = '3.0.0';

// --- Server Instance ---

const server = new McpServer(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { logging: {} } },
);

// --- Result-to-MCP Translation ---

/**
 * Translate a core Result<T,R> into a CallToolResult for MCP responses.
 *
 * Success: JSON-serialized data in a text content block.
 * Failure: reason + detail as human-readable text with isError flag.
 *
 * Per D-05: MCP layer does NOT re-implement safety logic. It calls core
 * functions and translates Result types. Stack traces never reach the user.
 */
function resultToMcp<T>(result: Result<T, string>): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  if (result.success) {
    return {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
    };
  }
  return {
    content: [{ type: 'text', text: `${result.reason}: ${result.detail}` }],
    isError: true,
  };
}

// --- Tool Registrations ---

// localground_detect — zero-argument, read-only environment detection
server.registerTool('localground_detect', {
  description:
    'Detect OS, shell, cloud sync status, project inventory, and Claude Code path-hash entries. Returns structured environment JSON.',
  annotations: {
    title: 'Detect Environment',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}, async (_extra) => {
  const result = await detect();
  return resultToMcp(result);
});

// localground_decode_path_hash — decode Claude Code path-hash directory names
server.registerTool('localground_decode_path_hash', {
  description:
    'Decode a Claude Code path-hash directory name (e.g., "C--Users-bob-Projects-myapp") to its original filesystem path. Returns the decoded path and whether the directory exists.',
  inputSchema: {
    hashDirName: z.string().describe('The path-hash directory name from ~/.claude/projects/ (e.g., "C--Users-bob-Projects-myapp")'),
  },
  annotations: {
    title: 'Decode Path Hash',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}, async ({ hashDirName }, _extra) => {
  const result = await decode(hashDirName);
  return resultToMcp(result);
});

// localground_placeholder_check — detect cloud storage placeholder files
server.registerTool('localground_placeholder_check', {
  description:
    'Detect cloud storage placeholder files (Files On-Demand / Smart Sync stubs) in a directory. These are files that appear in the filesystem but have not been downloaded — they will cause copy failures or data loss.',
  inputSchema: {
    dirPath: z.string().describe('Absolute path to the directory to scan for placeholder files'),
  },
  annotations: {
    title: 'Placeholder Check',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}, async ({ dirPath }, _extra) => {
  const platformResult = detectPlatform();
  if (!platformResult.success) {
    return resultToMcp(platformResult);
  }
  const result = await placeholderDetect(dirPath, platformResult.data.platform);
  return resultToMcp(result);
});

// localground_seed — plant verifiable markers before migration
server.registerTool('localground_seed', {
  description:
    'Plant verifiable markers (test file with known checksum + lightweight git tag) in a project directory before migration. Returns a seed manifest that the verify tool checks after migration.',
  inputSchema: {
    projectPath: z.string().describe('Absolute path to the project directory to seed'),
  },
  annotations: {
    title: 'Seed Markers',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
}, async ({ projectPath }, _extra) => {
  const result = await seed(projectPath);
  return resultToMcp(result);
});

// --- Server Startup ---

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} MCP server v${SERVER_VERSION} running on stdio`);
}

main().catch((error: unknown) => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
