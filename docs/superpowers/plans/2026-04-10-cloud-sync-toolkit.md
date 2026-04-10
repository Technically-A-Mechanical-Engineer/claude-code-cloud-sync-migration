# Cloud-Sync Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the cloud-sync migration project into a three-prompt toolkit (migration v1.2.0, cleanup v1.0.0, verification v1.0.0) with updated supporting docs.

**Architecture:** Three independent markdown prompt files sharing design principles (five-dimension constraints, three-way shell detection, human/Claude sections). Each prompt auto-detects its environment and functions standalone. Prompts reference each other by filename but have no runtime dependencies.

**Tech Stack:** Markdown prompt files, Claude Code CLI, git, GitHub (gh CLI)

**Design Spec:** `docs/superpowers/specs/2026-04-10-cloud-sync-toolkit-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `claude-code-cloud-sync-migration.md` | Migration prompt — incorporate six findings for v1.2.0 |
| Create | `cloud-sync-cleanup.md` | Cleanup prompt v1.0.0 — dual-mode detection, phased deletion with confirmation |
| Create | `cloud-sync-verification.md` | Verification prompt v1.0.0 — audit-only, actionable recommendations |
| Modify | `cloud-sync-migration-dev-status.md` | Dev status — expand to cover all three prompts, add Finding 6 |
| Modify | `CLAUDE.md` | Update file map, project scope, architecture description |
| Modify | `README.md` | Update to describe toolkit, add compatibility note |
| Modify | `prompt-evaluation.md` | Expand evaluation scope for cleanup and verification prompts |

---

## Task 1: Update Migration Prompt to v1.2.0

**Files:**
- Modify: `claude-code-cloud-sync-migration.md`

This is the largest task — six findings applied to a single file. The findings touch different sections of the prompt, so they're grouped by which part of the prompt they modify.

- [ ] **Step 1: Read the current prompt in full**

Read `claude-code-cloud-sync-migration.md` end-to-end. Identify the exact sections that each finding modifies:
- Finding 1 (shell detection) → Phase 1.1
- Finding 2 (prior migration detection) → Crash Recovery section
- Finding 3 ("already done" branch) → new section after Phase 1, before Phase 2
- Finding 4 (artifact production) → tied to Finding 3's branch options
- Finding 5 (subdirectory migration) → Phase 3 and Phase 4
- Finding 6 (placeholder verification) → new step between Phase 2 and Phase 4 copy loop
- Phase 9 update → Phase 6 handoff / Session 2 Phase 9

- [ ] **Step 2: Apply Finding 1 — Three-way shell detection**

Replace the two-way OS branch in Phase 1.1 with three-way shell detection. The current text says:
- "Windows: Use PowerShell for all commands."
- "macOS/Linux: Use the user's default shell (bash/zsh)."

Replace with the three-way table from the design spec. Update all subsequent command blocks that currently branch on "Windows" vs "macOS/Linux" to branch on three shells instead. Key change: bash-on-Windows uses robocopy for copies but bash syntax for everything else.

Sections affected: Phase 1.1, Phase 2.1 (disk space check), Phase 2.5 (target directory), Phase 4.2 (copy), Phase 4.3 (symlinks), Phase 4.4 (file counts), Phase 4.5 (hidden dirs), Phase 4.6 (git), Guardrails.

- [ ] **Step 3: Apply Finding 2 — Multi-signal prior migration detection**

Replace the Crash Recovery section. Current text checks CWD for `migration-session-1-results.md` only. Replace with the four-signal priority cascade from the design spec. Each signal gets a confidence label. Signal 1 triggers automatic recovery. Signal 4 triggers a user question.

- [ ] **Step 4: Apply Finding 3 + Finding 4 — "Already done" branch with artifacts**

Add a new decision branch after Phase 1 completes when prior migration is detected. Present four options (quick verify, fresh re-run new target, fresh re-run same target, done). Each option specifies what executes and what artifact is produced.

This section goes between Phase 1.5 (present findings) and Phase 2 (pre-flight). If no prior migration is detected, flow continues to Phase 2 as before.

- [ ] **Step 5: Apply Finding 5 — Shared folder subdirectory migration**

Modify Phase 3 (Inventory and Naming) to add subdirectory detection. When a path-hash points to a subdirectory within a larger project folder, present the user with a choice: full copy or subdirectory only.

Modify Phase 4 verification to compare against the subdirectory source when subdirectory-only was selected.

Add a note to the Session 2 prompt generation (Phase 5) that Phase 8 reference searches should use the subdirectory path, not the parent.

- [ ] **Step 6: Apply Finding 6 — Pre-copy placeholder verification**

Add a new step between Phase 2 (pre-flight complete) and the Phase 4 copy loop. Before starting any copies, sample files in each source folder to verify they're actually local:
- Windows/OneDrive: `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` attribute
- macOS/iCloud: `.icloud` placeholder files
- Dropbox: Smart Sync placeholder attributes

If stubs detected, stop and direct user back to pre-flight step 2.3.

- [ ] **Step 7: Update Phase 9 reference in Session 2 generation**

In Phase 5 (generate Session 2 prompt), update the Phase 9 content to replace the manual cleanup bullet list with a reference to `cloud-sync-cleanup.md`:

> "When you're ready to clean up source folders and stale settings directories, paste `cloud-sync-cleanup.md` into Claude Code CLI."

Also update the Phase 6 handoff text to mention the cleanup prompt.

- [ ] **Step 8: Update version header**

Change line 2 from `**v1.1.1** | 2026-04-10` to `**v1.2.0** | YYYY-MM-DD` (use actual build date).

Update the human-readable section above the separator if any of the changes affect user-facing information (disk space note, compatibility note, testing instructions).

- [ ] **Step 9: Review v1.2.0 against design spec**

Read the updated prompt end-to-end. Cross-reference each of the six findings in the design spec against the prompt. Verify:
- Three-way shell detection is consistent throughout (no leftover two-way branches)
- Crash recovery uses the four-signal cascade
- "Already done" branch is reachable and all four options are specified
- Artifact production matches for each branch option
- Subdirectory migration appears in Phase 3 and Phase 4
- Placeholder verification appears before the copy loop
- Phase 9 references the cleanup prompt
- No orphaned references to old two-way OS logic

- [ ] **Step 10: Commit**

```bash
git add claude-code-cloud-sync-migration.md
git commit -m "Update migration prompt to v1.2.0

