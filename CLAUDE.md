# LocalGround Toolkit for Claude Code Projects

## What This Is

A toolkit that helps Claude Code CLI users migrate project folders off cloud-synced storage, verify migration integrity, clean up stale artifacts, and audit environment health. The target audience is Claude Code users hitting git errors, file lock failures, or sync conflicts from working in OneDrive, Dropbox, Google Drive, or iCloud folders.

**v3.0.0** restructures the toolkit into a three-layer architecture:

| Layer | Package | Purpose |
|---|---|---|
| Core library | `@localground/core` | Shared deterministic operations — environment detection, integrity checks, file operations |
| MCP server | `@localground/mcp` | Exposes core operations as native Claude Code tool calls via MCP protocol |
| CLI | `@localground/cli` | Standalone terminal interface (`npx @localground/cli`) |

The v2.0.0 paste-and-run prompts remain in `prompts/` as a no-install fallback:

| Prompt | File | Purpose |
|---|---|---|
| Seed | `prompts/localground-seed.md` | Plants verifiable markers before migration |
| Migration | `prompts/localground-migration.md` | Copies projects from cloud-synced storage to local paths |
| Reap | `prompts/localground-reap.md` | Verifies markers survived migration, runs health checks |
| Cleanup | `prompts/localground-cleanup.md` | Removes stale source folders, path-hash directories, and orphan entries |
| Verification | `prompts/localground-verification.md` | Audits current state, reports findings, recommends next steps |

## Project Owner

Robert LaSalle

## Current State

- **Toolkit version:** v3.0.0-dev (in development). Monorepo scaffolded with npm workspaces. Core library (`@localground/core`) built with all 12 deterministic operations. MCP server and CLI are compilable stubs.
- **Core library:** `@localground/core` exports 12 CORE functions (detect, decode, classify, checksum, compare, placeholderDetect, gitCheck, copy, seed, verify, scan, chunk) plus utilities and all public types. TypeScript strict mode, zero errors.
- **MCP server:** `@localground/mcp` — compilable stub re-exporting core types. Real implementation in Phase 13.
- **CLI:** `@localground/cli` — compilable stub re-exporting core types. Real implementation in Phase 14.
- **v2.0.0 prompts:** All five prompts shipped and preserved in `prompts/` as no-install fallback.
- **Design spec:** `docs/design/2026-04-10-localground-toolkit-design.md` — approved design for the toolkit expansion. This is the requirements source for all GSD planning.
- **Evaluation:** All five v2.0.0 prompts passed all applicable NEC prompt frameworks (details in `docs/evaluations/prompt-evaluation-seed.md`, `docs/evaluations/prompt-evaluation-migration.md`, `docs/evaluations/prompt-evaluation-reap.md`, `docs/evaluations/prompt-evaluation-cleanup.md`, and `docs/evaluations/prompt-evaluation-verification.md`)

## File Map

### v3.0.0 Monorepo Packages

| Path | Purpose |
|---|---|
| `packages/core/` | `@localground/core` — shared library (environment, integrity, operations) |
| `packages/core/src/index.ts` | Core barrel export — flat public API (D-07) |
| `packages/core/src/types.ts` | All public TypeScript types (Result, domain types) |
| `packages/core/src/environment/` | Environment detection: platform, cloud service, path-hash decode/classify |
| `packages/core/src/integrity/` | Integrity checks: checksum, compare, placeholder detection, git health |
| `packages/core/src/operations/` | File operations: copy, seed, verify, scan, chunk |
| `packages/core/src/util/` | Internal utilities: spawn, paths |
| `packages/mcp/` | `@localground/mcp` — MCP server (stub, Phase 13) |
| `packages/cli/` | `@localground/cli` — standalone CLI (stub, Phase 14) |

### v2.0.0 Prompts (legacy fallback)

| Path | Purpose |
|---|---|
| `prompts/localground-seed.md` | Seed prompt — pre-migration marker planting |
| `prompts/localground-migration.md` | Migration prompt — two-session copy and settings migration |
| `prompts/localground-reap.md` | Reap prompt — post-migration health check and marker verification |
| `prompts/localground-cleanup.md` | Cleanup prompt — stale artifact removal |
| `prompts/localground-verification.md` | Verification prompt — read-only environment audit |

