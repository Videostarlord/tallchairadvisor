# TCA Optimization Plan
**Audit Date:** 2026-05-09
**Priority Order:** Critical → High → Medium → Nice-to-Have

Each item follows: What is wrong → Why it matters → Where in repo → Exact fix or next action.

---

## CRITICAL — Fix Before Any Scaling

### C1. Meta Description Regex Bug in `audit.ts` Is Producing False Audit Data

**What is wrong:** `audit.ts` uses the regex `/<meta\s+name=["']description["']\s+content="(.*?)"/i` which stops at the first apostrophe. Any page whose meta description contains `6'4"` (which is most of them) gets a truncated description reported to the audit agent. Claude analyzes incorrect meta lengths and produces wrong recommendations.

**Why it matters:** The audit is the ground truth for Tuesday's analysis. If meta descriptions are reported as 45 chars when they're actually 148 chars, the agent may "fix" descriptions that don't need fixing — or miss actually short descriptions.

**Where:** `tall-chair-advisor/scripts/agents/audit.ts`, line 27

**Exact fix:**
```typescript
// Current (broken):
const desc = html.match(/<meta\s+name=["']description["']\s+content="(.*?)"/i)?.[1] ?? null;
// Fixed:
const desc = html.match(/<meta\s+name=["']description["']\s+content="([^"]*)"/i)?.[1] ?? null;
```
Using `[^"]*` instead of `.*?` matches everything up to the closing double-quote, ignoring apostrophes.

---

### C2. Friday Content Agent Can Silently Overwrite Existing Pages

**What is wrong:** `execute-content.ts` writes new pages to `src/pages/<slug>.astro` without checking if the file already exists. If the strategy agent prescribes a slug that already exists (e.g., someone asks for `/review/sihoo-doro-s300/` again), the existing page is silently overwritten with freshly-generated content.

**Why it matters:** Overwriting an existing page with AI-generated content loses:
- Manually curated content and editorial voice
- Accurate schema dates and product data
- Existing internal links that point to that page
- Any performance optimizations made to the page

**Where:** `tall-chair-advisor/scripts/agents/execute-content.ts`, lines 322-329 (inside `writeNewPage()`)

**Exact fix:**
```typescript
// Add before writeFileSync:
if (existsSync(fullPath)) {
  return { 
    success: false, 
    filePath, 
    summary: `SKIPPED: ${filePath} already exists — use REWRITE in the plan to update existing pages` 
  };
}
```

---

### C3. AMAZON_URL Placeholder Is Never Validated in Generated Content

**What is wrong:** The content template includes `href="AMAZON_URL?tag=tallchairadvi-20"` placeholders. The `checkAffiliateLinks()` in verify-deploy only confirms that Amazon links *contain* the affiliate tag — it would pass `href="AMAZON_URL?tag=tallchairadvi-20"` because the tag is present. A shipped page with literal "AMAZON_URL" in a link would be a broken URL.

**Why it matters:** Broken product links mean zero revenue from that page. This is the core monetization failure mode.

**Where:**
- `tall-chair-advisor/scripts/agents/execute-content.ts`, `validateAstroFile()` function (around line 181)
- `tall-chair-advisor/scripts/agents/verify-deploy.ts`, `checkAffiliateLinks()` function (around line 62)

**Exact fix (option 1 — add to `validateAstroFile()`):**
```typescript
if (content.includes('href="AMAZON_URL')) {
  return { valid: false, reason: 'Unresolved AMAZON_URL placeholder in href attribute' };
}
```

**Exact fix (option 2 — add to `checkAffiliateLinks()`):**
```typescript
if (link.includes('AMAZON_URL')) {
  violations.push(`${file}: Unresolved AMAZON_URL placeholder in affiliate link`);
}
```

---

### C4. Monday Index Monitor Commits Code Changes to `main` Without Safety Checks

**What is wrong:** `index-monitor.ts` autonomously applies Claude-generated file fixes (noindex removal, canonical correction, thin content expansion) and commits them to `main` via Monday's workflow — bypassing the `sanitizeFrontmatter()`, word-count regression guard, voice check, and `lint:content` step that Thursday/Friday commits must pass.