Incorporates six findings from v1.1.1 testing: three-way shell detection,
multi-signal prior migration detection, 'already done' branch with four
options, artifact production for all branches, shared folder subdirectory
migration, and pre-copy placeholder verification. Phase 9 now references
the cleanup prompt.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Build Cleanup Prompt v1.0.0

**Files:**
- Create: `cloud-sync-cleanup.md`

Build the complete cleanup prompt from the design spec. Follow the same file structure as the migration prompt: human-readable section above `---`, Claude instructions below.

- [ ] **Step 1: Write the human-readable section**

This section goes above the separator line. Include:
- Title and version: `# Cloud-Sync Cleanup for Claude Code Projects` / `**v1.0.0**`
- One-paragraph description of what this does
- Compatibility note: Requires Claude Code CLI
- Manual cleanup checklist covering all three categories:
  1. Stale path-hash directories under `~/.claude/projects/` (how to identify, how to delete)
  2. Orphan/undecodable path-hash entries (what they look like, safe to delete)
  3. Source folders on cloud storage (verify local copy first, then delete)
- Link back to the migration prompt for users who haven't migrated yet

- [ ] **Step 2: Write the Role section**

Below the separator. Same pattern as the migration prompt but tuned for cleanup:
- Cleanup assistant that removes stale artifacts from a prior cloud-sync migration
- Methodical, cautious with deletions, explicit about what will be removed
- Verifies before deleting, confirms every deletion individually
- Addresses the user directly at every confirmation gate

- [ ] **Step 3: Write Phase 1 — Environment Detection with dual-mode**

Reuse the migration prompt's environment detection pattern (OS, shell, cloud services, user profile path) with three-way shell detection.

Add dual-mode detection logic:
- Scan current path and `~/Projects/` for `migration-session-1-results.md` or `migration-session-2-results.md`
- If found: post-migration mode (read results, use as source of truth)
- If not found: standalone mode (scan `~/.claude/projects/` and cloud folders, classify, ask user)

Present findings summary. Confirm before proceeding.

- [ ] **Step 4: Write Phase 2 — Stale path-hash directories**

Scan `~/.claude/projects/` for entries that decode to cloud-synced paths. For each:
- Decode the path-hash name
- Check whether a local equivalent exists (e.g., cloud path maps to `~/Projects/[name]`)
- If local equivalent exists: present for deletion with both paths shown
- If no local equivalent: skip (this belongs in Phase 3 or is not stale)

