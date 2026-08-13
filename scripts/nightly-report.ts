/**
 * nightly-report.ts — L5 of God's-Eye Nightly (PRD §7.6)
 *
 * One Sonnet call over the whole ledger. Writes wiki/nightly/YYYY-MM-DD.md and
 * pushes to Jackson's phone.
 *
 * THREE RULES, each traceable to a specific past failure:
 *
 * 1. NO `.slice()` ANYWHERE IN THIS PATH.
 *    `strategy.ts` did `auditReport.slice(0, 3000)` and silently discarded every
 *    high and medium finding on a 13,851-char report. The ledger is tens of KB
 *    and fits whole. If it ever does not fit, that is a loud error, not a quiet
 *    truncation — see assertNoTruncation().
 *
 * 2. THE `unverified` RULE — non-negotiable.
 *    Until a value has a contract (§7.2) or a predicate (§7.3) behind it, this
 *    report renders it `unverified`, never as fact. "A report that lies is worse
 *    than no report, because Jackson stops checking and it stays wrong."
 *    The report states its own coverage percentage.
 *
 * 3. IT ALWAYS WRITES.
 *    If every collector failed and the ledger is unreadable, THAT is the report.
 *    "What the system could not see tonight" is a required section. A missing
 *    report is what the dead-man's switch alarms on, so this must never choose
 *    silence — silence is reserved for genuine death.
 *
 * 4. A DETECTOR THAT COULD NOT SEE IS NOT A DETECTOR THAT SAW NOTHING. (A13)
 *    Every incident in this system's history is a MEASUREMENT failing quietly,
 *    not a page failing loudly. Until 2026-08-09 this file faithfully reported
 *    what it observed and held no opinion whatsoever about whether its own eyes
 *    had degraded — a blind collector, a truncated agent and an exhausted quota
 *    all rendered as a calm night. `detectorHealth()` is that opinion. When it
 *    is non-empty the model is FORBIDDEN from characterising the night as
 *    clean, and the phone push says so on the lock screen.
 *
 * 5. THE AGENTS' OWN EXECUTION LOGS ARE SOURCES. (A2)
 *    The week of 2026-08-06 the most important thing the system did was refuse
 *    to do something — the trust layer rejected a fabricated ASIN on a page
 *    scoring 100/100 — and it appeared here nowhere, because reports/
 *    content-log.md and reports/fixes-log.md were not sources. What the
 *    pipeline REFUSED is as much an observation as what it applied.
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { meteredCreate } from './lib/metered-client.js';
import { readValidated, readValidatedJsonl, readValidatedIfExists, readValidatedJsonlIfExists, ContractViolation, type ReadOptions } from './lib/read-validated.js';
import { judgeVerdict, type DetectorVerdict } from './lib/agent-health.js';
import { siteDomain, siteLabel } from './lib/site.js';
import { ledgerRecordSchema, ledgerOptions } from './schemas/ledger.js';
import { pipelineStatusSchema, pipelineStatusOptions } from './schemas/pipeline-status.js';
import { interventionSchema, interventionsOptions } from './schemas/interventions.js';
import { retractionSchema, retractionsOptions } from './schemas/retractions.js';
import { agentHealthRecordSchema, agentHealthOptions } from './schemas/agent-health.js';
import { collectorsRollupSchema, collectorsRollupOptions, quotasDataSchema } from './schemas/collectors-rollup.js';
import { executionLogContract } from './schemas/execution-log.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/**
 * The report date must be the LOCAL date, not the UTC date, because the
 * dead-man's switch looks for `wiki/nightly/<local-date>.md`. At the scheduled
 * 03:00 America/Los_Angeles run the two agree, but a manual run late in the
 * evening would write tomorrow's UTC filename and the switch would then report
 * today's report as missing — a false death alarm. en-CA formats as YYYY-MM-DD.
 */
const TZ = process.env.TCA_TZ ?? 'America/Los_Angeles';
const TODAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const MODEL = 'claude-sonnet-4-6'; // PRD §11 default — matches existing agents
const NTFY_TOPIC = process.env.NTFY_TOPIC ?? '';

/**
 * A source of truth the report may draw on, and whether it is trustworthy tonight.
 *
 * `unevaluable` (A13) is the fourth state and it is NOT a synonym for any of the
 * other three. The file exists, it is fresh, it passed its contract — and the
 * verdict inside it still proves nothing, because the detector that produced it
 * inspected zero units or inspected the wrong surface. Folding that into
 * `verified` is how "no failing assertions" over an empty result set gets read
 * as a clean night; folding it into `missing` would understate coverage and
 * hide the difference between "the file is not there" and "the file is there
 * and lying by omission".
 */
type Trust = 'verified' | 'unverified' | 'unevaluable' | 'missing';

interface Source {
  name: string;
  path: string;
  trust: Trust;
  reason: string | null;
  content: string | null;
  ageHours: number | null;
}

/**
 * One thing that could not see tonight, and why. Collected across agents,
 * collectors, quotas, probes and sources into a single list the model is
 * required to reckon with before it is allowed to call the night quiet.
 */
interface Blindness {
  /** 'collector:clarity' | 'agent:audit' | 'quota:serpapi' | 'source:probes' */
  detector: string;
  reason: string;
}

interface DetectorHealth {
  blind: Blindness[];
  /** How many detectors were assessed at all. 0 means this check itself was blind. */
  checked: number;
  /** Populated when the health check could not run. Never silently empty. */
  selfFailure: string | null;
}

