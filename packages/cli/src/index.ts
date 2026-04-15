// packages/cli/src/index.ts
// @localground/cli — Standalone CLI for LocalGround Toolkit
// Calls @localground/core directly (D-05). Does NOT go through MCP server.

import { Command } from 'commander';
import path from 'node:path';
import { detect, seed, verify } from '@localground/core';
import type { EnvironmentInfo } from '@localground/core';
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
  .action(async (_projectPath: string) => {
    console.log('verify: not yet implemented (14-03)');
  });

// --- reap ---
program
  .command('reap')
  .description('Post-migration health check: verify markers + 6-check health assessment')
  .argument('<projectPath>', 'Absolute path to the project directory')
  .option('--manifest <path>', 'Path to seed manifest JSON')
  .option('--source <path>', 'Original source path for source/target comparison')
  .action(async (_projectPath: string) => {
    console.log('reap: not yet implemented (14-03)');
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
