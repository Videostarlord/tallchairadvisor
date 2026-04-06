/**
 * audit.ts — Tuesday agent
 * Checks live site meta/schema/CTR issues, writes reports/audit-report.md
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BASE_URL = 'https://tallchairadvisor.com';

async function fetchMeta(path: string) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ?? null;
    const desc = html.match(/<meta\s+name=["']description["']\s+content="(.*?)"/i)?.[1] ?? null;
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)['"]/i)?.[1] ?? null;
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content="(.*?)"/i)?.[1] ?? null;
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content="(.*?)"/i)?.[1] ?? null;
    const hasSchema = html.includes('application/ld+json');
    const schemaBlocks: string[] = [];
    const schemaMatches = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of schemaMatches) {
      try { JSON.parse(m[1]); schemaBlocks.push(m[1].trim()); } catch { schemaBlocks.push('PARSE_ERROR'); }
    }
    return { url, status: res.status, title, desc, canonical, ogTitle, ogDesc, hasSchema, schemaBlocks,
      titleLen: title?.length ?? 0, descLen: desc?.length ?? 0 };
  } catch (e: any) {
    return { url, status: 0, error: e.message };
  }
}

async function main() {
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));

  // Focus on pages with meaningful impressions
  const pagesToAudit = gsc.pages
    .filter((p: any) => p.impressions >= 10 && !p.page.includes('/assets/') && !p.page.includes('/images/'))
    .sort((a: any, b: any) => b.impressions - a.impressions)
    .slice(0, 20);

  console.log(`Auditing ${pagesToAudit.length} pages...`);

  const pageResults = [];
  for (const page of pagesToAudit) {
    const path = page.page.startsWith('/') ? page.page : `/${page.page}`;
    const meta = await fetchMeta(path);
    pageResults.push({ gsc: page, meta });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Call Claude for analysis
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are an SEO auditor for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people (6'+).
Author: Jackson Christopher, 6'4", ME student at UC Berkeley.
CRITICAL: Jackson has ONLY personally tested the Steelcase Gesture. All other chairs must use research-based voice, never first-person testing.
Affiliate tag: tag=tallchairadvi-20 (must be on all Amazon links).
Meta descriptions: 130-155 chars ideal. Titles: 50-60 chars.
CTR leak = position ≤ 10 with 0 or very low clicks.`,
    messages: [{
      role: 'user',
      content: `Audit these pages and identify all issues. For each issue assign severity: critical/high/medium/low.

SITE DATA (last 90 days):
- Total clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions} | Avg pos: ${gsc.totals.avgPosition}

PAGE AUDIT RESULTS:
${pageResults.map(r => `
PAGE: ${r.gsc.page}
GSC: ${r.gsc.clicks} clicks | ${r.gsc.impressions} impr | pos ${r.gsc.position} | CTR ${r.gsc.ctr}%
Title (${r.meta.titleLen || 0} chars): ${r.meta.title || 'MISSING'}
Meta desc (${r.meta.descLen || 0} chars): ${r.meta.desc || 'MISSING'}
Canonical: ${r.meta.canonical || 'MISSING'}
OG Title: ${r.meta.ogTitle || 'MISSING'}
Schema: ${r.meta.hasSchema ? 'Present' : 'MISSING'}
Schema blocks: ${r.meta.schemaBlocks?.join(' | ').slice(0, 200) || 'none'}
`).join('\n---\n')}

Output a structured markdown audit report with:
1. Executive summary (3-4 sentences, overall health)
2. Critical CTR leaks (pages with position ≤ 10 and 0 clicks — top priority)
3. Issues by severity (critical/high/medium/low) with specific fixes
4. Pages not needing action
5. Week's recommended focus (top 3 fixes that will have most impact)

Be specific: include exact meta descriptions to rewrite, exact schema errors to fix, etc.`,
    }],
  });

  const report = response.content[0].type === 'text' ? response.content[0].text : 'Audit failed.';
  const output = `# TCA Weekly Audit Report
**Generated:** ${new Date().toISOString()}
**Data range:** ${gsc.dateRange.start} → ${gsc.dateRange.end}

${report}`;

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/audit-report.md'), output);
  console.log('\nAudit complete → reports/audit-report.md');
}

main().catch(err => { console.error(err.message); process.exit(1); });