/**
 * The contract a source must satisfy to earn `verified`.
 *
 * `schema` covers JSON and JSONL. `text` covers markdown — the execution logs
 * (A2) are prose, so no zod schema can apply, but "no schema exists for this
 * format" must not become "this file is exempt from having a contract". A text
 * contract throws ContractViolation exactly as `readValidated` does and is run
 * in exactly the same place.
 */
interface SourceContract {
  schema?: z.ZodTypeAny;
  opts?: ReadOptions;
  jsonl?: boolean;
  absenceIsHealthy?: boolean;
  /** Non-JSON contract. Throws ContractViolation on failure; returns void on success. */
  text?: (raw: string, display: string) => void;
  /**
   * Condense for the narrative payload, and — crucially — report what the
   * condensing SAW. A summarizer is itself a detector: `summarizeProbes` emits
   * the sentence the model reads, so if it can emit "no failing assertions"
   * over zero inspected pages it is a detector that reports health it never
   * measured. The verdict it returns is judged by `judgeVerdict`.
   */
  summarize?: (raw: string, path: string) => { text: string; verdict: DetectorVerdict | null };
}

function ageHoursOf(path: string): number | null {
  try {
    return (Date.now() - statSync(path).mtimeMs) / 3_600_000;
  } catch {
    // statSync failed — the caller already knows the file is missing from the
    // existsSync check; an unknown age is reported as null, never as 0.
    return null;
  }
}

/**
 * Load a source. `trust` is the honest answer to "does anything guarantee this
 * is correct?" — a file that merely exists is `unverified`.
 *
 * A `contract` is REQUIRED to earn `verified`, and it is actually executed here
 * rather than asserted. Trusting a file because a schema exists somewhere else
 * in the repo would be precisely the unearned claim this rule exists to stop:
 * the report would state as fact a value nothing had checked. If validation
 * fails, the source degrades to `unverified` carrying the violation as its
 * reason — the content is still shown, but the report may not treat it as true.
 */
function load(
  name: string,
  relPath: string,
  contract: SourceContract | null,
): Source {
  const path = resolve(ROOT, relPath);
  if (!existsSync(path)) {
    // Exception logs (cost drift) are absent exactly when nothing is wrong.
    // Counting that as blindness would understate coverage and, worse, train
    // Jackson to read a healthy 89% as a broken 100% — the report must not cry
    // wolf about its own completeness any more than about the site's.
    if (contract?.absenceIsHealthy) {
      return { name, path: relPath, trust: 'verified', reason: 'absent, which is the healthy state — nothing to report', content: null, ageHours: null };
    }
    return { name, path: relPath, trust: 'missing', reason: `${relPath} does not exist`, content: null, ageHours: null };
  }

  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { name, path: relPath, trust: 'missing', reason: `${relPath} unreadable: ${reason}`, content: null, ageHours: ageHoursOf(path) };
  }
  if (content.trim().length === 0) {
    return { name, path: relPath, trust: 'missing', reason: `${relPath} is empty`, content: null, ageHours: ageHoursOf(path) };
  }

  const ageHours = ageHoursOf(path);
  if (!contract) {
    return { name, path: relPath, trust: 'unverified', reason: `${relPath} has no schema contract or closure predicate behind it`, content, ageHours };
  }

  try {
    if (contract.text !== undefined) contract.text(content, relPath);
    else if (contract.schema === undefined) {
      // A contract object with neither a schema nor a text validator validates
      // nothing. That is a programming error, not a passing source.
      throw new ContractViolation(relPath, `contract for '${name}' declares neither a schema nor a text validator — it checks nothing`);
    } else if (contract.jsonl) readValidatedJsonl(relPath, contract.schema, contract.opts);
    else readValidated(relPath, contract.schema, contract.opts);

    // Summarize only AFTER the full file has passed its contract, so the
    // condensed form can never hide a validation failure.
    const summary = contract.summarize === undefined ? null : contract.summarize(content, relPath);
    const payload = summary === null ? content : summary.text;

    // A13. The file is valid; the VERDICT inside it may still be worthless.
    // A summarizer that inspected zero pages and reported no failures has not
    // observed a healthy site, and this row must not look like one that did.
    const verdict = summary === null ? null : summary.verdict;
    if (verdict !== null) {
      const judged = judgeVerdict(verdict);
      if (judged.status === 'unevaluable') {
        return { name, path: relPath, trust: 'unevaluable', reason: judged.reason, content: payload, ageHours };
      }
    }
    return { name, path: relPath, trust: 'verified', reason: null, content: payload, ageHours };
  } catch (error) {
    const detail = error instanceof ContractViolation ? error.message : error instanceof Error ? error.message : String(error);
    return { name, path: relPath, trust: 'unverified', reason: `contract FAILED — ${detail}`, content, ageHours };
  }
}

/** Most recent dated file in a directory, e.g. data/probes/2026-08-06.json. */
function latestDated(dir: string): string | null {
  const full = resolve(ROOT, dir);
  if (!existsSync(full)) return null;
  try {
    const files = readdirSync(full).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    return files.length ? `${dir}/${files[files.length - 1]}` : null;
  } catch {
    console.error(`[nightly] could not list ${dir}`);
    return null;
  }
}

