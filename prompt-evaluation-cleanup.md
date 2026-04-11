# Cloud-Sync Cleanup Prompt — v1.0.0 Evaluation
**Evaluated:** 2026-04-10
**Evaluator:** Claude (claude.ai peer review session)
**Document under review:** `cloud-sync-cleanup.md` (v1.0.0)

---

## Evaluation Frameworks

This evaluation applies eight prompting and agent architecture frameworks from Nate's Executive Circle content library and Anthropic prompting best practices. These are the same frameworks used to evaluate the migration prompt across all versions (v1.0.0 through v1.2.0).

| Framework | Source | What It Tests |
|---|---|---|
| Specification Engineer | State of Prompt Engineering Kit — Prompt 3 | Acceptance criteria, constraint architecture, task decomposition, Definition of Done |
| Constraint Architecture | State of Prompt Engineering Kit — Prompt 6 | Must / Must-not / Prefer / Escalate coverage tied to failure modes |
| Self-Contained Problem Statement | State of Prompt Engineering Kit — Prompt Q2 | Whether an executor with zero context can produce correct output |
| First Agent Task | Six Weeks Kit — Prompt 1 | Task summary, success criteria, agent context, verification commands |
| Footgun Detector | Six Weeks Kit — Prompt 4 | Six footgun patterns: vague criteria, missing design, scope creep, abstraction bloat, no checkpoints, wrong tool |
| Loop Designer | Six Weeks Kit — Prompt 3 | Iteration cycle, per-stage success criteria, checkpoints, stuck detection/protocol |
| Agent Architecture Audit | Building Agents Is 80% Plumbing Kit | Day One infrastructure primitives for production agent systems |
| Agent-Readiness Audit | Skills Are Infrastructure Now Kit — Prompt 3 | Whether the prompt functions correctly as a standalone tool and in the toolkit context |

---

## Results Summary

| Framework | Verdict | Findings |
|---|---|---|
| Specification Engineer | **Pass** | 0 findings |
| Constraint Architecture | **Pass** | 0 findings |
| Self-Contained Problem Statement | **Pass** | 0 findings |
| First Agent Task | **Pass** | 0 findings |
| Footgun Detector | **Pass** | 0 findings |
| Loop Designer | **Pass** | 0 findings |
| Agent Architecture Audit | **Pass** | 0 findings |
| Agent-Readiness Audit | **Pass** | 0 findings |

**Overall: v1.0.0 of the cleanup prompt passes all eight applicable frameworks. Ready for testing.**

---

## Detailed Evaluation

### 1. Specification Engineer

**Criteria:** Acceptance criteria verifiable by an independent observer. Constraint architecture with must/must-not/prefer/escalate. Task decomposition with inputs, outputs, and dependencies. Unambiguous Definition of Done.

**Verdict: Pass.**

- **Acceptance criteria are verifiable per-deletion.** Each deletion dialog presents verification evidence above the delete prompt — file counts, local equivalent confirmation, decoded paths, sizes, git integrity. An independent observer can verify whether the evidence supports the deletion. The "incomplete copy gate" (Phase 4.4) has four binary conditions (file count, size, git fsck, hidden dirs) — any failure blocks the deletion with a specific, observable reason.
- **Constraint architecture covers all five dimensions** (see Framework 2 for detail). The cleanup prompt is the first prompt in the toolkit where the Must dimension includes deletion verification — a higher bar than the migration prompt's copy-and-verify model.
- **Task decomposition is phase-ordered by risk** (Phases 1–5), with sub-steps (2.1–2.5, 3.1–3.6, 4.1–4.8). Phase dependencies are explicit: Phase 4 requires Phases 2–3 complete. Each phase has an entrance gate (user confirmation), an exit summary, and incremental logging throughout.
- **Definition of Done** lists five verifiable completion criteria. Each criterion maps to a concrete artifact or user interaction — "cleanup-results.md exists in CWD with a complete record" is observable; "the user has been presented with a final summary" is verifiable from the session transcript.

---

### 2. Constraint Architecture

**Criteria:** Five-dimension coverage (Must / Must-not / Prefer / Escalate / Recover), each constraint tied to a specific failure mode it prevents.

**Verdict: Pass.**

The cleanup prompt carries higher deletion risk than the migration prompt (which never deletes). The constraint architecture is tuned accordingly — the Must and Must-not dimensions are more restrictive.

