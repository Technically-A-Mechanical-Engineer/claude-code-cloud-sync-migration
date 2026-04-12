# LocalGround Verification Prompt — v1.0.0 Evaluation
**Evaluated:** 2026-04-11
**Evaluator:** Claude (claude.ai peer review session)
**Document under review:** `localground-verification.md` (v1.0.0)

---

## Evaluation Frameworks

This evaluation applies eight prompting and agent architecture frameworks from Nate's Executive Circle content library and Anthropic prompting best practices. These are the same frameworks used to evaluate the migration prompt (v1.0.0 through v1.2.0) and the cleanup prompt (v1.0.0).

| Framework | Source | What It Tests |
|---|---|---|
| Specification Engineer | State of Prompt Engineering Kit — Prompt 3 | Acceptance criteria, constraint architecture, task decomposition, Definition of Done |
| Constraint Architecture | State of Prompt Engineering Kit — Prompt 6 | Must / Must-not / Prefer / Escalate coverage tied to failure modes |
| Self-Contained Problem Statement | State of Prompt Engineering Kit — Prompt Q2 | Whether an executor with zero context can produce correct output |
| First Agent Task | Six Weeks Kit — Prompt 1 | Task summary, success criteria, agent context, verification commands |
| Footgun Detector | Six Weeks Kit — Prompt 4 | Six footgun patterns: vague criteria, missing design, scope creep, abstraction bloat, no checkpoints, wrong tool |
| Loop Designer | Six Weeks Kit — Prompt 3 | Iteration cycle, per-stage success criteria, checkpoints, stuck detection/protocol |
| Agent Architecture Audit | Building Agents Is 80% Plumbing Kit | Day One infrastructure primitives for production agent systems |
| Agent-Readiness Audit | Skills Are Infrastructure Now Kit — Prompt 3 | Whether the prompt functions correctly standalone and in the toolkit context |

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

**Overall: v1.0.0 of the verification prompt passes all eight applicable frameworks. Ready for testing.**

---

## Requirements Traceability

The verification prompt was built against six explicit requirements. All six are satisfied:

| Requirement | Description | Implementation | Status |
|---|---|---|---|
| VER-01 | Audit project health (git fsck, git status, hidden dirs, file counts, symlinks) | Phase 2: steps 2.1–2.6 with per-project summary (2.7) | ✅ Met |
| VER-02 | Audit path-hash integrity (decode, classify as valid/stale/orphan/undecodable) | Phase 3: steps 3.1–3.4 with classification table and per-entry content gathering | ✅ Met |
| VER-03 | Reference scan limited to CLAUDE.md, memory, settings — not .git or binaries | Phase 4.2: explicit search scope table with explicit exclusions (.git/, binaries, node_modules/) | ✅ Met |
| VER-04 | Each finding maps to actionable recommendation pointing to appropriate toolkit prompt | Phase 5.2: finding → recommendation mapping table with 14 finding types, each naming the specific toolkit prompt | ✅ Met |
| VER-05 | Never modify, delete, or create anything except verification-report.md | Operating Constraints (line 83), Role (line 63), Guardrails (line 644) — stated in three separate locations | ✅ Met |
| VER-06 | Long-running scans provide progress status | Phase 4.3: per-project progress update; Operating Constraints (line 87): explicitly labeled as status signal, not confirmation gate | ✅ Met |

---

## Detailed Evaluation

### 1. Specification Engineer

**Criteria:** Acceptance criteria verifiable by an independent observer. Constraint architecture with must/must-not/prefer/escalate. Task decomposition with inputs, outputs, and dependencies. Unambiguous Definition of Done.

**Verdict: Pass.**

- **Acceptance criteria are verifiable per-audit-area.** The traffic light summary (Phase 5.1) uses a three-color system with explicit criteria for each color per audit area. Green/Yellow/Red thresholds are defined in a table — an independent observer can verify the color assignment by checking the criteria. The three-part finding pattern (finding → explanation → recommendation) ensures every reported issue has a verifiable observation, a plain-language interpretation, and a concrete next step.
- **Constraint architecture covers all applicable dimensions** (see Framework 2 for detail). The verification prompt's constraint model is deliberately simpler than the migration and cleanup prompts — no deletion authority means fewer Must-not constraints. The Recovery dimension is explicitly marked "not applicable" with rationale (read-only, no partial state to recover from).
- **Task decomposition is phase-ordered** (1–5) with sub-steps. Phase dependencies are explicit: Phase 4 uses cloud service paths from Phase 1.3, Phase 5 compiles findings from Phases 2–4. Each phase has clear inputs (what was detected in prior phases) and outputs (findings records for Phase 5).
- **Definition of Done** lists six verifiable completion criteria. Each maps to a concrete artifact or observable outcome — "verification-report.md exists in CWD with traffic light summary, findings by audit area, and consolidated action list" is the primary deliverable criterion.

