# Cloud-Sync Toolkit Design Spec
**Date:** 2026-04-10
**Author:** Robert LaSalle + Claude
**Status:** Approved

---

## Overview

Expand the cloud-sync migration project from a single prompt file into a three-prompt toolkit. Each prompt is an independent, standalone file that users paste into Claude Code CLI. The prompts reference each other by filename but do not depend on each other to function.

| Prompt | File | Purpose | Deletes anything? |
|---|---|---|---|
| Migration | `claude-code-cloud-sync-migration.md` | Copies projects from cloud-synced storage to local paths | No |
| Cleanup | `cloud-sync-cleanup.md` | Removes stale source folders, path-hash directories, and orphan entries | Yes (with confirmation) |
| Verification | `cloud-sync-verification.md` | Audits current state, reports findings, recommends next steps | No |

---

## Project Structure

```
claude-code-cloud-sync-migration/
  claude-code-cloud-sync-migration.md   (migration prompt, v1.2.0)
  cloud-sync-cleanup.md                 (cleanup prompt, v1.0.0 - new)
  cloud-sync-verification.md            (verification prompt, v1.0.0 - new)
  cloud-sync-migration-dev-status.md    (dev status - expanded to cover all three)
  prompt-evaluation.md                  (evaluation - expanded for all three)
  CLAUDE.md                             (updated file map and project scope)
  README.md                             (updated to describe the toolkit)
  docs/
    superpowers/
      specs/
        2026-04-10-cloud-sync-toolkit-design.md  (this file)
```

---

## Compatibility

**Requires:** Claude Code CLI (terminal or IDE extension). These prompts use filesystem access and shell commands — they do not work in claude.ai web, Claude desktop app, or Cowork mode.

The README should include this note prominently so users don't attempt to run the prompts in unsupported environments.

---

## Shared Design Principles

All three prompts follow these principles:

- **One file, one paste.** Each prompt is a single markdown file. The user manages one file per task.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask.
- **Human section above, Claude instructions below.** Separated by `---`. The human section includes manual steps for anyone who wants to do it by hand or verify what the prompt did.
- **Platform-correct commands.** Three-way shell detection (from v1.2.0 Finding 1) applies to all three prompts: PowerShell, bash-on-Windows, native bash/zsh.
- **Five-dimension constraint model.** Must / Must-not / Prefer / Escalate / Recover. Tuned per prompt.
- **Proportional output.** Scale artifacts to scope. Same structural completeness regardless of project count.
- **Cross-references, not dependencies.** Prompts reference each other by filename. Each functions independently.
- **Simple scales.** These are prompts, not agents. User drives execution through confirmation gates. No automation, no scheduling, no installation.
- **Graceful cross-prompt state.** Each prompt should interpret missing path-hash directories as a possible cleanup outcome, not only as corruption. If entries that were present in migration artifacts are now absent, note this as a possible cleanup rather than escalating as data loss. Prompts coexist — one prompt's side effects should not cause another prompt to misdiagnose the environment.

---

## Migration Prompt — v1.2.0 Changes

Six findings to incorporate (five from v1.1.1 testing + one new):

### Finding 1: Three-way shell detection

Replace the two-way OS branch in Phase 1.1 with three-way shell detection:

| Shell | Copy tool | Verification/utility commands |
|---|---|---|
| PowerShell (Windows) | robocopy | PowerShell (Get-ChildItem, Get-PSDrive, etc.) |
| bash-on-Windows (Git Bash / MINGW64 / MSYS2 / WSL) | robocopy | bash (find, wc -l, du, df) |
| bash/zsh native (macOS/Linux) | rsync | bash (find, wc -l, du, df) |

### Finding 2: Multi-signal prior migration detection

Replace single-file crash recovery check with priority-ordered signal cascade:

1. CWD contains `migration-session-1-results.md` (v1.1.1+ artifact) — highest confidence
2. CWD contains `migration-log.md` (pre-v1 artifact) — high confidence
3. Default target path (`~/Projects/`) contains either file — moderate confidence
4. Target path exists with folders matching decoded cloud-synced project names — low confidence, ask user

