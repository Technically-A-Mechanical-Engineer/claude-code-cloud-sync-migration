# LocalGround Reap Prompt — v1.0.0 Evaluation
**Evaluated:** 2026-04-12
**Evaluator:** Claude (Claude Code peer review session)
**Document under review:** `localground-reap.md` (v1.0.0)

---

## Evaluation Frameworks

This evaluation applies eight prompting and agent architecture frameworks from Nate's Executive Circle content library and Anthropic prompting best practices. These are the same frameworks used to evaluate the migration prompt (v1.0.0 through v1.2.0), the cleanup prompt (v1.0.0), and the verification prompt (v1.0.0).

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

**Overall: v1.0.0 of the reap prompt passes all eight applicable frameworks. Ready for testing.**

---

## Prior Code Review Findings

Before this NEC evaluation, Plan 08-01 applied five code review fixes (three warnings, two informational) identified during the Phase 7 build review. All five were resolved before evaluation:

| ID | Severity | Description | Resolution |
|---|---|---|---|
| WR-001 | Warning | Missing explicit skip for Phase 2 in unseeded mode | Resolved — explicit skip instruction added at line 67 |
| WR-002 | Warning | Missing `--no-dangling` flag on git fsck command | Resolved — flag added to git fsck command in Phase 3.1 |
| WR-003 | Warning | Missing SHA-256 case-insensitive comparison instruction | Resolved — case-insensitive comparison specified in Phase 2.2 and Guardrails |
| INFO-001 | Info | Definition of Done and Guardrails sections not present | Resolved — both sections added (lines 599-629) |
| INFO-002 | Info | Phase 5 marker cleanup offer not implemented | Resolved — Phase 5 added (lines 539-597) |

These fixes were committed before the NEC evaluation. The prompt evaluated here is the post-fix version.

---

## Detailed Evaluation

### 1. Specification Engineer

**Criteria:** Acceptance criteria verifiable by an independent observer. Constraint architecture with must/must-not/prefer/escalate. Task decomposition with inputs, outputs, and dependencies. Unambiguous Definition of Done.

**Verdict: Pass.**

- **Acceptance criteria are verifiable per-check.** Every health check (Phases 2 and 3) has explicit PASS/WARN/FAIL scoring criteria with binary conditions. The seed verification in Phase 2 specifies exact SHA-256 comparison, file size match, and git tag commit match — all independently observable. The operations check (Phase 3.5) has write-and-delete success/failure conditions that any observer can verify.
- **Constraint architecture covers all five dimensions.** The Operating Constraints section (lines 71-114) specifies Must (10 constraints), Must-not (6 prohibitions), Prefer (6 preferences), Escalate (4 triggers), and Recover (2 recovery behaviors). Each constraint maps to a specific failure mode — see Framework 2 for detail.
- **Task decomposition is phase-ordered** (Phases 1-5) with sub-steps (1.1-1.6, 2.1-2.4, 3.1-3.5, 4.1-4.7, 5.1-5.3). Phase dependencies are explicit: Phase 2 depends on manifest parsed in Phase 1.5. Phase 4 compiles results from Phases 2 and 3. Phase 5 runs only if no FAIL results across all phases.
- **Definition of Done** (lines 599-610) lists seven verifiable completion criteria. Each criterion maps to a concrete artifact or observable outcome — "reap-report.md exists in CWD with traffic-light summary, results table, detail section for WARN/FAIL items, and consolidated action list" is the primary deliverable.

---

### 2. Constraint Architecture

**Criteria:** Five-dimension coverage (Must / Must-not / Prefer / Escalate / Recover), each constraint tied to a specific failure mode it prevents.

**Verdict: Pass.**

The reap prompt is the fourth prompt in the toolkit and the first to combine seed verification (trusted external markers) with health checks (filesystem-level diagnostics). The constraint architecture reflects its hybrid nature — nearly read-only (like the verification prompt) but with two limited write operations (temp file and report) and optional marker deletion (Phase 5).

