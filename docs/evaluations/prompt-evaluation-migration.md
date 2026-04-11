# Cloud-Sync Migration Prompt — v1.2.0 Evaluation
**Evaluated:** 2026-04-10
**Evaluator:** Claude (Claude Code CLI — GSD Phase 1 execution)
**Document under review:** `cloud-sync-migration.md` (v1.2.0)

---

## Evaluation Frameworks

This evaluation applies eight prompting and agent architecture frameworks from Nate's Executive Circle content library and Anthropic prompting best practices.

| Framework | Source | What It Tests |
|---|---|---|
| Specification Engineer | State of Prompt Engineering Kit — Prompt 3 | Acceptance criteria, constraint architecture, task decomposition, Definition of Done |
| Constraint Architecture | State of Prompt Engineering Kit — Prompt 6 | Must / Must-not / Prefer / Escalate coverage tied to failure modes |
| Self-Contained Problem Statement | State of Prompt Engineering Kit — Prompt Q2 | Whether an executor with zero context can produce correct output |
| First Agent Task | Six Weeks Kit — Prompt 1 | Task summary, success criteria, agent context, verification commands |
| Footgun Detector | Six Weeks Kit — Prompt 4 | Six footgun patterns: vague criteria, missing design, scope creep, abstraction bloat, no checkpoints, wrong tool |
| Loop Designer | Six Weeks Kit — Prompt 3 | Iteration cycle, per-stage success criteria, checkpoints, stuck detection/protocol |
| Agent Architecture Audit | Building Agents Is 80% Plumbing Kit | Day One infrastructure primitives for production agent systems |
| Agent-Readiness Audit | Skills Are Infrastructure Now Kit — Prompt 3 | Whether the generated Session 2 prompt spec includes the new features |

---

## Results Summary

| Framework | Verdict | Findings | Change from v1.1.1 |
|---|---|---|---|
| Specification Engineer | **Pass** | 0 findings | Phase 1.2 branch options and Phase 3.5 add verifiable acceptance criteria |
| Constraint Architecture | **Pass** | 0 findings (prior minor note resolved) | Recovery formalized as fifth dimension; all six new features covered |
| Self-Contained Problem Statement | **Pass** | 0 findings | Three-way shell detection is fully self-contained with inline detection table |
| First Agent Task | **Pass** | 0 findings | Verification commands now cover all three shell contexts |
| Footgun Detector | **Pass** | 0 findings | Pre-copy placeholder verification closes the "catch problems too late" gap |
| Loop Designer | **Pass** | 0 findings | Four-option branch maintains loop structure; placeholder check has stuck protocol |
| Agent Architecture Audit | **Pass** | 0 findings | Four-signal cascade strengthens Session Persistence and Workflow State primitives |
| Agent-Readiness Audit | **Pass** | 0 findings | Session 2 spec updated for subdirectory paths, cleanup reference, three-way shell |

**Overall: v1.2.0 passes all eight applicable frameworks. The six new features strengthen the prompt's architecture without introducing gaps.**

---

## Detailed Evaluation

### 1. Specification Engineer

**Criteria:** Acceptance criteria verifiable by an independent observer. Constraint architecture with must/must-not/prefer/escalate. Task decomposition with inputs, outputs, and dependencies. Unambiguous Definition of Done.

**Verdict: Pass.**

- **Acceptance criteria** remain verifiable per-folder (file counts, hidden dirs, git fsck) and per-session (Definition of Done for both sessions). v1.2.0 adds two new verification surfaces:
  - **Phase 1.2 branch options:** Each of the four options has an explicit "What executes" column and "Artifact produced" column in the options table. An independent observer can verify which branch was taken and confirm the correct artifact was produced. The "pick this if" guidance provides unambiguous selection criteria.
  - **Phase 3.5 placeholder verification:** Reports pass/fail per folder with a single data point (percentage of cloud-only stubs). The pass/fail threshold is binary — either 0% stubs (READY) or >0% stubs (NOT READY). No subjective judgment required.
- **Constraint architecture** is complete across all five dimensions (see Framework 2 for detailed evaluation).
- **Task decomposition** is phase-numbered (1-9) with sub-phases (1.1, 1.2, 3.5, 4.7). The new Phase 1.2 and Phase 3.5 have explicit dependencies: Phase 1.2 runs after 1.1 (needs shell context), Phase 3.5 runs after Phase 3 (needs approved inventory) and before Phase 4 (gates the copy step).
- **Definition of Done (Session 1)** now includes "Pre-copy placeholder verification passed for all source folders (no cloud-only stubs detected)" — this is a new verifiable criterion that did not exist in v1.1.1.
- **Subdirectory scope** in Phase 3 adds a verifiable "Scope" column to the inventory table, with explicit rules for how scope affects Phase 4 verification (compare against subdirectory source, not full parent).