### Finding 3: "Already done" branch with four options

After Phase 1 completes and prior migration is detected:

| Option | What executes | Target path |
|---|---|---|
| Quick verify | Verification checks only, report | Existing target |
| Fresh re-run, new target | Full Phase 2-6 | User provides alternate path |
| Fresh re-run, same target | Full Phase 2-6 with collision handling | Same as prior migration |
| Done | Handoff instructions only | Existing target |

Option 2 doubles as the dry-run testing mechanism.

### Finding 4: Artifact production for all branch paths

| Option | Artifact |
|---|---|
| Quick verify | `migration-verification-results.md` at target path |
| Fresh re-run, new target | `migration-session-1-results.md` at new target path |
| Fresh re-run, same target | `migration-session-1-results.md` at target path |
| Done | No artifact |

### Finding 5: Shared folder subdirectory migration

Add subdirectory migration option in Phase 3. When a path-hash points to a subdirectory within a larger project folder:

1. Auto-detect the pattern
2. Per folder choice: (a) full copy or (b) subdirectory only
3. Inventory shows both parent and subdirectory
4. Verification compares against subdirectory source

### Finding 6: Pre-copy placeholder verification

Before starting Phase 4 copies, verify that source files are actually local (not cloud-only stubs):

- **Windows (OneDrive):** Check for `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` attribute on a sample of files in each source folder. If cloud-only stubs are detected, stop and direct the user back to pre-flight step 2.3.
- **macOS (iCloud):** Check for `.icloud` placeholder files (files prefixed with `.` and suffixed with `.icloud`). If found, stop and direct user to force-download.
- **Dropbox:** Check for Smart Sync placeholder attributes.

This catches the problem before wasting time on a copy that produces empty files.

### Phase 9 update

Replace the manual cleanup bullet list with a reference to the cleanup prompt:

> "When you're ready to clean up source folders and stale settings directories, paste `cloud-sync-cleanup.md` into Claude Code CLI."

---

## Cleanup Prompt — v1.0.0

### Dual-Mode Detection

| Mode | Trigger | Behavior |
|---|---|---|
| Post-migration | Finds `migration-session-1-results.md` or `migration-session-2-results.md` at current path or `~/Projects/` | Uses migration results as source of truth. High confidence, fewer questions. |
| Standalone | No migration artifacts found | Scans for cloud-synced paths, duplicate folders, stale entries. Classifies and asks user to confirm. More questions, same safety. |

### Phases

- **Phase 1: Environment detection.** OS, shell, cloud services, locate migration artifacts, determine mode.
- **Phase 2: Stale path-hash directories.** Identify `~/.claude/projects/` entries pointing to cloud paths that now have local equivalents. Confirm each, then delete.
- **Phase 3: Orphan path-hash directories.** The `C--`, `R--`, undecodable entries. Confirm each, then delete.
- **Phase 4: Source folders on cloud storage.** Only after phases 2-3. Verify local copy exists and is healthy before presenting each source folder for deletion. Includes a soak-period check: if the user has been using the local paths for less than a few days, recommend deferring Phase 4 (soft recommendation, not a hard gate). Confirm each.
- **Phase 5: Report.** Write `cleanup-results.md`, present summary.

### Constraint Architecture

- **Must:** Verify local copy exists and is healthy (file counts match or exceed source, git fsck passes if applicable, hidden directories present) before offering to delete any source folder. Individual confirmation on every deletion. Write a log of everything deleted.
- **Must-not:** Never delete a source folder without a verified local copy. Never batch deletions — each item gets individual confirmation.
- **Prefer:** Start with lowest-risk items (stale path-hash directories) before highest-risk (source folders).
- **Escalate:** If a source folder has files that don't exist in the local copy, stop and report.
- **Recover:** Cleanup log records what's been deleted so far. If interrupted, re-running the prompt detects partial cleanup state.

### Manual Steps Section

The human-readable section above the separator includes a manual cleanup checklist covering all three categories. Users can follow this by hand or use it to verify what the prompt did.

---

## Verification Prompt — v1.0.0

### Phases

