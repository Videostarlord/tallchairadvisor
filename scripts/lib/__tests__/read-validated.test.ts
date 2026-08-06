/**
 * read-validated.test.ts — acceptance tests for God's-Eye PRD step 2 (§7.2).
 *
 * Run: npx tsx scripts/lib/__tests__/read-validated.test.ts
 *
 * No test runner is installed and package.json is not this step's to edit, so
 * this follows the existing convention in scripts/*.test.ts: a plain tsx script
 * that exits non-zero on failure.
 *
 * These tests run against the REAL data files in data/. That is deliberate. A
 * contract layer validated only against fixtures tells you your fixtures are
 * consistent; it does not tell you the pipeline's actual inputs satisfy their
 * SLAs. Nothing here writes to data/ — the reconciler replay copies into a
 * temp directory first, and asserts afterwards that the real file is untouched.
 *
 * PRD §9 step-2 acceptance row:
 *   - reconcileInterventions produces a NON-IDENTICAL rewrite when replayed
 *     against a real history snapshot          → test 1
 *   - a stale file past its SLA throws, naming the file and its age
 *                                              → tests 8, 9
 *   - zero `?? []` on external input remain    → scripts/lint-architecture.mjs
 */

import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { z } from 'zod';
import {
  ContractViolation,
  REPO_ROOT,
  readValidated,
  readValidatedIfExists,
  readValidatedJsonl,
  readValidatedJsonlIfExists,
  type ReadOptions,
} from '../read-validated.js';
import {
  gscHistoryOptions,
  gscHistorySchema,
  normalizePageKey,
  pageMetricsFrom,
} from '../../schemas/gsc-history.js';
import { interventionSchema, interventionsOptions } from '../../schemas/interventions.js';
import { auditFindingsOptions, auditFindingsSchema } from '../../schemas/audit-findings.js';
import {
  clarityHistoryLineSchema,
  clarityHistoryOptions,
  clarityLatestOptions,
  clarityLatestSchema,
} from '../../schemas/clarity-latest.js';
import { contentRoadmapOptions, contentRoadmapSchema } from '../../schemas/content-roadmap.js';
import {
  costLedgerOptions,
  costRecordSchema,
  tokenLogOptions,
  tokenLogRecordSchema,
} from '../../schemas/cost-ledger.js';
import { ga4LatestOptions, ga4LatestSchema } from '../../schemas/ga4-latest.js';
import { gscAnalysisOptions, gscAnalysisSchema } from '../../schemas/gsc-analysis.js';
import { gscLatestOptions, gscLatestSchema } from '../../schemas/gsc-latest.js';
import { ledgerOptions, ledgerRecordSchema } from '../../schemas/ledger.js';
import { pipelineStatusOptions, pipelineStatusSchema } from '../../schemas/pipeline-status.js';
import { retractionSchema, retractionsOptions } from '../../schemas/retractions.js';
import { verifiedAsinsOptions, verifiedAsinsSchema } from '../../schemas/verified-asins.js';
import { reconcileInterventions } from '../../agents/wiki-utils.js';

