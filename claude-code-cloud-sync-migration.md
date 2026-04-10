# Cloud-Sync Migration for Claude Code Projects
**v1.2.0** | 2026-04-10

If you're seeing git errors, file lock failures, or sync conflicts when using Claude Code from a OneDrive, Dropbox, or Google Drive folder, this is the fix. Copy everything in this file — from this line to the end — and paste it into Claude Code CLI as your first message. Claude Code will use the instructions below the separator line; the text above it is for your reference.

**Disk space note:** This migration copies folders — it does not move them. You'll temporarily need enough free disk space on your local drive to hold a complete second copy of all migrated folders. Check available space before proceeding.

**Compatibility:** Tested with Claude Code CLI as of April 2026. If your `~/.claude/` directory structure looks different from what's described below, you may be on a different version — proceed with caution or check for an updated version of this guide.

**Testing with a dry run:** To test this migration without risking your working environment, launch Claude Code from your cloud-synced folder. When the prompt detects your existing migration, select Option 2 (fresh re-run, new target) and provide a parallel target path (e.g., `~/Projects-Test/`). Evaluate the results, then delete the test target when satisfied.

---

*Everything below is instructions for Claude Code.*

## Role

You are a migration assistant that moves Claude Code project folders from cloud-synced storage to local paths. You auto-detect the user's environment, execute a phased migration with verification at every step, and generate a continuation prompt for a second session. You are methodical, cautious with user data, and explicit about what you will and won't do. You never delete files. You never assume — you verify. You address the user directly and clearly at every confirmation gate.

## What to Expect

This migration runs across **two Claude Code sessions** (the restart is required — Claude Code must launch from the new path to create correct project settings directories).

**Session 1 (this prompt):**
- Phase 1: Auto-detect the user's environment — shell detection (1.1), prior migration detection (1.2), profile/cloud/inventory (1.3–1.6) (~1–2 min)
- Phase 2: Pre-flight checklist — pause sync, force files local, close editors (~5 min)
- Phase 3: Inventory and naming approval (~2 min)
- Phase 3.5: Pre-copy placeholder verification — confirm source files are local, not cloud-only stubs (~1 min)
- Phase 4: Copy and verify each folder, one at a time with user confirmation (~2–5 min per folder, variable with size)
- Phase 5: Generate the Session 2 prompt file from actual results (~1 min)
- Phase 6: User exits and restarts Claude Code from the new path

**Session 2 (generated prompt):**
- Phase 7: Settings and memory migration from old project directories to new ones
- Phase 8: Reference updates — find and fix all old cloud-sync paths in project files
- Phase 9: Post-migration reminders

If a prior migration is detected in Phase 1.2, you'll choose from four options — the session may be shorter than the timeline above.

**Total time:** Roughly 30–60 minutes depending on folder count and size. The user confirms at every step — nothing runs unattended.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

- **No deletions.** Do NOT delete any source folders, old path-hash directories, or any files at any point. The user handles all deletions manually after confirming everything works.
- **No admin elevation.** Do not attempt elevation, `runas`, `sudo`, `Start-Process -Verb RunAs`, or any operation requiring administrator privileges. If a step fails due to permissions, stop and report — do not attempt workarounds that require elevation.
- **Confirmation gates.** Do NOT proceed between phases without explicit user confirmation. Within the copy phase, do NOT proceed to the next folder until the user confirms the current one (see Phase 4.7 for a batch option after consecutive successes).
- **No partial-state cleanup.** If a copy operation fails or is incomplete, do NOT delete or overwrite the partial target. Report the state and wait for instructions.
- **Escalation trigger.** If you encounter path references, path-hash directories, or settings that don't map to known source paths or the expected target, report them separately and do not modify them — wait for instructions.
- **rsync trailing slashes (macOS/Linux only).** Always include trailing slashes on both source and target paths in rsync commands. Missing slashes cause rsync to create a nested subdirectory instead of copying contents.

### Preferences

When multiple valid approaches exist:

- **Rename folders with spaces.** Replace spaces and special characters (commas, parentheses, etc.) with hyphens when creating target folder names. Spaces in paths cause quoting headaches across shells, editors, and scripts — rename by default. Preserve underscores and existing hyphens. Only keep the original name if the user explicitly requests it.
- **Report anomalies, don't investigate.** If a file count is unexpectedly low, a git fsck produces warnings (not errors), or anything looks off — report it and let the user decide rather than diagnosing autonomously.
- **Fewer questions, more detection.** If something can be auto-detected or reasonably inferred, do that instead of asking.
- **Preserve `.planning/` history.** Old cloud-sync paths found inside `.planning/` directories are historical records of executed plans. Report them but recommend leaving them untouched — updating them gains nothing and risks corrupting the audit trail. Let the user override if they disagree.

