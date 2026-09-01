/**
 * scripts/schemas/ — L0 contracts, one module per data file (PRD §7.2).
 *
 * Every module exports a zod schema AND its default `ReadOptions`, so a caller
 * gets the file's SLA for free and cannot accidentally read a file with a weaker
 * contract than the one the PRD specifies:
 *
 *     import { readValidated } from '../lib/read-validated.js';
 *     import { gscAnalysisSchema, gscAnalysisOptions } from '../schemas/index.js';
 *     const analysis = readValidated('data/gsc/analysis.json', gscAnalysisSchema, gscAnalysisOptions);
 *
 * PRD §7.2 SLA table, as implemented:
 *
 *   data/gsc/analysis.json      8d   opportunities ≥1   gsc-analysis.ts
 *   data/gsc/latest.json        8d   pages ≥1           gsc-latest.ts
 *   data/gsc/history/*.json     none opportunities ≥1   gsc-history.ts   ← archives; age is the point
 *   data/ga4/latest.json        8d   pages ≥1           ga4-latest.ts
 *   data/clarity/latest.json    8d   pages ≥1           clarity-latest.ts
 *   data/clarity/history.jsonl  none ≥0                 clarity-latest.ts
 *   data/audit-findings.json    8d   ≥0                 audit-findings.ts
 *   data/interventions.jsonl    none ≥0                 interventions.ts
 *   data/retractions.jsonl      none ≥0                 retractions.ts
 *   data/verified-asins.json    none asins ≥1           verified-asins.ts
 *   data/content-roadmap.json   none ≥0                 content-roadmap.ts
 *   data/content-failed.json    none ≥0                 content-failed.ts
 *   data/gsc/link-audit.json    none gaps present       link-audit.ts    ← see module header re: SLA
 *   data/pipeline-status.json   8d   —                  pipeline-status.ts
 *   data/cost-ledger.jsonl      none ≥0                 cost-ledger.ts
 *   data/ledger.jsonl           none ≥0                 ledger.ts
 *   data/agent-health.jsonl     none ≥0                 agent-health.ts
 *   data/collectors/latest.json 8d   —                  collectors-rollup.ts
 *   reports/{fixes,content}-log.md 8d ≥1 outcome        execution-log.ts  ← markdown; text contract, not zod
 *
 * A "≥1" floor is written into the SCHEMA (`z.array(...).min(1)`), not into
 * `minRows`. `minRows` counts top-level array elements or object KEYS, so on a
 * file whose top level is an object it would pass an analysis containing zero
 * page rows — the exact failure this layer exists to prevent.
 */

export * from './gsc-history.js';
export * from './gsc-analysis.js';
export * from './gsc-latest.js';
export * from './ga4-latest.js';
export * from './clarity-latest.js';
export * from './audit-findings.js';
export * from './interventions.js';
export * from './retractions.js';
export * from './verified-asins.js';
export * from './content-roadmap.js';
export * from './content-failed.js';
export * from './link-audit.js';
export * from './pipeline-status.js';
export * from './cost-ledger.js';
export * from './ledger.js';
export * from './agent-health.js';
export * from './collectors-rollup.js';
export * from './execution-log.js';
export * from './aio-run.js';
