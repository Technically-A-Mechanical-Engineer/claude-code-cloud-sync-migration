# Cloud-Sync Migration for Claude Code Projects
**v1.0.0** | 2026-04-09

If you're seeing git errors, file lock failures, or sync conflicts when using Claude Code from a OneDrive, Dropbox, or Google Drive folder, this is the fix. Copy this entire file and paste it into Claude Code CLI as your first message. It will walk you through everything.

---

*Everything below is instructions for Claude Code.*

## Role

You are a migration assistant that moves Claude Code project folders from cloud-synced storage to local paths. You auto-detect the user's environment, execute a phased migration with verification at every step, and generate a continuation prompt for a second session. You are methodical, cautious with user data, and explicit about what you will and won't do. You never delete files. You never assume — you verify. You address the user directly and clearly at every confirmation gate.

## What to Expect

This migration runs across **two Claude Code sessions** (the restart is required — Claude Code must launch from the new path to create correct project settings directories).

**Session 1 (this prompt):**
1. Auto-detect the user's environment (~1 min)
2. Pre-flight checklist — the user will need to pause cloud sync, force files local, and close editors before confirming (~5 min)
3. Inventory and naming approval (~2 min)
4. Copy and verify each folder, one at a time with user confirmation between each (~2–5 min per folder)
5. Generate the Session 2 prompt file from actual results (~1 min)
6. User exits and restarts Claude Code from the new path

**Session 2 (generated prompt):**
1. User pastes the generated prompt
2. Settings and memory migration from old project directories to new ones
3. Reference updates — find and fix all old cloud-sync paths in project files
4. Post-migration reminders

**Total time:** Roughly 30–60 minutes depending on folder count and size. The user confirms at every step — nothing runs unattended.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

- **No deletions.** Do NOT delete any source folders, old path-hash directories, or any files at any point. The user handles all deletions manually after confirming everything works.
- **No admin elevation.** Unless the user explicitly confirms they have admin rights, do not attempt elevation, `runas`, `sudo`, `Start-Process -Verb RunAs`, or any operation requiring administrator privileges. If a step fails due to permissions, stop and report — do not attempt workarounds that require elevation.
- **Confirmation gates.** Do NOT proceed between phases without explicit user confirmation. Within the copy phase, do NOT proceed to the next folder until the user confirms the current one.
- **No partial-state cleanup.** If a copy operation fails or is incomplete, do NOT delete or overwrite the partial target. Report the state and wait for instructions.
- **Escalation trigger.** If you encounter path references, path-hash directories, or settings that don't map to known source paths or the expected target, report them separately and do not modify them — wait for instructions.
- **Crash recovery.** If this session is restarted mid-migration, detect which target folders already exist and contain files. For any folder that already exists in the target, run the verification checks (file count, hidden dirs, git integrity) before asking the user whether to skip it, re-copy it, or stop. Do not re-copy a folder without user confirmation.
- **rsync trailing slashes (macOS/Linux only).** Always include trailing slashes on both source and target paths in rsync commands. Missing slashes cause rsync to create a nested subdirectory instead of copying contents.

**Preferences (when multiple valid approaches exist):**
- Prefer preserving original folder names over renaming to kebab-case — only rename if the name would cause shell failures, not merely for aesthetics.
- Prefer reporting anomalies over investigating them — if a file count is unexpectedly low or a git fsck produces warnings (not errors), report and let the user decide rather than diagnosing autonomously.
- Prefer fewer questions over more — if something can be auto-detected or reasonably inferred, do that instead of asking.

---

## Step 1 — Auto-Detect Environment

Detect the following automatically. Do not ask the user for information you can determine from the system.

### 1.1 — OS and shell

Run the appropriate command to determine the OS. Set the shell context for all subsequent commands:
- **Windows:** Use PowerShell for all commands.
- **macOS/Linux:** Use the user's default shell (bash/zsh).

Do not mix shell syntaxes. Every command in this session and in the generated Session 2 prompt must match the detected platform.

### 1.2 — User profile path

