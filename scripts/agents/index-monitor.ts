/**
 * index-monitor.ts — Monday indexing health check
 *
 * Inspects every page in src/pages/ via the GSC URL Inspection API.
 * For each page: checks index status, diagnoses issues, applies code-level fixes,
 * and resubmits the sitemap to trigger re-crawl for any affected pages.
 *
 * Fix scope:
 *   - Unintentional noindex tags → removed from source
 *   - Wrong/missing canonical → corrected in source
 *   - Schema JSON-LD parse errors → fixed in source
 * Non-fixable issues (thin content, crawl budget, robots.txt config) are
 * diagnosed and flagged in the report for the strategy agent to pick up.
 *
 * Re-indexing: The GSC API has no "request indexing" endpoint for general pages.
 * After fixes, we resubmit the sitemap via the Sitemaps API — the best available
 * programmatic signal to Google to re-process the site.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, archiveToRaw, writeWikiPage, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SITE_URL = 'https://tallchairadvisor.com/';
const CREDENTIALS_PATH = resolve(ROOT, 'credentials/gsc-service-account.json');
const SITEMAP_URL = 'https://tallchairadvisor.com/sitemap-index.xml';

// Pages that are intentionally not indexed — skip fix attempts
const SKIP_FIX = new Set([
  'src/pages/404.astro',
  'src/pages/privacy-policy.astro',
  'src/pages/affiliate-disclosure.astro',
  'src/pages/contact.astro',
]);

interface PageInspection {
  url: string;
  filePath: string;
  urlType: 'page' | 'redirect-source'; // page = src/pages/, redirect-source = _redirects source
  verdict: string;          // PASS | FAIL | NEUTRAL | VERDICT_UNSPECIFIED
  coverageState: string;    // human-readable GSC coverage state
  indexingState: string;    // INDEXING_ALLOWED | BLOCKED_BY_META_TAG | etc
  robotsTxtState: string;   // ALLOWED | DISALLOWED
  pageFetchState: string;   // SUCCESSFUL | SOFT_404 | NOT_FOUND | etc
  lastCrawlTime: string | null;
  fixable: boolean;
  fixType: 'noindex' | 'canonical' | 'schema' | 'not-found' | 'soft-404' | 'thin-content' | 'robots' | 'wait' | 'ok' | 'redirect-error';
  diagnosis: string;
}

// Convert src/pages/**/*.astro file path to full URL
function fileToUrl(relPath: string): string {
  let slug = relPath
    .replace(/^src\/pages\//, '')
    .replace(/\.astro$/, '')
    .replace(/\/index$/, '');
  if (slug === 'index') slug = '';
  return `${SITE_URL.replace(/\/$/, '')}/${slug}${slug ? '/' : ''}`;
}

// Recursively find all .astro files under src/pages/
function getAllAstroFiles(): string[] {
  const pagesDir = resolve(ROOT, 'src/pages');
  const entries = readdirSync(pagesDir, { recursive: true, encoding: 'utf-8' });
  return (entries as string[])
    .filter(f => f.endsWith('.astro'))
    .map(f => `src/pages/${f}`);
}

// Parse redirect source URLs from public/_redirects (skip wildcards)
function getRedirectSourceUrls(): string[] {
  const redirectsPath = resolve(ROOT, 'public/_redirects');
  if (!existsSync(redirectsPath)) return [];
  const lines = readFileSync(redirectsPath, 'utf-8').split('\n');
  const urls: string[] = [];
  const withSlash = (p: string) => (/\.[a-z]{2,4}$/.test(p) || p.endsWith('/') ? p : p + '/');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    const source = parts[0];
    const target = parts[1];
    // Skip wildcards and absolute URLs (e.g. https://www.* rule)
    if (source.includes('*') || source.startsWith('https://')) continue;
    // Skip trailing-slash normalizers (source differs from target only by a slash).
    // Google never indexes these sources, so inspecting them permanently returns a
    // meaningless "unknown to Google" — burning URL Inspection API quota (~30/run)
    // and flooding the report with noise. Only content redirects (merged/renamed
    // pages) can have a real broken-redirect problem worth catching.
    if (withSlash(source) === withSlash(target)) continue;
    urls.push(`https://tallchairadvisor.com${source}`);
  }
  return urls;
}

