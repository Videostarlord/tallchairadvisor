/**
 * collect-all.ts — L1 orchestrator. `npm run collect:all`, invoked by
 * .github/workflows/nightly.yml (PRD §7.4).
 *
 * THE EXIT-CODE CONTRACT — the most important line in this file
 *
 *   An unhealthy collector is a SUCCESSFUL run of the observation system.
 *   This process exits non-zero ONLY if the harness itself crashed.
 *
 * That is not leniency. The nightly's job is to know the state of the world,
 * and "Cloudflare has no token" is knowledge. If a missing credential failed
 * the run, the workflow would go red, the report step would run against no
 * data, and Jackson would be back to opening Claude Code to find out why —
 * which is the exact problem this PRD exists to eliminate. Failure is
 * expressed as a ledger finding with a closure predicate, not as an exit code.
 *
 * WHAT THIS WRITES
 *   data/collectors/<name>.json   one CollectorResult per source
 *   data/collectors/latest.json   roll-up + every result, for the L5 report
 *
 * Both are committed by nightly.yml with `[skip cd]`.
 *
 * PARALLELISM: all seven run concurrently. They touch disjoint services and
 * disjoint files, and the slowest (gsc, ~1 URL Inspection call/second) would
 * otherwise dominate wall-clock. Their logs interleave; each collector prefixes
 * its own output, and the authoritative summary is the table printed at the end.
 */

import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { warnOnEnvNameDrift } from './lib/env-names.js';
import { REPO_ROOT } from './lib/read-validated.js';
import * as amazon from './collectors/amazon.js';
import * as clarity from './collectors/clarity.js';
import * as cloudflare from './collectors/cloudflare.js';
import * as ga4 from './collectors/ga4.js';
import * as githubActions from './collectors/github-actions.js';
import * as gsc from './collectors/gsc.js';
import * as quotas from './collectors/quotas.js';
import { renderStatusTable, type StatusRow } from './collectors/table.js';
import type { CollectorResult } from './collectors/types.js';

const OUTPUT_DIR = resolve(REPO_ROOT, 'data/collectors');

interface Registered {
  name: string;
  collect: () => Promise<CollectorResult<unknown>>;
}

/** Order here is the order in the status table. */
const COLLECTORS: Registered[] = [
  { name: 'gsc', collect: gsc.collect },
  { name: 'ga4', collect: ga4.collect },
  { name: 'clarity', collect: clarity.collect },
  { name: 'cloudflare', collect: cloudflare.collect },
  { name: 'github-actions', collect: githubActions.collect },
  { name: 'quotas', collect: quotas.collect },
  { name: 'amazon', collect: amazon.collect },
];

// ─── Ledger (guarded — scripts/lib/ledger.ts is in flight) ────────────────────

interface LedgerOutcome {
  available: boolean;
  filed: number;
  failed: number;
  note: string;
}

/**
 * `scripts/lib/ledger.ts` is being written by another agent in parallel. This
 * import is guarded so a missing or half-finished ledger cannot stop the
 * nightly from collecting — the collectors are useful on their own, and a
 * hard dependency would mean two agents' work has to land in the same commit.
 *
 * The specifier is held in a variable deliberately: a literal would be resolved
 * statically by the bundler/type-checker and fail the build before this code
 * ever gets a chance to degrade gracefully.
 *
 * API, verified against the landed scripts/lib/ledger.ts: `fileFinding(input)`
 * validates the predicate, derives sha1(page|issueClass) as the id, APPENDS the
 * record itself, and is idempotent — re-filing an existing id returns the
 * current record and writes nothing, so a collector that is unhealthy for a
 * week does not reset its own age or file seven duplicates. `appendLedger` is
 * therefore deliberately NOT called here; doing so would double-write.
 *
 * Predicate kind: `collector-healthy` (registered in scripts/lib/predicates/).
 * `kind` must be 'finding' — the ledger's enum admits only finding|intervention.
 */
async function loadLedger(): Promise<Record<string, unknown> | null> {
  const specifier = './lib/ledger.js';
  try {
    return (await import(specifier)) as Record<string, unknown>;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `[collect-all] scripts/lib/ledger.ts not loadable — unhealthy collectors will NOT be filed as findings ` +
        `tonight. This is degraded, and it is recorded in data/collectors/latest.json. Reason: ${reason}`
    );
    return null;
  }
}