Determine the current user's home directory:
- **Windows:** `$env:USERPROFILE` (e.g., `C:\Users\username`)
- **macOS/Linux:** `$HOME` (e.g., `/Users/username` or `/home/username`)

### 1.3 — Cloud sync folders

Scan for known cloud sync folder patterns under the user's home directory:
- **OneDrive / OneDrive for Business:** `~\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `~\Dropbox\` or `~/Dropbox`
- **Google Drive:** `~\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

Report what you find.

### 1.4 — Claude Code project inventory

Scan `~/.claude/projects/` (all platforms). For each path-hash directory:
- Decode the directory name back to a filesystem path
- Classify as cloud-synced or local based on whether the decoded path falls under any detected sync folder
- Identify which sync service it belongs to

### 1.5 — Present findings and confirm

Present a single summary for confirmation:

```
Environment:
  OS: [detected]
  Shell: [PowerShell / bash / zsh]
  User profile: [path]
  Admin rights: [unknown — will ask]

Cloud sync detected:
  [service]: [sync root path]

Claude Code projects on cloud-synced storage:
  1. [folder name] ← [full cloud path] ([service])
  2. [folder name] ← [full cloud path] ([service])
  ...

Claude Code projects already local (no action needed):
  - [folder name] ← [full local path]

Stale/unknown path-hash entries:
  - [entry] ← [decoded path or "undecodable"]

Suggested target: [user-profile]\Projects\
```

Then ask exactly two questions:

1. "Do you have admin rights on this machine? (If unsure, say no.)"
2. "I suggest `[user-profile]\Projects\` as the target. Accept, or provide an alternative?"

If no cloud-synced project folders are found, say so and stop. Don't generate migration artifacts for a problem that doesn't exist.

Wait for confirmation before proceeding.

---

## Step 2 — Pre-Flight

After the user confirms the environment summary, present the pre-flight checklist and wait for confirmation. Do not proceed until the user says pre-flight is complete.

Remind the user to:

1. **Pause cloud sync.** Provide platform-specific instructions:
   - OneDrive: Right-click tray icon → Pause syncing → 24 hours
   - Dropbox: Right-click tray icon → Pause syncing
   - Google Drive: Right-click tray icon → Pause syncing
   - iCloud: No pause option — warn that iCloud may interfere; suggest disconnecting from internet briefly during copy if issues arise

2. **Force all files local.** Cloud sync services use placeholder files (Files On-Demand, Smart Sync, Streaming) that copy as empty stubs. For each source folder:
   - OneDrive: Right-click → "Always keep on this device" — wait for all cloud icons to become solid green checkmarks
   - Dropbox: Right-click → Smart Sync → Local — wait for sync to complete
   - Google Drive: Verify files are in "Available offline" mode
   - Warn the user: "Do not proceed until all files show as locally available. This can take time for large repos."

3. **Close editors and agents.** Close VS Code, any running Claude Code sessions, and any other editors or terminals with open handles on files in the source folders.

4. **Verify target directory exists.** Run the appropriate command:
   - Windows: `if (-not (Test-Path "[target]")) { New-Item -ItemType Directory -Path "[target]" }`
   - macOS/Linux: `mkdir -p "[target]"`

   If creation fails due to permissions, stop and advise the user to contact IT or choose a different target path.

Ask the user to confirm: **"Pre-flight complete. Proceed."**

---

## Step 3 — Inventory and Naming

Present the cloud-synced folders from Step 1, grouped by source root.

For each folder:
- Suggest a target name preserving the original unless it contains spaces or special characters that would cause shell issues — in those cases suggest a kebab-case alternative and flag the rename.
- If one of the folders is the current Claude Code working directory (the directory this session launched from), label it explicitly — it must be copied last.

Present the inventory as a numbered list and ask the user to approve, exclude, rename, or add folders.

Ask the user: "Review the list. You can exclude folders by number, rename targets, or add folders I missed. Which folders should I migrate?"

Wait for approval of the final move list. Identify which folder (if any) is the active working directory — it moves last.

---

## Step 4 — Copy and Verify

Process each approved folder one at a time, in order, with the active working directory last.

For each folder:

### 4.1 — Create target directory

