/**
 * ledger-evaluate.ts — the nightly loop. `npm run ledger:evaluate`
 *
 * Re-runs every predicate in data/ledger.jsonl against tonight's data and writes
 * the resulting transitions back to the append-only log, plus a derived
 * data/ledger-state.json for the report (§7.6).
 *
 * FOUR RULES, and the reasoning for each:
 *
 *   PASS → closed, WITH the evidence that proved it. PRD success criterion #2.
 *          An evidence-less close is rejected by ledger.transition() itself.
 *
 *   FAIL on a CLOSED record → `regressed`, never a fresh finding. PRD §7.3 calls
 *          this "the case nothing currently catches and the highest-value output of
 *          the whole system". It works because id = sha1(page|issueClass) is stable:
 *          the re-raise collides with its own history by construction, so the system
 *          can say "this was fixed on the 6th and broke again on the 9th" instead of
 *          filing an identical-looking new problem with a fresh age of zero.
 *
 *   FAIL N nights running → `escalated` (default 3, --escalate-after=N).
 *
 *   UNEVALUABLE → nothing. No status change, no attempt counted, no escalation.
 *          Escalating because the system could not see is the failure this PRD
 *          exists to remove, so the counter is untouched and the coverage section
 *          reports the blindness by name instead.
 *
 * A regressed record stays `regressed` while it keeps failing rather than converting
 * to `escalated` — the escalation counter still climbs, but the status that carries
 * the most information is the one worth keeping on screen.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
import { makeFindingId } from './audit-findings.js';
import {
  ContractViolation,
  REPO_ROOT,
  readValidatedIfExists,
  readValidatedJsonlIfExists,
} from './lib/read-validated.js';
import {
  MissingPredicateError,
  RetractedFindingError,
  ageDays,
  currentState,
  fileFinding,
  findRetraction,
  getLedgerPath,
  loadRetractions,
  setLedgerPath,
  transition,
  type LedgerRecord,
  type LedgerStatus,
} from './lib/ledger.js';
import {
  buildEvalContext,
  describePredicate,
  evaluatePredicate,
  type ClosurePredicate,
  type EvalContext,
  type PredicateVerdict,
} from './lib/predicates/index.js';

const DEFAULT_ESCALATE_AFTER = 3;

// ─── CLI ───────────────────────────────────────────────────────────────────────

interface Options {
  backfill: boolean;
  dryRun: boolean;
  escalateAfter: number;
  allowNetwork: boolean;
  ledgerPath: string | null;
  statePath: string;
  /** Backfill sources. Overridable so a dry run can be pointed at a fixture. */
  findingsPath: string;
  interventionsPath: string;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    backfill: argv.includes('--backfill'),
    dryRun: argv.includes('--dry-run'),
    escalateAfter: DEFAULT_ESCALATE_AFTER,
    allowNetwork: !argv.includes('--no-network'),
    ledgerPath: null,
    statePath: 'data/ledger-state.json',
    findingsPath: 'data/audit-findings.json',
    interventionsPath: 'data/interventions.jsonl',
  };
  for (const arg of argv) {
    const escalate = /^--escalate-after=(\d+)$/.exec(arg);
    if (escalate !== null) opts.escalateAfter = Number(escalate[1]);
    const ledger = /^--ledger=(.+)$/.exec(arg);
    if (ledger !== null) opts.ledgerPath = ledger[1];
    const state = /^--state=(.+)$/.exec(arg);
    if (state !== null) opts.statePath = state[1];
    const findings = /^--findings=(.+)$/.exec(arg);
    if (findings !== null) opts.findingsPath = findings[1];
    const interventions = /^--interventions=(.+)$/.exec(arg);
    if (interventions !== null) opts.interventionsPath = interventions[1];
  }
  return opts;
}

// ─── Backfill (§ step-3 requirement 5) ─────────────────────────────────────────

