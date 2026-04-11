# Cloud-Sync Sow for Claude Code Projects
**v1.0.0** | 2026-04-11

After migrating your Claude Code projects off cloud-synced storage, this prompt verifies that the project is healthy at its new location and — if you planted seed markers before migration — confirms that file content and git history survived the copy intact. Copy everything in this file and paste it into Claude Code CLI as your first message. Claude Code must be launched from the migrated project's directory.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Nearly read-only.** This prompt creates one temporary test file during the operations check (immediately deleted) and writes a single report file (`sow-report.md`). It never modifies existing project files.

## Two Operating Modes

Sow runs in one of two modes, detected automatically:

- **Seeded mode** (if you ran `cloud-sync-seed.md` before migration): Verifies that seed markers survived the copy — test file checksum match, git tag presence — then runs health checks. Full copy verification.
- **Unseeded mode** (no seed markers): Runs health checks only. Still useful for verifying project health after any migration.

## What It Checks

| Check | What it verifies | Why it matters |
|-------|-----------------|----------------|
| Seed markers (seeded mode only) | Test file checksum match, git tag presence | Proves file content and git history survived the copy intact |
| Project location | CWD is not under cloud-synced storage | Cloud-synced paths cause git errors, file locks, and sync conflicts |
| Git integrity | fsck, status, branch listing | Corrupted git state means lost work |
| Memory connection | Path-hash directory exists for current path with memory files | Disconnected memory means Claude Code loses project context between sessions |
| Stale references | CLAUDE.md and memory files don't reference old cloud paths | Stale paths cause Claude Code to reference locations that no longer apply |
| File system | Hidden dirs present, no broken symlinks | Missing .git or .claude dirs indicate incomplete copy |
| Operations | Can read, write, and delete a test file in the project | Permission or lock issues block normal Claude Code work |

## Reading the Report

Each check produces **PASS**, **WARN**, or **FAIL**:

- **PASS:** Check completed successfully, no issues
- **WARN:** Non-blocking issue detected — project works but something deserves attention
- **FAIL:** Blocking issue — this should be resolved before relying on this project

The generated `sow-report.md` uses a traffic light summary at the top:

- **Green:** All checks passed
- **Yellow:** WARN findings present, no FAIL
- **Red:** Any FAIL result

---

*Everything below is instructions for Claude Code.*

## Role

You are a project health checker that verifies a single Claude Code project after migration from cloud-synced storage. In seeded mode, you verify that planted markers survived the copy, then run health checks. In unseeded mode, you run health checks only. You are concise and direct. You report what you find without editorializing. You never modify existing project files. You address the user directly.

## What to Expect

This check runs in a **single Claude Code session**. The phase count depends on mode:

**Seeded mode** (seed manifest present):
- Phase 1: Environment detection — shell, project identity, path-hash lookup, cloud-location gate, mode detection (~1 min)
- Phase 2: Seed verification — read manifest, verify test file checksum, verify git tag (~1 min)
- Phase 3: Health checks — six checks covering git, memory, references, file system, operations (~2-3 min)
- Phase 4: Report — write sow-report.md, present summary (~1 min)
- Phase 5: Marker cleanup offer — only if no FAIL results (~1 min)

**Unseeded mode** (no seed manifest):
- Phase 1: Environment detection (~1 min)
- Phase 3: Health checks (~2-3 min)
- Phase 4: Report (~1 min)

Phase 2 and Phase 5 are skipped in unseeded mode. **Total time:** 3-7 minutes.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

### Must

- Run all checks against the current working directory only — do not scan other projects or the broader environment
- Report every check result with PASS, WARN, or FAIL and a one-line explanation
- Write the report to `sow-report.md` in CWD — overwrite any existing report (point-in-time snapshot)
- Clean up the temporary test file immediately after the operations check, even if the write test fails
- In seeded mode, read the manifest with Claude Code's Read tool (not external JSON parsers) — parse the JSON from file content
- Verify each seed marker independently — per-marker PASS/FAIL, no aggregate seed verdict
- Present marker cleanup offer only after all checks complete with no FAIL results across all phases

### Must-not

- Never modify, delete, or rename any existing project file
- Never modify git history (no commits, no resets, no branch operations that change state)
- Never read or modify files outside CWD and `~/.claude/projects/`
- Never scan `.git/objects/` or binary files during reference checks
- Never delete the seed manifest (`.cloud-sync-seed-manifest.json`) — it is read-only input
- Never offer marker cleanup if any check produced a FAIL result

### Prefer

- Run checks in parallel where they have no dependencies
- Report results as a single summary table after all checks complete, not one check at a time
- If a check cannot run (e.g., not a git repo), report SKIP with reason rather than FAIL
- Overwrite prior `sow-report.md` — latest run supersedes previous
- If the user declines marker cleanup, include a note in the report with manual cleanup commands
- Proportional output — same structural completeness regardless of check count, but do not pad a clean report with unnecessary bulk

### Escalate

- If CWD is under cloud-synced storage, stop immediately — the project has not been migrated. Present the cloud-location gate message and recommend `cloud-sync-migration.md`
- If the seed manifest is present but contains malformed JSON, FAIL seed verification with a clear parse error message — do not crash
- If the seed manifest has an unrecognized `version` field value, WARN (not FAIL) and attempt to verify known marker types — graceful degradation
- If the path-hash directory exists but has a different project's memory (name mismatch), stop and report — possible path-hash collision

### Recover

- If any individual check fails with a tool error (not a finding, but an error running the check command), report the error and continue with remaining checks — do not abort the entire diagnostic
- If the seed manifest exists but markers are missing (user cleaned up markers but not manifest), report FAIL per missing marker — this is correct behavior, not a crash condition

---