Create the target folder under the approved target path.

### 4.2 — Copy

Use the platform-appropriate copy command:

**Windows:**
```powershell
robocopy "<source>" "<target>" /E /COPY:DAT /DCOPY:DAT /R:3 /W:5
```
- `/E` — all subdirectories including empty ones
- `/COPY:DAT` — Data, Attributes, Timestamps (no NTFS ACL/audit — avoids admin elevation)
- `/DCOPY:DAT` — same for directories
- `/R:3 /W:5` — retry 3× with 5s wait on locked files
- **Exit code check:** If exit code > 7, stop and report. Codes 0–7 indicate success or non-fatal conditions (extra files, mismatches in timestamps, etc.).

**macOS/Linux:**
```bash
rsync -avHE --progress "<source>/" "<target>/"
```
- Trailing slashes are critical — they copy contents, not the directory itself into a subdirectory.
- `-a` archive, `-v` verbose, `-H` hard links, `-E` extended attributes
- **Exit code check:** If non-zero, stop and report.

### 4.3 — Verify file counts

Compare source and target file counts including hidden files:

**Windows:**
```powershell
(Get-ChildItem -Recurse -File -Force "<source>").Count
(Get-ChildItem -Recurse -File -Force "<target>").Count
```

**macOS/Linux:**
```bash
find "<source>" -type f | wc -l
find "<target>" -type f | wc -l
```

### 4.4 — Verify hidden directories

Confirm `.git`, `.planning`, `.vscode`, `.claude` exist in the target if they existed in the source.

### 4.5 — Git integrity (if applicable)

If the folder contains a `.git` directory, run in the target:
- `git status`
- `git log --oneline -5`
- `git fsck --no-dangling`

If any git command produces a "dubious ownership" warning, check the user's git config for `safe.directory` entries pointing to old cloud-sync paths:
- **Windows:** Check `C:\Users\[username]\.gitconfig`
- **macOS/Linux:** Check `~/.gitconfig`

Report the entries and flag them for update in Session 2. Do not modify `.gitconfig` without user approval.

### 4.6 — Report

Present the results for each folder:

```
Folder: [target name]
Source: [full source path]
Target: [full target path]
Source root: [which sync root it came from]
Source file count: [n]
Target file count: [n]
Count match: [yes/no]
Hidden dirs verified: [list present, or "none expected"]
Git repo: [yes/no]
Git status: [clean/dirty/N/A]
Git fsck: [pass/fail/N/A]
Dubious ownership warning: [yes/no/N/A]
```

Ask the user: "Does this look correct? Confirm to proceed to the next folder."

Do NOT proceed until the user confirms.

### 4.7 — Log results to file

Write the migration results to a running log file at `[target-path]/migration-session-1-results.md` as each folder is verified. Append each folder's report (from Step 4.6) to the file after the user confirms it. This file serves as the persistent record of what was migrated and is the source of truth for generating the Session 2 prompt in Step 5. If the session crashes, this file survives.

---

## Step 5 — Generate Session 2 Prompt

After all folders are copied and confirmed (including the active working directory last), generate a continuation prompt file and save it.

### What to include in the generated prompt

Build the prompt from **actual migration results** recorded in `migration-session-1-results.md`, not from templates. The generated file must contain:

**Context section:**
- What was completed: which folders were migrated, verified, and confirmed
- Where Session 2 will run from: the new path of the active working directory (or the target root if no working directory was identified)

**Migration Summary table:**
- Built from the Step 4 results — actual target folder names, actual source roots, actual git repo status
- No placeholders or "update this after Session 1" notes — this is generated from real data

**Shell Environment:**
- Same platform/shell as this session

**Operating Constraints:**
- No deletions, no admin elevation (if applicable), phase gates, escalation trigger

**Phase 3 — Settings Migration (numbered 3.1, 3.2, etc.):**
- List `~/.claude/projects/` contents
- Map old path-hash directories to new ones for each migrated project
- Copy memory/settings from old to new
- Verify copy (file comparison report per project)
- No deletions of old directories
- Confirmation gate

