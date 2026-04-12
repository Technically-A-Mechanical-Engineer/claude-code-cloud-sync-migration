# Seed Prompt — Development Status
**Updated:** 2026-04-12
**Prompt file:** `cloud-sync-seed.md`
**Current version:** v1.0.0 (built, pending NEC evaluation)
**Project owner:** Robert LaSalle
**Development environment:** Claude Code CLI from `C:\Users\rlasalle\Projects\claude-code-cloud-sync-migration`

---

## What This Prompt Does

A single-file prompt that any Claude Code user can paste into CLI before migrating a project off cloud-synced storage. It plants verifiable markers — a test file with a known SHA-256 checksum and a lightweight git tag — then generates a JSON manifest (`.cloud-sync-seed-manifest.json`) recording all planted markers. The manifest is the data contract between seed and the reap prompt: after migration, `cloud-sync-reap.md` reads the manifest and verifies that markers survived the copy intact.

Runs in a single session, under 2 minutes. Four phases: environment detection, marker planting, manifest generation, summary. Never modifies or deletes existing project files. Idempotent — detects existing markers and handles re-runs gracefully via an eight-state matrix.

This is one of five prompts in the Cloud-Sync Toolkit. See also: `docs/dev-status/dev-status-migration.md`, `docs/dev-status/dev-status-cleanup.md`, `docs/dev-status/dev-status-verification.md`, and `docs/dev-status/dev-status-sow.md`.

---

## Version History

| Version | Date | Key Changes | Source |
|---|---|---|---|
| v1.0.0 | 2026-04-12 | Initial build. Four phases (environment detection, marker planting, manifest generation, summary). Idempotent — detects existing markers via eight-state matrix. Test file with hardcoded SHA-256 (`60b4d407c9746e8146a3cee6ac97a301dfd8a86d5e616c6edbf37af406cb0b03`). Lightweight git tag in `cloud-sync-toolkit/seed/<timestamp>` namespace. JSON manifest per sow contract. Three-way shell detection. Five-dimension constraint model. Non-git-repo support (test file only). Cloud-location notice (informational, not blocking). 394 lines. | Claude Code CLI — GSD Phase 9 execution |

---

## v1.0.0 Build Summary

**Built:** 2026-04-12
**Build method:** GSD Phase 9 — 1 plan, 9 tasks
**Size:** 394 lines

### Requirements Coverage

All 7 SEED requirements from the v2.0.0 requirements addressed:

| Req | Description | Prompt Section |
|-----|-------------|----------------|
| SEED-01 | Plant test file with known SHA-256 checksum | Phase 2.1 + 2.2 — test file creation and verification |
| SEED-02 | Create lightweight git tag | Phase 2.3 — git tag creation |
| SEED-03 | Generate JSON manifest recording all markers | Phase 3 — manifest generation |
| SEED-04 | Three-way shell detection | Phase 1.1 — shell and platform |
| SEED-05 | Five-dimension constraint model | Operating Constraints section |
| SEED-06 | Idempotent — detects existing markers, exits cleanly if intact, restores only missing or changed markers | Phase 1.5 — existing marker detection + state matrix |
| SEED-07 | Does not modify existing project files | Operating Constraints: Must-not |

### Marker Contract

The seed prompt writes the `.cloud-sync-seed-manifest.json` per the schema defined in `docs/dev-status/dev-status-sow.md` §Manifest Contract. Seed is the writer side of the contract; the reap prompt is the reader side. The manifest schema, field types, and contract rules are maintained in the sow dev-status file as the single source of truth.

---

## NEC Evaluation

**Status:** Pending — Phase 10

---

## Testing Plan

The seed prompt should be tested in multiple scenarios to verify marker planting, idempotency, and cross-prompt integration.

### Fresh Seed Test

1. Launch Claude Code from a project directory (preferably one that will be migrated)
2. Paste `cloud-sync-seed.md`
3. Verify Phase 1 detects environment correctly
4. Verify Phase 2 creates test file with matching checksum
5. Verify Phase 2 creates git tag (if git repo)
6. Verify Phase 3 generates manifest with correct structure
7. Verify `.cloud-sync-seed-test` has the expected checksum
8. Verify `.cloud-sync-seed-manifest.json` is valid JSON matching the contract

### Idempotency Test

1. Re-run seed in the same project (markers already present)
2. Verify detection of existing markers in Phase 1.5
3. Verify "already seeded" exit (no duplicate markers created)

### Non-Git-Repo Test

1. Create a temporary directory (not a git repo)
2. Run seed from that directory
3. Verify git tag is skipped with informational message
4. Verify manifest has no `git_tag` marker
5. Verify test file marker was still planted successfully

### End-to-End Test (with reap)

1. Run `cloud-sync-seed.md` in a project before migration
2. Run `cloud-sync-migration.md` to migrate the project
3. Run `cloud-sync-reap.md` from the migrated project
4. Verify reap reads the manifest and reports PASS for all markers

---

## Next Steps

1. **NEC Evaluation** — Phase 10: evaluate against eight NEC prompt frameworks
2. **Fresh Seed Test** — can execute immediately
3. **End-to-End Test** — requires migration and reap run
4. **Distribution** — ship as part of v2.0.0 toolkit release (Phase 11)

---

## Design Principles (shared across toolkit)

- **The methodology is non-negotiable.** Phased approach, constraint architecture, verification steps apply regardless of scope.
- **Auto-detect first, ask second.** If something can be determined from the filesystem, don't ask the user.
- **One file, one paste.** Human-facing guide and Claude Code instructions in the same file, separated by a clear marker.
- **The five-dimension constraint model:** Must / Must-not / Prefer / Escalate / Recover.
- **Proportional output.** Scale generated artifacts to scope.
- **Not a skill.** One-shot playbook, not a recurring workflow. Distribution via file sharing.