// ─── Tiny harness ──────────────────────────────────────────────────────────────

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  ✗ ${name}`);
    console.log(`      ${err instanceof Error ? err.message : String(err)}`);
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Runs `fn`, requires a ContractViolation, returns its full message. */
function violationFrom(fn: () => unknown): string {
  try {
    fn();
  } catch (err) {
    if (err instanceof ContractViolation) return err.message;
    throw new Error(`expected ContractViolation, got ${err instanceof Error ? err.name : typeof err}: ${String(err)}`);
  }
  throw new Error('expected a ContractViolation; the call succeeded');
}

/**
 * Rewind the reconciliation fields to their pre-reconciliation values.
 *
 * WHY THIS EXISTS (2026-08-06). Every test below replays the reconciler over a copy
 * of the REAL data/interventions.jsonl — deliberately, per the header note. But the
 * reconciler skips any entry with `reconciledAt !== null` (read-validated.ts:385),
 * and the nightly has now reconciled all 8 real entries. Replaying against that file
 * verbatim is a guaranteed no-op, which:
 *
 *   - made the headline test fail permanently, reporting the original bug as "still
 *     present" when the reconciler is in fact working; and
 *   - made the contract-violation test at the bottom pass VACUOUSLY — `before === after`
 *     was true because there was nothing to reconcile, not because a failed contract
 *     was correctly refused.
 *
 * A one-shot acceptance assertion ("prove the bug is fixed today") became order-dependent
 * the moment production data moved past it. Rewinding here restores the original intent
 * and makes it permanent: the fixture is always genuinely unreconciled, whatever the
 * nightly has since done to data/.
 */
function unreconciled(jsonl: string): string {
  return jsonl
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // lint-architecture-allow R4 -- rewinding a test fixture, not reading pipeline input; the tests below re-read it through readValidatedJsonl, which is where the contract is enforced
      const entry = JSON.parse(line) as Record<string, unknown>;
      entry.reconciledAt = null;
      entry.afterMetric = null;
      entry.deltaPercent = null;
      entry.confidenceLevel = 'none';
      return JSON.stringify(entry);
    })
    .join('\n') + '\n';
}

/** A throwaway repo root containing real data, safe to mutate. */
function tempRootWithData(): string {
  const root = mkdtempSync(resolve(tmpdir(), 'tca-contract-test-'));
  mkdirSync(resolve(root, 'data/gsc'), { recursive: true });
  writeFileSync(
    resolve(root, 'data/interventions.jsonl'),
    unreconciled(readFileSync(resolve(REPO_ROOT, 'data/interventions.jsonl'), 'utf-8')),
  );
  cpSync(resolve(REPO_ROOT, 'data/gsc/history'), resolve(root, 'data/gsc/history'), { recursive: true });
  return root;
}

const LATEST_SNAPSHOT = 'data/gsc/history/2026-08-03.json';
const REAL_INTERVENTIONS = resolve(REPO_ROOT, 'data/interventions.jsonl');

// ─── 1. THE HEADLINE (PRD §9, step 2) ──────────────────────────────────────────

console.log('\nreconciler — the bug this whole step exists for');

test('reconcileInterventions produces a NON-IDENTICAL rewrite against real snapshots', () => {
  const realBefore = readFileSync(REAL_INTERVENTIONS, 'utf-8');
  const root = tempRootWithData();
  const target = resolve(root, 'data/interventions.jsonl');
  const before = readFileSync(target, 'utf-8');

  reconcileInterventions(root);

  const after = readFileSync(target, 'utf-8');
  assert(
    before !== after,
    'interventions.jsonl was rewritten BYTE-IDENTICAL — this is exactly the original bug, still present',
  );

  const changed = before
    .split('\n')
    .filter(Boolean)
    .filter((line, i) => line !== after.split('\n').filter(Boolean)[i]).length;
  assert(changed > 0, 'no lines changed');

  assert(
    readFileSync(REAL_INTERVENTIONS, 'utf-8') === realBefore,
    'the REAL data/interventions.jsonl was modified — tests must never write to data/',
  );
});

test('reconciled entries carry a real afterMetric, not null', () => {
  const root = tempRootWithData();
  reconcileInterventions(root);
  const rows = readValidatedJsonl(
    resolve(root, 'data/interventions.jsonl'),
    interventionSchema,
    interventionsOptions,
  );
  const reconciled = rows.filter((r) => r.reconciledAt !== null);
  assert(reconciled.length > 0, 'nothing reconciled at all');
  for (const row of reconciled) {
    assert(row.afterMetric !== null, `${row.slug} reconciled with afterMetric=null`);
    assert(row.confidenceLevel !== 'none', `${row.slug} reconciled but confidence stayed 'none'`);
  }
});

test('already-reconciled entries are never modified (immutability latch)', () => {
  const root = tempRootWithData();
  reconcileInterventions(root);
  const once = readFileSync(resolve(root, 'data/interventions.jsonl'), 'utf-8');
  reconcileInterventions(root);
  const twice = readFileSync(resolve(root, 'data/interventions.jsonl'), 'utf-8');
  assert(once === twice, 'a second reconcile pass changed already-reconciled entries');
});

test('a contract-violating snapshot leaves entries unreconciled instead of killing the run', () => {
  const root = tempRootWithData();
  // Corrupt the snapshot the 2026-07-20 interventions resolve to.
  writeFileSync(resolve(root, 'data/gsc/history/2026-08-03.json'), '{"generatedAt":"2026-08-03T11:30:13.162Z"}');
  const before = readFileSync(resolve(root, 'data/interventions.jsonl'), 'utf-8');

  reconcileInterventions(root); // must NOT throw

  const after = readFileSync(resolve(root, 'data/interventions.jsonl'), 'utf-8');
  assert(before === after, 'entries were enriched from a snapshot that failed its contract');
});

// ─── 2. "Did you mean …?" — the missing-key hint ────────────────────────────────

console.log('\ncontract errors name the file, the key, and the key you meant');

test("asking a history snapshot for 'pages' suggests 'opportunities'", () => {
  // Precisely the shape the old reconciler assumed existed.
  const wrongSchema = z
    .object({
      pages: z.array(
        z.object({
          page: z.string(),
          ctr: z.number(),
          position: z.number(),
          impressions: z.number(),
        }),
      ),
    })
    .passthrough();

  const message = violationFrom(() => readValidated(LATEST_SNAPSHOT, wrongSchema));
  console.log(`      → ${message}`);
  assert(message.includes(LATEST_SNAPSHOT), 'error does not name the file');
  assert(message.includes("requires 'pages'"), 'error does not name the failing key');
  assert(
    message.includes("Did you mean 'opportunities'?"),
    `error does not suggest 'opportunities'. Got: ${message}`,
  );
});

test('history snapshots genuinely have no `pages` key (the premise of the bug)', () => {
  const snapshot = readValidated(LATEST_SNAPSHOT, gscHistorySchema, gscHistoryOptions);
  assert(!('pages' in snapshot), 'snapshot unexpectedly HAS a pages key');
  assert(snapshot.opportunities.length > 0, 'snapshot has no opportunities rows');
});

// ─── 3. pageMetricsFrom ────────────────────────────────────────────────────────

console.log('\npageMetricsFrom');

test('returns a non-empty Map keyed by normalised path', () => {
  const snapshot = readValidated(LATEST_SNAPSHOT, gscHistorySchema, gscHistoryOptions);
  const metrics = pageMetricsFrom(snapshot);
  assert(metrics.size > 0, 'map is empty — this is the empty-Map bug wearing a new hat');
  for (const key of metrics.keys()) {
    assert(key.startsWith('/'), `key '${key}' is not a path`);
    assert(!key.startsWith('http'), `key '${key}' still carries an origin`);
  }
});

test('every intervention slug on disk resolves in the snapshot (the join actually joins)', () => {
  const snapshot = readValidated(LATEST_SNAPSHOT, gscHistorySchema, gscHistoryOptions);
  const metrics = pageMetricsFrom(snapshot);
  const rows = readValidatedJsonl('data/interventions.jsonl', interventionSchema, interventionsOptions);
  for (const row of rows) {
    assert(
      metrics.has(normalizePageKey(row.slug)),
      `slug ${row.slug} is absent from the snapshot — a key-format mismatch would silently produce zero reconciliations`,
    );
    // The other page key on an intervention is a SOURCE FILE and must not join.
    assert(
      !metrics.has(row.page),
      `entry.page (${row.page}) matched a snapshot key; joins must use slug, not the .astro path`,
    );
  }
});

test('normalizePageKey collapses absolute URLs and bare paths onto one key', () => {
  assert(normalizePageKey('https://tallchairadvisor.com/review/gesture/') === '/review/gesture/', 'origin not stripped');
  assert(normalizePageKey('/review/gesture') === '/review/gesture/', 'trailing slash not added');
  assert(normalizePageKey('/review/gesture/') === '/review/gesture/', 'trailing slash not idempotent');
  assert(normalizePageKey('/') === '/', 'root path mangled');
  assert(normalizePageKey('/sitemap.xml') === '/sitemap.xml', 'file-like path wrongly given a trailing slash');
});

// ─── 4. Freshness SLAs ─────────────────────────────────────────────────────────

console.log('\nfreshness');

test('a stale EMBEDDED timestamp throws, naming the file, the key, and the age', () => {
  // timestampKey is preferred over mtime because mtime lies after a git clone
  // in CI, where every file looks brand new.
  const message = violationFrom(() =>
    readValidated(LATEST_SNAPSHOT, gscHistorySchema, {
      ...gscHistoryOptions,
      maxAgeHours: 1,
      timestampKey: 'generatedAt',
    }),
  );
  console.log(`      → ${message}`);
  assert(message.includes(LATEST_SNAPSHOT), 'error does not name the file');
  assert(message.includes('generatedAt'), 'error does not name the timestamp source');
  assert(/\d+h old/.test(message), 'error does not state the age in hours');
  assert(message.includes('SLA is 1h'), 'error does not state the SLA');
});

test('every real data file satisfies its own PRD §7.2 contract right now', () => {
  // Not a mock. If a collector stops running, or gsc-analyze changes shape, or
  // a file goes past its SLA, this test starts failing — which is the point.
  // Files that have never been written yet are SKIPPED (readValidatedIfExists /
  // readValidatedJsonlIfExists): absence is step 3/4's problem, corruption is
  // this layer's, and the two must never be conflated.
  const json: Array<[string, z.ZodTypeAny, ReadOptions]> = [
    ['data/gsc/analysis.json', gscAnalysisSchema, gscAnalysisOptions],
    ['data/gsc/latest.json', gscLatestSchema, gscLatestOptions],
    ['data/ga4/latest.json', ga4LatestSchema, ga4LatestOptions],
    ['data/clarity/latest.json', clarityLatestSchema, clarityLatestOptions],
    ['data/audit-findings.json', auditFindingsSchema, auditFindingsOptions],
    ['data/verified-asins.json', verifiedAsinsSchema, verifiedAsinsOptions],
    ['data/content-roadmap.json', contentRoadmapSchema, contentRoadmapOptions],
    ['data/pipeline-status.json', pipelineStatusSchema, pipelineStatusOptions],
  ];
  const jsonl: Array<[string, z.ZodTypeAny, ReadOptions]> = [
    ['data/interventions.jsonl', interventionSchema, interventionsOptions],
    ['data/retractions.jsonl', retractionSchema, retractionsOptions],
    ['data/clarity/history.jsonl', clarityHistoryLineSchema, clarityHistoryOptions],
    ['data/cost-ledger.jsonl', costRecordSchema, costLedgerOptions],
    ['data/ledger.jsonl', ledgerRecordSchema, ledgerOptions],
    ['data/token-log.jsonl', tokenLogRecordSchema, tokenLogOptions],
  ];

  let checked = 0;
  for (const [path, schema, opts] of json) {
    if (readValidatedIfExists(path, schema, opts) !== null) checked++;
  }
  for (const [path, schema, opts] of jsonl) {
    if (readValidatedJsonlIfExists(path, schema, opts) !== null) checked++;
  }

  // Every history snapshot, not just the newest — the archives are what the
  // reconciler actually reaches for when an intervention is 14 days old.
  const historyDir = resolve(REPO_ROOT, 'data/gsc/history');
  const snapshots = readdirSync(historyDir).filter((f) => f.endsWith('.json'));
  assert(snapshots.length > 0, 'no history snapshots on disk');
  for (const file of snapshots) {
    readValidated(`data/gsc/history/${file}`, gscHistorySchema, gscHistoryOptions);
    checked++;
  }

  console.log(`      → ${checked} real data files validated against their contracts`);
});

test('a stale file mtime throws when no timestampKey is configured', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'tca-stale-'));
  const file = resolve(root, 'stale.json');
  writeFileSync(file, JSON.stringify({ ok: true }));
  const message = violationFrom(() =>
    readValidated(file, z.object({ ok: z.boolean() }).passthrough(), { maxAgeHours: -1 }),
  );
  assert(message.includes('file mtime'), `expected an mtime-sourced staleness error, got: ${message}`);
});

test('a missing freshness key throws rather than defaulting to "fresh"', () => {
  const message = violationFrom(() =>
    readValidated(LATEST_SNAPSHOT, gscHistorySchema, {
      maxAgeHours: 24,
      timestampKey: 'pulledAt', // real key is generatedAt
    }),
  );
  assert(message.includes("'pulledAt'"), 'error does not name the missing timestamp key');
  assert(message.includes('key absent'), `expected 'key absent', got: ${message}`);
});

// ─── 5. Floors, absence, corruption ────────────────────────────────────────────

console.log('\nfloors and failure modes');

test('an empty `opportunities` array throws instead of validating', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'tca-empty-'));
  const file = resolve(root, 'snapshot.json');
  // Read the real snapshot THROUGH the contract, then break it — building the
  // fixture with a raw JSON.parse would violate the very rule under test.
  const real = readValidated(LATEST_SNAPSHOT, gscHistorySchema, gscHistoryOptions);
  writeFileSync(file, JSON.stringify({ ...real, opportunities: [] }));
  const message = violationFrom(() => readValidated(file, gscHistorySchema, gscHistoryOptions));
  assert(message.includes('opportunities'), `error does not name opportunities: ${message}`);
  assert(message.includes('≥1'), `error does not state the floor: ${message}`);
});

test('an absent file throws, and readValidatedIfExists returns null', () => {
  const missing = resolve(REPO_ROOT, 'data/definitely-not-here.json');
  const schema = z.object({ a: z.string() });
  const message = violationFrom(() => readValidated(missing, schema));
  assert(message.includes('does not exist'), `unexpected message: ${message}`);
  assert(readValidatedIfExists(missing, schema) === null, 'readValidatedIfExists did not return null');
});

test('a present-but-invalid file still throws from readValidatedIfExists', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'tca-invalid-'));
  const file = resolve(root, 'invalid.json');
  writeFileSync(file, JSON.stringify({ b: 1 }));
  violationFrom(() => readValidatedIfExists(file, z.object({ a: z.string() })));
});

test('malformed JSON throws with a location, not a silent skip', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'tca-malformed-'));
  const file = resolve(root, 'broken.json');
  writeFileSync(file, '{"a": 1,,}');
  const message = violationFrom(() => readValidated(file, z.object({ a: z.number() })));
  assert(message.includes('malformed JSON'), `unexpected message: ${message}`);
});

test('an invalid JSONL line throws naming its line number, never skipped', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'tca-jsonl-'));
  const file = resolve(root, 'log.jsonl');
  const good = readFileSync(REAL_INTERVENTIONS, 'utf-8').split('\n').filter(Boolean)[0];
  writeFileSync(file, `${good}\n{"interventionType":"complex"}\n`);
  const message = violationFrom(() => readValidatedJsonl(file, interventionSchema, interventionsOptions));
  assert(message.includes('line 2'), `error does not name the line: ${message}`);
});

// ─── Result ────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const name of failures) console.log(`  FAILED: ${name}`);
  process.exit(1);
}
