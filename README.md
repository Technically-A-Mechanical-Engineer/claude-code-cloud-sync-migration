# LocalGround Toolkit for Claude Code

A five-prompt toolkit that helps Claude Code users migrate off cloud-synced storage — with pre-migration verification, migration, post-migration health checks, cleanup, and environment auditing. Each prompt is a single markdown file. Copy the entire file and paste it into Claude Code CLI.

## The Problem

Working in cloud-synced folders (OneDrive, Dropbox, Google Drive, iCloud) causes git errors, file lock failures, and sync conflicts in Claude Code. These services try to sync `.git` internals and Claude Code's settings directories, which breaks things in ways that are hard to diagnose.

## The Toolkit

| Order | Prompt | File | What It Does | When to Run |
|-------|--------|------|-------------|-------------|
| 1 | **Seed** | [`localground-seed.md`](localground-seed.md) | Plants verifiable markers (test file + git tag) in a project before migration. | Before migrating — plant markers to verify copy integrity later. |
| 2 | **Migration** | [`localground-migration.md`](localground-migration.md) | Copies project folders from cloud storage to local paths. Never deletes originals. Two-session design. | When you're ready to move off cloud storage. |
| 3 | **Reap** | [`localground-reap.md`](localground-reap.md) | Verifies seed markers survived the copy and runs six health checks on the migrated project. | After migration — confirms everything survived intact. |
| 4 | **Cleanup** | [`localground-cleanup.md`](localground-cleanup.md) | Removes stale path-hash directories, orphan entries, and source folders after migration. | After you've confirmed the migration is good. |
| 5 | **Verification** | [`localground-verification.md`](localground-verification.md) | Audits project health, path-hash integrity, and stale references. Read-only. | Any time — before migration, after migration, after cleanup. |

Each prompt works independently. Seed and Reap are designed as a pair but neither requires the other. The remaining three prompts function standalone.

## Who This Is For

Claude Code users whose projects are in OneDrive, Dropbox, Google Drive, or iCloud-synced folders — or who have already migrated and want to verify health or clean up what's left behind.

## Requirements

- **Claude Code CLI** (terminal or IDE extension). This toolkit does not work in claude.ai web, Claude desktop app, or Cowork mode.
- **Platform:** Windows (PowerShell or Git Bash), macOS (zsh/bash), or Linux (bash)
- **git** installed and available in your shell

## MCP Server (v3.0.0)

Add the LocalGround MCP server to Claude Code to invoke all operations as native tool calls.

### Installation

**macOS / Linux:**
```bash
claude mcp add --transport stdio localground -- npx -y @localground/mcp
```

**Windows (PowerShell or Command Prompt):**
```bash
claude mcp add --transport stdio localground -- cmd /c npx -y @localground/mcp
```

> **Windows users:** The `cmd /c` prefix is required. Without it, Claude Code cannot spawn `npx` on Windows because `npx` is a batch script (`.cmd` file), not a native executable. This is the most common setup failure on Windows — do not omit it.

### Available Tools

After registration, Claude Code can call these tools directly:

| Tool | Operation | Read-only? |
|------|-----------|------------|
| `localground_detect` | Detect OS, shell, cloud service, projects, path-hashes | Yes |
| `localground_decode_path_hash` | Decode a `.claude/projects/` directory name to a filesystem path | Yes |
| `localground_seed` | Plant verifiable markers before migration | No |
| `localground_copy` | Copy a project directory with chunked operation and verification | No |
| `localground_verify` | Verify seed markers against manifest | Yes |
| `localground_health_check` | Run 6 health checks on a project (git, placeholders, cloud sync, path-hashes, seed markers, source/target alignment) | Yes |
| `localground_audit` | Environment-wide read-only audit with incremental findings | Yes |
| `localground_cleanup_scan` | Identify stale/orphan/source candidates without deleting | Yes |
| `localground_placeholder_check` | Detect cloud placeholder files in a directory | Yes |

## How to Use (v2.0.0 Prompts)

### Seed (optional — before migration)

