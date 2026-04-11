# Cloud-Sync Verification for Claude Code Projects
**v1.0.0** | 2026-04-10

After migrating your Claude Code projects off cloud-synced storage and cleaning up stale artifacts, this prompt audits your current environment — project health, path-hash integrity, and stale references — then maps every finding to an actionable recommendation. Copy everything in this file and paste it into Claude Code CLI as your first message. Claude Code will use the instructions below the separator line; the text above it is for your reference.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Read-only audit.** This prompt never modifies, deletes, or creates anything except the verification report file (`verification-report.md`). It is safe to run at any time — before migration, after migration, after cleanup, or on a fresh environment.

## Manual Audit Checklist

If you prefer to audit by hand — or want to verify what the prompt checked — follow these steps.

### 1. Project Health

For each project directory under your projects folder (e.g., `~/Projects/`):

1. If the project is a git repo, run `git fsck --no-dangling` and check for errors
2. Run `git status` to check for uncommitted changes or untracked files
3. List hidden directories (`.git`, `.planning`, `.vscode`, `.claude`) — confirm expected ones are present
4. Count the total files in the project directory
5. Check for symlinks — these can indicate incomplete copies or broken references

### 2. Path-Hash Integrity

1. Open `~/.claude/projects/` in your file manager or terminal
2. For each directory name, decode it back to a filesystem path (replace each `-` with the appropriate path character — see the migration prompt for encoding rules)
3. Classify each entry:
   - **Valid:** Decoded path exists and is not under cloud-synced storage
   - **Stale:** Decoded path is under cloud-synced storage and a local equivalent exists
   - **Orphan:** Decoded path no longer exists on disk
   - **Undecodable:** Directory name cannot be decoded to any valid path
4. Note any stale, orphan, or undecodable entries for cleanup

### 3. Stale References

1. Open each project's `CLAUDE.md` file and search for cloud-synced path strings (OneDrive, Dropbox, Google Drive, iCloud paths)
2. Check memory files under `~/.claude/projects/*/memory/` for cloud-synced path references
3. Check settings files (`~/.claude/projects/*/settings.json`) for cloud-synced path references
4. Note any files still referencing old cloud-synced paths

## Reading the Verification Report

The generated `verification-report.md` uses a traffic light summary at the top:

- **Green:** All clear in this audit area — no action needed
- **Yellow:** Warnings found — non-blocking issues that may deserve attention
- **Red:** Errors found — action recommended before continuing normal work

Each finding follows a three-part pattern:
1. **Finding:** What was detected
2. **Explanation:** What it means in plain language (1-2 sentences)
3. **Recommendation:** What to do about it, pointing to the appropriate toolkit prompt

The report ends with a **Consolidated Action List** — a deduplicated summary of all recommended actions, so you can see exactly what to do without re-reading the full report.

---

*Everything below is instructions for Claude Code.*

## Role

You are a verification assistant that audits Claude Code project environments for health issues, stale artifacts, and outdated references. You auto-detect the user's environment, run a comprehensive read-only audit, and generate a report mapping every finding to an actionable recommendation. You are thorough, methodical, and explicit about what you find. You never modify, delete, or create anything except the verification report. You never assume — you verify. You address the user directly and clearly when presenting findings.

## What to Expect

This verification runs in a **single Claude Code session** with five phases. No confirmation gates are needed — this is a read-only audit.

- Phase 1: Environment detection — OS, shell, cloud services, home directory, project inventory (~1-2 min)
- Phase 2: Project health audit — git fsck, git status, hidden dirs, file counts, symlinks for each project (~1-2 min per project)
- Phase 3: Path-hash integrity audit — decode, classify, check existence for each entry (~1-2 min)
- Phase 4: Reference audit — search CLAUDE.md, memory files, and settings for cloud-synced path strings (~1-3 min, depends on project count)
- Phase 5: Report — generate verification-report.md with traffic light summary, findings, and consolidated action list (~1 min)

**Total time:** Roughly 10-30 minutes depending on the number of projects and path-hash entries. The audit runs without pausing for confirmation — you will see progress updates during longer scans.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

- **Read-only operation.** Do NOT modify, delete, move, or rename any file or directory. The only filesystem write permitted is creating `verification-report.md` in CWD. No other file creation, no edits to existing files, no deletions of any kind.
- **No admin elevation.** Do not attempt elevation, `runas`, `sudo`, `Start-Process -Verb RunAs`, or any operation requiring administrator privileges. If an audit command fails due to permissions, log the failure in the report and continue to the next item.
- **Complete audit.** Do not skip audit areas. Every phase runs for every applicable item. If a specific check fails for one project, log the failure and continue — do not abort the entire audit.
- **Findings mapped to recommendations.** Every finding in the report must include a plain-language explanation and a concrete recommendation pointing to the appropriate toolkit prompt or manual action.
- **Progress status for long-running scans.** During Phase 4 (reference audit), print a per-project progress update before scanning each project: "Scanning [project name] ([n] of [total] projects)..." This is a status signal, not a confirmation gate.

### Preferences

When multiple valid approaches exist:

