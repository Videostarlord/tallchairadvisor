# TCA Agent Logic Audit
**Audit Date:** 2026-05-09

Full analysis of every agent, prompt, workflow, and strategy file.

---

## Agent 1: `gsc-pull.ts` (Monday — GSC Data Pull)

**File:** `tall-chair-advisor/scripts/gsc-pull.ts`
**Invoked by:** `monday.yml`

**What it does:** Fetches 90 days of Google Search Console data via the Webmasters API. Writes `data/gsc/latest.json` with totals (clicks, impressions, CTR, avg position) and per-page breakdowns.

### Issues

**1. The file is always overwritten, not appended.**
Every Monday, `latest.json` is replaced with a fresh 90-day snapshot. There is no historical archive of weekly GSC pulls in a queryable format. The wiki's `gsc-performance.md` page preserves up to 8 historical snapshots (via the Tuesday audit agent), but the raw JSON files are not archived by this agent — only by `archiveJsonToRaw()` inside other agents.

Actually: Looking at `competitor-monitor.ts`, it calls `archiveJsonToRaw()`. Does `gsc-pull.ts` archive to raw? This needs verification. If not, the only historical GSC data in raw/ comes from manual exports, not from the automated pipeline.

**2. No validation that the API returned data before overwriting.**
If the GSC API returns an empty dataset (rate limit, credential issue, API outage), `latest.json` is overwritten with empty or partial data. Every downstream agent that week operates on bad data. There is no "if data is empty, abort and keep previous file" guard.

**Fix:** Before overwriting `latest.json`, check that the response contains at least N pages with non-zero impressions. If not, abort with exit code 1 and keep the previous file.

**3. The `--days=16m` flag in `package.json` is unexplained and potentially wrong.**
`tall-chair-advisor/package.json`, line 13: `"gsc:pull:16m": "tsx scripts/gsc-pull.ts --days=16m"`. This suggests the script accepts a `--days` argument. The GSC API max range is 16 months. This flag is never used in the automated workflows (Monday uses `npm run gsc:pull` without the flag), so it's a developer convenience command. But if someone mistakenly runs it in automation and the API interprets `16m` as 16 minutes instead of months, the pull would return no meaningful data.

---

## Agent 2: `competitor-monitor.ts` (Monday — Competitor Intelligence)

**File:** `tall-chair-advisor/scripts/agents/competitor-monitor.ts`

**What it does:** Fetches competitor pages, extracts title/meta/H1/H2s/word count/schema. Calls Claude for strategic gap analysis. Writes `data/competitors/latest.json` and updates `wiki/pages/concepts/competitor-landscape.md`.

### Issues

**1. The competitor prompt has no site-specific constraint layer.**
The Claude prompt (lines 83-110) says "You are an SEO strategist for tallchairadvisor.com" and asks for gaps. But it does not include:
- The voice constraint (no first-person testing for non-Gesture chairs)
- The content pillar framework
- The current thesis and priority list

**Impact:** Claude might recommend "write a first-person review of the Aeron based on your sitting experience" because a competitor has that format and TCA doesn't. This would violate the core constraint and, if picked up by Wednesday's strategy agent without filtering, could propagate to a content task.

**Mitigation that partially helps:** The strategy agent does have the full system prompt with constraints. But the gap analysis JSON from competitors is passed directly into strategy without re-validation of the gap's compatibility with TCA's constraints.

**Fix:** Add a constraint block to the competitor prompt: "Do not recommend gaps that require first-person testing voice for non-Gesture chairs. Do not recommend gaps in content pillars that conflict with the site's ME-framing and research-based approach."

