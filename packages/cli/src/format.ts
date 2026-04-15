import pc from 'picocolors';

// Exit code constants
export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;
export const EXIT_ERROR = 2;

/**
 * Apply color only when stdout is a TTY (not piped/redirected).
 */
export function colorize(text: string, colorFn: (s: string) => string): string {
  return process.stdout.isTTY ? colorFn(text) : text;
}

/**
 * Format a status badge: PASS (green), WARN (yellow), FAIL (red), N/A (dim).
 */
export function formatStatus(status: 'PASS' | 'WARN' | 'FAIL' | 'N/A'): string {
  switch (status) {
    case 'PASS': return colorize('PASS', pc.green);
    case 'WARN': return colorize('WARN', pc.yellow);
    case 'FAIL': return colorize('FAIL', pc.red);
    case 'N/A':  return colorize('N/A', pc.dim);
  }
}

/**
 * Format aligned key:value pairs.
 * Input: array of [key, value] tuples.
 * Output: multi-line string with keys right-padded to align colons.
 *
 * Example:
 *   OS:          Windows 11
 *   Shell:       PowerShell
 *   Cloud sync:  OneDrive (Personal)
 */
export function formatKeyValue(pairs: Array<[string, string]>): string {
  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length));
  return pairs
    .map(([key, value]) => `${key}:${' '.repeat(maxKeyLen - key.length + 1)} ${value}`)
    .join('\n');
}

/**
 * Format a PASS/WARN/FAIL table.
 * Input: array of { status, label, detail } objects.
 * Output: multi-line string with status badge + label + detail.
 *
 * Example:
 *   PASS  Seed checksum matches manifest
 *   WARN  2 placeholder files detected in node_modules/
 *   FAIL  Git fsck reports 1 error
 */
export function formatTable(
  rows: Array<{ status: 'PASS' | 'WARN' | 'FAIL' | 'N/A'; label: string; detail?: string }>,
): string {
  return rows
    .map((row) => {
      const badge = formatStatus(row.status);
      const detail = row.detail ? `  ${row.detail}` : '';
      return `${badge}  ${row.label}${detail}`;
    })
    .join('\n');
}

/**
 * Format a traffic-light overall summary line.
 * Counts PASS/WARN/FAIL from the rows and determines overall status.
 * Overall: RED if any FAIL, YELLOW if any WARN, GREEN if all PASS.
 */
export function formatSummary(
  rows: Array<{ status: 'PASS' | 'WARN' | 'FAIL' | 'N/A' }>,
): string {
  const pass = rows.filter((r) => r.status === 'PASS').length;
  const warn = rows.filter((r) => r.status === 'WARN').length;
  const fail = rows.filter((r) => r.status === 'FAIL').length;
  const total = rows.length;

  let overall: string;
  if (fail > 0) {
    overall = colorize('RED', pc.red);
  } else if (warn > 0) {
    overall = colorize('YELLOW', pc.yellow);
  } else {
    overall = colorize('GREEN', pc.green);
  }

  return `Overall: ${overall} (${total} checks: ${pass} PASS, ${warn} WARN, ${fail} FAIL)`;
}

/**
 * Format a core Result failure as a human-readable error message.
 */
export function formatError(reason: string, detail: string): string {
  return `${colorize('ERROR', pc.red)}  ${reason}: ${detail}`;
}