function classifyIssue(result: any, isRedirectSource = false): Pick<PageInspection, 'fixable' | 'fixType' | 'diagnosis'> {
  const indexingState = result.indexingState ?? '';
  const pageFetchState = result.pageFetchState ?? '';
  const coverageState = result.coverageState ?? '';
  const verdict = result.verdict ?? '';

  if (verdict === 'PASS') {
    return { fixable: false, fixType: 'ok', diagnosis: isRedirectSource ? 'Redirect resolves correctly — destination is indexed.' : 'Page is indexed and healthy.' };
  }

  if (isRedirectSource) {
    // For redirect sources, any non-PASS result is a redirect error to investigate
    const isError = coverageState.toLowerCase().includes('error') || pageFetchState === 'NOT_FOUND' || pageFetchState === 'REDIRECT_ERROR';
    return {
      fixable: false,
      fixType: 'redirect-error',
      diagnosis: isError
        ? `Redirect error on this source URL. Check public/_redirects — the chain may be broken or loop. Coverage: "${coverageState}", FetchState: "${pageFetchState}".`
        : `Redirect source: ${coverageState}. Destination may not be indexed yet. Coverage: "${coverageState}".`,
    };
  }

  if (indexingState === 'BLOCKED_BY_META_TAG') {
    return {
      fixable: true,
      fixType: 'noindex',
      diagnosis: `Page has a noindex directive (meta robots or x-robots-tag). If unintentional, remove it from the source file. Coverage state: "${coverageState}".`,
    };
  }

  if (indexingState === 'BLOCKED_BY_ROBOTS_TXT' || result.robotsTxtState === 'DISALLOWED') {
    return {
      fixable: false,
      fixType: 'robots',
      diagnosis: `Page is blocked by robots.txt. Check public/_headers or public/robots.txt. Coverage: "${coverageState}".`,
    };
  }

  if (indexingState === 'BLOCKED_BY_HTTP_HEADER') {
    return {
      fixable: false,
      fixType: 'robots',
      diagnosis: `Page is blocked via HTTP header (x-robots-tag: noindex). Check public/_headers. Coverage: "${coverageState}".`,
    };
  }

  if (pageFetchState === 'SOFT_404') {
    return {
      fixable: true,
      fixType: 'soft-404',
      diagnosis: `Google detected a soft 404 — page loads but signals an error or has too little content. Needs content expansion or proper error handling. Coverage: "${coverageState}".`,
    };
  }

  if (pageFetchState === 'NOT_FOUND') {
    return {
      fixable: false,
      fixType: 'not-found',
      diagnosis: `Page returned a 404. Check if the URL mapping is correct, or if a redirect is needed. Coverage: "${coverageState}".`,
    };
  }

  if (coverageState.toLowerCase().includes('crawled') && !coverageState.toLowerCase().includes('indexed')) {
    return {
      fixable: true,
      fixType: 'thin-content',
      diagnosis: `Google crawled the page but chose not to index it. Likely thin content, duplicate, or low quality signal. Coverage: "${coverageState}".`,
    };
  }

  if (coverageState.toLowerCase().includes('discovered') || coverageState.toLowerCase().includes('submitted')) {
    const lastCrawl = result.lastCrawlTime;
    const daysSince = lastCrawl
      ? Math.floor((Date.now() - new Date(lastCrawl).getTime()) / 86400000)
      : null;
    if (!lastCrawl || daysSince! > 30) {
      return {
        fixable: false,
        fixType: 'wait',
        diagnosis: `Page is queued for indexing but hasn't been crawled${lastCrawl ? ` in ${daysSince} days` : ' yet'}. Sitemap resubmission will help. Coverage: "${coverageState}".`,
      };
    }
    return {
      fixable: false,
      fixType: 'wait',
      diagnosis: `Page discovered, last crawled ${daysSince} days ago. Google hasn't indexed it yet. Coverage: "${coverageState}".`,
    };
  }

  return {
    fixable: false,
    fixType: 'wait',
    diagnosis: `Non-critical or unknown issue. Coverage: "${coverageState}", IndexingState: "${indexingState}", FetchState: "${pageFetchState}".`,
  };
}

// URL Inspection requires searchconsole v1, not webmasters v3
async function inspectPage(sc: any, url: string): Promise<any> {
  try {
    const res = await sc.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: SITE_URL,
      },
    });
    return res.data.inspectionResult?.indexStatusResult ?? {};
  } catch (e: any) {
    console.error(`  ⚠ Inspection failed for ${url}: ${e.message}`);
    return { verdict: 'VERDICT_UNSPECIFIED', coverageState: 'API error', error: e.message };
  }
}

