# Cloud-Sync Migration for Claude Code Projects

## What This Is

A single-file prompt that Claude Code users paste into CLI to migrate project folders from cloud-synced storage (OneDrive, Dropbox, Google Drive, iCloud) to local paths. It auto-detects the environment, runs a phased migration with verification at every step, and generates a Session 2 continuation prompt from actual results.

The target audience is Claude Code users hitting git errors, file lock failures, or sync conflicts from working in cloud-synced folders. Distribution is a single markdown file — not a skill, not a plugin, not a package. One file, one paste.

## Project Owner

Robert LaSalle

## Current State

- **Current version:** v1.1.1 (release candidate)
- **Next version:** v1.2.0 — five findings documented in `cloud-sync-migration-dev-status.md`
- **Evaluation:** v1.1.1 passed all eight Nate's Executive Circle prompt frameworks (details in `v1_1_1-evaluation.md`)

## File Map

| File | Purpose |
|---|---|
| `claude-code-cloud-sync-migration.md` | The prompt file users paste into Claude Code CLI (current version: v1.1.1). Prior versions are in git history. |
| `cloud-sync-migration-dev-status.md` | Development status report, version history, v1.2.0 requirements, and testing plan |
| `v1_1_1-evaluation.md` | Framework evaluation of v1.1.1 against eight prompt engineering frameworks |

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
- Changes to the prompt go in a new versioned file (e.g., `claude-code-cloud-sync-migration-v1.2.0.md`)
- The dev status report (`cloud-sync-migration-dev-status.md`) tracks findings, requirements, version history, and testing plans
- Evaluation uses Nate's Executive Circle prompt frameworks — run the same eight-framework review on each new version
- Testing uses the "fresh re-run, new target" approach documented in the dev status report

## Rules

- New versions update `claude-code-cloud-sync-migration.md` in place — prior versions are preserved in git history
- The dev status report is the single source of truth for what needs to change in the next version
- When building a new version, start from the most recent prompt file as the base
