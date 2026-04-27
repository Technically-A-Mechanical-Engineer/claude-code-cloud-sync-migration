// packages/core/src/environment/looksLikeProject.ts

import os from 'node:os';
import path from 'node:path';

/**
 * Heuristic: does this absolute path look like a project directory?
 *
 * Used by audit (and other auto-discovery surfaces) to scope the candidate
 * project list — preventing top-level path-hashes that decode to filesystem
 * root or the user home directory from being scanned as if they were projects.
 *
 * Rejects:
 *   - The filesystem root (`C:\` on Windows, `/` on Unix)
 *   - The user home directory itself (`os.homedir()`)
 *   - Paths shallower than 2 segments below home (e.g. `C:\Users\bob\Documents`
 *     is too shallow; `C:\Users\bob\Projects\my-app` is OK)
 *   - Paths that don't have at least 2 segments below the filesystem root
 *     (catches the case where home isn't an ancestor — e.g. `C:\foo`
 *     would be rejected; `C:\Projects\my-app` accepted)
 *
 * Does NOT check for `.git/`, `package.json`, or other marker files —
 * the toolkit explicitly supports plain-folder projects (per Phase 14 D-01).
 *
 * Examples:
 *   looksLikeProject('C:\\')                                    => false (root)
 *   looksLikeProject('C:\\Users\\bob')                          => false (home)
 *   looksLikeProject('C:\\Users\\bob\\Documents')               => false (1 below home)
 *   looksLikeProject('C:\\Users\\bob\\Projects\\my-app')        => true  (2 below home)
 *   looksLikeProject('C:\\Projects\\my-app')                    => true  (2 below root)
 *   looksLikeProject('C:\\foo')                                 => false (1 below root, not under home)
 *   looksLikeProject('/')                                       => false (root)
 *   looksLikeProject('/home/bob')                               => false (home)
 *   looksLikeProject('/home/bob/Projects/my-app')               => true  (2 below home)
 */
export function looksLikeProject(absolutePath: string): boolean {
  if (!absolutePath || typeof absolutePath !== 'string') {
    return false;
  }

  // Normalize: trailing-slash safe, case-preserving
  const resolved = path.resolve(absolutePath);
  const root = path.parse(resolved).root; // e.g. "C:\\" on Windows, "/" on Unix
  const home = os.homedir();

  // Reject filesystem root
  if (resolved === root) {
    return false;
  }

  // Reject literal home directory
  if (caseEqual(resolved, home)) {
    return false;
  }

  // If under home: require at least 2 segments below home
  if (isUnder(resolved, home)) {
    const relativeFromHome = path.relative(home, resolved);
    const segments = relativeFromHome.split(path.sep).filter((s) => s.length > 0);
    return segments.length >= 2;
  }

  // Not under home: require at least 2 segments below filesystem root
  const relativeFromRoot = path.relative(root, resolved);
  const segments = relativeFromRoot.split(path.sep).filter((s) => s.length > 0);
  return segments.length >= 2;
}

/**
 * Case-insensitive path equality on Windows; case-sensitive elsewhere.
 * Matches the platform's filesystem semantics.
 */
function caseEqual(a: string, b: string): boolean {
  if (process.platform === 'win32') {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

/**
 * Is `child` a strict descendant of `parent`?
 * Uses path.relative() to compute the offset; rejects if relative is '..' or absolute
 * (those mean parent is not an ancestor).
 */
function isUnder(child: string, parent: string): boolean {
  const rel = path.relative(parent, child);
  if (!rel) return false; // same path
  if (rel.startsWith('..')) return false;
  if (path.isAbsolute(rel)) return false; // different roots (e.g., different drives on Windows)
  return true;
}