Individual confirmation per deletion. Log each deletion to running cleanup log.

- [ ] **Step 5: Write Phase 3 — Orphan path-hash directories**

Scan `~/.claude/projects/` for entries that are undecodable (`C--`, `R--`, etc.) or decode to paths that no longer exist on disk.

Present each with classification. Individual confirmation per deletion. Log each.

- [ ] **Step 6: Write Phase 4 — Source folders on cloud storage**

Only runs after Phases 2-3 complete. For each cloud-synced source folder:
- Verify local copy exists at the target path
- Run health check on local copy (file counts, git fsck if applicable, hidden dirs)
- Compare file counts between source and local
- If healthy: present for deletion with comparison data
- If unhealthy or local copy missing: skip with warning

Soak-period check at the start of Phase 4:
> "Source folder deletion is safest after a soak period of normal use at the new paths. How long have you been using the local paths?"
If less than a few days, recommend deferring Phase 4 (soft recommendation, user can override).

Individual confirmation per deletion. Log each.

- [ ] **Step 7: Write Phase 5 — Report**

Write `cleanup-results.md` at the current path. Include:
- Timestamp and mode (post-migration or standalone)
- Items deleted (with original paths)
- Items skipped (with reason)
- Items deferred (source folders if soak period was insufficient)
- Recommended next steps (run verification prompt if desired)

- [ ] **Step 8: Write Operating Constraints section**

Five-dimension constraint model tuned for deletion:
- Must: verify before delete, individual confirmation, write log
- Must-not: no deletion without verified local copy, no batch deletions
- Prefer: low-risk items first (path-hash dirs before source folders)
- Escalate: source folder has files not in local copy
- Recover: cleanup log tracks progress, re-run detects partial state

Include the graceful cross-prompt state principle: interpret missing path-hash directories as possible prior cleanup, not corruption.

- [ ] **Step 9: Write Guardrails section**

Platform-correct commands, proportional output, methodology non-negotiable. Match the migration prompt's guardrail structure but tuned for a deletion-focused workflow.

- [ ] **Step 10: Review cleanup prompt against design spec**

Read the complete prompt end-to-end. Cross-reference against the design spec's Cleanup Prompt section. Verify:
- Dual-mode detection works for both triggers
- All five phases are present and complete
- Constraint architecture covers all five dimensions
- Manual steps section exists in human-readable area
- Three-way shell detection is consistent
- Soak-period check is present in Phase 4
- Cross-prompt state principle is included
- No references to migration-specific concepts that wouldn't apply in standalone mode

- [ ] **Step 11: Commit**

```bash
git add cloud-sync-cleanup.md
git commit -m "Add cleanup prompt v1.0.0

Dual-mode cleanup prompt for removing stale path-hash directories, orphan
entries, and source folders after cloud-sync migration. Works in post-migration
mode (using migration artifacts) or standalone mode (auto-detection). Individual
confirmation on every deletion, health verification before source folder removal.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Build Verification Prompt v1.0.0

**Files:**
- Create: `cloud-sync-verification.md`

Build the complete verification prompt from the design spec. Audit-only — no actions, no deletions, no modifications.

- [ ] **Step 1: Write the human-readable section**

Above the separator:
- Title and version: `# Cloud-Sync Verification for Claude Code Projects` / `**v1.0.0**`
- One-paragraph description: audits your Claude Code project environment and reports findings
- Compatibility note: Requires Claude Code CLI
- What it checks (brief list): project health, path-hash integrity, stale references
- What it does NOT do: no modifications, no deletions, no migrations
- When to use it: after migration, after cleanup, or as a standalone health check

- [ ] **Step 2: Write the Role section**

Below the separator. Verification/audit assistant:
- Audits the current Claude Code project environment
- Reports findings with actionable recommendations
- Never modifies, deletes, or creates anything except the report file
- Addresses the user clearly about what it found

- [ ] **Step 3: Write Phase 1 — Environment Detection**

Same three-way shell detection pattern. Detect OS, shell, cloud services, user profile path.

No dual-mode needed — this prompt always does the same thing regardless of migration history. But it should note whether migration artifacts exist (adds context to findings).

Present environment summary. No confirmation gate needed (this is informational, not actioning).

- [ ] **Step 4: Write Phase 2 — Project Health Audit**

