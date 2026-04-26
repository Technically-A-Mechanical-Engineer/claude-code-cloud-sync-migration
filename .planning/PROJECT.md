# LocalGround Toolkit for Claude Code

## What This Is

A toolkit that helps Claude Code CLI users migrate project folders off cloud-synced storage, verify migration integrity, clean up stale artifacts, and audit environment health. v2.0.0 shipped as five paste-and-run markdown prompts. v3.0.0 restructures the toolkit into a hybrid architecture: a Node.js MCP server and standalone CLI handle deterministic filesystem operations, while Claude Code skills handle user interaction and judgment. The target audience is Claude Code users hitting git errors, file lock failures, or sync conflicts from working in OneDrive, Dropbox, Google Drive, or iCloud folders.

## Core Value

Get Claude Code users off cloud-synced storage safely — no data loss, no silent failures, every action verified before and after.

## Requirements

### Validated

- ✓ Auto-detect OS, shell, cloud sync service, and project inventory — existing (migration v1.1.1)
- ✓ Phased migration with verification at every step — existing (migration v1.1.1)
- ✓ No deletions during migration — existing (migration v1.1.1)
- ✓ Two-session design with generated Session 2 prompt — existing (migration v1.1.1)
- ✓ Five-dimension constraint model (Must/Must-not/Prefer/Escalate/Recover) — existing (migration v1.1.1)
- ✓ Passed eight Nate's Executive Circle prompt frameworks — existing (migration v1.1.1)
- ✓ Three-way shell detection (PowerShell / bash-on-Windows / native bash) — Validated in Phase 1: Migration v1.2.0
- ✓ Multi-signal prior migration detection (four-signal cascade) — Validated in Phase 1: Migration v1.2.0
- ✓ "Already done" branch with four options when prior migration detected — Validated in Phase 1: Migration v1.2.0
- ✓ Artifact production for all branch paths — Validated in Phase 1: Migration v1.2.0
- ✓ Shared folder subdirectory migration — Validated in Phase 1: Migration v1.2.0
- ✓ Pre-copy placeholder verification (detect cloud-only stubs before copying) — Validated in Phase 1: Migration v1.2.0
- ✓ Phase 9 references cleanup prompt instead of manual steps — Validated in Phase 1: Migration v1.2.0

## Current Milestone: v3.0.0 MCP Server + CLI Tooling

**Goal:** Restructure the LocalGround Toolkit from paste-and-run prompts to a hybrid architecture — deterministic Node.js tooling (MCP server + standalone CLI) handles filesystem operations, Claude Code skills handle user interaction and judgment.

**Target features:**
- MCP server exposing LocalGround tools (detect, seed, reap, copy, verify, audit) as native Claude Code tool calls
- Standalone CLI (`npx @localground/cli`) for direct terminal usage
- Shared core library: path-hash decoding, cloud detection, shell detection, placeholder detection, integrity verification
- Claude Code skills replacing v2.0.0 prompts as thin orchestrators
- Automated test suite (jest) with GitHub Actions CI
- npm package publishing for zero-friction distribution
- Repo restructure to monorepo layout (packages/mcp, packages/cli, skills/, prompts/)

### Active

- [ ] Seed prompt — pre-migration marker planting (test file, git tag, memory entry, checksum manifest)
- [x] Sow prompt — post-migration marker verification + health checks — Validated in Phase 7: Sow Prompt Build
- [x] F-01: MSYS_NO_PATHCONV=1 upfront for bash-on-Windows robocopy calls — Validated in Phase 6: Existing Prompt Fixes
- [x] F-02: Step 2.4 clarification — session stays open during migration — Validated in Phase 6: Existing Prompt Fixes
- [x] F-03: Fix sed quoting errors in verification path-hash decoding on bash-on-Windows — Validated in Phase 6: Existing Prompt Fixes
- [x] F-04: Parallel tool call note or sequential restructure in migration — Validated in Phase 6: Existing Prompt Fixes
- [x] File rename: cloud-sync-migration.md with cascading reference updates — Validated in Phase 5: Housekeeping
- [x] MIG-V2-01: Pre-copy file size verification (catches 0-byte placeholder stubs) — Validated in Phase 6: Existing Prompt Fixes
- [x] CLN-V2-01: Batch confirmation option in cleanup after consecutive clean deletions — Validated in Phase 6: Existing Prompt Fixes
- [x] CLN-V2-02: Undo guidance in cleanup human-readable section — Validated in Phase 6: Existing Prompt Fixes
- [ ] Unified toolkit versioning across all prompts

### Validated in Phase 4: Documentation Updates
- [x] Compatibility note in README: requires Claude Code CLI, not claude.ai/desktop/Cowork
- [x] Updated README, CLAUDE.md, and dev status report for toolkit scope

### Validated in Phase 3: Verification v1.0.0
- [x] Verification prompt auditing project health, path-hash integrity, stale references
- [x] Actionable recommendations in verification report pointing to other toolkit prompts

