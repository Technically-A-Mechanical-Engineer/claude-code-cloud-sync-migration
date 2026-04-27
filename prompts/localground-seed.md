# LocalGround Toolkit v2.0.0 — Seed

Before migrating a Claude Code project off cloud storage, this prompt plants verifiable markers — a test file with a known checksum and a lightweight git tag — so you can confirm after migration that file content and git history survived the copy intact. After migration, run `localground-reap.md` to verify the markers. Copy everything in this file and paste it into Claude Code CLI as your first message.

**Compatibility:** Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode. Tested with Claude Code CLI as of April 2026.

**Minimal footprint.** This prompt creates two small files (a test file and a JSON manifest) and one git tag. It never modifies or deletes existing project files.

## When to Run

Run this before migrating a project off cloud storage (OneDrive, Dropbox, Google Drive, or iCloud). Run this from your project root directory (the folder where you normally launch Claude Code). The seed markers will be planted in the current working directory. After planting markers, use `localground-migration.md` to migrate the project, then `localground-reap.md` to verify markers survived.

## What to Expect

- Detects your environment (shell, project, git status)
- Plants a test file with a known checksum
- Creates a lightweight git tag (if this is a git repo)
- Generates a manifest recording all planted markers
- Total time: under 2 minutes

---

*Everything below is instructions for Claude Code.*

## Role

You are a marker planting assistant that prepares a Claude Code project for migration from cloud storage. You plant verifiable markers (a test file and a git tag) and generate a manifest that the reap prompt reads after migration. You are concise and direct. You never modify or delete existing project files. You address the user directly.

## What to Expect

This runs in a **single Claude Code session** with four phases:

- Phase 1: Environment detection — shell, project identity, git repo check, cloud-location notice, existing marker detection (~1 min)
- Phase 2: Marker planting — test file creation and verification, git tag creation and verification (~1 min)
- Phase 3: Manifest generation — write `.localground-seed-manifest.json` recording all planted markers (~30 sec)
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

- If CWD is under cloud storage: inform the user (this is expected — seed runs before migration) but do not block execution. Display: "This project is on cloud storage ([service]). Seed markers will be planted here. After planting, use `localground-migration.md` to migrate, then `localground-reap.md` to verify markers survived."
- If not a git repository: skip git tag creation, omit `git_tag` from manifest, inform user: "Not a git repository — git tag marker skipped. The test file marker was still planted."
- If existing markers found with content mismatch: stop and present the finding to the user before overwriting (see Phase 1.5 idempotency matrix)
- If existing manifest contains malformed JSON: offer to regenerate from current state
- If Write tool fails for test file or manifest: stop and report — do not fall back to shell-based file creation
- Tag namespace collision — a `localground/seed/*` tag exists on a different commit and no manifest is present. Present the existing tag details and ask the user whether to overwrite the tag or abort.

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

Check whether CWD is under a known cloud storage path. Use these patterns:

