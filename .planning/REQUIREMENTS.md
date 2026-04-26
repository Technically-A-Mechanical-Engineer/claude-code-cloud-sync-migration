# Requirements: LocalGround Toolkit v3.0.0

**Defined:** 2026-04-12
**Core Value:** Get Claude Code users off cloud-synced storage safely — no data loss, no silent failures, every action verified before and after.

## v3.0.0 Requirements

Requirements for the MCP server + CLI restructure. Each maps to roadmap phases.

### Core Library

- [ ] **CORE-01**: Detect OS, shell type, and cloud service from filesystem paths (OneDrive, Dropbox, Google Drive, iCloud)
- [x] **CORE-02**: Decode Claude Code path-hash directory names to filesystem paths and vice versa
- [ ] **CORE-03**: Classify path-hash entries (valid, stale, orphan, undecodable)
- [ ] **CORE-04**: Compute SHA-256 checksums using Node.js crypto (no shell dependency)
- [ ] **CORE-05**: Compare source and target directories (file counts, total size, hidden directories)
- [ ] **CORE-06**: Detect Files On-Demand / Smart Sync placeholder files per platform
- [ ] **CORE-07**: Run git integrity checks (fsck, status, branch listing) via child_process
- [ ] **CORE-08**: Copy directories via robocopy (Windows) or rsync (macOS/Linux) with exit code handling (robocopy 1-7 = success)
- [ ] **CORE-09**: Plant seed markers (test file with hardcoded checksum, lightweight git tag, JSON manifest)
- [ ] **CORE-10**: Verify seed markers against manifest (checksum match, git tag presence, commit hash match)
- [ ] **CORE-11**: Scan for stale cloud storage path references in project files (CLAUDE.md, memory files, settings)
- [ ] **CORE-12**: Chunk large copy operations to complete within MCP timeout constraints (~60 seconds per tool call)

### MCP Server

- [x] **MCP-01**: Register MCP server with stdio transport using @modelcontextprotocol/sdk v1.x
- [x] **MCP-02**: Expose `localground_detect` tool — returns structured environment JSON (OS, shell, cloud service, projects, path-hashes)
- [x] **MCP-03**: Expose `localground_decode_path_hash` tool — converts path-hash names to filesystem paths
- [x] **MCP-04**: Expose `localground_seed` tool — plants verifiable markers, returns manifest JSON
- [x] **MCP-05**: Expose `localground_copy` tool — copies one project directory with chunked operation and verification
- [x] **MCP-06**: Expose `localground_verify` tool — reads manifest, verifies each marker, returns per-marker results
- [x] **MCP-07**: Expose `localground_health_check` tool — runs six health checks on one project, returns PASS/WARN/FAIL per check
- [x] **MCP-08**: Expose `localground_audit` tool — environment-wide read-only audit, returns structured findings with traffic-light scoring
- [x] **MCP-09**: Expose `localground_cleanup_scan` tool — read-only scan identifying stale/orphan/source candidates without deleting
- [x] **MCP-10**: Expose `localground_placeholder_check` tool — detects cloud placeholder files in a directory
- [x] **MCP-11**: Apply tool annotations (readOnlyHint, destructiveHint, idempotentHint) to every tool
- [x] **MCP-12**: Return structured error responses (isError: true) with actionable messages on all failures
- [x] **MCP-13**: Send progress notifications during long-running operations (copy, audit)
- [x] **MCP-14**: Route all logging to stderr — zero stdout pollution (stdout is the JSON-RPC transport)

### Standalone CLI

- [x] **CLI-01**: Expose all core operations as CLI commands via Commander.js (`detect`, `seed`, `copy`, `verify`, `reap`, `audit`, `cleanup-scan`)
- [x] **CLI-02**: Distribute via npx — `npx @localground/cli <command>` works with zero pre-installation
- [x] **CLI-03**: Support `--json` flag on all commands for machine-readable output
- [x] **CLI-04**: Human-readable formatted output by default (colored, structured)

### Claude Code Skills

- [x] **SKILL-01**: `/localground:seed` skill — calls MCP seed tool, presents results, guides to migration
- [x] **SKILL-02**: `/localground:migrate` skill — orchestrates detect → copy → verify flow with confirmation gates per folder
- [x] **SKILL-03**: `/localground:reap` skill — calls MCP verify + health_check tools, generates natural language report
- [x] **SKILL-04**: `/localground:cleanup` skill — calls cleanup_scan, presents findings, collects per-item confirmation, executes deletions
- [x] **SKILL-05**: `/localground:verify` skill — calls audit tool, generates traffic-light report with recommendations
- [x] **SKILL-06**: All skills use `allowed-tools` frontmatter to pre-approve MCP tool calls
- [x] **SKILL-07**: Migration skill handles two-session design — writes machine-readable state file for Session 2

### Infrastructure

