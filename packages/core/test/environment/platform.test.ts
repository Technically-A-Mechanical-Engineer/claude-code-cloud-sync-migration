import { describe, it, expect } from 'vitest';
import { detectPlatform } from '@localground/core';

describe('detectPlatform', () => {
  it('returns success on the current platform', () => {
    // detectPlatform is synchronous — no await needed
    const result = detectPlatform();
    expect(result.success).toBe(true);
    if (result.success) {
      // Platform is normalized to localground's internal names (windows/macos/linux),
      // NOT Node.js os.platform() raw values (win32/darwin/linux).
      expect(['windows', 'macos', 'linux']).toContain(result.data.platform);
    }
  });

  it('returns a non-empty shell value', () => {
    const result = detectPlatform();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shell).toBeTruthy();
      expect(['powershell', 'cmd', 'bash-on-windows', 'bash', 'zsh']).toContain(result.data.shell);
    }
  });

  it('returns a non-empty homeDir', () => {
    const result = detectPlatform();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.homeDir).toBeTruthy();
      expect(result.data.homeDir.length).toBeGreaterThan(0);
    }
  });

  it('returns the correct pathSeparator for the current platform', () => {
    const result = detectPlatform();
    expect(result.success).toBe(true);
    if (result.success) {
      if (result.data.platform === 'windows') {
        expect(result.data.pathSeparator).toBe('\\');
      } else {
        expect(result.data.pathSeparator).toBe('/');
      }
    }
  });
});