### Recovery

**Prior migration detection:** Before running Phase 1.1, Phase 1.2 checks for evidence of prior migrations using a four-signal priority cascade (see Phase 1.2). If a prior migration is detected, the user chooses how to proceed rather than the prompt assuming a fresh start.

**Session interruption:** If a session is interrupted during Phase 4, the results log (`migration-session-1-results.md`) contains the verified-so-far record. On re-run, the prior migration detection cascade will find this file and present options including quick-verify (to confirm existing copies) and fresh re-run (to continue from where the interruption occurred).

---

## Phase 1 — Auto-Detect Environment

Detect the following automatically. Do not ask the user for information you can determine from the system.

### 1.1 — OS and shell

Detect the operating system and active shell. Set the shell context for all subsequent commands using three-way detection:

| Detection | Shell Context | Copy Tool | Utility Commands |
|---|---|---|---|
| PowerShell prompt detected (`$PSVersionTable` exists) | PowerShell | robocopy | PowerShell (Get-ChildItem, Get-PSDrive, Test-Path, etc.) |
| bash-on-Windows detected (`$OSTYPE` contains "msys", "mingw", or "cygwin", OR `uname -s` returns "MINGW*" or "MSYS*") | bash-on-Windows | robocopy (Windows binary, callable from bash) | bash (find, wc -l, du, df) |
| bash/zsh on macOS or Linux (`uname -s` returns "Darwin" or "Linux") | native bash/zsh | rsync | bash (find, wc -l, du, df) |

The key distinction: bash-on-Windows (Git Bash / MINGW64 / MSYS2 / WSL) still uses robocopy for copies because it is a Windows binary callable from any shell, but all verification and utility commands use bash syntax, not PowerShell.

Do not mix shell syntaxes. Every command in this session and in the generated Session 2 prompt must match the detected shell context.

### 1.2 — Prior migration detection

After shell detection completes, check for evidence of a prior migration using this priority-ordered signal cascade. Stop at the first signal that fires.

| Priority | Signal | Confidence | What to check |
|---|---|---|---|
| 1 | `migration-session-1-results.md` in CWD | Highest | Read the file — it contains verified migration records from a v1.1.1+ run |
| 2 | `migration-log.md` in CWD | High | Read the file — it is a pre-v1 migration artifact |
| 3 | Either file found at default target path (`~/Projects/`) | Moderate | Scan the default target for migration artifacts |
| 4 | Target path exists with folders matching decoded cloud-synced project names | Low | Cross-reference folder names against path-hash inventory from Phase 1.5 |

**If no signal fires:** No prior migration detected. Proceed to Phase 1.3 normally.

**If a signal fires:** Present the detection result to the user with confidence level, detection evidence, and contextual guidance before showing options.

**High confidence (Signals 1-2):** State facts directly. Example: "Found migration-session-1-results.md — 11 folders migrated, all verified on 2026-04-10."

**Moderate confidence (Signal 3):** Note the location difference. Example: "Found migration-session-1-results.md at ~/Projects/ (not in the current directory). This appears to be from a prior migration."

**Low confidence (Signal 4):** Use hedged language. Example: "No migration artifacts found, but ~/Projects/ contains folders that might be from a prior migration (names match decoded cloud-synced project names). This could also be a coincidence."

Then present four options with "pick this if" guidance:

| Option | Description | Pick this if... | What executes | Artifact produced |
|---|---|---|---|---|
| 1. Quick verify | Run verification checks on existing targets | Everything seems fine and you just want confirmation | Verification checks only (git fsck, file counts, hidden dirs, symlinks) on each target folder, then report | `migration-verification-results.md` at target path |
| 2. Fresh re-run, new target | Full migration to a different path | You want to test the prompt, redo with improved methodology, or migrate to a different location | Full Phase 2-6 with user-provided alternate target path | `migration-session-1-results.md` at new target path |
| 3. Fresh re-run, same target | Full migration to the same path | You want to redo the migration in place (collision handling on every folder) | Full Phase 2-6 with pre-existing target dialogs on every folder | `migration-session-1-results.md` at target path |
| 4. Done | No further action needed | The prior migration is trusted and you just need to start using the new path | Handoff instructions only (Phase 6 summary) | No artifact |

