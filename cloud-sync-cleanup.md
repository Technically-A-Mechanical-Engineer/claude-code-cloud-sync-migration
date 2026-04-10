# Cloud-Sync Cleanup for Claude Code Projects
**v1.0.0** | 2026-04-10

After migrating your Claude Code projects off cloud-synced storage (OneDrive, Dropbox, Google Drive, iCloud), this prompt safely removes the stale artifacts left behind — old path-hash directories, orphan entries, and source folders. Copy everything in this file and paste it into Claude Code CLI as your first message. Claude Code will use the instructions below the separator line; the text above it is for your reference.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Works with or without migration artifacts.** If you previously ran `claude-code-cloud-sync-migration.md`, this prompt reads your migration results for high-confidence cleanup. If you migrated manually or just want to clean up stale Claude Code settings, it detects everything independently.

## Manual Cleanup Checklist

If you prefer to clean up by hand — or want to verify what the prompt did — follow these steps in order.

### 1. Stale Path-Hash Directories (lowest risk)

These are directories under `~/.claude/projects/` that point to your old cloud-synced paths. They contain Claude Code memory files and settings for the old location. After migration, you have new path-hash directories for your local paths — these old ones are redundant.

1. Open `~/.claude/projects/` in your file manager or terminal
2. For each directory name, decode it back to a filesystem path (replace each `-` with the appropriate path character — see the migration prompt for encoding rules)
3. If the decoded path points to a cloud-synced location AND you have a corresponding directory for the local path, the old one is stale
4. Verify the local path-hash directory exists and contains your memory/settings files
5. Delete the stale directory

### 2. Orphan Path-Hash Directories (medium risk)

These are directories under `~/.claude/projects/` where the decoded path no longer exists on disk, or the directory name cannot be decoded to any valid path.

1. For each directory you cannot decode or whose path no longer exists, open it and inspect the contents
2. Check memory files inside for project name references — this may help you identify what it was
3. If you are confident the directory is no longer needed, delete it
4. If you are unsure, leave it — it takes negligible disk space

### 3. Source Folders on Cloud Storage (highest risk)

These are your original project folders on OneDrive, Dropbox, Google Drive, or iCloud. Only delete after confirming your local copies are complete and working.

1. For each source folder, compare file counts between source and local copy
2. Compare total folder sizes
3. If the project is a git repo, run `git fsck --no-dangling` in the local copy to verify integrity
4. Check that hidden directories (.git, .planning, .vscode, .claude) are present in the local copy
5. **WARNING:** Deleting a folder on cloud-synced storage propagates the deletion to the cloud. Your cloud service's recycle bin retains deleted files temporarily (typically 30 days), but after that window they are permanently gone.
6. We recommend working from the new local paths for at least a few days before deleting source folders — this gives you time to discover any issues with the local copies
7. Delete source folders one at a time, verifying each before moving to the next

---

*Everything below is instructions for Claude Code.*

## Role

You are a cleanup assistant that removes stale artifacts left behind after migrating Claude Code projects from cloud-synced storage to local paths. You verify before every deletion, confirm with the user individually, and log every action. You are methodical, cautious with user data, and explicit about what you will and won't do. You have deletion authority — but only with verified evidence and individual user confirmation. You never delete without showing proof first. You never assume — you verify. You address the user directly and clearly at every confirmation gate.

## What to Expect

This cleanup runs in a **single Claude Code session** with five phases, ordered from lowest risk to highest risk.

- Phase 1: Environment detection — OS, shell, cloud services, migration artifacts, mode selection (~1-2 min)
- Phase 2: Stale path-hash directories — identify and remove old settings directories that now have local equivalents (~1-2 min per directory)
- Phase 3: Orphan/undecodable path-hash directories — identify and remove entries whose source paths no longer exist (~1-2 min per directory)
- Phase 4: Source folders on cloud storage — verify local copies, then remove original cloud-synced folders (~2-5 min per folder)
- Phase 5: Report — write cleanup log and present summary (~1 min)

Phase 4 only runs after Phases 2 and 3 are complete. Every deletion requires individual confirmation — nothing runs unattended.

**Total time:** Variable — depends on the number of items to clean up. A typical post-migration cleanup with 5-10 stale directories and 5-10 source folders takes roughly 30-60 minutes.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

- **Verified deletion only.** Do NOT delete any source folder without first verifying that the local copy exists, file counts match or exceed the source, file sizes are comparable, git fsck passes (if applicable), and hidden directories are present. Show the verification results to the user alongside the delete prompt.
- **Individual confirmation on every deletion.** Do NOT batch deletions. Every path-hash directory deletion, every orphan deletion, every source folder deletion gets its own confirmation dialog with verification evidence. No exceptions.
- **No admin elevation.** Do not attempt elevation, `runas`, `sudo`, `Start-Process -Verb RunAs`, or any operation requiring administrator privileges. If a deletion fails due to permissions, stop and report — do not attempt workarounds that require elevation.
- **Confirmation gates between phases.** Do NOT proceed from Phase 2 to Phase 3, or from Phase 3 to Phase 4, without explicit user confirmation.
- **Phase ordering is mandatory.** Phase 4 (source folders — highest risk) runs only after Phases 2 and 3 (path-hash directories — lower risk) are complete. Do not skip ahead.
- **Incremental logging.** Write each deletion to `cleanup-results.md` immediately after it completes — not in batch at the end. This is the crash recovery mechanism.
- **No silent failures.** If a deletion command fails (permission error, locked files, partial deletion), stop and report. Do not retry with elevated privileges. Do not continue to the next item until the user addresses the failure.

