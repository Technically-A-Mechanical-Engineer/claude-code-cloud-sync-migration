// packages/cli/src/index.ts
// @localground/cli — Standalone CLI for LocalGround Toolkit
// Calls @localground/core directly (D-05). Does NOT go through MCP server.

import { Command } from 'commander';
import path from 'node:path';
import {
  detect, seed, verify, gitCheck, placeholderDetect, detectPlatform,
  isPathCloudSynced, decode, classify, compare,
} from '@localground/core';
import type { EnvironmentInfo, Success, PathHashEntry } from '@localground/core';
import { formatKeyValue, formatTable, formatSummary, formatError, formatStatus, EXIT_SUCCESS, EXIT_FAILURE, EXIT_ERROR } from './format.js';

const program = new Command();

program
  .name('localground')
  .description('LocalGround Toolkit — migrate Claude Code projects off cloud-synced storage')
  .version('3.0.0')
  .option('--json', 'Output as JSON instead of human-readable text');

// --- detect ---
program
  .command('detect')
  .description('Detect environment: OS, shell, cloud sync status, projects, path-hashes')
  .action(async () => {
    const result = await detect();
    const jsonMode = program.opts().json;

    if (!result.success) {
      if (jsonMode) {
        console.log(JSON.stringify({ success: false, reason: result.reason, detail: result.detail }, null, 2));
      } else {
        console.error(formatError(result.reason, result.detail));
      }
      process.exit(EXIT_ERROR);
    }

    if (jsonMode) {
      console.log(JSON.stringify(result.data, null, 2));
      process.exit(EXIT_SUCCESS);
    }

    const env = result.data;
    const output = formatKeyValue([
      ['OS', `${env.platform.platform} (${env.platform.shell})`],
      ['Home', env.platform.homeDir],
      ['Cloud sync', env.cloud.service === 'none' ? 'None detected' : `${env.cloud.service} (${env.cloud.syncRoot ?? 'unknown root'})`],
      ['Cloud synced', env.cloud.isCloudSynced ? 'Yes' : 'No'],
      ['Projects', env.projects.length > 0 ? `${env.projects.length} discovered` : 'None discovered'],
      ['Path-hashes', `${env.pathHashes.length} entries in ${env.claudeConfigDir}`],
    ]);
    console.log(output);

    if (env.projects.length > 0) {
      console.log('\nProjects:');
      for (const p of env.projects) {
        const cloudLabel = p.isCloudSynced ? ` [${p.cloudService}]` : '';
        console.log(`  ${p.name}${cloudLabel}: ${p.path}`);
      }
    }

    if (env.pathHashes.length > 0) {
      console.log('\nPath-hash entries:');
      for (const h of env.pathHashes) {
        const decoded = h.decodedPath ?? '(undecodable)';
        const existsLabel = h.exists ? '' : ' [missing]';
        console.log(`  ${h.hashDirName} -> ${decoded}${existsLabel}`);
      }
    }

    process.exit(EXIT_SUCCESS);
  });

// --- seed ---
program
  .command('seed')
  .description('Plant verifiable markers in a project before migration')
  .argument('<projectPath>', 'Absolute path to the project directory')
  .action(async (projectPath: string) => {
    const jsonMode = program.opts().json;

    if (!path.isAbsolute(projectPath)) {
      const msg = 'projectPath must be an absolute path';
      if (jsonMode) {
        console.log(JSON.stringify({ success: false, reason: 'invalid_argument', detail: msg }, null, 2));
      } else {
        console.error(formatError('invalid_argument', msg));
      }
      process.exit(EXIT_ERROR);
    }

    const result = await seed(projectPath);

    if (!result.success) {
      if (jsonMode) {
        console.log(JSON.stringify({ success: false, reason: result.reason, detail: result.detail }, null, 2));
      } else {
        console.error(formatError(result.reason, result.detail));
      }
      process.exit(EXIT_ERROR);
    }

    if (jsonMode) {
      console.log(JSON.stringify(result.data, null, 2));
      process.exit(EXIT_SUCCESS);
    }

    const manifest = result.data;
    console.log(formatKeyValue([
      ['Project', manifest.projectName],
      ['Path', manifest.projectPath],
      ['Markers', `${manifest.markers.length} planted`],
      ['Manifest', `${projectPath}/.localground-seed-manifest.json`],
    ]));
    console.log('\nMarkers:');
    for (const m of manifest.markers) {
      if (m.type === 'test-file') {
        console.log(`  ${formatStatus('PASS')}  Test file: ${m.path} (checksum: ${m.checksum?.slice(0, 12)}...)`);
      } else if (m.type === 'git-tag') {
        console.log(`  ${formatStatus('PASS')}  Git tag: ${m.tag} (commit: ${m.commitHash?.slice(0, 8)})`);
      }
    }

    process.exit(EXIT_SUCCESS);
  });

