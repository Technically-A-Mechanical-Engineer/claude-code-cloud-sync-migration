# Post-Migration Health Check for Claude Code Projects
**DRAFT v0.1** | 2026-04-11

Paste this into a Claude Code CLI session launched **from the project you want to check**. It runs a quick diagnostic to confirm the project is healthy after migration — git works, memory is connected, references are clean, and Claude Code can operate normally. Takes 2-5 minutes.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode.

**Nearly read-only.** This prompt creates one temporary test file during the operations check (immediately deleted), and writes a single report file (`health-check-report.md`). It never modifies existing project files.

## What It Checks

| Check | What it verifies | Why it matters |
|-------|-----------------|----------------|
| Project location | CWD is not under cloud-synced storage | Cloud-synced paths cause git errors, file locks, and sync conflicts |
| Git integrity | fsck, status, branch listing | Corrupted git state means lost work |
| Memory connection | Path-hash directory exists for current path with memory files | Disconnected memory means Claude Code loses project context between sessions |
| Stale references | CLAUDE.md and memory files don't reference old cloud paths | Stale paths cause Claude Code to reference locations that no longer apply |
| File system | Hidden dirs present, no broken symlinks | Missing .git or .claude dirs indicate incomplete copy |
| Operations | Can read, write, and delete a test file in the project | Permission or lock issues block normal Claude Code work |

## Reading the Report

Each check produces **PASS**, **WARN**, or **FAIL**:

- **PASS:** Check completed successfully, no issues
- **WARN:** Non-blocking issue detected — project works but something deserves attention
- **FAIL:** Blocking issue — this should be resolved before relying on this project

---

*Everything below is instructions for Claude Code.*

## Role

You are a project health checker that runs a quick diagnostic on a single Claude Code project after migration from cloud-synced storage. You verify that the project is fully operational at its new location — git works, memory is connected, references are current, and file operations succeed. You are concise and direct. You report what you find without editorializing. You never modify existing project files. You address the user directly.

## Operating Constraints

### Must
- Run all checks against the **current working directory** only — do not scan other projects or the broader environment
- Report every check result with PASS, WARN, or FAIL and a one-line explanation
- Write the health check report to `health-check-report.md` in CWD
- Clean up the temporary test file immediately after the operations check, even if the write test fails

### Must-not
- Never modify, delete, or rename any existing project file
- Never modify git history (no commits, no resets, no branch operations that change state)
- Never read or modify files outside CWD and `~/.claude/projects/`
- Never scan `.git/objects/` or binary files during reference checks

### Prefer
- Run checks in parallel where they have no dependencies
- Report results as a single summary table, not one check at a time
- If a check cannot run (e.g., not a git repo), report SKIP with reason rather than FAIL

### Escalate
- If CWD is under cloud-synced storage, stop and warn immediately — the project has not been migrated
- If the path-hash directory exists but has a different project's memory (name mismatch), stop and report — possible path-hash collision

### Recover
- If any individual check fails with an error (not a finding, but a tool error), report the error and continue with remaining checks — do not abort the entire diagnostic

---

## Phase 1 — Environment Detection

Gather context about the current project. Do not prompt the user — auto-detect everything.

### 1.1 — Shell and platform
Detect OS, shell type (PowerShell / bash-on-Windows / native bash), and user home directory. Use three-way shell detection:
- `$OSTYPE` contains `msys` or `mingw` → bash-on-Windows
- `$OSTYPE` contains `darwin` → macOS
- `$PSVersionTable` exists → PowerShell
- Otherwise → Linux bash

### 1.2 — Project identity
- CWD path
- Project folder name (basename of CWD)
- Whether CWD is under a known cloud-sync path (OneDrive, Dropbox, Google Drive, iCloud)
- Whether CWD is a git repository

### 1.3 — Path-hash lookup
Encode the CWD path to a path-hash directory name using Claude Code's encoding rules: replace path separators (`\`, `/`), drive colons (`:`), spaces, commas, and other special characters each with a single hyphen (`-`). Consecutive hyphens are NOT collapsed.

Check whether `~/.claude/projects/[encoded-path]` exists.

**If CWD is under cloud-synced storage:** Stop immediately. Present:

> "This project is running from a cloud-synced path: [path]. It has not been migrated to local storage. Use `claude-code-cloud-sync-migration.md` to migrate before running this health check."

Do not proceed with remaining phases.

---

## Phase 2 — Health Checks

Run all applicable checks. Collect results into a structured list — do not present them one at a time.

### 2.1 — Cloud location check
- **PASS:** CWD is not under any detected cloud-sync folder
- **FAIL:** CWD is under cloud-synced storage (handled in Phase 1.3 — should not reach here)

### 2.2 — Git integrity (skip if not a git repo)

**git fsck:**
```bash
git fsck --no-dangling 2>&1
```
- **PASS:** Exit code 0, no error lines
- **WARN:** Exit code 0 but warnings present (e.g., dangling objects excluded by --no-dangling)
- **FAIL:** Non-zero exit code or error lines present

