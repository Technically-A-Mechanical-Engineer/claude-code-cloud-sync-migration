# Reap Prompt — Development Status
**Updated:** 2026-04-11
**Prompt file:** `localground-reap.md`
**Current version:** v1.0.0 (built, pending NEC evaluation)
**Project owner:** Robert LaSalle
**Development environment:** Claude Code CLI from `C:\Users\rlasalle\Projects\claude-code-cloud-sync-migration`

---

## What This Prompt Does

A single-file prompt that any Claude Code user can paste into CLI from a migrated project directory to verify project health after migration from cloud storage. Two operating modes: seeded (verifies planted markers survived the copy, then runs health checks) and unseeded (health checks only). Produces a `reap-report.md` artifact with traffic-light summary, per-check results, detailed findings, and a consolidated action list.

The prompt creates one temporary test file during the operations check (immediately deleted) and writes a single report file. It never modifies existing project files. In seeded mode with all checks passing, it offers to clean up seed markers with individual user confirmation.

This is one of five prompts in the LocalGround Toolkit. See also: `docs/dev-status/dev-status-migration.md`, `docs/dev-status/dev-status-cleanup.md`, `docs/dev-status/dev-status-verification.md`, and `docs/dev-status/dev-status-seed.md` (to be created in Phase 9).

---

## Version History

| Version | Date | Key Changes | Source |
|---|---|---|---|
| v1.0.0 | 2026-04-11 | Initial build. Five phases (environment detection, seed verification, health checks, report, marker cleanup). Two operating modes (seeded/unseeded) via manifest detection. Six health checks (git integrity, memory connection, stale references, file system, operations, cloud location gate). Seed verification with per-marker PASS/FAIL (test file SHA-256, git tag). Traffic-light report with consolidated action list. Three-way shell detection. Five-dimension constraint model. Platform-specific SHA-256 commands. Marker cleanup offer with individual confirmation. 628 lines. | Claude Code CLI — GSD Phase 7 execution |

---

## v1.0.0 Build Summary

**Built:** 2026-04-11
**Build method:** GSD Phase 7 — 1 plan, 9 tasks
**Size:** 628 lines

### Requirements Coverage

All 8 SOW-xx requirements from the v2.0.0 requirements addressed:

| Req | Description | Prompt Section |
|-----|-------------|----------------|
| SOW-01 | Detect seeded vs. unseeded mode via manifest file presence | Phase 1.5 — mode detection |
| SOW-02 | Verify seed markers (test file checksum, git tag) | Phase 2 — seed verification |
| SOW-03 | Six health checks (git, memory, stale refs, file system, operations, cloud location) | Phase 3 — health checks + Phase 1.3 cloud-location gate |
| SOW-04 | PASS/WARN/FAIL per check with clear criteria | Phase 3 scoring + Phase 4 results table |
| SOW-05 | Write `reap-report.md` artifact | Phase 4 — report generation |
| SOW-06 | Post-verification marker cleanup with individual confirmation | Phase 5 — marker cleanup offer |
| SOW-07 | Three-way shell detection (self-contained) | Phase 1.1 — shell and platform |
| SOW-08 | Five-dimension constraint model | Operating Constraints section |

### Manifest Contract

This prompt defines the `.localground-seed-manifest.json` schema that the Seed prompt (Phase 9) must write to. The schema is:

```json
{
  "version": "1.0",
  "toolkit_version": "2.0.0",
  "created": "ISO 8601 UTC timestamp",
  "project_path": "original path where seed was run",
  "project_name": "basename of project directory",
  "markers": {
    "test_file": {
      "type": "file",
      "path": ".localground-seed-test",
      "sha256": "hex string, lowercase",
      "size_bytes": integer,
      "content_description": "human-readable description"
    },
    "git_tag": {
      "type": "git_tag",
      "name": "localground/seed/<timestamp>",
      "commit": "full commit hash (40 chars, lowercase)",
      "tag_type": "lightweight"
    }
  }
}
```

Contract rules:
- Reap reads, Seed writes — Reap never modifies the manifest
- Unknown marker types are ignored (forward compatibility)
- Unrecognized `version` values produce WARN, not FAIL
- Malformed JSON produces FAIL for seed verification

---

## NEC Evaluation

**Status:** Complete — 2026-04-12
**Evaluation record:** `docs/evaluations/prompt-evaluation-reap.md`
**Result:** All eight NEC prompt frameworks passed. 0 findings identified during evaluation.

---

## Testing Plan

The reap prompt should be tested in two modes against Robert's actual migrated projects.

### Unseeded Mode Test

1. Launch Claude Code from a migrated project (e.g., `C:\Users\rlasalle\Projects\OB1`)
2. Paste `localground-reap.md`
3. Verify Phase 1 detects environment correctly, identifies unseeded mode (no manifest)
4. Verify Phase 3 runs all six health checks with correct platform commands
5. Verify Phase 4 generates `reap-report.md` with no seed section, correct footer note
6. Verify the prompt did not modify existing project files

### Seeded Mode Test

Requires the Seed prompt (Phase 9) to be built first:
1. Run `localground-seed.md` in a project before migration
2. Run migration
3. Launch Claude Code from the migrated project
4. Paste `localground-reap.md`
5. Verify Phase 1 detects seeded mode (manifest present)
6. Verify Phase 2 verifies each marker independently
7. Verify Phase 3 runs health checks
8. Verify Phase 4 generates report with seed section
9. Verify Phase 5 offers marker cleanup (if no FAIL results)
10. Test declining cleanup — verify manual cleanup commands appear

### Edge Case Tests

- Run from a cloud storage path — verify cloud-location gate stops execution
- Run with a malformed manifest — verify FAIL with clear error
- Run after marker cleanup (manifest present, markers gone) — verify FAIL per missing marker

---

## Next Steps

1. **NEC Evaluation** — Phase 8: evaluate against eight NEC prompt frameworks
2. **Unseeded Mode Test** — Can execute immediately against migrated projects
3. **Seeded Mode Test** — Requires Seed prompt (Phase 9) first
4. **Distribution** — Ship as part of v2.0.0 toolkit release (Phase 11)

---

## Design Principles (shared across toolkit)

- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps apply regardless of scope.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask the user.
- **One file, one paste.** Human-facing guide and Claude Code instructions in the same file, separated by a clear marker.
- **The five-dimension constraint model:** Must / Must-not / Prefer / Escalate / Recover.
- **Proportional output.** Scale generated artifacts to scope.
- **Not a skill.** One-shot playbook, not a recurring workflow. Distribution via file sharing.