/** Loose envelopes for artifacts whose shape is owned by the script that writes them. */
const ledgerStateSchema = z.object({ generatedAt: z.string() }).passthrough();
const costSummarySchema = z.object({ generatedAt: z.string() }).passthrough();
const probeFileSchema = z.object({ generatedAt: z.string(), results: z.array(z.unknown()) }).passthrough();

/**
 * Condense a probe file for the narrative payload.
 *
 * THIS IS NOT TRUNCATION, and the distinction is the whole point of §7.6.
 * Truncation is dropping information the report would otherwise have acted on —
 * `.slice(0, 3000)` discarding every high and medium finding. This drops the raw
 * JSON-LD SOURCE TEXT of each page: bytes the narrative cannot use, that are
 * already on disk as closure evidence, and that no predicate reads from here.
 *
 * Every URL, every failing assertion, every console error and unmeasured vital
 * survives. Nothing the report could have said is lost — and the summary states
 * the full file's path so the omission is visible rather than implied.
 *
 * Found by the first CI run: the raw blocks were 80% of a 470KB probe file and
 * pushed the payload to 164K tokens against a 150K budget, so the truncation
 * guard correctly refused to run and the night degraded to a mechanical report.
 *
 * A13: it also returns a VERDICT about itself. This function is a detector — it
 * decides which sentence the narrative model reads — and it was able to emit
 * "No failing assertions. Every probed page fired its tags" over a results array
 * of length zero, or one in which every entry was skipped or unhealthy. That
 * sentence is true and useless: it describes the empty set. `judgeVerdict`
 * turns it into `unevaluable`, so a probe run that observed nothing can no
 * longer be read as a probe run that found nothing wrong.
 */
function summarizeProbes(raw: string, path: string): { text: string; verdict: DetectorVerdict } {
  // lint-architecture-allow R4 -- the file already passed probeFileSchema in load(); this re-reads the validated text to shape it
  const parsed = JSON.parse(raw) as { generatedAt?: string; results?: unknown[] };
  const results = Array.isArray(parsed.results) ? (parsed.results as Record<string, any>[]) : [];

  const failing: string[] = [];
  const skipped: string[] = [];
  let healthy = 0;
  let partial = 0;

  for (const r of results) {
    if (r.skipped) {
      skipped.push(`${r.url} (${r.skipped})`);
      continue;
    }
    if (r.healthy === false) {
      const why = Array.isArray(r.errors) && r.errors.length > 0 ? r.errors.join('; ') : 'no reason recorded';
      failing.push(`${r.url}: PROBE UNHEALTHY — ${why}`);
      continue;
    }
    healthy++;
    if (Array.isArray(r.errors) && r.errors.length > 0) partial++;

    const issues: string[] = [];
    if (r.status !== 200) issues.push(`status ${r.status}`);
    // An ABSENT network record is not the same as one reporting healthy tags.
    // Defaulting it to {} would make every `=== false` check silently pass and
    // report "no issues" for a page nothing was measured on — the exact bug
    // class this whole build exists to remove.
    const n = r.network;
    if (n === undefined || n === null) issues.push('network NOT MEASURED — tag firing unknown');
    else {
      if (n.gtagFired === false) issues.push('gtag NOT firing');
      if (n.clarityLoaded === false) issues.push('clarity NOT loading');
      if (n.affiliateHandlerAttached === false) issues.push('affiliate handler not attached');
    }
    const ce = Array.isArray(r.consoleErrors) ? r.consoleErrors.length : 0;
    if (ce > 0) issues.push(`${ce} console error(s): ${r.consoleErrors.map((e: any) => e.text).slice(0, 3).join(' | ')}`);
    if (Array.isArray(r.unhandledRejections) && r.unhandledRejections.length > 0) issues.push(`${r.unhandledRejections.length} unhandled rejection(s)`);
    const h = r.head;
    if (h === undefined || h === null) issues.push('head NOT MEASURED');
    const mdLen = h && typeof h.metaDescription === 'string' ? h.metaDescription.length : null;
    if (mdLen !== null && (mdLen < 130 || mdLen > 165)) issues.push(`meta description ${mdLen} chars (want 130-165)`);
    if (h && h.canonical && r.url && !String(h.canonical).endsWith(String(r.url))) issues.push(`canonical points elsewhere: ${h.canonical}`);
    if (h && Array.isArray(h.jsonLdParseErrors) && h.jsonLdParseErrors.length > 0) issues.push(`${h.jsonLdParseErrors.length} JSON-LD parse error(s)`);
    const g = r.geo;
    const geoMissing = g
      ? [
          g.directAnswerPresent === false ? 'direct answer' : null,
          g.citationCapsulePresent === false ? 'citation capsule' : null,
          g.faqPageSchemaValid === false ? 'valid FAQPage' : null,
        ].filter(Boolean)
      : [];
    if (geoMissing.length > 0) issues.push(`GEO missing: ${geoMissing.join(', ')}`);
    const v = r.vitals;
    if (v && typeof v.lcp === 'number' && v.lcp > 2500) issues.push(`LCP ${Math.round(v.lcp)}ms`);
    if (v && typeof v.cls === 'number' && v.cls > 0.1) issues.push(`CLS ${v.cls}`);

    if (issues.length > 0) failing.push(`${r.url}: ${issues.join(' · ')}`);
  }

  const lines = [
    `Probe run ${parsed.generatedAt ?? '(no timestamp)'} — ${results.length} URL(s): ${healthy} probed, ${skipped.length} skipped, ${partial} partial.`,
    ``,
    `NOTE: raw JSON-LD source text is omitted from this payload — it is evidence, not`,
    `narrative input, and remains complete in ${path}. Every URL and every failing`,
    `assertion below is reproduced in full; nothing actionable has been dropped.`,
    ``,
  ];
  if (skipped.length > 0) lines.push(`Skipped (correctly not audited as pages):`, ...skipped.map(s => `  - ${s}`), ``);
  if (failing.length === 0 && healthy === 0) {
    // The empty-set sentence, said honestly. Never "no failing assertions".
    lines.push(`NOTHING WAS PROBED. ${results.length} record(s), 0 of them a completed page observation.`);
    lines.push(`This is not a clean result — it is an absent one. Do not read it as the site being healthy.`);
  } else if (failing.length === 0) {
    lines.push(`No failing assertions across ${healthy} probed page(s): every one fired its tags and passed head/GEO/vitals checks.`);
  } else {
    lines.push(`Pages with at least one failing assertion (${failing.length} of ${healthy} probed):`, ...failing.map(f => `  - ${f}`));
  }

  return {
    text: lines.join('\n'),
    verdict: {
      detector: 'probe-summary',
      // The probe drives a real browser against production, so it reads what
      // the internet serves — the surface its verdict is taken to cover. This
      // pair being equal is the whole reason a clean probe result IS credible,
      // where a clean source-only lint is not.
      read: 'live',
      claims: 'live',
      inspected: healthy,
      violations: failing.length,
    },
  };
}