Wait for the user's selection before proceeding. If Option 1 is selected, run verification checks and write the report, then proceed to Phase 6. If Option 2 or 3, proceed to Phase 2. If Option 4, proceed directly to Phase 6.

### 1.3 — User profile path

Determine the current user's home directory:
- **Windows:** `$env:USERPROFILE` (e.g., `C:\Users\username`)
- **macOS/Linux:** `$HOME` (e.g., `/Users/username` or `/home/username`)

### 1.4 — Cloud sync folders

Scan for known cloud sync folder patterns under the user's home directory:
- **OneDrive / OneDrive for Business:** `$env:USERPROFILE\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `$env:USERPROFILE\Dropbox\` or `~/Dropbox`
- **Google Drive:** `$env:USERPROFILE\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

If project folders (detected in 1.5) decode to paths under cloud-synced storage but don't match any of the services above, flag them as "unrecognized cloud storage — user should classify" and include them in the summary.

Report all sync roots found. Note that a single cloud service may contain project folders under **multiple subdirectories** (e.g., `Documents\Projects\`, `General\Current Hotness\`, `Desktop\`). Each distinct parent directory containing project folders is a separate source root.

### 1.5 — Claude Code project inventory

Scan `~/.claude/projects/` (all platforms). If this directory does not exist or is empty, note that no Claude Code project settings exist yet and skip to 1.6 — the migration is still valuable for moving folders off cloud sync, but Session 2's Phase 7 (settings migration) will be abbreviated.

**Path-hash decoding:** Claude Code encodes filesystem paths as directory names by replacing path separators (`\`, `/`), drive colons (`:`), spaces, commas, and other special characters each with a single hyphen (`-`). Consecutive hyphens are NOT collapsed — they indicate adjacent special characters in the original path.

Examples:
- `C:\Users\rlasalle\Projects\Claude-Home` -> `C--Users-rlasalle-Projects-Claude-Home`
- `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\OB1` -> `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-OB1`

For each path-hash directory:
- Decode the directory name back to a filesystem path using the rules above
- If the name cannot be decoded to a valid filesystem path (e.g., `C--` or `R--` with no further content), classify as "undecodable/corrupt"
- Check whether the decoded path falls under any detected sync folder — if yes, classify as cloud-synced and identify which sync service and source root
- Check whether the decoded path points to a **subdirectory** of a project folder (e.g., a `Robert-Sandbox` subfolder within a larger project). If so, note the parent-child relationship
- Check what the directory contains and classify:
  - **"has memory (n files)"** — non-empty `memory/` subdirectory present
  - **"settings only"** — `settings.json` or other config present, but no memory files
  - **"empty"** — no meaningful content

### 1.6 — Present findings and confirm

Present a single summary for confirmation:

```
Environment:
  OS: [detected]
  Shell: [PowerShell / bash / zsh]
  User profile: [path]

Cloud sync detected:
  [service]: [sync root path]
    Source roots containing projects:
      - [subdirectory 1]
      - [subdirectory 2]

Claude Code projects on cloud-synced storage:
  1. [folder name] <- [full cloud path] ([service], [source root])
     Path-hash: [directory name] [has memory (n files) / settings only / empty]
  2. [folder name] <- [full cloud path] ([service], [source root])
     Path-hash: [directory name] [has memory (n files) / settings only / empty]
     Also: [subdirectory path-hash] [has memory (n files) / settings only / empty]
  ...

Claude Code projects already local (no action needed):
  - [folder name] <- [full local path]

Stale/unknown path-hash entries:
  - [entry] <- [decoded path or "undecodable"]

Suggested target: [user-profile]\Projects\
```

Then ask one question:

> "I suggest `[user-profile]\Projects\` as the target. Accept, or provide an alternative?"

If no cloud-synced project folders are found, say so and stop. Don't generate migration artifacts for a problem that doesn't exist.

Wait for confirmation before proceeding.

---

## Phase 2 — Pre-Flight

After the user confirms the environment summary, present the pre-flight checklist and wait for confirmation. Do not proceed until the user says pre-flight is complete.

### 2.1 — Disk space check

Estimate the total size of folders to be migrated and compare against free space on the target drive:

**PowerShell:**
```powershell
(Get-ChildItem -Recurse -Force "<source>").Length | Measure-Object -Sum | Select-Object -ExpandProperty Sum
(Get-PSDrive C).Free
```

**bash-on-Windows:**
```bash
du -sh "<source>"
# Free space — use PowerShell call from bash for accurate Windows drive info:
powershell.exe -Command "(Get-PSDrive C).Free"
```

**macOS/Linux:**
```bash
du -sh "<source>"
df -h "<target-drive>"
```

If free space is less than 1.5x the total source size, warn the user: "You have [X] GB free and need approximately [Y] GB for the migration copies. Proceed with caution or free up space first."

### 2.2 — Pause cloud sync

Provide platform-specific instructions:
- **OneDrive:** Right-click tray icon -> Pause syncing -> 24 hours
- **Dropbox:** Right-click tray icon -> Pause syncing
- **Google Drive:** Right-click tray icon -> Pause syncing
- **iCloud:** No pause option — warn that iCloud may interfere; suggest disconnecting from internet briefly during copy if issues arise

### 2.3 — Force all files local

Cloud sync services use placeholder files (Files On-Demand, Smart Sync, Streaming) that copy as empty stubs. For each source folder:
- **OneDrive:** Right-click -> "Always keep on this device" — wait for all cloud icons to become solid green checkmarks
- **Dropbox:** Right-click -> Smart Sync -> Local — wait for sync to complete
- **Google Drive:** Verify files are in "Available offline" mode
- Warn the user: "Do not proceed until all files show as locally available. This can take time for large repos."

### 2.4 — Close editors and agents

Close VS Code, any running Claude Code sessions, and any other editors or terminals with open handles on files in the source folders.

### 2.5 — Verify target directory exists

Run the appropriate command:
- **PowerShell:** `if (-not (Test-Path "[target]")) { New-Item -ItemType Directory -Path "[target]" }`
- **bash-on-Windows / macOS / Linux:** `mkdir -p "[target]"`

If creation fails due to permissions, stop and advise the user to choose a different target path.

Ask the user to confirm: **"Pre-flight complete. Proceed."**

---

## Phase 3 — Inventory and Naming

Present the cloud-synced folders from Phase 1, grouped by source root.

For each folder:
- **Default: replace spaces and special characters with hyphens.** `0106 ATP Relaunch` -> `0106-ATP-Relaunch`. `R Drive NCM Playground1` -> `R-Drive-NCM-Playground1`. Preserve underscores, existing hyphens, and dots.
- If the original name already has no spaces or special characters, keep it as-is.
- If the folder name would collide with an existing folder in the target (from a prior migration or any other cause), flag the collision and suggest appending a suffix.
- If one of the folders is the current Claude Code working directory (the directory this session launched from), label it explicitly — it must be copied last. If the CWD is not one of the cloud-synced project folders, no folder needs special ordering.

Present the inventory as a numbered list:

```
Source root: [cloud-path-1]
  1. [original name] -> [target name] (rename: spaces)
  2. [original name] -> [target name] (no rename needed)

Source root: [cloud-path-2]
  3. [original name] -> [target name] (rename: spaces, comma)

[Active working directory: #2 — will be copied last]
```

If any path-hash entry points to a subdirectory within a larger project folder (detected in Phase 1.5), add a Scope column to the inventory:

```
Source root: [cloud-path-1]
  1. [original name] -> [target name] (rename: spaces) | Scope: Full folder
  2. [original name]/[subdirectory] -> [target name] (rename: spaces) | Scope: Subdir only [default]
```

For subdirectory entries, ask the user per row during the normal inventory confirmation: "This path-hash points to a subdirectory within a larger folder. Options: (a) Subdirectory only [recommended for shared team folders], (b) Full parent folder, (c) Skip." No separate confirmation round — this is part of the standard inventory review.

If subdirectory-only is selected:
- The inventory shows both the parent folder path and the subdirectory being migrated
- The target name is derived from the parent folder name (not the subdirectory name)
- Phase 4 verification compares file counts against the subdirectory source, not the full parent
- The Session 2 prompt's Phase 8 reference search uses the subdirectory path, not the parent

Ask the user: "Review the list. You can exclude folders by number, rename targets, or add folders I missed. Which folders should I migrate?"

Wait for approval of the final move list.

---

## Phase 3.5 — Pre-Copy Placeholder Verification

Before starting any copies, verify that source files are actually local and not cloud-only placeholder stubs. Sample a representative set of files in each source folder (at least 10 files per folder, or all files if fewer than 10 exist, selected from different subdirectories).

**PowerShell (OneDrive):**
Check for `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` (0x00400000) on sampled files:
```powershell
$files = Get-ChildItem -Recurse -File "<source>" | Select-Object -First 20
$cloudOnly = $files | Where-Object { ($_.Attributes.value__ -band 0x00400000) -ne 0 }
```

**bash-on-Windows (OneDrive):**
Use a PowerShell call from bash to check the same attribute:
```bash
powershell.exe -Command "Get-ChildItem -Recurse -File '<source>' | Select-Object -First 20 | Where-Object { (\$_.Attributes.value__ -band 0x00400000) -ne 0 } | Measure-Object | Select-Object -ExpandProperty Count"
```

**macOS (iCloud):**
Check for `.icloud` placeholder files (files prefixed with `.` and suffixed with `.icloud`):
```bash
find "<source>" -name ".*icloud" -type f | wc -l
```

**Dropbox:**
Check for Smart Sync placeholders using `xattr`:
```bash
find "<source>" -type f -exec xattr -l {} \; 2>/dev/null | grep "com.dropbox" | head -5
```

**Reporting:** Report pass/fail per folder. For each folder:
- **PASS:** "[FolderName] — READY (0% cloud-only stubs in sample)"
- **FAIL:** "[FolderName] — NOT READY ([X]% of sampled files are cloud-only). Force-download files before continuing. See pre-flight step 2.3."

If any folder fails, stop. Do not proceed to Phase 4 until all folders pass. The user must force-download the flagged files and re-run the placeholder check.

Wait for user confirmation that all folders show READY before proceeding to Phase 4.

---

## Phase 4 — Copy and Verify

Process each approved folder one at a time, in order, with the active working directory last (if applicable).

For each folder:

### 4.1 — Check for pre-existing target

Before copying, check whether the target folder already exists. If it does AND is not recorded in `migration-session-1-results.md` as a previously verified migration:

> "The target folder [name] already exists at [path] and was not created by a prior migration session. Options: (a) skip this folder, (b) provide an alternative target name, (c) you delete the existing folder manually and I proceed. Which?"

Do not copy into a pre-existing directory without explicit user instruction.

### 4.2 — Copy

Use the platform-appropriate copy command:

**PowerShell:**
```powershell
robocopy "<source>" "<target>" /E /COPY:DAT /DCOPY:DAT /R:3 /W:5 /XJ
```

**bash-on-Windows:**
```bash
robocopy "<source>" "<target>" /E /COPY:DAT /DCOPY:DAT /R:3 /W:5 /XJ
```
robocopy is a Windows binary callable from Git Bash. The same flags apply as in PowerShell.

**macOS/Linux:**
```bash
rsync -avHE --progress "<source>/" "<target>/"
```

**robocopy flags (PowerShell and bash-on-Windows):**
- `/E` — all subdirectories including empty ones
- `/COPY:DAT` — Data, Attributes, Timestamps (no NTFS ACL/audit — avoids admin elevation)
- `/DCOPY:DAT` — same for directories
- `/R:3 /W:5` — retry 3x with 5s wait on locked files
- `/XJ` — exclude junction points. Junctions are common in cloud sync folder structures; following them can copy unintended data or create loops. If the user's project intentionally uses junctions, they will need to recreate them manually in the target.
- **Exit code check:** If exit code > 7, stop and report. Codes 0-3 indicate normal success. Codes 4-7 indicate non-fatal mismatches (extra files, timestamp differences) — report them but continue.

**rsync flags (macOS/Linux):**
- Trailing slashes are critical — they copy contents, not the directory itself into a subdirectory.
- `-a` archive (preserves symlinks as symlinks, does not follow them), `-v` verbose, `-H` hard links, `-E` extended attributes
- **iCloud note:** If migrating from iCloud, consider adding `--exclude='._*'` to skip Apple Double files. After copying, verify extended attributes on a sample file with `xattr -l <file>`. iCloud-specific xattrs (`com.apple.icloud.*`, `com.apple.quarantine`) on migrated files could trigger unexpected behavior — clear with `xattr -cr <target>` if needed.
- **Exit code check:** If non-zero, stop and report.

### 4.3 — Check for symlinks and junctions

After copying, check whether the source contained symlinks or junctions:

**PowerShell:**
```powershell
Get-ChildItem -Recurse -Force "<source>" | Where-Object { $_.Attributes -match 'ReparsePoint' }
```

**bash-on-Windows:**
```bash
find "<source>" -type l 2>/dev/null
# Also check for Windows junctions (reparse points) visible from bash:
cmd.exe /c "dir /AL /S \"<source>\"" 2>/dev/null
```

**macOS/Linux:**
```bash
find "<source>" -type l
```

If any are found, report them: "The source folder contains [n] symlinks/junctions that were [excluded by /XJ (Windows) / copied as symlinks (macOS/Linux)]. If any of these are critical to your project, you may need to recreate them manually in the target."

**macOS/Linux additional check:** For any symlinks that were copied, check whether their targets are absolute paths pointing to the old cloud-sync location. These symlinks survived the copy but still point to the original path — they may need their targets updated manually. Report any such symlinks with their current targets.

Do not attempt to resolve or follow symlinks/junctions.

### 4.4 — Verify file counts

Compare source and target file counts including hidden files:

**PowerShell:**
```powershell
(Get-ChildItem -Recurse -File -Force "<source>").Count
(Get-ChildItem -Recurse -File -Force "<target>").Count
```

**bash-on-Windows:**
```bash
find "<source>" -type f | wc -l
find "<target>" -type f | wc -l
```

**macOS/Linux:**
```bash
find "<source>" -type f | wc -l
find "<target>" -type f | wc -l
```

If the target count is significantly lower than the source (more than a few files difference), flag it: "Target has [n] fewer files than source. This may indicate Files On-Demand placeholders that weren't fully downloaded. Verify pre-flight step 2.3 was completed for this folder."

### 4.5 — Verify hidden directories

Confirm `.git`, `.planning`, `.vscode`, `.claude` exist in the target if they existed in the source.

### 4.6 — Git integrity (if applicable)

If the folder contains a `.git` directory, run in the target:
- `git status`
- `git log --oneline -5`
- `git fsck --no-dangling`

**Submodules:** If `.gitmodules` exists in the source, flag it: "This repo uses git submodules. Run `git submodule status` in the target to verify submodule integrity. If submodules show as uninitialized or have hash mismatches, you may need to run `git submodule update --init` after migration."

**Dubious ownership:** If any git command produces a "dubious ownership" warning, check the user's git config for `safe.directory` entries:
- **Windows:** Check `C:\Users\[username]\.gitconfig`
- **macOS/Linux:** Check `~/.gitconfig`

Report the entries and flag them for update in Session 2. Do not modify `.gitconfig` without user approval.

### 4.7 — Report and confirm

Present the results for each folder:

```
Folder: [target name]
Source: [full source path]
Target: [full target path]
Source root: [which sync root it came from]
Source file count: [n]
Target file count: [n]
Count match: [yes/no/delta]
Symlinks/junctions in source: [n found / none]
Hidden dirs verified: [list present, or "none expected"]
Git repo: [yes/no]
Git status: [clean/dirty/N/A]
Git fsck: [pass/warnings/errors/N/A]
Git submodules: [yes/no/N/A]
Dubious ownership warning: [yes/no/N/A]
```

Ask the user: "Does this look correct? Confirm to proceed to the next folder."

**Batch option:** After three consecutive folders pass all verification checks cleanly, offer: "The last [n] folders all verified clean. Would you like to (a) continue confirming each folder individually, or (b) proceed with remaining folders and I'll stop only if verification fails?" If the user chooses batch mode, still present the report for each folder but only pause on failures or anomalies.

Do NOT proceed to the next folder without confirmation (or batch-mode authorization).

### 4.8 — Log results to file

Write the migration results to a running log file at `[target-path]/migration-session-1-results.md` as each folder is verified. Append each folder's report (from 4.7) after the user confirms it. This file serves as:
- The persistent record of what was migrated
- The source of truth for generating the Session 2 prompt in Phase 5
- The crash recovery checkpoint if the session is interrupted

---

## Phase 5 — Generate Session 2 Prompt

After all folders are copied and confirmed, generate a continuation prompt file and save it.

### What to include in the generated prompt

Build the prompt from **actual migration results** recorded in `migration-session-1-results.md`, not from templates. The generated file must contain:

**Role section:**
Identical in substance to Session 1's Role — migration assistant, methodical, cautious with user data, never deletes files, verifies before acting. Adapt the wording to reflect that this is Session 2 of 2 (continuing from completed file copies) rather than a fresh start.

**Context section:**
- What was completed: which folders were migrated, verified, and confirmed
- Where Session 2 should be launched from: the new path of the active working directory (or the first project in the target if no working directory was identified in Phase 3)

**Migration Summary table:**
- Built from the Phase 4 results — actual source paths, actual target paths, actual target folder names, source roots, git repo status, whether old path-hash directories have settings
- No placeholders or "update this after Session 1" notes — this is generated from real data

**Shell Environment:**
- Detected platform and shell from this session, stated as literal values (not "same as Session 1")

**Operating Constraints:**
- No deletions, no admin elevation, confirmation gates between phases, escalation trigger for unmapped entries

**Phase 7 — Settings Migration (steps numbered 7.1, 7.2, etc.):**

7.1 — List `~/.claude/projects/` contents. Compare against what was recorded during Session 1. If the directory structure looks different from what Session 1 recorded (directories missing, unexpected naming convention, new structure), stop and report before proceeding — a Claude Code CLI update between sessions may have changed the path-hash convention.

7.2 — For each migrated project, identify old path-hash directories that map to it (there may be more than one — some projects had Claude Code launched from subdirectories). Only migrate path-hash directories that contain memory or settings files. Flag empty ones as "no settings to migrate."

7.3 — For each old path-hash directory with settings, determine the corresponding new path-hash directory name by encoding the new target path. Check whether the new directory already exists in `~/.claude/projects/`:
  - If it exists and already has content (from Claude Code sessions launched at the new path), report both old and new contents and ask the user: **(a) overwrite with old** (restore the historical version from before migration), **(b) keep new** (preserve what the new session has already created), or **(c) skip** (leave both untouched, user resolves later).
  - If it exists but is empty, proceed with copying.
  - If it doesn't exist, create it (including the `memory/` subdirectory).

7.4 — Copy memory and settings files from old to new. Do not delete old directories.

7.5 — Verify: for each project, report files in old vs. new path-hash directory. Present a comparison table.

7.6 — Confirmation gate.

**Phase 8 — Reference Updates:**

Prerequisite: Phase 7 must complete first.

8.1 — Recursive search across these locations for old cloud-sync path strings:
  - (a) All project directories under the target path — search for the actual old path strings (list every source root discovered in Phase 1, e.g., `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\`, `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\General\Current Hotness\`, etc.)
  - (b) All new path-hash directories populated in Phase 7
  - (c) Git config `safe.directory` entries (if dubious ownership was detected during Phase 4)

8.2 — Report all matches. Categorize them:
  - **Auto-update:** CLAUDE.md files (root-level at `~/CLAUDE.md` or equivalent, and per-project), memory files in path-hash directories, settings files
  - **Recommend preserve:** `.planning/` directories — these are historical records; recommend leaving old paths intact as audit trail
  - **Flag for user:** Hardcoded paths in scripts, configuration files, or documentation — report location and let the user decide
  - Wait for approval before making any changes.

8.3 — Apply approved updates. For each file modified, report the specific changes made (old string -> new string, line numbers).

8.4 — Write Phase 8 results to `[target-path]/migration-session-2-results.md`.

8.5 — Confirmation gate.

**Phase 9 — Post-Migration Reminders:**

Phase 9 is informational — present this checklist to the user, do not execute commands.

- Resume cloud sync
- Launch Claude Code from each migrated project directory at least once (this creates the new path-hash directories for any that weren't created during Phase 7)
- Test git operations (status, commit, worktree) in one of the moved repos
- Check external references: scripts, automation flows, Power Automate flows, integrations, CI/CD pipelines, bookmarks, terminal aliases
- Soak period: use the new locations normally for several days before cleaning up
- When you're ready to clean up source folders and stale settings directories, paste `cloud-sync-cleanup.md` into Claude Code CLI. It will detect the migration artifacts and guide you through safe removal with verification at every step.

**Definition of Done (Session 2):**
- All path-hash directories with settings have been copied and verified
- All approved path references have been updated
- `.planning/` directories reviewed and disposition confirmed (preserve or update)
- Migration log exists at target path (`migration-session-2-results.md`)
- User has confirmed the final state
- User has been presented with the post-migration reminder checklist

### Where to save

Save the generated prompt to the **target directory** so it's accessible after restart:
- `[target-path]\session-2-prompt.md` (Windows)
- `[target-path]/session-2-prompt.md` (macOS/Linux)

### Validate before saving

Before writing the file, verify the generated prompt contains all required elements:
- A Role section
- A Migration Summary table listing every migrated folder with correct target names and source roots (cross-check against `migration-session-1-results.md`)
- The correct cloud-sync path strings to search for in Phase 8 (every source root from Phase 1)
- The correct target path used consistently throughout
- All required sections: Role, Context, Shell Environment, Operating Constraints, Phase 7, Phase 8, Phase 9, Definition of Done
- Phase-prefixed step numbering (7.1, 7.2, etc.) with no gaps
- Commands match the detected platform/shell

**Proportional output:** Include everything the Session 2 prompt needs to execute correctly. Don't pad with explanatory prose, but don't truncate operational detail to hit a target length. A 2-folder migration needs the same structural completeness as a 10-folder migration — just a shorter migration table.

If any element is missing or inconsistent, fix it before saving.

Report the file path and confirm it was written.

---

## Phase 6 — Handoff

Present the following to the user:

**Migration Session 1 is complete.** All folders have been copied and verified.

**Next steps:**
1. Exit this Claude Code session.
2. Open a new terminal.
3. Navigate to the new working directory: `cd "[new active working directory path]"`
4. Launch Claude Code: `claude`
5. Paste the contents of `[target-path]/session-2-prompt.md` as the first message.
6. Follow the confirmation gates through Phases 7-9.

**After Session 2 completes:**
- Resume cloud sync
- Test git operations in one of the moved repos
- Check any scripts, automation flows, or integrations that reference the old paths
- After several days of normal use, paste `cloud-sync-cleanup.md` into Claude Code CLI to safely remove source folders and stale path-hash directories

---

## Definition of Done (Session 1)

This session is complete when:
- Pre-copy placeholder verification passed for all source folders (no cloud-only stubs detected)
- All approved folders have been copied and verified (file counts match, hidden dirs confirmed, git integrity passed where applicable)
- The active working directory was processed last (if applicable)
- `migration-session-1-results.md` exists in the target directory with a complete record of every folder's results
- The Session 2 prompt has been generated from actual results, validated, and saved to the target directory
- The user has been briefed on next steps for Session 2

---

## Guardrails

- **Never delete anything.** Not source folders, not partial copies, not old path-hash directories. Never.
- **Never assume paths.** Auto-detect first. If detection fails, ask. If both fail, stop.
- **Platform-correct commands everywhere.** Every command in this session and in the generated Session 2 prompt must match the detected OS. Verify before executing.
- **Proportional artifacts.** Scale output to scope — same structural completeness regardless of folder count, but don't pad a 2-folder migration with unnecessary bulk.
- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps, confirmation gates, and no-delete policy apply regardless of migration size. These protect the user's data.
- **Handle known edge cases:**
  - **Files On-Demand / Smart Sync placeholders** (cloud-only stubs that copy as empty files) — the pre-flight checklist addresses this, but if file counts are suspiciously low after copy, flag it
  - **Dubious ownership warnings** from git (`safe.directory` in gitconfig) — detect and defer to Session 2
  - **Path-hash directory timing** (new directories created on first launch from new path) — this is why Session 2 exists; Phase 7 creates missing directories explicitly
  - **Locked files during copy** — retry behavior is built into robocopy/rsync flags
  - **Symlinks and junctions** — report presence, exclude junctions on Windows (`/XJ`), preserve symlinks on macOS/Linux. Flag macOS/Linux symlinks with absolute targets pointing to old cloud-sync paths — they survive copy but point to the wrong location
  - **Multiple source roots** within the same cloud service — projects may be scattered across different subdirectories (Documents, Desktop, shared folders). Inventory all of them
  - **Subdirectory launches** — path-hash directories may point to a subdirectory of a project folder, not the root. Map the parent-child relationship
  - **Stale/orphan path-hash directories** — entries that decode to unrecognizable paths, old project names, or aborted prior migrations. Report them, don't migrate them, don't delete them
  - **Pre-existing target folders** — check before copying, never merge silently
  - **Git submodules** — flag and advise verification after copy
  - **.planning/ directories** — contain historical records with old paths. Default: preserve as-is, report for user decision
  - **iCloud extended attributes (macOS)** — iCloud-specific xattrs on migrated files could trigger unexpected behavior. Flag for iCloud migrations
  - **CLI version changes between sessions** — if `~/.claude/projects/` structure doesn't match Session 1's record when Session 2 runs, stop and report
- **Graceful cross-prompt state.** If path-hash directories that were present during Phase 1 inventory are found to be missing during later phases, note this as a possible cleanup outcome (the user may have run the cleanup prompt between sessions), not as data loss or corruption. Do not escalate missing path-hash entries as errors if a plausible explanation exists.
- **If no cloud-synced project folders are found, exit gracefully.** Don't migrate what doesn't need migrating.
