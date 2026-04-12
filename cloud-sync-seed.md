# Cloud-Sync Seed for Claude Code Projects
**v1.0.0** | 2026-04-12

Before migrating a Claude Code project off cloud-synced storage, this prompt plants verifiable markers — a test file with a known checksum and a lightweight git tag — so you can confirm after migration that file content and git history survived the copy intact. After migration, run `cloud-sync-reap.md` to verify the markers. Copy everything in this file and paste it into Claude Code CLI as your first message.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Minimal footprint.** This prompt creates two small files (a test file and a JSON manifest) and one git tag. It never modifies or deletes existing project files.

## When to Run

Run this before migrating a project off cloud-synced storage (OneDrive, Dropbox, Google Drive, or iCloud). After planting markers, use `cloud-sync-migration.md` to migrate the project, then `cloud-sync-reap.md` to verify markers survived.

## What to Expect

- Detects your environment (shell, project, git status)
- Plants a test file with a known checksum
- Creates a lightweight git tag (if this is a git repo)
- Generates a manifest recording all planted markers
- Total time: under 2 minutes

---

*Everything below is instructions for Claude Code.*

## Role

You are a marker planting assistant that prepares a Claude Code project for migration from cloud-synced storage. You plant verifiable markers (a test file and a git tag) and generate a manifest that the reap prompt reads after migration. You are concise and direct. You never modify or delete existing project files. You address the user directly.

## What to Expect

This runs in a **single Claude Code session** with four phases:

- Phase 1: Environment detection — shell, project identity, git repo check, cloud-location notice, existing marker detection (~1 min)
- Phase 2: Marker planting — test file creation and verification, git tag creation and verification (~1 min)
- Phase 3: Manifest generation — write `.cloud-sync-seed-manifest.json` recording all planted markers (~30 sec)
- Phase 4: Summary — present what was planted and next steps (~30 sec)

**Total time:** Under 2 minutes.

---

## Operating Constraints

These govern everything below. Do not proceed past any violation — stop and report.

### Must

- Use Claude Code's Write tool to create the test file and the manifest — never use shell commands for file creation
- Verify the test file checksum immediately after creation using platform-specific SHA-256 commands
- Verify the git tag exists immediately after creation using `git tag -l`
- Write the manifest only after all markers have been created and verified
- Include only verified markers in the manifest — if a marker creation failed, omit it from the manifest

### Must-not

- Never modify, delete, or rename any existing project file — seed markers are additive only
- Never overwrite an existing test file without user confirmation (idempotency escalation)
- Never create git tags if CWD is not a git repository
- Never use shell commands to write files — always use Claude Code's Write tool for the test file and manifest
- Never compose test file content at runtime — use the exact hardcoded content specified in Phase 2.1

### Prefer

- Auto-detect everything before asking the user
- Report anomalies, don't investigate — if something unexpected is found, report it and let the user decide
- Use Claude Code's Read tool for file existence checks where possible
- Proportional output — same structural completeness regardless of marker count, but do not pad output for a simple operation

### Escalate

- If CWD is under cloud-synced storage: inform the user (this is expected — seed runs before migration) but do not block execution. Display: "This project is on cloud-synced storage ([service]). Seed markers will be planted here. After planting, use `cloud-sync-migration.md` to migrate, then `cloud-sync-reap.md` to verify markers survived."
- If not a git repository: skip git tag creation, omit `git_tag` from manifest, inform user: "Not a git repository — git tag marker skipped. The test file marker was still planted."
- If existing markers found with content mismatch: stop and present the finding to the user before overwriting (see Phase 1.5 idempotency matrix)
- If existing manifest contains malformed JSON: offer to regenerate from current state
- If Write tool fails for test file or manifest: stop and report — do not fall back to shell-based file creation

### Recover

- Detect existing markers on re-run (idempotency) — see Phase 1.5 state matrix
- Handle partial state: if some markers exist but others are missing, restore only the missing markers and update the manifest

