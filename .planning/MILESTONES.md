# Milestones

## v3.0.0 MCP Server + CLI Tooling (Shipped: 2026-04-26)

**Phases completed:** 4 phases (12-15), 30 plans, ~70 tasks
**Timeline:** 2026-04-13 to 2026-04-26 (14 days)
**Git range:** 160 commits between `2df59a0` (v2.0.0 merge) and `26e3ba2` (Phase 15 verification close-out)
**Code volume:** 142 files changed (+22,850 / -42 lines); 5,877 LOC TypeScript across 47 `.ts` files in `packages/`
**npm:** `@localground/mcp@3.0.0` + `@localground/cli@3.0.0` live (manual first publish per npm/cli#8544; OIDC + provenance configured for v3.0.1+)

**Key accomplishments:**

- Three-package monorepo shipped — `@localground/core` (12 deterministic functions, `Result<T,R>` typed, no exceptions), `@localground/mcp` (9 tools with annotations, zero stdout pollution), `@localground/cli` (7 commands with global `--json` flag)
- v3.0.0 published to npm — both packages resolvable via `npx -y @localground/cli`; OIDC trusted-publisher contract pinned to `Technically-A-Mechanical-Engineer/localground` + `release.yml` for future tag-push releases
- UAT-discovered defects closed via gap-closure plans (14-08..14-11) — decoder Defect A (CLI/MCP detect not invoking `decode()`), Defect B (mixed-punctuation OneDrive paths), audit scope (root/home as projects), CLI silent long operations
- Test infrastructure and CI — 79-test Vitest suite (real-fs fixtures, no mocks); 3-OS GitHub Actions CI (Win/Mac/Linux on Node 20.x); tag-triggered release workflow with OIDC and provenance
- Five Claude Code skills delivered — `/localground:seed`, `/localground:migrate`, `/localground:reap`, `/localground:cleanup`, `/localground:verify` with `allowed-tools` frontmatter; gated skills use `disable-model-invocation: true`
- v2.0.0 prompts preserved as no-install fallback in `prompts/` — INFRA-06 satisfied; safety model invariant preserved across the v2 → v3 migration

**Known deferred items at close:** 6 (see ROADMAP.md `## Backlog` section, 999.1-999.6)

Most-critical deferral: **999.1** — UAT Tests 12-16 (skill end-to-end MCP routing). Test 15 (`/localground:migrate` two-session orchestration) is the only test that validates the continuation-token loop and `localground-migrate-state.json` handoff; it has not run end-to-end.

Two pipelines structurally verified but unexecuted at close: `ci.yml` (first push to master) and `release.yml` (first OIDC publish on v3.0.1+ tag). Captured in **999.2**.

**Full archive:** [milestones/v3.0.0-ROADMAP.md](milestones/v3.0.0-ROADMAP.md)

---

## v1.2.0 Cloud-Sync Toolkit (Shipped: 2026-04-11)

**Phases completed:** 4 phases, 13 plans, 16 tasks

**Key accomplishments:**

- Migration prompt v1.2.0 shipped — three-way shell detection, four-signal prior migration cascade, subdirectory scoping, pre-copy placeholder verification, cleanup prompt cross-reference
- Cleanup prompt v1.0.0 shipped — dual-mode detection, verification-gated source folder deletion with cloud-propagation warning, soak-period check
- Verification prompt v1.0.0 shipped — project health audit, path-hash integrity, reference scan with traffic light report and 12-entry recommendation mapping
- All three prompts passed eight NEC prompt frameworks with zero findings remaining
- Documentation updated for full toolkit scope — README, CLAUDE.md, dev-status reports, evaluation files

---
