# v3.0.0 Brainstorm Context

**Captured:** 2026-04-12
**Source:** Conversation during v2.0.0 audit gap remediation
**Status:** Discussion notes — not yet formalized into requirements

---

## Problem Statement

The v2.0.0 toolkit is 5 paste-and-run markdown prompts totaling ~3,400 lines. The "one file, one paste" design forces massive duplication of deterministic logic across all prompts — shell detection, cloud service detection, path-hash decoding, file verification, and platform-specific command branching are each reimplemented in every prompt. The independent NEC evaluation found 46 findings, most of which stemmed from ambiguity in deterministic operations that code would handle without ambiguity.

## Key Decision: Hybrid Architecture

Extract deterministic logic into a CLI/MCP tool. Keep prompts (now skills) focused on what LLMs are good at — user interaction, judgment calls, and natural language reporting.

### What moves to the tool (deterministic)

- Environment detection (OS, shell, cloud service, project inventory)
- Path-hash decoding (biggest source of NEC findings)
- Seed planting (file write + checksum + git tag + manifest)
- File copying + verification (robocopy/rsync + integrity checks)
- Placeholder detection (Files On-Demand, Smart Sync, etc.)
- Reap verification (checksum comparison, git tag check)
- Health checks (git fsck, file counts, stale reference scanning)

### What stays in skills/prompts (judgment + interaction)

- User interaction at confirmation gates
- Report generation (natural language findings + recommendations)
- Session 2 prompt generation (context-aware text generation)
- Cleanup decisions ("is this stale?" requires user judgment)
- Adaptive error handling (Escalate/Recover dimensions)

## Distribution: npm/npx

Every Claude Code user has Node.js. `npx` is zero-install:
- `npx @localground/cli seed` — standalone CLI usage
- `claude mcp add localground -- npx -y @localground/mcp` — MCP integration

One npm package (or monorepo with two packages), two interfaces.

## Primary Integration: MCP Server

MCP is the recommended primary interface because:
- No context switching — everything happens inside Claude Code
- Claude Code manages server lifecycle automatically
- Tools are discoverable — Claude Code sees `localground_detect`, `localground_seed`, etc.
- Prompts/skills become thin orchestrators (~50-100 lines instead of 400-980)

User setup is one command:
```bash
claude mcp add localground -- npx -y @localground/mcp
```

## Secondary Interface: Standalone CLI

Same tool logic, different entry point:
```bash
npx @localground/cli seed
npx @localground/cli audit
```

For users who want to run operations outside Claude Code, or for scripting.

## Proposed Repo Structure

```
localground/                    # renamed repo
├── packages/
│   ├── mcp/                    # MCP server (Node.js/TypeScript)
│   │   ├── src/
│   │   │   ├── tools/          # localground_detect, _seed, _reap, etc.
│   │   │   ├── lib/            # shared: path-hash, cloud-detect, shell-detect
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                    # standalone CLI (shares lib/ with MCP)
│       ├── src/
│       └── package.json
├── skills/                     # Claude Code skills (thin orchestrators)
│   ├── localground-migrate/
│   ├── localground-seed/
│   ├── localground-reap/
│   ├── localground-cleanup/
│   └── localground-verify/
├── prompts/                    # v2.0.0 paste-and-run (legacy/fallback)
│   ├── localground-seed.md
│   ├── localground-migration.md
│   ├── localground-reap.md
│   ├── localground-cleanup.md
│   └── localground-verification.md
├── docs/
└── package.json                # monorepo root
```

## Prompt/Skill Replacement Mapping

| v2 Prompt | v3 Approach | Rationale |
|---|---|---|
| Seed | Mostly CLI/MCP — minimal skill | Fully deterministic, minimal user interaction |
| Migration | Skill + MCP tools | Needs confirmation gates, Session 2 generation |
| Reap | Mostly CLI/MCP — minimal skill | Deterministic checks, report presentation |
| Cleanup | Skill + MCP tools | Needs per-deletion confirmation, user judgment |
| Verification | Mostly CLI/MCP — minimal skill | Deterministic audit, report generation |

## Testing Strategy Change

- Deterministic code (MCP/CLI) gets automated tests — pytest/jest, runnable in CI via GitHub Actions
- Skills get manual testing, but the surface area is dramatically smaller
- v2.0.0's "no live testing" audit gap becomes a sustainable automated test suite

## Backward Compatibility

- v2.0.0 paste-and-run prompts move to `prompts/` directory and remain functional
- They are not deleted — they're the no-install fallback
- v3.0.0 skills require the MCP server (hard dependency, not soft)

## Open Questions

1. TypeScript or plain JavaScript for the MCP server?
2. Monorepo tooling — npm workspaces, turborepo, or simple shared directory?
3. Should `localground audit` (verification) be something users run regularly, not just post-migration? (This affects whether the tool has ongoing value beyond the one-time migration.)
4. Repo rename timing — do it at v3 start or after v3 ships?
5. Should the MCP server handle the migration copy itself, or delegate to robocopy/rsync and just verify?

## User Context

- Project owner is not a developer — uses Claude Code as a workflow automation tool
- Has GSD framework installed for project management
- Getting comfortable with GitHub (pushes, PRs, merges)
- Has never built an MCP server before
- Active regulatory universe (ISO 13485, FDA QMSR, etc.) — quality mindset informs approach
