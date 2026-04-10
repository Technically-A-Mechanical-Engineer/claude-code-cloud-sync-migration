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

Detect the following automatically. Do not ask the user for information you can determine from the system.

### 1.1 — OS and shell

Detect the operating system and active shell. Set the shell context for all subsequent commands using three-way detection:

| Detection | Shell Context | Deletion Tool | Utility Commands |
|---|---|---|---|
| PowerShell prompt detected (`$PSVersionTable` exists) | PowerShell | `Remove-Item -Recurse -Force` | PowerShell (Get-ChildItem, Test-Path, Measure-Object, etc.) |
| bash-on-Windows detected (`$OSTYPE` contains "msys", "mingw", or "cygwin", OR `uname -s` returns "MINGW*" or "MSYS*") | bash-on-Windows | `rm -rf` | bash (find, wc, du, stat) |
| bash/zsh on macOS or Linux (`uname -s` returns "Darwin" or "Linux") | native bash/zsh | `rm -rf` | bash (find, wc, du, stat) |

Do not mix shell syntaxes. Every command in this session must match the detected shell context.

### 1.2 — Prior cleanup detection (crash recovery)

Check CWD for `cleanup-results.md`. If found:

1. Read the log and build a set of already-deleted paths
2. Count items by category (path-hash, orphan, source)
3. Report: "Found cleanup log from a prior run. [N] items already deleted ([X] path-hash, [Y] orphan, [Z] source). Resuming from where the previous run stopped."
4. For each item in the log, verify: if the log says deleted but the item still exists on disk, flag it for re-presentation

If not found: No prior cleanup detected. Proceed normally.

### 1.3 — Migration artifact detection (mode selection)

Scan for migration artifacts in this order:

1. `migration-session-1-results.md` in CWD
2. `migration-session-2-results.md` in CWD
3. Either file at `~/Projects/` (the default migration target)

**If any artifact found: Post-migration mode.** Read the artifacts to extract:
- Migrated folder source paths
- Migrated folder target paths
- Verification results
- Path-hash directory mappings

**If no artifact found: Standalone mode.** Path-hash directories under `~/.claude/projects/` are the sole discovery source. No filesystem scanning of cloud folders.

Report the detected mode to the user.

### 1.4 — Cloud service detection

Scan for known cloud sync folder patterns under the user's home directory:

- **OneDrive / OneDrive for Business:** `$env:USERPROFILE\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `$env:USERPROFILE\Dropbox\` or `~/Dropbox`
- **Google Drive:** `$env:USERPROFILE\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

Report detected services with their recycle bin retention periods:

| Service | Retention Period |
|---|---|
| OneDrive (personal) | 30 days |
| OneDrive (business) | 93 days |
| Dropbox (Basic/Plus) | 30 days |
| Dropbox (Professional/Business) | 180 days |
| Google Drive | 30 days |
| iCloud | 30 days |

### 1.5 — Path-hash inventory and classification

Scan `~/.claude/projects/`. For each directory, decode the name, check filesystem state, and classify.

**Path-hash decoding algorithm (self-contained):**

