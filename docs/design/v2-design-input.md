# v2.0.0 Design Input

**Context:** This document captures the design direction for the next milestone of the LocalGround Toolkit, based on testing and design work done during the v1.2.0 milestone completion session (2026-04-11). Paste this into `/gsd-new-milestone` as context when starting the v2.0.0 milestone.

## What Exists Today (v1.2.0 — shipped)

Three independent prompts, each a single markdown file:

| Prompt | File | Version | Purpose |
|--------|------|---------|---------|
| Migration | `localground-migration.md` | v1.2.0 | Copies projects from cloud storage to local paths |
| Cleanup | `localground-cleanup.md` | v1.0.0 | Removes stale path-hash dirs, orphan entries, source folders |
| Verification | `localground-verification.md` | v1.0.0 | Read-only audit of environment health |

All three passed NEC evaluation and manual testing (see `docs/test-artifacts/` for test report and artifacts).

## v2 Vision: Five-Prompt Toolkit

Two new prompts added. All five remain independent markdown files — one file, one paste, no installation.

| Prompt | When to run | Status |
|--------|-------------|--------|
| **Seed** (new) | Before migration | Plants verifiable markers in each project at its cloud storage location |
| **Migration** (existing) | During migration | Copies projects to local paths. No changes needed unless findings from testing require fixes. |
| **Reap** (new) | After migration | Verifies seed markers survived the copy, then runs health checks on the migrated project |
| **Cleanup** (existing) | When ready to delete source folders | No changes needed unless findings from testing require fixes. |
| **Verification** (existing) | Anytime | No changes needed unless findings from testing require fixes. |

## Seed Prompt — Design Intent

**Purpose:** Run before migration in each project at its current cloud storage location. Plants known markers that the reap prompt can verify after migration.

**Marker types to consider:**
- A small test file with a known checksum (proves file content survived copy)
- A git tag (proves git history survived copy)
- A memory entry (proves Claude Code memory survived settings migration)
- A checksum manifest of key files (proves no silent corruption)

**Design constraints:**
- Must be lightweight — planting markers should take seconds per project, not minutes
- Markers must not interfere with normal project operation
- Markers must be unambiguous to verify (no "this looks right" — pass or fail)
- Must work across all three shell contexts (PowerShell, bash-on-Windows, native bash)

**Open question:** What's the right marker format? The reap prompt needs to know exactly what to look for. This is a cross-prompt data contract — seed writes, reap reads.

## Reap Prompt — Design Intent

**Purpose:** Run after migration in each project at its new local location. Two-part check:

1. **Seed verification** (if seeds were planted) — Did the markers survive the copy? Checksum match, git tag present, memory entry intact.
2. **Health checks** (always runs) — Git integrity, memory connection, stale references, file system, operations test.

**A working draft exists:** `docs/design/post-migration-health-check.md` is a v0.1 draft of the health check portion. It was tested against all migrated projects on 2026-04-11 — all passed. This draft becomes the foundation for the reap prompt's health check section.

**Two operating modes:**
- **With seeds:** Full fidelity check + health checks. High confidence. Can replace the soak-period recommendation for users willing to run both prompts.
- **Without seeds:** Health checks only. Still useful for anyone who migrated without planting seeds first, or who migrated before the seed prompt existed.

**Key design decisions from the health check draft:**
- Per-project scope (not environment-wide — that's what the verification prompt does)
- Nearly read-only (one temp file for operations test, immediately cleaned up, plus the report)
- PASS/WARN/FAIL scoring with clear criteria per check
- Actionable findings that reference other toolkit prompts by filename
- Five-dimension constraint model consistent with the rest of the toolkit

## Existing Prompt Fixes (from v1.2.0 testing)

Testing surfaced four findings against the existing prompts. These should be addressed in v2:

| ID | Prompt | Severity | Finding |
|----|--------|----------|---------|
| F-01 | Migration | Medium | Robocopy requires `MSYS_NO_PATHCONV=1` on bash-on-Windows — prompt should specify this upfront instead of letting Claude discover it by trial and error |
| F-02 | Migration | Low | Pre-flight step 2.4 should clarify that the current session stays open ("This session stays open — it's running the migration") |
| F-03 | Verification | Low | sed errors during Phase 3 path-hash decoding on bash-on-Windows — quoting issue, doesn't affect results but looks bad |
| F-04 | Migration | Informational | Parallel tool calls can cancel each other under manual approval mode — consider noting in human-readable section |

Full details in `docs/test-artifacts/2026-04-11-01-test-report.md`.

## v2 Requirements from v1 REQUIREMENTS.md

These were identified during v1 but deferred:

| ID | Requirement |
|----|-------------|
| MIG-V2-01 | Pre-copy file size verification in addition to file count (catches 0-byte placeholder stubs) |
| MIG-V2-02 | CONTRIBUTING.md for community contributors |
| CLN-V2-01 | Batch confirmation option in cleanup after consecutive clean deletions |
| CLN-V2-02 | Undo guidance — what to do if user deletes something they shouldn't have |
| VER-V2-01 | Scheduled re-verification (remind user to run periodically) |
| VER-V2-02 | Comparison mode — compare current report against a previous report |

## Reference Files

| File | What it contains |
|------|-----------------|
| `docs/design/post-migration-health-check.md` | v0.1 draft of the reap prompt's health check section (tested, working) |
| `docs/test-artifacts/2026-04-11-01-test-report.md` | Full test report with findings F-01 through F-04 |
| `docs/test-artifacts/2026-04-11-01-migration-session-1-results.md` | Migration test output (6 folders, all passed) |
| `docs/test-artifacts/2026-04-11-01-session-2-prompt.md` | Generated Session 2 prompt from migration test |
| `docs/design/2026-04-10-cloud storage-toolkit-design.md` | Original design spec (requirements source for v1) |
| `.planning/milestones/v1.2.0-REQUIREMENTS.md` | Archived v1 requirements with traceability |
| `.planning/RETROSPECTIVE.md` | v1.2.0 retrospective with lessons learned |

---
*Created: 2026-04-11 during v1.2.0 milestone completion session*
