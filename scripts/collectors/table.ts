/**
 * collectors/table.ts — the status table `npm run collect:all` prints.
 *
 * Pure string formatting, kept out of the orchestrator so it can be tested
 * without running any collector. The reason column is NEVER truncated: PRD
 * §7.6 bans `.slice()` in the reporting path because `auditReport.slice(0,3000)`
 * already discarded every high and medium finding once. A wrapped reason is
 * ugly; a cut one is a lie.
 */

export interface StatusRow {
  name: string;
  healthy: boolean;
  rowCount: number;
  reason: string | null;
  ms: number;
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + ' '.repeat(width - text.length);
}

export function renderStatusTable(rows: StatusRow[]): string {
  const nameWidth = Math.max(9, ...rows.map((r) => r.name.length));
  const lines: string[] = [];

  lines.push(`${pad('collector', nameWidth)}  health      rows  time`);
  lines.push(`${'-'.repeat(nameWidth)}  ------  --------  ------`);

  for (const row of rows) {
    lines.push(
      `${pad(row.name, nameWidth)}  ${row.healthy ? 'OK    ' : 'FAIL  '}  ${String(row.rowCount).padStart(8)}  ${`${(row.ms / 1000).toFixed(1)}s`.padStart(6)}`
    );
  }

  const unhealthy = rows.filter((r) => !r.healthy);
  if (unhealthy.length > 0) {
    lines.push('');
    lines.push('why each FAIL is a FAIL (full reasons, never truncated):');
    for (const row of unhealthy) {
      lines.push('');
      lines.push(`  ${row.name}:`);
      for (const part of (row.reason === null ? '(no reason recorded — this is a bug)' : row.reason).split(' | ')) {
        lines.push(`    - ${part}`);
      }
    }
  }

  const healthyCount = rows.length - unhealthy.length;
  lines.push('');
  lines.push(`${healthyCount}/${rows.length} collectors healthy (${Math.round((healthyCount / Math.max(1, rows.length)) * 100)}% observational coverage)`);
  return lines.join('\n');
}