Claude Code encodes filesystem paths as directory names by replacing path separators (`\`, `/`), drive colons (`:`), spaces, commas, and other special characters each with a single hyphen (`-`). Consecutive hyphens are NOT collapsed — they indicate adjacent special characters in the original path.

Examples:
- `C:\Users\rlasalle\Projects\Claude-Home` -> `C--Users-rlasalle-Projects-Claude-Home`
- `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\OB1` -> `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-OB1`

**Decoding approach (reverse direction):**

The encoding is lossy — multiple source characters all map to `-`. Decoding requires platform-aware heuristics:

1. The directory name starts with a drive letter pattern on Windows (`C--` = `C:\`) or a leading hyphen on macOS/Linux (`-Users-` = `/Users/`)
2. After the drive/root prefix, each `-` could be a path separator or an original hyphen in a folder name
3. To resolve ambiguity: attempt to reconstruct the path segment by segment, checking each candidate against the actual filesystem to find the longest matching prefix
4. If the fully reconstructed path exists on disk, decoding succeeds
5. If no valid path can be reconstructed, classify as "undecodable"

**Classification:** For each decoded entry, classify using this table:

| Classification | Criteria | Action Phase |
|---|---|---|
| **Stale** | Decoded path is under a cloud-synced location AND a local equivalent path-hash directory exists (pointing to a non-cloud path for the same project) | Phase 2 |
| **Orphan** | Decoded path does not exist on disk anywhere (folder was deleted, renamed, or moved without migration) | Phase 3 |
| **Valid** | Decoded path exists and is NOT under cloud-synced storage | Skip (no action needed) |
| **Undecodable** | Directory name cannot be decoded to any valid filesystem path | Phase 3 |

**Mode-specific classification behavior:**

- **Post-migration mode:** Cross-reference against migration artifact data. Entries matching migrated source paths are classified as stale with high confidence. Entries not in the artifact but pointing to cloud paths are classified based on filesystem checks.
- **Standalone mode:** Classification relies entirely on filesystem checks. When uncertain (decoded path exists but cloud status is ambiguous), classify as uncertain and ask the user.

**For each directory, also record:**
- Contents: number of memory files, whether `settings.json` exists, total size
- For undecodable entries: scan memory files and settings files inside the directory for project name references (fuzzy-match guess)

**PowerShell — gather directory contents:**
```powershell
$dir = "~/.claude/projects/[entry]"
$files = Get-ChildItem -Recurse -File -Force $dir
$memoryFiles = Get-ChildItem -Path "$dir/memory" -File -ErrorAction SilentlyContinue
$hasSettings = Test-Path "$dir/settings.json"
$size = ($files | Measure-Object -Property Length -Sum).Sum
```

**bash — gather directory contents:**
```bash
dir=~/.claude/projects/[entry]
find "$dir" -type f | wc -l
ls "$dir/memory/" 2>/dev/null | wc -l
test -f "$dir/settings.json" && echo "yes" || echo "no"
du -sh "$dir"
```

### 1.6 — Present findings and confirm

Present a summary grouped by classification:

```
Environment:
  OS: [detected]
  Shell: [PowerShell / bash-on-Windows / native bash/zsh]
  Mode: [Post-migration (artifacts found at [path]) / Standalone]

Cloud services detected:
  [service]: [sync root path] (recycle bin: [retention period])

Path-hash inventory ([total] entries):

  Stale ([n] — Phase 2):
    1. [directory name]
       Decoded: [cloud path]
       Local equivalent: [local path-hash directory name] ([n] memory files, settings.json)
       Size: [size]

  Orphan ([n] — Phase 3):
    2. [directory name]
       Decoded: [path that no longer exists]
       Contents: [n] memory files, [size]

  Undecodable ([n] — Phase 3):
    3. [directory name]
       Best guess: [fuzzy-match project name from memory files] (guess based on memory file contents)
       Contents: [n] memory files, [size]

  Valid ([n] — no action):
    - [directory name] -> [decoded local path]

  [If prior cleanup log found]:
  Previously deleted ([n] — from prior run):
    - [paths from log, with any still-on-disk flagged for re-presentation]
```

In post-migration mode, also show:
```
Migration artifacts:
  Source folders identified: [list from artifacts]
  Target paths: [list from artifacts]
  [Any discrepancies between artifacts and current state noted here]
```

Ask: "Review the inventory above. Proceed to Phase 2 (stale path-hash directories)?"

Wait for user confirmation before proceeding.

---

## Phase 2 — Stale Path-Hash Directories

Process each stale path-hash directory identified in Phase 1, one at a time. These are directories under `~/.claude/projects/` that point to cloud-synced paths and have local equivalents — they are the lowest-risk cleanup items.

### 2.1 — Verify local equivalent

Before presenting each stale entry for deletion, verify that the local equivalent path-hash directory exists and contains the expected files.

**PowerShell:**
```powershell
Test-Path "~/.claude/projects/[local-path-hash]"
(Get-ChildItem -Recurse -File -Force "~/.claude/projects/[local-path-hash]").Count
```

**bash:**
```bash
test -d ~/.claude/projects/[local-path-hash] && find ~/.claude/projects/[local-path-hash] -type f | wc -l
```

If the local equivalent does NOT exist or is empty, do not offer deletion. Report: "[entry] — local equivalent not found or empty. Skipping. The local path-hash directory may not have been created yet — launch Claude Code from the local project path first."

### 2.2 — Present verification-forward deletion dialog

For each stale entry where the local equivalent is confirmed, present:

```
Path-hash: [raw directory name]
Decoded to: [full cloud-synced path]
Local equivalent: [local path-hash directory name] (exists, [n] memory files, settings.json [present/absent])
Size: [size] ([n] memory files, settings.json, etc.)

Delete this stale path-hash directory? [y/n]
```

The verification evidence (decoded path, local equivalent confirmation) is shown ABOVE the delete prompt. The user sees proof before being asked to act.

### 2.3 — Execute deletion

On user confirmation (`y`), delete the directory:

**PowerShell:**
```powershell
Remove-Item -Recurse -Force "~/.claude/projects/[stale-path-hash]"
```

**bash-on-Windows / macOS / Linux:**
```bash
rm -rf ~/.claude/projects/[stale-path-hash]
```

After deletion, verify the directory no longer exists:

**PowerShell:** `Test-Path "~/.claude/projects/[stale-path-hash]"` should return `False`

**bash:** `test -d ~/.claude/projects/[stale-path-hash]` should fail (non-zero exit)

If deletion fails (permission error, locked files), stop and report: "Deletion failed for [entry]: [error message]. Close any editors or Claude Code sessions that may have handles on files in this directory, then try again."

### 2.4 — Log the deletion

Immediately after each successful deletion, append a row to `cleanup-results.md` in CWD.

If the file does not exist yet, create it with this header:

```markdown
# Cleanup Results
**Generated by:** cloud-sync-cleanup.md v1.0.0
**Started:** [timestamp]

| Timestamp | Category | Path Deleted | Verification |
|-----------|----------|-------------|--------------|
```

Then append a deletion row:
```
| [ISO timestamp] | path-hash | ~/.claude/projects/[stale-path-hash] | Local equivalent confirmed: [local-path-hash] ([n] files) |
```

If the user declines (`n`), append a skip entry:
```
| [ISO timestamp] | path-hash | ~/.claude/projects/[stale-path-hash] | SKIPPED by user |
```

### 2.5 — Phase 2 summary and gate

After all stale entries have been processed, present a summary:

```
Phase 2 complete:
  [n] stale path-hash directories deleted
  [n] skipped by user
  [n] skipped (local equivalent not found)
```

Ask: "Proceed to Phase 3 (orphan and undecodable path-hash directories)?"

If there were no stale entries to process, report: "No stale path-hash directories found. Proceeding to Phase 3." and move to the confirmation gate.

Wait for user confirmation before proceeding.

---

## Phase 3 — Orphan and Undecodable Path-Hash Directories

Process each orphan and undecodable path-hash directory identified in Phase 1, one at a time. These are directories under `~/.claude/projects/` where the decoded path no longer exists on disk, or the directory name cannot be decoded. Deleting these removes Claude Code memory and settings for projects that are no longer accessible from their original paths.

### 3.1 — Gather context for each entry

For each orphan or undecodable entry, gather:

1. **Raw directory name** (always available)
2. **Decoded path** (for orphans — the path that no longer exists on disk)
3. **Contents summary:**

**PowerShell:**
```powershell
$dir = "~/.claude/projects/[entry]"
$files = Get-ChildItem -Recurse -File -Force $dir
$memoryFiles = Get-ChildItem -Path "$dir/memory" -File -ErrorAction SilentlyContinue
$hasSettings = Test-Path "$dir/settings.json"
$size = ($files | Measure-Object -Property Length -Sum).Sum
```

**bash:**
```bash
dir=~/.claude/projects/[entry]
find "$dir" -type f | wc -l
ls "$dir/memory/" 2>/dev/null | wc -l
test -f "$dir/settings.json" && echo "yes" || echo "no"
du -sh "$dir"
```

4. **Fuzzy-match guess (undecodable entries only):** Read memory files and settings files inside the directory. Search for project name references, path fragments, or identifiable strings. Present the best guess explicitly labeled as a guess.

### 3.2 — Present deletion dialog (orphan entries — decoded path known)

For each orphan entry where the decoded path is known but no longer exists on disk:

```
Path-hash: [raw directory name]
Decoded to: [path that no longer exists on disk]
Note: This path no longer exists. Deleting removes Claude Code memory/settings for this project.
Contents: [n] memory files, settings.json [present/absent], [total size]

Delete this orphan path-hash directory? [y/n]
```

### 3.3 — Present deletion dialog (undecodable entries — decoded path unknown)

For each undecodable entry where the directory name cannot be mapped to a valid filesystem path:

```
Path-hash: [raw directory name]
Cannot decode: This directory name does not map to any valid filesystem path.
Best guess: "[project name extracted from memory files]" (guess based on memory file contents)
Contents: [n] memory files, settings.json [present/absent], [total size]

Memory file excerpts:
  [First 2-3 lines of the most recent memory file, or "No memory files found"]

Delete this undecodable path-hash directory? [y/n]
```

If memory files provide no useful context and the directory name provides no clues, note: "Unable to determine what project this directory belongs to. Contents are [n] files totaling [size]. Inspect manually if unsure."

### 3.4 — Execute deletion

Same as Phase 2.3 — use platform-specific deletion command:

**PowerShell:**
```powershell
Remove-Item -Recurse -Force "~/.claude/projects/[entry]"
```

**bash-on-Windows / macOS / Linux:**
```bash
rm -rf ~/.claude/projects/[entry]
```

After deletion, verify the directory no longer exists:

**PowerShell:** `Test-Path "~/.claude/projects/[entry]"` should return `False`

**bash:** `test -d ~/.claude/projects/[entry]` should fail (non-zero exit)

If deletion fails (permission error, locked files), stop and report: "Deletion failed for [entry]: [error message]. Close any editors or Claude Code sessions that may have handles on files in this directory, then try again."

### 3.5 — Log the deletion

Same incremental logging pattern as Phase 2.4. Append to `cleanup-results.md` in CWD.

For orphan deletions:
```
| [ISO timestamp] | orphan | ~/.claude/projects/[entry] | Decoded path no longer exists: [decoded path] |
```

For undecodable deletions:
```
| [ISO timestamp] | orphan | ~/.claude/projects/[entry] | Undecodable. Best guess: [guess or "none"] |
```

For skipped entries:
```
| [ISO timestamp] | orphan | ~/.claude/projects/[entry] | SKIPPED by user |
```

### 3.6 — Phase 3 summary and gate

After all orphan and undecodable entries have been processed, present a summary:

```
Phase 3 complete:
  [n] orphan path-hash directories deleted
  [n] undecodable path-hash directories deleted
  [n] skipped by user

Phases 2-3 summary:
  Total path-hash directories deleted: [n]
  Total skipped: [n]
  Remaining valid entries: [n]
```

Ask: "Proceed to Phase 4 (source folders on cloud storage)? This is the highest-risk phase — each folder requires full verification before deletion."

If there were no orphan or undecodable entries, report: "No orphan or undecodable path-hash directories found." and proceed to the confirmation gate.

Wait for user confirmation before proceeding.

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