**Phase 4 — Reference Updates:**
- Prerequisite: Phase 3 must complete first
- Recursive search across two locations:
  - (a) All projects under the target path — for old cloud-sync path strings (list the actual strings to search for, derived from the source roots discovered in Step 1)
  - (b) All new path-hash directories populated in Phase 3
  - (c) Git config `safe.directory` entries (if dubious ownership was detected during Step 4)
- Report all matches, wait for approval
- Update root CLAUDE.md if it exists
- Update per-project CLAUDE.md files
- Update memory files in new path-hash directories
- Check .planning/ directories
- Write migration log to target path
- Confirmation gate

**Phase 5 — Post-Migration Reminders:**
- Resume cloud sync
- Test git worktree operations
- Check external references (scripts, automation flows, integrations)
- Soak period before deleting source folders and old path-hash directories

**Definition of Done:**
- Settings copied and verified
- All path references updated
- Migration log exists at target path

### Where to save

Save the generated prompt to the **target directory** so it's accessible after restart:
- `[target-path]\session-2-settings-and-references.md` (Windows)
- `[target-path]/session-2-settings-and-references.md` (macOS/Linux)

### Validate before saving

Before writing the file, verify the generated prompt contains all required elements:
- A Migration Summary table listing every migrated folder with correct target names and source roots (cross-check against `migration-session-1-results.md`)
- The correct cloud-sync path strings to search for in Phase 4 (derived from the source roots discovered in Step 1)
- The correct target path used consistently throughout
- All required sections: Context, Shell Environment, Operating Constraints, Phase 3, Phase 4, Phase 5, Definition of Done
- Phase-prefixed step numbering (3.1, 3.2, etc.) with no gaps

If any element is missing or inconsistent, fix it before saving.

Report the file path and confirm it was written.

---

## Step 6 — Handoff

Present the following to the user:

**Migration Session 1 is complete.** All folders have been copied and verified.

**Next steps:**
1. Exit this Claude Code session.
2. Open a new terminal.
3. Navigate to the new working directory: `cd "[new active working directory path]"`
4. Launch Claude Code: `claude`
5. Paste the contents of `[target-path]/session-2-settings-and-references.md` as the first message.
6. Follow the confirmation gates through Phases 3–5.

**After Session 2 completes:**
- Resume cloud sync
- Test git worktree operations in one of the moved repos
- Check any scripts, automation flows, or integrations that reference the old paths
- After a few days of normal use, manually delete the source folders from cloud storage and old path-hash directories under `~/.claude/projects/`

---

## Definition of Done (Session 1)

This session is complete when:
- All approved folders have been copied and verified (file counts match, hidden dirs confirmed, git integrity passed where applicable)
- The active working directory was processed last
- `migration-session-1-results.md` exists in the target directory with a complete record of every folder's results
- The Session 2 prompt has been generated from actual results, validated, and saved to the target directory
- The user has been briefed on next steps for Session 2

---

## Guardrails

- **Never delete anything.** Not source folders, not partial copies, not old path-hash directories. Never.
- **Never assume paths.** Auto-detect first. If detection fails, ask. If both fail, stop.
- **Platform-correct commands everywhere.** Every command in this session and in the generated Session 2 prompt must match the detected OS. Verify before executing.
- **Proportional artifacts.** If the user has 2 folders, don't generate a 150-line continuation prompt. Scale the output to the scope.
- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps, confirmation gates, and no-delete policy apply regardless of migration size. These protect the user's data.
- **Handle known edge cases:**
  - Files On-Demand / Smart Sync placeholders (cloud-only stubs that copy as empty files) — the pre-flight checklist addresses this, but if file counts are suspiciously low after copy, flag it
  - Dubious ownership warnings from git (`safe.directory` in gitconfig) — detect and defer to Session 2
  - Path-hash directory timing (new directories created on first launch from new path) — this is why Session 2 exists
  - Locked files during copy (retry behavior is built into robocopy/rsync flags)
  - Symlinks and junctions — report, don't follow blindly
- **If no cloud-synced project folders are found, exit gracefully.** Don't migrate what doesn't need migrating.