---

### 2. Constraint Architecture

**Criteria:** Five-dimension coverage (Must / Must-not / Prefer / Escalate / Recover), each constraint tied to a specific failure mode it prevents.

**Verdict: Pass.**

The verification prompt is the simplest of the three toolkit prompts in terms of constraint architecture. It has no deletion authority and no confirmation gates beyond the initial environment review. This is appropriate — a read-only audit has a smaller failure surface than a migration or cleanup operation.

| Dimension | Coverage | Key Constraints |
|---|---|---|
| **Must** | Read-only operation (single exception: create verification-report.md). Complete audit — every phase runs for every applicable item. Findings mapped to recommendations. Progress status for long-running scans. | Prevents: accidental modification of user data; incomplete audits that miss issues; opaque findings without guidance; user assuming the session is stuck during Phase 4. |
| **Must-not** | Never modify, delete, move, or rename. Never elevate privileges. Never skip audit areas. Never create files other than the report. | Prevents: destructive side effects from what should be a safe audit; scope creep into modification territory. |
| **Prefer** | Report anomalies rather than investigating. Known cloud patterns only (low false positives). Graceful cross-prompt state. Overwrite prior reports. Proportional output. | Guides: interpretation of findings, cloud service detection scope, multi-prompt coexistence, report lifecycle. |
| **Escalate** | Permission errors on audit commands are logged and execution continues. Missing ~/.claude/projects/ is noted and Phase 3 abbreviates. No cloud services detected abbreviates Phase 4. | Prevents: a single failed check from aborting the entire audit; false reporting about missing infrastructure. |
| **Recover** | Explicitly marked "Not applicable" with rationale: read-only audit with no destructive actions; if interrupted, re-run from scratch; no partial state to recover from. | The explicit "not applicable" designation is correct — the other two prompts need recovery because they create (migration) or destroy (cleanup) state. This prompt does neither. |

The "not applicable" Recovery dimension is a conscious design choice, not an oversight. The rationale is stated inline (line 101). This is the correct approach — adding crash recovery to a read-only prompt would be abstraction bloat.

---

### 3. Self-Contained Problem Statement

**Criteria:** Could an executor with zero prior context produce the correct output from this prompt alone?

**Verdict: Pass.**

- **Path-hash decoding algorithm is reproduced inline** (lines 154–170). The verification prompt does not reference the migration or cleanup prompts for decoding rules — it contains its own complete copy with examples.
- **Cloud service detection patterns are self-contained** (Phase 1.3). The same four-service pattern list used across all three toolkit prompts is duplicated here.
- **Three-way shell detection is self-contained** (Phase 1.1). Detection table with specific methods and command mappings, identical in structure to the other toolkit prompts.
- **The Role section establishes a distinct identity.** The verification assistant "audits" and "generates a report" — it does not "migrate" or "clean up." The behavioral posture is calibrated for a read-only tool.
- **The recommendation mapping table (Phase 5.2) references sibling prompts by filename** but does not depend on them being present. If a user doesn't have the cleanup prompt, the recommendation is still actionable — "use `localground-cleanup.md`" tells them what to look for.
- **The prompt works regardless of migration history.** Phase 1.4 discovers project directories from default locations and cloud storage paths. Phase 1.5 scans path-hash entries. Neither depends on migration artifacts.

---

### 4. First Agent Task

**Criteria:** Task summary (goal, not steps), success criteria (observable outcomes), context for the agent, verification commands that prove success.

**Verdict: Pass.**

- **Task summary:** Opening line — "audits your current environment — project health, path-hash integrity, and stale references — then maps every finding to an actionable recommendation."
- **Success criteria:** Definition of Done lists six criteria. The primary deliverable (verification-report.md) has a specified structure: traffic light summary → findings by audit area → consolidated action list. The traffic light criteria are defined in a table with Green/Yellow/Red thresholds per audit area.
- **Context for the agent:** Auto-detected environment (OS, shell, user profile, cloud services, project directories, path-hash inventory). No user-provided context is required beyond confirming the environment summary.
- **Verification commands:** Platform-specific commands for every audit check — git fsck, git status, hidden directory listing, file counts, symlink detection, path existence checks, reference search (grep/Select-String). Three shell variants throughout.