For each directory under `~/Projects/` (or user-specified path):
- Check if it's a git repo (`.git` directory exists)
- If git: run `git fsck --no-dangling`, `git status`, check for dubious ownership warnings
- Check hidden directories (`.git`, `.claude`, `.planning`, `.vscode`)
- File count
- Symlink check
- Check for cloud-sync artifacts (`.icloud` files, OneDrive attributes)

Collect results into a table. Progress status for large scans: "Checking project N of M: [name]..."

- [ ] **Step 5: Write Phase 3 — Path-Hash Audit**

Scan `~/.claude/projects/`:
- Decode each entry using the path-hash rules
- Classify: valid (decoded path exists), stale (decoded path is cloud-synced with local equivalent), orphan (decoded path doesn't exist), undecodable
- For valid entries: check contents (has memory, settings only, empty)
- Note any entries that appear to have been cleaned up (referenced in migration artifacts but no longer present — graceful cross-prompt state)

Present classification table.

- [ ] **Step 6: Write Phase 4 — Reference Audit**

Search for cloud-synced path strings across:
- CLAUDE.md files (root and per-project)
- Memory files in `~/.claude/projects/*/memory/`
- Settings files in `~/.claude/projects/*/`
- `.gitconfig` safe.directory entries

Report all matches with file path and line number.

Progress status: "Searching N files across M projects..."

- [ ] **Step 7: Write Phase 5 — Report with actionable recommendations**

Write `verification-report.md` at the current path. Include:
- Timestamp and environment summary
- Project health table (from Phase 2)
- Path-hash classification table (from Phase 3)
- Reference audit matches (from Phase 4)
- Actionable recommendations table mapping each finding type to a concrete next step (from design spec)
- Overall assessment: clean / issues found / action recommended

- [ ] **Step 8: Write Operating Constraints section**

Lighter than the other prompts since this one doesn't modify anything:
- Must: report all findings, write report file, provide actionable recommendations
- Must-not: never modify, delete, or create anything except the report file
- Prefer: group findings by severity (issues needing action vs. informational observations)
- Escalate: if the `~/.claude/projects/` structure looks fundamentally different from expected (possible CLI version change), note it prominently
- Recover: not applicable (no state to recover — re-run produces a fresh report)

Include overlap note: this prompt intentionally overlaps with the migration prompt's quick-verify branch.

- [ ] **Step 9: Review verification prompt against design spec**

Read the complete prompt end-to-end. Cross-reference against the design spec's Verification Prompt section. Verify:
- All five phases present and complete
- No actions taken (only reporting)
- Actionable recommendations table matches the design spec
- Progress status signals present for long-running phases
- Overlap acknowledgment with migration prompt's quick verify
- Three-way shell detection consistent
- Graceful cross-prompt state principle applied (missing path-hash dirs noted as possible cleanup)

- [ ] **Step 10: Commit**

```bash
git add cloud-sync-verification.md
git commit -m "Add verification prompt v1.0.0

Audit-only prompt that checks project health, path-hash integrity, and
stale references. Reports findings with actionable recommendations pointing
to the migration or cleanup prompts. No modifications, no deletions.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Update Supporting Documents

**Files:**
- Modify: `cloud-sync-migration-dev-status.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update dev status report**

Read `cloud-sync-migration-dev-status.md`. Add:
- Finding 6 (pre-copy placeholder verification) to the v1.2.0 requirements section
- Note that Finding 6 originated from the design brainstorm, not field testing
- Expand the "Next Steps" section to reflect the three-prompt build sequence
- Add sections for cleanup prompt v1.0.0 and verification prompt v1.0.0 (version history, initial requirements, testing plans)
- Update the testing plan to cover all three prompts

Do NOT remove or modify the existing v1.1.1 test execution results or the five original findings — they're historical record.

- [ ] **Step 2: Update CLAUDE.md**

Read `CLAUDE.md`. Update:
- "What This Is" — change from "single-file prompt" to "three-prompt toolkit"
- "Current State" — update version info, add cleanup and verification prompt status
- "File Map" — add entries for `cloud-sync-cleanup.md`, `cloud-sync-verification.md`, and `docs/` directory
- "Architecture" section — add overview of the three-prompt relationship, shared design principles
- "Design Principles" — add cross-references, graceful cross-prompt state, compatibility note
- Keep "Development Workflow" and "Rules" sections, update as needed

- [ ] **Step 3: Update README.md**

Read `README.md`. Update:
- Title or subtitle to reflect toolkit (not just migration)
- Add compatibility note prominently: "Requires Claude Code CLI (terminal or IDE extension). Does not work in claude.ai web, Claude desktop app, or Cowork mode."
- "What This Does" — expand to describe all three prompts
- "How to Use It" — add sections for cleanup and verification prompts
- "Current Version" — list all three prompts with their versions
- "Design Principles" — add the shared principles from the design spec
- Keep existing content structure, expand rather than rewrite

- [ ] **Step 4: Review supporting docs against design spec**

Read all three updated files. Verify:
- File map in CLAUDE.md matches actual file structure
- README compatibility note matches design spec language
- Dev status report has Finding 6 documented
- All three prompts are referenced consistently across all supporting docs
- No stale references to "single-file prompt" or "single prompt" remain

- [ ] **Step 5: Commit**

```bash
git add cloud-sync-migration-dev-status.md CLAUDE.md README.md
git commit -m "Update supporting docs for three-prompt toolkit

Expands dev status report with Finding 6 and cleanup/verification prompt
tracking. Updates CLAUDE.md file map and architecture for toolkit scope.
Adds compatibility note and toolkit description to README.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Framework Evaluation

**Files:**
- Modify: `prompt-evaluation.md`

This task runs after Tasks 1-4 are complete. Evaluate each prompt against the eight Nate's Executive Circle frameworks.

- [ ] **Step 1: Evaluate v1.2.0 migration prompt**

Run the eight-framework evaluation against the updated `claude-code-cloud-sync-migration.md`. Focus review effort on the new sections (shell detection, branch logic, placeholder verification) since the rest was already validated at v1.1.1.

Use the Nate's Executive Circle MCP connector to pull framework criteria:
- Specification Engineer
- Constraint Architecture
- Self-Contained Problem Statement
- First Agent Task
- Footgun Detector
- Loop Designer
- Agent Architecture Audit / Day One Primitives
- Agent-Readiness Audit

Record findings in `prompt-evaluation.md` under a v1.2.0 section.

- [ ] **Step 2: Evaluate cleanup prompt v1.0.0**

Run the same eight-framework evaluation against `cloud-sync-cleanup.md`. This is a first evaluation — review all sections, not just deltas.

Record findings in `prompt-evaluation.md` under a cleanup v1.0.0 section.

- [ ] **Step 3: Evaluate verification prompt v1.0.0**

Run the same eight-framework evaluation against `cloud-sync-verification.md`. First evaluation — review all sections.

Record findings in `prompt-evaluation.md` under a verification v1.0.0 section.

- [ ] **Step 4: Address any findings**

If any evaluation produces critical or moderate findings, fix them in the affected prompt file before proceeding. Commit fixes separately from the evaluation write-up.

- [ ] **Step 5: Commit evaluation**

```bash
git add prompt-evaluation.md
git commit -m "Add framework evaluation for v1.2.0 and new prompts

Evaluates migration v1.2.0, cleanup v1.0.0, and verification v1.0.0
against eight Nate's Executive Circle prompt frameworks.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Git Tags and Push

**Files:** None (git operations only)

- [ ] **Step 1: Tag releases**

```bash
git tag -a migration-v1.2.0 -m "Migration prompt v1.2.0"
git tag -a cleanup-v1.0.0 -m "Cleanup prompt v1.0.0"
git tag -a verification-v1.0.0 -m "Verification prompt v1.0.0"
```

- [ ] **Step 2: Push to GitHub**

```bash
git push origin master --tags
```

- [ ] **Step 3: Verify on GitHub**

```bash
gh repo view --web
```

Confirm all files are present, tags are visible, README renders correctly with the toolkit description and compatibility note.

---

## Execution Notes

- **Tasks 1, 2, 3 are independent** — they modify/create different files and can be executed in parallel by separate subagents. Task 4 depends on Tasks 1-3 (needs final filenames and versions). Task 5 depends on Tasks 1-4 (evaluates the built prompts). Task 6 depends on Task 5.
- **The migration prompt (Task 1) is the most complex** — six findings touching multiple sections of a 540-line file. Allow extra review time.
- **The cleanup and verification prompts (Tasks 2-3) are built from scratch** using the design spec as the blueprint. They should reference the migration prompt's patterns (constraint architecture format, phase structure, command blocks) for consistency but not copy verbatim.
- **Testing is separate from this plan.** Each prompt has a testing plan documented in the dev status report. Testing happens after the build-evaluate cycle, in a dedicated Claude Code session, using the actual test procedures (paste prompt, run through phases, verify results).