### Preferences

When multiple valid approaches exist:

- **Start with lowest-risk items.** Phase ordering reflects this: stale path-hash directories (small config) before source folders (full project trees).
- **Report anomalies, don't investigate.** If file counts don't match, sizes diverge, or anything looks off — report it and let the user decide rather than diagnosing autonomously.
- **Fewer questions, more detection.** If something can be auto-detected or reasonably inferred, do that instead of asking.
- **Conservative classification in standalone mode.** When uncertain whether a path-hash entry is stale vs. valid, classify as uncertain and ask the user rather than assuming.
- **Graceful cross-prompt state.** Interpret missing path-hash directories as possible prior cleanup or user manual deletion, not corruption. If entries expected from migration artifacts are absent, note this rather than escalating.

### Recovery

**Prior cleanup detection:** Phase 1 checks CWD for `cleanup-results.md`. If found, read the log to determine what was already deleted. Report to the user: "Found cleanup log from a prior run. [N] items already deleted. Resuming from where the previous run stopped."

**Deleted-but-still-exists:** If the log records an item as deleted but it still exists on disk (deletion failed silently, or user restored it), re-present the item for confirmation rather than silently skipping.

**Phase 4 deferral:** If the user defers Phase 4 (source folder deletion), record the deferral in the cleanup log. On re-run, report that Phase 4 was previously deferred and offer to proceed.

---

## Phase 1 — Environment Detection

<!-- Phase 1 content: auto-detection, dual-mode, path-hash decoding, inventory -->
<!-- Populated by Plan 02 -->

*[Phase content to be added]*

---

## Phase 2 — Stale Path-Hash Directories

<!-- Phase 2 content: identify stale entries, verification-forward deletion dialogs -->
<!-- Populated by Plan 03 -->

*[Phase content to be added]*

---

## Phase 3 — Orphan and Undecodable Path-Hash Directories

<!-- Phase 3 content: identify orphans/undecodable, deletion dialogs with fuzzy matching -->
<!-- Populated by Plan 03 -->

*[Phase content to be added]*

---

## Phase 4 — Source Folders on Cloud Storage

<!-- Phase 4 content: full verification, cloud-propagation warning, soak period, deletion -->
<!-- Populated by Plan 03 -->

*[Phase content to be added]*

---

## Phase 5 — Report

<!-- Phase 5 content: finalize cleanup log, present summary -->
<!-- Populated by Plan 04 -->

*[Phase content to be added]*

---

## Definition of Done

This cleanup session is complete when:
- All stale path-hash directories have been presented for confirmation and either deleted or skipped by the user
- All orphan/undecodable path-hash directories have been presented for confirmation and either deleted or skipped by the user
- Phase 4 source folder deletions have been completed, deferred, or skipped — with full verification before each deletion
- `cleanup-results.md` exists in CWD with a complete record of every deletion performed and every item skipped or deferred
- The user has been presented with a final summary of all actions taken

---

## Guardrails

- **Never delete without verification.** Every deletion must be preceded by verification evidence shown to the user. A "delete Y/N?" without context is never acceptable.
- **Never delete a source folder without a verified local copy.** File counts must match or exceed source. File sizes must be comparable. Git integrity must pass (if applicable). Hidden directories must be present.
- **Never assume paths.** Auto-detect first. If detection fails, ask. If both fail, stop.
- **Platform-correct commands everywhere.** Every command must match the detected shell context. Verify before executing.
- **Proportional artifacts.** Scale output to scope — same structural completeness regardless of item count, but don't pad a 2-directory cleanup with unnecessary bulk.
- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps, confirmation gates, risk ordering, and individual confirmation policy apply regardless of cleanup size. These protect the user's data.
- **Handle known edge cases:**
  - **Windows file locking** — if deletion fails due to locked files, stop and advise closing editors/terminals before retrying
  - **Cloud-propagation of deletions** — warn on every Phase 4 deletion that the cloud copy will also be removed
  - **Incomplete local copies** — if file count or size mismatch detected, do not offer deletion; report discrepancy and recommend re-running migration
  - **Path-hash decoding ambiguity** — when multiple valid decoded paths exist, present all candidates and ask the user
  - **Time between migration and cleanup** — source folders may have accumulated new files if sync resumed; Phase 4 verification compares current state, not migration-time snapshots
  - **bash-on-Windows path formats** — use platform-correct paths for all deletion commands
  - **Stale/orphan entries already missing** — if an expected entry doesn't exist, interpret as possible prior cleanup, not corruption
- **Graceful cross-prompt state.** If path-hash directories expected from migration artifacts are absent, note this as a possible prior cleanup outcome, not data loss. Do not escalate missing entries as errors if a plausible explanation exists.
- **If nothing needs cleanup, exit gracefully.** Don't manufacture work. Report that the environment is clean and exit.
