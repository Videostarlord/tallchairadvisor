/**
 * execution-log.ts — contract for `reports/fixes-log.md` and
 * `reports/content-log.md` (A2).
 *
 * WHY THESE NEEDED A CONTRACT AND NOT JUST A `readFileSync`
 * The week of 2026-08-06 the single most important thing the system did was
 * REFUSE to do something: the trust layer rejected fabricated ASIN B006H1QYBA
 * on a page that had otherwise scored 100/100. That refusal was written to
 * `reports/content-log.md` and appeared in the nightly report NOWHERE, because
 * the two execution logs were not nightly sources. The agents' own account of
 * what they did was the one thing the observation layer could not see.
 *
 * These are markdown, not JSON, so `readValidated()` cannot apply. The contract
 * is therefore a text assertion with the same three obligations every schema in
 * this directory carries:
 *
 *   1. SHAPE — a dated H1 header the writers actually emit
 *      (`# Fixes Log — 2026-08-06`, `# Content Log — 2026-08-07`).
 *   2. FRESHNESS — from the date IN THE HEADER, never from mtime. mtime lies
 *      after a `git clone` in CI, where every file is seconds old; this is the
 *      same reasoning `read-validated.ts` gives for preferring embedded
 *      timestamps, and it matters more here because a STALE execution log is
 *      the exact evidence of the Friday-committed-nothing-for-5-days failure.
 *   3. NON-VACUITY — at least one claim about what happened. A header with no
 *      outcome lines and no explicit no-op declaration is an agent that ran and
 *      told nobody anything, which must not read as a quiet success.
 *
 * The writers are `scripts/agents/execute-fixes.ts` (Thursday) and
 * `scripts/agents/execute-content.ts` (Friday). Both emit `- [✅] …` / `- [❌] …`
 * per task; thursday.yml additionally appends `- [❌ ROLLED BACK] …` when a
 * build breaks. `execute-fixes.ts` writes "No fixes needed this week." when the
 * plan held no tasks. Those four forms are the entire vocabulary and the parser
 * below recognises exactly them — a new form is a contract failure, loudly,
 * rather than an outcome that silently stops being counted.
 */

import { ContractViolation } from '../lib/read-validated.js';

const MS_PER_HOUR = 3_600_000;

/** Weekly agents: 8 days is the repo-wide SLA (see schemas/index.ts). */
export const EXECUTION_LOG_MAX_AGE_HOURS = 8 * 24;

/** `# Fixes Log — 2026-08-06` / `# Content Log - 2026-08-07`. */
const HEADER = /^#\s+(.+?)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})\s*$/;

/** `- [✅] …`, `- [❌] …`, `- [❌ ROLLED BACK] …`. */
const OUTCOME = /^\s*-\s*\[([^\]]*)\]\s*(.*)$/;

/** `No fixes needed this week.` — the writers' explicit nothing-to-do form. */
const NO_OP = /^\s*No\b[^.\n]*\b(needed|to (apply|write|do)|this week)\b/i;

export type ExecutionOutcome = 'applied' | 'refused';

export interface ExecutionLogEntry {
  outcome: ExecutionOutcome;
  /** Verbatim marker text between the brackets, e.g. '✅' or '❌ ROLLED BACK'. */
  marker: string;
  text: string;
}

export interface ParsedExecutionLog {
  title: string;
  /** YYYY-MM-DD from the header. */
  date: string;
  entries: ExecutionLogEntry[];
  applied: number;
  /**
   * Skips, rollbacks and trust-layer rejections. NOT failures to be hidden —
   * the fabricated-ASIN refusal is a `refused` entry and is the highest-value
   * line either log has ever carried.
   */
  refused: number;
  /** The writer explicitly declared it had nothing to do. */
  declaredNoOp: boolean;
}

/**
 * Pure parse. Throws ContractViolation on a shape the writers do not emit —
 * silently tolerating an unknown shape is how a log stops being read.
 */
export function parseExecutionLog(raw: string, display: string): ParsedExecutionLog {
  const lines = raw.split(/\r?\n/);
  const headerLine = lines.find((l) => l.trim() !== '');
  if (headerLine === undefined) {
    throw new ContractViolation(display, 'file has no content; an execution log must at least state its date');
  }

  const header = HEADER.exec(headerLine.trim());
  if (header === null) {
    throw new ContractViolation(
      display,
      `first line must be a dated H1 like '# Fixes Log — 2026-08-06'; found ${JSON.stringify(headerLine.trim().slice(0, 80))}`
    );
  }

  const [, title, date] = header;
  if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new ContractViolation(display, `header date ${JSON.stringify(date)} is not a real calendar date`);
  }

  const entries: ExecutionLogEntry[] = [];
  let declaredNoOp = false;
  for (const line of lines) {
    const match = OUTCOME.exec(line);
    if (match !== null) {
      const marker = match[1].trim();
      entries.push({ outcome: marker.startsWith('✅') ? 'applied' : 'refused', marker, text: match[2].trim() });
      continue;
    }
    if (NO_OP.test(line)) declaredNoOp = true;
  }

  if (entries.length === 0 && !declaredNoOp) {
    throw new ContractViolation(
      display,
      'header present but no outcome lines and no explicit no-op declaration — the agent ran and ' +
        'recorded nothing about what it did. An empty log must not read as a quiet success.'
    );
  }

  return {
    title: title.trim(),
    date,
    entries,
    applied: entries.filter((e) => e.outcome === 'applied').length,
    refused: entries.filter((e) => e.outcome === 'refused').length,
    declaredNoOp,
  };
}

/**
 * Freshness against the header date. `now` is injectable so the tests are
 * hermetic — A11 found two tests that had gone order-dependent on live data,
 * and this file is not going to add a third.
 */
export function assertExecutionLogFresh(
  parsed: ParsedExecutionLog,
  display: string,
  maxAgeHours: number = EXECUTION_LOG_MAX_AGE_HOURS,
  now: Date = new Date()
): void {
  const ageHours = (now.getTime() - Date.parse(`${parsed.date}T00:00:00Z`)) / MS_PER_HOUR;
  if (ageHours > maxAgeHours) {
    throw new ContractViolation(
      display,
      `stale — header date ${parsed.date} is ${Math.round(ageHours)}h old, SLA is ${maxAgeHours}h. ` +
        `The weekly agent that writes this has not produced a log within its own cadence, which is ` +
        `indistinguishable from it having stopped running.`
    );
  }
}

/** The `text` contract handed to nightly-report's `load()`. Throws or returns void. */
export function executionLogContract(
  maxAgeHours: number = EXECUTION_LOG_MAX_AGE_HOURS
): (raw: string, display: string) => void {
  return (raw, display) => {
    assertExecutionLogFresh(parseExecutionLog(raw, display), display, maxAgeHours);
  };
}

/** One-line census for the report footer / detector-health table. */
export function summarizeExecutionLog(parsed: ParsedExecutionLog): string {
  if (parsed.entries.length === 0) return `${parsed.date}: agent declared nothing to do`;
  return `${parsed.date}: ${parsed.applied} applied, ${parsed.refused} refused/skipped`;
}
