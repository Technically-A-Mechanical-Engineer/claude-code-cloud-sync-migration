# Cleanup Prompt — Development Status
**Updated:** 2026-04-11
**Prompt file:** `cloud-sync-cleanup.md`
**Current version:** v1.0.0 (built, NEC evaluation passed)
**Project owner:** Robert LaSalle
**Development environment:** Claude Code CLI from `C:\Users\rlasalle\Projects\claude-code-cloud-sync-migration`

---

## What This Prompt Does

A single-file prompt that any Claude Code user can paste into CLI to safely remove stale artifacts left behind after migrating projects from cloud-synced storage. It handles three categories of cleanup in risk-ascending order: stale path-hash directories (lowest risk), orphan/undecodable path-hash directories (medium risk), and source folders on cloud storage (highest risk). Every deletion requires individual user confirmation with verification evidence shown first.

Works in two modes: post-migration mode (reads migration artifacts for high-confidence cleanup) or standalone mode (auto-detects everything independently). Both modes follow the same safety methodology.

This is one of three prompts in the Cloud-Sync Toolkit. See also: `docs/dev-status/dev-status-migration.md`, and (after Phase 3) `docs/dev-status/dev-status-verification.md`.

---

## Version History

| Version | Date | Key Changes | Source |
|---|---|---|---|
| v1.0.0 | 2026-04-11 | Initial build. Five phases (environment detection, stale path-hash deletion, orphan/undecodable deletion, source folder deletion, report). Dual-mode detection. Self-contained path-hash decoding. Three-way shell detection. Verification-forward deletion dialogs. Soak-period check. Cloud-propagation warning on every Phase 4 dialog. Incomplete copy gate. Incremental cleanup log. Manual cleanup checklist. 946 lines. | Claude Code CLI — GSD Phase 2 execution |

---

## v1.0.0 Build Summary

**Built:** 2026-04-10/11
**Build method:** GSD Phase 2 — 4 plans across 3 waves
**Size:** 946 lines

### Build Sequence

| Wave | Plan | What it built |
|------|------|---------------|
| 1 | 02-01 | Prompt scaffold — human-readable section, Role, What to Expect, Operating Constraints (five-dimension model with deletion authority), Definition of Done, Guardrails |
| 2 | 02-02 | Phase 1 (environment detection, dual-mode, path-hash inventory), Phase 2 (stale deletion), Phase 3 (orphan/undecodable deletion) |
| 2 | 02-03 | Phase 4 (source folder deletion with full verification, cloud-propagation warning, soak-period check) |
| 3 | 02-04 | Phase 5 (report and summary) + full consistency pass |

Wave 2 ran sequentially (Plans 02-02 and 02-03 both modify `cloud-sync-cleanup.md`).

### Requirements Coverage

All 9 CLN requirements from the design spec addressed:

| Req | Description | Phase |
|-----|-------------|-------|
| CLN-01 | Dual-mode detection (post-migration / standalone) | Phase 1.3 |
| CLN-02 | Stale path-hash directories with individual confirmation | Phase 2 |
| CLN-03 | Orphan/undecodable path-hash directories with individual confirmation | Phase 3 |
| CLN-04 | Local copy verification before source folder deletion | Phase 4.3/4.4 |
| CLN-05 | Cloud-propagation warning on every Phase 4 dialog | Phase 4.5 |
| CLN-06 | Soak-period check before source folder deletion | Phase 4.2 |
| CLN-07 | Verification results shown in confirmation dialogs | Phases 2.2, 3.2/3.3, 4.5 |
| CLN-08 | Incremental cleanup log for crash recovery | Phases 2.4, 3.5, 4.7 |
| CLN-09 | Human-readable manual cleanup checklist | Above separator |

---

## v1.0.0 NEC Evaluation

Evaluated against eight NEC prompt frameworks. Result: **Pass on all applicable frameworks** (7 pass, 1 N/A — Agent-Readiness Audit not applicable to single-session prompt).

Four minor findings identified during evaluation, all resolved before final verdict:

| Finding | Severity | Resolution | Commit |
|---------|----------|------------|--------|
| `stat` syntax inconsistency across platforms | Minor | Added platform-specific notes for macOS (`stat -f`), Linux (`stat -c`), bash-on-Windows | `75f0bdd` |
| Phase 4.6 retry/skip dialog had no retry limit | Minor | Added 3-retry cap with mandatory skip recommendation | `75f0bdd` |
| Standalone mode couldn't find manually-migrated folders | Minor | Added manual path addition note in Phase 4.1 | `ee3246a` |
| Manual checklist missing soak-period recommendation | Minor | Added prominent blockquote callout in Section 3 | `ee3246a` |

**Observation (not a finding):** At 946 lines, cleanup prompt is 75% larger than migration (540 lines). Growth is from three-way platform command blocks for destructive operations. Right trade-off per design principles. Monitor CLI paste behavior.

Full evaluation in `docs/evaluations/prompt-evaluation-cleanup.md`.

---

## Testing Plan

The cleanup prompt should be tested against Robert's actual post-migration environment, which has stale path-hash directories and source folders still present from the April 9-10, 2026 migration.

### Test Setup

- **Launch point:** `C:\Users\rlasalle\Projects\Claude-Home` (the local path)
- **Mode:** Post-migration (migration artifacts exist at the launch point)
- **Expected stale entries:** Path-hash directories under `~/.claude/projects/` pointing to OneDrive paths with local equivalents
- **Expected source folders:** Original project folders still on `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\`

### Test Sequence

1. Paste `cloud-sync-cleanup.md` into Claude Code CLI
2. Verify Phase 1 detects post-migration mode (finds migration artifacts)
3. Verify Phase 1 classifies path-hash entries correctly (stale, orphan, valid, undecodable)
4. Phase 2: confirm or skip a few stale path-hash deletions, verify logging
5. Phase 3: confirm or skip orphan entries, verify fuzzy-match guesses for undecodable entries
6. Phase 4: verify soak-period check (should pass — migration was April 9-10), verify full four-point verification on at least one source folder, confirm or defer
7. Phase 5: verify cleanup log is complete and summary is accurate
8. Re-run to test crash recovery: verify the prompt reads the prior log and resumes correctly

### Standalone Mode Test

Separately, test standalone mode by launching from a directory with no migration artifacts. Verify:
- Phase 1 selects standalone mode
- Classification relies on filesystem checks only
- Conservative classification for uncertain entries

---

## Next Steps

1. **Test v1.0.0** — Execute testing plan above against Robert's environment
2. **Distribution** — Push to GitHub after testing passes. Tag `cleanup-v1.0.0` release.
3. **Future versions** — v1.1.0 candidates tracked in design spec v2 requirements (CLN-V2-01: batch confirmation, CLN-V2-02: undo guidance)

---

## Design Principles (shared across toolkit)

- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps, confirmation gates apply regardless of scope.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask the user.
- **One file, one paste.** Human-facing guide and Claude Code instructions in the same file, separated by a clear marker.
- **The five-dimension constraint model:** Must / Must-not / Prefer / Escalate / Recover.
- **Proportional output.** Scale generated artifacts to scope.
- **Not a skill.** One-shot playbook, not a recurring workflow. Distribution via file sharing.