// --- copy ---
program
  .command('copy')
  .description('Copy a project directory to a local path')
  .argument('<source>', 'Absolute path to the source project directory')
  .argument('<target>', 'Absolute path to the target directory (must not exist)')
  .action(async (_source: string, _target: string) => {
    console.log('copy: not yet implemented (14-04)');
  });

// --- verify ---
program
  .command('verify')
  .description('Verify seed markers against manifest')
  .argument('<projectPath>', 'Absolute path to the project directory')
  .option('--manifest <path>', 'Path to seed manifest JSON (defaults to .localground-seed-manifest.json in projectPath)')
  .action(async (projectPath: string, options: { manifest?: string }) => {
    const jsonMode = program.opts().json;

    if (!path.isAbsolute(projectPath)) {
      const msg = 'projectPath must be an absolute path';
      if (jsonMode) {
        console.log(JSON.stringify({ success: false, reason: 'invalid_argument', detail: msg }, null, 2));
      } else {
        console.error(formatError('invalid_argument', msg));
      }
      process.exit(EXIT_ERROR);
    }

    const result = await verify(projectPath, options.manifest);

    if (!result.success) {
      if (jsonMode) {
        console.log(JSON.stringify({ success: false, reason: result.reason, detail: result.detail }, null, 2));
      } else {
        console.error(formatError(result.reason, result.detail));
      }
      process.exit(EXIT_ERROR);
    }

    if (jsonMode) {
      console.log(JSON.stringify(result.data, null, 2));
      process.exit(EXIT_SUCCESS);
    }

    const rows = result.data.results.map((r) => ({
      status: r.passed ? 'PASS' as const : 'FAIL' as const,
      label: r.marker.type === 'test-file' ? `Test file checksum` : `Git tag ${r.marker.tag ?? ''}`,
      detail: r.detail,
    }));

    console.log(formatTable(rows));
    console.log('');
    console.log(formatSummary(rows));

    process.exit(result.data.allPassed ? EXIT_SUCCESS : EXIT_FAILURE);
  });