### Documentation

| Path | Purpose |
|---|---|
| `docs/dev-status/dev-status-seed.md` | Seed prompt dev status |
| `docs/dev-status/dev-status-migration.md` | Migration prompt dev status — version history, test execution, findings, testing plan |
| `docs/dev-status/dev-status-reap.md` | Reap prompt dev status |
| `docs/dev-status/dev-status-cleanup.md` | Cleanup prompt dev status — build summary, NEC evaluation, testing plan |
| `docs/dev-status/dev-status-verification.md` | Verification prompt build summary, NEC evaluation, testing plan |
| `docs/evaluations/prompt-evaluation-seed.md` | Seed prompt NEC evaluation |
| `docs/evaluations/prompt-evaluation-migration.md` | Migration prompt NEC framework evaluation |
| `docs/evaluations/prompt-evaluation-reap.md` | Reap prompt NEC evaluation |
| `docs/evaluations/prompt-evaluation-cleanup.md` | Cleanup prompt NEC framework evaluation |
| `docs/evaluations/prompt-evaluation-verification.md` | Verification prompt NEC framework evaluation |
| `docs/design/2026-04-10-localground-toolkit-design.md` | Approved design spec — requirements source for GSD planning |

## Architecture

### Three-Layer Architecture (v3.0.0)

The v3.0.0 toolkit is structured as a monorepo with three npm workspace packages:

```
@localground/core   — Shared library: 12 deterministic operations, all types
@localground/mcp    — MCP server: exposes core ops as Claude Code tool calls
@localground/cli    — Standalone CLI: terminal interface via npx
```

**Core library** (`packages/core/`) provides a flat public API — all functions import directly from `@localground/core`:
```typescript
import { detect, decode, copy, verify, checksum } from '@localground/core';
import type { Result, EnvironmentInfo, CopyData } from '@localground/core';
```

**Safety model** is enforced in code: Result types (never throws), platform-specific tool selection (robocopy/rsync), and the same no-delete/verify-everything principles from v2.0.0.

### v2.0.0 Prompt Architecture (legacy fallback)

The v2.0.0 toolkit has five independent prompts in `prompts/`, each with a distinct execution model:

| Prompt | Sessions | Safety Model | Key Output |
|---|---|---|---|
| Seed | Single session | Write-only: one test file + one git tag. Never modifies existing content. | `.localground-seed-manifest.json` |
| Migration | Two sessions (Session 1: copy, Session 2: settings) | Never deletes. Every copy verified. | `migration-session-1-results.md`, `session-2-prompt.md` |
| Reap | Single session | Read-only verification + single manifest cleanup. | `localground-reap-report.md` |
| Cleanup | Single session | Deletes only with individual user confirmation and verified local copy. Cloud-propagation warning on every source deletion. | `cleanup-results.md` |
| Verification | Single session | Read-only. Never modifies or deletes. Single permitted write: `verification-report.md`. | `verification-report.md` |

All five prompts share: three-way shell detection, five-dimension constraint model (Must/Must-not/Prefer/Escalate/Recover), auto-detect-first design, and graceful cross-prompt state handling. Each prompt contains its own self-contained copy of shared detection logic (path-hash decoding, cloud service patterns, shell detection) — no runtime dependency between prompts.

### Two-Session Design

The migration runs across two Claude Code sessions because Claude Code must restart from the new path to create correct project settings directories.

- **Session 1 (user pastes the prompt):** Environment detection, pre-flight, inventory, copy-and-verify, generate Session 2 prompt
- **Session 2 (generated prompt):** Settings/memory migration, reference updates, post-migration reminders

### Five-Dimension Constraint Model

The prompt's constraint architecture extends the standard four-quadrant pattern with a fifth dimension:

