/**
 * session-brief.ts — everything a working session needs, pre-joined, in one file.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * The operating model as of 2026-08-29 is: THE PIPELINE OBSERVES, JACKSON
 * DECIDES. All 19 pages and every revenue-relevant change of August came out of
 * a human-directed session, not an agent.
 *
 * Which makes the session the bottleneck — and a large fraction of every session
 * was spent GATHERING, not deciding: forcing a GSC pull, running a cost rollup,
 * joining Clarity scroll depth to GA4 affiliate clicks to CTA positions in the
 * .astro source by hand, then grepping strategy-rules to check the work was even
 * permitted. Identical every time, and it produces nothing new.
 *
 * This writes that join once a night, deterministically and for $0.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * TWO SECTIONS EARN THEIR PLACE ABOVE ALL THE OTHERS
 *
 * 1. CONVERSION JOIN — affiliate clicks × scroll depth × where the first CTA
 *    actually sits. Reconstructing this by hand is what found, on 2026-08-28,
 *    that the page with its CTA at 16% took 49 of the site's 96 affiliate clicks
 *    while every page past ~60% took 0-3.
 *
 * 2. CONSTRAINTS — the active kill-list rules. A session that proposes CTR work
 *    on a page at position 9.7 has wasted itself, because
 *    `no-ctr-iteration-below-position-8` forbids it. The rules belong at the top
 *    of the brief, not in a file someone remembers to check.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * IT REPORTS WHAT IT COULD NOT READ
 *
 * Same doctrine as every other artifact here: a source that failed its contract
 * is named as unread. A brief that silently omits GA4 because the file was
 * malformed would have a session reasoning confidently about traffic it never
 * saw. Absence is printed, never smoothed over.
 *
 * Usage: npx tsx scripts/session-brief.ts   (writes reports/session-brief.md)
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { readValidated, readValidatedJsonl } from './lib/read-validated.js';
import { gscLatestSchema, gscLatestOptions } from './schemas/gsc-latest.js';
import { gscAnalysisSchema, gscAnalysisOptions } from './schemas/gsc-analysis.js';
import { ga4LatestSchema, ga4LatestOptions } from './schemas/ga4-latest.js';
import { clarityLatestSchema, clarityLatestOptions } from './schemas/clarity-latest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'reports/session-brief.md');

/** Sources this run could not read, printed at the top so nothing is assumed. */
const unread: string[] = [];

/**
 * Read through a contract, or record the failure and return null.
 *
 * NOT a silent `?? null`: the reason is captured and printed. "I could not read
 * GA4" and "GA4 says traffic is flat" must never look the same in a brief.
 */
