/**
 * strategy.ts — Wednesday agent
 * Reads audit + GSC + competitors, writes reports/weekly-plan.md
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readWikiIndex, readSynthesisContext, readConceptContext, readWikiPage, archiveToRaw, appendWikiLog, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function readIfExists(path: string, fallback = 'Not available.'): string {
  return existsSync(path) ? readFileSync(path, 'utf-8') : fallback;
}

async function main() {
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));
  const auditReport = readIfExists(resolve(ROOT, 'reports/audit-report.md'));
  const competitorData = readIfExists(resolve(ROOT, 'data/competitors/latest.json'));
  const prevPlan = readIfExists(resolve(ROOT, 'reports/weekly-plan.md'), 'No previous plan.');

  const competitors = competitorData !== 'Not available.'
    ? JSON.parse(competitorData)
    : { analysis: { gaps: [], summary: '' } };

  // Read compiled wiki knowledge for historical context
  const wikiIndex = readWikiIndex(ROOT) || '';
  const synthesisContext = readSynthesisContext(ROOT);
  const conceptContext = readConceptContext(ROOT, [
    'ctr-optimization', 'content-gaps', 'internal-linking', 'ai-citation-readiness',
  ]);
  const decisionsLog = readWikiPage(ROOT, 'synthesis/decisions-log.md') || '';
  const thesis = readWikiPage(ROOT, 'synthesis/thesis.md') || '';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are the SEO strategy agent for tallchairadvisor.com.
Site: niche affiliate, ergonomic chairs for tall people (6'+).
Author: Jackson Christopher, 6'4", ME senior at UC Berkeley.
CRITICAL RULES:
- Jackson ONLY personally tested the Steelcase Gesture. All other chairs = research voice only.
- Never write "I tested", "in my experience", "after sitting in" for non-Gesture chairs.
- All Amazon links must include tag=tallchairadvi-20.
- Before publishing any new blog post, it must score 80+ on /blog-analyze criteria.
- New content should target AI Overview citations (answer-first, structured, citable).
Content pillars: Chair Reviews, Height-Specific Guides, Ergonomics & Pain, Comparisons, Workstation Setup.`,
    messages: [{
      role: 'user',
      content: `Create this week's execution plan based on all available data.

IMPORTANT: The wiki contains compiled historical knowledge. Use it to avoid repeating failed fixes and to build on what's working. Do NOT re-suggest fixes that are already in the decisions log unless there's new evidence they should be retried.

WIKI — STRATEGIC THESIS:
${thesis.slice(0, 1500)}

WIKI — WHAT WORKS (proven patterns):
${(readWikiPage(ROOT, 'synthesis/what-works.md') || '').slice(0, 1500)}

WIKI — WHAT FAILED (don't repeat):
${(readWikiPage(ROOT, 'synthesis/what-failed.md') || '').slice(0, 1500)}

WIKI — RECENT DECISIONS:
${decisionsLog.slice(0, 1000)}

WIKI — OPEN ISSUES (CTR, content gaps, internal linking):
${conceptContext.slice(0, 2000)}

GSC SUMMARY:
- Clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions} | Avg pos: ${gsc.totals.avgPosition}
- Top impression pages: ${gsc.pages.slice(0, 5).map((p: any) => `${p.page} (${p.impressions} impr, pos ${p.position}, ${p.clicks} clicks)`).join(', ')}

AUDIT REPORT:
${auditReport.slice(0, 3000)}

COMPETITOR GAPS:
${competitors.analysis.summary}
${competitors.analysis.gaps?.map((g: any) => `- [${g.priority}] ${g.gap}: ${g.recommendation}`).join('\n') || ''}

PREVIOUS PLAN (for continuity):
${prevPlan.slice(0, 500)}

Output a structured weekly plan in this EXACT format so the execution agents can parse it:

# Weekly Plan — [DATE]

## FIXES (Thursday agent)
<!-- Max 5 fixes. Each fix must specify the exact file path and what to change. -->
- [ ] FIX: [page path] | [what to change] | [why] | FILE: src/pages/[path].astro
- [ ] FIX: ...

## NEW CONTENT (Friday agent)
<!-- Only include if there's a clear content gap worth a new page. Leave empty if no new pages needed. -->
- [ ] NEW: [page title] | [target keyword] | [slug] | [brief description of content angle]

## REWRITES (Thursday agent, lower priority)
<!-- Pages that need significant content overhaul, not just meta tweaks -->
- [ ] REWRITE: [page path] | [what to improve] | FILE: src/pages/[path].astro

## STRATEGY NOTES
[2-3 sentences on the week's focus and why]`,
    }],
  });

  const plan = response.content[0].type === 'text' ? response.content[0].text : '# Plan generation failed.';
  const output = plan.replace('[DATE]', new Date().toISOString().split('T')[0]);

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/weekly-plan.md'), output);

  // Archive plan to raw layer
  archiveToRaw(ROOT, 'strategy', `${today()}-weekly-plan.md`, output);

  appendWikiLog(ROOT, `## [${today()}] strategy | Weekly Plan Generated\n\n- Plan archived to raw/strategy/${today()}-weekly-plan.md\n- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation\n`);

  console.log('\nStrategy complete → reports/weekly-plan.md');
  console.log(output.slice(0, 500));
}

main().catch(err => { console.error(err.message); process.exit(1); });
