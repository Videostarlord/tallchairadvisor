/**
 * cost-rollup.ts — God's-Eye Nightly §7.1 rollup + reconciliation.
 *
 *   npm run cost:rollup
 *     → reads data/cost-ledger.jsonl, writes data/cost-summary.json
 *       (per run / agent / day / month, plus non-LLM service quotas)
 *
 *   npm run cost:reconcile -- <actual-usd> --month YYYY-MM
 *     → compares the metered month total against the Anthropic Console figure.
 *       Drift > 5% appends a record to data/cost-drift.jsonl and exits non-zero.
 *
 * Honesty rules this script obeys:
 *   - An empty or absent ledger reports "0 records" explicitly. It never
 *     reports "$0.00 spent" as if that were a measurement.
 *   - A malformed ledger line is a hard error, not a skipped line: a corrupted
 *     ledger that silently under-reports spend is the failure this file exists
 *     to prevent. The summary is still written, then the process exits 1.
 *   - A month with ZERO metered records is UNRECONCILABLE, never "OK". See
 *     below — this rule was written into the header above before it was true
 *     of the code.
 *
 * ─── 2026-08-09: THE RECONCILE COULD PASS ON NOTHING (A6) ─────────────────────
 *
 * `npm run cost:reconcile -- 0 --month 2026-01` printed
 *
 *     metered: $0.00000 across 0 records
 *     console: $0.00000
 *     drift:   $0.00000 (0.00%), threshold 5%
 *     OK — within 5%.
 *
 * and exited 0. A month in which nothing was ever metered, reconciled against
 * an invoice of nothing, reported as a passing reconciliation. The rollup path
 * obeyed the empty-ledger rule three lines above; the reconcile path did not.
 *
 * `meteredRecords === 0` already had the correct words waiting for it in
 * `detail` — "Either no calls ran or call sites are not yet migrated" — but the
 * branch was reachable only when drift ALSO exceeded the threshold, and $0 vs
 * $0 is 0% drift. The one case where the metered figure is most obviously
 * untrustworthy was the one case that could not fail. Zero records is now its
 * own refusal, independent of drift.
 *
 * ─── WHY COVERAGE IS PRINTED, NOT JUST THE TOTAL ─────────────────────────────
 *
 * A drift percentage is only as meaningful as the ledger behind it, and this
 * ledger has been demonstrably partial: until 2026-08-09 ONLY nightly.yml
 * committed data/cost-ledger.jsonl, so every Tue–Sat agent metered its spend
 * into an ephemeral runner that then evaporated. `cost:rollup` on that date
 * reported 14 LLM records, ALL of them `nightly-report`, and none from audit,
 * strategy, execute-fixes, execute-content, verify-deploy, index-monitor or
 * competitor-intelligence — every one of which calls meteredCreate().
 *
 * A reader seeing only "metered: $5.03 — OK within 5%" cannot tell that from a
 * complete month. A reader seeing "contributing agents: nightly-report" can.
 * So the reconcile now names them, and that line is the difference between a
 * reconciliation and a number that merely looks like one.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isExternalRecord,
  type CostRecord,
  type ExternalCostRecord,
  type LlmCostRecord,
} from './lib/metered-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const LEDGER_PATH = resolve(ROOT, 'data/cost-ledger.jsonl');
const SUMMARY_PATH = resolve(ROOT, 'data/cost-summary.json');
const DRIFT_PATH = resolve(ROOT, 'data/cost-drift.jsonl');

/** Acceptance test §9 row 1: reconcile within 5%. */
const DRIFT_THRESHOLD_PERCENT = 5;

// ─── Aggregate shapes ─────────────────────────────────────────────────────────

interface Bucket {
  records: number;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  usd: number;
}

interface ServiceBucket {
  records: number;
  usd: number;
  credits: number;
  pages: number;
}

interface CostSummary {
  generatedAt: string;
  ledger: string;
  records: { total: number; llm: number; external: number };
  /** Explicit when nothing has been metered yet — NOT a zero-spend claim. */
  note: string | null;
  totals: Bucket;
  byRun: Record<string, Bucket>;
  byAgent: Record<string, Bucket>;
  byDay: Record<string, Bucket>;
  byMonth: Record<string, Bucket>;
  externalByService: Record<string, ServiceBucket>;
  models: Record<string, Bucket>;
}

function emptyBucket(): Bucket {
  return { records: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0, usd: 0 };
}

function addToBucket(map: Record<string, Bucket>, key: string, record: LlmCostRecord): void {
  const existing = map[key];
  const bucket = existing === undefined ? emptyBucket() : existing;
  bucket.records += 1;
  bucket.input += record.input;
  bucket.output += record.output;
  bucket.cacheWrite += record.cacheWrite;
  bucket.cacheRead += record.cacheRead;
  bucket.usd = round8(bucket.usd + record.usd.total);
  map[key] = bucket;
}