1. Download [`localground-seed.md`](localground-seed.md)
2. Open Claude Code CLI from the project you plan to migrate
3. Copy the entire contents of the file and paste it as your first message
4. The prompt plants a test file and git tag that the Reap prompt can verify after migration

### Migration

1. Download [`localground-migration.md`](localground-migration.md)
2. Open Claude Code CLI from your current (cloud-stored) project folder: `claude --dangerously-skip-permissions` (recommended — avoids cancelled tool calls during parallel file operations; see the migration prompt for details)
3. Copy the entire contents of the file and paste it as your first message
4. Follow the prompts — Session 1 copies folders, Session 2 migrates settings

### Reap (after migration)

1. Download [`localground-reap.md`](localground-reap.md)
2. Open Claude Code CLI from the migrated project's new local folder
3. Copy the entire contents of the file and paste it as your first message
4. The prompt checks for seed markers and runs six health checks — results are reported with pass/fail evidence

### Cleanup (after confirming migration)

1. Download [`localground-cleanup.md`](localground-cleanup.md)
2. Open Claude Code CLI from your local project folder
3. Copy the entire contents of the file and paste it as your first message
4. The prompt works with or without migration artifacts — it detects everything independently

### Verification (audit at any time)

1. Download [`localground-verification.md`](localground-verification.md)
2. Open Claude Code CLI from your local project folder
3. Copy the entire contents of the file and paste it as your first message
4. Review the traffic light summary and findings — each finding includes a plain-language explanation and recommended next step

## Platform Support

- Windows (PowerShell / Git Bash)
- macOS (zsh/bash)
- Linux (bash)

All five prompts use three-way shell detection to provide platform-correct commands throughout.

## Documentation

| File | Purpose |
|------|---------|
| [`docs/dev-status/dev-status-seed.md`](docs/dev-status/dev-status-seed.md) | Seed prompt build summary, NEC evaluation, testing plan |
| [`docs/dev-status/dev-status-migration.md`](docs/dev-status/dev-status-migration.md) | Migration prompt version history, test results, findings |
| [`docs/dev-status/dev-status-reap.md`](docs/dev-status/dev-status-reap.md) | Reap prompt build summary, NEC evaluation, testing plan |
| [`docs/dev-status/dev-status-cleanup.md`](docs/dev-status/dev-status-cleanup.md) | Cleanup prompt build summary, NEC evaluation, testing plan |
| [`docs/dev-status/dev-status-verification.md`](docs/dev-status/dev-status-verification.md) | Verification prompt build summary, NEC evaluation, testing plan |
| [`docs/evaluations/prompt-evaluation-seed.md`](docs/evaluations/prompt-evaluation-seed.md) | Seed prompt NEC framework evaluation |
| [`docs/evaluations/prompt-evaluation-migration.md`](docs/evaluations/prompt-evaluation-migration.md) | Migration prompt eight-framework NEC evaluation |
| [`docs/evaluations/prompt-evaluation-reap.md`](docs/evaluations/prompt-evaluation-reap.md) | Reap prompt NEC framework evaluation |
| [`docs/evaluations/prompt-evaluation-cleanup.md`](docs/evaluations/prompt-evaluation-cleanup.md) | Cleanup prompt NEC framework evaluation |
| [`docs/evaluations/prompt-evaluation-verification.md`](docs/evaluations/prompt-evaluation-verification.md) | Verification prompt NEC framework evaluation |

## Design Principles

- **Safety first.** Migration never deletes. Cleanup deletes only with individual confirmation and verified local copy. Verification never modifies.
- **Verifiable migration.** Seed markers planted before migration are verified after — no trust, only evidence.
- **Auto-detect first, ask second.** If it can be determined from the filesystem, the prompt doesn't ask.
- **One file, one paste.** No installation, no dependencies, no plugins. Copy the entire file and paste it into Claude Code.
- **Platform-correct commands.** Three-way shell detection ensures the right commands for your environment.
- **Graceful coexistence.** Each prompt interprets missing artifacts as possible prior cleanup, not corruption.

## License

MIT