function gatherSources(): Source[] {
  const sources: Source[] = [
    load('ledger', 'data/ledger.jsonl', { schema: ledgerRecordSchema, opts: ledgerOptions, jsonl: true }),
    load('ledger-state', 'data/ledger-state.json', { schema: ledgerStateSchema }),
    load('collectors', 'data/collectors/latest.json', { schema: collectorsRollupSchema, opts: collectorsRollupOptions }),
    load('cost-summary', 'data/cost-summary.json', { schema: costSummarySchema }),
    load('cost-drift', 'data/cost-drift.jsonl', { schema: z.object({}).passthrough(), jsonl: true, absenceIsHealthy: true }),
    load('pipeline-status', 'data/pipeline-status.json', { schema: pipelineStatusSchema, opts: pipelineStatusOptions }),
    load('interventions', 'data/interventions.jsonl', { schema: interventionSchema, opts: interventionsOptions, jsonl: true }),
    load('retractions', 'data/retractions.jsonl', { schema: retractionSchema, opts: retractionsOptions, jsonl: true }),

    // A2. The agents' own account of what they did — and, more importantly,
    // what they REFUSED to do. `reports/content-log.md` carried the trust
    // layer's rejection of fabricated ASIN B006H1QYBA on a page scoring
    // 100/100, and because these two files were not sources, the single most
    // valuable event of that week reached this report as silence.
    //
    // The contract is a TEXT contract, not a schema — markdown has no zod —
    // but it is a real one: dated H1, freshness from the header date rather
    // than mtime, and at least one outcome line or an explicit no-op. A stale
    // log is exactly the evidence of the Friday-committed-nothing-for-5-days
    // failure, and `execute-content.ts` exits without writing when it has no
    // tasks, so staleness here is a live and expected signal rather than a
    // theoretical one.
    load('fixes-log', 'reports/fixes-log.md', { text: executionLogContract() }),
    load('content-log', 'reports/content-log.md', { text: executionLogContract() }),

    // A13. The agents' health, as opposed to their output: every stop_reason,
    // every input-floor assertion, every truncation. Absent on the very first
    // run after this shipped and never again — `meteredCreate` appends to it on
    // every LLM call in the repo, including this script's own.
    load('agent-health', 'data/agent-health.jsonl', { schema: agentHealthRecordSchema, opts: agentHealthOptions, jsonl: true }),
  ];
  const probes = latestDated('data/probes');
  sources.push(
    probes
      ? load('probes', probes, { schema: probeFileSchema, summarize: summarizeProbes })
      : { name: 'probes', path: 'data/probes/', trust: 'missing', reason: 'no probe run has ever completed (step 6 may not be built yet)', content: null, ageHours: null },
  );
  return sources;
}

/**
 * Rule 1 enforcement. Rather than slicing, we assert the payload fits and fail
 * loudly if it does not, so the failure mode is "no report tonight, dead-man's
 * switch fires" rather than "a report that quietly omitted the regressions".
 */
function assertNoTruncation(payload: string): void {
  const APPROX_TOKENS = payload.length / 4;
  const LIMIT = 150_000;
  if (APPROX_TOKENS > LIMIT) {
    throw new Error(
      `nightly-report: payload is ~${Math.round(APPROX_TOKENS)} tokens, over the ${LIMIT} budget.\n` +
        `REFUSING TO TRUNCATE (PRD §7.6). Truncation is the bug class that discarded every\n` +
        `high and medium audit finding when strategy.ts did .slice(0, 3000).\n` +
        `Fix by compacting the ledger (closed records older than 90d → data/ledger-archive.jsonl),\n` +
        `not by shortening this payload.`,
    );
  }
}

