#!/usr/bin/env node
// packages/cli/src/index.ts
// @localground/cli — Standalone CLI (stub — real implementation in Phase 14)
//
// D-03: compilable stub that re-exports core types.
// Proves workspace cross-reference works: @localground/cli depends on @localground/core.

// Re-export core types for CLI consumers
export type {
  Result,
  EnvironmentInfo,
  CopyData,
  SeedManifest,
  VerifyResult,
  ScanResult,
} from '@localground/core';

// Placeholder: CLI entry point (Phase 14 replaces this with Commander.js)
const CLI_VERSION = '3.0.0';

console.error(`localground CLI v${CLI_VERSION} — stub (Phase 14 builds the real CLI)`);
console.error('Usage: localground <command> [options]');
console.error('Commands: detect, seed, copy, verify, reap, audit, cleanup-scan');
