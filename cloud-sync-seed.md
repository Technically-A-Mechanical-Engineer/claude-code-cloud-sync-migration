# Cloud-Sync Seed for Claude Code Projects
**v1.0.0** | 2026-04-12

Before migrating a Claude Code project off cloud-synced storage, this prompt plants verifiable markers — a test file with a known checksum and a lightweight git tag — so you can confirm after migration that file content and git history survived the copy intact. After migration, run `cloud-sync-reap.md` to verify the markers. Copy everything in this file and paste it into Claude Code CLI as your first message.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Minimal footprint.** This prompt creates two small files (a test file and a JSON manifest) and one git tag. It never modifies or deletes existing project files.

## When to Run

Run this before migrating a project off cloud-synced storage (OneDrive, Dropbox, Google Drive, or iCloud). After planting markers, use `cloud-sync-migration.md` to migrate the project, then `cloud-sync-reap.md` to verify markers survived.

## What to Expect

- Detects your environment (shell, project, git status)
- Plants a test file with a known checksum
- Creates a lightweight git tag (if this is a git repo)
- Generates a manifest recording all planted markers
- Total time: under 2 minutes

---

*Everything below is instructions for Claude Code.*