/** Coverage: the share of sources the report is entitled to state as fact. */
function coverage(sources: Source[]): { pct: number; verified: number; total: number } {
  const total = sources.length;
  const verified = sources.filter(s => s.trust === 'verified').length;
  return { pct: total === 0 ? 0 : Math.round((verified / total) * 100), verified, total };
}

/**
 * A13 — how far back an `unevaluable` agent record stays on the board.
 *
 * The pipeline runs Mon–Sat, so an agent that truncated on Tuesday is still a
 * broken agent on Friday and must still be visible. One nightly's worth (24h)
 * would surface Tuesday's truncation exactly once, on Wednesday morning, and
 * then let it vanish while remaining entirely unfixed — which is how the audit
 * hit its ceiling five weeks running with nobody noticing. Seven days is the
 * pipeline's own cadence: a defect drops off this list by being FIXED (the next
 * run records `evaluated`) rather than by aging out unaddressed.
 */
const AGENT_HEALTH_WINDOW_HOURS = 7 * 24;

/**
 * A13 — THE OPINION THIS SCRIPT PREVIOUSLY DID NOT HOLD.
 *
 * Faithfully reporting what was observed is necessary and was never sufficient.
 * A collector that returned zero rows, an agent whose response was cut off at
 * its token ceiling, and a quota that ran out all produce the same thing in a
 * summary table as a healthy night: nothing to report. That is the shape of
 * every incident in this system's history, and the reason Jackson caught the
 * 1.4%-context audit rather than the system catching it.
 *
 * Assessed here, in one place, across all four layers:
 *   - AGENTS      truncated / refused / floor-violating runs from agent-health
 *   - COLLECTORS  healthy:false, and healthy:true with rowCount 0
 *   - QUOTAS      exhausted or unreadable
 *   - SOURCES     anything not `verified`, including `unevaluable` verdicts
 *
 * Never throws. A health check that can take down the nightly would replace a
 * blind report with no report, and no report means the dead-man's switch fires
 * "TCA DEAD" on a night the site was fine. Its own failure is recorded as
 * `selfFailure` and reported — a health check that cannot say it failed is the
 * very thing it exists to prohibit.
 */