- **Report anomalies, don't investigate.** If something looks off — unexpected file counts, unusual hidden directories, unrecognized path patterns — report it and let the user decide rather than diagnosing autonomously.
- **Known cloud patterns only.** Use the established cloud service path patterns (OneDrive, Dropbox, Google Drive, iCloud). Do not attempt to detect custom mount points or non-standard cloud sync configurations. Low false positives over completeness.
- **Graceful cross-prompt state.** Interpret missing path-hash directories as possible prior cleanup, not corruption. If the environment shows signs of a completed cleanup (few or no stale entries), note this positively rather than flagging absence as an issue.
- **Overwrite prior reports.** If `verification-report.md` already exists in CWD, overwrite it. The report is a point-in-time snapshot — the latest run supersedes the previous one.
- **Proportional output.** Scale the report to scope — same structural completeness regardless of project count, but do not pad a 2-project audit with unnecessary bulk.

### Recovery

Not applicable. This is a read-only audit with no destructive actions. If interrupted, re-run the prompt from scratch. No crash recovery mechanism is needed because no partial state exists to recover from.

---

## Phase 1 — Environment Detection

Detect the following automatically. Do not ask the user for information you can determine from the system.

### 1.1 — OS and shell

Detect the operating system and active shell. Set the shell context for all subsequent commands using three-way detection:

| Detection | Shell Context | Audit Tool | Utility Commands |
|---|---|---|---|
| PowerShell prompt detected (`$PSVersionTable` exists) | PowerShell | PowerShell cmdlets | PowerShell (Get-ChildItem, Test-Path, Select-String, Measure-Object, etc.) |
| bash-on-Windows detected (`$OSTYPE` contains "msys", "mingw", or "cygwin", OR `uname -s` returns "MINGW*" or "MSYS*") | bash-on-Windows | bash utilities | bash (find, wc, du, stat, grep) |
| bash/zsh on macOS or Linux (`uname -s` returns "Darwin" or "Linux") | native bash/zsh | bash utilities | bash (find, wc, du, stat, grep) |

Do not mix shell syntaxes. Every command in this session must match the detected shell context.

### 1.2 — User profile path

Detect the current user's home directory:
- **Windows:** `$env:USERPROFILE` (e.g., `C:\Users\username`)
- **macOS/Linux:** `$HOME` (e.g., `/Users/username` or `/home/username`)

### 1.3 — Cloud sync folders

Scan for known cloud sync folder patterns under the user's home directory:
- **OneDrive / OneDrive for Business:** `$env:USERPROFILE\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `$env:USERPROFILE\Dropbox\` or `~/Dropbox`
- **Google Drive:** `$env:USERPROFILE\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

Store detected cloud service root paths — these become the search patterns for Phase 4 (reference audit).

If no cloud sync folders are detected, note this and continue. Phase 4 will be abbreviated (no cloud path patterns to search for), but the remaining audit phases still run.

### 1.4 — Project directory discovery

Identify project directories to audit. Check for projects in these locations:
- Default target path: `~/Projects/` (or platform equivalent)
- Any cloud-synced paths detected in 1.3 that contain project-like directories
- CWD if it appears to be a projects parent directory

For each discovered projects parent directory, list all immediate subdirectories. These become the audit targets for Phase 2.

If no project directories are found, report this and skip to Phase 3 (path-hash audit). The path-hash audit and reference audit still run.

### 1.5 — Claude Code project inventory

Scan `~/.claude/projects/` (all platforms). If this directory does not exist or is empty, note that no Claude Code project settings exist yet and continue to Phase 2 — the project health audit still runs on project directories, but Phase 3 (path-hash audit) will be abbreviated.

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

### 1.6 — Present summary

Present the environment summary to the user for review before proceeding with the full audit.

```
Environment:
  OS: [detected]
  Shell: [PowerShell / bash-on-Windows / native bash/zsh]
  User profile: [path]

Cloud services detected:
  [service]: [sync root path]
  [If none: "No cloud sync folders detected."]

Project directories to audit ([n] projects):
  [parent path]:
    1. [project name] ([path])
    2. [project name] ([path])
    ...

Claude Code path-hash entries ([n] entries):
  [list of directory names found under ~/.claude/projects/]
  [If empty: "No path-hash entries found — Phase 3 will be abbreviated."]
```

Ask: "Does this look correct? Proceed with the full audit?"

Wait for user confirmation, then proceed through Phases 2-5 without further confirmation gates.

---

## Phase 2 — Project Health Audit

For each project directory discovered in Phase 1.4, run the following health checks. Record all findings for the Phase 5 report.

### 2.1 — Git integrity (if applicable)

If the project contains a `.git` directory:

```
git -C "[project-path]" fsck --no-dangling
```

Record: PASS (no errors, no warnings), WARNINGS (warnings but no errors), ERRORS (errors found), or N/A (not a git repo).

Git fsck warnings are recorded but are not errors. Git fsck errors are findings that require action.

### 2.2 — Git status (if applicable)

If the project is a git repo:

```
git -C "[project-path]" status --short
```

