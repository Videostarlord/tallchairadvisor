# TCA Next Claude Prompt
**Generated:** 2026-05-09
**Purpose:** Copy-paste into a new Claude Code session to implement the most important fixes from the audit.

---

## Instructions for Use

Paste this entire prompt (starting from the next section) as your opening message in a new Claude Code session with the TCA workspace loaded.

---

## THE PROMPT

You are implementing a series of critical bug fixes and high-impact improvements identified in a full system audit of the TCA (Tall Chair Advisor) automation pipeline. The codebase is at:

`/Users/jacksonchristopher/Downloads/Claude-Projects/PROJECTS/Claude TCA Workspace/tall-chair-advisor/`

**Before making any changes, read these files first to understand the system:**
1. `CLAUDE.md` in the workspace root (critical constraints)
2. `tall-chair-advisor/AUTOMATION-SYSTEM.md`
3. `tall-chair-advisor/wiki/index.md`
4. `tall-chair-advisor/wiki/synthesis/thesis.md`
5. `tall-chair-advisor/wiki/synthesis/decisions-log.md`

Then implement the fixes below in order. Do not skip ahead. Verify each fix compiles/runs correctly before moving to the next. Do NOT modify any page content in `src/pages/` — only modify agent scripts, workflow files, and configuration.

---

## FIX 1: Meta Description Regex Bug in `audit.ts`

**File:** `tall-chair-advisor/scripts/agents/audit.ts`, line 27

**Problem:** The current regex `/<meta\s+name=["']description["']\s+content="(.*?)"/i` stops at apostrophes in content like `6'4"`. This causes descriptions to be reported as truncated, producing wrong audit recommendations.

**Fix:** Change line 27 to:
```typescript
const desc = html.match(/<meta\s+name=["']description["']\s+content="([^"]*)"/i)?.[1] ?? null;
```

Use `[^"]*` instead of `.*?` to match everything up to the closing double-quote without stopping at apostrophes.

After making the change, verify the file still compiles: `cd tall-chair-advisor && npx tsx scripts/agents/audit.ts --dry-run` (or just check for TypeScript errors).

---

## FIX 2: Prevent Friday Agent From Overwriting Existing Pages

**File:** `tall-chair-advisor/scripts/agents/execute-content.ts`

**Problem:** The `writeNewPage()` function writes to a file path without checking if it already exists. If the strategy agent prescribes a slug for an existing page, the existing page is silently overwritten with AI-generated content.

**Fix:** In the `writeNewPage()` function, add an existence check before `writeFileSync`. Find the section around line 322-329 where `fullPath` is computed:

```typescript
const slugParts = task.slug.replace(/^\/|\/$/g, '').split('/');
const filePath = `src/pages/${slugParts.join('/')}.astro`;
const fullPath = resolve(ROOT, filePath);
```

Add immediately after the `fullPath` assignment:
```typescript
if (existsSync(fullPath)) {
  return { 
    success: false, 
    filePath, 
    summary: `SKIPPED: ${filePath} already exists — use REWRITE in the plan to update existing pages, not NEW CONTENT` 
  };
}
```

---

## FIX 3: Validate That AMAZON_URL Placeholders Were Replaced

**File:** `tall-chair-advisor/scripts/agents/execute-content.ts`, the `validateAstroFile()` function (around line 181)

**Problem:** The content template uses `href="AMAZON_URL?tag=tallchairadvi-20"` as placeholder CTAs. Claude is supposed to replace "AMAZON_URL" with a real Amazon URL. The affiliate link checker in `verify-deploy.ts` only confirms the affiliate tag is present — it would pass a link containing literal "AMAZON_URL".

**Fix:** Add a check inside `validateAstroFile()` before the `return { valid: true }` line:
```typescript
if (content.includes('href="AMAZON_URL')) {
  return { valid: false, reason: 'Unresolved AMAZON_URL placeholder found in href — Claude did not replace the template CTA' };
}
```

Also add this check to `verify-deploy.ts` inside `checkAffiliateLinks()` (around line 69, after the existing Amazon link check):
```typescript
if (link.includes('AMAZON_URL')) {
  violations.push(`${file}: Unresolved AMAZON_URL placeholder in affiliate link — link is broken`);
}
```

---

## FIX 4: Fix the Competitor Gaps Wiki Page Duplication Bug

**File:** `tall-chair-advisor/scripts/agents/competitor-monitor.ts`, lines 141-150

