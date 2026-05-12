/**
 * strategy.ts — Wednesday agent
 * Reads audit + GSC + competitors, writes reports/weekly-plan.md
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
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

// 14-day cooldown set — stricter than the 21-day prompt window used for display
function getPagesOnCooldown(): Set<string> {
  try {
    const since = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    const output = execSync(
      `git log --since="${since}" --name-only --pretty=format: -- src/pages/`,
      { cwd: ROOT }
    ).toString();
    return new Set(output.split('\n').filter(f => f.endsWith('.astro')));
  } catch { return new Set(); }
}

function getExistingPages(root: string): { filePath: string; slug: string }[] {
  const pagesDir = resolve(root, 'src/pages');
  const results: { filePath: string; slug: string }[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.astro')) {
        const rel = full.slice(pagesDir.length + 1); // e.g. "review/gesture.astro"
        const filePath = `src/pages/${rel}`;
        // Derive URL slug: strip .astro, strip index, prefix /
        const slug = '/' + rel
          .replace(/\.astro$/, '')
          .replace(/\/index$/, '')
          .replace(/^index$/, '') + '/';
        results.push({ filePath, slug });
      }
    }
  }

  walk(pagesDir);
  return results.filter(p => !['404', 'affiliate-disclosure', 'privacy-policy', 'contact', 'about'].some(x => p.slug.includes(x)));
}

// ─── Post-Generation Plan Enforcement ────────────────────────────────────────
// Drops tasks that violate hard constraints BEFORE saving the plan.
// Strategy: drop bad tasks and keep valid ones — only hard-fail if zero valid tasks remain.

const TECHNICAL_KEYWORDS = [
  'schema', 'canonical', 'noindex', '404', 'broken link', 'voice violation',
  'affiliate tag', 'redirect', 'json-ld', 'structured data', 'parse error',
];
function isTechnicalFix(line: string): boolean {
  const l = line.toLowerCase();
  return TECHNICAL_KEYWORDS.some(kw => l.includes(kw));
}

// Tasks with conditional language require human judgment and are unsafe for autonomous execution
const CONDITIONAL_PATTERNS = [
  /verify before executing/i,
  /only if .{0,60}(cooldown|edited|still on)/i,
  /if (the )?page is still/i,
  /check (first|before executing)/i,
  /\(caveat[:)]/i,
];
function hasConditionalLanguage(line: string): boolean {
  return CONDITIONAL_PATTERNS.some(p => p.test(line));
}

function lookupImpressions(slug: string, gscAnalysis: any, gscLatest: any): number | null {
  if (gscAnalysis) {
    const opp = (gscAnalysis.opportunities ?? []).find((o: any) => o.page === slug);
    if (opp?.impressions != null) return opp.impressions;
    const leak = (gscAnalysis.ctrLeaks ?? []).find((l: any) => l.page === slug);
    if (leak?.impressions != null) return leak.impressions;
  }
  const row = (gscLatest.pages ?? []).find((p: any) => p.page === slug);
  return row?.impressions ?? null;
}

function enforcePlanConstraints(
  planText: string,
  pagesOnCooldown: Set<string>,
  existingFilePathSet: Set<string>,
  fileToSlug: Map<string, string>,
  gscAnalysis: any,
  gscLatest: any,
): { plan: string; dropped: string[] } {
  const lines = planText.split('\n');
  const dropped: string[] = [];

  // First pass: collect FIX file paths to detect FIX+REWRITE overlap
  const fixFilePaths = new Set<string>();
  for (const line of lines) {
    if (!/^\s*-\s*\[\s*\]\s*FIX:/.test(line)) continue;
    const m = line.match(/FILE:\s*(src\/pages\/\S+\.astro)/);
    if (m) fixFilePaths.add(m[1]);
  }

  const result: string[] = [];
  let fixCount = 0;

  for (const line of lines) {
    const taskMatch = line.match(/^\s*-\s*\[\s*\]\s*(FIX|REWRITE|NEW):/);
    if (!taskMatch) { result.push(line); continue; }
    const type = taskMatch[1] as 'FIX' | 'REWRITE' | 'NEW';

    // NEW content: no file-existence or cooldown constraint
    if (type === 'NEW') { result.push(line); continue; }

    const fileMatch = line.match(/FILE:\s*(src\/pages\/\S+\.astro)/);
    if (!fileMatch) {
      dropped.push(`[no FILE ref] ${line.trim().slice(0, 100)}`);
      continue;
    }
    const filePath = fileMatch[1];

    // File must exist on disk — hard drop (was warn-only before)
    if (!existingFilePathSet.has(filePath)) {
      dropped.push(`[bad FILE ref: ${filePath}] ${line.trim().slice(0, 80)}`);
      continue;
    }

    // Conditional language makes a task unsafe for autonomous execution
    if (hasConditionalLanguage(line)) {
      dropped.push(`[conditional language] ${line.trim().slice(0, 100)}`);
      continue;
    }

    // REWRITE loses when a FIX covers the same file (would create conflicting edits)
    if (type === 'REWRITE' && fixFilePaths.has(filePath)) {
      dropped.push(`[FIX+REWRITE overlap — REWRITE dropped] ${line.trim().slice(0, 80)}`);
      continue;
    }

    const technical = isTechnicalFix(line);

    // Cooldown: 14-day window, technical fixes exempt
    if (pagesOnCooldown.has(filePath) && !technical) {
      dropped.push(`[cooldown: ${filePath} edited within 14d] ${line.trim().slice(0, 80)}`);
      continue;
    }

    // Impression threshold: non-technical FIX tasks need 300+ impressions
    if (type === 'FIX' && !technical) {
      const slug = fileToSlug.get(filePath);
      if (slug) {
        const impr = lookupImpressions(slug, gscAnalysis, gscLatest);
        if (impr !== null && impr < 300) {
          dropped.push(`[impressions ${impr} < 300 for non-technical FIX] ${line.trim().slice(0, 80)}`);
          continue;
        }
      }
    }

    // Hard cap: max 5 FIX tasks
    if (type === 'FIX') {
      if (fixCount >= 5) {
        dropped.push(`[FIX cap: max 5 reached] ${line.trim().slice(0, 80)}`);
        continue;
      }
      fixCount++;
    }

    result.push(line);
  }

  return { plan: result.join('\n'), dropped };
}

async function main() {
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));
  const analysisPath = resolve(ROOT, 'data/gsc/analysis.json');
  const gscAnalysis = existsSync(analysisPath) ? JSON.parse(readFileSync(analysisPath, 'utf-8')) : null;
  const auditReport = readIfExists(resolve(ROOT, 'reports/audit-report.md'));
  const prevPlan = readIfExists(resolve(ROOT, 'reports/weekly-plan.md'), 'No previous plan.');

  // Prefer v2 intelligence.json (page-specific, query-grounded gaps) over old latest.json
  const intelligencePath = resolve(ROOT, 'data/competitors/intelligence.json');
  const legacyPath = resolve(ROOT, 'data/competitors/latest.json');
  let competitorSummary = 'Not available.';
  let competitorGapLines = '';
  let aioSuppressionLines = '';
  if (existsSync(intelligencePath)) {
    const intel = JSON.parse(readFileSync(intelligencePath, 'utf-8'));
    competitorSummary = intel.summary ?? '';
    // Format per-page gaps with attribution so strategy can target specific pages
    const pageGapSections = (intel.pages ?? []).map((p: any) => {
      const allGaps: any[] = p.synthesizedGaps ?? [];
      const gaps = allGaps.filter((g: any) => g.trusted !== false); // trusted findings only
      const coveragePct = p.tcaCoverage != null ? `${Math.round(p.tcaCoverage * 100)}% coverage` : '';
      if (gaps.length === 0) {
        const budgetMiss = (p.queryAnalyses ?? []).some((qa: any) => qa.gateStatus === 'skipped-crawl-budget');
        return `${p.tcaPage} [${p.pageRole}]${coveragePct ? ` (${coveragePct})` : ''}: no trusted gaps found${budgetMiss ? ' (crawl budget exhausted)' : ''}`;
      }
      const gapLines = gaps.map((g: any) =>
        `  - [${g.priority}] ${g.gap} | ${g.recommendation} | competitor: ${g.competitor ?? 'unknown'} | ${g.appearsInQueries}q`
      ).join('\n');
      return `${p.tcaPage} [${p.pageRole}]${coveragePct ? ` (${coveragePct})` : ''}:\n${gapLines}`;
    }).join('\n\n');
    competitorGapLines = pageGapSections;

    // Format AIO suppression data for strategic reasoning
    const aioTasks: any[] = (intel.aioTasks ?? []).filter((t: any) => t.citationCapsule !== null);
    const aioPending: any[] = (intel.aioTasks ?? []).filter((t: any) => t.status === 'pending-passage-text');
    const aioRejected: any[] = intel.aioTasksRejected ?? [];
    if (aioTasks.length > 0 || aioPending.length > 0) {
      const taskLines = aioTasks.map((t: any) => {
        const applied = t.status === 'applied' ? ' [CAPSULE ALREADY APPLIED]' : '';
        const passage = t.aioPassage ? `\n    AIO passage: "${t.aioPassage.slice(0, 200)}"` : '';
        const cited = t.aioCitedUrls.length > 0 ? `\n    Cited by AIO: ${t.aioCitedUrls.slice(0, 3).join(', ')}` : '';
        const capsule = t.citationCapsule ? `\n    Capsule inserted: "${t.citationCapsule}"` : '';
        return `  ${t.page} | query: "${t.query}" | format: ${t.aioFormat}${applied}${passage}${cited}${capsule}`;
      }).join('\n\n');
      const pendingNote = aioPending.length > 0
        ? `\n${aioPending.length} page(s) have AIO suppression detected but passage text unavailable — capsule generation pending next run: ${aioPending.map((t: any) => t.page).join(', ')}`
        : '';
      const rejectedNote = aioRejected.length > 0
        ? `\n${aioRejected.length} capsule(s) rejected at spec validation: ${aioRejected.map((t: any) => `${t.page} (${t.rejectionReason})`).join(', ')}`
        : '';
      aioSuppressionLines = `${taskLines}${pendingNote}${rejectedNote}`;
    }
  } else if (existsSync(legacyPath)) {
    const legacy = JSON.parse(readFileSync(legacyPath, 'utf-8'));
    competitorSummary = legacy.analysis?.summary ?? '';
    competitorGapLines = (legacy.analysis?.gaps ?? []).map((g: any) => `- [${g.priority}] ${g.gap}: ${g.recommendation}`).join('\n');
  }

  // Read compiled wiki knowledge for historical context
  const wikiIndex = readWikiIndex(ROOT) || '';
  const synthesisContext = readSynthesisContext(ROOT);
  const conceptContext = readConceptContext(ROOT, [
    'ctr-optimization', 'content-gaps', 'internal-linking', 'ai-citation-readiness', 'indexing-health', 'gsc-intelligence',
  ]);
  const decisionsLog = readWikiPage(ROOT, 'synthesis/decisions-log.md') || '';
  const thesis = readWikiPage(ROOT, 'synthesis/thesis.md') || '';

  const recentlyEdited = getRecentlyEditedPages();
  const pagesOnCooldown = getPagesOnCooldown();
  const existingPages = getExistingPages(ROOT);
  const existingFilePaths = existingPages.map(p => `  ${p.filePath}`).join('\n');
  const existingSlugs = new Set(existingPages.map(p => p.slug));
  const existingFilePathSet = new Set(existingPages.map(p => p.filePath));
  const fileToSlug = new Map(existingPages.map(p => [p.filePath, p.slug]));

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

COMPETITOR GAPS (v2 intelligence — attributed per TCA page, SERP-grounded; use the page path to assign each gap to its exact FIX or REWRITE target):
${competitorSummary}

${competitorGapLines || '(none)'}

AIO SUPPRESSION — GOOGLE AI OVERVIEW DATA (TCA not cited; capsules may already be applied to pages):
Context: When Google shows an AI Overview for a query and TCA is not cited, clicks go to zero regardless of ranking position. This is the primary CTR suppressor on this site. The passage text below is what Google is actually surfacing. Use this to reason about whether the page needs structural changes beyond the capsule already inserted — answer-first reformat, FAQ schema aligned to the AIO question, or a new section that directly addresses the AIO topic.
${aioSuppressionLines || '(none — no AIO suppression detected this cycle)'}

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

EXISTING PAGES — authoritative file list (execution agents can only edit these files):
${existingFilePaths}

Output a structured weekly plan in this EXACT format so the execution agents can parse it:

# Weekly Plan — [DATE]

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->
- [ ] FIX: [page path] | [what to change] | [why] | FILE: src/pages/[path].astro
- [ ] FIX: ...

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. If a slug is already live, put it in REWRITES instead. The slug field is REQUIRED — Friday agent will silently skip entries without it. -->
<!-- Format MUST be exactly 4 pipe-separated fields: title | keyword | slug | description -->
- [ ] NEW: [page title] | [target keyword] | /slug-here/ | [brief description of content angle]

## REWRITES (Thursday agent, lower priority)
<!-- For significant content overhaul of existing pages AND for adding new sections to existing pages. -->
<!-- Format MUST be exactly 4 pipe-separated fields matching the FIX format — the parser requires this -->
<!-- CRITICAL: Do NOT emit a REWRITE for a page that already has a FIX in this plan. Combine into the FIX if needed. -->
<!-- CRITICAL: FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->
- [ ] REWRITE: [page path] | [what to add/improve] | [why — what signal justifies this] | FILE: src/pages/[path].astro

## STRATEGY NOTES
[2-3 sentences on the week's focus and why]`,
    }],
  });

  const plan = response.content[0].type === 'text' ? response.content[0].text : '# Plan generation failed.';
  const todayStr = new Date().toISOString().split('T')[0];
  // Replace both the literal [DATE] placeholder and any model-generated date in the header line
  const output = plan
    .replace('[DATE]', todayStr)
    .replace(/^(#\s*Weekly Plan\s*[—–-]\s*)\d{4}-\d{2}-\d{2}/m, `$1${todayStr}`);

  // ── Duplicate NEW slug check (hard error — execution agent can't resolve this) ──
  const newSlugWarnings: string[] = [];
  for (const line of output.split('\n')) {
    const newMatch = line.match(/\] NEW:.*\|\s*(\/[^\|]+\/)/);
    if (newMatch) {
      const slug = newMatch[1].trim();
      if (existingSlugs.has(slug)) {
        newSlugWarnings.push(`  DUPLICATE SLUG: "${slug}" — page already exists, move to REWRITE`);
      }
    }
  }
  if (newSlugWarnings.length > 0) {
    const msg = '\nERROR — plan marks existing pages as NEW:\n' + newSlugWarnings.join('\n');
    mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
    writeFileSync(resolve(ROOT, 'reports/plan-debug-duplicate-slugs.md'), output);
    throw new Error(msg.trim());
  }

  // ── Post-generation enforcement: drop tasks that violate hard constraints ──
  const { plan: enforced, dropped } = enforcePlanConstraints(
    output, pagesOnCooldown, existingFilePathSet, fileToSlug, gscAnalysis, gsc,
  );

  // Append enforcement log to plan so it's visible in the archive
  const finalPlan = dropped.length > 0
    ? enforced + `\n\n## DROPPED TASKS (enforcement log — not for execution)\n\n${dropped.map(d => `- ${d}`).join('\n')}\n`
    : enforced;

  // Count valid tasks in the enforced plan
  function countParsedItems(planText: string, type: 'FIX' | 'REWRITE' | 'NEW'): number {
    const keyword = type === 'NEW' ? 'NEW:' : `${type}:`;
    return planText.split('\n')
      .filter(l => l.includes(`] ${keyword}`) && (l.match(/\|/g) || []).length >= 3)
      .length;
  }
  const fixCount = countParsedItems(finalPlan, 'FIX');
  const rewriteCount = countParsedItems(finalPlan, 'REWRITE');
  const newCount = countParsedItems(finalPlan, 'NEW');
  const hasSections = finalPlan.includes('## FIXES') || finalPlan.includes('## NEW CONTENT');

  if (hasSections && fixCount + rewriteCount + newCount === 0) {
    mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
    writeFileSync(resolve(ROOT, 'reports/plan-debug-malformed.md'), finalPlan);
    appendWikiLog(ROOT, `## [${today()}] strategy | MALFORMED PLAN — NOT SAVED\n\n- Zero valid tasks after enforcement (${dropped.length} dropped)\n- Debug output written to reports/plan-debug-malformed.md\n`);
    throw new Error(`Plan enforcement: zero valid tasks remain after dropping ${dropped.length} constraint violations. Debug written to reports/plan-debug-malformed.md`);
  }

  if (dropped.length > 0) {
    console.warn(`\nEnforcement: dropped ${dropped.length} task(s):`);
    dropped.forEach(d => console.warn(`  ${d}`));
  }
  console.log(`\nPlan validation: ${fixCount} fixes, ${rewriteCount} rewrites, ${newCount} new pages`);

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/weekly-plan.md'), finalPlan);

  // Archive plan to raw layer
  archiveToRaw(ROOT, 'strategy', `${today()}-weekly-plan.md`, finalPlan);

  appendWikiLog(ROOT, `## [${today()}] strategy | Weekly Plan Generated\n\n- Plan archived to raw/strategy/${today()}-weekly-plan.md\n- ${fixCount} fixes, ${rewriteCount} rewrites, ${newCount} new pages${dropped.length > 0 ? ` (${dropped.length} tasks dropped by enforcement)` : ''}\n- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation\n`);

  console.log('\nStrategy complete → reports/weekly-plan.md');
  console.log(finalPlan.slice(0, 500));
}

main().catch(err => { console.error(err.message); process.exit(1); });