const AuditFindingSchema = z.object({
  findingId: z.string().optional(),
  page: z.string(),
  issueClass: z.string(),
  severity: z.string().optional(),
  summary: z.string().optional(),
  recommendation: z.string().optional(),
  evidence: z.string().optional(),
});

const AuditFindingsFileSchema = z
  .object({
    generatedAt: z.string().optional(),
    findings: z.array(AuditFindingSchema),
  })
  .passthrough();

const InterventionSchema = z
  .object({
    slug: z.string(),
    page: z.string().optional(),
    interventionType: z.string().optional(),
    appliedDate: z.string(),
    targetMetric: z.string(),
    beforeMetric: z.number().nullable(),
    description: z.string().optional(),
    reconciledAt: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * Schema.org types this repo actually uses, for reading a @type out of a finding's
 * prose. `schema-valid` needs a type; inventing one would be exactly the "make up a
 * predicate to force the record through" move the spec forbids, so a schema finding
 * that names no type is refused rather than guessed at.
 */
const KNOWN_SCHEMA_TYPES = [
  'FAQPage',
  'Product',
  'Review',
  'BreadcrumbList',
  'Article',
  'BlogPosting',
  'HowTo',
  'ItemList',
  'Organization',
  'Person',
  'WebPage',
  'AggregateRating',
  'VideoObject',
];

function schemaTypeFromText(text: string): string | null {
  const hits = KNOWN_SCHEMA_TYPES.filter((type) => new RegExp(`\\b${type}\\b`).test(text));
  return hits.length === 1 ? hits[0] : null;
}

/**
 * Map an issueClass to a predicate, ONLY where the mapping is unambiguous.
 * Everything else returns null and the record is left unfiled — an existing finding
 * has no predicate, and manufacturing one to satisfy the hard rule would defeat it.
 */
export function inferPredicate(
  issueClass: string,
  page: string,
  text: string,
): ClosurePredicate | null {
  switch (issueClass) {
    case 'meta-length':
      return { kind: 'meta-length', url: page, min: 130, max: 165 };
    case 'canonical-missing':
    case 'canonical-wrong':
      return { kind: 'canonical-self', url: page };
    case 'schema-missing':
    case 'schema-invalid': {
      const type = schemaTypeFromText(text);
      return type === null ? null : { kind: 'schema-valid', url: page, type };
    }
    case 'affiliate-missing':
      return { kind: 'asin-registered', url: page, minLinks: 1 };
    case 'aio-suppression':
      return { kind: 'geo-capsule', url: page };
    default:
      return null;
  }
}

interface BackfillReport {
  seeded: number;
  alreadyFiled: number;
  refused: Array<{ id: string; page: string; issueClass: string; why: string }>;
  retracted: string[];
  violations: string[];
}

function backfill(opts: Options): BackfillReport {
  const report: BackfillReport = { seeded: 0, alreadyFiled: 0, refused: [], retracted: [], violations: [] };
  const ledgerPath = opts.ledgerPath === null ? undefined : opts.ledgerPath;
  const retractions = loadRetractions();
  const before = currentState(ledgerPath);
  /** Ids seeded during THIS run. interventions.jsonl contains exact duplicates, and
   *  a stable id means the second copy is the same claim, not a second one. */
  const seenIds = new Set<string>();

  // ── findings ──
  let findingsFile: z.infer<typeof AuditFindingsFileSchema> | null = null;
  try {
    findingsFile = readValidatedIfExists(opts.findingsPath, AuditFindingsFileSchema, {
      label: 'audit findings',
    });
  } catch (error) {
    if (!(error instanceof ContractViolation)) throw error;
    report.violations.push(error.message);
  }

  if (findingsFile === null) {
    console.log(`[backfill] ${opts.findingsPath} is absent — no findings to seed`);
  } else {
    for (const finding of findingsFile.findings) {
      const id =
        finding.findingId === undefined ? makeFindingId(finding.page, finding.issueClass) : finding.findingId;
      if (before.has(id) || seenIds.has(id)) {
        report.alreadyFiled += 1;
        continue;
      }
      seenIds.add(id);
      if (findRetraction(retractions, id, finding.page, finding.issueClass) !== null) {
        report.retracted.push(`${id} ${finding.page} ${finding.issueClass}`);
        continue;
      }
      const text = [finding.summary, finding.recommendation, finding.evidence]
        .filter((part): part is string => typeof part === 'string')
        .join(' ');
      const predicate = inferPredicate(finding.issueClass, finding.page, text);
      if (predicate === null) {
        report.refused.push({
          id,
          page: finding.page,
          issueClass: finding.issueClass,
          why: 'cannot backfill — needs a predicate',
        });
        continue;
      }
      seed(
        {
          id,
          kind: 'finding',
          page: finding.page,
          issueClass: finding.issueClass,
          severity: finding.severity,
          summary: finding.summary,
          closurePredicate: predicate,
          firstSeen: findingsFile.generatedAt === undefined ? undefined : findingsFile.generatedAt.slice(0, 10),
          ledgerPath,
        },
        report,
      );
    }
  }

  // ── interventions ──
  let interventions: Array<z.infer<typeof InterventionSchema>> | null = null;
  try {
    interventions = readValidatedJsonlIfExists(opts.interventionsPath, InterventionSchema, {
      label: 'interventions',
    });
  } catch (error) {
    if (!(error instanceof ContractViolation)) throw error;
    report.violations.push(error.message);
  }

  if (interventions === null) {
    console.log(`[backfill] ${opts.interventionsPath} is absent — no interventions to seed`);
  } else {
    for (const entry of interventions) {
      const issueClass = `intervention:${entry.targetMetric}:${entry.appliedDate}`;
      const id = makeFindingId(entry.slug, issueClass);
      if (before.has(id) || seenIds.has(id)) {
        report.alreadyFiled += 1;
        continue;
      }
      seenIds.add(id);
      // An intervention is machine-verifiable only when it named a metric AND the
      // value it was trying to beat. `position` + a numeric beforeMetric says exactly
      // one thing: this page should rank better than it did. Anything else — a null
      // baseline, a metric with no comparison — states no test and is left unfiled.
      if (entry.targetMetric !== 'position' || entry.beforeMetric === null) {
        report.refused.push({
          id,
          page: entry.slug,
          issueClass,
          why: `cannot backfill — needs a predicate (targetMetric='${entry.targetMetric}', beforeMetric=${String(entry.beforeMetric)})`,
        });
        continue;
      }
      seed(
        {
          id,
          kind: 'intervention',
          page: entry.slug,
          issueClass,
          summary: entry.description,
          // afterDays=14 is not invented: wiki-utils.assignConfidence already treats
          // anything under 14 days as confidence 'none'.
          closurePredicate: {
            kind: 'gsc-position',
            url: entry.slug,
            op: '<',
            value: entry.beforeMetric,
            afterDays: 14,
          },
          firstSeen: entry.appliedDate,
          ledgerPath,
        },
        report,
      );
    }
  }

  return report;
}

function seed(input: Parameters<typeof fileFinding>[0], report: BackfillReport): void {
  try {
    fileFinding(input);
    report.seeded += 1;
  } catch (error) {
    if (error instanceof MissingPredicateError) {
      report.refused.push({
        id: String(input.id),
        page: String(input.page),
        issueClass: String(input.issueClass),
        why: `cannot backfill — needs a predicate (${error.message})`,
      });
      return;
    }
    if (error instanceof RetractedFindingError) {
      report.retracted.push(`${String(input.id)} ${String(input.page)}`);
      return;
    }
    if (error instanceof ContractViolation) {
      report.violations.push(error.message);
      return;
    }
    throw error;
  }
}

function printBackfill(report: BackfillReport): void {
  console.log('');
  console.log('─── backfill ───────────────────────────────────────────────');
  console.log(`seeded:            ${report.seeded}`);
  console.log(`already filed:     ${report.alreadyFiled}`);
  console.log(`suppressed:        ${report.retracted.length} (retracted)`);
  console.log(`refused:           ${report.refused.length} (no unambiguous predicate)`);
  if (report.refused.length > 0) {
    const byClass = new Map<string, number>();
    for (const item of report.refused) {
      const key = item.issueClass.startsWith('intervention:') ? 'intervention (non-position)' : item.issueClass;
      byClass.set(key, (byClass.get(key) === undefined ? 0 : byClass.get(key)!) + 1);
    }
    for (const [issueClass, count] of [...byClass].sort((a, b) => b[1] - a[1])) {
      console.log(`  cannot backfill — needs a predicate: ${issueClass} ×${count}`);
    }
  }
  for (const violation of report.violations) console.log(`  ContractViolation: ${violation}`);
  console.log('');
}

// ─── Nightly evaluation ────────────────────────────────────────────────────────

interface EvaluationOutcome {
  record: LedgerRecord;
  verdict: PredicateVerdict;
  from: LedgerStatus;
  to: LedgerStatus;
  changed: boolean;
}

/**
 * The state machine, isolated from IO so the tests can drive synthetic nights.
 *
 * `alreadyCountedTonight` exists because `attempts` counts failing NIGHTS, not
 * failing runs. A CI retry at 03:20 after a timeout at 03:00 must not push an item
 * two thirds of the way to escalation on a single night's evidence.
 */
export function decide(
  record: LedgerRecord,
  verdict: PredicateVerdict,
  escalateAfter: number,
  alreadyCountedTonight = false,
): { to: LedgerStatus; attempts: number; changed: boolean } {
  if (verdict.result === 'unevaluable') {
    // Untouched. Not a pass, not a fail, and above all not an attempt.
    return { to: record.status, attempts: record.attempts, changed: false };
  }
  if (verdict.result === 'pass') {
    if (record.status === 'closed') return { to: 'closed', attempts: 0, changed: false };
    return { to: 'closed', attempts: 0, changed: true };
  }
  // fail. A repeat run on a night already counted changes nothing — except a
  // regression, which is news the first time it is seen regardless of the clock.
  if (alreadyCountedTonight && record.status !== 'closed') {
    return { to: record.status, attempts: record.attempts, changed: false };
  }
  const attempts = record.attempts + 1;
  if (record.status === 'closed') return { to: 'regressed', attempts: 1, changed: true };
  if (record.status === 'regressed') return { to: 'regressed', attempts, changed: true };
  if (attempts >= escalateAfter) return { to: 'escalated', attempts, changed: true };
  return { to: 'open', attempts, changed: true };
}

async function evaluateAll(opts: Options, ctx: EvalContext): Promise<{
  outcomes: EvaluationOutcome[];
  skippedRetracted: string[];
}> {
  const ledgerPath = opts.ledgerPath === null ? undefined : opts.ledgerPath;
  const retractions = loadRetractions();
  const state = currentState(ledgerPath);
  const outcomes: EvaluationOutcome[] = [];
  const skippedRetracted: string[] = [];

  for (const record of state.values()) {
    if (findRetraction(retractions, record.id, record.page, record.issueClass) !== null) {
      skippedRetracted.push(record.id);
      continue;
    }

    const subjectCtx: EvalContext = {
      ...ctx,
      subject: { id: record.id, firstSeen: record.firstSeen, lastSeen: record.lastSeen },
    };
    const verdict = await evaluatePredicate(record.closurePredicate, subjectCtx);
    const countedTonight = record.lastSeen === ctx.today && record.attempts > 0;
    const decision = decide(record, verdict, opts.escalateAfter, countedTonight);

    let resulting = record;
    if (decision.changed && !opts.dryRun) {
      resulting = transition(record.id, decision.to, {
        attempts: decision.attempts,
        evidence: verdict.evidence,
        closedBy: decision.to === 'closed' ? 'ledger-evaluate' : undefined,
        ledgerPath,
      });
    } else if (decision.changed) {
      resulting = { ...record, status: decision.to, attempts: decision.attempts, lastSeen: ctx.today };
    }

    outcomes.push({
      record: resulting,
      verdict,
      from: record.status,
      to: decision.to,
      changed: decision.changed,
    });
  }

  return { outcomes, skippedRetracted };
}

// ─── State file for the report (§7.6) ──────────────────────────────────────────

function buildState(
  opts: Options,
  ctx: EvalContext,
  outcomes: EvaluationOutcome[],
  skippedRetracted: string[],
): Record<string, unknown> {
  const now = ctx.now;
  const counts: Record<LedgerStatus, number> = { open: 0, closed: 0, escalated: 0, regressed: 0 };
  for (const outcome of outcomes) counts[outcome.to] += 1;

  const describe = (outcome: EvaluationOutcome): Record<string, unknown> => ({
    id: outcome.record.id,
    kind: outcome.record.kind,
    page: outcome.record.page === undefined ? null : outcome.record.page,
    issueClass: outcome.record.issueClass === undefined ? null : outcome.record.issueClass,
    severity: outcome.record.severity === undefined ? null : outcome.record.severity,
    summary: outcome.record.summary === undefined ? null : outcome.record.summary,
    predicate: describePredicate(outcome.record.closurePredicate),
    ageDays: ageDays(outcome.record, now),
    attempts: outcome.record.attempts,
    firstSeen: outcome.record.firstSeen,
    lastSeen: outcome.record.lastSeen,
    verdict: outcome.verdict.result,
    reason: outcome.verdict.reason,
  });

  const passCount = outcomes.filter((o) => o.verdict.result === 'pass').length;
  const failCount = outcomes.filter((o) => o.verdict.result === 'fail').length;
  const unevaluable = outcomes.filter((o) => o.verdict.result === 'unevaluable');
  const openish = outcomes.filter((o) => o.to !== 'closed');
  const unevaluableOpen = unevaluable.filter((o) => o.to !== 'closed');

  const byReason = new Map<string, number>();
  for (const outcome of unevaluable) {
    const key = `${outcome.record.closurePredicate.kind}: ${outcome.verdict.reason}`;
    byReason.set(key, (byReason.get(key) === undefined ? 0 : byReason.get(key)!) + 1);
  }

  const evaluated = outcomes.length;
  const settled = passCount + failCount;

  return {
    generatedAt: now.toISOString(),
    ledgerPath: getLedgerPath(),
    escalateAfter: opts.escalateAfter,
    dryRun: opts.dryRun,
    counts: { ...counts, total: outcomes.length, retractedSkipped: skippedRetracted.length },
    closedTonight: outcomes.filter((o) => o.changed && o.to === 'closed').map(describe),
    regressed: outcomes.filter((o) => o.to === 'regressed').map(describe),
    escalated: outcomes.filter((o) => o.to === 'escalated').map(describe),
    stuck: openish
      .map(describe)
      .sort((a, b) => (b.ageDays as number) - (a.ageDays as number)),
    coverage: {
      evaluated,
      pass: passCount,
      fail: failCount,
      unevaluable: unevaluable.length,
      /** Share of tonight's items the system could actually settle. §7.6 states this in the report. */
      coveragePercent: evaluated === 0 ? 0 : Math.round((settled / evaluated) * 1000) / 10,
      openUnevaluable: unevaluableOpen.length,
      byReason: Object.fromEntries([...byReason].sort((a, b) => b[1] - a[1])),
      items: unevaluable.map((o) => ({
        id: o.record.id,
        page: o.record.page === undefined ? null : o.record.page,
        predicate: describePredicate(o.record.closurePredicate),
        reason: o.verdict.reason,
      })),
    },
    /** What the system could not see tonight, at source level rather than item level. */
    blindSpots: {
      probes: ctx.probes === null ? (ctx.probeReason === null ? 'absent' : ctx.probeReason) : null,
      probeSource: ctx.probeSource,
      collectors: [...ctx.collectors.keys()],
      gsc: ctx.gscPageMetrics === null ? ctx.gscReason : null,
      gscSource: ctx.gscSource,
      network: ctx.allowNetwork ? null : 'disabled by --no-network',
    },
    transitions: outcomes
      .filter((o) => o.changed)
      .map((o) => ({ id: o.record.id, from: o.from, to: o.to, reason: o.verdict.reason })),
    retractedSkipped: skippedRetracted,
  };
}

function printState(state: Record<string, unknown>): void {
  const counts = state.counts as Record<string, number>;
  const coverage = state.coverage as Record<string, unknown>;
  console.log('');
  console.log('─── ledger status ──────────────────────────────────────────');
  console.log('  status      count');
  for (const status of ['open', 'closed', 'escalated', 'regressed'] as const) {
    console.log(`  ${status.padEnd(11)} ${String(counts[status]).padStart(5)}`);
  }
  console.log(`  ${'TOTAL'.padEnd(11)} ${String(counts.total).padStart(5)}`);
  console.log('');
  console.log('─── coverage ───────────────────────────────────────────────');
  console.log(
    `  evaluated ${coverage.evaluated} · pass ${coverage.pass} · fail ${coverage.fail} · unevaluable ${coverage.unevaluable} → coverage ${coverage.coveragePercent}%`,
  );
  const byReason = coverage.byReason as Record<string, number>;
  for (const [reason, count] of Object.entries(byReason)) {
    console.log(`  unevaluable ×${count}: ${reason}`);
  }

  const regressed = state.regressed as Array<Record<string, unknown>>;
  if (regressed.length > 0) {
    console.log('');
    console.log('─── REGRESSED (was closed, now failing) ────────────────────');
    for (const item of regressed) {
      console.log(`  ${item.id} ${item.page} — ${item.predicate} — ${item.reason} (age ${item.ageDays}d)`);
    }
  }

  const escalated = state.escalated as Array<Record<string, unknown>>;
  if (escalated.length > 0) {
    console.log('');
    console.log('─── ESCALATED ──────────────────────────────────────────────');
    for (const item of escalated) {
      console.log(`  ${item.id} ${item.page} — ${item.attempts} failing night(s) — ${item.reason}`);
    }
  }

  const stuck = state.stuck as Array<Record<string, unknown>>;
  if (stuck.length > 0) {
    console.log('');
    console.log('─── OPEN, by age ───────────────────────────────────────────');
    for (const item of stuck.slice(0, 20)) {
      console.log(`  ${String(item.ageDays).padStart(4)}d  ${item.id}  ${item.page}  ${item.predicate}  [${item.verdict}]`);
    }
  }
  console.log('');
}

// ─── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.ledgerPath !== null) setLedgerPath(opts.ledgerPath);

  if (opts.backfill) {
    const report = backfill(opts);
    printBackfill(report);
    console.log(`[backfill] ledger: ${getLedgerPath()} — run \`npm run ledger:evaluate\` to evaluate it`);
    return;
  }

  const ctx = await buildEvalContext({ allowNetwork: opts.allowNetwork });
  if (ctx.probes === null) console.log(`[ledger] no probe data — ${ctx.probeReason ?? 'no reason recorded'}`);
  if (ctx.gscPageMetrics === null) console.log(`[ledger] no GSC metrics — ${ctx.gscReason ?? 'no reason recorded'}`);

  const { outcomes, skippedRetracted } = await evaluateAll(opts, ctx);
  const state = buildState(opts, ctx, outcomes, skippedRetracted);

  if (!opts.dryRun) {
    const target = resolve(REPO_ROOT, opts.statePath);
    writeFileSync(target, `${JSON.stringify(state, null, 2)}\n`);
    console.log(`[ledger] state written to ${opts.statePath}`);
  }
  printState(state);
}

/** Only run as a script, so the tests can import decide()/inferPredicate(). */
const invokedDirectly = process.argv[1] !== undefined && /ledger-evaluate\.ts$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    process.exitCode = 1;
  });
}

export { backfill, evaluateAll, main };