| Dimension | Coverage | Key Constraints |
|---|---|---|
| **Must** | Run all checks against CWD only. Report every check with PASS/WARN/FAIL and a one-line explanation. Write report to `reap-report.md`. Clean up temp file immediately. Read manifest with Claude Code's Read tool. Verify each seed marker independently. Present marker cleanup only after all checks complete with no FAIL. | Prevents: scope creep to other directories; silent check skips; missing report artifact; temp file pollution; JSON parse errors from external tools; aggregate masking of individual marker failures; offering cleanup when findings are unresolved. |
| **Must-not** | Never modify existing project files. Never modify git history. Never read files outside CWD and `~/.claude/projects/`. Never scan `.git/objects/` or binaries. Never delete seed manifest. Never offer cleanup if any FAIL. | Prevents: accidental data corruption; git state damage; scope creep beyond project boundary; performance problems from binary scanning; destroying the seed audit trail; cleanup before issues are resolved. |
| **Prefer** | Run checks in parallel where independent. Report as summary table, not one at a time. SKIP with reason rather than FAIL for inapplicable checks. Overwrite prior report. Include manual cleanup commands if user declines. Proportional output. | Guides: execution efficiency; UX consistency; honest reporting of inapplicable checks; report lifecycle; user self-service after session; output scaling. |
| **Escalate** | CWD under cloud storage stops immediately. Malformed manifest JSON fails seed verification and skips Phase 2. Unrecognized manifest version produces WARN. Path-hash name mismatch stops and reports collision. | Prevents: running diagnostics on a project that hasn't been migrated; crashing on bad JSON; blocking on forward-compatible manifests; silent path-hash collision. |
| **Recover** | Tool errors on individual checks report error and continue. Missing markers with manifest present report FAIL per marker. | Prevents: a single broken check from aborting the entire diagnostic; crashing on expected post-cleanup state. |

The five dimensions are each tied to specific failure modes rather than being abstract principles. The Must-not dimension is calibrated for a nearly-read-only prompt — stricter than the migration prompt but without the deletion authority constraints of the cleanup prompt.

---

### 3. Self-Contained Problem Statement

**Criteria:** Could an executor with zero prior context produce the correct output from this prompt alone?

**Verdict: Pass.**

- **Path-hash encoding algorithm is reproduced inline** (Phase 1.4, lines 156-163). The reap prompt does not reference the migration, cleanup, or verification prompts for encoding rules — it contains its own complete copy with examples, including the consecutive-hyphens rule and the bash-on-Windows `sed` warning.
- **Cloud service detection patterns are self-contained** (Phase 1.3, lines 141-148). The same four-service pattern list used across all toolkit prompts is duplicated here with platform-specific path patterns.
- **Three-way shell detection is self-contained** (Phase 1.1, lines 123-131). Detection table with specific methods (`$PSVersionTable`, `$OSTYPE`, `uname -s`) and maps each to a shell context with platform-specific utility commands used throughout.
- **Manifest schema is defined by example** (Phases 1.5 and 2.1-2.3). The prompt specifies exactly what fields to expect, what marker types exist, and how to handle unknown types — no external schema reference needed.
- **Platform-specific commands are specified for every check.** SHA-256 computation (Phase 2.2) has PowerShell, bash-Linux, and bash-macOS variants. Memory connection checks (Phase 3.2) have PowerShell and bash variants. The prompt never says "compute the hash" without specifying how for each platform.
- **The Role section establishes a distinct identity** (line 48). The reap assistant "verifies" and "reports" — it does not "migrate," "clean up," or "audit broadly." The behavioral posture is calibrated for a focused, single-project diagnostic.

---

### 4. First Agent Task

**Criteria:** Task summary (goal, not steps), success criteria (observable outcomes), context for the agent, verification commands that prove success.

**Verdict: Pass.**

