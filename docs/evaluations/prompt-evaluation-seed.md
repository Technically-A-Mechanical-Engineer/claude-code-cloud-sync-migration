# Cloud-Sync Seed Prompt — v1.0.0 Evaluation
**Evaluated:** 2026-04-12
**Evaluator:** Claude (Claude Code peer review session)
**Document under review:** `cloud-sync-seed.md` (v1.0.0)

---

## Evaluation Frameworks

This evaluation applies eight prompting and agent architecture frameworks from Nate's Executive Circle content library and Anthropic prompting best practices. These are the same frameworks used to evaluate the migration prompt (v1.0.0 through v1.2.0), the cleanup prompt (v1.0.0), the verification prompt (v1.0.0), and the sow prompt (v1.0.0).

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

**Overall: v1.0.0 of the seed prompt passes all eight applicable frameworks. Ready for testing.**

---

## Prior Code Review Findings

Before this NEC evaluation, Plan 10-01 applied three code review fixes (one verified clean, two warnings resolved) identified during the Phase 9 build review. All three were resolved before evaluation:

| ID | Severity | Description | Resolution |
|---|---|---|---|
| CR-001 | Verification | Verify hardcoded SHA-256 checksum matches test file content | Verified — checksum `60b4d407c9746e8146a3cee6ac97a301dfd8a86d5e616c6edbf37af406cb0b03` confirmed correct for the specified 110-byte test file content |
| WR-001 | Warning | State matrix missing rows for partial markers without manifest | Resolved — three additional rows added to Phase 1.5 state matrix covering Missing/Exists/Missing, Missing/Missing/Exists, and Missing/Exists/Exists combinations |
| WR-002 | Warning | SEED-06 description in dev-status-seed.md incomplete | Resolved — description updated to include full idempotency behavior: "detects existing markers, exits cleanly if intact, restores only missing or changed markers" |

Two informational findings from the code review required no action:

| ID | Severity | Description | Status |
|---|---|---|---|
| IR-001 | Info | Test file content uses LF line endings across all platforms | No action needed — Claude Code's Write tool produces consistent LF endings, which is the intended behavior for cross-platform checksum consistency |
| IR-002 | Info | Manifest `created` field uses ISO 8601 colons while tag name uses hyphens | No action needed — by design. The tag name uses hyphens for Windows filesystem compatibility (git stores tag refs as files). The manifest timestamp uses standard ISO 8601 for JSON interoperability |

These fixes were committed before the NEC evaluation. The prompt evaluated here is the post-fix version.

---

## Detailed Evaluation

### 1. Specification Engineer

**Criteria:** Acceptance criteria verifiable by an independent observer. Constraint architecture with must/must-not/prefer/escalate. Task decomposition with inputs, outputs, and dependencies. Unambiguous Definition of Done.

**Verdict: Pass.**

- **Acceptance criteria are verifiable per-marker.** Phase 2.2 specifies exact SHA-256 checksum comparison (binary PASS/FAIL) with the expected value hardcoded. Phase 2.3 specifies `git tag -l` verification (returns tag name or empty). Phase 3.3 specifies manifest verification with five concrete checks (valid JSON, version field, SHA-256 match, 40-char commit hash, path match). All independently observable by any party.
- **Constraint architecture covers all five dimensions.** The Operating Constraints section specifies Must (5 constraints), Must-not (5 prohibitions), Prefer (4 preferences), Escalate (5 triggers), and Recover (2 recovery behaviors). Each constraint maps to a specific failure mode — see Framework 2 for detail.
- **Task decomposition is phase-ordered** (Phases 1-4) with sub-steps (1.1-1.6, 2.1-2.4, 3.1-3.3, 4.1-4.2). Phase dependencies are explicit: Phase 2 depends on Phase 1.5 idempotency state determination. Phase 3 depends on Phase 2 marker creation results. Phase 4 compiles results from Phases 2 and 3.
- **Definition of Done** lists six verifiable completion criteria. Each criterion maps to a concrete artifact or observable outcome — "Test file `.cloud-sync-seed-test` exists with verified SHA-256 checksum" and "`.cloud-sync-seed-manifest.json` exists with valid JSON recording all verified markers" are the primary deliverables.

---

