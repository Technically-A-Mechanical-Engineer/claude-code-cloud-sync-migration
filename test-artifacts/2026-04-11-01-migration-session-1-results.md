# Migration Session 1 Results

- **Date:** 2026-04-11
- **Source service:** OneDrive for Business
- **Source root:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\`
- **Target root:** `C:\Users\rlasalle\Migration-Project-Test1\`
- **Shell:** bash-on-Windows (Git Bash / MINGW64)
- **Copy tool:** robocopy (via MSYS_NO_PATHCONV=1)
- **Platform:** Windows 11 Enterprise 10.0.26200

---

## Folder 1: OB1

- **Source:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\OB1`
- **Target:** `C:\Users\rlasalle\Migration-Project-Test1\OB1`
- **Rename:** none
- **Source file count:** 5508
- **Target file count:** 5508
- **Count match:** YES
- **Symlinks in source:** none
- **Hidden dirs verified:** .git, .planning, .claude
- **Git repo:** yes
- **Git status:** dirty (modified .planning/STATE.md)
- **Git fsck:** pass (clean)
- **Git submodules:** none
- **Dubious ownership:** no
- **Path-hash (old):** `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-OB1` — has memory (20 files)
- **Robocopy exit code:** 1 (files copied successfully)
- **User confirmed:** yes

## Folder 2: Org-Open-Brain

- **Source:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\Org-Open-Brain`
- **Target:** `C:\Users\rlasalle\Migration-Project-Test1\Org-Open-Brain`
- **Rename:** none
- **Source file count:** 398
- **Target file count:** 398
- **Count match:** YES
- **Symlinks in source:** none
- **Hidden dirs verified:** .claude
- **Git repo:** no
- **Path-hash (old):** `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-Org-Open-Brain` — has memory (6 files)
- **Robocopy exit code:** 0
- **User confirmed:** yes

## Folder 3: QMS-Document-Processor

- **Source:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\QMS-Document-Processor`
- **Target:** `C:\Users\rlasalle\Migration-Project-Test1\QMS-Document-Processor`
- **Rename:** none
- **Source file count:** 2532
- **Target file count:** 2532
- **Count match:** YES
- **Symlinks in source:** none
- **Hidden dirs verified:** .git, .planning, .claude
- **Git repo:** yes
- **Git status:** dirty (modified .planning/config.json)
- **Git fsck:** pass (clean)
- **Git submodules:** none
- **Dubious ownership:** no
- **Path-hash (old):** `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-QMS-Document-Processor` — has memory (24 files)
- **Robocopy exit code:** 0
- **User confirmed:** yes

## Folder 4: QMS-Document-Processor-v1-Reference

- **Source:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\QMS-Document-Processor-v1-Reference`
- **Target:** `C:\Users\rlasalle\Migration-Project-Test1\QMS-Document-Processor-v1-Reference`
- **Rename:** none
- **Source file count:** 842
- **Target file count:** 842
- **Count match:** YES
- **Symlinks in source:** none
- **Hidden dirs verified:** none expected, none found
- **Git repo:** no
- **Path-hash (old):** none (no Claude Code settings for this folder)
- **Robocopy exit code:** 0
- **User confirmed:** yes (batch mode)

## Folder 5: R-Drive-NCM-Playground1

- **Source:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\R Drive NCM Playground1`
- **Target:** `C:\Users\rlasalle\Migration-Project-Test1\R-Drive-NCM-Playground1`
- **Rename:** spaces replaced with hyphens
- **Source file count:** 805
- **Target file count:** 805
- **Count match:** YES
- **Symlinks in source:** none
- **Hidden dirs verified:** .git, .planning
- **Git repo:** yes
- **Git status:** dirty (modified .planning/config.json)
- **Git fsck:** pass (clean)
- **Git submodules:** none
- **Dubious ownership:** no
- **Path-hash (old):** `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-R-Drive-NCM-Playground1` — has memory (12 files)
- **Robocopy exit code:** 0
- **User confirmed:** yes (batch mode)

## Folder 6: Claude-Home

- **Source:** `C:\Users\rlasalle\OneDrive - ThermoTek, Inc\Documents\Projects\Claude-Home`
- **Target:** `C:\Users\rlasalle\Migration-Project-Test1\Claude-Home`
- **Rename:** none
- **Source file count:** 2
- **Target file count:** 2
- **Count match:** YES
- **Symlinks in source:** none
- **Hidden dirs verified:** .claude
- **Git repo:** no
- **Path-hash (old):** `C--Users-rlasalle-OneDrive---ThermoTek--Inc-Documents-Projects-Claude-Home` — has memory (4 files)
- **Note:** Active working directory — copied last
- **Robocopy exit code:** 0
- **User confirmed:** yes (batch mode)

---

## Excluded Folders

The following folders were in the inventory but excluded by user request:

- 0106 ATP Relaunch / Robert Sandbox (Current Hotness subdirectory)
- 0246 2026 Management Review / RL_Claude Sandbox (Current Hotness subdirectory)
- 0037 Ultrasound Device Dev / RL_Claude_Sandbox (Current Hotness subdirectory)
- ATP_NTS_Test DATA (Desktop)
- Cowork_Test1 (Desktop)

## Migration Totals

- **Folders migrated:** 6
- **Total files copied:** 10,087
- **Total failures:** 0
- **Git repos:** 3 (all fsck pass)
- **All file counts match:** YES
