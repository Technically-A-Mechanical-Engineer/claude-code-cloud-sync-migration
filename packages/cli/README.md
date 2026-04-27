# @localground/cli

Standalone CLI for the LocalGround Toolkit — 7 commands for migrating Claude Code projects off cloud-synced storage. Zero install required.

Part of the [LocalGround Toolkit](https://github.com/Technically-A-Mechanical-Engineer/localground) for Claude Code users dealing with git breakage, file lock failures, or sync conflicts caused by working in OneDrive, Dropbox, Google Drive, or iCloud folders.

## Install

No installation needed. The CLI runs through `npx`:

```bash
npx -y @localground/cli detect
```

## Commands

```bash
# Detect what's on your machine (read-only)
npx -y @localground/cli detect

# Audit the environment with traffic-light findings (read-only)
npx -y @localground/cli audit

# Plant migration markers — test file + git tag + JSON manifest
npx -y @localground/cli seed /path/to/your/project

# Copy a project safely — never deletes the source
npx -y @localground/cli copy /path/to/source /path/to/destination

# Verify markers survived a copy
npx -y @localground/cli verify /path/to/migrated/project

# Run six post-migration health checks
npx -y @localground/cli reap /path/to/migrated/project

# Identify cleanup candidates (read-only — no deletion)
npx -y @localground/cli cleanup-scan
```

## JSON Mode

Every command supports `--json` for machine-readable output. The flag works before or after the subcommand:

```bash
npx -y @localground/cli detect --json
npx -y @localground/cli --json detect
```

Pipe to `jq` to filter:

```bash
npx -y @localground/cli audit --json | jq '.findings[] | select(.severity == "fail")'
```

### stdout vs stderr Discipline

- **stdout** carries data — JSON in `--json` mode, formatted output in human mode
- **stderr** carries status messages (e.g., `Auditing 14 projects...`, per-project progress counters)
- In `--json` mode, status messages are fully suppressed on both streams — pipe stdout to a file and your JSON parser will never see chatter

This means you can do this without losing progress visibility:

```bash
npx -y @localground/cli audit --json > findings.json
# Status output still goes to your terminal via stderr; findings.json is clean JSON
```

## Safety Model

- **Migration never deletes.** `copy` only writes; the source is left intact.
- **Cleanup is scan-only.** `cleanup-scan` returns candidates without deleting.
- **Verification never modifies.** `audit`, `reap`, `verify`, and `cleanup-scan` are read-only.

Exit codes:
- `0` — success
- `1` — RED audit (significant findings; check the output)
- `2` — error (bad arguments, missing files, refusal to overwrite)

## Platform Support

| OS | Copy tool used | Notes |
|---|---|---|
| Windows | robocopy | Native; exit codes 0–7 mapped to success |
| macOS | rsync | Native |
| Linux | rsync | Native |

The CLI auto-detects OS and selects the correct tool. No `cmd /c` prefix needed — `npx` runs directly because you're typing the command interactively.

## Requirements

- Node.js >= 20.0.0
- git installed and on PATH
- Platform: Windows (PowerShell or Git Bash), macOS, or Linux

## MCP Server Alternative

If you want Claude Code to invoke these operations as native tool calls with conversational guidance, install [`@localground/mcp`](https://www.npmjs.com/package/@localground/mcp) instead — same operations, exposed via the Model Context Protocol.

## Documentation

- [Repo home](https://github.com/Technically-A-Mechanical-Engineer/localground) — full toolkit documentation, three install paths, design principles
- [Changelog](https://github.com/Technically-A-Mechanical-Engineer/localground/blob/master/CHANGELOG.md) — version history

## License

MIT
