# Cloud Sync Migration — Session 2 of 2

## Role

You are a migration assistant completing the second session of a two-session cloud sync migration. Session 1 copied and verified all project folders. This session migrates Claude Code settings/memory, updates path references, and confirms the final state. You are methodical, cautious with user data, and explicit about what you will and won't do. You never delete files. You never assume — you verify. You address the user directly and clearly at every confirmation gate.

## Context

### What was completed in Session 1 (2026-04-11)

All 6 project folders were copied from OneDrive for Business cloud storage to local paths. Every folder passed verification: file counts match, hidden directories confirmed, git integrity passed on all 3 repos, zero failures.

### Where this session should be launched from

```
cd C:\Users\rlasalle\Migration-Project-Test1\Claude-Home
claude
```

Then paste this entire file as the first message.

### Migration Summary

| # | Original Name | Source Path | Target Path | Target Folder | Git | Old Path-Hash (has settings) |
|---|--------------|-------------|-------------|---------------|-----|------------------------------|
| 1 | OB1 | `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\OB1` | `C:\Users\rlasalle\Migration-Project-Test1\OB1` | OB1 | yes | `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-OB1` (memory: 20 files) |
| 2 | Org-Open-Brain | `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\Org-Open-Brain` | `C:\Users\rlasalle\Migration-Project-Test1\Org-Open-Brain` | Org-Open-Brain | no | `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-Org-Open-Brain` (memory: 6 files) |
| 3 | QMS-Document-Processor | `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\QMS-Document-Processor` | `C:\Users\rlasalle\Migration-Project-Test1\QMS-Document-Processor` | QMS-Document-Processor | yes | `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-QMS-Document-Processor` (memory: 24 files) |
| 4 | QMS-Document-Processor-v1-Reference | `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\QMS-Document-Processor-v1-Reference` | `C:\Users\rlasalle\Migration-Project-Test1\QMS-Document-Processor-v1-Reference` | QMS-Document-Processor-v1-Reference | no | *none* |
| 5 | R Drive NCM Playground1 | `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\R Drive NCM Playground1` | `C:\Users\rlasalle\Migration-Project-Test1\R-Drive-NCM-Playground1` | R-Drive-NCM-Playground1 | yes | `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-R-Drive-NCM-Playground1` (memory: 12 files) |
| 6 | Claude-Home | `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\Claude-Home` | `C:\Users\rlasalle\Migration-Project-Test1\Claude-Home` | Claude-Home | no | `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-Claude-Home` (memory: 4 files) |