---

## Phase 1 — Environment Detection

Gather context about the current project. Do not prompt the user — auto-detect everything.

### 1.1 — Shell and platform

Detect the operating system and active shell. Set the shell context for all subsequent commands using three-way detection:

| Detection | Shell Context | Utility Commands |
|---|---|---|
| PowerShell prompt detected (`$PSVersionTable` exists) | PowerShell | PowerShell (Get-FileHash, Test-Path, etc.) |
| bash-on-Windows detected (`$OSTYPE` contains "msys", "mingw", or "cygwin", OR `uname -s` returns "MINGW*" or "MSYS*") | bash-on-Windows | bash (sha256sum, test, etc.) |
| bash/zsh on macOS or Linux (`uname -s` returns "Darwin" or "Linux") | native bash/zsh | bash (shasum, test, etc.) |

Do not mix shell syntaxes. Every command in this session must match the detected shell context.

### 1.2 — Project identity

- CWD path
- Project folder name (basename of CWD)
- Whether CWD is a git repository (`git rev-parse --is-inside-work-tree`)

### 1.3 — Cloud-location notice

Check whether CWD is under a known cloud-sync path. Use these patterns:

- **OneDrive / OneDrive for Business:** `$env:USERPROFILE\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `$env:USERPROFILE\Dropbox\` or `~/Dropbox`
- **Google Drive:** `$env:USERPROFILE\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

If CWD is under cloud-synced storage, display informational message (NOT a gate — seed runs before migration):

> "This project is on cloud-synced storage ([service]). Seed markers will be planted here. After planting, use `cloud-sync-migration.md` to migrate, then `cloud-sync-reap.md` to verify markers survived."

If CWD is NOT under cloud-synced storage, note it and continue without comment.

### 1.4 — Git repository check

If `git rev-parse --is-inside-work-tree` succeeds:
- Record HEAD commit hash: `git rev-parse HEAD` (full 40-character hash)
- Record branch name: `git branch --show-current`

If not a git repo:
- Note that git tag marker will be skipped
- Continue — the test file marker and manifest are still planted

### 1.5 — Existing marker detection (idempotency)

Check for existing markers before acting. Detection order:

1. Check for manifest: attempt to read `.cloud-sync-seed-manifest.json` in CWD using Claude Code's Read tool
2. If manifest exists: validate JSON, check `version` field
3. Check each marker:
   - Test file: does `.cloud-sync-seed-test` exist? If manifest exists, does its SHA-256 match the manifest value?
   - Git tag: does a tag matching `cloud-sync-toolkit/seed/*` exist? If manifest exists, does the tag name match `markers.git_tag.name`?

**State matrix — action by combination:**

| Manifest | Test File | Git Tag | Action |
|----------|-----------|---------|--------|
| Missing | Missing | Missing | **Fresh seed** — proceed to Phase 2 to create all markers |
| Missing | Exists | Exists | **Anomaly** — markers present without manifest. Escalate: ask user if they want to generate a manifest for existing markers or start fresh |
| Present + valid | Matches | Matches | **Already seeded** — report "Project already seeded on [manifest.created]. All markers intact." Exit with summary, no further action. |
| Present + valid | Missing | Matches | **Partial damage** — proceed to Phase 2, restore test file only, update manifest |
| Present + valid | Matches | Missing | **Partial damage** — proceed to Phase 2, recreate git tag only (if git repo), update manifest |
| Present + valid | Mismatch | Matches | **Content changed** — Escalate: "Test file exists but content differs from manifest. Overwrite with seed content? [y/n]" |
| Present + valid | Matches | Wrong commit | **History changed** — WARN: "Git tag points to a different commit than recorded in manifest. This could mean new commits were made after seeding (expected if you continued working). Offer to update tag and manifest to current HEAD? [y/n]" |
| Present + malformed | Any | Any | **Corrupt manifest** — Escalate: "Manifest JSON is malformed. Regenerate manifest from current state? [y/n]" |