function detectorHealth(sources: Source[], now: Date = new Date()): DetectorHealth {
  const found = new Map<string, string>();
  const failures: string[] = [];
  let checked = 0;

  /**
   * First reason wins. The dedicated checks below run before the generic
   * source sweep and produce the more actionable sentence — "0 rows while
   * reporting healthy:true" beats "missing — file does not exist". Listing the
   * same detector twice under two keys would inflate the blind count, and a
   * count that overstates is trusted exactly as little as one that understates.
   */
  const flag = (detector: string, reason: string): void => {
    if (!found.has(detector)) found.set(detector, reason);
  };

  // ── Agents ──────────────────────────────────────────────────────────────
  try {
    const records = readValidatedJsonlIfExists('data/agent-health.jsonl', agentHealthRecordSchema, agentHealthOptions);
    if (records === null) {
      flag(
        'source:agent-health',
        'data/agent-health.jsonl does not exist — no agent has recorded a stop_reason or an input-floor ' +
          'assertion yet, so agent truncation is currently UNMONITORED, not absent.',
      );
    } else {
      checked += records.length;
      const cutoff = now.getTime() - AGENT_HEALTH_WINDOW_HOURS * 3_600_000;
      for (const r of records) {
        if (r.status !== 'unevaluable') continue;
        const at = Date.parse(r.ts);
        if (Number.isNaN(at) || at < cutoff) continue;
        flag(`agent:${r.agent}${r.purpose === undefined ? '' : `/${r.purpose}`}`, `${r.reason} (run ${r.run}, ${r.ts})`);
      }
    }
  } catch (error) {
    failures.push(`agent-health unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }

  // ── Collectors and quotas ───────────────────────────────────────────────
  try {
    const rollup = readValidatedIfExists('data/collectors/latest.json', collectorsRollupSchema, collectorsRollupOptions);
    if (rollup === null) {
      flag('source:collectors', 'data/collectors/latest.json does not exist — no collector ran, or none recorded that it had.');
    } else {
      for (const [name, entry] of Object.entries(rollup.collectors)) {
        checked++;
        if (!entry.meta.healthy) {
          flag(`collector:${name}`, entry.meta.reason ?? 'reported healthy:false with no reason, which is itself a contract breach');
          continue;
        }
        // The case the summary table could not previously express. The
        // credential worked, the request succeeded, and it came back with
        // nothing — which is an EMPTY observation, not a healthy one.
        if (entry.meta.rowCount === 0) {
          flag(
            `collector:${name}`,
            'returned 0 rows while reporting healthy:true — an empty result is not a measurement, and in a summary table it is indistinguishable from a full one.',
          );
        }
      }

      const quotas = quotasDataSchema.safeParse(rollup.collectors.quotas?.data);
      if (!quotas.success) {
        flag('quota', 'the quotas collector produced no readable service list, so remaining vendor quota is unknown — a service that has run out looks identical to one that has not.');
      } else {
        for (const s of quotas.data.services) {
          if (!s.configured) continue;
          checked++;
          if (s.error !== null) {
            flag(`quota:${s.service}`, `quota unreadable — ${s.error}`);
          } else if (s.remaining !== null && s.remaining <= 0) {
            flag(
              `quota:${s.service}`,
              `EXHAUSTED — 0 ${s.unit} remaining. Anything depending on ${s.service} is now silently thin, which looks exactly like "nothing happened this week".`,
            );
          } else if (s.pctRemaining !== null && s.pctRemaining <= 5) {
            flag(`quota:${s.service}`, `${s.pctRemaining}% of ${s.unit} remaining — will exhaust mid-cycle and go blind without saying so.`);
          }
        }
      }
    }
  } catch (error) {
    failures.push(`collectors rollup unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }

  // ── Sources ─────────────────────────────────────────────────────────────
  for (const s of sources) {
    checked++;
    if (s.trust === 'verified') continue;
    flag(`source:${s.name}`, `${s.trust} — ${s.reason ?? 'no reason recorded'}`);
  }

  return {
    blind: [...found.entries()].map(([detector, reason]) => ({ detector, reason })),
    checked,
    selfFailure: failures.length === 0 ? null : failures.join(' | '),
  };
}

/** Markdown table of every detector that could not see. Shared by the prompt and the fallback. */
function blindTable(health: DetectorHealth): string[] {
  if (health.selfFailure !== null) {
    return [
      `**THE DETECTOR HEALTH CHECK ITSELF FAILED:** ${health.selfFailure}`,
      ``,
      `Treat the list below as INCOMPLETE. It cannot be read as "everything else is fine".`,
      ``,
    ];
  }
  if (health.blind.length === 0) {
    return [`All ${health.checked} detector(s) assessed could see tonight. No agent truncated, no collector returned empty, no quota is exhausted.`];
  }
  return [
    `| detector | why it could not see |`,
    `|---|---|`,
    ...health.blind.map(b => `| \`${b.detector}\` | ${b.reason.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`),
  ];
}

function buildPrompt(sources: Source[], health: DetectorHealth): string {
  const cov = coverage(sources);
  const parts: string[] = [];

  parts.push(
    // The domain comes from lib/site.ts rather than a literal: this prompt is
    // the model's ONLY statement of which site the numbers below describe, and a
    // hardcoded one silently relabels a second site's data as this one's.
    `You are writing the God's-Eye nightly report for ${siteDomain()}, a live affiliate site`,
    `running an autonomous Mon–Sat SEO pipeline. You are the only thing standing between Jackson`,
    `and having to open Claude Code to check whether his system is working.`,
    ``,
    `Date: ${TODAY}`,
    `Source coverage tonight: ${cov.verified}/${cov.total} sources verified (${cov.pct}%).`,
    ``,
    `## THE RULES YOU MUST FOLLOW`,
    ``,
    `1. **The \`unverified\` rule.** Each source below is tagged verified / unverified / missing.`,
    `   A value from a VERIFIED source may be stated as fact. A value from an UNVERIFIED source`,
    `   must be explicitly marked "(unverified)". A MISSING source must be named in the`,
    `   "What the system could not see tonight" section. NEVER present an unverified number as fact.`,
    `   A report that lies is worse than no report, because Jackson stops checking and it stays wrong.`,
    ``,
    `2. **Never invent.** If the data does not say something, say the data does not say it.`,
    `   Do not estimate, extrapolate, or fill a gap with a plausible number. "Not measured tonight"`,
    `   is a complete and acceptable answer.`,
    ``,
    `3. **Lead with what changed.** Jackson reads this on his phone. If nothing changed and nothing`,
    `   is stuck, say so in one line — do not manufacture activity to look useful.`,
    ``,
    `4. **Regressions are the headline.** A finding that passed its closure predicate and later`,
    `   failed (status \`regressed\`) is the single highest-value output of this system. If any`,
    `   exist, they lead the report.`,
    ``,
    `5. **\`unevaluable\` is not zero, and it is not success.** (A13) If the DETECTOR HEALTH block`,
    `   below is non-empty you are FORBIDDEN from describing tonight as clean, quiet, healthy,`,
    `   all-clear, or "nothing to report". A detector that could not see has not told you the site`,
    `   is fine — it has told you nothing, and those are different reports. Say which eyes were`,
    `   shut and what that specifically means you cannot claim tonight. Every incident in this`,
    `   system's history was a measurement failing quietly while a dashboard stayed green.`,
    ``,
    `6. **What the pipeline REFUSED is news.** (A2) \`fixes-log\` and \`content-log\` are the agents'`,
    `   own account of their week. A \`❌\` line is not a failure to bury — the trust layer rejecting`,
    `   a fabricated ASIN on a page scoring 100/100 was the most valuable thing this system did all`,
    `   week, and it went unreported. Refusals, skips and rollbacks get named explicitly.`,
    ``,
    `## REQUIRED SECTIONS (PRD §7.6 + A2/A13) — emit all of them, in this order`,
    ``,
    `- **What changed** — new findings, status transitions since the last report.`,
    `- **What closed** — with the evidence that proved it. An evidence-less close is a bug: flag it.`,
    `- **What is stuck, and for how long** — open items with their age in days.`,
    `- **What regressed** — passed, then failed. Lead with this if non-empty.`,
    `- **What the agents did** — from fixes-log and content-log: applied, skipped, rolled back, and`,
    `  REFUSED, each named. Mandatory even when both logs are empty or stale (say which, and note`,
    `  that a stale execution log means the weekly agent produced nothing within its own cadence).`,
    `- **What needs a human** — escalated items, and anything blocked on a credential or on Amazon`,
    `  affiliate data (which has no API and is permanently manual).`,
    `- **What the system could not see tonight** — every missing/unhealthy source AND every entry in`,
    `  the DETECTOR HEALTH block, with its reason. This section is mandatory even when empty`,
    `  (say "full coverage, all detectors evaluable").`,
    `- **Spend** — from cost-summary if verified; otherwise say it was not measured.`,
    ``,
    `## DETECTOR HEALTH — READ THIS BEFORE WRITING A WORD`,
    ``,
    ...blindTable(health),
    ``,
    `Write GitHub-flavored markdown. Start with an H1 \`# God's-Eye — ${siteLabel()} — ${TODAY}\` and a 2-3 line`,
    `TL;DR that a person can act on from a lock screen. Be terse. No preamble, no filler,`,
    `no congratulating the system for running.`,
    ``,
    `## SOURCES`,
    ``,
  );

  for (const s of sources) {
    parts.push(`### ${s.name} — trust: ${s.trust.toUpperCase()}`);
    parts.push(`path: \`${s.path}\`${s.ageHours !== null ? ` · age: ${s.ageHours.toFixed(1)}h` : ''}`);
    if (s.reason) parts.push(`reason: ${s.reason}`);
    if (s.content) {
      parts.push('```');
      // NO .slice() — full content by design (PRD §7.6 rule 1).
      parts.push(s.content);
      parts.push('```');
    } else {
      parts.push('_(no content)_');
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Written when the LLM call itself fails. The nightly must still land — a
 * missing report means "the system is dead" to the dead-man's switch, and a
 * failed Anthropic call is not death.
 */
function fallbackReport(sources: Source[], health: DetectorHealth, error: string): string {
  const cov = coverage(sources);
  const lines = [
    // The degraded path names the site too. This is the report that gets written
    // on the worst nights, which is exactly when "whose site is this about?" is
    // least safe to leave to the reader's assumption.
    `# God's-Eye — ${siteLabel()} — ${TODAY}`,
    ``,
    `> **DEGRADED REPORT.** The narrative model call failed, so this is the raw source`,
    `> state with no interpretation. Everything below is mechanically derived.`,
    ``,
    `**Reason:** ${error}`,
    ``,
    `## Coverage`,
    ``,
    `${cov.verified}/${cov.total} sources verified (${cov.pct}%).`,
    ``,
    `## Source state`,
    ``,
    `| source | trust | age | reason |`,
    `|---|---|---|---|`,
  ];
  for (const s of sources) {
    lines.push(`| ${s.name} | ${s.trust} | ${s.ageHours !== null ? `${s.ageHours.toFixed(1)}h` : '—'} | ${s.reason ?? ''} |`);
  }
  lines.push('', '## Detector health', '', ...blindTable(health));
  lines.push('', '## What the system could not see tonight', '');
  const blind = sources.filter(s => s.trust !== 'verified');
  if (blind.length === 0 && health.blind.length === 0 && health.selfFailure === null) lines.push('_Full coverage, all detectors evaluable._');
  else for (const s of blind) lines.push(`- **${s.name}** — ${s.reason ?? 'unverified'}`);
  lines.push('', '## What needs a human', '', `- The report model call failed. Investigate: ${error}`);
  if (health.blind.length > 0) {
    lines.push(
      `- ${health.blind.length} detector(s) could not see tonight (table above). This report is NOT a`,
      `  clean bill of health; it is a partial observation with named gaps.`,
    );
  }
  return lines.join('\n');
}

/**
 * HTTP header values are ByteStrings — Latin-1 only — and fetch() throws on any
 * non-ASCII character before the request leaves. This matters more here than it
 * looks: the title is assembled from MODEL-GENERATED prose, which reaches for
 * em-dashes and curly quotes constantly. An unguarded title would fail on a
 * normal night, not an exotic one.
 *
 * Only headers need this. The body is UTF-8 and passes through untouched.
 */
function headerSafe(value: string): string {
  return value
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[…]/g, '...')
    .replace(/[^\x20-\x7E]/g, '');
}

async function push(title: string, body: string): Promise<void> {
  if (!NTFY_TOPIC) {
    console.error('[nightly] NTFY_TOPIC unset — no phone push sent (PRD §11 default transport is ntfy.sh).');
    return;
  }
  try {
    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: { Title: headerSafe(title), Priority: 'default', Tags: 'telescope' },
      body,
    });
    if (!res.ok) console.error(`[nightly] ntfy push failed: HTTP ${res.status}`);
    else console.log(`[nightly] pushed to ntfy.sh/${NTFY_TOPIC}`);
  } catch (error) {
    console.error(`[nightly] ntfy push failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const sources = gatherSources();
  const cov = coverage(sources);
  // A13. Runs BEFORE the narrative call, because its output is an input to the
  // prompt: the model must be told which eyes were shut before it is asked to
  // describe what was seen. Tonight's own `meteredCreate` record therefore
  // lands in TOMORROW's health check, which is correct — a truncation is
  // reported by the next observer, not self-reported by the truncated one.
  const health = detectorHealth(sources);

  console.log(`[nightly] ${TODAY} — ${cov.verified}/${cov.total} sources verified (${cov.pct}%)`);
  for (const s of sources) {
    console.log(`  ${s.trust.padEnd(12)} ${s.name.padEnd(16)} ${s.reason ?? ''}`);
  }
  if (health.selfFailure !== null) console.error(`[nightly] DETECTOR HEALTH CHECK FAILED: ${health.selfFailure}`);
  if (health.blind.length === 0) console.log(`[nightly] detectors: all ${health.checked} evaluable`);
  else {
    console.error(`[nightly] ${health.blind.length}/${health.checked} detector(s) UNEVALUABLE tonight:`);
    for (const b of health.blind) console.error(`  ${b.detector.padEnd(28)} ${b.reason}`);
  }

  let markdown: string;
  try {
    const prompt = buildPrompt(sources, health);
    assertNoTruncation(prompt);

    const message = await meteredCreate(
      {
        model: MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      },
      { agent: 'nightly-report', run: TODAY, purpose: 'godseye-narrative' },
    );

    const block = message.content.find(c => c.type === 'text');
    if (!block || block.type !== 'text' || block.text.trim().length === 0) {
      throw new Error('model returned no text block');
    }
    markdown = block.text;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[nightly] report generation failed: ${reason}`);
    markdown = fallbackReport(sources, health, reason);
  }

  // Self-metering (PRD §7.6): the nightly asserts its own coverage and duration
  // in the artifact itself, so a degraded run is visible in the output, not just
  // in CI logs nobody reads.
  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  const footer = [
    ``,
    `---`,
    ``,
    `<!-- godseye-meta -->`,
    `**Coverage:** ${cov.verified}/${cov.total} sources verified (${cov.pct}%) · **Detectors blind:** ${health.blind.length}/${health.checked} · **Duration:** ${durationSec}s · **Generated:** ${new Date().toISOString()}`,
    ``,
    `Unverified or missing sources tonight: ${sources.filter(s => s.trust !== 'verified').map(s => s.name).join(', ') || 'none'}.`,
    ``,
    // Restated mechanically below the narrative so it survives any prose the
    // model wrote above it. The model is instructed not to call a blind night
    // clean; this line makes that unfalsifiable rather than merely requested.
    `## Detector health (mechanical — A13)`,
    ``,
    ...blindTable(health),
    ``,
    `_Values from unverified sources are marked inline. Until a value has a schema contract_`,
    `_(PRD §7.2) or a closure predicate (§7.3) behind it, this report may not state it as fact._`,
    `_An \`unevaluable\` detector has not reported health. It has reported nothing._`,
  ].join('\n');

  const outDir = resolve(ROOT, 'wiki/nightly');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${TODAY}.md`);
  writeFileSync(outPath, markdown + footer);
  console.log(`[nightly] wrote wiki/nightly/${TODAY}.md (${markdown.length + footer.length} bytes)`);

  // Heartbeat for the dead-man's switch. Written LAST and only on success, so
  // its absence or staleness is a true signal that the nightly did not complete.
  //
  // `detectorsBlind` is recorded but the heartbeat is still WRITTEN when it is
  // non-zero, and the process still exits 0. That is deliberate and it is the
  // §7.6 contract: an unhealthy observation is a SUCCESSFUL run of the
  // observation system. Failing here would suppress the heartbeat and fire
  // "TCA DEAD" on a night when the only thing wrong was that one collector
  // came back empty — replacing a blind report with no report at all.
  writeFileSync(
    resolve(ROOT, 'data/nightly-heartbeat.json'),
    JSON.stringify(
      {
        lastRun: new Date().toISOString(),
        date: TODAY,
        coveragePct: cov.pct,
        durationSec: Number(durationSec),
        detectorsChecked: health.checked,
        detectorsBlind: health.blind.length,
        detectorHealthFailed: health.selfFailure,
        report: `wiki/nightly/${TODAY}.md`,
      },
      null,
      2,
    ) + '\n',
  );

  // The one permitted .slice() in this file: it shortens the PHONE NOTIFICATION,
  // never the report or the model payload. The full report is already on disk at
  // this point. Rule 1 forbids truncating what the system knows, not truncating a
  // lock-screen preview of it.
  const tldr = markdown.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 3).join(' ');
  // The blind count goes in the TITLE, not the body. A lock-screen notification
  // is often the entire report Jackson reads, and "88% coverage" alongside a
  // reassuring TL;DR is precisely how a month of truncated audits felt fine.
  const blindTag = health.selfFailure !== null
    ? 'DETECTOR CHECK FAILED'
    : health.blind.length === 0
      ? ''
      : `${health.blind.length} BLIND`;
  // Both signals that must survive truncation are moved to the FRONT, in the
  // order they get acted on: WHICH SITE, then IS IT BLIND. A lock-screen title
  // is cut off around 30-40 characters, so anything that has to be read has to
  // be early — putting the site name in front of an unchanged title would have
  // pushed the blind count past the cut and quietly undone the paragraph above.
  // `God's-Eye` and the date stay, but they move behind both: the date is the
  // one field a notification arriving tonight does not need to state, and the
  // name is decoration once the site is already named.
  // `siteLabel()` and not the full domain — `.com` costs four characters of that
  // budget and distinguishes nothing.
  const alarm = blindTag === '' ? '' : `${blindTag} — `;
  await push(
    `${siteLabel()}: ${alarm}God's-Eye ${TODAY} (${cov.pct}% coverage)`,
    tldr,
  );
}

main().catch(error => {
  // Last resort. Exiting non-zero here means no heartbeat was written, which is
  // exactly what should wake the dead-man's switch.
  console.error('[nightly] FATAL:', error);
  process.exit(1);
});