### 2. Constraint Architecture

**Criteria:** Five-dimension coverage (Must / Must-not / Prefer / Escalate / Recover), each constraint tied to a specific failure mode it prevents.

**Verdict: Pass.**

The seed prompt is the fifth prompt in the toolkit and the simplest structurally — single session, four phases, additive-only operations. The constraint architecture reflects this simplicity while maintaining the same rigor as the other prompts. The safety model is unique in the toolkit: never modifies or deletes, only creates new files and tags.

| Dimension | Coverage | Key Constraints |
|---|---|---|
| **Must** | Use Write tool for file creation. Verify checksum immediately. Verify tag immediately. Write manifest only after verified markers. Include only verified markers in manifest. | Prevents: encoding inconsistency from shell-based writes; undetected checksum failure; orphaned tags; manifest recording unverified markers; downstream reap verification against bad data. |
| **Must-not** | Never modify/delete/rename existing files. Never overwrite test file without confirmation. Never create git tags if not a repo. Never use shell for file writes. Never compose test file at runtime. | Prevents: data corruption of existing project content; silent overwrite of prior seed; git errors in non-git directories; platform-specific encoding divergence; content drift from runtime composition. |
| **Prefer** | Auto-detect first. Report anomalies, don't investigate. Use Read tool for existence checks. Proportional output. | Guides: UX consistency; scope containment to marker planting; tool selection for reliability; output scaling for a quick operation. |
| **Escalate** | Cloud-synced storage notice (informational, not blocking). Not a git repo (skip git tag). Content mismatch on existing test file. Malformed manifest JSON. Write tool failure. | Prevents: user confusion about expected cloud location; git errors; silent overwrite of modified test file; JSON corruption propagation; silent fallback to unreliable shell writes. |
| **Recover** | Detect existing markers on re-run (idempotency). Handle partial state (restore missing markers only). | Prevents: duplicate marker creation; incomplete state persisting across re-runs. |

The five dimensions are each tied to specific failure modes. The Must-not dimension is calibrated for an additive-only prompt — focused on preventing modification of existing content and ensuring Write tool consistency rather than controlling deletion authority (which the cleanup and sow prompts manage).

---

### 3. Self-Contained Problem Statement

**Criteria:** Could an executor with zero prior context produce the correct output from this prompt alone?

**Verdict: Pass.**

- **Three-way shell detection is self-contained** (Phase 1.1). Detection table with specific methods (`$PSVersionTable`, `$OSTYPE`, `uname -s`) and maps each to a shell context with platform-specific utility commands for SHA-256 verification and timestamp generation.
- **Cloud service detection patterns are self-contained** (Phase 1.3). The same four-service pattern list used across all toolkit prompts is duplicated here with platform-specific path patterns for OneDrive, Dropbox, Google Drive, and iCloud.
- **Test file content is hardcoded** (Phase 2.1). The exact three-line content is specified inline with encoding requirements (UTF-8, no BOM, LF line endings). The expected SHA-256 checksum and file size are hardcoded. No external reference or runtime computation needed.
- **Platform-specific verification commands are specified** (Phase 2.2). PowerShell (`Get-FileHash`), bash-Linux (`sha256sum`), and bash-macOS (`shasum -a 256`) variants all present with exact command syntax.
- **Git tag naming convention is fully specified** (Phase 2.3). Timestamp format with platform-specific commands, namespace (`cloud-sync-toolkit/seed/`), and the rationale for using hyphens instead of colons (Windows filesystem compatibility).
- **Manifest schema is defined by example** (Phase 3.1). Exact JSON structure with field names, types, and handling rules. The 40-character commit hash requirement and non-git-repo omission rule are both specified inline.
- **The Role section establishes a distinct identity** (line 28). The seed assistant "plants verifiable markers" and "generates a manifest" — it does not migrate, clean up, verify, or diagnose.

---

### 4. First Agent Task

**Criteria:** Task summary (goal, not steps), success criteria (observable outcomes), context for the agent, verification commands that prove success.

**Verdict: Pass.**

