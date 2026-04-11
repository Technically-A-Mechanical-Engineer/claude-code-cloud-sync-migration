# Cloud-Sync Toolkit for Claude Code Projects

## What This Is

A three-prompt toolkit that Claude Code users paste into CLI to migrate project folders from cloud-synced storage, clean up stale artifacts, and verify project health. Each prompt is an independent markdown file — one file, one paste.

| Prompt | File | Purpose |
|---|---|---|
| Migration | `claude-code-cloud-sync-migration.md` | Copies projects from cloud-synced storage to local paths |
| Cleanup | `cloud-sync-cleanup.md` | Removes stale source folders, path-hash directories, and orphan entries |
| Verification | `cloud-sync-verification.md` | Audits current state, reports findings, recommends next steps |

The target audience is Claude Code users hitting git errors, file lock failures, or sync conflicts from working in cloud-synced folders. Distribution is markdown files — not skills, not plugins, not packages.

## Project Owner

Robert LaSalle

## Current State

- **Migration prompt:** v1.2.0 (shipped). Tagged migration-v1.2.0, merged to master.
- **Cleanup prompt:** v1.0.0 (shipped). 946 lines, NEC evaluation passed with 4 minor findings (all fixed).
- **Verification prompt:** v1.0.0 (shipped). 658 lines. NEC evaluation passed all eight frameworks, zero findings.
- **Design spec:** `docs/superpowers/specs/2026-04-10-cloud-sync-toolkit-design.md` — approved design for the three-prompt expansion. This is the requirements source for all GSD planning.
- **Evaluation:** All three prompts passed all applicable NEC prompt frameworks (details in `prompt-evaluation-migration.md`, `prompt-evaluation-cleanup.md`, and `prompt-evaluation-verification.md`)

## File Map

| File | Purpose |
|---|---|
| `claude-code-cloud-sync-migration.md` | Migration prompt (current: v1.2.0). Prior versions in git history. |
| `cloud-sync-cleanup.md` | Cleanup prompt (current: v1.0.0). Built 2026-04-10/11. |
| `cloud-sync-verification.md` | Verification prompt (current: v1.0.0). Built 2026-04-11. |
| `dev-status-migration.md` | Migration prompt dev status — version history, test execution, findings, testing plan |
| `dev-status-cleanup.md` | Cleanup prompt dev status — build summary, NEC evaluation, testing plan |
| `dev-status-verification.md` | Verification prompt build summary, NEC evaluation, testing plan |
| `prompt-evaluation-migration.md` | Migration prompt NEC framework evaluation (v1.1.1 and v1.2.0) |
| `prompt-evaluation-cleanup.md` | Cleanup prompt NEC framework evaluation (v1.0.0) |
| `prompt-evaluation-verification.md` | Verification prompt NEC framework evaluation (v1.0.0) |
| `docs/superpowers/specs/2026-04-10-cloud-sync-toolkit-design.md` | Approved design spec — requirements source for GSD planning |

## Architecture

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
- **Not a skill.** This is a one-shot migration playbook. It fails the recurrence criterion for skill encoding. Distribution is via file sharing (GitHub gist or repo), not the skills directory.

## Development Workflow

- Development happens in this folder
- Changes to the prompt update `claude-code-cloud-sync-migration.md` in place — git tracks version history
- Dev status reports track findings, version history, and testing plans per prompt (`dev-status-migration.md`, `dev-status-cleanup.md`)
- Evaluation uses Nate's Executive Circle prompt frameworks — run the same eight-framework review on each new version
- Testing uses the "fresh re-run, new target" approach documented in the dev status report

## Rules

- New versions update `claude-code-cloud-sync-migration.md` in place — prior versions are preserved in git history
- The dev status report is the single source of truth for what needs to change in the next version
- When building a new version, start from the most recent prompt file as the base

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Cloud-Sync Toolkit for Claude Code**

A three-prompt toolkit that Claude Code CLI users paste into their terminal to migrate project folders off cloud-synced storage, clean up stale artifacts afterward, and verify project health. Each prompt is an independent markdown file — one file, one paste, no installation. The target audience is Claude Code users hitting git errors, file lock failures, or sync conflicts from working in OneDrive, Dropbox, Google Drive, or iCloud folders.

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
- Markdown — Prompt specification, user-facing documentation, dev status reporting, evaluation records
- PowerShell — Target shell for Windows users executing the migration (specified inside the prompt)
- Bash — Target shell for macOS/Linux users and Windows Git Bash users executing the migration
## Runtime
- Claude Code CLI — The runtime that executes the prompt. Tested against Claude Code CLI as of April 2026.
- Not applicable — no packages, no dependencies, no build step.
- Lockfile: Not present.
## Frameworks
- None — This is a single-file prompt. No frameworks are installed or required.
- Nate's Executive Circle prompt kits (State of Prompt Engineering Kit, Six Weeks Kit, Building Agents Is 80% Plumbing Kit, Skills Are Infrastructure Now Kit) — Used to evaluate the prompt against eight frameworks. Not runtime dependencies.
- Manual testing via fresh re-run to a parallel target path — No automated test runner exists.
- Not applicable — development is editing `claude-code-cloud-sync-migration.md` in place.
## Key Dependencies
- Claude Code CLI (user's installation) — The prompt is useless without it. Version matters: Phase 7.1 includes an escalation trigger if the `~/.claude/projects/` directory structure changes between sessions (CLI update risk).
- robocopy (Windows built-in) — Copy tool for Windows migrations. Called from within the prompt's Phase 4 instructions.
- rsync (macOS/Linux standard) — Copy tool for macOS/Linux migrations.
- git — Required for git integrity verification steps (Phase 4.6). Present on any system where Claude Code users have repos.
## Configuration
- No environment variables required for this project.
- No `.env` file exists or is needed.
- No build configuration. The prompt file is the artifact.
## Platform Requirements
- Any text editor capable of editing Markdown
- Git for version control
- Claude Code CLI for testing
- Claude Code CLI installed
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