---

### 2. Constraint Architecture

**Criteria:** Five-dimension coverage (Must / Must-not / Prefer / Escalate / Recover), each constraint tied to a specific failure mode it prevents.

**Verdict: Pass.**

In v1.1.1, the evaluation noted the Crash Recovery section functioned as an informal fifth constraint dimension and labeled this as a "minor note (positive)." In v1.2.0, the five-dimension model is explicit and deliberate:

| Dimension | v1.2.0 Coverage | Key Change from v1.1.1 |
|---|---|---|
| **Must** | Confirmation gates, per-folder verification, placeholder verification must pass before copy | Phase 3.5 adds a new gate — all folders must show READY before Phase 4 begins |
| **Must-not** | No deletions, no admin elevation, no silent overwrites, no partial-state cleanup | Unchanged — already comprehensive |
| **Prefer** | Rename spaces, report anomalies, preserve `.planning/`, fewer questions more detection | Unchanged |
| **Escalate** | Unmapped paths, CLI version mismatch, permission failures | Unchanged |
| **Recover** | Prior migration detection (four-signal cascade), session interruption recovery | Formalized — the Recovery section now explicitly describes the four-signal cascade and how session interruption feeds back into it |

**Coverage of new features across constraint dimensions:**

- **Three-way shell detection (Phase 1.1):** Covered by Must-not ("Do not mix shell syntaxes") and the Guardrails directive ("Platform-correct commands everywhere").
- **Four-signal cascade (Phase 1.2):** This IS the Recover dimension — it replaces the old Crash Recovery section. Each signal has a confidence level tied to specific evidence, preventing the failure mode of assuming a fresh start when prior work exists.
- **Four-option branch (Phase 1.2):** Each option has an explicit artifact column, preventing the failure mode of executing a branch path and producing no record.
- **Subdirectory scope (Phase 3):** Covered by Must (per-row confirmation during inventory) and the Guardrails edge case list ("Subdirectory launches").
- **Placeholder verification (Phase 3.5):** Covered by Must (must pass before Phase 4) — prevents the failure mode of copying cloud-only stubs and getting empty files.
- **Graceful cross-prompt state (Guardrails):** Prevents the failure mode of a prompt misdiagnosing another prompt's side effects as corruption.

The v1.1.1 evaluation's "minor note" about the fifth dimension being informal is now resolved — Recovery is a named, documented constraint dimension.

---

### 3. Self-Contained Problem Statement

**Criteria:** Could an executor with zero prior context produce the correct output from this prompt alone?

**Verdict: Pass.**

- The prompt auto-detects everything it needs (OS, shell, user profile, cloud sync folders, project inventory, prior migration state).
- **Three-way shell detection is fully self-contained.** The detection table in Phase 1.1 provides exact detection criteria for all three shell contexts (`$PSVersionTable` for PowerShell, `$OSTYPE` containing "msys"/"mingw"/"cygwin" or `uname -s` returning "MINGW*"/"MSYS*" for bash-on-Windows, `uname -s` returning "Darwin" or "Linux" for native). A fresh Claude Code instance needs no external knowledge to determine the correct shell context.
- **The four-option branch is unambiguous for a fresh instance.** Each option's execution path is spelled out in the table: "What executes" and "Artifact produced" columns leave no room for interpretation. The "pick this if" guidance provides the user self-selection criteria, and the prompt's post-selection routing is explicit ("If Option 1 is selected, run verification checks... If Option 2 or 3, proceed to Phase 2. If Option 4, proceed directly to Phase 6.").
- **Four-signal cascade is self-contained.** The cascade provides exact file names to check, exact locations to scan, and confidence labels for each signal. A fresh instance can execute the cascade without knowing what prior migrations look like — the cascade defines what "prior migration evidence" means.
- **Phase 3.5 placeholder verification is self-contained.** Platform-specific detection commands are provided inline (PowerShell attribute check, bash-on-Windows PowerShell pass-through, macOS `.icloud` file detection, Dropbox `xattr` check). No external documentation needed.
- The human provides exactly one primary input (target path confirmation) plus per-folder approval, plus branch selection if a prior migration is detected.
- The generated Session 2 prompt is built from actual results recorded in `migration-session-1-results.md`, not from shared context between sessions.

---

### 4. First Agent Task

**Criteria:** Task summary (goal, not steps), success criteria (observable outcomes), context for the agent, verification commands that prove success.

**Verdict: Pass.**

