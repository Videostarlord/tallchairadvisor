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
import { isRetiredSource, retirementReason } from './lib/retired-agents.js';

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

export interface Source {
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

export interface DetectorHealth {
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
  // A retired agent's log cannot be fresh, and reporting it as a contract
  // failure every night is an alarm that fires because nothing happened. Checked
  // BEFORE existence, so a log that was never written at all is handled too.
  // See lib/retired-agents.ts — this pairs with a commented-out cron and the two
  // must be changed together.
  if (isRetiredSource(name)) {
    return {
      name,
      path: relPath,
      trust: 'verified',
      reason: `writer retired — ${retirementReason(name)}. Age is expected and is not a finding.`,
      content: null,
      ageHours: null,
    };
  }

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

/**
 * The one-line verdict, computed mechanically and NOT asked of the model.
 *
 * The phone title is the only part of this report most days get read at all, so
 * it must not depend on the narrative call succeeding, on the model choosing the
 * right words, or on it resisting the pull toward a reassuring summary. The
 * model is told which verdict to write; this decides it.
 *
 * Order is the priority order, and blindness outranks breakage on purpose: a
 * check that did not run is the one state where "nothing needs you" would be a
 * claim the system has not earned. Every incident in this system's history was a
 * measurement failing quietly while a dashboard stayed green.
 */
export type VerdictKind = 'blind' | 'needs-you' | 'good';

export interface Verdict {
  kind: VerdictKind;
  /** What goes on the lock screen. Kept under ~40 chars before the site name. */
  title: string;
  /** The line the model is instructed to write directly under the H1. */
  line: string;
}

export function decideVerdict(blindCount: number, selfFailure: string | null, needsYou: number): Verdict {
  if (selfFailure !== null) {
    return {
      kind: 'blind',
      title: "CAN'T CHECK — the checker itself failed",
      line: '**🔴 I could not check the site properly.** The health check itself failed.',
    };
  }
  if (blindCount > 0) {
    const also = needsYou > 0 ? ` (+${needsYou} need you)` : '';
    return {
      kind: 'blind',
      title: `CAN'T CHECK — ${blindCount} check(s) didn't run${also}`,
      line:
        `**🔴 I could not check the site properly.** ${blindCount} check(s) did not run` +
        (needsYou > 0 ? `, and ${needsYou} thing(s) also need you.` : '.'),
    };
  }
  if (needsYou > 0) {
    return {
      kind: 'needs-you',
      title: `${needsYou} thing(s) need you`,
      line: `**⚠️ ${needsYou} thing(s) need you.**`,
    };
  }
  return {
    kind: 'good',
    title: 'ALL GOOD',
    line: '**✅ The site is good to go.**',
  };
}

/**
 * How many problems are waiting on a human, read from the ledger's own summary.
 *
 * Returns null when the number cannot be read, and null is NOT zero: the caller
 * turns it into "I couldn't check" rather than into a reassuring "0 things need
 * you", which is the exact substitution this whole file exists to prevent.
 */
export function countNeedsYou(ledgerStateContent: string | null): number | null {
  if (ledgerStateContent === null) return null;
  try {
    // lint-architecture-allow R4 -- the value is range-checked on the next line and any failure returns null, which the caller renders as "could not read" and never as zero
    const parsed: unknown = JSON.parse(ledgerStateContent);
    const counts = (parsed as { counts?: { escalated?: unknown } }).counts;
    const escalated = counts?.escalated;
    return typeof escalated === 'number' && Number.isFinite(escalated) && escalated >= 0 ? escalated : null;
  } catch {
    return null;
  }
}

function buildPrompt(sources: Source[], health: DetectorHealth, verdict: Verdict): string {
  const cov = coverage(sources);
  const parts: string[] = [];

  parts.push(
    // The domain comes from lib/site.ts rather than a literal: this prompt is
    // the model's ONLY statement of which site the numbers below describe, and a
    // hardcoded one silently relabels a second site's data as this one's.
    `You are writing the daily status report for ${siteDomain()}, a live affiliate site`,
    `running an automated SEO pipeline. Jackson reads this on his phone at 5pm. He is a`,
    `mechanical engineer, not an SEO specialist, and he did not build most of the vocabulary`,
    `this system uses internally.`,
    ``,
    `YOUR ONE JOB: he should finish the first two lines either thinking "the site is fine,`,
    `nothing for me to do" or knowing EXACTLY what is broken, why it costs him something, and`,
    `what to paste into Claude Code to fix it. If he has to interpret anything, you failed.`,
    ``,
    `Date: ${TODAY}`,
    `Source coverage tonight: ${cov.verified}/${cov.total} sources verified (${cov.pct}%).`,
    ``,
    `## WRITE LIKE A PERSON — THIS IS RULE ZERO`,
    ``,
    `**BANNED WORDS.** Never use these in the report body. Use the plain-English column.`,
    ``,
    `| Never write | Write this instead |`,
    `|---|---|`,
    `| escalated | "stuck — needs you" |`,
    `| regressed | "was fixed, then broke again" |`,
    `| closure predicate | "the test that proves it's fixed" |`,
    `| unevaluable / blind detector | "I couldn't check this" |`,
    `| finding / ledger record | "problem" or "issue" |`,
    `| intervention | "a change we made to try to improve a page" |`,
    `| coverage N/M | "I could see N of the M things I check" |`,
    `| predicate failed | "still not fixed" |`,
    `| status transition | "changed since yesterday" |`,
    `| stale / freshness SLA | "the data is N days old" |`,
    `| impressions | "times the site showed up in Google" |`,
    `| CTR | "how often people clicked" (give the % too) |`,
    `| position | "average Google ranking" |`,
    `| AIO suppression | "Google answers this question itself, so nobody clicks" |`,
    ``,
    `**NO HEX IDs IN THE BODY.** \`8aeed43a09a6\` means nothing to a human. Name the PAGE.`,
    `If an id is genuinely needed, put it in the Appendix at the very bottom, nowhere else.`,
    ``,
    `**NO INTERNAL FILENAMES IN THE BODY.** He does not know what \`ledger-state.json\`,`,
    `\`data/probes/\` or \`collector:gsc\` are. Say "the Google Search Console data" or`,
    `"the page-checking robot". Filenames go in the Appendix if anywhere.`,
    ``,
    `**EVERY PROBLEM NEEDS THREE THINGS, ALWAYS, IN THIS ORDER:**`,
    `  1. **What's wrong** — one sentence, plain English, naming the page.`,
    `  2. **Why it matters** — in traffic, money, or risk. If it genuinely does not matter`,
    `     much, SAY SO ("cosmetic, no revenue impact"). Do not inflate it to look useful.`,
    `  3. **Fix it with:** — a single line he can copy and paste into Claude Code, written`,
    `     as an instruction to Claude, e.g. "Fix the mobile layout on /review/gesture/ —`,
    `     it renders 3% differently from the saved baseline." Never "investigate" or`,
    `     "consider". If the fix needs HIS hands and not Claude's (a login, a password, a`,
    `     decision only he can make), write **YOU have to do this:** and say exactly what.`,
    ``,
    `Short sentences. No jargon. No hedging. No congratulating the system for running.`,
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
    `3. **Lead with what changed.** If nothing changed and nothing is stuck, say so in one line —`,
    `   do not manufacture activity to look useful. A one-screen report on a quiet day is the`,
    `   system working, not the system being lazy.`,
    ``,
    `4. **Regressions are the headline.** A finding that passed its closure predicate and later`,
    `   failed (status \`regressed\`) is the single highest-value output of this system. If any`,
    `   exist, they lead the report.`,
    ``,
    `5. **"I couldn't check" is not "it's fine".** (A13) If the DETECTOR HEALTH block below is`,
    `   non-empty you are FORBIDDEN from using the ✅ verdict, and forbidden from the words clean,`,
    `   quiet, healthy, all-clear or "nothing to report". A check that did not run has told you`,
    `   NOTHING about the site — it has not told you the site is fine. Say which checks did not`,
    `   run and what he therefore cannot conclude. Every incident in this system's history was a`,
    `   measurement failing quietly while a dashboard stayed green.`,
    ``,
    `6. **What the pipeline REFUSED is news.** (A2) A ❌ line in the execution logs is not a failure`,
    `   to bury. The trust layer rejecting a made-up product code on a page that otherwise scored`,
    `   100/100 was the most valuable thing this system did all week, and it went unreported.`,
    `   Refusals, skips and rollbacks get named — in plain words, not log syntax.`,
    ``,
    `## THE SHAPE OF THE REPORT — emit these sections, in this order, nothing else`,
    ``,
    `**The numbers below are for YOUR ordering only. Never print a number in a heading —`,
    `write "## What needs you", never "## 2. What needs you".**`,
    ``,
    `### 1. The verdict (first line after the H1)`,
    ``,
    `THE VERDICT HAS ALREADY BEEN DECIDED FOR YOU. Write this line, verbatim:`,
    ``,
    `    ${verdict.line}`,
    ``,
    `Do not soften it, upgrade it, or substitute your own judgement. It is computed from the`,
    `same data you are reading and it is what the phone notification already said — a report`,
    `that disagrees with its own notification is worse than either one alone.`,
    ``,
    `For reference, the three possible verdicts and what each means:`,
    ``,
    `  **✅ The site is good to go.** — use ONLY when nothing broke, nothing is stuck,`,
    `  and every check ran. All three, or it is not this line.`,
    ``,
    `  **⚠️ N things need you.** — something is broken or stuck. N is the number of items`,
    `  in "What needs you" below. This is the normal case; it is not an emergency.`,
    ``,
    `  **🔴 I could not check the site properly.** — a check did not run. Use this even if`,
    `  everything you COULD see looked fine. See rule 5: not looking is not the same as`,
    `  looking and finding nothing, and this line is where that distinction lives.`,
    ``,
    `If both ⚠️ and 🔴 apply, use 🔴 and say how many things also need him.`,
    ``,
    `Then one short paragraph — two or three sentences, plain English — a person could act`,
    `on from a lock screen without opening anything.`,
    ``,
    `### 2. What needs you`,
    ``,
    `The most important section. One numbered item per problem, most costly first.`,
    `Each one gets the three things from Rule Zero: what's wrong, why it matters, and a`,
    `copy-pasteable **Fix it with:** line (or **YOU have to do this:** when Claude cannot).`,
    `If nothing needs him, write one line: "Nothing. The site is running itself today."`,
    `Do NOT pad this section to look useful — a short list is the goal, not a failure.`,
    ``,
    `### 3. What I could not check`,
    ``,
    `Mandatory, even when empty (then: "I checked everything I'm supposed to check.").`,
    `Every source that was missing or unhealthy, and every entry in the DETECTOR HEALTH`,
    `block. For each: what it watches, in plain words, and what he therefore cannot`,
    `conclude tonight. Give each one a **Fix it with:** line too.`,
    ``,
    `### 4. What got fixed`,
    ``,
    `What closed since the last report and the evidence that proved it — in plain words`,
    `("the page now ranks 7.2, under the 8.0 target"). If something closed with no`,
    `evidence, that is a BUG in this system: say so plainly, it is worth more than the fix.`,
    `If nothing closed, one line saying so.`,
    ``,
    `### 5. What the robots did`,
    ``,
    `From the fixes-log and content-log — the automated agents' own account of their week.`,
    `Mandatory even when both are empty or old (say which, and that an old log means the`,
    `weekly agent produced nothing on its own schedule).`,
    ``,
    `Name what they REFUSED to do and why. (A2) A refusal is the most valuable thing this`,
    `system produces and it used to go unreported — the trust layer rejecting a made-up`,
    `product code on a page that otherwise scored 100/100 was the best work it did all week.`,
    `Say it in those terms: "the robot caught itself about to publish a fake product link".`,
    ``,
    `### 6. Money`,
    ``,
    `Affiliate earnings and what the pipeline cost to run, if both were measured. If either`,
    `was not, say which and do not estimate. Plain numbers, no per-token arithmetic.`,
    ``,
    `### 7. Appendix — the technical detail`,
    ``,
    `LAST section. This is where every id, filename, predicate and raw number goes, for`,
    `when he does open Claude Code. Nothing above this line may contain them. Keep it short`,
    `and unglamorous; it is a lookup table, not a narrative.`,
    ``,
    `## DETECTOR HEALTH — READ THIS BEFORE WRITING A WORD`,
    ``,
    ...blindTable(health),
    ``,
    `Write GitHub-flavored markdown. Start with an H1 \`# ${siteLabel()} — ${TODAY}\`, then the`,
    `verdict line, then the short paragraph. No preamble before the H1. No filler. No`,
    `congratulating the system for running.`,
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
/** One waiting problem, as ledger-evaluate.ts already wrote it into ledger-state.json. */
interface NeedsYouItem {
  page?: string;
  summary?: string;
  predicate?: string;
  reason?: string;
  ageDays?: number;
  attempts?: number;
}

/**
 * The escalated/regressed lists straight out of data/ledger-state.json.
 *
 * These are the ACTUAL problems waiting on Jackson, and until now only the paid
 * narrative ever printed them. Six nights in seven the report said "10 things
 * need you" in its headline and then never said which ten — a count with no list
 * is not a report, it is an anxiety generator. This is a plain read of a file the
 * nightly already loads, so listing them costs nothing.
 *
 * Returns null when the file is unreadable, and null is NOT an empty list: the
 * caller must say "I could not read this", never render silence as "all clear".
 */
export function parseNeedsYou(content: string | null): { escalated: NeedsYouItem[]; regressed: NeedsYouItem[] } | null {
  if (content === null) return null;
  try {
    // lint-architecture-allow R4 -- ledger-state.json is produced by ledger-evaluate.ts in this same pipeline and has no readValidated schema; every field is optional-checked at render time and any throw returns null, which the caller renders as "could not read" and never as zero
    const parsed: unknown = JSON.parse(content);
    const arr = (k: string): NeedsYouItem[] => {
      const v = (parsed as Record<string, unknown>)[k];
      return Array.isArray(v) ? (v as NeedsYouItem[]) : [];
    };
    return { escalated: arr('escalated'), regressed: arr('regressed') };
  } catch {
    return null;
  }
}

/** One problem, rendered for a human. Never a field name, never an id. */
function renderNeedsYouItem(item: NeedsYouItem, index: number): string[] {
  const what = item.page ?? item.summary ?? 'an unnamed item';
  const stuck: string[] = [];
  if (typeof item.ageDays === 'number') stuck.push(`stuck ${item.ageDays} days`);
  if (typeof item.attempts === 'number' && item.attempts > 0) stuck.push(`${item.attempts} automatic tries`);
  const lines = [`${index}. **${what}**${stuck.length > 0 ? ` — ${stuck.join(', ')}.` : ''}`];
  if (item.reason) lines.push(`   ${item.reason}.`);
  if (item.predicate) lines.push(`   _Goal it is failing: ${item.predicate}_`);
  return lines;
}

/**
 * The report on a `--no-narrative` night — six nights in seven.
 *
 * This exists because those nights used to be rendered by fallbackReport(), the
 * renderer for when the model call BREAKS. The result was a nightly notification
 * headed "**The part that writes this report in plain English is what broke**",
 * listing "**The report writer failed.**" as the #1 thing needing attention, and
 * closing with a "Raw error" block quoting the deliberate skip message. Nothing
 * had failed. Jackson had asked for a weekly narrative on 2026-08-28 and got a
 * red alarm every night for making that change.
 *
 * An intentional saving must never be reported in the vocabulary of a failure.
 * That is the same class of defect as a blind check reading green: the words and
 * the world disagree, and the words are what gets believed.
 */
export function skippedNarrativeReport(sources: Source[], health: DetectorHealth, verdict: Verdict): string {
  const ledgerState = sources.find(s => s.name === 'ledger-state') ?? null;
  const needs = parseNeedsYou(ledgerState === null ? null : ledgerState.content);

  const lines = [
    `# ${siteLabel()} — ${TODAY}`,
    ``,
    verdict.line,
    ``,
    `_Short version. The full write-up is written once a week, on Sunday. Everything below_`,
    `_comes from the same checks as always — nothing was skipped except the essay._`,
    ``,
    `## What needs you`,
    ``,
  ];

  if (needs === null) {
    lines.push(
      `I could not read the list of open problems tonight, so I cannot show it. That is a`,
      `gap, not a clean result — do not read this as "nothing needs you".`,
      ``,
    );
  } else if (needs.regressed.length === 0 && needs.escalated.length === 0) {
    lines.push(`Nothing is waiting on you. Every open item closed on its own.`, ``);
  } else {
    let n = 1;
    // Regressions first, always: something that passed and then broke again is
    // newer information than something that has been stuck for 41 days.
    if (needs.regressed.length > 0) {
      lines.push(`**These were fixed and have broken again:**`, ``);
      for (const item of needs.regressed) lines.push(...renderNeedsYouItem(item, n++), ``);
    }
    if (needs.escalated.length > 0) {
      if (needs.regressed.length > 0) lines.push(`**These have been waiting a while:**`, ``);
      for (const item of needs.escalated) lines.push(...renderNeedsYouItem(item, n++), ``);
    }
  }

  // Blind checks are the one thing that must stay above the fold on a short
  // report. Burying them in the appendix is how a blind night reads as a quiet one.
  const unverified = sources.filter(s => s.trust !== 'verified');
  if (unverified.length > 0 || health.blind.length > 0 || health.selfFailure !== null) {
    lines.push(`## What I could not check`, ``);
    for (const s of unverified) lines.push(`- **${s.name}** — ${s.reason ?? 'could not be read or verified'}`);
    for (const b of health.blind) lines.push(`- **${b.detector}** — ${b.reason}`);
    if (health.selfFailure !== null) lines.push(`- **the health check itself** — ${health.selfFailure}`);
    lines.push(``, `Those are gaps, not clean results. This report does not say the site is fine.`, ``);
  }

  // Everything past here is machine detail, and it is COLLAPSED. On a short
  // report the tables were most of the page, which is what made a two-line night
  // look like a wall of text worth ignoring.
  lines.push(
    `<details><summary>Technical detail — data sources and detector health</summary>`,
    ``,
    ...sourceTable(sources),
    ``,
    `### Detector health`,
    ``,
    ...blindTable(health),
    ``,
    `</details>`,
  );
  return lines.join('\n');
}

/** The source-trust table, shared by the short report and the failure report. */
function sourceTable(sources: Source[]): string[] {
  const cov = coverage(sources);
  const rows = [
    `Data sources readable: ${cov.verified}/${cov.total} (${cov.pct}%).`,
    ``,
    `| source | trust | age | reason |`,
    `|---|---|---|---|`,
  ];
  for (const s of sources) {
    rows.push(`| ${s.name} | ${s.trust} | ${s.ageHours !== null ? `${s.ageHours.toFixed(1)}h` : '—'} | ${s.reason ?? ''} |`);
  }
  return rows;
}

function fallbackReport(
  sources: Source[],
  health: DetectorHealth,
  error: string,
  verdict: Verdict,
): string {
  const lines = [
    // The degraded path names the site too. This is the report that gets written
    // on the worst nights, which is exactly when "whose site is this about?" is
    // least safe to leave to the reader's assumption.
    //
    // And it gets the SAME plain language as the good path. This is the report a
    // human reads on the worst night of the month; handing them raw source state
    // and internal field names on exactly that night is when jargon costs most.
    `# ${siteLabel()} — ${TODAY}`,
    ``,
    verdict.line,
    ``,
    `**The part that writes this report in plain English is what broke** — everything below`,
    `is raw machine output. The site itself may well be fine; nothing here says it isn't.`,
    ``,
    `## What needs you`,
    ``,
    `1. **The report writer failed.** It could not turn today's data into a readable summary.`,
    `   *Why it matters:* you are reading raw output instead of a summary, so today's check is`,
    `   harder to trust than usual. The site is probably fine — this is the reporter, not the site.`,
    `   **Fix it with:** \`The God's-Eye nightly report failed to generate on ${TODAY}. The error was:`,
    `   ${error}. Find out why and fix it.\``,
    ``,
  ];
  const unverified = sources.filter(s => s.trust !== 'verified');
  if (unverified.length > 0 || health.blind.length > 0 || health.selfFailure !== null) {
    lines.push(`## What I could not check`, ``);
    for (const s of unverified) {
      lines.push(`- **${s.name}** — ${s.reason ?? 'could not be read or verified'}`);
    }
    for (const b of health.blind) {
      lines.push(`- **${b.detector}** — ${b.reason}`);
    }
    if (health.selfFailure !== null) lines.push(`- **the health check itself** — ${health.selfFailure}`);
    lines.push(
      ``,
      `Those are gaps, not clean results. This report does not say the site is fine.`,
      ``,
    );
  } else {
    lines.push(`## What I could not check`, ``, `Everything I check was readable today. Only the write-up failed.`, ``);
  }

  // Everything below is the appendix, and it is LABELLED as one so nobody has to
  // work out which half of this file was meant for them.
  lines.push(`## Appendix — the technical detail`, ``, ...sourceTable(sources));
  lines.push('', '### Detector health', '', ...blindTable(health));
  lines.push('', '### Raw error', '', '```', error, '```');
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

  // Computed BEFORE the narrative call and passed into it, so the report and the
  // phone notification cannot disagree. `null` from countNeedsYou means the count
  // could not be read, which is treated as a blind check rather than as zero.
  const ledgerState = sources.find(s => s.name === 'ledger-state') ?? null;
  const needsYou = countNeedsYou(ledgerState === null ? null : ledgerState.content);
  const blindCount = needsYou === null ? health.blind.length + 1 : health.blind.length;
  if (needsYou === null) {
    console.error('[nightly] could not read the escalated count — treating as a blind check, never as zero');
  }
  const verdict = decideVerdict(blindCount, health.selfFailure, needsYou ?? 0);
  console.log(`[nightly] verdict: ${verdict.title}`);

  // ── Narrative cadence (2026-08-29) ──────────────────────────────────────────
  //
  // The LLM narrative was 83% of the entire pipeline's spend — $13.34 of $16.16
  // in August — on a report whose own text read "Nothing closed overnight and
  // nothing broke fresh today; the 11 open items are all carry-overs". It was
  // paying ~$0.55 a night to re-state the same list. Its input was compounding
  // too: 71k tokens/run on 2026-08-07, 168k on 2026-08-28, because it re-reads a
  // corpus that grows every night.
  //
  // So the narrative is now WEEKLY and every other night runs `--no-narrative`.
  //
  // WHAT MUST NOT CHANGE, and is the reason this is a flag rather than a step
  // deleted from nightly.yml: this script writes data/nightly-heartbeat.json,
  // which scripts/deadmans-switch.ts reads with a 29-hour deadline. Removing the
  // nightly invocation would have alarmed Jackson's phone every single night —
  // the dead-man's switch firing not because the pipeline died but because the
  // thing that proves it alive stopped being called. The collection, probing,
  // ledger evaluation, report file, footer and heartbeat all still run nightly.
  // Only the paid prose is weekly.
  const noNarrative = process.argv.includes('--no-narrative');

  let markdown = '';
  try {
    if (noNarrative) {
      // NOT fallbackReport(). That renderer announces "the report writer failed"
      // and files itself as the #1 thing needing attention — true when the model
      // call dies, a lie on a night the narrative was deliberately skipped. It
      // shipped that lie to Jackson's phone every weeknight from 2026-08-28.
      // skippedNarrativeReport() says what actually happened and, unlike the
      // failure renderer, prints the open findings instead of only counting them.
      markdown = skippedNarrativeReport(sources, health, verdict);
      console.log('[nightly] --no-narrative: deterministic report written, no model call, $0 spent');
    } else {
    const prompt = buildPrompt(sources, health, verdict);
    assertNoTruncation(prompt);

    const message = await meteredCreate(
      {
        model: MODEL,
        // 8000, raised from 4000 on 2026-08-26. Measured from
        // data/agent-health.jsonl: 5 of 13 recorded runs stopped on
        // `max_tokens`, and the eight that did not were sitting at 3674-3827 of
        // 4000 — the report was not occasionally long, it was permanently
        // against the ceiling. Truncated runs: 2026-08-13, 08-14, 08-15, 08-16,
        // 08-19. On those nights findings were silently dropped off the end and
        // Jackson read an incomplete report with no indication it was cut.
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      },
      { agent: 'nightly-report', run: TODAY, purpose: 'godseye-narrative' },
    );

    const block = message.content.find(c => c.type === 'text');
    if (!block || block.type !== 'text' || block.text.trim().length === 0) {
      throw new Error('model returned no text block');
    }

    // A raised ceiling is not a fixed ceiling — the report grows with the site,
    // and 8000 will eventually be too small too. What made this bug last weeks
    // was not the number, it was that hitting it produced NO signal: the report
    // just ended, mid-section, looking exactly like a short night.
    //
    // audit.ts and execute-content.ts both check stop_reason at their own
    // meteredCreate call sites. This one did not, and it is the single most
    // consequential text the pipeline writes — the thing Jackson actually reads.
    // Warn loudly and mark the document itself, so a truncated report can never
    // again be mistaken for a complete one.
    if (message.stop_reason === 'max_tokens') {
      console.warn(
        `[nightly] TRUNCATED: the narrative hit max_tokens (${message.usage.output_tokens} output tokens). ` +
          'Findings were dropped from the end of this report. Raise max_tokens in scripts/nightly-report.ts.',
      );
      markdown =
        `> **⚠ THIS REPORT IS INCOMPLETE.** The narrative hit its ${message.usage.output_tokens}-token output ` +
        'limit and was cut off mid-way. Findings after this point were dropped — this is not a short night, it ' +
        'is a truncated one. Raise `max_tokens` in `scripts/nightly-report.ts` and re-run.\n\n' +
        block.text;
    } else {
      markdown = block.text;
    }
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[nightly] report generation failed: ${reason}`);
    markdown = fallbackReport(sources, health, reason, verdict);
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
    // One plain sentence, because this line survives whatever prose the model
    // wrote above it and is therefore the last thing standing on a bad night.
    // The model is instructed not to call a blind night clean; this makes that
    // unfalsifiable rather than merely requested — but it only works if a human
    // can read it, which the old "Coverage: 7/8 · Detectors blind: 1/9" could not.
    health.blind.length === 0 && health.selfFailure === null
      ? `_I checked all ${health.checked} things I'm supposed to check, and could read ${cov.verified} of ${cov.total} data sources._`
      : `_⚠️ I could NOT check ${health.blind.length} of ${health.checked} things today. This report does not say the site is fine — it says I did not look at everything._`,
    ``,
    `_Data sources I could not read: ${sources.filter(s => s.trust !== 'verified').map(s => s.name).join(', ') || 'none'}. Took ${durationSec}s. Generated ${new Date().toISOString()}._`,
    ``,
    `<details><summary>Technical detail — the checks that did not run</summary>`,
    ``,
    ...blindTable(health),
    ``,
    `Numbers from a source I could not verify are marked in the text above. A check that`,
    `did not run has not reported good health — it has reported nothing.`,
    ``,
    `</details>`,
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
  //
  // The filter drops three kinds of line that are real content in the file and
  // noise on a lock screen: headings, wholly-italic asides (`_Short version..._`,
  // which is meta ABOUT the report rather than anything the report found), and
  // table/HTML scaffolding. Without this the short report's preview was its own
  // disclaimer — three lines explaining the cadence and not one line of news.
  const tldr = markdown
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !/^_.*_$/.test(l) && !l.startsWith('|') && !l.startsWith('<'))
    .slice(0, 3)
    .join(' ');
  // The blind count goes in the TITLE, not the body. A lock-screen notification
  // is often the entire report Jackson reads, and "88% coverage" alongside a
  // reassuring TL;DR is precisely how a month of truncated audits felt fine.

  // The title is a VERDICT, not statistics. "88% coverage" is a number that
  // requires interpretation on a lock screen, and interpretation is exactly what
  // is not available there — it read as reassuring on nights it should not have.
  // Site name first (two sites produce otherwise identical alerts), then the
  // verdict, and nothing else: a title is cut off around 30-40 characters, so
  // every word after the verdict is a word that pushes the verdict off-screen.
  // The date is dropped deliberately — a notification arriving at 5pm does not
  // need to tell you what day it is.
  await push(`${siteLabel()}: ${verdict.title}`, tldr);
}

/**
 * Only run as a script. Same guard and same regex shape as cost-rollup.ts,
 * ledger-evaluate.ts and probes/pr-gate.ts.
 *
 * It was missing here until 2026-08-13, and importing this module to unit-test
 * `decideVerdict()` ran the entire nightly: it made a real Anthropic call, wrote
 * wiki/nightly/, overwrote the dead-man's-switch heartbeat, and PUSHED A REAL
 * NOTIFICATION TO JACKSON'S PHONE. The heartbeat one is the dangerous half — a
 * test that refreshes the liveness signal makes the watchdog report a healthy
 * system on a night the real nightly never ran.
 *
 * This is the same class as `--backfill --dry-run` writing to the ledger, found
 * the same day: the safe-looking operation had a side effect nobody had checked
 * for, because nobody had needed to import the module before.
 */
const invokedDirectly = process.argv[1] !== undefined && /nightly-report\.ts$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch(error => {
    // Last resort. Exiting non-zero here means no heartbeat was written, which is
    // exactly what should wake the dead-man's switch.
    console.error('[nightly] FATAL:', error);
    process.exit(1);
  });
}