// --- reap ---
program
  .command('reap')
  .description('Post-migration health check: verify markers + 6-check health assessment')
  .argument('<projectPath>', 'Absolute path to the project directory')
  .option('--manifest <path>', 'Path to seed manifest JSON')
  .option('--source <path>', 'Original source path for source/target comparison')
  .action(async (projectPath: string, options: { manifest?: string; source?: string }) => {
    const jsonMode = program.opts().json;

    if (!path.isAbsolute(projectPath)) {
      const msg = 'projectPath must be an absolute path';
      if (jsonMode) {
        console.log(JSON.stringify({ success: false, reason: 'invalid_argument', detail: msg }, null, 2));
      } else {
        console.error(formatError('invalid_argument', msg));
      }
      process.exit(EXIT_ERROR);
    }

    interface CheckRow {
      check: string;
      status: 'PASS' | 'WARN' | 'FAIL' | 'N/A';
      detail: string;
    }

    const checks: CheckRow[] = [];
    const platformResult = detectPlatform();
    const platform = platformResult.success ? platformResult.data.platform : 'linux';

    // Check 1: Git integrity
    try {
      const gitResult = await gitCheck(projectPath);
      if (!gitResult.success) {
        checks.push({ check: 'git_integrity', status: 'FAIL', detail: `${gitResult.reason}: ${gitResult.detail}` });
      } else {
        const g = gitResult.data;
        if (!g.fsck.passed) {
          checks.push({ check: 'git_integrity', status: 'FAIL', detail: `git fsck failed: ${g.fsck.output}` });
        } else if (!g.status.clean || g.dubiousOwnership) {
          checks.push({ check: 'git_integrity', status: 'WARN', detail: g.dubiousOwnership ? 'Dubious ownership detected' : `Uncommitted changes: ${g.status.output}` });
        } else {
          checks.push({ check: 'git_integrity', status: 'PASS', detail: `Branch: ${g.branch}, commit: ${g.commitHash.slice(0, 8)}` });
        }
      }
    } catch (err: unknown) {
      checks.push({ check: 'git_integrity', status: 'FAIL', detail: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
    }

    // Check 2: Placeholder files
    try {
      const phResult = await placeholderDetect(projectPath, platform);
      if (!phResult.success) {
        checks.push({ check: 'placeholder_files', status: 'FAIL', detail: `${phResult.reason}: ${phResult.detail}` });
      } else if (phResult.data.hasPlaceholders) {
        checks.push({ check: 'placeholder_files', status: 'WARN', detail: `${phResult.data.placeholderCount} placeholder files detected (${phResult.data.percentage.toFixed(1)}% of ${phResult.data.totalFiles} files)` });
      } else {
        checks.push({ check: 'placeholder_files', status: 'PASS', detail: `No placeholder files detected in ${phResult.data.totalFiles} files` });
      }
    } catch (err: unknown) {
      checks.push({ check: 'placeholder_files', status: 'FAIL', detail: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
    }

    // Check 3: Cloud sync status (uses detect())
    const envResult = await detect();
    try {
      if (!envResult.success) {
        checks.push({ check: 'cloud_sync', status: 'FAIL', detail: `${envResult.reason}: ${envResult.detail}` });
      } else {
        const synced = isPathCloudSynced(projectPath, envResult.data.cloud.syncRoot);
        if (synced) {
          checks.push({ check: 'cloud_sync', status: 'WARN', detail: `Project is on cloud-synced storage (${envResult.data.cloud.service})` });
        } else {
          checks.push({ check: 'cloud_sync', status: 'PASS', detail: 'Project is on local (non-cloud-synced) storage' });
        }
      }
    } catch (err: unknown) {
      checks.push({ check: 'cloud_sync', status: 'FAIL', detail: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
    }

    // Check 4: Path-hash validity (uses detect() + decode() + classify())
    try {
      if (!envResult.success) {
        checks.push({ check: 'path_hash_validity', status: 'FAIL', detail: `${envResult.reason}: ${envResult.detail}` });
      } else {
        const decoded = await Promise.all(
          envResult.data.pathHashes.map((h) => decode(h.hashDirName))
        );
        const projectEntries = decoded
          .filter((r): r is Success<PathHashEntry> =>
            r.success && r.data.decodedPath !== null &&
            r.data.decodedPath.toLowerCase() === projectPath.toLowerCase()
          )
          .map((r) => r.data);

        if (projectEntries.length === 0) {
          checks.push({ check: 'path_hash_validity', status: 'PASS', detail: 'No path-hash entries found for this project path' });
        } else {
          const classifications = await Promise.all(projectEntries.map((entry) => classify(entry)));
          const stale = classifications.filter((c) => c.success && c.data.classification === 'stale');
          const orphan = classifications.filter((c) => c.success && c.data.classification === 'orphan');
          if (stale.length > 0 || orphan.length > 0) {
            checks.push({ check: 'path_hash_validity', status: 'WARN', detail: `Found ${stale.length} stale and ${orphan.length} orphan path-hash entries` });
          } else {
            checks.push({ check: 'path_hash_validity', status: 'PASS', detail: `${projectEntries.length} valid path-hash entries` });
          }
        }
      }
    } catch (err: unknown) {
      checks.push({ check: 'path_hash_validity', status: 'FAIL', detail: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
    }

    // Check 5: Seed markers (N/A if no manifest)
    try {
      const verifyResult = await verify(projectPath, options.manifest);
      if (!verifyResult.success) {
        if (verifyResult.reason === 'manifest_not_found') {
          checks.push({ check: 'seed_markers', status: 'N/A', detail: 'No seed manifest found — seed was not run for this project' });
        } else {
          checks.push({ check: 'seed_markers', status: 'FAIL', detail: `${verifyResult.reason}: ${verifyResult.detail}` });
        }
      } else if (verifyResult.data.allPassed) {
        checks.push({ check: 'seed_markers', status: 'PASS', detail: `All ${verifyResult.data.results.length} markers verified` });
      } else {
        const failed = verifyResult.data.results.filter((r) => !r.passed);
        checks.push({ check: 'seed_markers', status: 'FAIL', detail: `${failed.length} of ${verifyResult.data.results.length} markers failed verification` });
      }
    } catch (err: unknown) {
      checks.push({ check: 'seed_markers', status: 'FAIL', detail: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
    }

    // Check 6: Source/target alignment (N/A if no --source)
    if (!options.source) {
      checks.push({ check: 'source_target_alignment', status: 'N/A', detail: 'No --source path provided — cannot compare source and target' });
    } else {
      try {
        const compareResult = await compare(options.source, projectPath);
        if (!compareResult.success) {
          checks.push({ check: 'source_target_alignment', status: 'FAIL', detail: `${compareResult.reason}: ${compareResult.detail}` });
        } else {
          const c = compareResult.data;
          if (c.fileCountMatch && c.sizeMatch) {
            checks.push({ check: 'source_target_alignment', status: 'PASS', detail: `Source and target match: ${c.source.fileCount} files, ${c.source.totalSize} bytes` });
          } else {
            const mismatches: string[] = [];
            if (!c.fileCountMatch) mismatches.push(`file count: source=${c.source.fileCount} vs target=${c.target.fileCount}`);
            if (!c.sizeMatch) mismatches.push(`size: source=${c.source.totalSize} vs target=${c.target.totalSize}`);
            checks.push({ check: 'source_target_alignment', status: 'WARN', detail: `Mismatch: ${mismatches.join('; ')}` });
          }
        }
      } catch (err: unknown) {
        checks.push({ check: 'source_target_alignment', status: 'FAIL', detail: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    // Output
    if (jsonMode) {
      console.log(JSON.stringify({ checks }, null, 2));
      process.exit(checks.some((c) => c.status === 'FAIL') ? EXIT_FAILURE : EXIT_SUCCESS);
    }

    const checkLabels: Record<string, string> = {
      git_integrity: 'Git integrity',
      placeholder_files: 'Placeholder files',
      cloud_sync: 'Cloud sync status',
      path_hash_validity: 'Path-hash validity',
      seed_markers: 'Seed markers',
      source_target_alignment: 'Source/target alignment',
    };

    const rows = checks.map((c) => ({
      status: c.status,
      label: checkLabels[c.check] ?? c.check,
      detail: c.detail,
    }));

    console.log(formatTable(rows));
    console.log('');
    console.log(formatSummary(rows));

    process.exit(checks.some((c) => c.status === 'FAIL') ? EXIT_FAILURE : EXIT_SUCCESS);
  });

// --- audit ---
program
  .command('audit')
  .description('Environment-wide audit: discover projects, run health checks, traffic-light report')
  .option('--projects <paths...>', 'Specific project paths to audit (auto-discovers if omitted)')
  .action(async () => {
    console.log('audit: not yet implemented (14-04)');
  });

// --- cleanup-scan ---
program
  .command('cleanup-scan')
  .description('Scan for stale cloud path references and cleanup candidates (read-only)')
  .argument('<dirPath>', 'Absolute path to the directory to scan')
  .action(async (_dirPath: string) => {
    console.log('cleanup-scan: not yet implemented (14-04)');
  });

await program.parseAsync(process.argv);