| Dimension | Purpose |
|---|---|
| **Must** | Non-negotiable requirements (phased approach, verification, confirmation gates) |
| **Must-not** | Hard prohibitions (no deletions, no admin elevation, no silent overwrites) |
| **Prefer** | Default behaviors when multiple valid approaches exist (rename spaces, report don't investigate) |
| **Escalate** | Conditions that stop execution and require user input (unmapped paths, permission failures) |
| **Recover** | Crash recovery and prior migration detection |

### Design Principles

- **No deletions ever.** Source folders, old settings directories, partial copies — nothing gets deleted. The user handles all cleanup manually after confirming everything works.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask the user.
- **One file, one paste.** The user manages one markdown file per session. Human-facing guide and Claude Code instructions live in the same file, separated by a clear marker.
- **Session 2 generated from actual results.** The continuation prompt is built from verified migration data, not templates with "update this after Session 1" placeholders.
- **Methodology is non-negotiable.** Phased approach, constraint architecture, verification steps, confirmation gates, and no-delete policy apply regardless of migration size.
- **Verifiable migration.** Seed markers planted before migration are verified after — no trust, only evidence.
- **Not a skill.** This is a paste-and-run toolkit. Distribution is via file sharing (GitHub gist or repo), not the skills directory.

## Development Workflow

- Development happens in this folder
- Changes to the prompt update `localground-migration.md` in place — git tracks version history
- Dev status reports track findings, version history, and testing plans per prompt (`docs/dev-status/dev-status-seed.md`, `docs/dev-status/dev-status-migration.md`, `docs/dev-status/dev-status-reap.md`, `docs/dev-status/dev-status-cleanup.md`, `docs/dev-status/dev-status-verification.md`)
- Evaluation uses Nate's Executive Circle prompt frameworks — run the same eight-framework review on each new version
- Testing uses the "fresh re-run, new target" approach documented in the dev status report

## Rules

- New versions update `localground-migration.md` in place — prior versions are preserved in git history
- The dev status report is the single source of truth for what needs to change in the next version
- When building a new version, start from the most recent prompt file as the base

<!-- GSD:project-start source:PROJECT.md -->
## Project

**LocalGround Toolkit for Claude Code**

A five-prompt toolkit that Claude Code CLI users paste into their terminal to migrate project folders off cloud-synced storage — with pre-migration verification, migration, post-migration health checks, cleanup, and environment auditing. Each prompt is an independent markdown file — one file, one paste, no installation. The target audience is Claude Code users hitting git errors, file lock failures, or sync conflicts from working in OneDrive, Dropbox, Google Drive, or iCloud folders.

**Core Value:** Get Claude Code users off cloud-synced storage safely — no data loss, no silent failures, every action verified before and after.

### Constraints

- **Distribution format**: One markdown file per prompt, paste into Claude Code CLI. No dependencies, no installation, no build step.
- **Platform support**: Windows (PowerShell and Git Bash), macOS (zsh/bash), Linux (bash). Three-way shell detection required.
- **CLI compatibility**: Claude Code CLI as of April 2026. Must detect and handle CLI version changes between sessions.
- **Safety**: Migration never deletes. Cleanup deletes only with individual confirmation and verified local copy. Verification never modifies.
- **Evaluation standard**: Every version of every prompt evaluated against eight NEC prompt frameworks before release.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ~5.7 — Core library, MCP server, CLI (v3.0.0)
- Markdown — Prompt specification, user-facing documentation, dev status reporting, evaluation records
- PowerShell — Target shell for Windows users executing the migration (specified inside the prompt)
- Bash — Target shell for macOS/Linux users and Windows Git Bash users executing the migration
## Runtime
- Node.js >=20.0.0 — Required for v3.0.0 packages
- Claude Code CLI — The runtime that executes the prompt. Tested against Claude Code CLI as of April 2026.
- Lockfile: package-lock.json (npm workspaces)
## Build Tools
- tsup ^9.0.0 — TypeScript bundler for all three packages
- npm workspaces — Monorepo package management (root package.json)
## Test Tools
- Vitest ^3.0.0 — Test runner (configured, test suite to be built)
## Frameworks
- Nate's Executive Circle prompt kits (State of Prompt Engineering Kit, Six Weeks Kit, Building Agents Is 80% Plumbing Kit, Skills Are Infrastructure Now Kit) — Used to evaluate prompts against eight frameworks. Not runtime dependencies.
## Key Dependencies
- Claude Code CLI (user's installation) — Required for MCP server integration and prompt execution.
- robocopy (Windows built-in) — Copy tool for Windows migrations. Called by `@localground/core` copy().
- rsync (macOS/Linux standard) — Copy tool for macOS/Linux migrations. Called by `@localground/core` copy().
- git — Required for git integrity verification. Present on any system where Claude Code users have repos.
## Configuration
- No environment variables required for this project.
- No `.env` file exists or is needed.
- TypeScript configuration: `tsconfig.json` (root) with project references to each package.
## Platform Requirements
- Node.js >=20.0.0
- Git for version control
- Claude Code CLI for MCP server integration and testing
- Windows: PowerShell or Git Bash (MINGW64/MSYS2/WSL) available
- macOS/Linux: bash or zsh available
- robocopy (Windows, built-in since Vista) or rsync (macOS/Linux standard) available
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- One Markdown file contains both the human-facing user guide (above the separator) and the Claude Code instructions (below the separator). The user pastes the entire file.
- Execution is split across two Claude Code sessions by design — Session 1 copies files, Session 2 migrates settings and updates references. The split is mandatory because Claude Code must be relaunched from the new path to generate correct path-hash directories.
- The Session 2 prompt is generated dynamically from actual Session 1 results, not from a static template. It is written to the user's filesystem as `session-2-prompt.md`.
- A five-dimension constraint model governs all execution behavior: Must / Must-not / Prefer / Escalate / Recover.
## Session Architecture
- Purpose: Environment detection, pre-flight, folder copy-and-verify, Session 2 prompt generation
- Phases: 1 (auto-detect), 2 (pre-flight), 3 (inventory/naming), 4 (copy-and-verify), 5 (generate Session 2 prompt), 6 (handoff)
- Outputs: `migration-session-1-results.md` (crash-recovery log), `session-2-prompt.md` (continuation prompt)
- Purpose: Settings/memory migration, path reference updates, post-migration reminders
- Phases: 7 (settings migration), 8 (reference updates), 9 (post-migration reminders)
- Outputs: `migration-session-2-results.md`
## Constraint Architecture
| Dimension | What It Controls |
|---|---|
| **Must** | Confirmation gates between phases, per-folder confirmation before proceeding, results log written incrementally |
| **Must-not** | No deletions ever, no admin elevation, no silent overwrites of pre-existing targets, no partial-state cleanup |
| **Prefer** | Rename spaces/special chars to hyphens in folder names, report anomalies don't investigate, preserve `.planning/` history |
| **Escalate** | Unmapped path-hash entries, CLI version mismatch detected in Phase 7.1, permission failures |
| **Recover** | Crash recovery: check CWD for `migration-session-1-results.md` before Phase 1, cross-reference prior results against current target state |
## Phase Flow
## Data Flow
## Error Handling
- robocopy exit code > 7: stop and report (codes 0-7 are success/non-fatal)
- rsync non-zero exit: stop and report
- File count significantly lower in target than source: flag (likely Files On-Demand placeholders)
- git fsck warnings: report and continue; git fsck errors: stop
- Pre-existing target folder: stop, present three options (skip / alternate name / user deletes manually)
- Partial copy failure: stop, do not delete partial target, wait for instructions
- Unmapped path-hash entries: report separately, do not modify
- CLI version change (Phase 7.1): stop and report before any settings migration
## Key Decisions Encoded in the Design
- **No deletions ever:** Source folders, old path-hash directories, partial copies — nothing gets deleted at any point. The user handles all cleanup manually.
- **Platform-specific command selection:** The prompt branches on detected shell (PowerShell, bash-on-Windows, native bash/zsh) and uses the appropriate copy tool and verification commands throughout. Commands are never mixed across shells.
- **Session 2 prompt is self-contained:** It does not depend on Session 1's context window. It reads from the results log on disk.
- **Proportional output:** Generated artifacts scale to migration scope — same structural completeness, but a 2-folder migration doesn't get padded with bulk.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