function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

// ─── Ledger reading ───────────────────────────────────────────────────────────

interface LedgerReadResult {
  records: CostRecord[];
  malformed: Array<{ line: number; reason: string }>;
  fileExists: boolean;
}

function readLedger(path: string): LedgerReadResult {
  if (!existsSync(path)) {
    return { records: [], malformed: [], fileExists: false };
  }
  const raw = readFileSync(path, 'utf-8');
  const records: CostRecord[] = [];
  const malformed: Array<{ line: number; reason: string }> = [];

  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    // TODO(contracts): route this through readValidated() from
    // scripts/lib/read-validated.ts (PRD §7.2) once that lands — it owns the
    // repo's only JSON.parse and will carry the cost-ledger zod schema. Until
    // then this site is a known R4 violation and appears in the lint baseline.
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      malformed.push({
        line: i + 1,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    const problem = describeShapeProblem(parsed);
    if (problem !== null) {
      malformed.push({ line: i + 1, reason: problem });
      continue;
    }
    records.push(parsed as CostRecord);
  }
  return { records, malformed, fileExists: true };
}

/** Returns null when the record is well-formed, else a human reason. */
function describeShapeProblem(value: unknown): string | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 'record is not a JSON object';
  }
  const record = value as Record<string, unknown>;
  if (typeof record.ts !== 'string') return "missing string field 'ts'";
  if (typeof record.agent !== 'string') return "missing string field 'agent'";
  if (typeof record.run !== 'string') return "missing string field 'run'";

  if (typeof record.service === 'string') {
    if (typeof record.unit !== 'string') return "external record missing string field 'unit'";
    if (typeof record.amount !== 'number') return "external record missing number field 'amount'";
    return null;
  }

  if (typeof record.model !== 'string') return "llm record missing string field 'model'";
  for (const field of ['input', 'output', 'cacheWrite', 'cacheRead']) {
    if (typeof record[field] !== 'number') return `llm record missing number field '${field}'`;
  }
  const usd = record.usd;
  if (usd === null || typeof usd !== 'object') return "llm record missing object field 'usd'";
  if (typeof (usd as Record<string, unknown>).total !== 'number') {
    return "llm record missing number field 'usd.total'";
  }
  return null;
}

// ─── Rollup ───────────────────────────────────────────────────────────────────

function rollup(records: CostRecord[], fileExists: boolean): CostSummary {
  const summary: CostSummary = {
    generatedAt: new Date().toISOString(),
    ledger: relative(ROOT, LEDGER_PATH),
    records: { total: records.length, llm: 0, external: 0 },
    note: null,
    totals: emptyBucket(),
    byRun: {},
    byAgent: {},
    byDay: {},
    byMonth: {},
    externalByService: {},
    models: {},
  };

  if (!fileExists) {
    summary.note =
      'Ledger file does not exist. 0 records. This is NOT a claim that spend was zero — ' +
      'it means nothing has been metered yet.';
  } else if (records.length === 0) {
    summary.note =
      'Ledger file exists but contains 0 records. This is NOT a claim that spend was zero.';
  }

  for (const record of records) {
    if (isExternalRecord(record)) {
      summary.records.external += 1;
      accumulateExternal(summary.externalByService, record);
      continue;
    }
    summary.records.llm += 1;
    const day = record.ts.slice(0, 10);
    const month = record.ts.slice(0, 7);
    addToBucket(summary.byRun, record.run, record);
    addToBucket(summary.byAgent, record.agent, record);
    addToBucket(summary.byDay, day, record);
    addToBucket(summary.byMonth, month, record);
    addToBucket(summary.models, record.model, record);

    summary.totals.records += 1;
    summary.totals.input += record.input;
    summary.totals.output += record.output;
    summary.totals.cacheWrite += record.cacheWrite;
    summary.totals.cacheRead += record.cacheRead;
    summary.totals.usd = round8(summary.totals.usd + record.usd.total);
  }

  return summary;
}