- **Phase 1: Environment detection.** OS, shell, cloud services, home directory.
- **Phase 2: Project health audit.** For each directory under `~/Projects/` (or user-specified path): git fsck, git status, hidden directories, file counts, symlink check.
- **Phase 3: Path-hash audit.** Scan `~/.claude/projects/`, decode each entry, classify as valid / stale / orphan / undecodable. Check whether each decoded path exists on disk.
- **Phase 4: Reference audit.** Search CLAUDE.md files, memory files, and settings for cloud-synced path strings. Report any still pointing to old locations.
- **Phase 5: Report.** Write `verification-report.md` with findings and recommended next steps.

### No Confirmation Gates for Actions

This prompt takes no actions — it only reports. No confirmation gates needed for the audit itself. The user decides what to do with findings. Exception: long-running searches (Phase 4 reference audit across many files) should provide progress status ("Searching N files across M projects...") so the user doesn't think the session is stuck. This is a status signal, not a confirmation gate.

### Overlap with Migration Prompt's Quick Verify

This prompt intentionally overlaps with the migration prompt's quick-verify branch (Finding 3). The migration prompt verifies a specific migration. This prompt audits the full project environment regardless of migration history. Future contributors should not attempt to deduplicate them — the audiences and entry points are different.

### Actionable Recommendations

Each finding maps to a concrete next step:

| Finding | Recommendation |
|---|---|
| Stale path-hash directories | Use `cloud-sync-cleanup.md` to remove these |
| Cloud-synced path references in CLAUDE.md/memory | Use `cloud-sync-cleanup.md` or manually update [file] line [n] |
| Git fsck errors | Run `git fsck --full` in [folder] to investigate |
| Source folders still on cloud storage with verified local copies | Use `cloud-sync-cleanup.md` when ready |
| Projects still running from cloud-synced paths (no local copy) | Use `claude-code-cloud-sync-migration.md` to migrate |
| Orphan/undecodable path-hash entries | Delete manually or use `cloud-sync-cleanup.md` |

---

## Build Sequence

1. **v1.2.0 migration prompt** — incorporate six findings, evaluate against eight NEC frameworks, test using "fresh re-run, new target" approach from dev status report
2. **Cleanup prompt v1.0.0** — build, evaluate, test against Robert's stale path-hash directories and source folders
3. **Verification prompt v1.0.0** — build, evaluate, test against post-cleanup state

Each prompt gets its own build-evaluate-test cycle. Evaluation uses the same eight Nate's Executive Circle frameworks.

---

## Versioning and Contribution Model

### Versioning

- Each prompt carries its own version number in its header (e.g., `**v1.2.0** | 2026-04-10`)
- Versions are tracked independently — migration v1.2.0 coexists with cleanup v1.0.0
- Git history is the version archive. Files are updated in place, no versioned filename copies.
- Git tags at release commits for easy reference (e.g., `migration-v1.2.0`, `cleanup-v1.0.0`). Optional but recommended once sharing with the community.

### Contribution Model

The repo is public on GitHub. Community contributions follow the standard fork-and-PR model:

- Contributors **fork** the repo (creates their own copy)
- Make changes in their fork
- Open a **pull request** (PR) back to the main repo
- Robert reviews the PR — reads changes, tests if needed, asks questions
- Robert **approves and merges** or **requests changes**
- Nothing lands in the repo without explicit approval

### Future: CONTRIBUTING.md

When ready to actively invite contributions, add a `CONTRIBUTING.md` that covers:

- How to test changes (the "fresh re-run, new target" approach)
- Evaluation criteria (eight NEC frameworks)
- What a PR should include (description of change, testing evidence, which prompt was affected)
- Design principles that must be preserved (listed in the Shared Design Principles section above)

Not needed today. Flag for when community contributions become active.

---

## What This Design Does NOT Cover

- Automation of cloud sync pause/resume (evaluated and rejected — too fragile across services, risk of false confidence in file locality)
- Agent or skill encoding (these are prompts, not recurring workflows — they fail the recurrence criterion)
- Multi-user or team migration workflows (out of scope — these are individual-user tools)