- **Task summary:** Opening line — "move project folders off cloud-synced storage to local paths."
- **Success criteria:** Definition of Done sections for both sessions, plus per-folder verification reports. v1.2.0 adds the placeholder verification pass criterion to the Session 1 Definition of Done.
- **Context for the agent:** Auto-detected environment, cloud sync service classification, path-hash inventory with three-state classification. v1.2.0 adds shell context (three-way detection) and prior migration state (four-signal cascade with confidence level).
- **Verification commands now cover all three shell contexts.** Every verification step provides three command variants:
  - Phase 2.1 disk space: PowerShell (`Get-PSDrive`), bash-on-Windows (`powershell.exe -Command "(Get-PsDrive C).Free"`), macOS/Linux (`df -h`).
  - Phase 3.5 placeholder check: PowerShell (attribute bitmask), bash-on-Windows (PowerShell pass-through), macOS (`find -name ".*icloud"`), Dropbox (`xattr`).
  - Phase 4.3 symlink/junction check: PowerShell (`Get-ChildItem ... ReparsePoint`), bash-on-Windows (`find -type l` plus `cmd.exe /c "dir /AL /S"`), macOS/Linux (`find -type l`).
  - Phase 4.4 file counts: PowerShell (`Get-ChildItem -Recurse -File -Force`), bash-on-Windows/macOS/Linux (`find -type f | wc -l`).

  v1.1.1 used a two-way Windows/macOS-Linux split. v1.2.0's three-way split ensures bash-on-Windows users get correct commands (bash syntax for utilities, but `robocopy` for copies and `cmd.exe` for junction detection).

---

### 5. Footgun Detector

**Criteria:** Six footgun patterns evaluated — vague success criteria, missing design phase, scope creep risk, abstraction bloat, no checkpoint strategy, wrong tool for the job.

**Verdict: Pass.**

| Pattern | Status | v1.2.0 Notes |
|---|---|---|
| Vague success criteria | Clear | Per-folder reports with typed fields; both sessions have Definition of Done. Placeholder verification adds binary pass/fail with single data point. |
| Missing design phase | Designed | The prompt IS the specification. The four-option branch table and placeholder verification commands are fully designed, not delegated. |
| Scope creep risk | Bounded | The four-option branch could theoretically introduce scope creep if options were open-ended, but each option has a bounded execution path: Quick verify runs checks only, Fresh re-run runs the standard Phase 2-6, Done exits. No option allows unbounded exploration. Folder approval gate still limits scope to user-approved list. |
| Abstraction bloat | Constrained | Commands remain concrete platform-specific invocations. The three-way shell split adds more command variants but each is a direct, executable command — not a wrapped abstraction. Phase 3.5's placeholder detection uses raw platform APIs (Windows file attributes, macOS file naming convention, Dropbox xattrs). |
| No checkpoint strategy | Has one | `migration-session-1-results.md` written incrementally, survives crashes. The four-signal cascade in Phase 1.2 now explicitly connects this checkpoint to crash recovery — if the session is interrupted during Phase 4, re-running the prompt detects the partial results file and presents recovery options. This closes a gap that existed in v1.1.1: the old crash recovery section checked for the file but only offered "resume or restart." v1.2.0 offers four options including quick-verify of already-copied folders. |
| Wrong tool | Good fit | Claude Code CLI confirmed as correct tool — interactive, terminal-native, gated. The compatibility note in the human-readable section explicitly states the prompt requires Claude Code CLI (not claude.ai web, desktop app, or Cowork mode). |

**Pre-copy placeholder verification closes the "catch problems too late" gap.** In v1.1.1, Files On-Demand placeholders were detected only after copying (Phase 4.4 file count mismatch). The prompt passed the Footgun Detector because the detection existed, but it was reactive — the user would discover the problem after wasting time on a copy operation. v1.2.0's Phase 3.5 moves detection before the copy, catching the problem when the fix (force-download files) is cheapest. This is a meaningful improvement to the "no checkpoint strategy" and "vague success criteria" patterns even though v1.1.1 already passed.

---

### 6. Loop Designer

**Criteria:** Iteration cycle, success criteria at each stage, checkpoint/commit strategy, stuck detection, stuck protocol.

**Verdict: Pass.**

