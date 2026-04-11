# Verification Prompt — Development Status
**Updated:** 2026-04-11
**Prompt file:** `cloud-sync-verification.md`
**Current version:** v1.0.0 (shipped)
**Project owner:** Robert LaSalle
**Development environment:** Claude Code CLI from `C:\Users\rlasalle\Projects\claude-code-cloud-sync-migration`

---

## What This Prompt Does

A single-file prompt that any Claude Code user can paste into CLI to audit their project environment for health issues, stale artifacts, and outdated references left from cloud-synced storage. It auto-detects the environment, runs a five-phase read-only audit (project health, path-hash integrity, stale references), and generates a report mapping every finding to an actionable recommendation pointing to the appropriate toolkit prompt.

The prompt never modifies, deletes, or creates anything except the verification report. It is safe to run at any time — before migration, after migration, after cleanup, or on a fresh environment.

This is one of three prompts in the Cloud-Sync Toolkit. See also: `docs/dev-status/dev-status-migration.md` and `docs/dev-status/dev-status-cleanup.md`.

---

## Version History

| Version | Date | Key Changes | Source |
|---|---|---|---|
| v1.0.0 | 2026-04-11 | Initial build. Five phases (environment detection, project health audit, path-hash integrity audit, reference audit, report generation). Traffic light summary (green/yellow/red per audit area). Three-part finding pattern (finding, explanation, recommendation). Consolidated action list with 14 finding-to-recommendation mappings pointing to toolkit prompts by filename. Three-way shell detection. Read-only constraint (single permitted write: verification-report.md). Graceful cross-prompt state. Progress status for long-running scans. 658 lines. | Claude Code CLI — GSD Phase 3 execution |

---

## v1.0.0 Build Summary

**Built:** 2026-04-11
**Build method:** GSD Phase 3 — 3 plans across 2 waves
**Size:** 658 lines

### Build Sequence

| Wave | Plan | What it built |
|------|------|---------------|
| 1 | 03-01 | Prompt scaffold — human-readable section (manual audit checklist, report interpretation guide), Role, What to Expect, Operating Constraints (five-dimension model tuned for read-only), Definition of Done, Guardrails |
| 1 | 03-02 | Phases 1-4 (environment detection, project health audit, path-hash integrity audit, reference audit) |
| 2 | 03-03 | Phase 5 (report generation with traffic light summary, finding-to-recommendation mapping, consolidated action list) + consistency pass |

### Requirements Coverage

All 6 VER requirements from the design spec addressed:

| Req | Description | Phase |
|-----|-------------|-------|
| VER-01 | Project health audit (git fsck, git status, hidden dirs, file counts, symlinks) | Phase 2 |
| VER-02 | Path-hash integrity audit (decode, classify, check existence) | Phase 3 |
| VER-03 | Reference scan limited to CLAUDE.md, memory, settings (not .git or binaries) | Phase 4 |
| VER-04 | Each finding maps to actionable recommendation pointing to toolkit prompt | Phase 5 |
| VER-05 | Never modify, delete, or create anything except verification-report.md | Operating Constraints, Guardrails |
| VER-06 | Long-running scans provide progress status | Phase 4, Operating Constraints |

---

## v1.0.0 NEC Evaluation

Evaluated against eight NEC prompt frameworks. Result: **Pass on all eight frameworks, zero findings.**

This is the cleanest evaluation result in the toolkit — the verification prompt's read-only design eliminates entire categories of risk (no deletion authority, no confirmation gate complexity, no crash recovery state). The five-dimension constraint model's Recovery dimension is explicitly marked "Not applicable" with stated rationale, which the evaluation confirmed as the correct engineering decision.

| Framework | Verdict | Findings |
|---|---|---|
| Specification Engineer | Pass | 0 |
| Constraint Architecture | Pass | 0 |
| Self-Contained Problem Statement | Pass | 0 |
| First Agent Task | Pass | 0 |
| Footgun Detector | Pass | 0 |
| Loop Designer | Pass | 0 |
| Agent Architecture Audit | Pass | 0 |
| Agent-Readiness Audit | Pass | 0 |

Full evaluation in `docs/evaluations/prompt-evaluation-verification.md`.

---

## Testing Plan

The verification prompt should be tested against Robert's actual post-migration environment, which provides a realistic mix of local projects, path-hash entries (valid, potentially stale, potentially orphaned), and possible stale references.

### Test Setup

- **Launch point:** `C:\Users\rlasalle\Projects\Claude-Home` (or any local project directory)
- **Expected state:** Post-migration, post-cleanup environment with local projects under `C:\Users\rlasalle\Projects\`
- **Expected path-hash entries:** Mix of valid entries pointing to local paths, potentially stale entries pointing to OneDrive paths, and possibly orphan entries from deleted projects

### Test Sequence

1. Paste `cloud-sync-verification.md` into Claude Code CLI
2. Verify Phase 1 detects environment correctly (Windows, shell type, cloud services, project directories)
3. Verify Phase 2 runs health checks on all discovered project directories (git fsck, git status, hidden dirs, file counts, symlinks)
4. Verify Phase 3 decodes and classifies all path-hash entries under `~/.claude/projects/`
5. Verify Phase 4 scans CLAUDE.md, memory files, and settings files for cloud-synced path references with progress updates
6. Verify Phase 5 generates `verification-report.md` with traffic light summary, findings by audit area, and consolidated action list
7. Review the report — confirm findings are accurate, recommendations point to correct toolkit prompts, consolidated action list is deduplicated and prioritized
8. Verify the prompt did not modify, delete, or create anything other than `verification-report.md`

### Post-Cleanup Test

After running the cleanup prompt, re-run verification to confirm:
- Stale path-hash entries are gone (or reduced)
- Source folder references are updated
- The report correctly shows a cleaner state than the first run

### Fresh Environment Test

On a machine with no migration history, verify:
- Phase 1 discovers projects from default locations
- Phase 3 classifies all path-hash entries without migration artifacts
- The report handles a "never migrated" environment gracefully — no false alarms about missing migration artifacts

---

## Next Steps

1. **Test v1.0.0** — Execute testing plan above against Robert's environment. Not yet executed.
2. **Distribution** — Push to GitHub after testing passes. Tag `verification-v1.0.0` release.
3. **Future versions** — v1.1.0 candidates tracked in design spec v2 requirements (VER-V2-01: scheduled re-verification, VER-V2-02: comparison mode).

---

## Design Principles (shared across toolkit)

- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps apply regardless of scope.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask the user.
- **One file, one paste.** Human-facing guide and Claude Code instructions in the same file, separated by a clear marker.
- **The five-dimension constraint model:** Must / Must-not / Prefer / Escalate / Recover.
- **Proportional output.** Scale generated artifacts to scope.
- **Not a skill.** One-shot playbook, not a recurring workflow. Distribution via file sharing.