---

### 5. Footgun Detector

**Criteria:** Six footgun patterns — vague success criteria, missing design phase, scope creep risk, abstraction bloat, no checkpoint strategy, wrong tool for the job.

**Verdict: Pass.**

| Pattern | Status | Notes |
|---|---|---|
| Vague success criteria | ✅ Clear | Traffic light summary with defined thresholds per audit area. Three-part finding pattern (finding → explanation → recommendation) for every issue. Consolidated action list at the bottom of the report. |
| Missing design phase | ✅ Designed | The prompt is a complete specification for a five-phase audit. Every check, every classification criterion, every recommendation mapping is specified. |
| Scope creep risk | ✅ Bounded | Read-only operation constraint prevents the audit from drifting into modification territory. Phase 4.2 explicitly defines the search scope and exclusions (.git/, binaries, node_modules/). |
| Abstraction bloat | ✅ Constrained | Commands are concrete platform-specific invocations. The traffic light system is simple (three colors, defined criteria) rather than a complex scoring rubric. |
| No checkpoint strategy | ✅ Not needed | Read-only audit with a single output artifact. If interrupted, re-run from scratch. No partial state to checkpoint. |
| Wrong tool | ✅ Good fit | Claude Code CLI can execute audit commands, aggregate results, and generate a structured report. The manual checklist provides a hand-execution alternative. |

The most relevant footgun for a verification prompt — **producing findings without actionable guidance** — is addressed by the recommendation mapping table (Phase 5.2) and the consolidated action list (Phase 5.3). Every finding points the user to a specific next step.

---

### 6. Loop Designer

**Criteria:** Iteration cycle, success criteria at each stage, checkpoint/commit strategy, stuck detection, stuck protocol.

**Verdict: Pass.**

- **Iteration cycle:** Phase 2 iterates per-project (health checks → per-project summary). Phase 3 iterates per-path-hash entry (decode → classify → gather contents). Phase 4 iterates per-project with progress updates (build patterns → search → record findings). Each iteration produces a findings record consumed by Phase 5.
- **Success criteria per iteration:** Phase 2 — per-project health record with typed fields. Phase 3 — per-entry classification with contents inventory. Phase 4 — per-match record with file path, line number, matched string, and service.
- **Checkpoint:** Not needed — read-only, re-runnable from scratch. Correctly identified as not applicable.
- **Stuck detection:** Permission errors on individual audit commands are caught and logged — the audit continues. Missing directories abbreviate the relevant phase rather than failing.
- **Stuck protocol:** On permission error — log in report, continue. On missing infrastructure — abbreviate phase, note in report. On empty audit — run applicable phases, report clean state, exit.

The **progress status pattern** (Phase 4.3) is a Loop Designer element adapted for a non-interactive loop: the user sees which iteration the audit is on without being asked to confirm.

---

### 7. Agent Architecture Audit — Day One Primitives

**Criteria:** Evaluated against the 12 production infrastructure primitives from the Claude Code architecture analysis. Only primitives applicable to a single-session, read-only CLI prompt are assessed.

| Primitive | Status | Notes |
|---|---|---|
| Permission System with Trust Tiers | ✅ Present | Read-only tier only — no modification, no deletion, no elevation. Single permitted write: verification-report.md. Most restrictive permission model in the toolkit. |
| Session Persistence That Survives Crashes | ⬜ Not applicable | Read-only audit with no partial state. Re-run from scratch if interrupted. Correctly identified as not needed. |
| Workflow State and Idempotency | ✅ Present | Phase ordering (1–5) with dependencies. Prior report overwrite behavior is idempotent — re-running produces the same report for the same environment state. |
| Structured Streaming Events | ✅ Present | Per-project health records with typed fields. Per-entry classification with contents inventory. Traffic light summary with defined thresholds. Consolidated action list with priority ordering. |
| System Event Logging | ✅ Present | `verification-report.md` is both the output artifact and the audit log. Findings organized by phase, grouped by project, with per-finding detail. |
| Basic Verification Harness | ✅ Present | The entire prompt IS a verification harness — git fsck, hidden dir checks, path-hash classification, reference scanning. Each check has defined pass/fail criteria and a finding-to-recommendation mapping. |