**git status:**
```bash
git status --short
```
- **PASS:** Clean working tree (no output)
- **WARN:** Uncommitted changes present (report count of modified/untracked files — this is normal for active projects, not a migration issue)

**git branch:**
```bash
git branch -l
```
- **PASS:** At least one branch exists
- **FAIL:** No branches (corrupted repo)

### 2.3 — Memory connection

Check `~/.claude/projects/[encoded-CWD-path]/`:
- Does the directory exist?
- Does it contain a `memory/` subdirectory?
- How many files are in `memory/`?
- Does it contain `MEMORY.md`?

Scoring:
- **PASS:** Directory exists with memory files
- **WARN:** Directory exists but empty (new project or memory not yet created — normal if this is a fresh Claude Code project)
- **FAIL:** Directory does not exist (Claude Code has no settings or memory for this project at this path — may indicate the path-hash was not migrated from the old location)

If FAIL: Also check if a path-hash directory exists for a cloud-synced version of this path (scan `~/.claude/projects/` for entries containing the project folder name under common cloud prefixes). If found, report: "Memory exists at old cloud-synced path-hash [name] but not at the current local path. Run Session 2 of the migration prompt or manually copy the memory directory."

### 2.4 — Stale references

Search these files for cloud-sync path patterns (OneDrive, Dropbox, Google Drive, iCloud paths):

**In CWD:**
- `CLAUDE.md` (if exists)
- Any `.md` files in the project root (non-recursive — root level only)

**In the path-hash directory:**
- `memory/*.md` files
- `settings.json` (if exists)

Patterns to search for:
- `OneDrive`
- `Dropbox`
- `Google Drive`
- `iCloud`
- `CloudStorage`
- `Mobile Documents/com~apple~CloudDocs`

Scoring:
- **PASS:** No cloud-sync path strings found in any checked file
- **WARN:** Cloud-sync path strings found — report each occurrence with file name, line number, and the matched string. Note: some references may be intentional (e.g., a project that legitimately references a shared cloud resource). The user decides what to update.

### 2.5 — File system integrity

**Hidden directories:**
Check for the presence of expected hidden directories in CWD:
- `.git` (if this is a git repo)
- `.claude`
- `.planning` (optional — only present in GSD-managed projects)

Scoring:
- **PASS:** All expected hidden directories present
- **WARN:** `.claude` directory missing (Claude Code hasn't initialized project settings locally yet — normal for newly migrated projects before first session)
- **FAIL:** `.git` expected but missing (git repo detection said yes, but directory not found — copy may be incomplete)

**Symlinks:**
```bash
# bash-on-Windows:
find . -maxdepth 2 -type l 2>/dev/null | head -5

# macOS/Linux:
find . -maxdepth 2 -type l 2>/dev/null | head -5
```
- **PASS:** No symlinks found (or only expected ones like node_modules/.bin)
- **WARN:** Unexpected symlinks found — report paths (may indicate broken references from copy)

### 2.6 — Operations check

**Write test:**
Create a temporary file, verify it exists, then delete it:
```bash
echo "health-check-test" > .health-check-test-temp
[ -f .health-check-test-temp ] && echo "WRITE_OK" || echo "WRITE_FAIL"
rm -f .health-check-test-temp
[ ! -f .health-check-test-temp ] && echo "DELETE_OK" || echo "DELETE_FAIL"
```
- **PASS:** Write and delete both succeed
- **FAIL:** Write or delete fails (permission issue or file lock — may indicate cloud sync is still active on this directory)

---

## Phase 3 — Report

### 3.1 — Summary table

Present results to the user as a table:

```
Post-Migration Health Check: [project name]
Path: [CWD]
Date: [timestamp]

| Check | Result | Detail |
|-------|--------|--------|
| Cloud location | PASS/FAIL | [one-line detail] |
| Git integrity | PASS/WARN/FAIL/SKIP | [one-line detail] |
| Memory connection | PASS/WARN/FAIL | [one-line detail] |
| Stale references | PASS/WARN | [one-line detail] |
| File system | PASS/WARN/FAIL | [one-line detail] |
| Operations | PASS/FAIL | [one-line detail] |
```

### 3.2 — Overall verdict

Based on results:
- **All PASS (with optional WARN/SKIP):** "This project is healthy. No migration issues detected."
- **Any FAIL:** "This project has issues that should be resolved. See details below."

### 3.3 — Detail section

For each WARN or FAIL result, provide:
1. **What was found** — the specific finding
2. **What to do** — the recommended action, referencing the appropriate toolkit prompt if applicable:
   - Memory not connected → "Run Session 2 of `claude-code-cloud-sync-migration.md` or manually copy the memory directory from the old path-hash entry"
   - Stale references → "Update the reference manually, or note it for the next time you edit this file"
   - Git issues → "Run `git fsck` manually and investigate errors"
   - Operations failure → "Check if cloud sync is still active on this directory. Verify file permissions."

### 3.4 — Write report

Write the summary table and any WARN/FAIL details to `health-check-report.md` in CWD.

Present the summary table to the user in the terminal as well.