**Problem:** Every Monday run, the "## Recent Competitor Gaps" section is prepended with new rows but old rows are not removed. After multiple weeks, the section contains duplicate rows growing without bound.

**Fix:** Replace the entire section rather than prepending to it. Find the block (approximately lines 134-150) that handles the wiki update:

```typescript
if (updatedPage.includes('## Recent Competitor Gaps')) {
  writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md',
    updatedPage.replace('## Recent Competitor Gaps', `## Recent Competitor Gaps\n\n...${gapLines}\n`)
  );
}
```

Replace this block with:
```typescript
if (analysis.gaps?.length > 0) {
  const gapLines = analysis.gaps.map((g: any) => 
    `| ${today()} | ${g.gap} | ${g.priority} | ${g.recommendation} |`
  ).join('\n');
  
  const newSection = `## Recent Competitor Gaps\n\n| Date | Gap | Priority | Recommendation |\n|------|-----|----------|----------------|\n${gapLines}\n`;
  
  // Replace entire section (header + all rows) to prevent duplication
  const sectionStart = updatedPage.indexOf('## Recent Competitor Gaps');
  if (sectionStart !== -1) {
    const beforeSection = updatedPage.slice(0, sectionStart);
    // Find the next ## heading after the section, or end of file
    const nextSectionMatch = updatedPage.slice(sectionStart + 26).match(/\n## /);
    const afterSection = nextSectionMatch 
      ? updatedPage.slice(sectionStart + 26 + nextSectionMatch.index)
      : '';
    writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md', beforeSection + newSection + afterSection);
  } else {
    writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md', updatedPage + '\n\n' + newSection);
  }
}
```

---

## FIX 5: Add Post-Generation Plan Validation to `strategy.ts`

**File:** `tall-chair-advisor/scripts/agents/strategy.ts`

**Problem:** The strategy agent generates a weekly plan and commits it without verifying the plan parses to any actionable tasks. If Claude produces a slightly malformed plan (wrong pipe count, renamed section), both Thursday and Friday agents skip silently.

**Fix:** After the Claude call and before writing the plan file, add a validation step. After line 138 (`const output = plan.replace('[DATE]', ...)`):

```typescript
// Validate the plan contains at least some parseable tasks
function countParsedItems(planText: string, type: 'FIX' | 'REWRITE' | 'NEW'): number {
  const keyword = type === 'NEW' ? 'NEW:' : type + ':';
  const lines = planText.split('\n').filter(l => l.includes(`] ${keyword}`));
  let count = 0;
  for (const line of lines) {
    const pipeCount = (line.match(/\|/g) || []).length;
    if (pipeCount >= 3) count++; // 4 fields = 3 pipes
  }
  return count;
}

const fixCount = countParsedItems(output, 'FIX');
const rewriteCount = countParsedItems(output, 'REWRITE');
const newCount = countParsedItems(output, 'NEW');

const hasSections = output.includes('## FIXES') || output.includes('## NEW CONTENT');
const hasAnyTasks = fixCount + rewriteCount + newCount > 0;

if (hasSections && !hasAnyTasks) {
  console.warn(`\nWARNING: Plan has section headers but zero parseable tasks (FIX: ${fixCount}, REWRITE: ${rewriteCount}, NEW: ${newCount})`);
  console.warn('This may be a format error. Review the plan output below:');
  console.warn(output.slice(0, 1000));
} else {
  console.log(`\nPlan validation: ${fixCount} fixes, ${rewriteCount} rewrites, ${newCount} new pages`);
}
```

---

## FIX 6: Add a System Prompt to the Saturday Weekly Summary Claude Call

**File:** `tall-chair-advisor/scripts/agents/verify-deploy.ts`, the `summaryResponse` Claude call (around lines 241-257)

**Problem:** The weekly summary Claude call has no system prompt, producing generic output without trend analysis.

**Fix:** Add a `system` parameter to the `summaryResponse` call, and read the previous week's metrics from `gsc-performance.md` to pass as trend context.

First, read the historical snapshot from the wiki page (add before the Claude call, around line 241):
```typescript
const gscHistory = readWikiPage(ROOT, 'pages/concepts/gsc-performance.md') || '';
const historyMatch = gscHistory.match(/### [\d-]+\n([\s\S]*?)(?=\n###|\n##|$)/);
const prevWeekStats = historyMatch?.[1]?.slice(0, 300) || 'No prior week data available.';
```

Then modify the Claude call to include a system prompt and pass trend data:
```typescript
const summaryResponse = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 800,
  system: `You are the operations log writer for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people. 
Write in factual, terse bullet points. 
Show metric changes vs. prior week when data is available (e.g., "Impressions: 12,209 (+1,500 vs prior week)").
State whether each metric improved or declined. 
Note which specific fixes or content changes likely drove changes.
Be specific, not generic.`,
  messages: [{
    role: 'user',
    content: `Write a brief weekly summary (4-6 bullet points) for tallchairadvisor.com.

THIS WEEK:
- Clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions} | Avg pos: ${gsc.totals.avgPosition}

PRIOR WEEK (for trend comparison):
${prevWeekStats}

WHAT HAPPENED:
- Fixes applied: ${fixesLog}
- Content created: ${contentLog}
- Verification: ${allPassed ? 'All checks passed' : 'Some checks FAILED'}

Format as markdown bullet points. Be specific about what changed and what to watch next week.`
  }],
});
```

---

## FIX 7: Fix the Manual Audit Agent's Memory Path

**File:** `.claude/agents/tca-audit.md`, line 386

**Problem:** The memory path points to an incorrect directory path that doesn't match the actual workspace location.

**Fix:** Change the path reference from:
```
/Users/jacksonchristopher/Downloads/Claude TCA Workspace/.claude/agent-memory/tca-seo-strategist/
```
to:
```
/Users/jacksonchristopher/Downloads/Claude-Projects/PROJECTS/Claude TCA Workspace/.claude/agent-memory/tca-audit/
```

Also update the agent's name reference from `tca-seo-strategist` to `tca-audit` throughout the memory section to match the agent's filename.

---

## FIX 8: Fix the Python Regex Syntax Error in `tca-audit.md`

**File:** `.claude/agents/tca-audit.md`, line 36

**Problem:** The Python regex example for meta description parsing has a syntax error — a misplaced `]` that makes it an invalid pattern.

**Fix:** Change:
```python
desc = re.search(r'<meta\s+name=["\']description["\'\]\s+content="(.*?)"', html, re.I)
```
to:
```python
desc = re.search(r'<meta\s+name=["\']description["\']\s+content="(.*?)"', html, re.I)
```
(Move the `]` inside the character class bracket, not outside it.)

---

## AFTER COMPLETING ALL FIXES

Run these verification checks:

```bash
cd /Users/jacksonchristopher/Downloads/Claude-Projects/PROJECTS/Claude\ TCA\ Workspace/tall-chair-advisor