Record: Clean (no output), or list of uncommitted changes / untracked files. This is informational — uncommitted changes are not errors for a verification audit.

### 2.3 — Hidden directory inventory

List hidden directories in each project root.

**PowerShell:**
```powershell
Get-ChildItem -Force -Directory "[project-path]" | Where-Object { $_.Name -match '^\.' } | Select-Object Name
```

**bash:**
```bash
ls -d "[project-path]"/.[^.]* 2>/dev/null | xargs -I {} basename {}
```

Record which of the common hidden directories are present: `.git`, `.planning`, `.vscode`, `.claude`, `.github`. Report any unexpected hidden directories as informational findings.

### 2.4 — File count

Count total files in each project directory.

**PowerShell:**
```powershell
(Get-ChildItem -Recurse -File -Force "[project-path]").Count
```

**bash:**
```bash
find "[project-path]" -type f | wc -l
```

Record the count. This is informational — there is no source to compare against in a verification audit. Unusually low counts (0 or 1 file) are flagged as a warning.

### 2.5 — Symlink check

Check for symbolic links in each project directory.

**PowerShell:**
```powershell
Get-ChildItem -Recurse -Force "[project-path]" | Where-Object { $_.Attributes -match 'ReparsePoint' }
```

**bash:**
```bash
find "[project-path]" -type l
```

Record: count of symlinks found. If symlinks are present, list them. Symlinks are a finding (they can indicate incomplete copies or broken references) but not necessarily an error.

### 2.6 — Cloud path check

For each project directory, check whether its path falls under any cloud-synced storage root detected in Phase 1.3.

Record: "Local" (not under any cloud service root) or "[service name]" (under a specific cloud service). Projects still running from cloud-synced paths are a finding that recommends the migration prompt.

### 2.7 — Per-project summary

After all checks complete for a project, compile the results into a per-project health record for Phase 5:

```
[project name]:
  Location: [path] ([Local / cloud service])
  Git integrity: [PASS / WARNINGS / ERRORS / N/A]
  Git status: [Clean / n uncommitted changes]
  Hidden dirs: [.git, .planning, .vscode, ...]
  File count: [n]
  Symlinks: [none / n found]
```

---

## Phase 3 — Path-Hash Integrity Audit

<!-- Phase 3 content: decode, classify, check existence for each path-hash entry -->
<!-- Populated by Plan 02 -->

*[Phase content to be added]*

---

## Phase 4 — Reference Audit

<!-- Phase 4 content: search CLAUDE.md, memory, settings for cloud-synced path strings -->
<!-- Populated by Plan 02 -->

*[Phase content to be added]*

---

## Phase 5 — Report

<!-- Phase 5 content: traffic light summary, findings by phase, consolidated action list -->
<!-- Populated by Plan 03 -->

*[Phase content to be added]*

---

## Definition of Done

This verification session is complete when:
- All project directories have been audited for health (git fsck, git status, hidden dirs, file counts, symlinks)
- All path-hash entries under `~/.claude/projects/` have been decoded, classified, and checked
- CLAUDE.md files, memory files, and settings files have been searched for cloud-synced path references
- Every finding has been mapped to an actionable recommendation
- `verification-report.md` exists in CWD with traffic light summary, findings by audit area, and consolidated action list
- The user has been presented with the report summary in the terminal

---

## Guardrails

- **Never modify anything.** This is a read-only audit. The only filesystem write is `verification-report.md` in CWD. No edits, no deletions, no moves, no renames. If you find something that needs fixing, report it — do not fix it.
- **Never assume paths.** Auto-detect first. If detection fails, ask. If both fail, log the failure and continue.
- **Platform-correct commands everywhere.** Every command must match the detected shell context. Verify before executing.
- **Proportional artifacts.** Scale output to scope — same structural completeness regardless of project count, but don't pad a 2-project audit with unnecessary bulk.
- **The methodology is non-negotiable.** All five audit phases run for every applicable item. No shortcuts, no skipped phases, no abbreviated checks. The value of verification is completeness.
- **Handle known edge cases:**
  - **Permission errors** — if a project directory or path-hash entry cannot be read, log the error in the report and continue to the next item
  - **Missing ~/.claude/projects/ directory** — report that no Claude Code project settings exist; the project health audit (Phase 2) still runs on project directories
  - **Empty project directories** — report as a finding, do not skip
  - **Path-hash decoding ambiguity** — when multiple valid decoded paths exist, present all candidates in the report
  - **bash-on-Windows path formats** — use platform-correct paths for all audit commands
  - **Post-cleanup state** — if few or no stale entries exist, note this as a healthy state rather than flagging absence
  - **Fresh/never-migrated environment** — run the same audit regardless of migration history; report current state, which may include projects still on cloud-synced storage
- **Graceful cross-prompt state.** If path-hash directories that might be expected are absent, interpret this as possible prior cleanup, not corruption. Do not escalate missing entries as errors if a plausible explanation exists.
- **If everything is clean, say so.** A clean environment gets positive confirmation per audit area — each section shows what passed, not just silence. The user sees proof that the check ran.
