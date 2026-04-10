# Cloud-Sync Migration for Claude Code Projects

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

- **Migration prompt:** v1.1.1 (release candidate). Next: v1.2.0 — six findings documented in dev status report.
- **Cleanup prompt:** Not yet built. v1.0.0 spec in design doc.
- **Verification prompt:** Not yet built. v1.0.0 spec in design doc.
- **Design spec:** `docs/superpowers/specs/2026-04-10-cloud-sync-toolkit-design.md` — approved design for the three-prompt expansion. This is the requirements source for all GSD planning.
- **Evaluation:** v1.1.1 passed all eight Nate's Executive Circle prompt frameworks (details in `prompt-evaluation.md`)

## File Map

| File | Purpose |
|---|---|
| `claude-code-cloud-sync-migration.md` | Migration prompt (current: v1.1.1, next: v1.2.0). Prior versions in git history. |
| `cloud-sync-cleanup.md` | Cleanup prompt (not yet built, v1.0.0 spec in design doc) |
| `cloud-sync-verification.md` | Verification prompt (not yet built, v1.0.0 spec in design doc) |
| `cloud-sync-migration-dev-status.md` | Development status report, version history, requirements, and testing plans |
| `prompt-evaluation.md` | Framework evaluation against eight prompt engineering frameworks |
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
- The dev status report (`cloud-sync-migration-dev-status.md`) tracks findings, requirements, version history, and testing plans
- Evaluation uses Nate's Executive Circle prompt frameworks — run the same eight-framework review on each new version
- Testing uses the "fresh re-run, new target" approach documented in the dev status report

## Rules

- New versions update `claude-code-cloud-sync-migration.md` in place — prior versions are preserved in git history
- The dev status report is the single source of truth for what needs to change in the next version
- When building a new version, start from the most recent prompt file as the base
