/**
 * competitor-monitor.ts — Monday agent
 * Fetches competitor pages, extracts metadata, writes data/competitors/latest.json
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveJsonToRaw, appendWikiLog, readWikiPage, writeWikiPage, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CompetitorPage {
  name: string;
  url: string;
  topic: string;
  fetchedAt: string;
  status: number;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2s: string[];
  wordCount: number;
  hasSchema: boolean;
  schemaTypes: string[];
}

async function fetchPage(url: string): Promise<{ html: string; status: number }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TCABot/1.0; +https://tallchairadvisor.com)' },
      signal: AbortSignal.timeout(15000),
    });
    return { html: await res.text(), status: res.status };
  } catch {
    return { html: '', status: 0 };
  }
}

function extract(html: string): Omit<CompetitorPage, 'name' | 'url' | 'topic' | 'fetchedAt' | 'status'> {
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ?? null;
  const metaDescription = html.match(/<meta\s+name=["']description["']\s+content="(.*?)"/i)?.[1] ?? null;
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null;
  const h2matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  const h2s = h2matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).slice(0, 8);
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const wordCount = textContent.trim().split(' ').filter(w => w.length > 2).length;
  const hasSchema = html.includes('application/ld+json');
  const schemaTypes: string[] = [];
  const schemaMatches = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)];
  for (const m of schemaMatches) schemaTypes.push(m[1]);

  return { title, metaDescription, h1, h2s, wordCount, hasSchema, schemaTypes: [...new Set(schemaTypes)] };
}

async function main() {
  const config = JSON.parse(readFileSync(resolve(ROOT, 'data/competitors/config.json'), 'utf-8'));
  const results: CompetitorPage[] = [];

  for (const comp of config.competitors) {
    console.log(`Fetching: ${comp.name} — ${comp.url}`);
    const { html, status } = await fetchPage(comp.url);
    const extracted = html ? extract(html) : {
      title: null, metaDescription: null, h1: null, h2s: [], wordCount: 0, hasSchema: false, schemaTypes: [],
    };
    results.push({ name: comp.name, url: comp.url, topic: comp.topic, fetchedAt: new Date().toISOString(), status, ...extracted });
    await new Promise(r => setTimeout(r, 2000)); // polite delay
  }

  // Ask Claude for strategic analysis
  const gscData = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));
  const topPages = gscData.pages.slice(0, 10);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are an SEO strategist for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people (6'+).

Analyze these competitor pages vs our GSC performance and identify the top 3 content/SEO gaps we should close this week.

OUR TOP PAGES (GSC):
${JSON.stringify(topPages, null, 2)}

COMPETITOR PAGES:
${results.map(r => `
${r.name} (${r.url}):
- Title: ${r.title}
- Meta: ${r.metaDescription}
- H1: ${r.h1}
- H2s: ${r.h2s.join(' | ')}
- Word count: ~${r.wordCount}
- Schema types: ${r.schemaTypes.join(', ')}
`).join('\n')}

Output a brief JSON with:
{
  "gaps": [
    { "gap": "...", "priority": "high|medium", "recommendation": "..." }
  ],
  "summary": "2-3 sentence strategic summary"
}`,
    }],
  });

  let analysis = { gaps: [], summary: 'Analysis unavailable.' };
  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
  } catch { /* use defaults */ }

  const output = {
    pulledAt: new Date().toISOString(),
    competitors: results,
    analysis,
  };

  mkdirSync(resolve(ROOT, 'data/competitors'), { recursive: true });
  writeFileSync(resolve(ROOT, 'data/competitors/latest.json'), JSON.stringify(output, null, 2));

  // Archive to wiki raw layer
  archiveJsonToRaw(ROOT, 'competitors', `competitors-${today()}.json`, output);

  // Update wiki competitor-landscape page with new gaps
  const existingPage = readWikiPage(ROOT, 'pages/concepts/competitor-landscape.md');
  if (existingPage && analysis.gaps?.length > 0) {
    const gapLines = analysis.gaps.map((g: any) => `| ${today()} | ${g.gap} | ${g.priority} | ${g.recommendation} |`).join('\n');
    const updatedPage = existingPage.replace(
      /last_updated: .*/,
      `last_updated: ${today()}`
    );
    // Append new gaps to the page if there's a gap tracking section, otherwise add one
    if (updatedPage.includes('## Recent Competitor Gaps')) {
      writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md',
        updatedPage.replace('## Recent Competitor Gaps', `## Recent Competitor Gaps\n\n| Date | Gap | Priority | Recommendation |\n|------|-----|----------|----------------|\n${gapLines}\n`)
      );
    } else {
      writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md',
        updatedPage + `\n\n## Recent Competitor Gaps\n\n| Date | Gap | Priority | Recommendation |\n|------|-----|----------|----------------|\n${gapLines}\n`
      );
    }
  }

  appendWikiLog(ROOT, `## [${today()}] competitor-monitor | Competitor Scan\n\n- Monitored: ${results.length} pages\n- Gaps found: ${analysis.gaps?.length || 0}\n- Summary: ${analysis.summary}\n`);

  console.log(`\nDone. Monitored ${results.length} competitor pages.`);
  console.log('Analysis:', analysis.summary);
}

main().catch(err => { console.error(err.message); process.exit(1); });