# Check TypeScript compiles (spot check key files)
npx tsx --no-cache scripts/agents/audit.ts --help 2>&1 | head -5 || echo "Script loaded"
npx tsx --no-cache scripts/agents/execute-content.ts --help 2>&1 | head -5 || echo "Script loaded"
npx tsx --no-cache scripts/agents/competitor-monitor.ts --help 2>&1 | head -5 || echo "Script loaded"
npx tsx --no-cache scripts/agents/strategy.ts --help 2>&1 | head -5 || echo "Script loaded"
npx tsx --no-cache scripts/agents/verify-deploy.ts --help 2>&1 | head -5 || echo "Script loaded"

# Confirm the site still builds
npm run build

# Run content lint
npm run lint:content
```

Then document these fixes in the wiki:
1. Append to `tall-chair-advisor/wiki/log.md` with a summary of what was changed and why
2. Update `tall-chair-advisor/wiki/synthesis/decisions-log.md` with a new entry at the top

---

## ADDITIONAL HIGH-PRIORITY WORK (Separate Session)

The following items were identified as high-impact but require more design work. Address in a follow-up session after the fixes above are verified:

1. **Differentiate `/office-chairs-for-tall-people/` from `/best-office-chairs/`** — Educational vs. commercial split. Requires content rewrite of the tall-people page to remove product shortlist and replace with a strong CTA to best-office-chairs.

2. **Fix height-specific page breadcrumbs** — Change parent from `office-chairs-for-tall-people` to `best-office-chairs` in the BreadcrumbList schema of all `/office-chairs-for-6-foot-[3-7]/` pages.

3. **Add `dateModified` auto-update to `execute-fixes.ts`** — After any successful fix, write today's date to the `dateModified` field in the page's schema block.

4. **Add `astro.config.mjs` sitemap update to `execute-content.ts`** — After creating a new page, add an entry to `pageLastmod` and ensure priority tier rules apply.

5. **Scope Monday's index monitor fixes to staging instead of main** — Change the git push target in `monday.yml` from `main` to `staging`, and add `npm run build && npm run lint:content` before committing.