**The verification prompt as a meta-primitive:** This prompt embodies the "Basic Verification Harness" primitive at the toolkit level. The migration prompt copies and verifies. The cleanup prompt deletes with verification. This prompt *is* the standalone verification harness — it audits the toolkit's combined output.

**Not applicable to this prompt type:** Token budget tracking, tool registry, transcript compaction, tool pool assembly, session persistence (read-only, no state to persist).

---

### 8. Agent-Readiness Audit — Toolkit Context

**Criteria:** Whether the prompt functions correctly as a standalone tool and in the context of the three-prompt toolkit.

| Criterion | Status | Notes |
|---|---|---|
| Standalone viability | ✅ Pass | Works on any Claude Code environment regardless of migration history. Discovers projects from default paths and cloud storage locations. Path-hash decoding, cloud service detection, and shell detection are all self-contained. No migration or cleanup artifacts required. |
| Toolkit integration | ✅ Pass | Phase 5.2 recommendation table maps 14 finding types to specific toolkit prompts by filename. Consolidated action list prioritizes: migrate > cleanup > update references > git investigate > review orphans. Cross-references by filename only — no runtime dependency. |
| Cross-prompt state handling | ✅ Pass | Graceful cross-prompt state in Preferences and Guardrails. Post-cleanup state (few/no stale entries) interpreted as healthy. Fresh/never-migrated environments handled naturally. |
| Human-facing section completeness | ✅ Pass | Manual audit checklist covers all three audit areas. "Reading the Verification Report" section explains traffic light system, three-part finding pattern, and consolidated action list. |
| Intentional overlap with migration quick-verify | ✅ Acknowledged | Design spec notes overlap is intentional. Not referenced in the prompt itself — correctly placed as contributor guidance in the design spec, not user-facing content. |

**Design spec compliance check:**

| Design Spec Requirement | Implementation |
|---|---|
| Phase 1: Environment detection | Phase 1, steps 1.1–1.6 |
| Phase 2: Project health audit | Phase 2, steps 2.1–2.7 |
| Phase 3: Path-hash audit | Phase 3, steps 3.1–3.4 |
| Phase 4: Reference audit (scoped, with exclusions) | Phase 4, steps 4.1–4.4 with explicit exclusion list |
| Phase 5: Report with findings and recommendations | Phase 5, steps 5.1–5.4 with traffic light, findings, and action list |
| No confirmation gates for audit actions | Operating Constraints; Phase 1.6 is the only confirmation point |
| Progress status for long-running scans | Phase 4.3, labeled as status signal in Operating Constraints |
| Actionable recommendations pointing to toolkit prompts | Phase 5.2 mapping table with 14 finding types |
| Graceful cross-prompt state | Preferences and Guardrails sections |

---

## Conclusion

The verification prompt v1.0.0 passes all eight evaluation frameworks with no findings. It completes the three-prompt LocalGround Toolkit — migration (copy, never delete), cleanup (delete with verification), and verification (audit, never modify).

Key architectural strengths:

- **Read-only by design.** The strictest permission model in the toolkit. One permitted filesystem write (verification-report.md). Everything else is observation and reporting. Safe to run at any time — before migration, after migration, after cleanup, on a fresh environment.
- **Traffic light summary with defined thresholds.** Green/Yellow/Red per audit area with explicit criteria in a table. The user sees the overall state at a glance before diving into details. Thresholds are binary and verifiable — no subjective judgment required.
- **Three-part finding pattern.** Every finding includes what was detected, what it means in plain language, and what to do about it. The user never sees a diagnostic without guidance. The consolidated action list at the bottom deduplicates and prioritizes across all audit areas.
- **Recommendation mapping to toolkit prompts.** Fourteen finding types mapped to specific prompt filenames with context explaining what the prompt does for that specific finding. The verification prompt is the toolkit's diagnostic hub — it identifies issues and routes users to the correct tool.
- **Graceful degradation.** Missing infrastructure abbreviates the relevant phase rather than failing. The audit runs the same regardless of environment state — the findings just differ.
- **Explicit "not applicable" for Recovery.** The Recovery dimension is consciously omitted with stated rationale, not accidentally missing. Adding crash recovery to a stateless read-only audit would be abstraction bloat — the correct engineering decision is to re-run from scratch.

The prompt is ready for testing against Robert's post-migration, post-cleanup environment, per the build sequence in the toolkit design spec.