- **Task summary:** Opening paragraph — "verifies that the project is healthy at its new location and — if you planted seed markers before migration — confirms that file content and git history survived the copy intact." The goal is stated before the methodology.
- **Success criteria:** Definition of Done (lines 599-610) lists seven criteria. The primary deliverable (`reap-report.md`) has a specified structure: traffic-light summary, results table, detail section for WARN/FAIL, consolidated action list. Traffic-light criteria are defined in Phase 4.2 with explicit GREEN/YELLOW/RED thresholds.
- **Context for the agent:** Auto-detected environment (OS, shell, project identity, git status, path-hash existence, mode). The environment summary (Phase 1.6) is presented before any checks run. No user-provided context is required.
- **Verification commands:** Platform-specific commands for every check — `git fsck --no-dangling`, `git status --short`, `git branch -l`, `Get-FileHash`/`sha256sum`/`shasum`, `git tag -l`, `Test-Path`/`test -d`, `Get-ChildItem`/`ls`, `Select-String`/`grep`, file write/delete test sequences. Three shell variants throughout.

---

### 5. Footgun Detector

**Criteria:** Six footgun patterns — vague success criteria, missing design phase, scope creep risk, abstraction bloat, no checkpoint strategy, wrong tool for the job.

**Verdict: Pass.**

| Pattern | Status | Notes |
|---|---|---|
| Vague success criteria | Clear | Per-check PASS/WARN/FAIL with binary scoring criteria. Per-marker PASS/FAIL for seeds. Traffic-light summary with defined thresholds. Every finding maps to an actionable recommendation (Phase 4.4). |
| Missing design phase | Designed | The prompt is a complete specification for a five-phase diagnostic. Every check, every scoring criterion, every recommendation mapping, every platform-specific command is specified. |
| Scope creep risk | Bounded | Must constraint: "Run all checks against the current working directory only." Must-not: "Never read or modify files outside CWD and `~/.claude/projects/`." Phase 5 cleanup is gated on zero FAIL results and individual user confirmation per marker. |
| Abstraction bloat | Constrained | Commands are concrete platform-specific invocations. Two operating modes (seeded/unseeded) are cleanly separated by manifest detection — no complex routing logic. The traffic-light system is simple (three colors, defined criteria). |
| No checkpoint strategy | Not needed | Nearly read-only diagnostic with a single output artifact. If interrupted, re-run from scratch. The only state modification is the optional Phase 5 marker cleanup, which has individual confirmation gates. |
| Wrong tool | Good fit | Claude Code CLI can execute diagnostic commands, compute checksums, parse JSON, aggregate results, and generate a structured report. The human-facing section (lines 1-43) provides context for users who want to understand the process before pasting. |

The most relevant footgun for a diagnostic prompt — **producing findings without actionable guidance** — is addressed by the recommendation mapping in Phase 4.4 and the consolidated action list in Phase 4.5. Every WARN or FAIL maps to a specific recommendation referencing the appropriate toolkit prompt.

---

### 6. Loop Designer

**Criteria:** Iteration cycle, success criteria at each stage, checkpoint/commit strategy, stuck detection, stuck protocol.

**Verdict: Pass.**

- **Iteration cycle:** Phase 2 iterates per-marker (read manifest, verify test file, verify git tag — each independently scored). Phase 3 iterates per-check (git integrity with three sub-checks, memory connection, stale references across multiple files, file system with two sub-checks, operations). Each check produces a typed result (PASS/WARN/FAIL/SKIP) consumed by Phase 4.
- **Success criteria per iteration:** Phase 2 — per-marker PASS/FAIL based on file existence + SHA-256 match + size match (test file) or tag existence + commit match (git tag). Phase 3 — per-check scoring criteria defined inline (e.g., git fsck: exit code 0 with no error lines = PASS, exit code 0 with warnings = WARN, non-zero = FAIL).
- **Checkpoint:** Not needed — nearly read-only, re-runnable from scratch. The only persistent output is `reap-report.md`, which is overwritten on each run. Correctly identified as not applicable.
- **Stuck detection:** Tool errors on individual checks are caught — the Recover constraint specifies "report the error and continue with remaining checks." Malformed manifest JSON fails seed verification but does not abort the diagnostic (escalate to Phase 3).
- **Stuck protocol:** On tool error — log error, continue with remaining checks. On malformed manifest — FAIL seed verification, skip Phase 2, proceed to Phase 3. On permission error — report as FAIL finding, continue. On missing path-hash directory — FAIL memory connection, include fallback check for old cloud-stored path-hash. These degradation paths ensure the diagnostic produces useful output even when individual checks fail.