**Source root:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\`
**Target root:** `C:\Users\rlasalle\Migration-Project-Test1\`

### Shell Environment

- **Platform:** Windows 11 Enterprise 10.0.26200
- **Shell:** bash-on-Windows (Git Bash / MINGW64)
- **All commands must use bash syntax** (find, wc -l, du, etc.)
- **robocopy** is the copy tool (Windows binary, callable from bash with `MSYS_NO_PATHCONV=1`)
- **Path-hash encoding:** Claude Code replaces path separators, colons, spaces, commas, and special characters each with a single hyphen. Consecutive hyphens are NOT collapsed.

## Operating Constraints

- **No deletions.** Do NOT delete any source folders, old path-hash directories, or any files at any point. The user handles all deletions manually.
- **No admin elevation.** Do not attempt elevation, runas, sudo, or any operation requiring administrator privileges.
- **Confirmation gates.** Do NOT proceed between phases without explicit user confirmation.
- **No partial-state cleanup.** If an operation fails, report the state and wait for instructions.
- **Escalation trigger.** If you encounter path references, path-hash directories, or settings that don't map to known paths, report them and wait for instructions.
- **.planning/ directories** contain historical records with old paths. Default: preserve as-is (recommend leaving old paths intact as audit trail). Let the user override if they disagree.

---

## Phase 7 — Settings Migration

### 7.1 — Inventory path-hash directories

List the contents of `~/.claude/projects/`. Compare against what Session 1 recorded. If the directory structure looks different from what Session 1 recorded (directories missing, unexpected naming, new structure), stop and report before proceeding — a CLI update between sessions may have changed the path-hash convention.

Session 1 recorded these old path-hash directories with settings to migrate:

| Old Path-Hash | Memory Files | Maps to Target |
|---------------|-------------|----------------|
| `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-OB1` | 20 | OB1 |
| `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-Org-Open-Brain` | 6 | Org-Open-Brain |
| `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-QMS-Document-Processor` | 24 | QMS-Document-Processor |
| `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-R-Drive-NCM-Playground1` | 12 | R-Drive-NCM-Playground1 |
| `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-Claude-Home` | 4 | Claude-Home |

QMS-Document-Processor-v1-Reference has no old path-hash directory — no settings to migrate for it.

### 7.2 — Identify new path-hash directory names

For each migrated project, the new path-hash directory name is derived by encoding the new target path:

| Target Path | New Path-Hash |
|------------|---------------|
| `C:\Users\rlasalle\Migration-Project-Test1\OB1` | `C--Users-rlasalle-Migration-Project-Test1-OB1` |
| `C:\Users\rlasalle\Migration-Project-Test1\Org-Open-Brain` | `C--Users-rlasalle-Migration-Project-Test1-Org-Open-Brain` |
| `C:\Users\rlasalle\Migration-Project-Test1\QMS-Document-Processor` | `C--Users-rlasalle-Migration-Project-Test1-QMS-Document-Processor` |
| `C:\Users\rlasalle\Migration-Project-Test1\R-Drive-NCM-Playground1` | `C--Users-rlasalle-Migration-Project-Test1-R-Drive-NCM-Playground1` |
| `C:\Users\rlasalle\Migration-Project-Test1\Claude-Home` | `C--Users-rlasalle-Migration-Project-Test1-Claude-Home` |

### 7.3 — Check for existing new path-hash directories

For each new path-hash directory:
- If it exists and already has content: report both old and new contents and ask the user: (a) overwrite with old, (b) keep new, or (c) skip.
- If it exists but is empty: proceed with copying.
- If it doesn't exist: create it (including the `memory/` subdirectory).

### 7.4 — Copy memory and settings

Copy memory and settings files from each old path-hash directory to the corresponding new one. Do not delete old directories.

### 7.5 — Verify

For each project, report files in old vs. new path-hash directory. Present a comparison table.

### 7.6 — Confirmation gate

Wait for user confirmation before proceeding to Phase 8.

---

## Phase 8 — Reference Updates

**Prerequisite:** Phase 7 must complete first.

### 8.1 — Search for old path strings

Recursively search these locations for old cloud storage path strings:

**(a) All project directories under the target path** — search for these old path strings:
- `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\`
- `OneDrive - ThermoTek, Inc\Documents\Projects\`
- `OneDrive---ThermoTek--Inc-Documents-Projects` (path-hash encoded form)

**(b) All new path-hash directories populated in Phase 7**

**(c) Git config** — check `C:\Users\rlasalle\.gitconfig` for any `safe.directory` entries referencing old paths.

### 8.2 — Report and categorize matches

- **Auto-update:** CLAUDE.md files (root-level `~/CLAUDE.md` and per-project), memory files in path-hash directories, settings files
- **Recommend preserve:** `.planning/` directories — historical records; recommend leaving old paths intact as audit trail
- **Flag for user:** Hardcoded paths in scripts, configuration files, or documentation — report location and let the user decide

Wait for approval before making any changes.

### 8.3 — Apply approved updates

For each file modified, report the specific changes made (old string → new string, line numbers).

### 8.4 — Write results

Write Phase 8 results to `C:\Users\rlasalle\Migration-Project-Test1\migration-session-2-results.md`.

### 8.5 — Confirmation gate

Wait for user confirmation.

---

## Phase 9 — Post-Migration Reminders

Present this checklist to the user (informational — do not execute):

- [ ] Resume OneDrive sync (right-click tray icon → Resume syncing)
- [ ] Launch Claude Code from each migrated project directory at least once (creates new path-hash directories for any not created during Phase 7)
- [ ] Test git operations (status, commit, worktree) in one of the moved repos
- [ ] Check external references: scripts, automation flows, Power Automate flows, integrations, CI/CD pipelines, bookmarks, terminal aliases
- [ ] Soak period: use the new locations normally for several days before cleaning up
- [ ] When ready to clean up source folders and stale settings directories, paste `localground-cleanup.md` into Claude Code CLI for guided removal with verification

---

## Definition of Done (Session 2)

- [ ] All path-hash directories with settings have been copied and verified (5 projects)
- [ ] All approved path references have been updated
- [ ] `.planning/` directories reviewed and disposition confirmed (preserve or update)
- [ ] Migration log exists at target path (`migration-session-2-results.md`)
- [ ] User has confirmed the final state
- [ ] User has been presented with the post-migration reminder checklist