- **OneDrive / OneDrive for Business:** `$env:USERPROFILE\OneDrive*\` (Windows), `~/Library/CloudStorage/OneDrive*` (macOS)
- **Dropbox:** `$env:USERPROFILE\Dropbox\` or `~/Dropbox`
- **Google Drive:** `$env:USERPROFILE\Google Drive\` or `~/Google Drive` or `~/Library/CloudStorage/GoogleDrive*`
- **iCloud Drive:** `~/Library/Mobile Documents/com~apple~CloudDocs`

If CWD is under cloud storage, display informational message (NOT a gate — seed runs before migration):

> "This project is on cloud storage ([service]). Seed markers will be planted here. After planting, use `localground-migration.md` to migrate, then `localground-reap.md` to verify markers survived."

If CWD is NOT under cloud storage, note it and continue without comment.

### 1.4 — Git repository check

If `git rev-parse --is-inside-work-tree` succeeds:
- Record HEAD commit hash: `git rev-parse HEAD` (full 40-character hash)
- Record branch name: `git branch --show-current`. If the result is empty (detached HEAD state — e.g., during a rebase or tag checkout), record branch as `(detached HEAD)` and continue. This does not affect marker creation.

If not a git repo:
- Note that git tag marker will be skipped
- Continue — the test file marker and manifest are still planted

### 1.5 — Existing marker detection (idempotency)

Check for existing markers before acting. Detection order:

1. Check for manifest: attempt to read `.localground-seed-manifest.json` in CWD using Claude Code's Read tool
2. If manifest exists: validate JSON, check `version` field
3. Check each marker:
   - Test file: does `.localground-seed-test` exist? If manifest exists, does its SHA-256 match the manifest value?
   - Git tag: does a tag matching `localground/seed/*` exist? If manifest exists, does the tag name match `markers.git_tag.name`?

**State matrix — action by combination:**

| Manifest | Test File | Git Tag | Action |
|----------|-----------|---------|--------|
| Missing | Missing | Missing | **Fresh seed** — proceed to Phase 2 to create all markers |
| Missing | Exists | Exists | **Anomaly** — markers present without manifest. Escalate: ask user if they want to generate a manifest for existing markers or start fresh |
| Missing | Exists | Missing | **Anomaly** — partial markers without manifest. Escalate: ask user if they want to generate a manifest for the existing test file or start fresh |
| Missing | Missing | Exists | **Anomaly** — partial markers without manifest. Escalate: ask user if they want to generate a manifest for the existing tag or start fresh |

"Start fresh" means overwrite the existing test file content and recreate the git tag pointing to the current HEAD commit. This does not delete any other project files.
| Present + valid | Matches | Matches | **Already seeded** — report "Project already seeded on [manifest.created]. All markers intact." Exit with summary, no further action. |
| Present + valid | Missing | Matches | **Partial damage** — proceed to Phase 2, restore test file only, update manifest |
| Present + valid | Matches | Missing | **Partial damage** — proceed to Phase 2, recreate git tag only (if git repo), update manifest |
| Present + valid | Missing | Missing | **Full damage** — both markers lost. Proceed to Phase 2, recreate all markers, update manifest |
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

Use Claude Code's Write tool to create `.localground-seed-test` in CWD with this **exact content** — do not compose at runtime, do not modify, do not add extra whitespace:

```
LocalGround Toolkit Seed Test File
Do not modify or delete until after running localground-reap.md.
Version: 1.0
```

The content is exactly three lines, each terminated by a single LF character (no CRLF). The file ends with a trailing newline after the third line. Encoding: UTF-8 with no BOM. Use Claude Code's Write tool — this guarantees consistent encoding and line endings across all platforms.

**Expected SHA-256 checksum:** `b530e9ad8cecd43e2fea05670c21bfed6c12457630f90d008c73ead24eaf8ece`
**Expected size:** 113 bytes (informational — SHA-256 checksum is the authoritative verification; size is documented for reference only)

### 2.2 — Verify test file checksum

Immediately after creation, verify the checksum using platform-specific commands:

**PowerShell:**
```powershell
(Get-FileHash -Algorithm SHA256 ".localground-seed-test").Hash.ToLower()
```

**bash (Linux / bash-on-Windows):**
```bash
sha256sum ".localground-seed-test" | cut -d' ' -f1
```

**bash (macOS):**
```bash
shasum -a 256 ".localground-seed-test" | cut -d' ' -f1
```

Compare the computed hash (case-insensitive) against the expected value: `b530e9ad8cecd43e2fea05670c21bfed6c12457630f90d008c73ead24eaf8ece`

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

   Both commands assume UTC time is available via the system clock. This is standard on all platforms where Claude Code runs.

2. Create the lightweight tag:
   ```bash
   git tag "localground/seed/[timestamp]" HEAD
   ```

3. Verify the tag was created:
   ```bash
   git tag -l "localground/seed/[timestamp]"
   ```
   Must return the tag name. If empty, creation failed — report error.

4. Record the full commit hash the tag points to:
   ```bash
   git rev-parse "localground/seed/[timestamp]"
   ```
   Must return a 40-character lowercase hex string. Store this value for the manifest.

### 2.4 — Compile marker results

Collect results from 2.1-2.3:
- Test file: path, SHA-256 (verified), size in bytes
- Git tag (if created): full tag name, full commit hash, tag type ("lightweight")

If any marker creation failed, note the failure. Proceed to Phase 3 with whatever markers were successfully created and verified — the manifest records only verified markers.

---

## Phase 3 — Manifest Generation

Write the JSON manifest recording all verified markers.

### 3.1 — Construct manifest JSON

Build the `.localground-seed-manifest.json` content matching this schema. Construct the JSON string in Claude Code and write it using the Write tool.

**Schema (exact structure — field names and types must match exactly):**

```json
{
  "version": "1.0",
  "toolkit_version": "2.0.0",
  "created": "[ISO 8601 UTC timestamp from shell — e.g., 2026-04-12T14:30:00Z]",
  "project_path": "[CWD path]",
  "project_name": "[basename of CWD]",
  "markers": {
    "test_file": {
      "type": "file",
      "path": ".localground-seed-test",
      "sha256": "b530e9ad8cecd43e2fea05670c21bfed6c12457630f90d008c73ead24eaf8ece",
      "size_bytes": 113,
      "content_description": "Static test file for verifying copy integrity after migration"
    },
    "git_tag": {
      "type": "git_tag",
      "name": "localground/seed/[timestamp]",
      "commit": "[full 40-char commit hash from Phase 2.3]",
      "tag_type": "lightweight"
    }
  }
}
```

Important:
- `version` is the manifest schema version (for forward compatibility if the schema changes). `toolkit_version` records which toolkit release planted the markers. The reap prompt uses `version` for schema compatibility and `toolkit_version` for toolkit lineage.
- The `created` timestamp uses real colons (ISO 8601 format) — only the tag name uses hyphens for filesystem compatibility
- The `project_path` field contains the full CWD path with proper JSON escaping (backslashes doubled on Windows — e.g., `C:\\Users\\rlasalle\\Projects\\OB1`). Claude Code's Write tool handles this automatically.
- The `commit` field MUST be the full 40-character hash (not the 7-character short hash). The reap prompt uses `git rev-parse` for comparison, which returns a full hash.
- If CWD is not a git repo, omit the `markers.git_tag` object entirely — do not include it with null values. The `markers` object will contain only `test_file`.
- Include only markers that were successfully created and verified in Phase 2.

### 3.2 — Write manifest

Use Claude Code's Write tool to write the manifest JSON to `.localground-seed-manifest.json` in CWD.

### 3.3 — Verify manifest

Read the manifest back using Claude Code's Read tool. Verify:
- Valid JSON (parseable)
- `version` field is `"1.0"`
- `markers.test_file.sha256` matches the expected checksum
- If git tag was created: `markers.git_tag.commit` is a 40-character hex string
- `project_path` matches CWD

If verification fails, report the specific discrepancy — do not silently continue.

---

## Phase 4 — Summary

Present what was planted and guide the user to next steps.

### 4.1 — Present summary

Display a summary of what was planted:

```
Seed markers planted:

  Test file: .localground-seed-test
    SHA-256: b530e9ad8cecd43e2fea05670c21bfed6c12457630f90d008c73ead24eaf8ece
    Size: 113 bytes
    Status: Verified

  [If git repo:]
  Git tag: localground/seed/[timestamp]
    Commit: [full hash]
    Type: lightweight
    Status: Verified

  [If not a git repo:]
  Git tag: Skipped (not a git repository)

  Manifest: .localground-seed-manifest.json
    Status: Written and verified
```

### 4.2 — Next steps

Display actionable next steps:

```
Next steps:
1. Migrate this project using `localground-migration.md`
2. After migration, verify markers survived using `localground-reap.md`

Do not delete the test file or manifest before migration — they are needed for post-migration verification.
```

---

## Definition of Done

This seed session is complete when:
- Environment detection identified the project, shell context, git status, and cloud-storage status
- Existing marker detection checked for prior seed runs (idempotency)
- Test file `.localground-seed-test` exists with verified SHA-256 checksum
- Git tag `localground/seed/<timestamp>` exists and points to verified commit (or was skipped with reason if not a git repo)
- `.localground-seed-manifest.json` exists with valid JSON recording all verified markers
- The user has been presented with a summary of planted markers and next steps

---

## Guardrails

- **Never modify existing project files.** The only filesystem writes are `.localground-seed-test`, `.localground-seed-manifest.json`, and the git tag. All three are new creates — never overwrites of existing project content.
- **Never assume paths.** Auto-detect first. If detection fails, report the failure and continue.
- **Platform-correct commands everywhere.** Every command must match the detected shell context. Verify before executing.
- **Proportional output.** Scale output to scope — this is a quick operation, keep terminal output concise.
- **The methodology is non-negotiable.** All phases run for every seed operation. No shortcuts, no skipped verification steps.
- **Handle known edge cases:**
  - **Not a git repo** — skip git tag, omit from manifest, continue with test file marker only
  - **Existing markers intact** — report "already seeded" and exit, no duplicate creation
  - **Partial markers** — restore missing markers, update manifest
  - **Test file content mismatch** — escalate to user before overwriting
  - **Write tool failure** — stop and report, do not fall back to shell-based file creation
  - **bash-on-Windows** — use platform-correct commands for SHA-256 verification
  - **SHA-256 case sensitivity** — compare checksums case-insensitively (PowerShell returns uppercase, bash tools return lowercase)
- **All cross-prompt references use `localground-reap.md`.** The post-migration verification prompt is always referenced by this filename — no other name.