**2. The competitor gap table update is duplicating rows on every run.**
**File:** `competitor-monitor.ts`, lines 143-149:
```typescript
if (updatedPage.includes('## Recent Competitor Gaps')) {
  writeWikiPage(ROOT, 'pages/concepts/competitor-landscape.md',
    updatedPage.replace('## Recent Competitor Gaps', 
      `## Recent Competitor Gaps\n\n| Date | Gap | Priority | Recommendation |\n...\n${gapLines}\n`)
  );
}
```

On every Monday run, if "## Recent Competitor Gaps" already exists, it replaces the section header with the header again plus new gap rows. But it does not remove the existing rows under the header. The next week's run will produce: the header, new rows, then the old rows again (because the old rows are still in `updatedPage` below the re-inserted header).

**Result:** After 4-6 weeks, the competitor-landscape page will have dozens of duplicated gap rows, one new batch per week, growing without bound.

**Fix:** Replace the entire "## Recent Competitor Gaps" section content (header + all rows), not just prepend to it.

**3. The `dead` competitor URL handling is logged but not escalated.**
If a competitor URL is unreachable (dead), a console warning is printed and the log entry notes it. But there's no mechanism to flag dead competitors for human review or to automatically expire them from `data/competitors/config.json`. Dead competitors accumulate in the monitoring list and consume API quota.

---

## Agent 3: `index-monitor.ts` (Monday — Indexing Health)

**File:** `tall-chair-advisor/scripts/agents/index-monitor.ts`

**What it does:** Inspects every page via GSC URL Inspection API, classifies issues, applies Claude-assisted fixes for fixable issues, resubmits sitemap, writes `reports/index-monitor.md`, updates `wiki/pages/concepts/indexing-health.md`.

### Issues

**1. This agent applies code changes on Monday that bypass the Wednesday strategy and Thursday approval cycle.**
The index monitor autonomously fixes noindex tags, canonicals, and thin content by calling Claude and writing the fixed file to `src/pages/`. These changes are committed in Monday's commit alongside the data pull.

**Risk:** The Monday agent is not subject to the same quality gates as Thursday (no `sanitizeFrontmatter()`, no word count regression check, no `lint:content` step). Monday's `monday.yml` commit step (line 50) includes `git add ... src/` — any fixed files go straight to main.

**Critical gap:** The Saturday verify-deploy agent runs a word count regression check against `HEAD~1`. Monday's code commits to main. Thursday's commits go to staging. Saturday checks staging against its own `HEAD~1` — which does not include Monday's code changes. Monday's autonomous fixes are effectively unreviewed by Saturday.

**Fix:** Monday's index fixes should be committed to `staging`, not `main`. Or the Saturday workflow should include a diff check against origin/main before the merge step.

**2. The thin-content fix is high-risk and under-constrained.**
**File:** `index-monitor.ts`, line 188: system prompt says "For soft-404: add a minimum of 200 words of relevant content to the main body so Google sees a real page."

Adding 200 words to a page is a substantial content change. The `fixPage()` function passes the source file to Claude with the instruction "fix ONLY the specific indexing issue." But "add 200 words" is subjective — Claude may add generic text that dilutes page quality, violates the voice constraint, or introduces placeholder language that slips past the regex checks.

The word-count regression guard (80% threshold) is present (line 228-232), but it only checks that the file didn't *shrink*. It doesn't check that added content meets quality standards.

**3. The `classifyIssue()` function has a `wait` fallback for everything it can't classify.**
**File:** `index-monitor.ts`, lines 151-158: the final `else` block returns `fixType: 'wait'` for any issue that doesn't match the earlier cases. This means:
- Pages with unusual coverage states get marked "wait" and are never fixed
- The `fixable: false` flag means they won't be retried
- There's no alert or escalation for unclassified issue types

---

## Agent 4: `audit.ts` (Tuesday — Site Audit)

**File:** `tall-chair-advisor/scripts/agents/audit.ts`

**What it does:** Fetches live pages, checks meta/schema/CTR, calls Claude for structured audit report, updates `gsc-performance.md` wiki page.

### Issues

**1. Context window truncation discards the most historically significant data.**
**File:** `audit.ts`, lines 64-66:
```typescript
const wikiContext = readConceptContext(ROOT, ['ctr-optimization', 'meta-descriptions', 'schema-markup']);
const synthesisContext = readSynthesisContext(ROOT);
```

Each concept page is truncated to 1000 chars (in `readConceptContext`), synthesis pages to 1500 chars each (in `readSynthesisContext`). The historical comparison value of the wiki depends on Claude having enough context to say "this same issue was flagged 3 weeks ago and is still unfixed." With 1000-char truncation on concept pages, multi-week trends are invisible.

**Fix:** For the audit agent, read the full `gsc-performance.md` page (it contains the historical snapshot table). Don't truncate. The audit's value proposition is trend comparison.

**2. The meta description regex will fail on apostrophes.**
**File:** `audit.ts`, line 27:
```typescript
const desc = html.match(/<meta\s+name=["']description["']\s+content="(.*?)"/i)?.[1] ?? null;
```

The CLAUDE.md explicitly warns about this regex bug (Section: "Meta Description Regex"): "The standard regex breaks on apostrophes in content like `6'4"`. The fix regex is documented. But `audit.ts` uses the broken regex. This means any page with `6'4"` in its meta description will have the description truncated at the apostrophe, reporting a shorter-than-actual description length and potentially triggering false "description too short" flags.

**This is a documented known issue that was not fixed in the agent code.**

**Fix:** Line 27 of `audit.ts` — update the regex to:
```typescript
const desc = html.match(/<meta\s+name=["']description["']\s+content="(.*?)"/i)?.[1] ?? null;
```
(The fix: use `"` as the closing delimiter, not `["']`, so the match stops at the double-quote boundary and doesn't stop at internal apostrophes.)

**3. The audit only checks 20 pages maximum.**
**File:** `audit.ts`, lines 49-52:
```typescript
.filter((p: any) => p.impressions >= 10 ...)
.slice(0, 20);
```

With 46 pages and several with fewer than 10 impressions, the audit may miss pages with fresh technical issues. New pages from the Friday agent have zero GSC impressions and are never audited until they accumulate traffic.

**4. The `gsc-performance.md` wiki update overwrites, not appends, the history correctly — but with a fragile regex.**
**File:** `audit.ts`, lines 133-152: The code attempts to preserve historical entries by extracting, rotating, and re-inserting them. This is complex multi-step string manipulation. If the page's existing structure doesn't match the expected regex patterns, old history is silently dropped.

---

## Agent 5: `strategy.ts` (Wednesday — Strategy and Planning)

**File:** `tall-chair-advisor/scripts/agents/strategy.ts`

**What it does:** Reads all wiki context, GSC data, audit report, competitor analysis, previous plan. Calls Claude to write `reports/weekly-plan.md` in a structured format parseable by Thursday and Friday agents.

### Issues

**1. The plan format specification is good but still allows Claude to deviate.**
**File:** `strategy.ts`, lines 114-134: The prompt specifies exact format for FIXES, NEW CONTENT, and REWRITES sections. But Claude is a language model — it may add commentary, rename sections, use slightly different syntax, or omit required pipe-separated fields. The parser in `execute-fixes.ts` and `execute-content.ts` uses strict regex that silently drops non-matching lines.

**Known failure mode (from decisions-log 2026-W19):** Strategy agent was generating REWRITE entries with 3 pipe-separated fields, but the parser required 4. All REWRITE tasks silently dropped for 3+ weeks. This was fixed — but the fix was just updating the template comment in the strategy prompt. Claude can still produce non-conforming output.

**Missing:** There is no post-generation validation step in `strategy.ts` that parses its own output to verify the plan is parseable before committing. If the plan has zero parseable tasks, Thursday and Friday agents skip silently — and this is indistinguishable from "no work needed this week" from the logs.

**Fix:** After generating the plan, run the same regex logic as `parsePlan()` from `execute-fixes.ts` against the generated plan. If the FIX/REWRITE/NEW CONTENT sections parse to zero tasks but the plan text is non-empty, flag this as a potential format failure and retry with a corrective instruction.

**2. The strategy prompt provides competitors data as a JSON string parsed from the analysis object — not structured.**
**File:** `strategy.ts`, lines 97-99:
```typescript
COMPETITOR GAPS:
${competitors.analysis.summary}
${competitors.analysis.gaps?.map(...).join('\n') || ''}
```

If `competitors.analysis` is empty (because Monday's competitor monitor failed), this section shows blank. Claude has no competitor context that week and may generate redundant content recommendations without knowing a competitor already owns that angle.

**3. The `getRecentlyEditedPages()` uses a 21-day window but the edit cadence rules use 14-day.**
**File:** `strategy.ts`, lines 23-31: The function returns pages edited in the last 21 days. But the comment in the edit cadence rules section says "do NOT schedule FIXES for pages edited in the last 14 days." The mismatch means Claude gets a 21-day list but is told to respect a 14-day rule. If Claude tries to convert the "recently edited" list into a 14-day rule itself, it may miscalculate. The list should match the actual cooldown period.

---

## Agent 6: `execute-fixes.ts` (Thursday — Apply Fixes)

**File:** `tall-chair-advisor/scripts/agents/execute-fixes.ts`

**What it does:** Parses FIXES and REWRITES from the weekly plan. Applies targeted edits (meta/title) or full-file rewrites. Builds the site. Commits to staging.

### Issues

**1. The `isCriticalPage()` function URL normalization is fragile.**
**File:** `execute-fixes.ts`, lines 50-55:
```typescript
function isCriticalPage(...): boolean {
  const slug = '/' + filePath.replace(/^src\/pages\//, '').replace(/\.astro$/, '') + '/';
  const fullUrl = `https://tallchairadvisor.com${slug}`;
  const data = gscData.get(fullUrl) ?? gscData.get(slug);
```

This converts `src/pages/review/gesture.astro` to `/review/gesture/`. But pages in subdirectories like `src/pages/author/jackson-christopher/index.astro` would become `/author/jackson-christopher/index/` — incorrect. The `index` suffix is not stripped for subdirectory index files.

**2. The full-file rewrite path (for "complex" fixes) is still dangerous.**
Despite the targeted edit path being added for meta/title fixes, "complex" fixes (schema changes, verdict tables, affiliate links) still ask Claude to rewrite the entire file. The 85% word count regression guard is a safety net, but it allows up to 15% content loss without triggering rejection. For a 2000-word page, that's 300 words of content that could be silently dropped.

More critically, the system prompt says "Output the COMPLETE updated file content, nothing else." But Claude sometimes outputs partial files or adds explanatory text before the code block even when instructed not to. The cleanup code strips markdown fences (lines 276-280) but doesn't handle all possible non-file output.

**3. The Thursday workflow pushes to staging with `--force`.**
**File:** `tall-chair-advisor/.github/workflows/thursday.yml`, line 55:
```yaml
git push origin HEAD:staging --force
```

Force-pushing to staging on Thursday overwrites whatever Friday staged the previous week (if that Friday push happened after Thursday in the same cycle — unlikely but possible if a run is delayed). More importantly, if a manual fix was committed to staging between Wednesday and Thursday, Thursday's force push will erase it.

The Saturday workflow now merges main into staging before running, which mitigates this somewhat. But Thursday's force push is still a risk if Friday runs on a delayed schedule.

**4. The `sanitizeFrontmatter()` function does not validate the result is syntactically valid JavaScript.**
**File:** `execute-fixes.ts`, lines 59-68: The function replaces em dashes and curly quotes with ASCII equivalents. This prevents one class of build failure. But if Claude generates other problematic tokens in the frontmatter (bare template literals, invalid identifier names, missing semicolons), `sanitizeFrontmatter()` will not catch them. The file is written to disk and the build is the only gate.

---

## Agent 7: `execute-content.ts` (Friday — Write New Pages)

**File:** `tall-chair-advisor/scripts/agents/execute-content.ts`

**What it does:** Parses NEW CONTENT from the weekly plan. Generates new Astro pages using a structural template. Validates, quality-scores, and writes pages. Creates wiki entity pages for new content.

### Issues

**1. The quality scoring (Haiku) grades only structural elements, not content quality.**
**File:** `execute-content.ts`, lines 200-217: The scoring prompt checks 5 binary criteria: verdict box present, keyword in title/H1/opening, FAQPage schema with 4+ questions, affiliate CTA with correct tag, 3+ internal links. A page can score 80/100 by having all these structural elements while containing:
- Inaccurate chair specifications
- Generic filler content that doesn't help the reader
- Subtle voice violations that don't trigger the lint regex
- Thin content that will get crawled-but-not-indexed

The 80/100 threshold is gamed by structure, not substance.

**Fix:** Add a 6th scoring criterion: "Content answers the target keyword's implied question with specific, verifiable information (not generic advice)." Or add a separate substantive review step using Sonnet (not Haiku) that checks for factual specificity.

**2. The template hardcodes `og-default.webp` as the image for all new pages.**
**File:** `execute-content.ts`, line 72:
```typescript
"image": "https://tallchairadvisor.com/images/og-default.webp",
```

Every AI-generated page will use the same generic OG image. There is no mechanism to assign page-specific images. This is noted as a "requires manual input" item in `AUTOMATION-SYSTEM.md` but is not flagged in the CI pipeline. A page with a generic OG image may have lower social click-through rates and weaker E-E-A-T signals on platforms that display OG images.

**3. The wiki index update logic inserts new page entries in the wrong section.**
**File:** `execute-content.ts`, lines 406-419:
```typescript
const updatedIndex = indexContent.replace(
  '## Concept Pages',
  `${newEntries}\n\n## Concept Pages`
);
```

New site-page entities are inserted *before* the Concept Pages header. But the existing index has a "## Site Page Entities" section above the Concept Pages section. New pages should be inserted into that section, not floating above the Concept Pages header. After a few Friday runs, the index will have dangling entity rows between unrelated sections.

**4. The slug-to-filepath conversion does not handle multi-word slugs correctly for some patterns.**
**File:** `execute-content.ts`, lines 322-327:
```typescript
const slugParts = task.slug.replace(/^\/|\/$/g, '').split('/');
const filePath = `src/pages/${slugParts.join('/')}.astro`;
```

If the strategy agent generates a slug like `/review/sihoo-doro-s300/` (which already exists), the Friday agent will silently overwrite the existing page with newly generated content. There is no "does this file already exist?" check before writing.

**Fix:** Add `existsSync(fullPath)` check before writing. If the file exists, skip with a warning in the content log.

**5. The AMAZON_URL placeholder in the template is never validated.**
**File:** `execute-content.ts`, lines 150-157: The template includes `href="AMAZON_URL?tag=tallchairadvi-20"` as placeholder CTAs. Claude is expected to fill these with real Amazon URLs. The `checkAffiliateLinks()` function in verify-deploy only checks that links contain `tag=tallchairadvi-20` — it does not check that `AMAZON_URL` was actually replaced with a real URL. A page with `href="AMAZON_URL?tag=tallchairadvi-20"` would pass the affiliate check but link to a broken URL.

**Fix:** Add a check in `validateAstroFile()` or the quality scoring step: flag any href containing literal "AMAZON_URL" as invalid.

---

## Agent 8: `verify-deploy.ts` (Saturday — Verification and Deploy)

**File:** `tall-chair-advisor/scripts/agents/verify-deploy.ts`

**What it does:** Runs 7 safety checks, generates weekly summary, commits wiki updates, pushes staging → main for Cloudflare deploy.

### Issues

**1. The voice constraint check is regex-based and easily bypassed.**
**File:** `verify-deploy.ts`, lines 37-41:
```typescript
const NON_GESTURE_VOICE_PATTERNS = [
  /I (tested|sat in|tried|used|reviewed) the (aeron|leap|sihoo|doro)/i,
  /after sitting in the (aeron|leap|sihoo)/i,
  /in my experience.{0,50}(aeron|leap|sihoo)/i,
];
```

These patterns catch explicit first-person testing language. But a page that says "I found that the Aeron's lumbar support..." or "My experience with the Leap Plus was..." would pass the regex. The lint-content.mjs has a slightly different regex (`I've tested|I tested|I sat in|I tried`) that also misses "I found" and "My experience."

Neither check catches the broader class of voice violations: first-person authority claims that imply personal use without explicit "I tested" phrasing.

**2. The Saturday workflow merges main into staging BEFORE building.**
**File:** `tall-chair-advisor/.github/workflows/saturday.yml`, lines 20-26: The Saturday workflow was recently fixed (per decisions-log 2026-W19) to merge main into staging before the build. This is correct. However, the workflow does not verify that the merge succeeded cleanly (no conflicts). If there's a merge conflict between staging and main, the `git merge` will fail and the workflow will abort with an unclear error. There is no conflict resolution fallback or human notification beyond the GitHub Actions failure email.

**3. The `checkContentRegression()` compares against `HEAD~1` of staging, which may not be meaningful.**
**File:** `verify-deploy.ts`, lines 185-216: The regression check compares the current staging HEAD against `HEAD~1` (one commit back on staging). But the Thursday force push to staging means `HEAD~1` on Saturday might be the previous Thursday's commit — not the equivalent page from 7 days ago. If Thursday wrote a page, and Friday also wrote to staging, `HEAD~1` on Saturday is Friday's staging commit. The regression check is comparing Friday's staging content against the content as of the most recent commit before it — not the deployed production baseline.

**4. The Claude summary call has no system prompt.**
**File:** `verify-deploy.ts`, lines 241-257: The Claude call for the weekly summary uses no system prompt. Without a system prompt, Claude has no role context, no site constraints, and no formatting instructions beyond what's in the user message. The resulting summary may be generic and lack the operational specificity needed to be useful as a strategic record.

**Fix:** Add a brief system prompt: "You are the operations log writer for tallchairadvisor.com. Write in factual, terse bullet points. Compare this week's metrics to the previous week if data is available. Note whether metrics improved or declined."

---

## Agent 9: `wiki-utils.ts` (Shared — Wiki Read/Write Utilities)

**File:** `tall-chair-advisor/scripts/agents/wiki-utils.ts`

**What it does:** Shared utility module for all agents. Provides read/write functions for wiki pages, raw archive, log appending, and date/week helpers.

### Issues

**1. `appendWikiLog()` always inserts new entries at the first `---` separator, not chronologically.**
**File:** `wiki-utils.ts`, lines 63-73: The function finds the first `---` marker in `log.md` and inserts the new entry after it. This means entries are always added just after the header divider. If the log already has many entries, new entries appear at the top (most recent first), which is the correct pattern for a reverse-chronological log. This behavior is correct as designed.

**2. `readConceptContext()` truncates each page to 1000 chars.**
**File:** `wiki-utils.ts`, lines 116-122:
```typescript
export function readConceptContext(repoRoot: string, concepts: string[]): string {
  ...
  return Object.entries(pages)
    .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 1000)}`)
    .join('\n\n');
}
```

1000 characters is approximately 200 words. The `ctr-optimization.md` concept page likely contains the full history of CTR experiments and findings — 1000 chars may not capture enough to prevent Claude from re-recommending a failed approach.

**3. `currentWeek()` calculation is non-standard.**
**File:** `wiki-utils.ts`, lines 93-99: The week number calculation uses a custom formula based on `Math.ceil((days + jan1.getDay() + 1) / 7)`. This does not follow ISO 8601 week numbering. The ISO standard defines week 1 as the week containing the year's first Thursday. The custom formula may produce week numbers that differ from ISO standard by 1. This matters for consistency: if the decisions-log uses ISO weeks and the wiki summaries use the custom weeks, week references will misalign by end-of-year or early-January.

---

## Agent 10: `tca-audit.md` (Manual — Claude Code Sub-Agent)

**File:** `.claude/agents/tca-audit.md`

**What it does:** Manual on-demand audit agent. Runs `/seo-audit` and `/blog-geo` skills, produces structured `AUDIT_SUMMARY.md` and `NEXT_STEPS.md`.

### Issues

**1. This agent has its own separate output format that does not feed into the weekly pipeline.**
The agent produces `AUDIT_SUMMARY.md` and `NEXT_STEPS.md` in an unspecified location ("project root or a designated output directory"). These files are not in `reports/` (where the weekly agents write), not in `raw/audits/` (where the pipeline archives), and the instructions don't say where they go. The current audit I'm writing is placed in `AUDIT/` in the workspace root — outside the git repo entirely.

**Impact:** Manual audit findings do not automatically flow into the Wednesday strategy agent. A human must read the manual audit and either update the weekly plan manually or create raw/ files for the strategy agent to pick up.

**2. The scoring system in the manual agent (SEO Score, GEO Score, Total Score) is different from the blog-analyze scoring criteria the content agent uses.**
Manual audits produce a 100-point score weighted across technical SEO, on-page SEO, linking architecture, etc. The content quality gate uses a 5-element structural checklist (0-100). The wiki `content-quality-scores.md` page was seeded from a blog-analyze run in March 2026. These three scoring systems are not reconciled. A page can pass the content agent's quality gate (80/100 on 5 structural elements), fail the manual audit's on-page SEO score, and show a different score in the wiki — with no mechanism to unify them.

**3. The memory system described in `tca-audit.md` points to a non-existent path.**
**File:** `.claude/agents/tca-audit.md`, line 386:
```
/Users/jacksonchristopher/Downloads/Claude TCA Workspace/.claude/agent-memory/tca-seo-strategist/
```

This path has a space in `Claude TCA Workspace` (without "Projects/PROJECTS/") and points to a directory that may not match the actual workspace path. The actual workspace is at `Claude-Projects/PROJECTS/Claude TCA Workspace/`. Additionally, the current `.claude/agent-memory/` directory exists at the workspace root, but the path in the agent file refers to a `tca-seo-strategist/` subdirectory. If this path doesn't exist, write operations will fail silently or throw.

**4. The meta regex in the agent's own instructions has a bug.**
**File:** `.claude/agents/tca-audit.md`, line 36:
```python
desc = re.search(r'<meta\s+name=["\']description["\'\]\s+content="(.*?)"', html, re.I)
```

The closing `]` after `["\'` is misplaced — it should be inside the character class as `["']`. The regex as written is syntactically invalid Python (unmatched bracket). This would cause a regex compilation error in Python if used.

**Impact:** Any Python-based meta check in a manual audit session would fail. This is the same known bug documented in CLAUDE.md, but the agent file perpetuates the broken version.

---

## Cross-Agent Conflicts and Systemic Issues

### Conflict 1: Multiple Agents Write to the Same Wiki Pages Without Conflict Detection

Tuesday's audit agent overwrites `gsc-performance.md`. Saturday's verify-deploy agent writes weekly summary pages and updates `index.md`. Friday's content agent updates `index.md`. Monday's index monitor updates `indexing-health.md`.

If Monday and Tuesday run on the same calendar day (holiday scheduling, delayed runs), they may both try to write to wiki pages simultaneously, with the last write winning. There is no locking or merge logic.

### Conflict 2: The Voice Constraint Is Enforced at Three Layers with Different Regexes

Three different checks enforce the voice constraint:
- `lint-content.mjs` VOICE_PATTERN: catches `I've tested`, `I have sat in`, `I tried`
- `verify-deploy.ts` NON_GESTURE_VOICE_PATTERNS: catches `I tested`, `I sat in`, `after sitting in`
- Content agent system prompt: describes the constraint in natural language

The regexes are similar but not identical. Neither catches "I found that the Aeron..." or "From my perspective, the Leap Plus..." or "Having used similar chairs, I can say the Sihoo..." These are real voice violations that would pass all three checks.

### Conflict 3: The Strategy Agent Can Prescribe Work the Execute Agents Cannot Safely Perform

The strategy agent is unconstrained in what it can prescribe. It could legitimately output:
- "REWRITE: /review/gesture/ | Expand first-person daily use section" — valid
- "NEW: /best-chairs-for-weight-lifting/ | office chairs for tall weightlifters" — off-topic but would be written
- "FIX: /review/gesture/ | Remove all Amazon affiliate links" — catastrophic if executed

The execute-fixes agent's system prompt has constraints, but they are applied at the point of execution, not at the strategy layer. A sufficiently unusual strategy instruction could slip through.

### Conflict 4: Monday Runs Three Agents Sequentially with Significant API Calls

Monday's workflow runs: `gsc:pull` + `competitor-monitor` + `index-monitor`. The index monitor inspects every page at 1.1 seconds per page (46 pages = ~51 seconds minimum), then may call Claude multiple times for fixes. Total Monday runtime could easily exceed 5-10 minutes. If any step fails mid-run (API timeout, rate limit), the commit step runs anyway and may commit partial outputs (GSC data without competitor data, or index monitor fixes without updated wiki pages).

The Monday commit (line 50 of `monday.yml`) adds all outputs in one commit regardless of which steps succeeded. There is no step-level success gating before the commit.