function accumulateExternal(
  map: Record<string, ServiceBucket>,
  record: ExternalCostRecord
): void {
  const existing = map[record.service];
  const bucket =
    existing === undefined ? { records: 0, usd: 0, credits: 0, pages: 0 } : existing;
  bucket.records += 1;
  if (record.unit === 'usd') bucket.usd = round8(bucket.usd + record.amount);
  if (record.unit === 'credits') bucket.credits += record.amount;
  if (record.unit === 'pages') bucket.pages += record.amount;
  map[record.service] = bucket;
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

interface ReconcileArgs {
  actualUsd: number;
  month: string;
}

function parseArgs(argv: string[]): { reconcile: ReconcileArgs | null } {
  const reconcileIndex = argv.indexOf('--reconcile');
  if (reconcileIndex === -1) return { reconcile: null };

  const rawActual = argv[reconcileIndex + 1];
  if (rawActual === undefined || rawActual.startsWith('--')) {
    throw new Error(
      'cost-rollup: --reconcile requires the Anthropic Console figure in USD, ' +
        'e.g. `npm run cost:reconcile -- 12.47 --month 2026-07`'
    );
  }
  const actualUsd = Number(rawActual);
  if (!Number.isFinite(actualUsd) || actualUsd < 0) {
    throw new Error(`cost-rollup: --reconcile value "${rawActual}" is not a non-negative number`);
  }

  const monthIndex = argv.indexOf('--month');
  const month =
    monthIndex === -1 || argv[monthIndex + 1] === undefined
      ? new Date().toISOString().slice(0, 7)
      : argv[monthIndex + 1];
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error(`cost-rollup: --month must be YYYY-MM, got "${month}"`);
  }
  return { reconcile: { actualUsd, month } };
}

interface DriftRecord {
  id: string;
  ts: string;
  kind: 'cost-drift';
  month: string;
  meteredUsd: number;
  actualUsd: number;
  driftUsd: number;
  driftPercent: number;
  thresholdPercent: number;
  meteredRecords: number;
  status: 'open';
  detail: string;
}

/**
 * LLM agents that contributed at least one record to `month`, sorted.
 *
 * External records are deliberately excluded: Firecrawl, DataForSEO, SerpAPI
 * and the GSC/Clarity APIs do not appear on an Anthropic invoice, so folding
 * them into the coverage line for an Anthropic reconciliation would overstate
 * how much of the bill this ledger can account for.
 */
export function llmAgentsInMonth(records: CostRecord[], month: string): string[] {
  const agents = new Set<string>();
  for (const record of records) {
    if (isExternalRecord(record)) continue;
    if (record.ts.slice(0, 7) !== month) continue;
    agents.add(record.agent);
  }
  return [...agents].sort();
}

function driftId(month: string): string {
  // Same convention as audit-findings.ts: sha1(page|issueClass), truncated.
  return createHash('sha1').update(`cost-drift|${month}`).digest('hex').slice(0, 12);
}

/**
 * Files a drift finding.
 *
 * TODO(ledger): data/ledger.jsonl and its writer (scripts/lib/ledger.ts, PRD §7.3)
 * are owned by the step-3 agent. When they land, a follow-up agent should route
 * this through `fileFinding()` with a machine-evaluable closurePredicate — e.g.
 * { kind: 'cost-reconciled', month, thresholdPercent: 5 } — so the finding
 * auto-closes on the next month whose metered total lands within 5% of the
 * Console figure, instead of living in this standalone file. Until then the
 * drift is appended here AND surfaced by a non-zero exit code so it cannot be
 * missed by CI.
 */
