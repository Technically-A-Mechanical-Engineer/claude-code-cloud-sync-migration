# Cloud-Sync Migration Prompt — Development Status Report
**Updated:** 2026-04-10
**Project owner:** Robert LaSalle
**Development environment:** Claude Code CLI from `C:\Users\rlasalle\Projects\claude-code-cloud-sync-migration`

---

## What This Project Is

A single-file prompt that any Claude Code user can paste into CLI to migrate their project folders from cloud-synced storage (OneDrive, Dropbox, Google Drive, iCloud) to a local path. It auto-detects the environment, walks the user through a phased migration with verification at every step, and generates a Session 2 continuation prompt from actual results.

The prompt originated from Robert's own OneDrive-to-local migration (April 9–10, 2026) and was generalized into a distributable tool through iterative review against prompting best practices from Nate's Executive Circle content library.

---

## Version History

| Version | Date | Key Changes | Source |
|---|---|---|---|
| v1.0.0 | 2026-04-09 | Initial generalized prompt. Auto-detection, phased migration (1–6), Session 2 generation, constraint architecture (must/must-not/prefer/escalate), crash recovery, Definition of Done. Platform support for Windows (PowerShell) and macOS/Linux (bash). | claude.ai peer review session |
| v1.1.0 | 2026-04-10 | `/XJ` for Windows junctions. Path-hash decoding rules with examples. Pre-existing target detection. Continuous phase numbering (1–9 across both sessions). Disk space check. Batch confirmation after 3 clean passes. Match categorization (auto-update / preserve / flag-for-user). Symlink detection. `.planning/` preservation preference. Git submodule flagging. Removed admin rights question — hard "no elevation" constraint. Default rename for spaces (not just shell-failure cases). | Claude Code CLI review + real migration experience |
| v1.1.1 | 2026-04-10 | Simplified crash recovery (CWD-only check). macOS symlink absolute-target warning. iCloud xattr handling. Three-state path-hash classification (has memory / settings only / empty). Removed "merge" option for path-hash conflicts (overwrite/keep/skip only). Proportional output reframed as completeness principle. CLI version change escalation trigger in Phase 7.1. | Claude Code CLI review addressing v1.1.0 findings |
| v1.2.0 | 2026-04-10 | Three-way shell detection (PowerShell / bash-on-Windows / native bash). Four-signal prior migration detection cascade with confidence labels replacing single-file crash recovery. Four-option branch (quick verify / fresh re-run new target / fresh re-run same target / done) with per-option artifact production. Subdirectory migration scope in Phase 3 inventory. Pre-copy placeholder verification (OneDrive, iCloud, Dropbox). Phase 9 references cleanup prompt instead of manual steps. Graceful cross-prompt state in Guardrails. Five-dimension constraint model updated. | Claude Code CLI — GSD Phase 1 execution |

---

## v1.1.1 Evaluation Summary

v1.1.1 was evaluated against eight frameworks from Nate's Executive Circle:

- Specification Engineer, Constraint Architecture, Self-Contained Problem Statement (State of Prompt Engineering Kit)
- First Agent Task, Footgun Detector, Loop Designer (Six Weeks Kit)
- Agent Architecture Audit / Day One Primitives (Building Agents Is 80% Plumbing Kit)
- Agent-Readiness Audit (Skills Are Infrastructure Now Kit)

**Result: Pass on all eight frameworks.** No critical or moderate findings. One positive observation: the prompt's five-dimension constraint model (Must / Must-not / Prefer / Escalate / Recover) extends the standard four-quadrant Constraint Architecture pattern.

Full evaluation in `prompt-evaluation-migration.md`.

---

## v1.1.1 Test Execution — 2026-04-10

### Test Setup

