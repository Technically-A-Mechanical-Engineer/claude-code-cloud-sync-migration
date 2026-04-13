// packages/core/src/util/paths.ts

import path from 'node:path';
import os from 'node:os';

/**
 * Normalize a path to use forward slashes.
 * Useful for consistent string comparison and display,
 * even though Windows APIs accept both separators.
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get the Claude Code configuration directory.
 * Default: ~/.claude
 */
export function getClaudeConfigDir(): string {
  return path.join(os.homedir(), '.claude');
}

/**
 * Get the Claude Code projects directory where path-hash folders live.
 * Default: ~/.claude/projects/
 */
export function getClaudeProjectsDir(): string {
  return path.join(os.homedir(), '.claude', 'projects');
}

/**
 * Ensure a path ends with the platform path separator.
 * Required for rsync source paths (trailing slash means "contents of").
 */
export function ensureTrailingSlash(dirPath: string): string {
  const sep = process.platform === 'win32' ? '\\' : '/';
  return dirPath.endsWith(sep) ? dirPath : dirPath + sep;
}

/**
 * Quote a path for shell usage if it contains spaces or special characters.
 * On Windows with shell: true, wraps in double quotes.
 * On Unix, wraps in single quotes.
 */
export function quotePath(filePath: string): string {
  if (!/[\s,()&;]/.test(filePath)) {
    return filePath;
  }
  if (process.platform === 'win32') {
    return `"${filePath}"`;
  }
  // Unix: single-quote and escape any embedded single quotes
  return `'${filePath.replace(/'/g, "'\\''")}'`;
}
