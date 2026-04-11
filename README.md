# Cloud-Sync Toolkit for Claude Code Projects

A three-prompt toolkit that helps Claude Code users migrate off cloud-synced storage, clean up stale artifacts, and verify project health. Each prompt is a single markdown file — one file, one paste, no installation.

## The Problem

Working in cloud-synced folders (OneDrive, Dropbox, Google Drive, iCloud) causes git errors, file lock failures, and sync conflicts in Claude Code. These services try to sync `.git` internals and Claude Code's settings directories, which breaks things in ways that are hard to diagnose.

## The Toolkit

| Prompt | File | What It Does |
|--------|------|-------------|
| **Migration** | [`cloud-sync-migration.md`](cloud-sync-migration.md) | Copies project folders from cloud storage to local paths. Never deletes originals. Two-session design with generated continuation prompt. |
| **Cleanup** | [`cloud-sync-cleanup.md`](cloud-sync-cleanup.md) | Removes stale path-hash directories, orphan entries, and source folders left behind after migration. Every deletion individually confirmed with verification evidence. |
| **Verification** | [`cloud-sync-verification.md`](cloud-sync-verification.md) | Audits project health, path-hash integrity, and stale references. Reports findings with actionable recommendations. |

Each prompt works independently. They reference each other by filename but don't depend on each other to function.

## Who This Is For

Claude Code users who launched their projects from a OneDrive, Dropbox, Google Drive, or iCloud-synced folder and are hitting git or file system errors — or who have already migrated and want to clean up what's left behind.

## Requirements

- **Claude Code CLI** (terminal or IDE extension). This toolkit does not work in claude.ai web, Claude desktop app, or Cowork mode.
- **Platform:** Windows (PowerShell or Git Bash), macOS (zsh/bash), or Linux (bash)
- **git** installed and available in your shell

## How to Use

### Migration (start here if you haven't moved your projects yet)

1. Download [`cloud-sync-migration.md`](cloud-sync-migration.md)
2. Open Claude Code CLI from your current (cloud-synced) project folder: `claude --dangerously-skip-permissions` (recommended — avoids cancelled tool calls during parallel file operations; see the migration prompt for details)
3. Copy the entire contents of the file and paste it as your first message
4. Follow the prompts — Session 1 copies folders, Session 2 migrates settings

### Cleanup (after migration, when you're ready to remove the originals)

1. Download [`cloud-sync-cleanup.md`](cloud-sync-cleanup.md)
2. Open Claude Code CLI from your local project folder
3. Paste the entire contents as your first message
4. The prompt works with or without migration artifacts — it detects everything independently

### Verification (audit your environment at any time)

1. Download [`cloud-sync-verification.md`](cloud-sync-verification.md)
2. Open Claude Code CLI from your local project folder
3. Paste the entire contents as your first message
4. Review the traffic light summary and findings — each finding includes a plain-language explanation and recommended next step

## Current Versions

| Prompt | Version | Status |
|--------|---------|--------|
| Migration | **v1.2.0** (2026-04-10) | Shipped. Passed all eight NEC evaluation frameworks. |
| Cleanup | **v1.0.0** (2026-04-11) | Shipped. Passed all applicable NEC evaluation frameworks. |
| Verification | **v1.0.0** (2026-04-11) | Shipped. Passed all eight NEC evaluation frameworks. |

## Platform Support

- Windows (PowerShell / Git Bash)
- macOS (zsh/bash)
- Linux (bash)

All three prompts use three-way shell detection to provide platform-correct commands throughout.

## Documentation

| File | Purpose |
|------|---------|
| [`docs/dev-status/dev-status-migration.md`](docs/dev-status/dev-status-migration.md) | Migration prompt version history, test results, findings |
| [`docs/dev-status/dev-status-cleanup.md`](docs/dev-status/dev-status-cleanup.md) | Cleanup prompt build summary, NEC evaluation, testing plan |
| [`docs/evaluations/prompt-evaluation-migration.md`](docs/evaluations/prompt-evaluation-migration.md) | Migration prompt eight-framework NEC evaluation |
| [`docs/evaluations/prompt-evaluation-cleanup.md`](docs/evaluations/prompt-evaluation-cleanup.md) | Cleanup prompt eight-framework NEC evaluation |
| [`docs/dev-status/dev-status-verification.md`](docs/dev-status/dev-status-verification.md) | Verification prompt build summary, NEC evaluation, testing plan |
| [`docs/evaluations/prompt-evaluation-verification.md`](docs/evaluations/prompt-evaluation-verification.md) | Verification prompt eight-framework NEC evaluation |

## Design Principles

- **Safety first.** Migration never deletes. Cleanup deletes only with individual confirmation and verified local copy. Verification never modifies.
- **Auto-detect first, ask second.** If it can be determined from the filesystem, the prompt doesn't ask.
- **One file, one paste.** No installation, no dependencies, no plugins.
- **Platform-correct commands.** Three-way shell detection ensures the right commands for your environment.
- **Graceful coexistence.** Each prompt interprets missing artifacts as possible prior cleanup, not corruption.

## License

MIT