| Dimension | Coverage | Key Constraints |
|---|---|---|
| **Must** | Verified deletion only: file counts match or exceed, sizes comparable, git fsck passes, hidden dirs present. Individual confirmation on every deletion. Incremental logging. Show verification evidence above every delete prompt. | Prevents: deleting a source folder with an incomplete local copy; deleting without user awareness of what's being lost; losing the audit trail if the session crashes. |
| **Must-not** | Never delete without verified local copy. Never batch deletions. Never elevate privileges. Never skip phase ordering. Never continue past a failed deletion without user resolution. | Prevents: catastrophic data loss from batch-deleting source folders; silent privilege escalation; skipping to high-risk deletions before low-risk ones are resolved. |
| **Prefer** | Lowest-risk first. Report anomalies rather than investigating. Fewer questions, more detection. Conservative classification in standalone mode. Graceful cross-prompt state. | Guides: phase ordering, ambiguity resolution, interaction style, multi-prompt coexistence. |
| **Escalate** | Incomplete local copy blocks deletion entirely. File count or size mismatch blocks Phase 4 for that folder. Permission failures stop execution. Partial deletions flag for investigation. | Prevents: deleting when verification evidence is insufficient; silently continuing past failures. |
| **Recover** | Cleanup log written incrementally. Prior cleanup detection on re-run. Deleted-but-still-exists re-presentation. Phase 4 deferral recorded and detected on re-run. 3-retry cap with mandatory skip recommendation. | Prevents: lost progress on session crash; silent failure masking; infinite retry loops; losing track of deferred work. |

The five dimensions are each tied to specific failure modes rather than being abstract principles. The Must dimension is notably stronger here than in the migration prompt — "verified deletion only" with evidence shown to the user is a higher standard than "copy and verify."

---

### 3. Self-Contained Problem Statement

**Criteria:** Could an executor with zero prior context produce the correct output from this prompt alone?

**Verdict: Pass.**

- **Dual-mode detection makes the prompt self-contained regardless of history.** A user who ran the migration prompt gets post-migration mode (artifact-driven, high confidence). A user who migrated manually or never used the migration prompt gets standalone mode (filesystem-driven, more questions). Neither mode depends on external context that isn't on disk.
- **Path-hash decoding algorithm is reproduced inline** (lines 170–186). The cleanup prompt does not reference the migration prompt for decoding rules — it contains its own complete copy with examples. A user running cleanup without ever having the migration prompt on disk can still decode path-hash directories.
- **Three-way shell detection is self-contained.** The detection table (Phase 1.1) includes specific detection methods (`$PSVersionTable`, `$OSTYPE`, `uname -s`) and maps each to a shell context, deletion tool, and utility command set. No external reference needed.
- **Cloud service recycle bin retention periods are inline** (Phase 1.4). The user doesn't need to look up their service's retention policy — it's in the prompt.
- **The Role section establishes identity and behavioral posture** without referencing the migration prompt's Role. The cleanup assistant has deletion authority, which the migration assistant explicitly did not.

---

### 4. First Agent Task

**Criteria:** Task summary (goal, not steps), success criteria (observable outcomes), context for the agent, verification commands that prove success.

**Verdict: Pass.**

- **Task summary:** Opening line — "safely removes the stale artifacts left behind" after migration. The word "safely" is operationalized in the Operating Constraints, not left as a platitude.
- **Success criteria:** Definition of Done lists five criteria. Per-deletion success criteria are embedded in each phase — Phase 2 requires local equivalent confirmation, Phase 4 requires file count, size, git, and hidden dir verification.
- **Context for the agent:** Dual-mode detection (migration artifacts vs. standalone scan), path-hash inventory with classification table, cloud service detection with retention periods.
- **Verification commands:** Platform-specific commands for every verification step. Three shell variants (PowerShell, bash-on-Windows, native bash) for file counts, sizes, git fsck, hidden dir checks, path existence checks, and deletion confirmation. Post-deletion verification (`Test-Path` / `test -d`) confirms each deletion actually completed.

---

### 5. Footgun Detector

**Criteria:** Six footgun patterns — vague success criteria, missing design phase, scope creep risk, abstraction bloat, no checkpoint strategy, wrong tool for the job.

**Verdict: Pass.**

| Pattern | Status | Notes |
|---|---|---|
| Vague success criteria | ✅ Clear | Per-deletion verification with four binary checks (count, size, git, hidden dirs). Incomplete copy gate blocks deletion with specific, observable failure reason. |
| Missing design phase | ✅ Designed | The entire prompt IS the specification for a destructive workflow. Every deletion path is fully designed — no "figure it out" delegation. |
| Scope creep risk | ✅ Bounded | Phase ordering enforces risk escalation. Phase 1 classification determines what enters each phase. Items not classified as stale, orphan, or source are skipped — the prompt doesn't expand scope beyond its classification. |
| Abstraction bloat | ✅ Constrained | Commands are concrete platform-specific invocations. The dual-mode detection adds complexity but not abstraction — both modes use the same phase structure with different confidence levels. |
| No checkpoint strategy | ✅ Has one | `cleanup-results.md` written incrementally after each deletion. Crash recovery reads the log on re-run. Phase 4 deferral is logged and detected on re-run. 3-retry cap prevents infinite loops. |
| Wrong tool | ✅ Good fit | Claude Code CLI is the correct tool — it can execute deletion commands, verify results, and interact with the user through confirmation gates. The manual checklist in the human section provides an escape hatch for users who prefer to do it by hand. |