- **Iteration cycle:** Copy -> verify -> report -> confirm -> next folder. Unchanged from v1.1.1.
- **Success criteria per iteration:** File count match, hidden dirs present, git integrity, symlink reporting. v1.2.0 adds the pre-loop placeholder gate (Phase 3.5) — all folders must pass before the first iteration begins.
- **Checkpoint:** `migration-session-1-results.md` appended after each confirmed folder. v1.2.0 strengthens the connection between checkpoint and recovery via the four-signal cascade.
- **Stuck detection:** Robocopy exit code > 7, rsync non-zero, file count mismatch, git fsck failure, pre-existing target collision, placeholder check failure — all trigger a stop. Placeholder check failure is new in v1.2.0.
- **Stuck protocol:** Stop and report, do not proceed, do not clean up. User decides next action. Unchanged.
- **Batch mode acceleration** (Phase 4.7): After three consecutive clean passes, batch confirmation available. Unchanged.

**Four-option branch maintains loop structure.** Each option has a clear completion state:
- Option 1 (Quick verify): Runs verification checks, writes `migration-verification-results.md`, proceeds to Phase 6. Complete when report is written.
- Option 2 (Fresh re-run, new target): Full Phase 2-6 with alternate path. Complete when Phase 6 handoff is delivered.
- Option 3 (Fresh re-run, same target): Full Phase 2-6 with collision handling. Complete when Phase 6 handoff is delivered.
- Option 4 (Done): Proceeds to Phase 6 immediately. Complete when handoff is delivered.

No option leaves the loop in an ambiguous state. Each produces a defined terminal condition.

**Placeholder verification has a stuck protocol.** When the placeholder check fails, the prompt directs the user back to pre-flight step 2.3 with clear messaging: "[FolderName] -- NOT READY ([X]% of sampled files are cloud-only). Force-download files before continuing. See pre-flight step 2.3." If the user cannot force-download files (e.g., low disk space, no internet, or the cloud service is not cooperating), the prompt stops — it does not offer a workaround that would produce empty copies. The user must resolve the underlying issue or exclude the folder from the migration inventory (return to Phase 3).

---

### 7. Agent Architecture Audit — Day One Primitives

**Criteria:** Evaluated against the 12 production infrastructure primitives from the Claude Code architecture analysis. Only primitives applicable to a single-session CLI prompt are assessed.

| Primitive | Status | v1.2.0 Notes |
|---|---|---|
| Permission System with Trust Tiers | Present | No-delete, no-elevation, confirmation gates, escalation triggers, match categorization. Unchanged from v1.1.1. |
| Session Persistence That Survives Crashes | Strengthened | `migration-session-1-results.md` as crash-recoverable state. v1.2.0 adds the four-signal cascade that explicitly connects this file to the recovery flow — Phase 1.2 reads it, extracts confidence level and evidence, and routes to four options. The crash recovery primitive is now integrated into the detection flow rather than being a separate pre-check. |
| Workflow State and Idempotency | Strengthened | Phase numbering (1-9), per-folder status tracking, batch-mode flag, pre-existing target detection. v1.2.0 adds the four-signal cascade as an idempotency mechanism — re-running the prompt on a completed migration does not restart from scratch; it detects prior state and offers appropriate options. The four options include "Done" (acknowledge completion) and "Quick verify" (confirm without re-executing). |
| Structured Streaming Events | Present | Per-folder report template with typed fields. v1.2.0 adds placeholder verification as a structured pre-loop event (READY/NOT READY per folder with percentage data point). |
| System Event Logging | Present | Results log file written incrementally. v1.2.0 adds artifact production for branch paths — Option 1 (Quick verify) writes `migration-verification-results.md`, ensuring every non-trivial branch produces a log. |
| Basic Verification Harness | Expanded | File counts with hidden files, hidden dir checks, git fsck, symlink detection, disk space pre-check. v1.2.0 adds placeholder verification (Phase 3.5) as a pre-copy verification step and three-way shell command variants for all verification commands. |

**Graceful cross-prompt state** adds a new behavioral primitive not in the original Day One list: **cross-agent state interpretation.** The Guardrails section instructs the executor to interpret missing path-hash directories as a possible cleanup outcome rather than corruption. This is a primitive for multi-prompt systems where one prompt's side effects (cleanup deleting stale entries) could be misdiagnosed by another prompt (migration seeing "missing" entries). While not in the original 12 primitives, it belongs in the same category as Workflow State and Idempotency — handling state that was modified by an external actor.

**Not applicable to this prompt type:** Token budget tracking, tool registry, transcript compaction, tool pool assembly. These apply to persistent agent systems, not single-session CLI prompts.

---

### 8. Agent-Readiness Audit — Generated Session 2 Prompt

**Criteria:** Whether the specification for the generated prompt is detailed enough that the output will be consistent and complete when executed in a fresh Claude Code session.