The **mode-dependent phase flow** (seeded: 1-2-3-4-5, unseeded: 1-3-4) is a Loop Designer pattern that prevents unnecessary iterations — unseeded mode skips Phase 2 (no markers to verify) and Phase 5 (no markers to clean up) rather than running them with empty input.

---

### 7. Agent Architecture Audit — Day One Primitives

**Criteria:** Evaluated against the 12 production infrastructure primitives from the Claude Code architecture analysis. Only primitives applicable to a single-session, nearly-read-only CLI prompt are assessed.

| Primitive | Status | Notes |
|---|---|---|
| Permission System with Trust Tiers | Present | Three-tier permission model: (1) read-only checks (Phases 1-3, no filesystem modification), (2) limited write (temp file in Phase 3.5, immediately cleaned up; report in Phase 4), (3) marker deletion (Phase 5, individual user confirmation required, gated on zero FAIL). Each tier has escalating confirmation requirements. |
| Session Persistence That Survives Crashes | Not applicable | Nearly read-only diagnostic with a single output artifact. Re-run from scratch if interrupted. The only persistent state is `reap-report.md`, which is overwritten. Correctly identified as not needed — the same rationale as the verification prompt. |
| Workflow State and Idempotency | Present | Phase ordering (1-5) with mode-dependent flow. Prior report overwrite is idempotent — re-running produces the same report for the same environment state. Temp file cleanup is idempotent (delete even if write test fails). |
| Structured Streaming Events | Present | Per-check typed results (PASS/WARN/FAIL/SKIP) with one-line explanations. Per-marker independent verification results. Traffic-light summary with defined thresholds. Consolidated action list with priority ordering. |
| System Event Logging | Present | `reap-report.md` serves as both the output artifact and the diagnostic log. Results organized by check type, with detail entries for WARN/FAIL items including what was found and what to do. |
| Basic Verification Harness | Present | The entire prompt IS a verification harness — seed marker checksum verification, git fsck, memory connection check, stale reference scan, file system integrity check, operations test. Each check has defined scoring criteria and a finding-to-recommendation mapping. |

**The reap prompt as a trust-verification primitive:** This prompt serves a unique role in the toolkit — it verifies that the migration prompt's copy operation preserved data integrity. The seed markers (planted before migration, verified after) provide cryptographic evidence (SHA-256) that file content survived the copy. This is the toolkit's only prompt that can mathematically verify copy fidelity rather than relying on file count and size heuristics.

**Not applicable to this prompt type:** Token budget tracking, tool registry, transcript compaction, tool pool assembly, session persistence (nearly read-only, no state to persist).

---

### 8. Agent-Readiness Audit — Toolkit Context

**Criteria:** Whether the prompt functions correctly as a standalone tool and in the context of the five-prompt toolkit.

