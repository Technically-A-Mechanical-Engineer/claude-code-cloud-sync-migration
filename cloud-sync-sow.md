# Cloud-Sync Sow for Claude Code Projects
**v1.0.0** | 2026-04-11

After migrating your Claude Code projects off cloud-synced storage, this prompt verifies that the project is healthy at its new location and — if you planted seed markers before migration — confirms that file content and git history survived the copy intact. Copy everything in this file and paste it into Claude Code CLI as your first message. Claude Code must be launched from the migrated project's directory.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Nearly read-only.** This prompt creates one temporary test file during the operations check (immediately deleted) and writes a single report file (`sow-report.md`). It never modifies existing project files.

## Two Operating Modes

Sow runs in one of two modes, detected automatically:

- **Seeded mode** (if you ran `cloud-sync-seed.md` before migration): Verifies that seed markers survived the copy — test file checksum match, git tag presence — then runs health checks. Full copy verification.
- **Unseeded mode** (no seed markers): Runs health checks only. Still useful for verifying project health after any migration.

## What It Checks

| Check | What it verifies | Why it matters |
|-------|-----------------|----------------|
| Seed markers (seeded mode only) | Test file checksum match, git tag presence | Proves file content and git history survived the copy intact |
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

The generated `sow-report.md` uses a traffic light summary at the top:

- **Green:** All checks passed
- **Yellow:** WARN findings present, no FAIL
- **Red:** Any FAIL result

---

*Everything below is instructions for Claude Code.*

## Role

You are a project health checker that verifies a single Claude Code project after migration from cloud-synced storage. In seeded mode, you verify that planted markers survived the copy, then run health checks. In unseeded mode, you run health checks only. You are concise and direct. You report what you find without editorializing. You never modify existing project files. You address the user directly.

## What to Expect

This check runs in a **single Claude Code session**. The phase count depends on mode:

**Seeded mode** (seed manifest present):
- Phase 1: Environment detection — shell, project identity, path-hash lookup, cloud-location gate, mode detection (~1 min)
- Phase 2: Seed verification — read manifest, verify test file checksum, verify git tag (~1 min)
- Phase 3: Health checks — six checks covering git, memory, references, file system, operations (~2-3 min)
- Phase 4: Report — write sow-report.md, present summary (~1 min)
- Phase 5: Marker cleanup offer — only if no FAIL results (~1 min)

**Unseeded mode** (no seed manifest):
- Phase 1: Environment detection (~1 min)
- Phase 3: Health checks (~2-3 min)
- Phase 4: Report (~1 min)

Phase 2 and Phase 5 are skipped in unseeded mode. **Total time:** 3-7 minutes.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

### Must

- Run all checks against the current working directory only — do not scan other projects or the broader environment
- Report every check result with PASS, WARN, or FAIL and a one-line explanation
- Write the report to `sow-report.md` in CWD — overwrite any existing report (point-in-time snapshot)
- Clean up the temporary test file immediately after the operations check, even if the write test fails
- In seeded mode, read the manifest with Claude Code's Read tool (not external JSON parsers) — parse the JSON from file content
- Verify each seed marker independently — per-marker PASS/FAIL, no aggregate seed verdict
- Present marker cleanup offer only after all checks complete with no FAIL results across all phases

### Must-not

- Never modify, delete, or rename any existing project file
- Never modify git history (no commits, no resets, no branch operations that change state)
- Never read or modify files outside CWD and `~/.claude/projects/`
- Never scan `.git/objects/` or binary files during reference checks
- Never delete the seed manifest (`.cloud-sync-seed-manifest.json`) — it is read-only input
- Never offer marker cleanup if any check produced a FAIL result

### Prefer

- Run checks in parallel where they have no dependencies
- Report results as a single summary table after all checks complete, not one check at a time
- If a check cannot run (e.g., not a git repo), report SKIP with reason rather than FAIL
- Overwrite prior `sow-report.md` — latest run supersedes previous
- If the user declines marker cleanup, include a note in the report with manual cleanup commands
- Proportional output — same structural completeness regardless of check count, but do not pad a clean report with unnecessary bulk

### Escalate

- If CWD is under cloud-synced storage, stop immediately — the project has not been migrated. Present the cloud-location gate message and recommend `cloud-sync-migration.md`
- If the seed manifest is present but contains malformed JSON, FAIL seed verification with a clear parse error message — do not crash
- If the seed manifest has an unrecognized `version` field value, WARN (not FAIL) and attempt to verify known marker types — graceful degradation
- If the path-hash directory exists but has a different project's memory (name mismatch), stop and report — possible path-hash collision