- [ ] **INFRA-01**: Monorepo scaffold with npm workspaces (packages/core, packages/mcp, packages/cli)
- [ ] **INFRA-02**: TypeScript strict mode with tsup build for all packages
- [x] **INFRA-03**: Automated test suite (Vitest) covering core library deterministic operations
- [x] **INFRA-04**: GitHub Actions CI running tests on Windows and macOS runners
- [x] **INFRA-05**: npm publishing pipeline for @localground/mcp and @localground/cli packages
- [x] **INFRA-06**: v2.0.0 prompts preserved in prompts/ directory as no-install fallback

### Documentation

- [x] **DOC-01**: README with installation paths (MCP add, CLI install, legacy prompts) including Windows `cmd /c` setup
- [x] **DOC-02**: CLAUDE.md updated for v3.0.0 architecture

## Future Requirements

Deferred to post-v3.0.0. Tracked but not in current roadmap.

### Enhanced Features

- **FUT-01**: Multi-project batch operations (`seed --all`, `verify --all`)
- **FUT-02**: MCP resource exposing migration state per project (`localground://project/{path}/state`)
- **FUT-03**: MCP prompt templates for common workflows
- **FUT-04**: Plugin marketplace submission
- **FUT-05**: Session 2 prompt generation in code (replaces natural language generation)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Remote/cloud MCP server | LocalGround operates on local filesystem. Stdio transport is correct. |
| Persistent background daemon | Claude Code manages MCP lifecycle. No daemon needed. |
| GUI or TUI | Claude Code is the UI layer. CLI outputs structured data. |
| Auto-deletion in MCP tools | Safety model: scan tool returns candidates, skill collects confirmation, then executes. |
| Cross-platform shell emulation | Platform-specific tools (robocopy/rsync) are more reliable than abstractions. |
| Cloud sync pause/resume automation | Undocumented, version-dependent, service-specific. Same exclusion as v2.0.0. |
| Configuration file (.localgroundrc) | Fixed safety model should not be configurable. CLI flags for one-time options. |
| Monorepo tooling beyond npm workspaces | Three packages with simple deps. Turborepo/Lerna/Nx are overkill. |
| MCP SDK v2 migration | Build on stable v1.x. Upgrade when v2 stabilizes — migration will be mechanical. |
| Webpack/Rollup bundling | Node.js tools via npm. tsup handles compilation. No bundler needed. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 12 | Pending |
| INFRA-02 | Phase 12 | Pending |
| CORE-01 | Phase 12 | Pending |
| CORE-02 | Phase 12; Phase 14 (14-08 decoder rewrite for mixed-punctuation paths) | Complete (2026-04-26) |
| CORE-03 | Phase 12 | Pending |
| CORE-04 | Phase 12 | Pending |
| CORE-05 | Phase 12 | Pending |
| CORE-06 | Phase 12 | Pending |
| CORE-07 | Phase 12 | Pending |
| CORE-08 | Phase 12 | Pending |
| CORE-09 | Phase 12 | Pending |
| CORE-10 | Phase 12 | Pending |
| CORE-11 | Phase 12 | Pending |
| CORE-12 | Phase 12 | Pending |
| MCP-01 | Phase 13; Phase 14 (14-09 detect surface decode-and-enrich wiring) | Complete (2026-04-26) |
| MCP-02 | Phase 13 | Complete |
| MCP-03 | Phase 13 | Complete |
| MCP-04 | Phase 13 | Complete |
| MCP-05 | Phase 13 | Complete |
| MCP-06 | Phase 13 | Complete |
| MCP-07 | Phase 13 | Complete |
| MCP-08 | Phase 13 | Complete |
| MCP-09 | Phase 13 | Complete |
| MCP-10 | Phase 13 | Complete |
| MCP-11 | Phase 13 | Complete |
| MCP-12 | Phase 13 | Complete |
| MCP-13 | Phase 13 | Complete |
| MCP-14 | Phase 13 | Complete |
| CLI-01 | Phase 14; Phase 14 (14-09 detect surface decode-and-enrich wiring); Phase 14 (14-11 silent long operations TIER 1 status lines) | Complete (2026-04-26) |
| CLI-02 | Phase 14 | Complete |
| CLI-03 | Phase 14 | Complete |
| CLI-04 | Phase 14 | Complete |
| SKILL-01 | Phase 14 | Complete |
| SKILL-02 | Phase 14 | Complete |
| SKILL-03 | Phase 14 | Complete |
| SKILL-04 | Phase 14 | Complete |
| SKILL-05 | Phase 14 | Complete |
| SKILL-06 | Phase 14 | Complete |
| SKILL-07 | Phase 14 | Complete |
| INFRA-03 | Phase 15 | Complete |
| INFRA-04 | Phase 15 | Complete (2026-04-26) |
| INFRA-05 | Phase 15 | Complete (2026-04-26) |
| INFRA-06 | Phase 15 | Complete |
| DOC-01 | Phase 15 | Complete |
| DOC-02 | Phase 15 | Complete |

**Coverage:**
- v3.0.0 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