async function fileFindings(unhealthy: Array<{ name: string; reason: string }>): Promise<LedgerOutcome> {
  if (unhealthy.length === 0) {
    return { available: true, filed: 0, failed: 0, note: 'no unhealthy collectors to file' };
  }

  const ledger = await loadLedger();
  if (ledger === null) {
    return {
      available: false,
      filed: 0,
      failed: unhealthy.length,
      note: 'scripts/lib/ledger.ts absent or not loadable — findings not filed; see stderr',
    };
  }

  const fileFinding = ledger.fileFinding;
  if (typeof fileFinding !== 'function') {
    return {
      available: false,
      filed: 0,
      failed: unhealthy.length,
      note: `scripts/lib/ledger.ts loaded but exports no fileFinding() (saw: ${Object.keys(ledger).join(', ')})`,
    };
  }

  let filed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const { name, reason } of unhealthy) {
    try {
      (fileFinding as (input: unknown) => unknown)({
        kind: 'finding',
        // id is derived by the ledger as sha1(page|issueClass) — the same
        // convention audit-findings.ts uses, so a collector keeps one identity
        // across nights instead of forking a new item every run.
        page: `collector:${name}`,
        issueClass: 'collector-unhealthy',
        severity: 'high',
        summary: `collector "${name}" reported healthy:false — ${reason}`,
        // The predicate that closes this finding: the collector coming back
        // healthy on a later night, evaluated against data/collectors/<name>.json.
        closurePredicate: { kind: 'collector-healthy', collector: name },
      });
      filed++;
    } catch (error) {
      failed++;
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    available: true,
    filed,
    failed,
    note: errors.length === 0 ? `filed ${filed} collector finding(s)` : `errors — ${errors.join(' | ')}`,
  };
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = new Date();

  // A8. collectors/quotas.ts resolves SerpAPI and DataForSEO over BOTH the repo
  // spelling and the vendor's, which is what has kept the drift invisible: a
  // machine configured entirely under the vendor names looks healthy here and
  // then aborts in keyword-discovery.ts, which accepts only the canonical name.
  // Backward compatibility is kept — the aliases still work — but it stops being
  // silent. Reported before the collectors run so the warning is at the top of
  // the log rather than buried under seven parallel collectors' interleaved
  // output, and recorded on the roll-up so it survives the runner.
  const envDrift = warnOnEnvNameDrift();

  console.log(`[collect-all] ${startedAt.toISOString()} — running ${COLLECTORS.length} collectors in parallel\n`);

  const settled = await Promise.all(
    COLLECTORS.map(async (entry) => {
      const t0 = Date.now();
      // collect() is contractually non-throwing (guard() in collectors/types.ts).
      // This second net exists because "contractually" is not "provably".
      let result: CollectorResult<unknown>;
      try {
        result = await entry.collect();
      } catch (error) {
        result = {
          data: null,
          meta: {
            collectedAt: new Date().toISOString(),
            rowCount: 0,
            healthy: false,
            reason: `${entry.name}: collect() threw past its own guard — ${error instanceof Error ? error.message : String(error)}`,
          },
        };
      }
      return { name: entry.name, result, ms: Date.now() - t0 };
    })
  );

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const { name, result } of settled) {
    writeFileSync(resolve(OUTPUT_DIR, `${name}.json`), `${JSON.stringify(result, null, 2)}\n`);
  }

  const unhealthy = settled
    .filter((s) => !s.result.meta.healthy)
    .map((s) => ({
      name: s.name,
      reason: s.result.meta.reason === null ? '(no reason recorded — this is a bug)' : s.result.meta.reason,
    }));

  const ledger = await fileFindings(unhealthy);

  const healthyCount = settled.length - unhealthy.length;
  const rollup = {
    collectedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    healthy: unhealthy.length === 0,
    healthyCount,
    total: settled.length,
    coveragePct: Math.round((healthyCount / settled.length) * 100),
    unhealthy,
    // Name-only. Values are never recorded here — data/collectors/latest.json is
    // committed to the repo every night.
    envNameDrift: envDrift.map((d) => ({ kind: d.kind, canonical: d.canonical, alias: d.alias })),
    ledger,
    collectors: Object.fromEntries(settled.map((s) => [s.name, s.result])),
  };
  writeFileSync(resolve(OUTPUT_DIR, 'latest.json'), `${JSON.stringify(rollup, null, 2)}\n`);

  const rows: StatusRow[] = settled.map((s) => ({
    name: s.name,
    healthy: s.result.meta.healthy,
    rowCount: s.result.meta.rowCount,
    reason: s.result.meta.reason,
    ms: s.ms,
  }));

  console.log(`\n${renderStatusTable(rows)}\n`);
  console.log(`ledger: ${ledger.note}`);
  console.log(`written: data/collectors/{${settled.map((s) => s.name).join(',')},latest}.json`);
  console.log(
    unhealthy.length === 0
      ? 'exit 0 — all collectors healthy'
      : `exit 0 — ${unhealthy.length} collector(s) reported healthy:false WITH a reason. ` +
          'That is a successful run of the observation system, not a failed one.'
  );
}

main().catch((error) => {
  // Reached only when the harness itself broke: an unwritable data/collectors,
  // a bad import, an OOM. Never for a collector that merely failed.
  console.error('[collect-all] HARNESS FAILURE — the collection run itself could not complete.');
  console.error(error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error));
  process.exit(1);
});