The most important footgun for a destructive prompt — **deleting without sufficient verification** — is addressed by the incomplete copy gate (Phase 4.4), which blocks deletion when any of four conditions fail. This is the cleanup-specific equivalent of the migration prompt's pre-copy placeholder verification.

---

### 6. Loop Designer

**Criteria:** Iteration cycle, success criteria at each stage, checkpoint/commit strategy, stuck detection, stuck protocol.

**Verdict: Pass.**

- **Iteration cycle:** For each item in each phase: gather context → verify → present evidence → confirm → delete (or skip) → log → verify deletion → next item. The cycle is consistent across all three deletion phases (2, 3, 4) with risk-appropriate verification depth increasing at each phase.
- **Success criteria per iteration:** Phase 2 — local equivalent exists and contains files. Phase 3 — user confirms after seeing contents and best-guess identification. Phase 4 — four verification checks pass (file count, size, git fsck, hidden dirs).
- **Checkpoint:** `cleanup-results.md` appended after each deletion or skip. Crash recovery reads the log on re-run and resumes from where the previous run stopped.
- **Stuck detection:** Deletion failure (permission error, locked files, partial deletion) triggers a stop. 3-retry cap prevents infinite retry loops. Incomplete local copy blocks Phase 4 deletion for that folder.
- **Stuck protocol:** On deletion failure — stop, report error with diagnostic guidance (locked files, sync agents, open editors), offer retry or skip. After 3 retries — recommend skip and manual investigation. On incomplete copy — block deletion entirely, recommend re-running migration for that folder. On Phase 4 deferral — log and offer to resume on re-run.

The **risk-escalating phase order** (stale → orphan → source) is a Loop Designer pattern not present in the migration prompt: the iteration cycle itself is ordered by consequence severity, so the user builds confidence on low-risk items before facing high-risk deletions.

---

### 7. Agent Architecture Audit — Day One Primitives

**Criteria:** Evaluated against the 12 production infrastructure primitives from the Claude Code architecture analysis. Only primitives applicable to a single-session CLI prompt are assessed.

| Primitive | Status | Notes |
|---|---|---|
| Permission System with Trust Tiers | ✅ Present | Three-tier risk model: stale path-hash (low risk, simple verification) → orphan/undecodable (medium risk, context-gathering before confirmation) → source folders (high risk, full four-point verification gate). Each tier has calibrated verification requirements. Individual confirmation on every deletion regardless of tier. No elevation permitted. |
| Session Persistence That Survives Crashes | ✅ Present | `cleanup-results.md` written incrementally after each action. Prior cleanup detection reads the log on re-run. Deleted-but-still-exists check catches silent failures or user restorations. Phase 4 deferral persists across sessions. |
| Workflow State and Idempotency | ✅ Present | Phase ordering (2 → 3 → 4) with gates. Cleanup log tracks state per-item (deleted, skipped, blocked, deferred, failed, partial). Re-running the prompt detects partial state and resumes rather than restarting. Items logged as deleted are verified on re-run — if still present, re-presented rather than silently skipped. |
| Structured Streaming Events | ✅ Present | Per-item deletion dialog with typed verification fields. Phase summaries with categorized counts (deleted, skipped, blocked, failed). Final report with structured summary table. |
| System Event Logging | ✅ Present | `cleanup-results.md` serves as both the crash recovery checkpoint and the audit trail. Each row includes timestamp, category, path, and verification detail. Summary section appended at completion with totals, cloud service impact, and items requiring attention. |
| Basic Verification Harness | ✅ Present | Four-point verification for source folder deletions (file count, size, git fsck, hidden dirs). Thresholds calibrated to avoid false positives (5-file count tolerance, 5% size tolerance). Post-deletion existence check confirms each deletion completed. |

**Cross-prompt state primitive:** The graceful cross-prompt state principle — interpreting missing entries as possible prior cleanup rather than corruption — appears in both the Preferences and Guardrails sections. This is the same cross-agent state interpretation primitive identified in the migration v1.2.0 evaluation, now applied bidirectionally: the cleanup prompt accounts for the migration prompt's state, and the migration prompt accounts for the cleanup prompt's state.

**Not applicable to this prompt type:** Token budget tracking, tool registry, transcript compaction, tool pool assembly.

---

### 8. Agent-Readiness Audit — Toolkit Context

**Criteria:** Whether the prompt functions correctly as a standalone tool and in the context of the three-prompt toolkit.