function tryRead<T>(label: string, fn: () => T): T | null {
  try {
    return fn();
  } catch (error) {
    unread.push(`**${label}** — ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    return null;
  }
}

/**
 * Where the first Amazon link sits, as a share of the page SOURCE.
 *
 * READ THE CAVEAT BEFORE ACTING ON THIS COLUMN. This is a markup measure and it
 * OVERSTATES depth, because site navigation is verbose in HTML but short on
 * screen. Measured 2026-08-28 against the live site in Chromium:
 * /review/aeron-size-c/ reads 45% here and renders at 13% of page height.
 *
 * It is kept because it is free, needs no browser, and ranks pages correctly
 * relative to each other — which is all a brief needs. When a number is about to
 * decide something, measure the rendered position in a real viewport instead.
 */
function firstCtaPercent(slug: string): number | null {
  const s = slug.replace(/^\/|\/$/g, '');
  for (const cand of [`src/pages/${s}.astro`, `src/pages/${s}/index.astro`]) {
    const p = resolve(ROOT, cand);
    if (!existsSync(p)) continue;
    const html = readFileSync(p, 'utf-8');
    const i = html.search(/amazon\.com\/(?:dp|s\?)/);
    return i === -1 ? null : Math.round((100 * i) / html.length);
  }
  return null;
}

function pct(n: number | null): string {
  return n === null ? '—' : `${n}%`;
}

function main(): void {
  const gsc = tryRead('GSC latest', () => readValidated(resolve(ROOT, 'data/gsc/latest.json'), gscLatestSchema, gscLatestOptions));
  const analysis = tryRead('GSC analysis', () => readValidated(resolve(ROOT, 'data/gsc/analysis.json'), gscAnalysisSchema, gscAnalysisOptions));
  const ga4 = tryRead('GA4 latest', () => readValidated(resolve(ROOT, 'data/ga4/latest.json'), ga4LatestSchema, ga4LatestOptions));
  const clarity = tryRead('Clarity latest', () => readValidated(resolve(ROOT, 'data/clarity/latest.json'), clarityLatestSchema, clarityLatestOptions));

  const out: string[] = [];
  const now = new Date().toISOString();
  out.push(`# Session Brief — ${now.slice(0, 10)}`, '');
  out.push(`_Generated ${now}. Deterministic, no model call. Everything below is joined from the pipeline's own data._`, '');

  if (unread.length > 0) {
    out.push('## ⚠ Could not read', '');
    out.push('Nothing below draws on these. A source named here was NOT consulted:', '');
    for (const u of unread) out.push(`- ${u}`);
    out.push('');
  }

  // ── 1. Constraints, first, so a session does not plan forbidden work ────────
  out.push('## Constraints on this session (read before proposing anything)', '');
  const rulesPath = resolve(ROOT, 'data/strategy-rules.json');
  if (existsSync(rulesPath)) {
    const raw = readFileSync(rulesPath, 'utf-8');
    const ids = [...raw.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]);
    const directives = [...raw.matchAll(/"directive":\s*"([^"]+)"/g)].map((m) => m[1]);
    if (ids.length === 0) out.push('_`data/strategy-rules.json` has no rules._', '');
    for (let i = 0; i < ids.length; i++) {
      out.push(`- **\`${ids[i]}\`** — ${directives[i] ?? '(no directive text)'}`);
    }
  } else {
    out.push('_`data/strategy-rules.json` not found._');
  }
  out.push('');

  // ── 2. Traffic ─────────────────────────────────────────────────────────────
  out.push('## Traffic', '');
  if (gsc !== null) {
    const t = gsc.totals;
    out.push(`- **GSC ${gsc.dateRange.days}d:** ${t.impressions.toLocaleString()} impressions, **${t.clicks} clicks**, CTR ${(100 * t.clicks / Math.max(1, t.impressions)).toFixed(3)}%, avg position ${t.avgPosition}`);
  }
  if (analysis !== null && analysis.siteTrend !== null && typeof analysis.siteTrend === 'object') {
    const st = analysis.siteTrend as Record<string, unknown>;
    out.push(`- **Momentum:** ${String(st.summaryLine ?? '—')}`);
  }
  if (ga4 !== null) {
    const g = ga4 as unknown as { totals: Record<string, number>; channelGroups: { channel: string; sessions: number; pct: number }[] };
    const direct = g.channelGroups.find((c) => c.channel === 'Direct');
    const real = g.channelGroups.filter((c) => c.channel !== 'Direct').reduce((s, c) => s + c.sessions, 0);
    out.push(`- **GA4 28d:** ${g.totals.sessions} sessions total — but Direct is ${direct === undefined ? '?' : `${direct.sessions} (${(direct.pct * 100).toFixed(0)}%)`}, engagement ${(g.totals.engagementRate * 100).toFixed(1)}%, ${g.totals.avgSessionDuration.toFixed(0)}s.`);
    out.push(`  **Treat ~${real} non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.`);
    for (const c of g.channelGroups) out.push(`  - ${c.channel}: ${c.sessions} (${(c.pct * 100).toFixed(1)}%)`);
  }
  out.push('');

  // ── 3. Opportunity, with machine retrieval separated out ───────────────────
  if (analysis !== null) {
    const opps = (analysis as unknown as { opportunities: { page: string; opportunityType: string; opportunityScore: number; impressions: number; addressableImpressions?: number; attributionRatio?: number | null; position: number; clicks: number }[] }).opportunities;
    const real = opps.filter((o) => o.opportunityType !== 'machine-retrieval' && o.opportunityScore > 0).slice(0, 8);
    const machine = opps.filter((o) => o.opportunityType === 'machine-retrieval');
    out.push('## Opportunity (scored on ADDRESSABLE impressions)', '');
    out.push('| page | type | score | addressable | of total | pos |');
    out.push('|---|---|---:|---:|---:|---:|');
    for (const o of real) {
      out.push(`| ${o.page} | ${o.opportunityType} | ${o.opportunityScore} | ${o.addressableImpressions ?? o.impressions} | ${o.impressions} | ${o.position.toFixed(1)} |`);
    }
    out.push('');
    if (machine.length > 0) {
      out.push(`**${machine.length} page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**`, '');
      for (const o of machine) {
        out.push(`- \`${o.page}\` — ${o.impressions.toLocaleString()} impressions, only ${((o.attributionRatio ?? 0) * 100).toFixed(1)}% carry a named query. GEO asset; judge on AI-assistant referrals.`);
      }
      out.push('');
    }
  }

  // ── 4. THE CONVERSION JOIN ─────────────────────────────────────────────────
  out.push('## Conversion join — affiliate clicks × scroll depth × CTA position', '');
  out.push('_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._', '');
  if (ga4 !== null && clarity !== null) {
    const g = ga4 as unknown as { pages: { page: string; sessions: number }[]; affiliateClicks: { page: string; eventCount: number }[] };
    const c = clarity as unknown as { pages: { url: string; scrollDepthAvg: number | null; engagementTimeSec: number | null }[] };
    const scroll = new Map<string, number | null>();
    for (const p of c.pages) {
      const key = p.url.replace(/^https:\/\/[^/]+/, '').split('?')[0];
      if (!scroll.has(key)) scroll.set(key, p.scrollDepthAvg);
    }
    const clicks = new Map(g.affiliateClicks.map((a) => [a.page, a.eventCount]));
    const rows = [...g.pages].sort((a, b) => b.sessions - a.sessions).slice(0, 15);
    out.push('_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._', '');
  out.push('| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |');
    out.push('|---|---:|---:|---:|---:|');
    for (const p of rows) {
      const sd = scroll.get(p.page);
      out.push(`| ${p.page} | ${p.sessions} | ${clicks.get(p.page) ?? 0} | ${sd === undefined || sd === null ? '—' : `${Math.round(sd * 100)}%`} | ${pct(firstCtaPercent(p.page))} |`);
    }
    out.push('');
    const noLink = rows.filter((p) => firstCtaPercent(p.page) === null && p.sessions >= 20);
    if (noLink.length > 0) {
      out.push(`**Pages with real traffic and NO affiliate link:** ${noLink.map((p) => `\`${p.page}\` (${p.sessions})`).join(', ')}`, '');
    }
  } else {
    out.push('_Needs both GA4 and Clarity; one or both were unreadable this run._', '');
  }

  // ── 5. Money ───────────────────────────────────────────────────────────────
  out.push('## Money', '');
  const affDir = resolve(ROOT, 'raw/affiliate');
  if (existsSync(affDir)) {
    const reports = readdirSync(affDir).filter((f) => f.endsWith('-amazon-associates-report.md')).sort();
    const newest = reports[reports.length - 1];
    out.push(newest === undefined
      ? '_No affiliate report in `raw/affiliate/`._'
      : `- Latest hand export: \`raw/affiliate/${newest}\` (${Math.round((Date.now() - statSync(join(affDir, newest)).mtimeMs) / 86400000)}d old on disk)`);
  }
  const summaryPath = resolve(ROOT, 'data/cost-summary.json');
  if (existsSync(summaryPath)) {
    const m = /"usd":\s*([0-9.]+)/.exec(readFileSync(summaryPath, 'utf-8'));
    if (m !== null) out.push(`- Pipeline spend this ledger: **$${Number(m[1]).toFixed(2)}**`);
  }
  out.push('- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.', '');

  // ── 6. Open work ───────────────────────────────────────────────────────────
  out.push('## Open work the pipeline is tracking', '');
  const state = resolve(ROOT, 'data/ledger-state.json');
  if (existsSync(state)) {
    const raw = readFileSync(state, 'utf-8');
    const counts = /"counts":\s*\{([^}]*)\}/.exec(raw);
    out.push(counts === null ? '_ledger-state.json has no counts block._' : `- Ledger: {${counts[1].replace(/\s+/g, ' ').trim()}}`);
    const escalated = [...raw.matchAll(/"page":\s*"([^"]+)"[^}]*?"reason":\s*"([^"]+)"/g)].slice(0, 6);
    for (const e of escalated) out.push(`  - **${e[1]}** — ${e[2]}`);
  }
  out.push('');
  out.push('---', '');
  out.push('_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._');

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out.join('\n') + '\n');
  console.log(`[session-brief] wrote ${relative(ROOT, OUT)} (${out.length} lines, ${unread.length} unreadable source(s))`);
}

const invokedDirectly = process.argv[1] !== undefined && /session-brief\.ts$/.test(process.argv[1]);
if (invokedDirectly) main();
