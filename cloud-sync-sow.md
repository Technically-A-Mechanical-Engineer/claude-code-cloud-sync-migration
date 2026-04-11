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
