/**
 * strategy.ts — Wednesday agent
 * Reads audit + GSC + competitors, writes reports/weekly-plan.md
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
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

function getRecentlyEditedPages(): string[] {
  try {
    const since = new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0];
    const output = execSync(
      `git log --since="${since}" --name-only --pretty=format: -- src/pages/`,
      { cwd: ROOT }
    ).toString();
    return [...new Set(output.split('\n').filter(f => f.endsWith('.astro')))];
  } catch { return []; }
}

async function main() {
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));
  const analysisPath = resolve(ROOT, 'data/gsc/analysis.json');
  const gscAnalysis = existsSync(analysisPath) ? JSON.parse(readFileSync(analysisPath, 'utf-8')) : null;
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
    'ctr-optimization', 'content-gaps', 'internal-linking', 'ai-citation-readiness', 'indexing-health', 'gsc-intelligence',
  ]);
  const decisionsLog = readWikiPage(ROOT, 'synthesis/decisions-log.md') || '';
  const thesis = readWikiPage(ROOT, 'synthesis/thesis.md') || '';

  const recentlyEdited = getRecentlyEditedPages();

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

GSC INTELLIGENCE (pre-computed, ranked by ROI — use this to drive all action decisions):

SITE TOTALS: ${gsc.totals.clicks} clicks | ${gsc.totals.impressions} impr | ${gsc.totals.ctr}% CTR | pos ${gsc.totals.avgPosition}

${gscAnalysis ? `MOMENTUM: ${gscAnalysis.executiveSummary.weeklyMomentum}

TOP OPPORTUNITIES (by opportunity score):
${gscAnalysis.opportunities.filter((o: any) => o.opportunityType !== 'low-signal').slice(0, 4).map((o: any) =>
  `- [${o.opportunityType}] ${o.page} | score ${o.opportunityScore} | ${o.recommendation}`
).join('\n')}

CTR LEAKS (query-level — invisible in page-aggregate view):
${gscAnalysis.ctrLeaks.slice(0, 6).map((l: any) =>
  `- ${l.page} | "${l.query}" | ${l.impressions} impr, pos ${l.position} | ${l.actualCTR}% CTR (expected ${l.expectedCTR}%) | ~${l.lostClicksPerWeek} clicks/wk lost${l.aioSuspect ? ' | ⚠ AIO SUSPECT' : ''}`
).join('\n')}

AFFILIATE CAPTURE GAPS:
${gscAnalysis.affiliateOpportunities.filter((a: any) => a.affiliateUrgency !== 'low').slice(0, 3).map((a: any) =>
  `- [${a.affiliateUrgency}] ${a.page}: ${a.buyerIntentImpressions} buyer-intent impr | top queries: ${a.topBuyerQueries.slice(0, 2).join(', ')}`
).join('\n') || '- None above threshold this week'}

CANNIBALIZATION RISKS:
${gscAnalysis.cannibalization.slice(0, 3).map((c: any) =>
  `- "${c.query}" [${c.risk}]: ranking from ${c.pages.join(' and ')} simultaneously`
).join('\n') || '- None detected'}

DEVICE SPLIT: ${gscAnalysis.deviceIntelligence?.summaryLine ?? 'Device data not yet available'}` : `(analysis.json not yet available — running without query-level intelligence)
Top pages: ${gsc.pages.slice(0, 5).map((p: any) => `${p.page} (${p.impressions} impr, pos ${p.position}, ${p.clicks} clicks)`).join(', ')}`}

AUDIT REPORT:
${auditReport.slice(0, 3000)}

COMPETITOR GAPS:
${competitors.analysis.summary}
${competitors.analysis.gaps?.map((g: any) => `- [${g.priority}] ${g.gap}: ${g.recommendation}`).join('\n') || ''}

PREVIOUS PLAN (for continuity):
${prevPlan.slice(0, 500)}

EDIT CADENCE RULES — CRITICAL:
- Do NOT schedule FIXES or REWRITES for pages edited in the last 14 days UNLESS the issue is technical (broken schema, bad canonical, 404 link, noindex error, voice violation, affiliate tag).
- New content pages can be published freely every week.
- IMPRESSION THRESHOLDS FOR ACTION:
  - <100 impressions: noise — do not optimize, let it index
  - 100–300 impressions: weak signal — only fix technical issues
  - 300+ impressions: actionable signal — CTR/meta changes are worth trying
  - 400+ impressions at pos ≤10 with 0 clicks: CRITICAL — fix regardless of cooldown

RECENTLY EDITED PAGES (do not re-edit unless technical fix):
${recentlyEdited.length > 0 ? recentlyEdited.map(f => `- ${f}`).join('\n') : '(none in last 21 days)'}

Output a structured weekly plan in this EXACT format so the execution agents can parse it:

# Weekly Plan — [DATE]

## FIXES (Thursday agent)
<!-- Max 5 fixes. Each fix must specify the exact file path and what to change. -->
- [ ] FIX: [page path] | [what to change] | [why] | FILE: src/pages/[path].astro
- [ ] FIX: ...

## NEW CONTENT (Friday agent)
<!-- ONLY for brand-new .astro pages that do not yet exist. Content additions to existing pages go in REWRITES below. The slug field is REQUIRED — Friday agent will silently skip entries without it. -->
<!-- Format MUST be exactly 4 pipe-separated fields: title | keyword | slug | description -->
- [ ] NEW: [page title] | [target keyword] | /slug-here/ | [brief description of content angle]

## REWRITES (Thursday agent, lower priority)
<!-- For significant content overhaul of existing pages AND for adding new sections to existing pages. -->
<!-- Format MUST be exactly 4 pipe-separated fields matching the FIX format — the parser requires this -->
- [ ] REWRITE: [page path] | [what to add/improve] | [why — what signal justifies this] | FILE: src/pages/[path].astro

## STRATEGY NOTES
[2-3 sentences on the week's focus and why]`,
    }],
  });

  const plan = response.content[0].type === 'text' ? response.content[0].text : '# Plan generation failed.';
  const output = plan.replace('[DATE]', new Date().toISOString().split('T')[0]);

  // Validate plan has parseable tasks — warn if sections exist but no valid rows found
  function countParsedItems(planText: string, type: 'FIX' | 'REWRITE' | 'NEW'): number {
    const keyword = type === 'NEW' ? 'NEW:' : `${type}:`;
    return planText.split('\n')
      .filter(l => l.includes(`] ${keyword}`) && (l.match(/\|/g) || []).length >= 3)
      .length;
  }
  const fixCount = countParsedItems(output, 'FIX');
  const rewriteCount = countParsedItems(output, 'REWRITE');
  const newCount = countParsedItems(output, 'NEW');
  const hasSections = output.includes('## FIXES') || output.includes('## NEW CONTENT');
  if (hasSections && fixCount + rewriteCount + newCount === 0) {
    console.warn(`\nWARNING: Plan has section headers but zero parseable tasks (FIX: ${fixCount}, REWRITE: ${rewriteCount}, NEW: ${newCount})`);
    console.warn('This may be a format error. Review the plan output:');
    console.warn(output.slice(0, 1000));
  } else {
    console.log(`\nPlan validation: ${fixCount} fixes, ${rewriteCount} rewrites, ${newCount} new pages`);
  }

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/weekly-plan.md'), output);

  // Archive plan to raw layer
  archiveToRaw(ROOT, 'strategy', `${today()}-weekly-plan.md`, output);

  appendWikiLog(ROOT, `## [${today()}] strategy | Weekly Plan Generated\n\n- Plan archived to raw/strategy/${today()}-weekly-plan.md\n- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation\n`);

  console.log('\nStrategy complete → reports/weekly-plan.md');
  console.log(output.slice(0, 500));
}

main().catch(err => { console.error(err.message); process.exit(1); });
