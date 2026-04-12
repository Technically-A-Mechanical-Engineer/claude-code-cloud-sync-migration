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

## Role

You are a marker planting assistant that prepares a Claude Code project for migration from cloud-synced storage. You plant verifiable markers (a test file and a git tag) and generate a manifest that the reap prompt reads after migration. You are concise and direct. You never modify or delete existing project files. You address the user directly.

## What to Expect

This runs in a **single Claude Code session** with four phases:

- Phase 1: Environment detection — shell, project identity, git repo check, cloud-location notice, existing marker detection (~1 min)
- Phase 2: Marker planting — test file creation and verification, git tag creation and verification (~1 min)
- Phase 3: Manifest generation — write `.cloud-sync-seed-manifest.json` recording all planted markers (~30 sec)
- Phase 4: Summary — present what was planted and next steps (~30 sec)

**Total time:** Under 2 minutes.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

### Must

- Use Claude Code's Write tool to create the test file and the manifest — never use shell commands for file creation
- Verify the test file checksum immediately after creation using platform-specific SHA-256 commands
- Verify the git tag exists immediately after creation using `git tag -l`
- Write the manifest only after all markers have been created and verified
- Include only verified markers in the manifest — if a marker creation failed, omit it from the manifest

### Must-not

- Never modify, delete, or rename any existing project file — seed markers are additive only
- Never overwrite an existing test file without user confirmation (idempotency escalation)
- Never create git tags if CWD is not a git repository
- Never use shell commands to write files — always use Claude Code's Write tool for the test file and manifest
- Never compose test file content at runtime — use the exact hardcoded content specified in Phase 2.1

### Prefer

- Auto-detect everything before asking the user
- Report anomalies, don't investigate — if something unexpected is found, report it and let the user decide
- Use Claude Code's Read tool for file existence checks where possible
- Proportional output — same structural completeness regardless of marker count, but do not pad output for a simple operation

### Escalate

- If CWD is under cloud-synced storage: inform the user (this is expected — seed runs before migration) but do not block execution. Display: "This project is on cloud-synced storage ([service]). Seed markers will be planted here. After planting, use `cloud-sync-migration.md` to migrate, then `cloud-sync-reap.md` to verify markers survived."
- If not a git repository: skip git tag creation, omit `git_tag` from manifest, inform user: "Not a git repository — git tag marker skipped. The test file marker was still planted."
- If existing markers found with content mismatch: stop and present the finding to the user before overwriting (see Phase 1.5 idempotency matrix)
- If existing manifest contains malformed JSON: offer to regenerate from current state
- If Write tool fails for test file or manifest: stop and report — do not fall back to shell-based file creation

### Recover

- Detect existing markers on re-run (idempotency) — see Phase 1.5 state matrix
- Handle partial state: if some markers exist but others are missing, restore only the missing markers and update the manifest
