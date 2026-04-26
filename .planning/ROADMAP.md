# Roadmap: LocalGround Toolkit

## Milestones

- ✅ **v1.2.0 Cloud-Sync Toolkit** -- Phases 1-4 (shipped 2026-04-11) -- [archive](milestones/v1.2.0-ROADMAP.md)
- ✅ **v2.0.0 Five-Prompt Toolkit with Unified Versioning** -- Phases 5-11 (shipped 2026-04-12) -- [archive](milestones/v2.0.0-ROADMAP.md)
- 🚧 **v3.0.0 MCP Server + CLI Tooling** -- Phases 12-15 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 12: Monorepo Foundation and Core Library** - Scaffold npm workspaces monorepo and build the shared core library that all packages depend on
- [ ] **Phase 13: MCP Server** - Build the MCP server exposing all LocalGround operations as Claude Code tool calls
- [ ] **Phase 14: Standalone CLI and Claude Code Skills** - Build the npx-distributable CLI and Claude Code skills that orchestrate MCP tools
- [ ] **Phase 15: Testing, CI, Publishing, and Documentation** - Automated test suite, GitHub Actions CI, npm publishing pipeline, and user-facing documentation

## Phase Details

### Phase 12: Monorepo Foundation and Core Library
**Goal**: Developers can import @localground/core and call every deterministic operation (detect, decode, checksum, copy, seed, verify, scan) with structured return types
**Depends on**: Nothing (first phase of v3.0.0)
**Requirements**: INFRA-01, INFRA-02, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11, CORE-12
**Success Criteria** (what must be TRUE):
  1. Running `npm install` from the repo root installs all three workspace packages (core, mcp, cli) with correct cross-references
  2. TypeScript strict mode compiles the core package with zero errors and tsup produces a working build artifact
  3. Core library exports detect, decode, classify, checksum, compare, placeholder-detect, git-check, copy, seed, verify, scan, and chunk functions that return structured typed results (not raw strings)
  4. Platform-specific operations (robocopy vs rsync, PowerShell vs bash checksum tools) select the correct implementation based on detected OS and shell
**Plans**: TBD

### Phase 13: MCP Server
**Goal**: Claude Code users can add the LocalGround MCP server and invoke all operations as native tool calls with structured JSON responses
**Depends on**: Phase 12
**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, MCP-06, MCP-07, MCP-08, MCP-09, MCP-10, MCP-11, MCP-12, MCP-13, MCP-14
**Success Criteria** (what must be TRUE):
  1. Running `claude mcp add localground` registers the server and Claude Code can call `localground_detect` to get structured environment JSON
  2. All ten tool endpoints (detect, decode_path_hash, seed, copy, verify, health_check, audit, cleanup_scan, placeholder_check) respond with structured JSON and every tool has correct annotations (readOnlyHint, destructiveHint, idempotentHint)
  3. Errors from any tool return `isError: true` with an actionable human-readable message (not stack traces)
  4. Long-running operations (copy, audit) send progress notifications that Claude Code can surface to the user
  5. Server produces zero stdout pollution -- all logging goes to stderr, stdout is reserved for JSON-RPC transport
**Plans**: TBD

### Phase 14: Standalone CLI and Claude Code Skills
**Goal**: Users can run `npx @localground/cli <command>` for direct terminal usage, and invoke `/localground:*` skills in Claude Code for guided workflows with confirmation gates
**Depends on**: Phase 13
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05, SKILL-06, SKILL-07
**Success Criteria** (what must be TRUE):
  1. Running `npx @localground/cli detect` returns human-readable environment summary, and `npx @localground/cli detect --json` returns machine-readable JSON -- same for all commands (detect, seed, copy, verify, reap, audit, cleanup-scan)
  2. Each of the five `/localground:*` skills (seed, migrate, reap, cleanup, verify) invokes the correct MCP tools and presents results with natural language interpretation
  3. The migration skill (`/localground:migrate`) orchestrates detect-copy-verify with per-folder confirmation gates, and writes machine-readable state for Session 2 continuation
  4. All skills declare `allowed-tools` frontmatter to pre-approve their MCP tool calls
**Plans**: TBD
**UI hint**: yes

### Phase 15: Testing, CI, Publishing, and Documentation
**Goal**: The toolkit has automated quality gates, ships to npm for zero-install usage, preserves v2.0.0 prompts as fallback, and has clear installation documentation
**Depends on**: Phase 12, Phase 13, Phase 14
**Requirements**: INFRA-03, INFRA-04, INFRA-05, INFRA-06, DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. Running `npm test` executes the Vitest suite against core library functions and all tests pass on both Windows and macOS
  2. Every push to the repo triggers GitHub Actions CI that runs the test suite on Windows and macOS runners and reports pass/fail
  3. `npx @localground/cli --version` and `npx @localground/mcp --version` work without prior installation (npm packages published and accessible)
  4. v2.0.0 prompt files exist in `prompts/` directory and remain functional as a no-install fallback
  5. README documents all three installation paths (MCP server add, CLI install, legacy prompts) including the Windows `cmd /c` setup for MCP, and CLAUDE.md reflects v3.0.0 architecture
**Plans**: TBD

## Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|-------------|-------|
| 12 | 7/7 | Complete    | 2026-04-13 |
| 13 | 6/6 | Complete   | 2026-04-13 |
| 14 | 7/7 | Complete   | 2026-04-15 |
| 15 | Testing, CI, Publishing, and Documentation | INFRA-03, INFRA-04, INFRA-05, INFRA-06, DOC-01, DOC-02 | 6 |
| | **Total** | | **45** |

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
| 12. Monorepo Foundation and Core Library | v3.0.0 | 1/7 | In Progress | - |
| 13. MCP Server | v3.0.0 | 0/0 | Not started | - |
| 14. Standalone CLI and Claude Code Skills | v3.0.0 | 7/7 baseline + 3/4 gap closure (14-08, 14-09, 14-10) | Complete + Gap closure in progress | 2026-04-26 (14-10) |
| 15. Testing, CI, Publishing, and Documentation | v3.0.0 | 0/0 | Not started | - |

---
*Roadmap created: 2026-04-11*
*v3.0.0 phases added: 2026-04-12*
