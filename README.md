# Cloud-Sync Migration for Claude Code Projects

A single-file prompt that migrates Claude Code project folders from cloud-synced storage (OneDrive, Dropbox, Google Drive, iCloud) to local paths.

## The Problem

Working in cloud-synced folders causes git errors, file lock failures, and sync conflicts in Claude Code. OneDrive and Dropbox try to sync `.git` internals and Claude Code's settings directories, which breaks things in ways that are hard to diagnose.

## What This Does

You paste the prompt file into Claude Code CLI. It:

1. Auto-detects your OS, shell, cloud sync provider, and folder layout
2. Walks you through a phased migration with verification at every step
3. Copies your project folders to a local path (never deletes the originals)
4. Generates a Session 2 continuation prompt to migrate settings and update path references

The whole process takes 30-60 minutes depending on how many folders you're moving. You confirm at every step — nothing runs unattended.

## Who This Is For

Claude Code users who launched their projects from a OneDrive, Dropbox, Google Drive, or iCloud-synced folder and are now hitting git or file system errors.

## How to Use It

1. Download [`claude-code-cloud-sync-migration.md`](claude-code-cloud-sync-migration.md)
2. Open Claude Code CLI from your current (cloud-synced) project folder
3. Copy the entire contents of the file and paste it as your first message
4. Follow the prompts — Claude Code handles the rest

Session 1 copies your folders and generates a Session 2 prompt file. You then restart Claude Code from the new local path and paste the Session 2 prompt to finish up.

## Current Version

**v1.1.1** (2026-04-10) — Release candidate. Passed evaluation against eight prompt engineering frameworks.

See [dev-status-migration.md](dev-status-migration.md) for version history, known findings, and testing plans.

## Platform Support

- Windows (PowerShell / Git Bash)
- macOS (zsh/bash)
- Linux (bash)

## Design Principles

- **No deletions ever.** Source folders stay untouched. You clean up manually after confirming everything works.
- **Auto-detect first, ask second.** If it can be determined from the filesystem, the prompt doesn't ask.
- **One file, one paste.** No installation, no dependencies, no plugins.

## License

MIT