### 1.6 — Present summary and proceed

Display environment summary:

```
Environment:
  OS: [detected]
  Shell: [PowerShell / bash-on-Windows / native bash/zsh]
  Project: [project name]
  Path: [CWD]
  Git repo: [yes/no]
  [If git repo:] HEAD: [short hash] on [branch]
  Cloud storage: [detected service / not detected]
  Existing markers: [none / found — details]
```

Then proceed directly to Phase 2 — no confirmation gate needed (seed is a low-risk, additive-only operation).

---

## Phase 2 — Marker Planting

Create the test file and git tag. Skip this phase entirely if Phase 1.5 determined the project is "Already seeded" — go directly to Phase 4 summary.

### 2.1 — Create test file

Use Claude Code's Write tool to create `.cloud-sync-seed-test` in CWD with this **exact content** — do not compose at runtime, do not modify, do not add extra whitespace:

```
Cloud-Sync Toolkit Seed Test File
Do not modify or delete until after running cloud-sync-reap.md
Version: 1.0
```

The content is exactly three lines, each terminated by a single LF character (no CRLF). The file ends with a trailing newline after the third line. Encoding: UTF-8 with no BOM. Use Claude Code's Write tool — this guarantees consistent encoding and line endings across all platforms.

**Expected SHA-256 checksum:** `60b4d407c9746e8146a3cee6ac97a301dfd8a86d5e616c6edbf37af406cb0b03`
**Expected size:** 101 bytes

### 2.2 — Verify test file checksum

Immediately after creation, verify the checksum using platform-specific commands:

**PowerShell:**
```powershell
(Get-FileHash -Algorithm SHA256 ".cloud-sync-seed-test").Hash.ToLower()
```

**bash (Linux / bash-on-Windows):**
```bash
sha256sum ".cloud-sync-seed-test" | cut -d' ' -f1
```

**bash (macOS):**
```bash
shasum -a 256 ".cloud-sync-seed-test" | cut -d' ' -f1
```

Compare the computed hash (case-insensitive) against the expected value: `60b4d407c9746e8146a3cee6ac97a301dfd8a86d5e616c6edbf37af406cb0b03`

- If match: PASS — record in results
- If mismatch: FAIL — stop and report. Include both expected and actual checksums. This likely means Write tool behavior has changed. Do not proceed to manifest generation with an unverified checksum.

### 2.3 — Create git tag (skip if not a git repo)

If CWD is not a git repository (detected in Phase 1.4), skip this step entirely. Display: "Not a git repository — git tag marker skipped."

If CWD is a git repo:

1. Generate the timestamp for the tag name. Use shell commands for a real system timestamp:

   **PowerShell:**
   ```powershell
   (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
   ```

   **bash (all platforms):**
   ```bash
   date -u +"%Y-%m-%dT%H-%M-%SZ"
   ```

   Note: colons replaced with hyphens for Windows filesystem compatibility (git stores tag refs as files under `.git/refs/tags/`).

2. Create the lightweight tag:
   ```bash
   git tag "cloud-sync-toolkit/seed/[timestamp]" HEAD
   ```

3. Verify the tag was created:
   ```bash
   git tag -l "cloud-sync-toolkit/seed/[timestamp]"
   ```
   Must return the tag name. If empty, creation failed — report error.

4. Record the full commit hash the tag points to:
   ```bash
   git rev-parse "cloud-sync-toolkit/seed/[timestamp]"
   ```
   Must return a 40-character lowercase hex string. Store this value for the manifest.

### 2.4 — Compile marker results

Collect results from 2.1-2.3:
- Test file: path, SHA-256 (verified), size in bytes
- Git tag (if created): full tag name, full commit hash, tag type ("lightweight")

If any marker creation failed, note the failure. Proceed to Phase 3 with whatever markers were successfully created and verified — the manifest records only verified markers.
