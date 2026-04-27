# Roadmap: LocalGround Toolkit

## Milestones

- ✅ **v1.2.0 Cloud-Sync Toolkit** -- Phases 1-4 (shipped 2026-04-11) -- [archive](milestones/v1.2.0-ROADMAP.md)
- ✅ **v2.0.0 Five-Prompt Toolkit with Unified Versioning** -- Phases 5-11 (shipped 2026-04-12) -- [archive](milestones/v2.0.0-ROADMAP.md)
- ✅ **v3.0.0 MCP Server + CLI Tooling** -- Phases 12-15 (shipped 2026-04-26) -- [archive](milestones/v3.0.0-ROADMAP.md)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)
- 999.x: Backlog parking lot (unsequenced — see Backlog section)

No active phases. Next milestone planning starts with `/gsd-new-milestone`.

## Phases (v1.2.0 -- Completed)

<details>
<summary>v1.2.0 Cloud-Sync Toolkit (Phases 1-4) -- SHIPPED 2026-04-11</summary>

- [x] Phase 1: Migration v1.2.0 (2/2 plans) -- completed 2026-04-10
- [x] Phase 2: Cleanup v1.0.0 (4/4 plans) -- completed 2026-04-10
- [x] Phase 3: Verification v1.0.0 (3/3 plans) -- completed 2026-04-11
- [x] Phase 4: Documentation Updates (4/4 plans) -- completed 2026-04-11

</details>

## Phases (v2.0.0 -- Completed)

<details>
<summary>v2.0.0 Five-Prompt Toolkit (Phases 5-11) -- SHIPPED 2026-04-12</summary>

- [x] Phase 5: Housekeeping -- File Rename and Docs Restructuring (3/3 plans) -- completed 2026-04-11
- [x] Phase 6: Existing Prompt Fixes (4/4 plans) -- completed 2026-04-11
- [x] Phase 7: Sow Prompt Build (1/1 plans) -- completed 2026-04-11
- [x] Phase 8: Sow NEC Evaluation (2/2 plans) -- completed 2026-04-12
- [x] Phase 9: Seed Prompt Build (1/1 plans) -- completed 2026-04-12
- [x] Phase 10: Seed NEC Evaluation (2/2 plans) -- completed 2026-04-12
- [x] Phase 11: Documentation, Unified Versioning, and Sow-to-Reap Rename (3/3 plans) -- completed 2026-04-12

</details>

## Phases (v3.0.0 -- Completed)

<details>
<summary>v3.0.0 MCP Server + CLI Tooling (Phases 12-15) -- SHIPPED 2026-04-26</summary>

- [x] Phase 12: Monorepo Foundation and Core Library (7/7 plans) -- completed 2026-04-13
- [x] Phase 13: MCP Server (6/6 plans) -- completed 2026-04-13
- [x] Phase 14: Standalone CLI and Claude Code Skills (11/11 plans) -- completed 2026-04-26
- [x] Phase 15: Testing, CI, Publishing, and Documentation (6/6 plans) -- completed 2026-04-26

Full archive: [milestones/v3.0.0-ROADMAP.md](milestones/v3.0.0-ROADMAP.md)

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Migration v1.2.0 | v1.2.0 | 2/2 | Complete | 2026-04-10 |
| 2. Cleanup v1.0.0 | v1.2.0 | 4/4 | Complete | 2026-04-10 |
| 3. Verification v1.0.0 | v1.2.0 | 3/3 | Complete | 2026-04-11 |
| 4. Documentation Updates | v1.2.0 | 4/4 | Complete | 2026-04-11 |
| 5. Housekeeping | v2.0.0 | 3/3 | Complete | 2026-04-11 |
| 6. Existing Prompt Fixes | v2.0.0 | 4/4 | Complete | 2026-04-11 |
| 7. Sow Prompt Build | v2.0.0 | 1/1 | Complete | 2026-04-11 |
| 8. Sow NEC Evaluation | v2.0.0 | 2/2 | Complete | 2026-04-12 |
| 9. Seed Prompt Build | v2.0.0 | 1/1 | Complete | 2026-04-12 |
| 10. Seed NEC Evaluation | v2.0.0 | 2/2 | Complete | 2026-04-12 |
| 11. Documentation, Unified Versioning, and Sow-to-Reap Rename | v2.0.0 | 3/3 | Complete | 2026-04-12 |
| 12. Monorepo Foundation and Core Library | v3.0.0 | 7/7 | Complete | 2026-04-13 |
| 13. MCP Server | v3.0.0 | 6/6 | Complete | 2026-04-13 |
| 14. Standalone CLI and Claude Code Skills | v3.0.0 | 11/11 | Complete | 2026-04-26 |
| 15. Testing, CI, Publishing, and Documentation | v3.0.0 | 6/6 | Complete | 2026-04-26 |

