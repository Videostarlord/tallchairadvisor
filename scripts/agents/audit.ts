/**
 * audit.ts — Tuesday agent
 * Checks live site meta/schema/CTR issues, writes reports/audit-report.md
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveToRaw, appendWikiLog, logCacheUsage, readConceptContext, readSynthesisContext, readWikiPage, writeWikiPage, today, reconcileInterventions, withRetry } from './wiki-utils.js';
import { loadRedirectMap, isRedirectSource, resolveRedirect, withTrailingSlash } from '../redirect-map.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BASE_URL = 'https://tallchairadvisor.com';

/**
 * Fetch a page's <head> signals.
 *
 * redirect: 'manual' is REQUIRED and must not be removed. Default `fetch()`
 * follows redirects silently, which on 2026-08-05 produced a false "CRITICAL
 * duplicate content crisis": /best-office-chairs/ is a 301 to
 * /office-chairs-for-tall-people/, so following the redirect compared the
 * destination page against itself and reported identical titles + canonicals.
 * A redirect source has no <head> of its own and must never be meta-audited.
 */
async function fetchMeta(path: string) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
      redirect: 'manual',
    });

    if (res.status >= 300 && res.status < 400) {
      return {
        url,
        status: res.status,
        isRedirect: true,
        redirectTo: res.headers.get('location') ?? '(unknown)',
      };
    }

    const html = await res.text();
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ?? null;
    const desc = html.match(/<meta\s+name=["']description["']\s+content="([^"]*)"/i)?.[1] ?? null;
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)['"]/i)?.[1] ?? null;
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content="(.*?)"/i)?.[1] ?? null;
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content="(.*?)"/i)?.[1] ?? null;
    const hasSchema = html.includes('application/ld+json');
    const schemaBlocks: string[] = [];
    const schemaMatches = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of schemaMatches) {
      try { JSON.parse(m[1]); schemaBlocks.push(m[1].trim()); } catch { schemaBlocks.push('PARSE_ERROR'); }
    }
    return { url, status: res.status, isRedirect: false, title, desc, canonical, ogTitle, ogDesc, hasSchema, schemaBlocks,
      titleLen: title?.length ?? 0, descLen: desc?.length ?? 0 };
  } catch (e: any) {
    return { url, status: 0, error: e.message };
  }
}