- **Task summary:** Opening paragraph — "plants verifiable markers — a test file with a known checksum and a lightweight git tag — so you can confirm after migration that file content and git history survived the copy intact." The goal (enable post-migration verification) is stated before the methodology (test file + git tag).
- **Success criteria:** Definition of Done lists six criteria. The primary deliverables (test file with verified checksum, git tag pointing to verified commit, manifest with valid JSON) each have concrete, binary verification conditions.
- **Context for the agent:** Auto-detected environment (OS, shell, project identity, git status, cloud-storage status, existing marker state). The environment summary (Phase 1.6) is presented before any marker creation. No user-provided context required.
- **Verification commands:** Platform-specific commands for every verification step — `Get-FileHash`/`sha256sum`/`shasum` for checksum, `git tag -l` for tag existence, `git rev-parse` for commit hash, Claude Code Read tool for manifest validation. Three shell variants for all checksum commands.

---

### 5. Footgun Detector

**Criteria:** Six footgun patterns — vague success criteria, missing design phase, scope creep risk, abstraction bloat, no checkpoint strategy, wrong tool for the job.

**Verdict: Pass.**

| Pattern | Status | Notes |
|---|---|---|
| Vague success criteria | Clear | Per-marker verification with exact SHA-256 checksum match (hardcoded expected value). Git tag verified by `git tag -l` returning the exact tag name. Manifest verified by JSON parse + five field validations. Every marker has a binary PASS/FAIL condition. |
| Missing design phase | Designed | The prompt is a complete specification for a four-phase marker planting operation. Every marker type, every verification command, every idempotency state, and every error path is fully specified. No "figure it out" delegation. |
| Scope creep risk | Bounded | Must-not: "Never modify, delete, or rename any existing project file." The only filesystem writes are explicitly enumerated: `.cloud-sync-seed-test`, `.cloud-sync-seed-manifest.json`, and one git tag. The Guardrails section repeats this boundary. |
| Abstraction bloat | Constrained | Commands are concrete platform-specific invocations. The idempotency state matrix (Phase 1.5) is the most complex element — an 11-row lookup table mapping state combinations to specific actions. Direct lookup, not a state machine. |
| No checkpoint strategy | Not needed | Quick operation (under 2 minutes), additive only. If interrupted, re-run from scratch — the idempotency matrix handles all partial-state combinations gracefully. No progress to lose. Correctly identified as not applicable. |
| Wrong tool | Good fit | Claude Code CLI can write files (Write tool for cross-platform encoding consistency), execute verification commands, create git tags, and parse JSON. The mandate to use Write tool instead of shell for file creation is the correct tool selection — it ensures consistent LF line endings and UTF-8 encoding across all platforms, which is essential for deterministic checksum verification. |

The most relevant footgun for a marker-planting prompt — **creating markers that cannot be reliably verified after migration** — is addressed by the hardcoded checksum approach. The test file content is static, the expected checksum is embedded in the prompt, and the verification uses platform-native SHA-256 tools. No runtime composition means no checksum drift.

---

### 6. Loop Designer

**Criteria:** Iteration cycle, success criteria at each stage, checkpoint/commit strategy, stuck detection, stuck protocol.

**Verdict: Pass.**

- **Iteration cycle:** Phase 2 iterates per-marker: create test file (2.1), verify checksum (2.2), create git tag (2.3), compile results (2.4). Each marker is independently created and verified before proceeding to the next. Phase 3 is a single manifest write (3.2) followed by read-back verification (3.3).
- **Success criteria per iteration:** Phase 2.2 — SHA-256 match (case-insensitive) against hardcoded expected value `60b4d407c9746e8146a3cee6ac97a301dfd8a86d5e616c6edbf37af406cb0b03`. Phase 2.3 — `git tag -l` returns the exact tag name (non-empty). Phase 3.3 — valid JSON, version is "1.0", SHA-256 matches, commit is 40-char hex, path matches CWD.
- **Checkpoint:** Not needed — quick, additive-only operation under 2 minutes. Re-runnable from scratch. The idempotency matrix (Phase 1.5) is the recovery mechanism. Correctly identified as not applicable.
- **Stuck detection:** Checksum mismatch immediately stops execution (Phase 2.2). Tag creation failure (empty `git tag -l` result) is reported as an error. Write tool failure triggers the escalation constraint. Manifest verification reports the specific discrepancy.
- **Stuck protocol:** On checksum mismatch — stop, report both expected and actual checksums, note that "this likely means Write tool behavior has changed." On tag creation failure — report error, do not proceed. On Write tool failure — stop and report, explicitly do not fall back to shell-based writes. On manifest verification failure — report the specific discrepancy. All error paths produce actionable diagnostic output.