function fileDrift(record: DriftRecord): void {
  mkdirSync(dirname(DRIFT_PATH), { recursive: true });
  appendFileSync(DRIFT_PATH, `${JSON.stringify(record)}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const { reconcile } = parseArgs(process.argv.slice(2));
  const { records, malformed, fileExists } = readLedger(LEDGER_PATH);
  const summary = rollup(records, fileExists);

  mkdirSync(dirname(SUMMARY_PATH), { recursive: true });
  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`cost-rollup → ${relative(ROOT, SUMMARY_PATH)}`);
  console.log(
    `  ${summary.records.total} records (${summary.records.llm} llm, ${summary.records.external} external)`
  );
  if (summary.note !== null) {
    console.log(`  ${summary.note}`);
  } else {
    console.log(`  metered total: $${summary.totals.usd.toFixed(5)}`);
    console.log(
      `  tokens: ${summary.totals.input} in / ${summary.totals.output} out / ` +
        `${summary.totals.cacheWrite} cache-write / ${summary.totals.cacheRead} cache-read`
    );
    const months = Object.keys(summary.byMonth).sort();
    for (const month of months) {
      console.log(`  ${month}: $${summary.byMonth[month].usd.toFixed(5)}`);
    }
  }

  let exitCode = 0;

  if (malformed.length > 0) {
    console.error(
      `\ncost-rollup: ${malformed.length} MALFORMED ledger line(s) in ${relative(ROOT, LEDGER_PATH)}.`
    );
    console.error('The summary above under-reports spend by those lines. Fix the ledger.');
    for (const entry of malformed.slice(0, 20)) {
      console.error(`  line ${entry.line}: ${entry.reason}`);
    }
    exitCode = 1;
  }

  if (reconcile !== null) {
    const bucket = summary.byMonth[reconcile.month];
    const meteredUsd = bucket === undefined ? 0 : bucket.usd;
    const meteredRecords = bucket === undefined ? 0 : bucket.records;
    const driftUsd = round8(meteredUsd - reconcile.actualUsd);
    const driftPercent =
      reconcile.actualUsd === 0
        ? meteredUsd === 0
          ? 0
          : Number.POSITIVE_INFINITY
        : round8((Math.abs(driftUsd) / reconcile.actualUsd) * 100);

    const contributors = llmAgentsInMonth(records, reconcile.month);

    console.log(`\nreconcile ${reconcile.month}`);
    console.log(`  metered: $${meteredUsd.toFixed(5)} across ${meteredRecords} records`);
    console.log(`  console: $${reconcile.actualUsd.toFixed(5)}`);
    console.log(
      `  drift:   $${driftUsd.toFixed(5)} (${
        Number.isFinite(driftPercent) ? `${driftPercent.toFixed(2)}%` : 'undefined — console is $0'
      }), threshold ${DRIFT_THRESHOLD_PERCENT}%`
    );
    // Named, not counted — "7 agents" would not let anyone spot that the only
    // contributor is the one workflow that happens to commit the ledger.
    console.log(
      `  agents:  ${contributors.length === 0 ? '(none)' : contributors.join(', ')}` +
        ` — LLM only; external services are not on an Anthropic invoice`
    );

    // Zero records is its own refusal, NOT a drift comparison. $0 metered
    // against a $0 invoice is 0% drift and would otherwise print "OK" for a
    // month nothing was ever recorded in. See the header.
    const unreconcilable = meteredRecords === 0;

    if (unreconcilable || !(driftPercent <= DRIFT_THRESHOLD_PERCENT)) {
      const detail = unreconcilable
        ? `No metered records for ${reconcile.month}, so there is NOTHING to reconcile against the ` +
          `Anthropic Console — this is not a $0 month, it is an unmeasured one. Either no calls ran, ` +
          `or the runs happened and their ledger lines never reached the repo (until 2026-08-09 only ` +
          `nightly.yml committed data/cost-ledger.jsonl, so every Tue–Sat agent's spend died with its ` +
          `runner), or call sites are not yet migrated to meteredCreate() — check ` +
          `scripts/lint-architecture.mjs rule R1.`
        : `Metered total for ${reconcile.month} differs from the Anthropic Console by ` +
          `${driftPercent.toFixed(2)}% (> ${DRIFT_THRESHOLD_PERCENT}%). Contributing agents: ` +
          `${contributors.length === 0 ? '(none)' : contributors.join(', ')}. If an agent that ran ` +
          `that month is missing from that list, the metered side is an undercount and the drift is ` +
          `explained by the gap, not by mispricing.`;

      fileDrift({
        id: driftId(reconcile.month),
        ts: new Date().toISOString(),
        kind: 'cost-drift',
        month: reconcile.month,
        meteredUsd,
        actualUsd: reconcile.actualUsd,
        driftUsd,
        driftPercent,
        thresholdPercent: DRIFT_THRESHOLD_PERCENT,
        meteredRecords,
        status: 'open',
        detail,
      });

      console.error(
        `\ncost-rollup: ${
          unreconcilable
            ? `UNRECONCILABLE — ${reconcile.month} has no metered records`
            : `DRIFT > ${DRIFT_THRESHOLD_PERCENT}% for ${reconcile.month}`
        }. Filed to ${relative(ROOT, DRIFT_PATH)}.\n  ${detail}`
      );
      exitCode = 1;
    } else {
      console.log(
        `  OK — within ${DRIFT_THRESHOLD_PERCENT}%, over the ${meteredRecords} record(s) this ` +
          `ledger holds for ${reconcile.month}. That is agreement with what was RECORDED, which is ` +
          `only agreement with what was SPENT if every agent that ran that month is in the list above.`
      );
    }
  }

  process.exitCode = exitCode;
}

/**
 * Only run as a script, so the tests can import llmAgentsInMonth() without this
 * module overwriting the real data/cost-summary.json on import. Same guard and
 * same regex shape as ledger-evaluate.ts and probes/pr-gate.ts.
 *
 * The catch is not decoration: `parseArgs()` throws the usage string for a
 * missing or malformed --reconcile figure, and an unhandled throw buried that
 * message under a Node stack trace — the one line the operator needed, printed
 * last and framed as a crash. retention-prune.ts already does this.
 */
const invokedDirectly = process.argv[1] !== undefined && /cost-rollup\.ts$/.test(process.argv[1]);
if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    process.exitCode = 1;
  }
}