async function main() {
  // AGENT-02: Prevent overwrite on duplicate workflow dispatch
  const reportPath = resolve(ROOT, 'reports/audit-report.md');
  if (existsSync(reportPath)) {
    const content = readFileSync(reportPath, 'utf-8');
    const todayStr = today();
    if (content.includes(todayStr)) {
      console.log(`[audit] Report for ${todayStr} already exists — exiting to prevent overwrite.`);
      appendWikiLog(ROOT, `## [${todayStr}] audit | SKIPPED\n\n- Reason: duplicate dispatch detected — report already existed\n`);
      process.exit(0);
    }
  }

  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));
  const analysisPath = resolve(ROOT, 'data/gsc/analysis.json');
  const gscAnalysis = existsSync(analysisPath) ? JSON.parse(readFileSync(analysisPath, 'utf-8')) : null;

  // Reconcile intervention outcomes now that fresh GSC data is available
  reconcileInterventions(ROOT);

  // Redirect sources are not pages. They keep producing GSC impressions for
  // ~90 days after a merge, so they surface in this list and MUST be excluded
  // before any meta/duplicate analysis — see scripts/redirect-map.ts for the
  // 2026-08-05 incident this prevents.
  const redirectMap = loadRedirectMap(ROOT);

  const candidatePages = gsc.pages
    .filter((p: any) => p.impressions >= 10 && !p.page.includes('/assets/') && !p.page.includes('/images/'))
    .sort((a: any, b: any) => b.impressions - a.impressions);

  const redirectPages = candidatePages.filter((p: any) =>
    isRedirectSource(redirectMap, (p.page as string).replace(BASE_URL, '')));

  const pagesToAudit = candidatePages
    .filter((p: any) => !isRedirectSource(redirectMap, (p.page as string).replace(BASE_URL, '')))
    .slice(0, 20);

  if (redirectPages.length > 0) {
    console.log(`[audit] Excluded ${redirectPages.length} redirect source(s) from the audit set:`);
    for (const p of redirectPages) {
      const from = (p.page as string).replace(BASE_URL, '');
      console.log(`  ${from} -> ${resolveRedirect(redirectMap, withTrailingSlash(from))} (${p.impressions} residual impr)`);
    }
  }

  console.log(`Auditing ${pagesToAudit.length} pages...`);

  const pageResults: Array<{ gsc: any; meta: any }> = [];
  for (const page of pagesToAudit) {
    const path = page.page.startsWith('/') ? page.page : `/${page.page}`;
    const meta = await fetchMeta(path);
    // Belt-and-braces: if a live 3xx shows up that _redirects didn't predict
    // (e.g. a Cloudflare-level rule), drop it rather than meta-auditing it.
    if ((meta as any).isRedirect) {
      console.log(`[audit] Skipping ${path} — live ${meta.status} to ${(meta as any).redirectTo}`);
      continue;
    }
    pageResults.push({ gsc: page, meta });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Every redirect source, so the model can never mistake one for a page.
  // Not just the ones with impressions — a merge target comparison could
  // reference any of them.
  const redirectListForPrompt = redirectMap.size === 0
    ? '  (none)'
    : [...redirectMap.entries()].map(([from, to]) => `  ${from} -> ${to}`).join('\n');

  // Read wiki context for historical comparison
  const wikiContext = readConceptContext(ROOT, ['ctr-optimization', 'statistical-confidence-policy', 'meta-descriptions', 'schema-markup']);
  const synthesisContext = readSynthesisContext(ROOT);

  // Call Claude for analysis
  const response = await withRetry(() => client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: `You are an SEO auditor for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people (6'+).
Author: Jackson Christopher, 6'4", ME student at UC Berkeley.
CRITICAL: Jackson has ONLY personally tested the Steelcase Gesture. All other chairs must use research-based voice, never first-person testing.
Affiliate tag: tag=tallchairadvi-20 (must be on all Amazon links).
Meta descriptions: 130-155 chars ideal. Titles: 50-60 chars.
CTR leak = position ≤ 10 with 0 or very low clicks.

REDIRECT SOURCES — DO NOT FLAG AS DUPLICATE CONTENT.
These URLs are 301 redirects, not pages. They have been excluded from the data below,
but they still appear in GSC with residual impressions for ~90 days after a merge:
${redirectListForPrompt}
Never report a canonical/duplicate/cannibalization issue between a redirect source and
its target — that is the merge working as intended, not a problem. On 2026-08-05 this
exact false positive was reported as CRITICAL and nearly caused an agent to recreate a
deliberately consolidated page. If you believe two URLs are duplicates, first confirm
neither appears in the list above.

HISTORICAL CONTEXT FROM WIKI (compare this week against prior findings):
${wikiContext.slice(0, 2000)}

STRATEGIC CONTEXT:
${synthesisContext.slice(0, 1500)}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{
      role: 'user',
      content: `Audit these pages and identify all issues. For each issue assign severity: critical/high/medium/low.

SITE DATA (last 90 days):
- Total clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions} | Avg pos: ${gsc.totals.avgPosition}

PAGE AUDIT RESULTS:
${pageResults.map(r => {
  const pagePath = r.gsc.page;
  let queryContext = '';
  if (gscAnalysis) {
    const leaks = gscAnalysis.ctrLeaks.filter((l: any) => l.page === pagePath).slice(0, 3);
    const opp = gscAnalysis.opportunities.find((o: any) => o.page === pagePath);
    if (leaks.length > 0) {
      queryContext = `QUERY LEAKS: ${leaks.map((l: any) => `"${l.query}" (${l.impressions} impr, pos ${l.position}, ${l.actualCTR}% CTR${l.aioSuspect ? ' ⚠AIO' : ''})`).join(' | ')}`;
    } else if (opp?.topQueries?.length > 0) {
      queryContext = `TOP QUERIES: ${opp.topQueries.join(' | ')}`;
    }
    if (opp && opp.opportunityType !== 'low-signal') {
      queryContext += `\nOPPORTUNITY: [${opp.opportunityType}] ${opp.recommendation}`;
    }
  }
  return `
PAGE: ${pagePath}
GSC: ${r.gsc.clicks} clicks | ${r.gsc.impressions} impr | pos ${r.gsc.position} | CTR ${r.gsc.ctr}%
${queryContext ? queryContext + '\n' : ''}Title (${r.meta.titleLen || 0} chars): ${r.meta.title || 'MISSING'}
Meta desc (${r.meta.descLen || 0} chars): ${r.meta.desc || 'MISSING'}
Canonical: ${r.meta.canonical || 'MISSING'}
OG Title: ${r.meta.ogTitle || 'MISSING'}
Schema: ${r.meta.hasSchema ? 'Present' : 'MISSING'}
Schema blocks: ${r.meta.schemaBlocks?.join(' | ').slice(0, 200) || 'none'}
`;
}).join('\n---\n')}

Output a structured markdown audit report with:
1. Executive summary (3-4 sentences, overall health)
2. Critical CTR leaks (pages with position ≤ 10 and 0 clicks — top priority)
3. Issues by severity (critical/high/medium/low) with specific fixes
4. Pages not needing action
5. Week's recommended focus (top 3 fixes that will have most impact)

Be specific: include exact meta descriptions to rewrite, exact schema errors to fix, etc.`,
    }],
  }));

  logCacheUsage('audit', response.usage, ROOT);

  const report = response.content[0].type === 'text' ? response.content[0].text : 'Audit failed.';
  const output = `# TCA Weekly Audit Report
**Generated:** ${new Date().toISOString()}
**Data range:** ${gsc.dateRange.start} → ${gsc.dateRange.end}

${report}`;

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/audit-report.md'), output);

  // Archive to wiki raw layer
  archiveToRaw(ROOT, 'audits', `${today()}-weekly-audit.md`, output);

  // Update wiki GSC performance page — preserve history, don't overwrite
  const existingGscPage = readWikiPage(ROOT, 'pages/concepts/gsc-performance.md') || '';

  // Extract and archive existing "Latest Snapshot" section as a historical entry
  const latestMatch = existingGscPage.match(/## Latest Snapshot[^\n]*\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);
  const oldSnapshotContent = latestMatch?.[1]?.trim() ?? '';

  // Extract existing historical entries
  const historyMatch = existingGscPage.match(/## Historical Snapshots\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);
  const existingHistory = historyMatch?.[1]?.trim() ?? '';

  // Split history into individual dated blocks (separated by blank lines + date heading)
  const historyBlocks = existingHistory
    .split(/\n(?=### )/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  // Keep latest 7 historical entries (new one will bring total to 8)
  const trimmedHistory = historyBlocks.slice(0, 7);

  // Build new historical entry from old snapshot
  const prevDate = existingGscPage.match(/## Latest Snapshot \(([^)]+)\)/)?.[1] ?? 'previous';
  const newHistoryEntry = oldSnapshotContent
    ? `### ${prevDate}\n\n${oldSnapshotContent}`
    : '';

  const historicalSection = [newHistoryEntry, ...trimmedHistory].filter(b => b.length > 0).join('\n\n');

  // Build new top pages table
  const topPagesTable = pagesToAudit.slice(0, 10)
    .map((p: any) => `| ${p.page} | ${p.impressions} impr | pos ${p.position} | ${p.ctr}% CTR | ${p.clicks} clicks |`)
    .join('\n');

  const gscWikiUpdate = `---
type: concept
last_updated: ${today()}
sources: [raw/audits/${today()}-weekly-audit.md]
tags: [gsc, performance, metrics, tracking]
---

# GSC Performance Tracking

## Latest Snapshot (${today()})

| Metric | Value |
|--------|-------|
| Total impressions | ${gsc.totals.impressions} |
| Total clicks | ${gsc.totals.clicks} |
| Avg CTR | ${gsc.totals.ctr}% |
| Avg position | ${gsc.totals.avgPosition} |

## Top Pages

${topPagesTable}

*Full audit report: raw/audits/${today()}-weekly-audit.md*

## Historical Snapshots

${historicalSection}
`;
  writeWikiPage(ROOT, 'pages/concepts/gsc-performance.md', gscWikiUpdate);

  appendWikiLog(ROOT, `## [${today()}] audit | Weekly Site Audit\n\n- Pages audited: ${pagesToAudit.length}\n- Clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions}\n- Full report archived to raw/audits/${today()}-weekly-audit.md\n`);

  console.log('\nAudit complete → reports/audit-report.md');
  console.log('Wiki updated → wiki/pages/concepts/gsc-performance.md');
}

main().catch(err => { console.error(err.message); process.exit(1); });