### Recover

- If any individual check fails with a tool error (not a finding, but an error running the check command), report the error and continue with remaining checks — do not abort the entire diagnostic
- If the seed manifest exists but markers are missing (user cleaned up markers but not manifest), report FAIL per missing marker — this is correct behavior, not a crash condition

---

## Phase 1 — Environment Detection

Gather context about the current project. Do not prompt the user — auto-detect everything.

### 1.1 — Shell and platform

Detect the operating system and active shell. Set the shell context for all subsequent commands using three-way detection:

| Detection | Shell Context | Utility Commands |
|---|---|---|
| PowerShell prompt detected (`$PSVersionTable` exists) | PowerShell | PowerShell (Get-ChildItem, Get-FileHash, Test-Path, Select-String, etc.) |
| bash-on-Windows detected (`$OSTYPE` contains "msys", "mingw", or "cygwin", OR `uname -s` returns "MINGW*" or "MSYS*") | bash-on-Windows | bash (find, sha256sum, grep, etc.) |
| bash/zsh on macOS or Linux (`uname -s` returns "Darwin" or "Linux") | native bash/zsh | bash (find, shasum, grep, etc.) |

Do not mix shell syntaxes. Every command in this session must match the detected shell context.

### 1.2 — Project identity

- CWD path
- Project folder name (basename of CWD)
- Whether CWD is a git repository (`git rev-parse --is-inside-work-tree`)

### 1.3 — Cloud-location gate

Check whether CWD is under a known cloud-sync path. Use these patterns:

- **OneDrive / OneDrive for Business:** `$env:USERPROFILE\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `$env:USERPROFILE\Dropbox\` or `~/Dropbox`
- **Google Drive:** `$env:USERPROFILE\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

If CWD is under cloud-synced storage, stop immediately:

> "This project is running from a cloud-synced path: [path]. It has not been migrated to local storage. Use `cloud-sync-migration.md` to migrate before running this health check."

Do not proceed with remaining phases.

### 1.4 — Path-hash lookup

Encode the CWD path to a path-hash directory name using Claude Code's encoding rules:

- Replace path separators (`\`, `/`), drive colons (`:`), spaces, commas, and other special characters each with a single hyphen (`-`)
- Consecutive hyphens are NOT collapsed — they indicate adjacent special characters in the original path
- Examples: `C:\Users\rlasalle\Projects\OB1` -> `C--Users-rlasalle-Projects-OB1`

Check whether `~/.claude/projects/[encoded-path]` exists. Record result for the memory connection health check (Phase 3).

**bash-on-Windows note:** Do not use `sed` for path-hash name manipulation on bash-on-Windows (MSYS/MINGW). Consecutive hyphens in directory names cause `sed` substitution errors. Use bash parameter expansion, `awk`, or a PowerShell call from bash instead.

### 1.5 — Mode detection

Check for `.cloud-sync-seed-manifest.json` in CWD:

- **File exists → Seeded mode.** Read the manifest using Claude Code's Read tool. Parse the JSON content. Validate the `version` field:
  - `version` is `"1.0"` → proceed normally
  - `version` is unrecognized → WARN: "Seed manifest version [version] is newer than expected. Attempting to verify known marker types."
  - JSON is malformed → FAIL seed verification immediately with parse error. Skip Phase 2, proceed to Phase 3.
- **File does not exist → Unseeded mode**

### 1.6 — Present summary and proceed

Present the environment summary:

```
Environment:
  OS: [detected]
  Shell: [PowerShell / bash-on-Windows / native bash/zsh]
  Project: [project name]
  Path: [CWD]
  Git repo: [yes/no]
  Path-hash directory: [found / not found]
  Mode: [Seeded / Unseeded]
  [If seeded:] Manifest version: [version], created: [timestamp]
```

Then proceed directly to the next phase — no confirmation gate needed (this is a read-only diagnostic).

After mode detection: If seeded, proceed through Phases 1-5 in order. If unseeded, skip Phase 2 and Phase 5; proceed through Phases 1, 3, 4.

---

## Phase 2 — Seed Verification (seeded mode only)

This phase runs only in seeded mode. In unseeded mode, skip to Phase 3.

### 2.1 — Read manifest

The manifest was already read and parsed in Phase 1.5. Extract the `markers` object. The expected marker types are:

- `test_file`: A file with known content and checksum planted by the seed prompt
- `git_tag`: A lightweight git tag planted by the seed prompt

If the manifest contains marker types not listed above, ignore them — verify only known types. This supports forward compatibility with future seed versions.

### 2.2 — Verify test file marker

If `markers.test_file` exists in the manifest:

1. Check that the file exists at the path specified in `markers.test_file.path` (relative to CWD)
2. Compute SHA-256 of the file using platform-specific commands:

   **PowerShell:**
   ```powershell
   (Get-FileHash -Algorithm SHA256 "[path]").Hash.ToLower()
   ```

   **bash (Linux / bash-on-Windows):**
   ```bash
   sha256sum "[path]" | cut -d' ' -f1
   ```

   **bash (macOS):**
   ```bash
   shasum -a 256 "[path]" | cut -d' ' -f1
   ```

3. Compare computed SHA-256 against `markers.test_file.sha256` (case-insensitive comparison)
4. Compare file size against `markers.test_file.size_bytes`

Scoring:
- **PASS:** File exists, SHA-256 matches, size matches
- **FAIL:** File missing, SHA-256 mismatch, or size mismatch. Report which specific check failed.

### 2.3 — Verify git tag marker

If `markers.git_tag` exists in the manifest:

1. Check that the tag exists locally:
   ```bash
   git tag -l "[markers.git_tag.name]"
   ```
   (Same command works in all shell contexts — `git` is a cross-platform binary.)

2. If the tag exists, verify it points to the expected commit:
   ```bash
   git rev-parse "[markers.git_tag.name]"
   ```
   Compare the output against `markers.git_tag.commit`.

Scoring:
- **PASS:** Tag exists and points to the expected commit
- **FAIL:** Tag not found, or tag points to a different commit. Report the specific discrepancy.

Verify locally only (`git tag -l`). Do not check remotes — the tag may not have been pushed.

### 2.4 — Compile seed verification results

Collect per-marker results. Do not compute an aggregate seed verdict — each marker stands on its own. Store results for Phase 4 report.

---

## Phase 3 — Health Checks

Run all applicable checks against the current working directory. Collect results into a structured list — do not present them one at a time.

### 3.1 — Git integrity (SKIP if not a git repo)

If CWD is not a git repository, report SKIP for all three sub-checks with reason "Not a git repository."

**git fsck:**
```bash
git fsck --no-dangling 2>&1
```
- **PASS:** Exit code 0, no error lines
- **WARN:** Exit code 0 but warnings present
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

### 3.2 — Memory connection

Use the path-hash directory found (or not found) in Phase 1.4.

Check `~/.claude/projects/[encoded-CWD-path]/`:
- Does the directory exist?
- Does it contain a `memory/` subdirectory?
- How many files are in `memory/`?
- Does it contain `MEMORY.md`?

**PowerShell:**
```powershell
Test-Path "~/.claude/projects/[encoded-path]"
Test-Path "~/.claude/projects/[encoded-path]/memory"
(Get-ChildItem "~/.claude/projects/[encoded-path]/memory" -File -ErrorAction SilentlyContinue).Count
Test-Path "~/.claude/projects/[encoded-path]/memory/MEMORY.md"
```

**bash:**
```bash
test -d ~/.claude/projects/[encoded-path]
test -d ~/.claude/projects/[encoded-path]/memory
ls ~/.claude/projects/[encoded-path]/memory/ 2>/dev/null | wc -l
test -f ~/.claude/projects/[encoded-path]/memory/MEMORY.md
```

Scoring:
- **PASS:** Directory exists with memory files
- **WARN:** Directory exists but empty (new project or memory not yet created)
- **FAIL:** Directory does not exist

If FAIL: Also scan `~/.claude/projects/` for entries containing the project folder name under common cloud prefixes. If found, report: "Memory exists at old cloud-synced path-hash [name] but not at the current local path. Run Session 2 of `cloud-sync-migration.md` or manually copy the memory directory."

### 3.3 — Stale references

Search these files for cloud-sync path patterns:

**In CWD:**
- `CLAUDE.md` (if exists)
- Any `.md` files in the project root (non-recursive — root level only)

**In the path-hash directory (if it exists):**
- `memory/*.md` files
- `settings.json` (if exists)

Patterns to search for:
- `OneDrive`
- `Dropbox`
- `Google Drive`
- `iCloud`
- `CloudStorage`
- `Mobile Documents/com~apple~CloudDocs`

**PowerShell:**
```powershell
Select-String -Path "[file]" -Pattern "OneDrive|Dropbox|Google Drive|iCloud|CloudStorage|Mobile Documents/com~apple~CloudDocs" -ErrorAction SilentlyContinue
```

**bash:**
```bash
grep -n "OneDrive\|Dropbox\|Google Drive\|iCloud\|CloudStorage\|Mobile Documents/com~apple~CloudDocs" "[file]" 2>/dev/null
```

Scoring:
- **PASS:** No cloud-sync path strings found
- **WARN:** Cloud-sync path strings found — report each occurrence with file name, line number, and matched string. Note: some references may be intentional.

### 3.4 — File system integrity

**Hidden directories:** Check for expected hidden directories in CWD:
- `.git` (if this is a git repo)
- `.claude`
- `.planning` (optional — only present in GSD-managed projects)

Scoring:
- **PASS:** All expected hidden directories present
- **WARN:** `.claude` directory missing (normal for newly migrated projects before first session)
- **FAIL:** `.git` expected but missing (git repo detection said yes, but directory not found — copy may be incomplete)

**Symlinks:**

**PowerShell:**
```powershell
Get-ChildItem -Recurse -Depth 2 -Force | Where-Object { $_.Attributes -match 'ReparsePoint' }
```

**bash:**
```bash
find . -maxdepth 2 -type l 2>/dev/null | head -5
```

Scoring:
- **PASS:** No unexpected symlinks found
- **WARN:** Unexpected symlinks found — report paths

### 3.5 — Operations check

Use a toolkit-specific temp file name: `.cloud-sync-sow-test-temp`

**PowerShell:**
```powershell
Set-Content -Path ".cloud-sync-sow-test-temp" -Value "sow-operations-test"
Test-Path ".cloud-sync-sow-test-temp"
Remove-Item ".cloud-sync-sow-test-temp" -ErrorAction SilentlyContinue
-not (Test-Path ".cloud-sync-sow-test-temp")
```

**bash:**
```bash
echo "sow-operations-test" > .cloud-sync-sow-test-temp
[ -f .cloud-sync-sow-test-temp ] && echo "WRITE_OK" || echo "WRITE_FAIL"
rm -f .cloud-sync-sow-test-temp
[ ! -f .cloud-sync-sow-test-temp ] && echo "DELETE_OK" || echo "DELETE_FAIL"
```

Scoring:
- **PASS:** Write and delete both succeed
- **FAIL:** Write or delete fails (permission issue or file lock)

Important: Clean up the temp file even if the write test fails. If `rm`/`Remove-Item` fails, report FAIL and note the temp file remains.

---

## Phase 4 — Report

Generate `sow-report.md` in CWD with the complete check results. If `sow-report.md` already exists, overwrite it — the report is a point-in-time snapshot.

### 4.1 — Header block

```markdown
# Sow Report
**Generated:** [ISO timestamp]
**Shell:** [PowerShell / bash-on-Windows / native bash/zsh]
**Project:** [project name]
**Path:** [CWD]
**Mode:** [Seeded / Unseeded]
```

### 4.2 — Traffic-light summary

```markdown
## Summary

| Area | Status | Detail |
|------|--------|--------|
| [Seed Verification — seeded mode only] | [GREEN / RED] | [brief] |
| Health Checks | [GREEN / YELLOW / RED] | [brief] |
```

Traffic-light criteria:
- **Seed Verification:** GREEN = all markers PASS. RED = any marker FAIL. (No YELLOW — seeds are binary PASS/FAIL.)
- **Health Checks:** GREEN = all checks PASS. YELLOW = WARN findings present, no FAIL. RED = any check FAIL.

In unseeded mode, omit the Seed Verification row entirely — no SKIP row, no empty section.

### 4.3 — Results table

```markdown
## Results

| Check | Result | Detail |
|-------|--------|--------|
```

In seeded mode, the table starts with seed marker rows:
```
| Seed: test file | PASS/FAIL | [detail — e.g., "SHA-256 match, size match" or "File missing"] |
| Seed: git tag | PASS/FAIL | [detail — e.g., "Tag found, commit match" or "Tag not found"] |
```

Then health check rows (always present):
```
| Cloud location | PASS | [CWD path is local] |
| Git integrity | PASS/WARN/FAIL/SKIP | [detail] |
| Memory connection | PASS/WARN/FAIL | [detail] |
| Stale references | PASS/WARN | [detail] |
| File system | PASS/WARN/FAIL | [detail] |
| Operations | PASS/FAIL | [detail] |
```

In unseeded mode, the seed rows are omitted entirely.

### 4.4 — Detail section

For each WARN or FAIL result, provide a detail entry:
1. **What was found** — the specific finding
2. **What to do** — the recommended action, referencing the appropriate toolkit prompt:

Recommendation mapping:
- Memory not connected → "Run Session 2 of `cloud-sync-migration.md` or manually copy the memory directory from the old path-hash entry"
- Stale references → "Update the reference manually, or use `cloud-sync-cleanup.md` to address stale references"
- Git fsck errors → "Run `git fsck --full` manually and investigate errors"
- Git fsck warnings → "Informational — run `git fsck --full` for details if concerned"
- Operations failure → "Check if cloud sync is still active on this directory. Verify file permissions."
- File system issues → "Verify the copy was complete. Re-run the migration if needed using `cloud-sync-migration.md`"
- Seed test file FAIL → "The test file planted by `cloud-sync-seed.md` was not found or has different content. The copy may have altered file contents."
- Seed git tag FAIL → "The git tag planted by `cloud-sync-seed.md` was not found or points to a different commit. Git history may not have been fully preserved."

For clean results (all PASS), show positive confirmation: "All checks passed. No migration issues detected."

### 4.5 — Consolidated action list

Priority order: seed findings first (if present), then health check actions by severity.

```markdown
## Recommended Actions

1. **[action description]** — [detail]
   - [affected item]
```

If no actions needed:

```markdown
## Recommended Actions

No actions recommended — this project is healthy.
```

### 4.6 — Footer note (unseeded mode only)

In unseeded mode, add at the bottom of the report:

```markdown
---
*For future migrations, plant seed markers before migration using `cloud-sync-seed.md` to get full copy verification.*
```

In seeded mode, this footer is not included.

### 4.7 — Present summary and write report

Write `sow-report.md` to CWD. Then display the traffic-light summary and results table in the terminal.

If actions were recommended: "Review the full report for detailed findings."
If no actions: "This project is healthy. No further action needed."

State: "Report saved to sow-report.md in [CWD path]."

---

## Phase 5 — Marker Cleanup Offer (seeded mode only, no FAIL results)

This phase runs only in seeded mode and only if no FAIL results were produced across Phases 2 and 3. If any check produced a FAIL, skip this phase — markers should remain for re-runs after fixing issues.

### 5.1 — Present cleanup offer

```
All checks passed. The following seed markers can be cleaned up:

1. Test file: [markers.test_file.path] ([size] bytes)
   Remove this file? [y/n]

2. Git tag: [markers.git_tag.name]
   Remove this tag? [y/n]
```

Each marker gets its own individual confirmation. Do not batch — with only 2 markers, individual confirmation is appropriate.

### 5.2 — Execute confirmed cleanups

For each marker the user confirms:

**Test file removal:**

PowerShell:
```powershell
Remove-Item "[markers.test_file.path]"
Test-Path "[markers.test_file.path]"  # Should return False
```

bash:
```bash
rm "[markers.test_file.path]"
[ ! -f "[markers.test_file.path]" ] && echo "REMOVED" || echo "FAILED"
```

**Git tag removal:**
```bash
git tag -d "[markers.git_tag.name]"
git tag -l "[markers.git_tag.name]"  # Should return empty
```
(Same command works in all shell contexts.)

Verify each removal succeeded. If removal fails, report the error and continue.

### 5.3 — Manifest note

After cleanup, inform the user:

"Seed markers have been removed. The manifest file (`.cloud-sync-seed-manifest.json`) remains — it is a record of what was planted. To run sow in unseeded mode in the future, delete the manifest: `rm .cloud-sync-seed-manifest.json` (bash) or `Remove-Item .cloud-sync-seed-manifest.json` (PowerShell)."

If the user declined any cleanup, include a note with manual cleanup commands:

"Seed markers remain in the project. To remove later:"
- Test file: `rm [path]` / `Remove-Item [path]`
- Git tag: `git tag -d [tag-name]`
- Manifest (optional): `rm .cloud-sync-seed-manifest.json` / `Remove-Item .cloud-sync-seed-manifest.json`

---
