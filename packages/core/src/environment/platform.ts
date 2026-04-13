// packages/core/src/environment/platform.ts

import os from 'node:os';
import type { Result, Platform, Shell, PlatformInfo } from '../types.js';

/**
 * Detect the user's operating system and shell environment.
 *
 * Simplification from v2.0.0: The three-way shell detection (PowerShell / bash-on-Windows / native bash)
 * is less critical in Node.js because most operations use Node.js built-ins or spawnSync with shell: true.
 * The shell detection is retained for reporting and for operations that need shell-specific behavior.
 *
 * Detection approach:
 * - Platform: os.platform() -> win32 | darwin | linux
 * - Shell on Windows: check process.env for PowerShell indicators
 * - Shell on macOS/Linux: check process.env.SHELL
 */
export function detectPlatform(): Result<PlatformInfo, 'unsupported_os'> {
  const p = os.platform();
  const homeDir = os.homedir();

  if (p === 'win32') {
    const shell = detectWindowsShell();
    return {
      success: true,
      data: {
        platform: 'windows',
        shell,
        homeDir,
        pathSeparator: '\\',
      },
    };
  }

  if (p === 'darwin') {
    const shell = detectUnixShell();
    return {
      success: true,
      data: {
        platform: 'macos',
        shell,
        homeDir,
        pathSeparator: '/',
      },
    };
  }

  if (p === 'linux') {
    const shell = detectUnixShell();
    return {
      success: true,
      data: {
        platform: 'linux',
        shell,
        homeDir,
        pathSeparator: '/',
      },
    };
  }

  return {
    success: false,
    reason: 'unsupported_os',
    detail: `Unsupported OS platform: ${p}. LocalGround supports Windows, macOS, and Linux.`,
  };
}

/**
 * Detect the shell on Windows.
 * Checks for PowerShell environment variables, then MSYSTEM (Git Bash / MINGW),
 * then falls back to cmd.
 */
function detectWindowsShell(): Shell {
  // PowerShell sets PSModulePath
  if (process.env.PSModulePath) {
    return 'powershell';
  }
  // Git Bash / MSYS2 / MINGW sets MSYSTEM
  if (process.env.MSYSTEM || process.env.BASH_VERSION) {
    return 'bash-on-windows';
  }
  // Fallback: assume cmd
  return 'cmd';
}

/**
 * Detect the shell on macOS/Linux.
 * Reads $SHELL environment variable.
 */
function detectUnixShell(): Shell {
  const shellPath = process.env.SHELL ?? '';
  if (shellPath.endsWith('/zsh') || shellPath.endsWith('/zsh5')) {
    return 'zsh';
  }
  // Default to bash for any other Unix shell
  return 'bash';
}