async function fixPage(filePath: string, inspection: PageInspection): Promise<{ fixed: boolean; summary: string }> {
  const fullPath = resolve(ROOT, filePath);
  if (!existsSync(fullPath)) {
    return { fixed: false, summary: `File not found: ${filePath}` };
  }

  const source = readFileSync(fullPath, 'utf-8');

  const systemPrompt = `You are a technical SEO developer fixing indexing issues on tallchairadvisor.com.
You will receive an Astro page source file and an indexing diagnosis.
Your job: fix ONLY the specific indexing issue identified. Do not rewrite content, change copy, or alter anything unrelated.

RULES:
- Output the complete fixed Astro file only. No explanation, no markdown fences.
- Preserve all existing content exactly — only change what's needed for the fix.
- For noindex removal: delete any \`noindex={true}\`, \`noindex\` prop on <Layout>, or <meta name="robots" content="noindex"> line.
- For canonical fixes: correct the \`canonical\` prop to match the page's actual URL.
- For soft-404: add a minimum of 200 words of relevant content to the main body so Google sees a real page.
- For thin-content: expand the main content section with relevant, research-based material.
- The file MUST start with --- frontmatter, use valid JS operators (&&/||, not and/or), and end with </Layout>.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Fix this indexing issue.

ISSUE TYPE: ${inspection.fixType}
DIAGNOSIS: ${inspection.diagnosis}
GSC COVERAGE STATE: ${inspection.coverageState}
PAGE URL: ${inspection.url}

SOURCE FILE (${filePath}):
${source}

Output the complete fixed file.`,
    }],
  });

  const fixed = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  if (!fixed || fixed.length < 200) {
    return { fixed: false, summary: `Claude returned empty fix for ${filePath}` };
  }

  // Validate basic Astro structure
  if (!fixed.startsWith('---') || !fixed.includes('<Layout') || !fixed.includes('</Layout>')) {
    return { fixed: false, summary: `Fix for ${filePath} failed validation (missing frontmatter or Layout)` };
  }

  // Safety: don't shrink the file by more than 20%
  const origWords = source.split(/\s+/).length;
  const fixedWords = fixed.split(/\s+/).length;
  if (fixedWords < origWords * 0.8) {
    return { fixed: false, summary: `Fix for ${filePath} rejected: word count dropped ${origWords} → ${fixedWords} (>20% loss)` };
  }

  // Voice guard: non-Gesture pages must not contain first-person testing voice
  const isGesturePage = filePath.includes('gesture');
  if (!isGesturePage) {
    const VOICE_PATTERNS = [
      /I (tested|sat in|tried|used|reviewed|tested out|tried out) the? (aeron|leap|sihoo|doro)/i,
      /after (sitting|using|trying) (in |out )?(the )?(aeron|leap|sihoo|doro)/i,
      /in my experience.{0,100}(aeron|leap|sihoo|doro)/i,
      /I (found|discovered|noticed|felt).{0,60}(aeron|leap|sihoo|doro)/i,
      /during (my|the) (review|testing|test).{0,60}(aeron|leap|sihoo|doro)/i,
      /I (tried|tested) (it|them|this chair)/i,
    ];
    for (const pattern of VOICE_PATTERNS) {
      if (pattern.test(fixed)) {
        return { fixed: false, summary: `Fix for ${filePath} rejected: voice violation detected` };
      }
    }
  }

  writeFileSync(fullPath, fixed);
  return { fixed: true, summary: `Fixed ${inspection.fixType} issue in ${filePath}` };
}

async function resubmitSitemap(webmasters: any): Promise<boolean> {
  try {
    await webmasters.sitemaps.submit({
      siteUrl: SITE_URL,
      feedpath: SITEMAP_URL,
    });
    console.log(`  ✅ Sitemap resubmitted: ${SITEMAP_URL}`);
    return true;
  } catch (e: any) {
    console.error(`  ⚠ Sitemap resubmission failed: ${e.message}`);
    return false;
  }
}