| Criterion | Status | Notes |
|---|---|---|
| Standalone viability | ✅ Pass | Dual-mode detection ensures the prompt works without migration artifacts. Standalone mode discovers stale/orphan entries through filesystem scanning alone. Path-hash decoding algorithm is inline. All shell detection and cloud service detection is self-contained. |
| Toolkit integration | ✅ Pass | Post-migration mode reads `migration-session-1-results.md` and `migration-session-2-results.md` for high-confidence classification. Phase 5 next-steps reference both sibling prompts by filename (`claude-code-cloud-sync-migration.md` for incomplete copies, `cloud-sync-verification.md` for health audit). Cross-references are by filename only — no runtime dependency. |
| Cross-prompt state handling | ✅ Pass | Missing path-hash directories interpreted as possible prior cleanup. Migration artifacts that reference entries no longer on disk handled gracefully (noted, not escalated). Phase 4 deferral survives across sessions. |
| Human-facing section completeness | ✅ Pass | Manual cleanup checklist covers all three categories (stale, orphan, source) in risk order. Soak-period recommendation included. Cloud-propagation warning included. Matches the Claude-facing methodology — a user following the manual steps would perform the same verification and risk ordering as the prompt. |

**Design spec compliance check:** The cleanup prompt implements all requirements from the toolkit design spec (`2026-04-10-cloud-sync-toolkit-design.md`):

| Design Spec Requirement | Implementation |
|---|---|
| Dual-mode detection (post-migration vs. standalone) | Phase 1.3 with explicit mode reporting |
| Phase ordering: stale → orphan → source | Phases 2 → 3 → 4 with gates |
| Verify local copy before offering source deletion | Phase 4.3 (four-point verification) + Phase 4.4 (incomplete copy gate) |
| Individual confirmation on every deletion | Operating Constraint, enforced in Phases 2.2, 3.2/3.3, 4.5 |
| Soak-period check for Phase 4 | Phase 4.2 with 3-day threshold and defer option |
| Recovery via incremental cleanup log | Phase 2.4/3.5/4.7 incremental logging + Phase 1.2 prior cleanup detection |
| Manual steps section | Lines 10–46 with risk-ordered checklist |
| Five-dimension constraint model | Operating Constraints + Preferences + Recovery sections |
| Graceful cross-prompt state | Preferences and Guardrails sections |

---

## Prior Review Findings — Resolution Status

The cleanup prompt was reviewed in claude.ai before this evaluation. Four minor findings were identified and all were resolved in the current version:

| Finding | Severity | Resolution |
|---|---|---|
| macOS vs. Linux `stat` syntax inconsistency | Minor | Resolved. All `stat` commands now have explicit macOS (`stat -f`) and Linux (`stat -c`) variants. bash-on-Windows explicitly maps to Linux coreutils. |
| Retry/skip dialog missing retry cap | Minor | Resolved. Phase 4.6 now specifies a 3-retry cap per folder with mandatory skip recommendation after 3 failures. |
| Standalone mode missing manual path provision | Minor | Resolved. Phase 4.1 standalone mode now includes a note directing users to add manually-migrated folders via the "add" option. |
| Manual checklist missing soak-period recommendation | Minor | Resolved. Manual section 3 now includes a blockquote soak-period recommendation before the numbered steps. |

---

## Conclusion

The cleanup prompt v1.0.0 passes all eight evaluation frameworks with no findings. It is the first prompt in the toolkit that carries deletion authority, and the constraint architecture is calibrated accordingly — the Must and Must-not dimensions are more restrictive than the migration prompt, the verification requirements are higher, and the risk-escalating phase order ensures the user builds confidence before facing high-consequence deletions.

Key architectural strengths:

- **Verification-forward deletion pattern.** Evidence is shown above every delete prompt. The user never sees a bare "Delete? [y/n]" without context. This is the single most important design decision for a destructive prompt.
- **Incomplete copy gate.** Four binary checks block deletion when verification evidence is insufficient. The prompt will not offer to delete a source folder with an incomplete local copy — it blocks and recommends re-running the migration.
- **Dual-mode detection.** Post-migration mode uses artifacts for high-confidence cleanup with fewer questions. Standalone mode works independently with conservative classification. Same safety guarantees in both modes.
- **Risk-escalating phase order.** Stale path-hash directories (small, easily replaced) → orphans (no local equivalent, user confirms after seeing contents) → source folders (full project trees, four-point verification required). The user's first deletions are lowest-consequence, building trust in the methodology before facing the highest-risk items.
- **Incremental logging as crash recovery.** Every deletion is logged immediately. Re-running the prompt resumes from where the previous run stopped. No progress is lost on session interruption.

The prompt is ready for testing against Robert's stale path-hash directories and source folders, per the build sequence in the toolkit design spec.