The **idempotency matrix as implicit loop handling** is a design pattern that replaces explicit loop/retry logic. Instead of "retry until success," the seed prompt detects existing state and routes to the correct action (skip, restore, escalate). This is the correct pattern for a short, additive-only operation where re-running from scratch is trivially cheap.

---

### 7. Agent Architecture Audit — Day One Primitives

**Criteria:** Evaluated against the 12 production infrastructure primitives from the Claude Code architecture analysis. Only primitives applicable to a single-session, additive-only CLI prompt are assessed.

| Primitive | Status | Notes |
|---|---|---|
| Permission System with Trust Tiers | Present | Two tiers: (1) read-only environment detection (Phase 1), (2) additive file creation via Write tool (Phases 2-3). No confirmation gate before Phase 2 — correctly calibrated for an additive-only, low-risk operation. The Must-not constraint on existing file modification defines the permission boundary. Escalation to user required only for content-mismatch overwrite (Phase 1.5 idempotency). |
| Session Persistence That Survives Crashes | Not applicable | Quick operation under 2 minutes. If interrupted, re-run from scratch. The idempotency matrix provides the recovery mechanism — no crash-recovery log needed. Same rationale as the verification prompt evaluation. |
| Workflow State and Idempotency | Present | The eight-state idempotency matrix (Phase 1.5) is the most comprehensive idempotency implementation in the toolkit — 11 rows covering all combinations of manifest state (missing, present+valid, present+malformed), test file state (missing, matching, mismatching), and git tag state (missing, matching, wrong commit). Each combination maps to a specific action. Re-running on an already-seeded project produces the same "already seeded" exit. |
| Structured Streaming Events | Present | Per-marker creation results with typed fields (path, SHA-256, size for test file; tag name, commit hash, type for git tag). Environment summary (Phase 1.6) with structured field display. Phase 4 summary with per-marker status and next-steps guidance. |
| System Event Logging | Present | `.cloud-sync-seed-manifest.json` serves as both the output artifact and the permanent audit trail. Records what was planted (marker types and verification data), when (ISO 8601 timestamp), where (project path), and with what integrity evidence (SHA-256 checksum, commit hash). This manifest is consumed by the reap prompt as the verification baseline. |
| Basic Verification Harness | Present | Phase 2 IS a verification harness — create test file via Write tool, immediately verify via platform-native SHA-256, stop on mismatch. Create git tag, immediately verify via `git tag -l`, stop if empty. Read manifest back, verify JSON structure and field values. Cryptographic verification (SHA-256) provides mathematical proof of file integrity — the strongest verification in the toolkit. |

**The seed prompt as a trust-establishment primitive:** This prompt fills a unique role in the toolkit — it plants the markers that the reap prompt later verifies. The seed-and-reap pair provides the only cryptographic proof of copy fidelity in the toolkit. Without seed markers, the reap prompt runs in unseeded mode and relies on heuristic health checks rather than mathematical verification. The seed prompt is the trust-establishment side of this pair.

**Not applicable to this prompt type:** Token budget tracking, tool registry, transcript compaction, tool pool assembly, permission audit trail (no permission decisions to audit — all operations are pre-defined additive writes with a single escalation point for content-mismatch overwrite).

---

### 8. Agent-Readiness Audit — Toolkit Context

**Criteria:** Whether the prompt functions correctly as a standalone tool and in the context of the five-prompt toolkit.

