# @localground/mcp

MCP server for the LocalGround Toolkit — exposes 9 LocalGround operations as native Claude Code tool calls over stdio.

Part of the [LocalGround Toolkit](https://github.com/Technically-A-Mechanical-Engineer/localground) for Claude Code users who need to migrate projects off cloud-synced storage (OneDrive, Dropbox, Google Drive, iCloud) without git breakage.

## Install

**macOS / Linux:**
```bash
claude mcp add --transport stdio localground -- npx -y @localground/mcp
```

**Windows (PowerShell or Command Prompt):**
```bash
claude mcp add --transport stdio localground -- cmd /c npx -y @localground/mcp
```

> **Windows users:** the `cmd /c` prefix is required. Without it, Claude Code cannot spawn `npx` on Windows because `npx` is a batch script (`.cmd` file), not a native executable. This is the most common Windows setup failure — do not omit it.

After registration, restart your Claude Code session. The 9 tools below become available.

## Available Tools

| Tool | What It Does | Read-only? |
|------|--------------|------------|
| `localground_detect` | Detect OS, shell, cloud sync service, projects, and Claude Code path-hash directories | Yes |
| `localground_decode_path_hash` | Decode a `.claude/projects/` directory name back to its filesystem path | Yes |
| `localground_seed` | Plant verifiable migration markers (test file + git tag + JSON manifest) | No |
| `localground_copy` | Copy a project directory with chunked operation and verification (safe to call repeatedly) | No |
| `localground_verify` | Verify seed markers against manifest after a copy | Yes |
| `localground_health_check` | Run 6 health checks on a project (git, placeholders, cloud sync, path-hashes, seed markers, source/target alignment) | Yes |
| `localground_audit` | Environment-wide read-only audit with traffic-light findings | Yes |
| `localground_cleanup_scan` | Identify stale/orphan/source candidates without deleting | Yes |
| `localground_placeholder_check` | Detect cloud placeholder files (Files On-Demand, Smart Sync) in a directory | Yes |

Every tool has correct annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) so Claude Code knows when to ask for confirmation.

## Safety Model

The MCP server enforces the same safety guarantees as the LocalGround paste-and-run prompts:

- **Migration never deletes.** `localground_copy` only writes; the source folder is left intact.
- **Cleanup is scan-only.** `localground_cleanup_scan` returns candidates without deleting. Deletion is the user's job, gated by confirmation in the calling skill.
- **Verification never modifies.** `localground_audit`, `localground_health_check`, `localground_verify`, and `localground_placeholder_check` are read-only.

Errors return structured JSON (`isError: true`) with actionable messages — no stack traces, no leaked stdout. All logging routes to stderr; stdout is reserved for JSON-RPC traffic.

## Working with Skills

Pair with the LocalGround Claude Code skills (in the [main repo](https://github.com/Technically-A-Mechanical-Engineer/localground)) for guided workflows:

- `/localground:seed` — pre-migration marker planting
- `/localground:migrate` — full migration with confirmation gates per folder
- `/localground:reap` — post-migration health checks with natural-language report
- `/localground:cleanup` — candidate review with per-item confirmation
- `/localground:verify` — environment audit with traffic-light report

The skills declare `allowed-tools` frontmatter so Claude Code pre-approves the MCP calls — no permission prompts during normal use.

## Requirements

- Node.js >= 20.0.0
- Claude Code CLI (the desktop app, web app, and Cowork mode are not supported)
- Platform: Windows, macOS, or Linux

## Standalone CLI Alternative

If you want one-off commands or scripted automation outside Claude Code, install [`@localground/cli`](https://www.npmjs.com/package/@localground/cli) instead — same operations, terminal interface.

## Documentation

- [Repo home](https://github.com/Technically-A-Mechanical-Engineer/localground) — full toolkit documentation, three install paths, design principles
- [Changelog](https://github.com/Technically-A-Mechanical-Engineer/localground/blob/master/CHANGELOG.md) — version history

## License

MIT
