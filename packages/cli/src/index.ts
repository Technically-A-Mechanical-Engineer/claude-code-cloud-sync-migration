// packages/cli/src/index.ts
// @localground/cli — Standalone CLI for LocalGround Toolkit
// Calls @localground/core directly (D-05). Does NOT go through MCP server.

import { Command } from 'commander';

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
    console.log('detect: not yet implemented (14-02)');
  });

// --- seed ---
program
  .command('seed')
  .description('Plant verifiable markers in a project before migration')
  .argument('<projectPath>', 'Absolute path to the project directory')
  .action(async (_projectPath: string) => {
    console.log('seed: not yet implemented (14-03)');
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
