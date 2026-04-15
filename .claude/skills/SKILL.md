# LocalGround Skills

Skills for migrating Claude Code projects off cloud-synced storage. Each skill orchestrates LocalGround MCP server tools with guided workflows.

## Prerequisites

The LocalGround MCP server must be registered in Claude Code:

```bash
claude mcp add localground -- node /path/to/packages/mcp/dist/index.js
```

## Available Skills

### /localground:seed

**File:** `localground-seed.md`

Plant verifiable markers in a Claude Code project before migration. Detects the environment, seeds markers (test file + git tag), and returns a manifest for post-migration verification.

**MCP tools used:** `localground_detect`, `localground_seed`

---

### /localground:migrate

**File:** `localground-migrate.md`

Two-session migration orchestrator. Session 1 discovers projects, copies them to local storage with per-folder confirmation, verifies integrity, and writes a state file. Session 2 (run from the destination) migrates settings and updates path references.

**MCP tools used:** `localground_detect`, `localground_copy`, `localground_verify`

---

### /localground:reap

**File:** `localground-reap.md`

Post-migration health check. Runs marker verification and a 6-point health assessment (git integrity, placeholder files, cloud sync status, path-hash validity, seed markers, source/target alignment). Generates a natural language report with traffic-light scoring.

**MCP tools used:** `localground_health_check`, `localground_verify`

---

### /localground:cleanup

**File:** `localground-cleanup.md`

Guided cleanup of stale cloud storage artifacts. Scans for cleanup candidates, presents each with type/path/reason, collects per-item confirmation, and executes deletions via platform-appropriate shell commands.

**MCP tools used:** `localground_cleanup_scan`

---

### /localground:verify

**File:** `localground-verify.md`

Environment-wide audit. Discovers all Claude Code projects and path-hash entries, runs health checks on each, and generates a traffic-light report with recommendations.

**MCP tools used:** `localground_audit`
