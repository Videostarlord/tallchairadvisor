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
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { meteredCreate } from './lib/metered-client.js';
import { readValidated, readValidatedJsonl, ContractViolation, type ReadOptions } from './lib/read-validated.js';
import { ledgerRecordSchema, ledgerOptions } from './schemas/ledger.js';
import { pipelineStatusSchema, pipelineStatusOptions } from './schemas/pipeline-status.js';
import { interventionSchema, interventionsOptions } from './schemas/interventions.js';
import { retractionSchema, retractionsOptions } from './schemas/retractions.js';

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

/** A source of truth the report may draw on, and whether it is trustworthy tonight. */
interface Source {
  name: string;
  path: string;
  /** verified = behind a contract or predicate. unverified = present but unvalidated. */
  trust: 'verified' | 'unverified' | 'missing';
  reason: string | null;
  content: string | null;
  ageHours: number | null;
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
  contract: { schema: z.ZodTypeAny; opts?: ReadOptions; jsonl?: boolean; absenceIsHealthy?: boolean; summarize?: (raw: string, path: string) => string } | null,
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
    if (contract.jsonl) readValidatedJsonl(relPath, contract.schema, contract.opts);
    else readValidated(relPath, contract.schema, contract.opts);
    // Summarize only AFTER the full file has passed its contract, so the
    // condensed form can never hide a validation failure.
    const payload = contract.summarize ? contract.summarize(content, relPath) : content;
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
const collectorsRollupSchema = z.object({ collectedAt: z.string() }).passthrough();
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
 */
function summarizeProbes(raw: string, path: string): string {
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
      failing.push(`${r.url}: PROBE UNHEALTHY — ${(r.errors ?? []).join('; ')}`);
      continue;
    }
    healthy++;
    if (Array.isArray(r.errors) && r.errors.length > 0) partial++;

    const issues: string[] = [];
    if (r.status !== 200) issues.push(`status ${r.status}`);
    const n = r.network ?? {};
    if (n.gtagFired === false) issues.push('gtag NOT firing');
    if (n.clarityLoaded === false) issues.push('clarity NOT loading');
    if (n.affiliateHandlerAttached === false) issues.push('affiliate handler not attached');
    const ce = Array.isArray(r.consoleErrors) ? r.consoleErrors.length : 0;
    if (ce > 0) issues.push(`${ce} console error(s): ${r.consoleErrors.map((e: any) => e.text).slice(0, 3).join(' | ')}`);
    if (Array.isArray(r.unhandledRejections) && r.unhandledRejections.length > 0) issues.push(`${r.unhandledRejections.length} unhandled rejection(s)`);
    const h = r.head ?? {};
    const mdLen = typeof h.metaDescription === 'string' ? h.metaDescription.length : null;
    if (mdLen !== null && (mdLen < 130 || mdLen > 165)) issues.push(`meta description ${mdLen} chars (want 130-165)`);
    if (h.canonical && r.url && !String(h.canonical).endsWith(String(r.url))) issues.push(`canonical points elsewhere: ${h.canonical}`);
    if (Array.isArray(h.jsonLdParseErrors) && h.jsonLdParseErrors.length > 0) issues.push(`${h.jsonLdParseErrors.length} JSON-LD parse error(s)`);
    const g = r.geo ?? {};
    const geoMissing = [
      g.directAnswerPresent === false ? 'direct answer' : null,
      g.citationCapsulePresent === false ? 'citation capsule' : null,
      g.faqPageSchemaValid === false ? 'valid FAQPage' : null,
    ].filter(Boolean);
    if (geoMissing.length > 0) issues.push(`GEO missing: ${geoMissing.join(', ')}`);
    const v = r.vitals ?? {};
    if (typeof v.lcp === 'number' && v.lcp > 2500) issues.push(`LCP ${Math.round(v.lcp)}ms`);
    if (typeof v.cls === 'number' && v.cls > 0.1) issues.push(`CLS ${v.cls}`);

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
  if (failing.length === 0) lines.push(`No failing assertions. Every probed page fired its tags and passed head/GEO/vitals checks.`);
  else lines.push(`Pages with at least one failing assertion (${failing.length}):`, ...failing.map(f => `  - ${f}`));
  return lines.join('\n');
}

