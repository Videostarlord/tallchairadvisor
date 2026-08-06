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
import { readWikiIndex, readSynthesisContext, assertPromptBudget, readConceptContext, readWikiPage, archiveToRaw, appendWikiLog, logCacheUsage, today, loadRecentOutcomes, formatOutcomesForPrompt, withRetry } from './wiki-utils.js';
import { loadRedirectMap, isRedirectSource, resolveRedirect, withTrailingSlash } from '../redirect-map.js';
import { renderDigest, type AuditFindingsFile } from '../audit-findings.js';

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

function injectMandatoryRoadmapItems(
  planText: string,
  roadmapTopics: Array<{ title: string; keyword: string; slug: string; status: string; priority: number; notes: string }>,
  existingSlugs: Set<string>,
  failedSlugs: Set<string>,
  redirectMap: Map<string, string>,
): { plan: string; injected: string[] } {
  const injected: string[] = [];
  let plan = planText;

  const pendingTopics = roadmapTopics
    .filter(t => (t.status === 'pending' || t.status === 'in-progress')
      && !existingSlugs.has(t.slug)
      && !failedSlugs.has(t.slug)
      // A roadmap topic can also name a redirected slug — this injection path
      // bypasses enforcePlanConstraints, so it needs the same guard.
      && !isRedirectSource(redirectMap, t.slug))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2);

  for (const topic of pendingTopics) {
    if (plan.includes(topic.slug)) continue;
    const newLine = `- [ ] NEW: ${topic.title} | ${topic.keyword} | ${topic.slug} | ${topic.notes}`;
    if (plan.includes('## STRATEGY NOTES')) {
      plan = plan.replace('## STRATEGY NOTES', `${newLine}\n\n## STRATEGY NOTES`);
    } else {
      plan = plan + `\n${newLine}`;
    }
    injected.push(topic.slug);
  }

  return { plan, injected };
}

