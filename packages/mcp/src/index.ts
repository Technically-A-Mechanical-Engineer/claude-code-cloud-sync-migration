#!/usr/bin/env node
// packages/mcp/src/index.ts
// @localground/mcp — MCP Server (stub — real implementation in Phase 13)
//
// D-03: compilable stub that re-exports core types.
// Proves workspace cross-reference works: @localground/mcp depends on @localground/core.

// Re-export core types for MCP consumers
export type {
  Result,
  EnvironmentInfo,
  CopyData,
  SeedManifest,
  VerifyResult,
  ScanResult,
  GitCheckResult,
  PlaceholderCheckResult,
  ChunkPlan,
} from '@localground/core';

// Placeholder: MCP server setup (Phase 13 replaces this)
const SERVER_NAME = 'localground';
const SERVER_VERSION = '3.0.0';

// Use stderr for logging — stdout is reserved for JSON-RPC transport (CRIT-1)
console.error(`${SERVER_NAME} MCP server v${SERVER_VERSION} — stub (Phase 13 builds the real server)`);