## Backlog

Unsequenced items captured at v3.0.0 close. Promote with `/gsd-review-backlog` when ready.

### Phase 999.1: UAT Tests 12-16 — localground skills end-to-end MCP routing (BACKLOG)

**Goal:** Register the published `@localground/mcp` server with Claude Code and execute the 5 skill UAT tests that were blocked in Phase 14 and never executed in Phase 15. Test 15 (`/localground:migrate` two-session orchestration) is critical — it is the only test that validates the continuation-token loop and `localground-migrate-state.json` handoff, neither of which are exercised by the CLI smoke tests.
**Source:** `.planning/phases/14-standalone-cli-and-claude-code-skills/14-UAT.md` Tests 12-16 (all `result: blocked` with `blocked_by: requires-mcp-server-registered`)
**Requirements:** SKILL-01..SKILL-07 runtime verification (static compliance verified, runtime not)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: Pipeline first-run validation — ci.yml + release.yml end-to-end (BACKLOG)

**Goal:** Both GitHub Actions workflows are structurally verified but unexecuted end-to-end. First push to `master` triggers `ci.yml` (3-OS matrix, Node 20.x). First `vN.N.N` tag push triggers `release.yml` (OIDC trusted publisher + provenance). If trusted-publisher trust contract doesn't match exactly, the publish step will fail with `403 Forbidden` and need adjustment.
**Source:** `.planning/phases/15-testing-ci-publishing-and-documentation/15-VERIFICATION.md` "Two pipelines structurally verified but unexecuted end-to-end" section
**Requirements:** INFRA-04, INFRA-05 runtime verification (structural verification complete)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.3: Test infrastructure cleanup (BACKLOG)

**Goal:** Restore tsc as a CI quality gate alongside tsup, fix the Vitest cleanup hang on `npm test` exit, and address two LOW-severity test hygiene findings from the Phase 15 code review.
**Source:** `.planning/phases/15-testing-ci-publishing-and-documentation/15-VERIFICATION.md` Phase 16+ Carry-Overs table
**Items:**
- Vitest cleanup hang — add `afterEach` cleanup to MCP/CLI smoke tests to kill spawned children
- L-01 — `placeholder.test.ts` silent precondition guard (`expect(platformResult.success).toBe(true)`)
- L-02 — `decode.test.ts` tautological assertion (`expect(typeof result.success).toBe('boolean')` can never fail)
- D-18 — `tsc --build` strict-mode regression (~30 implicit-any errors that tsup tolerates)
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.4: Packaging polish — `files: ["dist"]` (BACKLOG)

**Goal:** Reduce npm tarball download size by adding `"files": ["dist"]` to `packages/mcp/package.json` and `packages/cli/package.json`. Currently published tarballs include `src/`, `test/`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts` — useful for sourcemaps but inflates download roughly 2x.
**Source:** `.planning/phases/15-testing-ci-publishing-and-documentation/15-05-SUMMARY.md` Phase 16+ carry-overs
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.5: TIER 2 streaming refactor of spawnTool — real-time MCP-driven copy progress (BACKLOG)

**Goal:** Phase 14-11 closed CLI silent operations at TIER 1 (three pre-operation stderr status lines). TIER 2 changes `spawnTool` from `spawnSync` with `stdio=['ignore','pipe','pipe']` to either inherited stdio (Option A) or async `spawn()` with line-streaming via `child.stdout('data')` (Option B). Surfaces robocopy/rsync per-line progress to the user during MCP-driven copy operations through the `/localground:migrate` skill.
**Source:** `.planning/phases/14-standalone-cli-and-claude-code-skills/14-11-SUMMARY.md`; full diagnosis at `.planning/debug/cli-silent-long-operations.md` lines 148-158
**Requirements:** TBD (CLI-01 UX refinement)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.6: encode() regex calibration (WR-01) (BACKLOG)

**Goal:** `packages/core/src/environment/decode.ts` line 89 — `encode()` regex `/[\\/: ,().]/g` is narrower than likely Claude Code behavior. Folders with apostrophes, ampersands, brackets, etc. would silently fail to decode. On the user's machine, 6 of 23 path-hashes returned `no_candidates` — undetermined whether deleted-source folders or encoder-mismatch silent failures.
**Source:** `.planning/phases/14-standalone-cli-and-claude-code-skills/14-VERIFICATION.md` line 128 (Anti-Patterns Found); CONTEXT.md WR-01
**Requirements:** TBD (CORE-02 refinement)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

---
*Roadmap created: 2026-04-11*
*v3.0.0 phases added: 2026-04-12*
*v3.0.0 milestone closed: 2026-04-26*
*Backlog seeded at v3.0.0 close: 2026-04-26*