| Criterion | Status | v1.2.0 Notes |
|---|---|---|
| Trigger description as routing table | N/A | Not a skill — pasted manually |
| Output format completeness | Pass | Generated prompt spec requires Role section, Migration Summary table, phase-prefixed numbering, platform-specific commands, Definition of Done. Validation step cross-checks against results log. v1.2.0 adds the requirement that the Shell Environment section states the detected shell as literal values ("PowerShell" / "bash-on-Windows" / "native bash"), not "same as Session 1." This ensures the three-way shell context carries through to Session 2 correctly. |
| Explicit edge case handling | Pass | Phase 7.3 handles pre-existing content in path-hash directories (overwrite/keep/skip). Phase 7.1 handles CLI version changes. Phase 8.2 categorizes matches by action type. v1.2.0 adds: subdirectory source paths are used for Phase 8 reference search instead of parent paths (when subdirectory-only scope was selected), ensuring reference updates target the correct path granularity. |
| Composability | Pass | Session 2's prompt remains self-contained. Reads from `migration-session-1-results.md`, not from Session 1's context window. v1.2.0 adds the Phase 9 cleanup prompt reference ("paste `cloud-sync-cleanup.md` into Claude Code CLI") — this is a cross-prompt reference by filename, not a runtime dependency. The Session 2 prompt spec includes this reference in Phase 9's post-migration reminders, giving the generated prompt awareness of the broader toolkit without creating a dependency on it. |

**Session 2 prompt spec updates for v1.2.0 features:**
- **Three-way shell commands:** The spec requires Shell Environment to use literal shell context values and all Phase 7/8 commands to match the detected shell. This is explicit in the "Validate before saving" section ("Commands match the detected platform/shell").
- **Subdirectory paths in Phase 8:** When subdirectory-only scope was selected in Phase 3, the spec directs Phase 8 reference search to use the subdirectory path, not the parent. This prevents false positives from searching the full parent path.
- **Cleanup prompt reference in Phase 9:** The Phase 9 spec includes the exact reference text: "paste `cloud-sync-cleanup.md` into Claude Code CLI." This ensures the generated Session 2 prompt connects users to the cleanup workflow without requiring Session 2 to know whether the cleanup prompt exists yet.

---

## Version History Context

v1.2.0 is the fourth iteration of this prompt. The evolution path:

| Version | Key Changes | Source |
|---|---|---|
| v1.0.0 | Initial generalized prompt — auto-detection, phased migration, Session 2 generation, constraint architecture, crash recovery, Definition of Done | Claude.ai peer review session |
| v1.1.0 | /XJ for junctions, path-hash decoding rules, pre-existing target detection, continuous phase numbering (1-9), disk space check, batch confirmation, match categorization, symlink detection, .planning/ preservation | Claude Code CLI review + real migration experience |
| v1.1.1 | Simplified crash recovery (CWD-only), macOS symlink absolute-target warning, iCloud xattr handling, three-state path-hash classification, merge option removed, proportional output reframed, CLI version escalation trigger | Claude Code CLI review addressing v1.1.0 findings |
| v1.2.0 | Three-way shell detection, four-signal prior migration cascade, four-option branch with artifacts, subdirectory migration scope, pre-copy placeholder verification, Phase 9 cleanup prompt reference, graceful cross-prompt state | Claude Code CLI — GSD Phase 1 execution |

---

## Conclusion

v1.2.0 passes all eight evaluation frameworks with no findings. The six new features each strengthen the prompt's architecture in measurable ways:

- **Three-way shell detection** completes the platform coverage model — bash-on-Windows users no longer receive PowerShell verification commands while using `robocopy` for copies. Every command block in the prompt now has three variants, and the Self-Contained Problem Statement evaluation confirms the detection criteria are fully inline.
- **Four-signal prior migration cascade** formalizes the Recovery dimension of the five-dimension constraint model. What was an informal "minor note" in the v1.1.1 evaluation is now an explicit, designed architectural element with confidence levels, evidence-based routing, and four bounded exit paths.
- **Pre-copy placeholder verification** closes the "catch problems too late" gap identified during v1.1.1's Footgun Detector evaluation. While v1.1.1 passed (detection existed post-copy), v1.2.0 moves detection to Phase 3.5 — before any copy operations begin — making the fix cheapest when the problem is discovered.
- **Graceful cross-prompt state** introduces a behavioral primitive for multi-prompt coexistence that was not needed when this was a single-prompt tool. As the toolkit expands to include cleanup and verification prompts, this pattern prevents prompts from misdiagnosing each other's side effects.

The five-dimension constraint model (Must / Must-not / Prefer / Escalate / Recover) is now a fully intentional design element rather than an emergent pattern. The prompt is ready for distribution and serves as the architectural foundation for the cleanup and verification prompts that follow.

---