**Why it matters:** Monday can ship code that violates voice constraints or has Astro build errors, directly to the main branch, completely invisible to Saturday's verification cycle.

**Where:** `tall-chair-advisor/.github/workflows/monday.yml`, line 49-51

**Exact fix:**
1. Change Monday's git push target from `main` to `staging`:
```yaml
# Current:
git push
# Fix:
git push origin HEAD:staging
```
2. Add `npm run build` and `npm run lint:content` before the commit step in `monday.yml`.
3. Or: scope the index monitor to diagnosis-only (report issues but don't apply fixes), and route fix recommendations to Thursday's execute-fixes agent via the weekly plan.

---

### C5. Strategy Agent Output Is Never Validated for Parseability

**What is wrong:** `strategy.ts` generates `weekly-plan.md` and commits it. `execute-fixes.ts` and `execute-content.ts` parse it with strict regex. If Claude generates a plan with slightly wrong formatting (wrong pipe count, renamed section header, extra whitespace), all tasks silently parse to zero — and both Thursday and Friday agents skip with "No fix tasks" or "No new content." The pipeline appears to succeed but does nothing.

**Why it matters:** This was the actual root cause of 3 weeks of zero fixes before the cooldown bug was discovered. The cooldown bug masked what may also have been parse failures.

**Where:** `tall-chair-advisor/scripts/agents/strategy.ts`, after the Claude call (around line 138)

**Exact fix:**
```typescript
// After generating the plan, validate it parses to at least some tasks
const fixTasks = parsePlanForFixes(output); // same logic as execute-fixes.ts
const contentTasks = parsePlanForContent(output); // same logic as execute-content.ts

if (fixTasks.length === 0 && contentTasks.length === 0 && 
    (output.includes('## FIXES') || output.includes('## NEW CONTENT'))) {
  console.warn('WARNING: Plan has FIXES/NEW CONTENT sections but zero parseable tasks. Possible format error.');
  // Optionally: retry with format correction injected
}
```
This requires extracting the `parsePlan()` functions into shared utilities or duplicating the regex logic.

---

## HIGH IMPACT — Fix Within 2 Weeks

### H1. `astro.config.mjs` `pageLastmod` Is Manually Maintained and Stale

**What is wrong:** The sitemap's `<lastmod>` values are hardcoded in `astro.config.mjs` and are never auto-updated by any agent. Pages modified by Thursday agent show old lastmod dates in the sitemap.

**Why it matters:** Google uses lastmod as a crawl priority signal. Stale dates mean re-crawl delays after fixes are applied.

**Where:** `tall-chair-advisor/astro.config.mjs`, lines 12-56

**Fix option A (manual, fast):** Add a step to `execute-fixes.ts` that, after successfully writing a fixed file, updates the corresponding entry in `astro.config.mjs`. This requires parsing and rewriting the config file programmatically.

**Fix option B (architectural):** Replace the static map with a dynamic git-based approach in `astro.config.mjs`:
```javascript
// Instead of hardcoded map, use child_process to read git log per URL at build time
```
This is more complex but eliminates the manual maintenance burden entirely.

**Fix option C (minimum viable):** Add a step in Thursday's CI that runs `node scripts/update-lastmod.js` which writes the current date to the `pageLastmod` entry for each file modified in the current commit.

---

### H2. The `/office-chairs-for-tall-people/` and `/best-office-chairs/` Pages Are Cannibalizing Each Other

**What is wrong:** Both pages target the head term "best office chairs for tall people." Both have product shortlists. Google must choose which to rank, and is apparently choosing poorly (OFC-for-tall-people at pos 24.9 vs best-office-chairs performing better commercially).

**Why it matters:** 570 impressions at pos 24.9 on the site's most important awareness keyword is a missed opportunity. The flagship educational page should rank page 1 for that head term.

**Where:**
- `tall-chair-advisor/src/pages/office-chairs-for-tall-people.astro`
- `tall-chair-advisor/src/pages/best-office-chairs.astro`

**Fix:**
1. Rewrite `/office-chairs-for-tall-people/` to be purely educational (L1/L2): dimensional framework, why standard chairs fail, how to evaluate. Remove the product verdict table. Add strong CTA to `/best-office-chairs/` at the bottom.
2. Confirm `/best-office-chairs/` is the canonical commercial list page (L3). Keep the product verdict table. Ensure it links to all height-specific pages and individual reviews.
3. Update schema, breadcrumbs, and internal linking to reinforce this hierarchy.

---

### H3. Height-Specific Pages Have Wrong Breadcrumb Parent

**What is wrong:** `/office-chairs-for-6-foot-[3-7]/` pages breadcrumb under `/office-chairs-for-tall-people/` (educational guide), not `/best-office-chairs/` (commercial list). This creates a schema inconsistency between declared hierarchy and actual linking.

**Why it matters:** BreadcrumbList schema is used by Google for site navigation understanding. Mismatched breadcrumbs signal confused site architecture to both Google and users.

**Where:** Every `tall-chair-advisor/src/pages/office-chairs-for-6-foot-[3-7].astro` file, BreadcrumbList schema block (around line 28-30 in each)

**Fix:** Change position 2 breadcrumb from:
```json
{ "name": "Office Chairs for Tall People", "item": ".../office-chairs-for-tall-people/" }
```
to:
```json
{ "name": "Best Office Chairs", "item": ".../best-office-chairs/" }
```
Also ensure `/best-office-chairs/` has visible links to each height-specific page.

---

### H4. Friday Agent Does Not Update `astro.config.mjs` for New Pages

**What is wrong:** New pages created by `execute-content.ts` default to priority 0.3 / `changefreq: 'yearly'` in the sitemap. No entry is added to `pageLastmod`. New content is treated as stale utility pages by the sitemap configuration.

**Why it matters:** Fresh content needs aggressive crawl priority, not "update once a year" signals.

**Where:** `tall-chair-advisor/scripts/agents/execute-content.ts`, `main()` function (end of file)

**Fix:** After writing the new `.astro` file, update `astro.config.mjs`:
1. Add entry to `pageLastmod` map: `'https://tallchairadvisor.com${task.slug}': new Date('${today()}')`
2. If the slug matches `/review/*` or `/office-chairs-for-6-foot-*`, ensure it falls into the 0.8 priority tier (it should based on the existing if-else logic, but verify).

Requires programmatic AST editing of `astro.config.mjs` or regex-based string insertion.

---

### H5. The Competitor Gaps Wiki Page Duplicates Rows on Every Monday Run

**What is wrong:** `competitor-monitor.ts` prepends new gap rows to the "## Recent Competitor Gaps" section without replacing old rows. After N weeks, there are N copies of every gap.

**Why it matters:** The strategy agent reads `competitor-landscape.md` as context. A page with hundreds of duplicate gap rows wastes context window tokens and confuses Claude about what's current vs. historical.

**Where:** `tall-chair-advisor/scripts/agents/competitor-monitor.ts`, lines 141-150

**Fix:** Replace the section wholesale rather than prepending:
```typescript
// Extract everything before the section header
// Insert new rows
// Discard old rows (or keep last N rows as history)
const sectionStart = updatedPage.indexOf('## Recent Competitor Gaps');
const beforeSection = updatedPage.slice(0, sectionStart);
const newSection = `## Recent Competitor Gaps\n\n| Date | Gap | Priority | Recommendation |\n|------|-----|----------|----------------|\n${gapLines}\n`;
writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md', beforeSection + newSection);
```

---

### H6. Saturday Schema Validity Check Reads `dist/` But New Pages Are Not Rebuilt Before Saturday

**What is wrong:** The Saturday workflow runs `npm run build` and then `verify-deploy.ts`. But if Thursday or Friday's staging commits introduced schema errors, the schema check will catch them — this part works. However, Monday's autonomous fixes to `main` are merged into staging Saturday morning, but those fixed files' schema is never independently validated before the Saturday build. If a Monday fix introduced a JSON-LD parse error, Saturday's build catches it — but the error occurred 5 days earlier.

**Why it matters:** The pipeline has a 5-day blind spot for Monday-introduced schema errors.

**Fix (already partially addressed by adding `lint:content` to Monday):** Add schema validity check as part of Monday's post-fix verification, or add `npm run build` to Monday's workflow after applying index-monitor fixes.

---

### H7. Saturday Summary Prompt Has No System Prompt and No Trend Context

**What is wrong:** The Claude call for weekly summary in `verify-deploy.ts` (lines 241-257) has no system prompt and no week-over-week GSC comparison data.

**Why it matters:** The weekly summary is the primary human-readable record of what's working. Without trend data, it's just a snapshot.

**Where:** `tall-chair-advisor/scripts/agents/verify-deploy.ts`, lines 241-257

**Fix:**
1. Read previous week's click/impression numbers from `wiki/pages/concepts/gsc-performance.md` (the historical snapshots section).
2. Pass previous week's metrics alongside current metrics.
3. Add system prompt: "You are the operations log writer for tallchairadvisor.com. Write factual, terse bullet points. Show metric changes vs. prior week (e.g., 'Impressions: 12,209 (+1,500 vs prior week'). Note if metrics improved or declined."

---

## MEDIUM IMPACT — Address in Next Month

### M1. Pain Pages Lack Consistent "Now Find Chairs" CTA Routing

**What is wrong:** Pain pages (back-pain, knee-pain, leg-pain, shoulder-pain) are confirmed conversion paths (knee-pain drove the first commission). But routing from pain pages to `/best-office-chairs/` is inconsistent — some pages have CTAs, others may not.

**Fix:** Audit every pain sub-page for a visible "Here are chairs that address this problem" CTA block linking to `/best-office-chairs/`. Add to any page that lacks it. This is a Thursday agent task that can be added to the weekly plan.

---

### M2. `review/leap-plus/` and `review/sihoo-doro-s300/` Are Missing Product `@id`

**What is wrong:** Product schema on these pages lacks `@id` identifiers, preventing cross-page schema graph connections.

**Where:**
- `tall-chair-advisor/src/pages/review/leap-plus.astro`, Product schema block
- `tall-chair-advisor/src/pages/review/sihoo-doro-s300.astro`, Product schema block

**Fix:** Add `"@id": "https://tallchairadvisor.com/#product/steelcase-leap-plus"` to leap-plus, and similar for sihoo. Pattern from `review/gesture.astro` line 18.

---

### M3. `correct-chair-dimensions/` Has 1,422 Impressions but Weak Funnel Routing

**What is wrong:** The page educates users on dimensions but does not route them to the buying decision. It's a high-traffic L2 page that drops users.

**Fix:** Add a "Now find chairs that meet these dimensions" section at the bottom of the page, linking to `/best-office-chairs/` with context like "These three chairs are the only ones that reliably meet dimensional requirements for tall users."

---

### M4. The Tuesday Audit Agent Should Also Check Recently-Created Pages

**What is wrong:** New pages have no impressions for weeks and are excluded from the audit filter (10+ impressions required).

**Where:** `tall-chair-advisor/scripts/agents/audit.ts`, lines 49-51

**Fix:** Add a secondary list of recently-created pages (from git log) to always audit, regardless of impressions:
```typescript
const recentPages = execSync(`git log --since="${30 days ago}" --name-only --pretty=format: -- src/pages/`)
  .split('\n').filter(f => f.endsWith('.astro'))
  .map(f => ({ page: '/' + f.replace(/^src\/pages\//, '').replace(/\.astro$/, '') + '/', impressions: 0, ... }));

const pagesToAudit = [...existingPagesFromGSC, ...recentPages].slice(0, 25);
```

---

### M5. Voice Constraint Regexes Should Be Unified and Strengthened

**What is wrong:** Three different pattern sets in three different files catch voice violations with different coverage.

**Where:**
- `tall-chair-advisor/scripts/lint-content.mjs`, line 28
- `tall-chair-advisor/scripts/agents/verify-deploy.ts`, lines 37-41
- Content agent system prompt in `execute-content.ts`

**Fix:** Create a shared `src/shared/voice-patterns.ts` file (or equivalent) with a canonical set of voice violation patterns. Import from this in both `lint-content.mjs` and `verify-deploy.ts`. Expand patterns to include:
- `I found that the (aeron|leap|sihoo)`
- `My experience with the (aeron|leap|sihoo)`
- `I noticed the (aeron|leap|sihoo)`
- `Having tried|After testing` for non-Gesture chairs

---

### M6. The Manual Audit Agent's Memory Path Is Incorrect

**What is wrong:** `tca-audit.md` references an incorrect path for agent memory storage.

**Where:** `.claude/agents/tca-audit.md`, line 386

**Fix:** Update the path from:
```
/Users/jacksonchristopher/Downloads/Claude TCA Workspace/.claude/agent-memory/tca-seo-strategist/
```
to:
```
/Users/jacksonchristopher/Downloads/Claude-Projects/PROJECTS/Claude TCA Workspace/.claude/agent-memory/tca-audit/
```
Also update the `tca-seo-strategist` subdirectory name to match the agent's actual name (`tca-audit`).

---

### M7. The Broken Python Regex in `tca-audit.md` Should Be Fixed

**What is wrong:** The meta description regex example in the manual audit agent has a syntax error (misplaced `]`).

**Where:** `.claude/agents/tca-audit.md`, line 36

**Fix:**
```python
# Current (broken — unmatched bracket):
desc = re.search(r'<meta\s+name=["\']description["\'\]\s+content="(.*?)"', html, re.I)

# Fixed:
desc = re.search(r'<meta\s+name=["\']description["\']\s+content="(.*?)"', html, re.I)
```

---

### M8. `dateModified` in Schema Is Never Auto-Updated After Agent Fixes

**What is wrong:** Thursday agent modifies page content but doesn't update `dateModified` in the JSON-LD schema block.

**Where:** `tall-chair-advisor/scripts/agents/execute-fixes.ts`, `applyFix()` function (end of function, after successful write)

**Fix:** After writing the fixed file, run a targeted replacement of `"dateModified": "YYYY-MM-DD"` in the JSON-LD block with today's date. This can be a simple string replacement — no need to parse the full JSON. Add this to both the targeted fix path and the complex fix path.

---

### M9. Saturday Deploy Should Always Resubmit Sitemap

**What is wrong:** The sitemap is never resubmitted to Google after content updates, unless Monday's index monitor happens to detect issues.

**Where:** `tall-chair-advisor/.github/workflows/saturday.yml`, after the git push step

**Fix:** Add a step after the Saturday commit that calls the GSC sitemaps submit API:
```bash
npx tsx scripts/agents/resubmit-sitemap.ts
```
Or add the resubmission call directly to `verify-deploy.ts`'s main function at the end of a successful run.

---

## NICE-TO-HAVE — Polish and Scaling Preparation

### N1. Add Monetization Coverage Audit to Tuesday Agent

Check each high-traffic page for presence of at least one affiliate CTA. Flag pages with 500+ impressions and no affiliate links.

### N2. Add `class="link-internal"` Audit to the Content Lint Script

Currently `lint-content.mjs` checks placeholders and voice violations. Add a check: pages must have at least 2 `class="link-internal"` hrefs. This enforces the content agent's own scoring rubric on all pages.

### N3. Standardize Publisher Logo Image Reference Across All Pages

The `shoulder-pain-tall-people.astro` uses `/images/logo.png` while all other pages use `og-default.webp`. Audit all pages for consistent publisher logo and fix the outlier.

### N4. Add `SearchAction` and `@id` to `WebSite` Schema on Homepage

Minor schema graph improvement: give the `WebSite` block on the homepage an `@id` that matches the `WebPage` block's `isPartOf` reference.

### N5. Add a "How to Evaluate Any Chair" L2 Guide

Untargeted whitespace in the content pillar. High internal linking potential. No real competition. Pairs naturally with `/correct-chair-dimensions/` and routes to `/best-office-chairs/`.

### N6. Add Workstation Setup Content Beyond Standing Desk

Monitor arm, keyboard tray, desk mat guides. Easy wins given ME background. Each can embed affiliate CTAs.

### N7. Build a Shared Parse-Plan Utility Module

Extract `parsePlan()` logic from `execute-fixes.ts` and `execute-content.ts` into a shared `scripts/agents/plan-utils.ts`. Then use the same parser in `strategy.ts` to validate its own output before committing. Reduces code duplication and enables plan self-validation.

### N8. Replace Manual `pageLastmod` Map With Git-Based Dynamic Approach

Long-term maintenance burden elimination. Read `git log --format=%ai -- <file>` for each page at sitemap build time. Requires build-time Node.js script integration with Astro config.