- **Launch point:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\Claude-Home` (the original cloud-synced path)
- **Intent:** Test v1.1.1 as a fresh migration prompt
- **Pre-existing state:** A complete pre-v1 migration already existed at `C:\Users\rlasalle\Projects\` from April 9, 2026

### What Happened

v1.1.1 was pasted into Claude Code CLI. The prompt correctly:

1. Auto-detected the environment (Windows 11 Enterprise, MINGW64/bash shell, OneDrive for Business with 3 source roots)
2. Detected the prior migration by scanning the target path and finding `migration-log.md` (a pre-v1 artifact, not the v1.1.1 `migration-session-1-results.md`)
3. Verified all 11 folder copies — file counts matched exactly across all folders (Claude-Home had 4 additional files from post-migration work, which is expected)
4. Verified settings/memory migration — 5 projects with memory, all counts matched
5. Presented an intelligent assessment with three options: quick verify, full re-run, or done
6. User selected Option 1 (quick verify)

### Quick Verification Results

| Repo | Git fsck | Git status | Hidden dirs | Dubious ownership |
|---|---|---|---|---|
| OB1 | pass | clean (unstaged working changes) | .claude, .git, .planning | none |
| QMS-Document-Processor | pass | clean (unstaged working changes) | .claude, .git, .planning | none |
| R-Drive-NCM-Playground1 | pass | clean (unstaged working changes) | .git, .planning | none |

Non-git folders: hidden directories present where expected. No submodules. No errors.

### Migration Status

**Robert's personal migration is verified and complete.** All folders, settings, memory, and references have been migrated and verified. Claude Code should be launched from `C:\Users\rlasalle\Projects\Claude-Home` going forward.

---

## Findings from v1.1.1 Test → v1.2.0 Requirements

Six findings require changes in v1.2.0 (five from testing, one from design brainstorm):

### Finding 1: Three-way shell detection

**Problem:** The prompt branches on OS (Windows → PowerShell, macOS/Linux → bash). But Claude Code CLI on Windows commonly runs in Git Bash (MINGW64), not PowerShell. The v1.1.1 test session detected bash as the shell. This creates a mismatch: the copy tool is still robocopy (a Windows binary callable from any shell), but verification and utility commands need bash syntax (`find`, `wc -l`, `du`, `df`) not PowerShell syntax (`Get-ChildItem`, `Get-PSDrive`).

**Fix for v1.2.0:** Replace the two-way OS branch in Phase 1.1 with a three-way shell detection:

| Shell | Copy tool | Verification/utility commands |
|---|---|---|
| PowerShell (Windows) | robocopy | PowerShell (`Get-ChildItem`, `Get-PSDrive`, etc.) |
| bash-on-Windows (Git Bash / MINGW64 / MSYS2 / WSL) | robocopy (Windows binary, callable from bash) | bash (`find`, `wc -l`, `du`, `df`) |
| bash/zsh native (macOS/Linux) | rsync | bash (`find`, `wc -l`, `du`, `df`) |

The key insight: on Windows with Git Bash, the copy tool is still robocopy, but everything else uses bash commands.

### Finding 2: Multi-signal prior migration detection

**Problem:** The Crash Recovery section checks CWD for `migration-session-1-results.md` only. In the test, Claude Code found the prior migration through a different signal — `migration-log.md` (a pre-v1 artifact) at the target path. It also cross-referenced the path-hash inventory against existing target folders. The single-file check is too narrow.

**Fix for v1.2.0:** Replace the single-file check with a priority-ordered signal cascade:

1. Check CWD for `migration-session-1-results.md` (the v1.1.1+ artifact) — **highest confidence**
2. Check CWD for `migration-log.md` (pre-v1 artifact) — **high confidence**
3. Scan the default target path (`~/Projects/`) for either file — **moderate confidence**
4. If no files found but target path exists and contains folders matching decoded cloud-synced project names — **low confidence, ask user**

Each signal gets labeled with its confidence level. Signal 1 triggers automatic recovery workflow. Signal 4 triggers a user question.

### Finding 3: "Already done" branch with four explicit options

**Problem:** The prompt's flow is linear (Phase 1 → 2 → 3 → ...) with no branch for "this migration is already complete." Claude Code improvised the three-option dialog, which worked well, but the specification should encode it. A good specification shouldn't depend on the model being smart.

**Fix for v1.2.0:** Add a decision branch after Phase 1 completes and prior migration is detected:

| Option | What executes | Target path | Use case |
|---|---|---|---|
| Quick verify | Verification checks only (git fsck, hidden dirs, symlinks) → report | Existing target | Prior migration looks complete, just need confirmation |
| Fresh re-run, new target | Full Phase 2–6 | User provides alternate path (e.g., `~/Projects-v1_2_Test1/`) | Testing the prompt, or redoing with improved methodology |
| Fresh re-run, same target | Full Phase 2–6 with pre-existing target dialogs on every folder | Same as prior migration | User wants to redo in place (with collision handling) |
| Done | Handoff instructions only | Existing target | Prior migration is trusted, just start using the new path |

**Option 2 doubles as the dry-run testing mechanism.** A developer testing a new version of the prompt selects Option 2, provides a parallel test target, and exercises the full flow without touching the real migration.

### Finding 4: Artifact production for all branch paths

**Problem:** The quick verify option (Option 1 in Finding 3) executed verification checks and presented results in-chat, but didn't produce a formal artifact file (`migration-session-1-results.md`). The prompt only specifies artifact production for the full Phase 4 copy-and-verify path.

**Fix for v1.2.0:** All four branch options should specify what artifacts to produce:

| Option | Artifact |
|---|---|
| Quick verify | `migration-verification-results.md` at target path — verification report with git fsck, hidden dirs, symlink audit |
| Fresh re-run, new target | `migration-session-1-results.md` at new target path (standard artifact) |
| Fresh re-run, same target | `migration-session-1-results.md` at target path (standard artifact) |
| Done | No artifact needed — user is confirming existing state |

### Finding 5: Shared folder subdirectory migration

**Problem:** The prompt assumes every source folder gets a full recursive copy. But in environments where cloud-synced project folders are shared team folders (e.g., `General\Current Hotness\0106 ATP Relaunch` with 1012 files), only a Claude-specific subdirectory (e.g., `Robert-Sandbox` with ~127 files) should be migrated. The full project folder stays on OneDrive for team access. The pre-v1.1.1 migration handled this correctly by copying only the sandbox subdirectories, but v1.1.1 has no mechanism for it — it would copy the entire 1012-file folder.

**Evidence from verification:** Three General\Current Hotness folders were migrated as sandbox-only copies:
- `0037 Ultrasound Device Dev\RL_Claude_Sandbox` (10 files) → `0037-Ultrasound-Device-Dev`
- `0106 ATP Relaunch\Robert-Sandbox` (~127 files) → `0106-ATP-Relaunch`
- `0246 2026 Management Review\RL-Claude-Sandbox` (~105 files) → `0246-2026-Management-Review`

The full source folders (1232, 1012, 262 files respectively) remained on OneDrive. File count deltas between full source and target are expected and correct — not data loss.

**Fix for v1.2.0:** Add a subdirectory migration option in Phase 3 (Inventory and Naming). When a cloud-synced project folder is large and the path-hash inventory shows Claude was launched from a subdirectory within it:

1. Auto-detect the pattern: path-hash points to a subdirectory (e.g., `0106-ATP-Relaunch-Robert-Sandbox`), not the project root
2. Present the user with a choice per folder:
   - **(a) Full copy** — migrate the entire project folder (default for folders where Claude launched from the root)
   - **(b) Subdirectory only** — migrate only the subdirectory Claude was launched from (recommended when the parent is a shared team folder)
3. If subdirectory-only is selected, the inventory entry shows both the parent folder and the subdirectory being migrated, and the target name is derived from the parent (not the subdirectory name)
4. Verification in Phase 4 compares against the subdirectory source, not the full parent folder

This also affects the Session 2 prompt: Phase 8 reference searches should know which source path to search for (the subdirectory path, not the parent).

### Finding 6: Pre-copy placeholder verification

**Origin:** Design brainstorm (2026-04-10), not field testing.

**Problem:** The prompt's pre-flight checklist tells the user to force files local (step 2.3), then trusts that they did it. The only check is after copying — if file counts are low, it flags possible placeholders. This catches the problem too late, after time has already been wasted on a copy that produced empty files.

**Fix for v1.2.0:** Add a verification step before starting Phase 4 copies. Sample files in each source folder to confirm they're actually local:

- **Windows (OneDrive):** Check for `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` attribute on a sample of files. If cloud-only stubs are detected, stop and direct user back to pre-flight step 2.3.
- **macOS (iCloud):** Check for `.icloud` placeholder files (files prefixed with `.` and suffixed with `.icloud`). If found, stop and direct user to force-download.
- **Dropbox:** Check for Smart Sync placeholder attributes.

---

## v1.2.0 Testing Plan

After v1.2.0 is built, the testing approach uses the "fresh re-run, new target" branch (Option 2 from Finding 3):

1. Launch Claude Code CLI from `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\Claude-Home`
2. Paste v1.2.0 prompt
3. v1.2.0 detects the prior migration at `C:\Users\rlasalle\Projects\`
4. Select Option 2 (fresh re-run, new target)
5. Provide target: `C:\Users\rlasalle\Projects-v1_2_Test1\`
6. Full Phase 1–6 flow executes against the clean test target
7. Verify all phases complete correctly, all artifacts are produced
8. Exit Session 1, launch from `C:\Users\rlasalle\Projects-v1_2_Test1\Claude-Home\`
9. Paste the generated Session 2 prompt
10. Verify Phases 7–9 complete correctly
11. After successful test, manually delete `C:\Users\rlasalle\Projects-v1_2_Test1\`

This exercises: three-way shell detection, multi-signal prior migration detection, the branch dialog, full copy-and-verify flow, Session 2 prompt generation from actual results, and Session 2 execution.

---

## Design Spec

The approved design for expanding this project into a three-prompt toolkit is in:
`docs/superpowers/specs/2026-04-10-cloud-sync-toolkit-design.md`

This is the requirements source for all GSD planning. It covers the migration v1.2.0 changes, cleanup prompt v1.0.0 architecture, verification prompt v1.0.0 architecture, shared design principles, build sequence, and versioning/contribution model.

## Next Steps

1. **v1.2.0 migration prompt — BUILT.** Evaluate against eight NEC frameworks (DOC-07).
2. **Build cleanup prompt v1.0.0** — New file `cloud-sync-cleanup.md`. Requirements in design spec.
3. **Build verification prompt v1.0.0** — New file `cloud-sync-verification.md`. Requirements in design spec.
4. **Peer review all three prompts** — Eight Nate's Executive Circle frameworks per prompt.
5. **Test all three prompts** — Migration: "fresh re-run, new target" plan above. Cleanup: test against Robert's stale path-hash dirs and source folders. Verification: test against post-cleanup state.
6. **Distribution** — Repo is live at https://github.com/Technically-A-Mechanical-Engineer/claude-code-cloud-sync-migration. Push after testing passes. Tag releases per prompt.

---

## Cleanup Prompt v1.0.0 — Build Status

**Built:** 2026-04-10/11
**File:** `cloud-sync-cleanup.md`
**Size:** 946 lines
**Build method:** GSD Phase 2 — 4 plans across 3 waves

### Requirements Coverage

All 9 CLN requirements from the design spec addressed:

| Req | Description | Status |
|-----|-------------|--------|
| CLN-01 | Path-hash inventory and classification | Addressed |
| CLN-02 | Source folder identification and staleness check | Addressed |
| CLN-03 | Orphan settings entry detection | Addressed |
| CLN-04 | Individual confirmation before each deletion | Addressed |
| CLN-05 | Three-way platform command blocks for destructive operations | Addressed |
| CLN-06 | Standalone mode (no prior migration required) | Addressed |
| CLN-07 | Dry-run summary before any deletions | Addressed |
| CLN-08 | Manual cleanup checklist for items outside scope | Addressed |
| CLN-09 | Results log written incrementally | Addressed |

### NEC Evaluation

Evaluated against all applicable NEC prompt frameworks. Result: **Pass** with 4 minor findings, all resolved.

- **Finding 1 (Minor, fixed):** `stat` syntax inconsistency — macOS uses `stat -f`, Linux uses `stat -c`, bash-on-Windows uses neither. Added platform notes.
- **Finding 2 (Minor, fixed):** Phase 4.6 retry/skip dialog had no retry limit. Added 3-retry cap.
- **Finding 3 (Minor, fixed):** Standalone mode Phase 4.1 couldn't find manually-migrated folders with no path-hash entries. Added manual path addition note.
- **Finding 4 (Minor, fixed):** Manual cleanup checklist didn't mention soak-period recommendation. Added prominent callout.
- **Observation (not a finding):** At 946 lines, cleanup prompt is 75% larger than migration (540 lines). Growth is from three-way platform command blocks for destructive operations. Right trade-off per design principles. Monitor CLI paste behavior.

Fixes applied in commits `75f0bdd` and `ee3246a`.

Full evaluation in `prompt-evaluation-cleanup.md`.

---

## Design Principles (for reference during development)

These were established during the initial development and review process:

- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps, confirmation gates, and no-delete policy apply regardless of migration size. These protect user data.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask the user.
- **One file, one paste.** The user should only need to manage one file per session. The human-facing guide and the Claude Code instructions live in the same file, separated by a clear marker.
- **Session 2 prompt is generated from actual results, not templates.** No "update this table after Session 1" steps.
- **The five-dimension constraint model:** Must / Must-not / Prefer / Escalate / Recover.
- **Proportional output.** Scale generated artifacts to the scope of the migration. Don't over-engineer for simple cases.
- **Not a skill.** This is a one-shot migration playbook, not a recurring workflow. It fails the recurrence criterion for skill encoding (Nate's three-criteria test). Distribution is via file sharing, not the skills directory.