| Criterion | Status | Notes |
|---|---|---|
| Standalone viability | Pass | Unseeded mode works on any migrated project regardless of whether the seed prompt was used. All detection logic (shell, cloud service, path-hash encoding) is self-contained. No dependency on migration, cleanup, or verification prompt artifacts. |
| Toolkit integration | Pass | Seeded mode reads the manifest written by the seed prompt (Phase 9). Phase 4.4 recommendations reference sibling prompts by filename (`localground-migration.md`, `localground-cleanup.md`, `localground-seed.md`). The manifest contract (`.localground-seed-manifest.json`) defines the Seed-to-Reap interface — Seed writes, Reap reads. Cross-references by filename only — no runtime dependency. |
| Cross-prompt state handling | Pass | Manifest present but markers removed → FAIL per missing marker (expected post-cleanup state). Missing path-hash directory → FAIL with fallback check for old cloud-stored path-hash. Missing `.claude` directory → WARN (normal for newly migrated projects). Graceful interpretation at every boundary. |
| Human-facing section completeness | Pass | Lines 1-43 provide: what the prompt does, compatibility note, two-mode description, what-it-checks table with seven rows, reading-the-report section explaining PASS/WARN/FAIL and traffic-light system. A user understands the process before pasting. |
| Manifest contract as interface | Pass | The manifest schema is defined in `dev-status-reap.md` with contract rules: Reap reads, Seed writes. Unknown marker types are ignored (forward compatibility). Unrecognized version values produce WARN (graceful degradation). Malformed JSON produces FAIL for seed verification only (does not abort health checks). This is the first formal inter-prompt data contract in the toolkit. |

**Design spec compliance check:**

| Design Spec Requirement | Implementation |
|---|---|
| Detect seeded vs. unseeded mode via manifest presence | Phase 1.5 with explicit mode reporting |
| Verify seed markers (test file checksum, git tag) | Phase 2 with per-marker PASS/FAIL and platform-specific SHA-256 |
| Six health checks | Phases 1.3 (cloud location) + 3.1-3.5 (git, memory, references, file system, operations) |
| PASS/WARN/FAIL per check with clear criteria | Scoring criteria defined inline for every check |
| Write reap-report.md | Phase 4 with header, traffic-light summary, results table, detail section, action list |
| Marker cleanup with individual confirmation | Phase 5 with per-marker confirmation gates, gated on zero FAIL |
| Three-way shell detection | Phase 1.1 with platform-specific command mapping |
| Five-dimension constraint model | Operating Constraints section with all five dimensions |
| Nearly read-only (temp file + report only) | Must-not constraints; Guardrails section |

---

## Conclusion

The reap prompt v1.0.0 passes all eight evaluation frameworks with no findings. It is the fourth prompt in the toolkit and the first to introduce a formal inter-prompt data contract (the seed manifest schema) and cryptographic copy verification (SHA-256 checksum matching).

Key architectural strengths:

- **Dual-mode design with clean separation.** Seeded and unseeded modes share the same health check infrastructure (Phase 3) but diverge cleanly at Phase 2 (seed verification) and Phase 5 (marker cleanup). Mode detection is a single binary check (manifest file exists or not) — no complex state machine.
- **Per-marker independent verification.** Each seed marker is verified independently with its own PASS/FAIL verdict. No aggregate seed score that could mask an individual marker failure. This is the correct design for a trust-verification tool — the user sees exactly which markers survived and which did not.
- **Graduated permission model.** The prompt starts fully read-only (Phases 1-3), creates one temp file that is immediately deleted (Phase 3.5), writes one report (Phase 4), and optionally deletes seed markers with individual confirmation (Phase 5). Each permission tier is gated and justified. The strictest operations happen first.
- **Forward-compatible manifest handling.** Unknown marker types are ignored. Unrecognized version values produce WARN, not FAIL. Malformed JSON fails seed verification but does not abort health checks. The prompt degrades gracefully across all manifest edge cases — it will not crash on a future seed version's manifest.
- **Recommendation mapping to toolkit prompts.** Every WARN and FAIL finding maps to a specific recommendation referencing the appropriate toolkit prompt by filename (Phase 4.4). The user never sees a diagnostic finding without guidance on what to do about it.
- **Manifest contract as toolkit interface.** The `.localground-seed-manifest.json` schema is the first formal data contract between toolkit prompts. Reap defines what it reads; Seed (Phase 9) will implement the writer. Contract rules (forward compatibility, graceful degradation, read-only access) are specified in both the prompt and the dev-status report.

The prompt is ready for unseeded-mode testing against Robert's migrated projects. Seeded-mode testing requires the Seed prompt (Phase 9) to be built first.