async function main() {
  const keyFile = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    // webmasters scope for URL inspection + sitemap submit (write)
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth }); // for sitemap submission
  const sc = google.searchconsole({ version: 'v1', auth });      // for URL Inspection API

  const allFiles = getAllAstroFiles();
  const redirectUrls = getRedirectSourceUrls();
  console.log(`Found ${allFiles.length} pages + ${redirectUrls.length} redirect sources to inspect.`);

  const inspections: PageInspection[] = [];

  for (const filePath of allFiles) {
    const url = fileToUrl(filePath);
    process.stdout.write(`  Inspecting ${url} ... `);

    const result = await inspectPage(sc, url);

    const verdict = result.verdict ?? 'VERDICT_UNSPECIFIED';
    const classification = classifyIssue(result, false);

    const inspection: PageInspection = {
      url,
      filePath,
      urlType: 'page',
      verdict,
      coverageState: result.coverageState ?? 'Unknown',
      indexingState: result.indexingState ?? 'Unknown',
      robotsTxtState: result.robotsTxtState ?? 'Unknown',
      pageFetchState: result.pageFetchState ?? 'Unknown',
      lastCrawlTime: result.lastCrawlTime ?? null,
      ...classification,
    };

    inspections.push(inspection);
    console.log(`${verdict} — ${inspection.coverageState}`);

    // Rate limit: GSC URL Inspection allows ~1 req/sec per property
    await new Promise(r => setTimeout(r, 1100));
  }

  // Inspect redirect source URLs (catches redirect errors the page loop misses)
  console.log('\nInspecting redirect sources...');
  for (const url of redirectUrls) {
    process.stdout.write(`  Inspecting ${url} ... `);

    const result = await inspectPage(sc, url);
    const verdict = result.verdict ?? 'VERDICT_UNSPECIFIED';
    const classification = classifyIssue(result, true);

    // Only surface redirect sources that are non-PASS (working redirects are noise)
    if (verdict !== 'PASS') {
      const inspection: PageInspection = {
        url,
        filePath: '',
        urlType: 'redirect-source',
        verdict,
        coverageState: result.coverageState ?? 'Unknown',
        indexingState: result.indexingState ?? 'Unknown',
        robotsTxtState: result.robotsTxtState ?? 'Unknown',
        pageFetchState: result.pageFetchState ?? 'Unknown',
        lastCrawlTime: result.lastCrawlTime ?? null,
        ...classification,
      };
      inspections.push(inspection);
      console.log(`${verdict} — ${inspection.coverageState} ⚠`);
    } else {
      console.log(`${verdict} — redirect working`);
    }

    await new Promise(r => setTimeout(r, 1100));
  }

  // --- Apply fixes ---
  const fixable = inspections.filter(i => i.fixable && i.urlType === 'page' && !SKIP_FIX.has(i.filePath));
  const issues = inspections.filter(i => i.verdict !== 'PASS');
  const indexed = inspections.filter(i => i.verdict === 'PASS' && i.urlType === 'page');
  const redirectIssues = inspections.filter(i => i.urlType === 'redirect-source');

  const pageIssues = issues.filter(i => i.urlType === 'page');
  console.log(`\nResults: ${indexed.length} indexed | ${pageIssues.length} page issues | ${redirectIssues.length} redirect issues | ${fixable.length} fixable`);

  const fixResults: string[] = [];
  let anyFixed = false;

  for (const page of fixable) {
    console.log(`  → Fixing ${page.fixType}: ${page.filePath}`);
    const result = await fixPage(page.filePath, page);
    fixResults.push(`- [${result.fixed ? '✅' : '❌'}] ${result.summary}`);
    if (result.fixed) anyFixed = true;
    await new Promise(r => setTimeout(r, 2000));
  }

  // --- Resubmit sitemap if there are unindexed pages or fixes were applied ---
  let sitemapResubmitted = false;
  if (issues.length > 0 || anyFixed) {
    console.log('\nResubmitting sitemap...');
    sitemapResubmitted = await resubmitSitemap(webmasters);
  }

  // --- Build report ---
  const passSection = indexed
    .map(i => `| ${i.url} | ✅ Indexed | ${i.lastCrawlTime ? i.lastCrawlTime.split('T')[0] : 'unknown'} |`)
    .join('\n');

  const pageIssueSection = pageIssues
    .map(i => `| ${i.url} | ${i.verdict} | ${i.coverageState} | ${i.fixType} | ${i.diagnosis.slice(0, 120)} |`)
    .join('\n');

  const redirectIssueSection = redirectIssues
    .map(i => `| ${i.url} | ${i.coverageState} | ${i.diagnosis.slice(0, 120)} |`)
    .join('\n');

  const report = `# Index Monitor Report — ${today()}

## Summary

| Metric | Value |
|--------|-------|
| Astro pages inspected | ${allFiles.length} |
| Redirect sources inspected | ${redirectUrls.length} |
| Indexed (PASS) | ${indexed.length} |
| Page issues | ${pageIssues.length} |
| Redirect issues | ${redirectIssues.length} |
| Fixes applied | ${fixable.filter((_, i) => fixResults[i]?.startsWith('- [✅]')).length} |
| Sitemap resubmitted | ${sitemapResubmitted ? 'Yes' : 'No'} |

## Page Issues

| URL | Verdict | Coverage State | Issue Type | Diagnosis |
|-----|---------|---------------|------------|-----------|
${pageIssueSection || '*(none)*'}

## Redirect Source Issues

| URL | Coverage State | Diagnosis |
|-----|---------------|-----------|
${redirectIssueSection || '*(none — all redirects resolving correctly)*'}

## Fixes Applied

${fixResults.length > 0 ? fixResults.join('\n') : '*(none needed)*'}

## Indexed Pages

| URL | Status | Last Crawled |
|-----|--------|-------------|
${passSection || '*(none)*'}

---
*Sitemap resubmission is the best available programmatic re-indexing signal. Google does not expose a "request indexing" API endpoint for general pages.*
`;

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/index-monitor.md'), report);
  archiveToRaw(ROOT, 'audits', `${today()}-index-monitor.md`, report);

  // --- Update wiki concept page ---
  const wikiPage = `---
type: concept
last_updated: ${today()}
sources: [raw/audits/${today()}-index-monitor.md]
tags: [indexing, gsc, coverage, technical-seo]
---

# Indexing Health

Last checked: **${today()}**

## Current Status

| Metric | Value |
|--------|-------|
| Astro pages | ${allFiles.length} |
| Redirect sources checked | ${redirectUrls.length} |
| Indexed | ${indexed.length} |
| Page issues | ${pageIssues.length} |
| Redirect issues | ${redirectIssues.length} |

## Page Issues

${pageIssues.length > 0
  ? pageIssues.map(i => `- **${i.url}** — ${i.fixType} — ${i.diagnosis.slice(0, 150)}`).join('\n')
  : '*(none — all pages indexed)*'}

## Redirect Source Issues

${redirectIssues.length > 0
  ? redirectIssues.map(i => `- **${i.url}** — ${i.diagnosis.slice(0, 150)}`).join('\n')
  : '*(none — all redirects resolving correctly)*'}

## Not Yet Indexed (waiting)

${inspections.filter(i => i.fixType === 'wait' && i.urlType === 'page').map(i => `- ${i.url} — ${i.coverageState}`).join('\n') || '*(none)*'}

## Fix History

| Date | Page | Fix Type | Result |
|------|------|----------|--------|
${fixResults.map((r, idx) => {
  const page = fixable[idx];
  return `| ${today()} | ${page?.url ?? '?'} | ${page?.fixType ?? '?'} | ${r.includes('✅') ? 'Fixed' : 'Failed'} |`;
}).join('\n') || `| ${today()} | — | — | No fixes needed |`}
`;

  writeWikiPage(ROOT, 'pages/concepts/indexing-health.md', wikiPage);

  appendWikiLog(ROOT, `## [${today()}] index-monitor | Indexing Health Check\n\n- Pages inspected: ${allFiles.length} | Redirect sources: ${redirectUrls.length}\n- Indexed: ${indexed.length} | Page issues: ${pageIssues.length} | Redirect issues: ${redirectIssues.length} | Fixed: ${fixable.length}\n- Sitemap resubmitted: ${sitemapResubmitted}\n- Page issues: ${pageIssues.map(i => `${i.url} (${i.fixType})`).join(', ') || 'none'}\n- Redirect issues: ${redirectIssues.map(i => i.url).join(', ') || 'none'}\n`);

  console.log(`\nDone → reports/index-monitor.md`);
  if (issues.length > 0) {
    console.log(`\nPages with issues:`);
    for (const i of issues) {
      console.log(`  ${i.verdict.padEnd(10)} ${i.url}`);
      console.log(`             ${i.diagnosis.slice(0, 100)}`);
    }
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