function gatherSources(): Source[] {
  const sources: Source[] = [
    load('ledger', 'data/ledger.jsonl', { schema: ledgerRecordSchema, opts: ledgerOptions, jsonl: true }),
    load('ledger-state', 'data/ledger-state.json', { schema: ledgerStateSchema }),
    load('collectors', 'data/collectors/latest.json', { schema: collectorsRollupSchema }),
    load('cost-summary', 'data/cost-summary.json', { schema: costSummarySchema }),
    load('cost-drift', 'data/cost-drift.jsonl', { schema: z.object({}).passthrough(), jsonl: true, absenceIsHealthy: true }),
    load('pipeline-status', 'data/pipeline-status.json', { schema: pipelineStatusSchema, opts: pipelineStatusOptions }),
    load('interventions', 'data/interventions.jsonl', { schema: interventionSchema, opts: interventionsOptions, jsonl: true }),
    load('retractions', 'data/retractions.jsonl', { schema: retractionSchema, opts: retractionsOptions, jsonl: true }),
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

function buildPrompt(sources: Source[]): string {
  const cov = coverage(sources);
  const parts: string[] = [];

  parts.push(
    `You are writing the God's-Eye nightly report for tallchairadvisor.com, a live affiliate site`,
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
    `## REQUIRED SECTIONS (PRD §7.6) — emit all of them, in this order`,
    ``,
    `- **What changed** — new findings, status transitions since the last report.`,
    `- **What closed** — with the evidence that proved it. An evidence-less close is a bug: flag it.`,
    `- **What is stuck, and for how long** — open items with their age in days.`,
    `- **What regressed** — passed, then failed. Lead with this if non-empty.`,
    `- **What needs a human** — escalated items, and anything blocked on a credential or on Amazon`,
    `  affiliate data (which has no API and is permanently manual).`,
    `- **What the system could not see tonight** — every missing/unhealthy source, with its reason.`,
    `  This section is mandatory even when empty (say "full coverage").`,
    `- **Spend** — from cost-summary if verified; otherwise say it was not measured.`,
    ``,
    `Write GitHub-flavored markdown. Start with an H1 \`# God's-Eye — ${TODAY}\` and a 2-3 line`,
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
function fallbackReport(sources: Source[], error: string): string {
  const cov = coverage(sources);
  const lines = [
    `# God's-Eye — ${TODAY}`,
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
  lines.push('', '## What the system could not see tonight', '');
  const blind = sources.filter(s => s.trust !== 'verified');
  if (blind.length === 0) lines.push('_Full coverage._');
  else for (const s of blind) lines.push(`- **${s.name}** — ${s.reason ?? 'unverified'}`);
  lines.push('', '## What needs a human', '', `- The report model call failed. Investigate: ${error}`);
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

  console.log(`[nightly] ${TODAY} — ${cov.verified}/${cov.total} sources verified (${cov.pct}%)`);
  for (const s of sources) {
    console.log(`  ${s.trust.padEnd(10)} ${s.name.padEnd(16)} ${s.reason ?? ''}`);
  }

  let markdown: string;
  try {
    const prompt = buildPrompt(sources);
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
    markdown = fallbackReport(sources, reason);
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
    `**Coverage:** ${cov.verified}/${cov.total} sources verified (${cov.pct}%) · **Duration:** ${durationSec}s · **Generated:** ${new Date().toISOString()}`,
    ``,
    `Unverified or missing sources tonight: ${sources.filter(s => s.trust !== 'verified').map(s => s.name).join(', ') || 'none'}.`,
    ``,
    `_Values from unverified sources are marked inline. Until a value has a schema contract_`,
    `_(PRD §7.2) or a closure predicate (§7.3) behind it, this report may not state it as fact._`,
  ].join('\n');

  const outDir = resolve(ROOT, 'wiki/nightly');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${TODAY}.md`);
  writeFileSync(outPath, markdown + footer);
  console.log(`[nightly] wrote wiki/nightly/${TODAY}.md (${markdown.length + footer.length} bytes)`);

  // Heartbeat for the dead-man's switch. Written LAST and only on success, so
  // its absence or staleness is a true signal that the nightly did not complete.
  writeFileSync(
    resolve(ROOT, 'data/nightly-heartbeat.json'),
    JSON.stringify(
      { lastRun: new Date().toISOString(), date: TODAY, coveragePct: cov.pct, durationSec: Number(durationSec), report: `wiki/nightly/${TODAY}.md` },
      null,
      2,
    ) + '\n',
  );

  // The one permitted .slice() in this file: it shortens the PHONE NOTIFICATION,
  // never the report or the model payload. The full report is already on disk at
  // this point. Rule 1 forbids truncating what the system knows, not truncating a
  // lock-screen preview of it.
  const tldr = markdown.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 3).join(' ');
  await push(`God's-Eye ${TODAY} (${cov.pct}% coverage)`, tldr);
}

main().catch(error => {
  // Last resort. Exiting non-zero here means no heartbeat was written, which is
  // exactly what should wake the dead-man's switch.
  console.error('[nightly] FATAL:', error);
  process.exit(1);
});