### Validated in Phase 2: Cleanup v1.0.0
- [x] Cleanup prompt with dual-mode detection (post-migration / standalone)
- [x] Cleanup phases: stale path-hash dirs, orphan entries, source folders
- [x] Individual confirmation on every deletion in cleanup
- [x] Soak-period check before source folder deletion
- [x] Manual steps section in human-readable area of cleanup and verification prompts

### Out of Scope

- Automation of cloud sync pause/resume — too fragile across services, risk of false confidence in file locality
- Agent or skill encoding — these are prompts, not recurring workflows; fail the recurrence criterion
- Multi-user or team migration workflows — these are individual-user tools
- Interactive/TUI elements — one file, one paste, user drives through confirmation gates
- CONTRIBUTING.md — zero contributors, no signal anyone needs contribution guidance yet. Write it when someone asks.
- Scheduled re-verification (VER-V2-01) — contradicts one-paste design; a line in the report saying "consider re-running" is sufficient
- Comparison mode (VER-V2-02) — heavy feature for unclear value; defer until someone actually requests it

## Context

- Project originated from Robert LaSalle's own OneDrive-to-local migration (April 9-10, 2026)
- Generalized into a distributable tool through iterative review against NEC prompt frameworks
- v1.2.0 milestone shipped 2026-04-11. Three prompts: migration v1.2.0, cleanup v1.0.0, verification v1.0.0.
- v2.0.0 milestone shipped 2026-04-12. Five prompts (added seed + reap), unified versioning, LocalGround rename, independent NEC evaluation (46 findings found and addressed).
- Repo is public on GitHub: Technically-A-Mechanical-Engineer/claude-code-cloud-sync-migration
- v3.0.0 direction materialized during v2.0.0 audit gap remediation — NEC findings revealed that most issues stemmed from ambiguity in deterministic operations that code would handle without ambiguity. Brainstorm context captured in docs/design/v3-brainstorm-context.md.
- Project owner is not a developer — uses Claude Code as a workflow automation tool. Has never built an MCP server before. Getting comfortable with GitHub.
- Every Claude Code user has Node.js installed — npx is zero-install for the target audience.

## Constraints

- **Distribution format**: npm package(s) via npx. MCP server as primary Claude Code integration, standalone CLI as secondary interface. v2.0.0 paste-and-run prompts preserved as no-install fallback.
- **Platform support**: Windows (PowerShell and Git Bash), macOS (zsh/bash), Linux (bash). Platform detection handled deterministically in code.
- **CLI compatibility**: Claude Code CLI and MCP protocol as of April 2026.
- **Safety**: Same safety model as v2.0.0 — migration never deletes, cleanup deletes only with confirmed local copy, verification never modifies. Now enforced in code rather than natural language instructions.
- **Testing**: Deterministic code gets automated tests (jest + GitHub Actions CI). Skills get manual testing against reduced surface area.
- **Backward compatibility**: v2.0.0 prompts remain functional in prompts/ directory.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three independent prompts, not a multi-session chain | Simple scales — each prompt works standalone. Cross-references by filename, no runtime dependency. | ✓ Validated — all three prompts shipped as independent files |
| Cleanup prompt has dual-mode detection | Works whether user ran migration prompt or not. Post-migration mode uses artifacts for high confidence; standalone mode auto-detects. | ✓ Validated — both modes implemented in v1.0.0 |
| Verification prompt overlaps with migration's quick-verify branch | Intentional — migration verifies a specific migration, verification audits full environment. Different audiences and entry points. | ✓ Validated — distinct scope confirmed during build |
| No automation of cloud sync pause/resume | Commands are undocumented, version-dependent, service-specific. Silent failure would give false confidence about file locality. | ✓ Good |
| Prompts, not agents | One-shot playbooks driven by user through confirmation gates. No autonomy, no scheduling. Fail the recurrence criterion for skill encoding. | ✓ Good |
| Graceful cross-prompt state | Each prompt interprets missing path-hash directories as possible cleanup, not corruption. Prompts coexist without misdiagnosing each other's side effects. | ✓ Validated — implemented in all three prompts |
| Unified toolkit versioning for v2.0.0 | Per-prompt versions create bookkeeping overhead with no user benefit — users grab the latest of all prompts. One toolkit version eliminates the version matrix. | — Pending |
| Deferred CONTRIBUTING.md, scheduled re-verification, comparison mode | Zero contributors, one-paste design contradicts scheduling, comparison mode is heavy for unclear value. Revisit when signal exists. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 after Phase 14 (Standalone CLI and Claude Code Skills) completion — npm workspaces monorepo with three packages (@localground/core, @localground/mcp, @localground/cli) shipped end-to-end. CLI exposes detect/seed/copy/verify/reap/audit/cleanup-scan with --json flag and stderr status lines. MCP server exposes 9 tool calls. Five /localground:* skills (seed, migrate, reap, cleanup, verify) with allowed-tools frontmatter. All Phase 14 UAT gaps closed via gap-closure plans 14-08..14-11 (decoder rewrite, CLI/MCP detect decode-wiring, looksLikeProject audit scope, CLI status lines).*