| Criterion | Status | Notes |
|---|---|---|
| Standalone viability | Pass | All detection logic (shell, cloud service, git status) is self-contained. No dependency on any other toolkit prompt at runtime. The seed prompt can be run independently on any Claude Code project — it needs only the project directory and Claude Code CLI. |
| Toolkit integration | Pass | The manifest (`.cloud-sync-seed-manifest.json`) is the formal data contract between seed and reap. Phase 4.2 next-steps reference `cloud-sync-migration.md` and `cloud-sync-reap.md` by filename. The manifest schema matches the contract defined in `dev-status-sow.md`. Cross-references are by filename only — no runtime dependency on sibling prompts. |
| Cross-prompt state handling | Pass | The idempotency matrix handles all cross-prompt state: markers present without manifest (anomaly — possible manual creation or manifest deletion), manifest with mismatched markers (content changed or history changed), corrupt manifest (regeneration offered). Phase 4.2 guides the user to the migration prompt next, establishing the toolkit workflow sequence: seed, then migrate, then reap. |
| Human-facing section completeness | Pass | Lines 1-21 provide: what the prompt does, compatibility note, minimal footprint statement, when to run (with toolkit sequence context), and what to expect (5-step summary with time estimate). A user understands the operation's scope and safety model before pasting. |
| Manifest contract as interface | Pass | The manifest schema is defined inline (Phase 3.1) with exact field names, types, and handling rules. Seed is the writer side; reap is the reader side. The 40-character commit hash requirement is explicit (not the 7-character short hash). The non-git-repo omission rule for `git_tag` is specified. The contract is consistent with the schema documented in `dev-status-sow.md`. |

**Design spec compliance check:**

| Design Spec Requirement | Implementation |
|---|---|
| Plant test file with known SHA-256 checksum | Phase 2.1 + 2.2 — hardcoded content and expected checksum |
| Create lightweight git tag | Phase 2.3 — namespaced tag with timestamp |
| Generate JSON manifest recording all markers | Phase 3 — schema-compliant manifest with verified data only |
| Three-way shell detection | Phase 1.1 — PowerShell, bash-on-Windows, native bash/zsh |
| Five-dimension constraint model | Operating Constraints section — Must/Must-not/Prefer/Escalate/Recover |
| Idempotent re-run handling | Phase 1.5 — 11-row state matrix covering all marker/manifest combinations |
| Never modify existing project files | Must-not constraints + Guardrails — additive-only safety model |
| Non-git-repo support | Phase 1.4 skip + Phase 2.3 skip + manifest git_tag omission |
| Cloud-location notice (informational) | Phase 1.3 — informational message, not a gate |

---

## Conclusion

The seed prompt v1.0.0 passes all eight evaluation frameworks with no findings. It is the fifth prompt in the toolkit, the simplest structurally (single session, four phases, under 2 minutes), and the only prompt with a purely additive safety model — it never modifies or deletes existing content.

Key architectural strengths:

- **Deterministic verification through hardcoded content.** The test file content and expected SHA-256 checksum are both embedded in the prompt. No runtime composition, no content drift, no platform-dependent output. The Write tool guarantee (consistent UTF-8, LF endings) makes the checksum deterministic across all platforms. This is the foundation for reliable post-migration verification.
- **Comprehensive idempotency via state matrix.** The 11-row state matrix in Phase 1.5 covers every combination of manifest, test file, and git tag state — including anomalies (markers without manifest), partial damage (some markers missing), content mismatch (test file modified), history change (tag points to different commit), and corruption (malformed JSON). Each combination maps to a specific, documented action. This is the most thorough idempotency implementation in the toolkit.
- **Additive-only safety model.** The prompt creates exactly three artifacts (test file, manifest, git tag) and modifies nothing. The Must-not constraints explicitly prohibit modification, deletion, and renaming of existing files. No confirmation gate is needed before Phase 2 because the operation carries no destructive risk — correctly calibrated permission model.
- **Manifest as formal data contract.** The `.cloud-sync-seed-manifest.json` schema defines the Seed-to-Reap interface. Seed writes verified data; Reap reads and verifies against current state. The 40-character commit hash requirement, non-git-repo omission rule, and JSON structure are all specified in both the prompt and the dev-status documentation. This is the first inter-prompt data contract in the toolkit, established by the sow prompt design and implemented here.
- **Write tool mandate for cross-platform consistency.** The requirement to use Claude Code's Write tool (not shell commands) for file creation ensures consistent encoding and line endings across PowerShell, bash-on-Windows, and native bash/zsh. This design decision is critical — without it, the hardcoded checksum would fail on platforms with different default encodings or line-ending conventions.

The prompt is ready for testing: fresh seed test, idempotency test, non-git-repo test, and end-to-end test with migration and reap.