function enforcePlanConstraints(
  planText: string,
  pagesOnCooldown: Set<string>,
  existingFilePathSet: Set<string>,
  fileToSlug: Map<string, string>,
  gscAnalysis: any,
  gscLatest: any,
  redirectMap: Map<string, string>,
  existingSlugs: Set<string>,
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

  // CONT-02: Decay-flagged pages bypass cooldown (but NOT impression threshold)
  const decayExemptFiles = new Set<string>(
    (gscAnalysis?.decayAlerts ?? []).map((a: any) => {
      // Convert slug to file path: /review/gesture/ → src/pages/review/gesture.astro
      const stripped = (a.page as string).replace(/^\/|\/$/g, '');
      if (stripped === '') return 'src/pages/index.astro';
      return `src/pages/${stripped}.astro`;
    })
  );

  const result: string[] = [];
  let fixCount = 0;

  for (const line of lines) {
    const taskMatch = line.match(/^\s*-\s*\[\s*\]\s*(FIX|REWRITE|NEW):/);
    if (!taskMatch) { result.push(line); continue; }
    const type = taskMatch[1] as 'FIX' | 'REWRITE' | 'NEW';

    // NEW content: no file-existence or cooldown constraint, BUT the target
    // slug must not already be spoken for. On 2026-08-05 the plan proposed a
    // NEW page at /best-office-chairs/ — a 301 redirect source since the
    // 2026-07-04 consolidation. Building it would have collided with the
    // redirect rule and recreated the cannibalization the merge fixed.
    if (type === 'NEW') {
      const slugMatch = line.match(/\|\s*(\/[a-z0-9/-]*\/)\s*\|/i);
      const slug = slugMatch ? withTrailingSlash(slugMatch[1]) : null;

      if (slug && isRedirectSource(redirectMap, slug)) {
        dropped.push(`NEW ${slug} — slug is a 301 redirect source (-> ${resolveRedirect(redirectMap, slug)}). Building a page here would collide with public/_redirects and undo a deliberate consolidation.`);
        continue;
      }
      if (slug && existingSlugs.has(slug)) {
        dropped.push(`NEW ${slug} — page already exists; route to REWRITE instead of duplicating.`);
        continue;
      }
      result.push(line);
      continue;
    }

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

    // Cooldown: 14-day window — exempt if technical fix OR decay-flagged page
    if (pagesOnCooldown.has(filePath) && !technical && !decayExemptFiles.has(filePath)) {
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
  // AGENT-02: Prevent overwrite on duplicate workflow dispatch
  const planPath = resolve(ROOT, 'reports/weekly-plan.md');
  if (existsSync(planPath)) {
    const content = readFileSync(planPath, 'utf-8');
    const todayStr = today();
    if (content.includes(todayStr)) {
      console.log(`[strategy] Weekly plan for ${todayStr} already exists — exiting to prevent overwrite.`);
      appendWikiLog(ROOT, `## [${todayStr}] strategy | SKIPPED\n\n- Reason: duplicate dispatch detected — plan already existed\n`);
      process.exit(0);
    }
  }

  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));
  const analysisPath = resolve(ROOT, 'data/gsc/analysis.json');
  const gscAnalysis = existsSync(analysisPath) ? JSON.parse(readFileSync(analysisPath, 'utf-8')) : null;

  const failedContentPath = resolve(ROOT, 'data/content-failed.json');
  const failedSlugs: Set<string> = new Set(
    existsSync(failedContentPath)
      ? Object.keys(JSON.parse(readFileSync(failedContentPath, 'utf-8')))
      : []
  );

  // CONT-01: Content roadmap — human-editable priority topic list
  const roadmapPath = resolve(ROOT, 'data/content-roadmap.json');
  const contentRoadmap: Array<{
    title: string; keyword: string; slug: string;
    priority: number; status: string; notes: string;
  }> = existsSync(roadmapPath)
    ? (JSON.parse(readFileSync(roadmapPath, 'utf-8')) as any[])
        .filter((t: any) => t.status === 'pending' || t.status === 'in-progress')
        .sort((a: any, b: any) => a.priority - b.priority)
    : [];
  const topRoadmapTopics = contentRoadmap.slice(0, 2);

  // CONT-02: Decay alerts — from analysis.json (added by gsc-analyze.ts in Phase 5 Plan 02)
  // Null-safe: gscAnalysis may be null if analysis.json predates this feature
  const decayAlerts: any[] = gscAnalysis?.decayAlerts ?? [];

  // CONT-03: Internal link gaps — from data/gsc/link-audit.json (generated by gsc-analyze.ts Mondays)
  const linkAuditPath = resolve(ROOT, 'data/gsc/link-audit.json');
  const linkAudit = existsSync(linkAuditPath)
    ? JSON.parse(readFileSync(linkAuditPath, 'utf-8'))
    : { gaps: [] };
  const linkGaps: any[] = linkAudit.gaps ?? [];

  // Clarity behavioral data — optional, only available if clarity-pull.ts ran this Monday
  const clarityPath = resolve(ROOT, 'data/clarity/latest.json');
  const clarityData = existsSync(clarityPath) ? JSON.parse(readFileSync(clarityPath, 'utf-8')) : null;

  const auditReport = readIfExists(resolve(ROOT, 'reports/audit-report.md'));

  // Audit findings as a compact digest, not truncated prose.
  //
  // This previously did `auditReport.slice(0, 3000)` on the rendered markdown.
  // Measured on a real 13,851-char report: the first critical finding sat at char
  // 2356 and reached the model, while H-1 (char 5600) and M-1 (char 11005) NEVER
  // DID — most of every audit was silently discarded before planning. One line per
  // finding fits ~25-30 findings in the same budget, and retracted findings are
  // already removed upstream by audit.ts.
  const auditFindingsPath = resolve(ROOT, 'data/audit-findings.json');
  const auditFindings: AuditFindingsFile | null = existsSync(auditFindingsPath)
    ? JSON.parse(readFileSync(auditFindingsPath, 'utf-8'))
    : null;
  const auditDigest = auditFindings
    ? `EXECUTIVE SUMMARY: ${auditFindings.executiveSummary}\n\nFINDINGS (${auditFindings.findings.length}, severity-ordered; retracted findings already removed):\n${renderDigest(auditFindings.findings, 3000)}`
    // Fallback for the first run before audit.ts has produced structured
    // findings. NOT truncated: this exact `.slice(0, 3000)` is the bug that
    // silently discarded every high and medium finding on a 13,851-char report,
    // and it stayed live for months because a shorter prompt still looks
    // plausible. The full report goes through; the budget assertion below
    // catches genuine overgrowth loudly.
    : auditReport;
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
    'ctr-optimization', 'statistical-confidence-policy', 'content-gaps', 'internal-linking', 'ai-citation-readiness', 'indexing-health', 'gsc-intelligence', 'semantic-intent-analysis',
  ]);
  const decisionsLog = readWikiPage(ROOT, 'synthesis/decisions-log.md') || '';
  const thesis = readWikiPage(ROOT, 'synthesis/thesis.md') || '';

  const recentlyEdited = getRecentlyEditedPages();
  const pagesOnCooldown = getPagesOnCooldown();
  const existingPages = getExistingPages(ROOT);
  const existingFilePaths = existingPages.map(p => `  ${p.filePath}`).join('\n');
  const existingSlugs = new Set(existingPages.map(p => p.slug));
  // Redirect sources are not available slugs — a NEW page at one would collide
  // with public/_redirects. See scripts/redirect-map.ts (2026-08-05 incident).
  const redirectMap = loadRedirectMap(ROOT);
  const existingFilePathSet = new Set(existingPages.map(p => p.filePath));
  const fileToSlug = new Map(existingPages.map(p => [p.filePath, p.slug]));

  const recentOutcomes = loadRecentOutcomes(ROOT).slice(-20);  // last 90 days, max 20 entries

  assertPromptBudget('strategy', `${thesis}${decisionsLog}${conceptContext}${auditDigest}`);

  const response = await withRetry(() => client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: `You are the SEO strategy agent for tallchairadvisor.com.
Site: niche affiliate, ergonomic chairs for tall people (6'+).
Author: Jackson Christopher, 6'4", ME senior at UC Berkeley.
CRITICAL RULES:
- Jackson ONLY personally tested the Steelcase Gesture. All other chairs = research voice only.
- Never write "I tested", "in my experience", "after sitting in" for non-Gesture chairs.
- All Amazon links must include tag=tallchairadvi-20.
- Before publishing any new blog post, it must score 80+ on /blog-analyze criteria.
- New content should target AI Overview citations (answer-first, structured, citable).
Content pillars: Chair Reviews, Height-Specific Guides, Ergonomics & Pain, Comparisons, Workstation Setup.

WIKI — STRATEGIC THESIS:
${thesis}

WIKI — WHAT WORKS (proven patterns):
${readWikiPage(ROOT, 'synthesis/what-works.md') || ''}

WIKI — WHAT FAILED (don't repeat):
${readWikiPage(ROOT, 'synthesis/what-failed.md') || ''}

INTERVENTION OUTCOMES (structured — use this instead of what-works.md for outcome reasoning):
${formatOutcomesForPrompt(recentOutcomes)}

READING GUIDE FOR OUTCOMES:
- confidence=high: 28+ days post-fix, >20% delta — treat as causal evidence
- confidence=medium: 28+ days, 5-20% delta — treat as preliminary signal
- confidence=low: <28 days or <5% delta — early signal only
- confidence=none: <14 days — do not draw conclusions
- Positive deltaPercent on CTR = improvement. Negative deltaPercent on position = improvement (lower is better).
- Positive deltaPercent on impressions = improvement.
- Rows with 'pending' delta have no afterMetric yet — note the fix date and wait for reconciliation.

WIKI — RECENT DECISIONS:
${decisionsLog}

WIKI — OPEN ISSUES (CTR, content gaps, internal linking):
${conceptContext}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{
      role: 'user',
      content: `Create this week's execution plan based on all available data.

IMPORTANT: The wiki contains compiled historical knowledge (loaded in the system prompt). Use it to avoid repeating failed fixes and to build on what's working. Do NOT re-suggest fixes that are already in the decisions log unless there's new evidence they should be retried.

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

DEVICE SPLIT: ${gscAnalysis.deviceIntelligence?.summaryLine ?? 'Device data not yet available'}

CONTENT GAPS VS COMPETITORS (TCA ranks 10-50, competitor ranks top-3):
${(gscAnalysis.contentGap ?? []).slice(0, 6).map((g: any) =>
  `- [${g.gapSeverity}] "${g.query}" — TCA: ${g.tcaPage} pos ${g.tcaPosition}, ${g.competitorDomain} pos ${g.competitorPosition} | ${g.impressions} impr`
).join('\n') || '- No content gaps detected this week'}` : `(analysis.json not yet available — running without query-level intelligence)
Top pages: ${gsc.pages.slice(0, 5).map((p: any) => `${p.page} (${p.impressions} impr, pos ${p.position}, ${p.clicks} clicks)`).join(', ')}`}

CLARITY BEHAVIORAL SIGNALS (last ${clarityData?.numOfDays ?? 0} days — rage clicks, dead clicks, scroll depth):
${clarityData ? (() => {
  const alerts = (clarityData.behavioralAlerts ?? []).slice(0, 8);
  const alertLines = alerts.length > 0
    ? alerts.map((a: any) => `- [${a.issue}] ${a.url}: ${a.note}`).join('\n')
    : '(no behavioral alerts above threshold)';
  const topPages = (clarityData.pages ?? []).slice(0, 8).map((p: any) =>
    `- ${p.url} | ${p.sessions ?? '?'} sessions | scroll ${p.scrollDepthAvg != null ? Math.round(p.scrollDepthAvg * 100) + '%' : '?'} | rage ${p.rageClicks ?? '?'} | dead ${p.deadClicks ?? '?'}`
  ).join('\n');
  const device = Object.entries(clarityData.deviceSplit ?? {}).map(([k, v]) => `${k}: ${Math.round((v as number) * 100)}%`).join(', ');
  return `Device split: ${device || 'n/a'}\n\nTop pages by sessions:\n${topPages}\n\nAlerts:\n${alertLines}`;
})() : '(clarity-pull.ts not yet run — add CLARITY_TOKEN secret to enable)'}

AUDIT REPORT:
${auditDigest}

COMPETITOR GAPS (v2 intelligence — attributed per TCA page, SERP-grounded; use the page path to assign each gap to its exact FIX or REWRITE target):
${competitorSummary}

${competitorGapLines || '(none)'}

AIO SUPPRESSION — GOOGLE AI OVERVIEW DATA (TCA not cited; capsules may already be applied to pages):
Context: When Google shows an AI Overview for a query and TCA is not cited, clicks go to zero regardless of ranking position. This is the primary CTR suppressor on this site. The passage text below is what Google is actually surfacing. Use this to reason about whether the page needs structural changes beyond the capsule already inserted — answer-first reformat, FAQ schema aligned to the AIO question, or a new section that directly addresses the AIO topic.
${aioSuppressionLines || '(none — no AIO suppression detected this cycle)'}

PREVIOUS PLAN (for continuity):
${prevPlan}

CONTENT ROADMAP (priority topics Jackson has queued — suggest 1-2 per week as NEW entries even if they have zero GSC impressions):
${topRoadmapTopics.length > 0
  ? topRoadmapTopics.map(t => `- [priority ${t.priority}] "${t.title}" | keyword: ${t.keyword} | slug: ${t.slug} | notes: ${t.notes}`).join('\n')
  : '(no pending roadmap topics — roadmap may be empty or all published)'}

DECAYING PAGES (8+ consecutive weeks of position decline >3 spots per week — BYPASS COOLDOWN for these pages):
${decayAlerts.length > 0
  ? decayAlerts.map((a: any) =>
      `- [${a.consecutiveWeeksDeclined}wk decline] ${a.page} | pos ${a.positionAtStart} → ${a.positionNow} (lost ${a.totalPositionLoss} spots) | ${a.impressions} impr | COOLDOWN BYPASSED`
    ).join('\n')
  : '(none — requires 8+ consecutive weekly history snapshots; data accumulates from ~July 2026)'}

INTERNAL LINK GAPS (high-impression pages with fewer than 3 inbound internal links — add contextual FIX tasks):
${linkGaps.length > 0
  ? linkGaps.slice(0, 5).map((g: any) =>
      `- ${g.page} | ${g.impressions} impr | ${g.inboundLinkCount}/${g.threshold} inbound links`
    ).join('\n')
  : '(none — either link-audit.json not yet generated or all high-impression pages sufficiently linked)'}

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
  }));

  logCacheUsage('strategy', response.usage, ROOT);

  const plan = response.content[0].type === 'text' ? response.content[0].text : '# Plan generation failed.';
  const todayStr = new Date().toISOString().split('T')[0];
  // Replace both the literal [DATE] placeholder and any model-generated date in the header line
  const output = plan
    .replace('[DATE]', todayStr)
    .replace(/^(#\s*Weekly Plan\s*[—–-]\s*)\d{4}-\d{2}-\d{2}/m, `$1${todayStr}`);

  // ── Duplicate NEW slug check — auto-convert to REWRITE instead of hard-erroring ──
  let corrected = output;
  const newSlugWarnings: string[] = [];
  for (const line of output.split('\n')) {
    const newMatch = line.match(/(\] NEW:)(.*\|\s*)(\/[^\|]+\/)/);
    if (newMatch) {
      const slug = newMatch[3].trim();
      if (existingSlugs.has(slug)) {
        newSlugWarnings.push(`  AUTO-CORRECTED: "${slug}" NEW→REWRITE (page already exists)`);
        corrected = corrected.replace(line, line.replace('] NEW:', '] REWRITE:'));
      }
    }
  }
  if (newSlugWarnings.length > 0) {
    console.warn('\nWARN — duplicate NEW slugs auto-converted to REWRITE:\n' + newSlugWarnings.join('\n'));
  }
  const output2 = corrected;

  // ── Post-generation enforcement: drop tasks that violate hard constraints ──
  const { plan: enforced, dropped } = enforcePlanConstraints(
    output2, pagesOnCooldown, existingFilePathSet, fileToSlug, gscAnalysis, gsc,
    redirectMap, existingSlugs,
  );

  // Inject mandatory roadmap items — deterministic, not LLM-dependent
  const { plan: withRoadmap, injected: roadmapInjected } = injectMandatoryRoadmapItems(
    enforced, contentRoadmap, existingSlugs, failedSlugs, redirectMap,
  );
  if (roadmapInjected.length > 0) {
    console.log(`\nRoadmap injection: added ${roadmapInjected.length} mandatory item(s): ${roadmapInjected.join(', ')}`);
  }

  // Append enforcement log to plan so it's visible in the archive
  const finalPlan = dropped.length > 0
    ? withRoadmap + `\n\n## DROPPED TASKS (enforcement log — not for execution)\n\n${dropped.map(d => `- ${d}`).join('\n')}\n`
    : withRoadmap;

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

  appendWikiLog(ROOT, `## [${today()}] strategy | Weekly Plan Generated\n\n- Plan archived to raw/strategy/${today()}-weekly-plan.md\n- ${fixCount} fixes, ${rewriteCount} rewrites, ${newCount} new pages${dropped.length > 0 ? ` (${dropped.length} tasks dropped by enforcement)` : ''}\n- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation\n- Decay alerts injected: ${decayAlerts.length} (${decayAlerts.length === 0 ? 'none — threshold requires 9+ snapshots' : 'cooldown bypassed for flagged pages'})\n- Link gaps injected: ${linkGaps.length} high-impression underlinked pages\n- Roadmap items force-injected: ${roadmapInjected.length}\n`);

  console.log('\nStrategy complete → reports/weekly-plan.md');
  console.log(finalPlan.slice(0, 500));
}

main().catch(err => { console.error(err.message); process.exit(1); });
