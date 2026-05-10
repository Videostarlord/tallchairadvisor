---
type: synthesis
last_updated: 2026-05-10 (mergeCanonicalDuplicates bug fix — corrects corrupted ctrLeaks data)
tags: [decisions, history]
---

# Decisions Log

A rolling record of key strategic decisions and their outcomes. The most valuable RAG source for the automation agents — before making a new strategy, query this first.

## 2026-W19 (May 10f) — `mergeCanonicalDuplicates` pageQuery bug fix

- **BUG FIXED — `gsc-analyze.ts` `mergeCanonicalDuplicates` keyed on page only for pageQuery rows.** All 46 queries on `/review/gesture/` were collapsed into a single leak row, summing impressions (303) and taking the best position (1) across all queries. "steelcase gesture review" was the first query in the raw array for that page, so it became the representative — with completely wrong metrics.
- **Actual data for "steelcase gesture review":** 12 impressions, position 49.9, 1 click, 8.33% CTR. Below the 15-impression and ≤20-position thresholds — correctly absent from `ctrLeaks` after fix.
- **Fix:** `mergeCanonicalDuplicates<T>()` now accepts an optional `keyFn` parameter. `pageQueries` call uses `` pq => `${normalizeUrl(pq.page)}|${pq.query}` `` so each page+query pair deduplicates independently. The stored row's `page` field always uses `normalizeUrl(row.page)` regardless of key strategy.
- **Data corrected:** Re-ran `npm run gsc:analyze`. New top leaks are all real: `/chairs/steelcase-gesture/seat-depth/` AIO suspects (Cornell seat-depth cluster queries, 34–64 impr, pos 4–10, 0% CTR).
- **CORRECTION to prior entry:** The May 10 deferred item "Gesture review is highest priority — 304 impr at pos 1, 8.33% CTR vs 35% expected" was based on corrupted data. Actual Gesture review profile: 2,589 impr, pos 8.2, 3 clicks, 0.12% CTR. Content depth expansion remains the right call for C1, but the CTR-leak framing was invalid.
- **Architecture note:** See `gsc-intelligence-system.md` → "Known Bugs / Fix History" for full technical writeup.

## 2026-W19 (May 10e) — Strategy agent autonomous enforcement hardening

- **DECISION — All constraints moved from prompt to code.** The strategy agent's impression threshold, cooldown, file ref validity, conditional language detection, FIX+REWRITE overlap, and max-5-FIX cap are now enforced post-generation in `enforcePlanConstraints()`. Claude's output is corrected before saving — the agent no longer relies on Claude following its own rules correctly.
- **Implementation:** `getPagesOnCooldown()` (14-day git-log Set) + `isTechnicalFix()` (keyword exemption) + `hasConditionalLanguage()` (unsafe-for-autonomy patterns) + `lookupImpressions()` (GSC lookup chain) + `enforcePlanConstraints()` (drop loop with reasons). Dropped tasks appended as `## DROPPED TASKS` section in archived plan for visibility.
- **Validated:** Simulation against 2026-05-10 plan correctly drops /fit-guides/ (178 impr), /seat-depth/ (101 impr), /knee-pain/ REWRITE (conditional language + cooldown). Keeps 3 FIX + 1 NEW + 1 REWRITE.
- **Not fixed (Finding 3):** Strategy layer over-trusting thin competitor inputs. Requires adding `competitorWordCount` to gap output — deferred.

## 2026-W19 (May 10d) — Structured extraction + finding type classification (competitor-intelligence v3)

- **BUILT — section manifest in `extractTcaContent()`:** Page source is now parsed into named sections (`parseSections()`). A `[SECTION MANIFEST]` listing every H1–H3 with char count and attributes (table/faq/cta) is prepended before the content budget is consumed. The manifest is always complete regardless of truncation — the model sees every section that exists and cannot infer absence from a partial excerpt. This is the structural fix for gesture's 61% coverage false-positive class (was the primary remaining gap accuracy problem after the v2 confidence filter iteration).
- **BUILT — `FindingType` formal taxonomy:** `type FindingType = 'absence_claim' | 'structure_claim' | 'depth_claim' | 'spec_gap'`. Added to `RawGapFinding` and `GapFinding` interfaces. Two-layer classification: Claude supplies `findingType` in JSON, `classifyFindingType()` validates and corrects. Replaces the `ABSENCE_PATTERNS` regex array.
- **UPGRADED — confidence filter uses `findingType` not regex:** `applyConfidenceFilter()` now checks `f.findingType === 'absence_claim' || f.findingType === 'spec_gap'`. `depth_claim` and `structure_claim` pass through at any coverage — they are valid from partial visibility. `spec_gap` is now also downgraded at <90% coverage (missing-table claims are absence-adjacent).
- **Deferred backlog cleared:** Both items explicitly deferred from v2 iteration are now implemented.

## 2026-W19 (May 10c) — Built competitor-intelligence.ts (I1)

- **BUILT — `scripts/competitor-intelligence.ts`:** 3-stage competitor intelligence pipeline. Stage 1: SerpAPI fetches real SERP rankings for top TCA keywords (from `analysis.json`) → finds URLs actually outranking TCA, not hardcoded competitor list. Stage 2: Firecrawl crawls those URLs for full markdown content. Stage 3: Claude Haiku generates specific content gap findings per TCA page. Outputs `data/competitors/intelligence.json` + wiki competitor-landscape page.
- **ACTIVATED:** `SERP_API_KEY` and `FIRECRAWL_API_KEY` configured in `.env` and GitHub Actions secrets. Free tiers: SerpAPI 250 credits/month (~23/run), Firecrawl 500 pages/month.
- **`package.json`:** Added `competitor:intelligence` script (`npm run competitor:intelligence`).
- **Cost controls:** Max 8 keywords/run, max 12 competitor URLs — estimated ~$1–3/month.
- **Does NOT replace `competitor-monitor.ts`:** The old script still runs Monday for lightweight metadata checks. This runs monthly for deep content gap analysis.

## 2026-W19 (May 10b) — Friday branch bug fix + weekly plan C1/C2

- **CRITICAL BUG FIXED — friday.yml reads stale plan:** Added `ref: staging` to `actions/checkout@v4`. Friday was checking out `main` — every week it read the previous Saturday's plan, not Wednesday's new one. Generated page failed Layout validation → `CONTENT_WRITTEN=false` → zero pages published since at least Apr 17. Added `::warning::` step for `CONTENT_WRITTEN=false` runs — was silently green, now visible in GitHub Actions.

- **WEEKLY PLAN UPDATED — 2026-05-10:** C1 (Gesture depth expansion REWRITE, 3,000+ words, first-person voice, 80+ quality gate), C2 (Leap Plus "almost bought" reframe REWRITE), and shoulder pain new content page added. These are the highest-priority deferred items from the May 9 audit.

- **DEFERRED — C3 + I1:** L3/L5 differentiation (C3) queued for next weekly plan. SERP API + Firecrawl competitor intelligence (I1) queued as a separate build session.

## 2026-W19 (May 10) — Combined audit implementation (14 fixes, 5 deferred)

- **CONTEXT:** Two-auditor forensic audit (CLAUDE-SONNET-4-6 + CODEX) completed 2026-05-09. Adjudicated score 6/10. 21 findings across workflow bugs, data integrity, agent safety, SEO, and content. Full implementation status in `wiki/pages/concepts/audit-implementation-2026-05-10.md`.

- **CRITICAL FIX — friday.yml force-push:** `CONTENT_WRITTEN != 'true'` failure path was pushing to `main --force`. Changed to `staging --force`. This ran every Friday content generation failed — how long this was live is unknown. Now fixed.

- **DATA INTEGRITY RESTORED — deviceSplit + dailyTrend:** `latest.json` was missing both keys (partial previous pull). Re-ran `gsc:pull --force`. Both modules now non-null in analysis.json: `siteTrend` = impressions up 29.1% WoW, `deviceIntelligence` = non-null.

- **DATA INTEGRITY — URL canonical normalization:** `gsc-analyze.ts` now normalizes all URLs to trailing-slash form and merges duplicate entries (e.g. `/gesture/` + `/gesture`) before scoring. Was creating phantom cannibalization and split opportunity scores.

- **DATA INTEGRITY — Freshness guards:** `gsc-pull.ts` now skips redundant pulls if `latest.json` < 72h old (with `--force` override). `gsc-analyze.ts` now warns if `latest.json` > 72h old before generating analysis.

- **DATA INTEGRITY — Junk query filter:** `detectCTRLeaks()` now suppresses entity-mismatched queries (knee brace, wheelchair, etc.) before scoring. "Steelcase knee brace review" was inflating CTR leak scores.

- **AGENT SAFETY — Voice check in index-monitor.ts:** `fixPage()` now rejects generated fixes containing first-person testing voice on non-Gesture pages before writing. Previously, a bad fix could ship and not be caught until Saturday verify-deploy.

- **AGENT SAFETY — Voice patterns expanded:** `verify-deploy.ts` NON_GESTURE_VOICE_PATTERNS expanded from 3 to 6. Now catches "I found/discovered/noticed", "during my review/testing", generic "I tested it".

- **AGENT SAFETY — Failed draft archival:** `execute-content.ts` now saves quality-gate rejections to `raw/content-rejected/` before discarding. Previously lost with no inspection path.

- **STRATEGY HARDENING — Plan validation upgraded:** `strategy.ts` now throws a hard error (writes `reports/plan-debug-malformed.md`, logs to wiki) when zero parseable tasks found. Was a `console.warn()` that still wrote the broken plan to disk.

- **SEO — Author page:** Removed from sitemap (`astro.config.mjs`). Removed relative `canonical="/about/"` prop (Layout.astro now derives correct absolute canonical). Was simultaneously noindex + canonicalized to /about/ + in sitemap — three contradictory signals.

- **SEO — Freshness drift:** `best-office-chairs.astro` visible date + Byline `updatedDate` aligned to 2026-05-07, matching schema `dateModified` and sitemap `lastmod`. Was 4-way inconsistency.

- **SEO — Cornell cluster fix:** `knee-pain-seat-depth.astro` title + H1 now include "Cornell Ergonomics Rule". Added verdict box with the rule definition. 165 impressions at pos 8, 0% CTR on cornell queries — was mismatching searcher intent.

- **SEO — size-guide orphan resolved:** `/chairs/herman-miller-aeron/size-guide/` now linked from both the aeron hub page (Detailed Guides grid) and the aeron-size-c review page. Was completely orphaned.

- **DECISION — F2 smart quotes confirmed non-issue:** Codex flagged execute-fixes.ts lines 64-67. Inspection confirmed these are intentional: they are the search patterns inside regex character classes that match and replace curly quotes. No change needed.

- **DEFERRED — Content investment (C1-C3):** Gesture review depth expansion, Leap Plus reframe, L3/L5 role differentiation. All require agent REWRITE tasks in upcoming weekly plans. Gesture review is highest priority — 2,589 impr at pos 8.2, 3 clicks, 0.12% CTR. *(The "304 impr at pos 1, 8.33% CTR" figure was a data corruption artifact from the mergeCanonicalDuplicates bug — corrected 2026-05-10.)*

- **DEFERRED — SERP API + Firecrawl pipeline (I1):** Data integrity fixes are now complete (prerequisite met). Pipeline can be built next. Monthly cadence, ~$1-3/month API cost.

- **DEFERRED — Reddit pipeline injection into strategy.ts:** User confirmed current March 2026 Reddit data is still valid. Deferred indefinitely until data needs refreshing.

- **NOT IMPLEMENTED — GSC pagination (I2), GA4 affiliate tracking (I3), wiki concept page consolidation (I4):** Low priority, no urgency.

## 2026-W19 (May 9d) — GSC data gap audit + gsc-analyze.ts architecture decision

- **FINDING — Queries and pageQueries data is never read:** `gsc-pull.ts` collects 200 queries and 427 page+query combos every Monday. Every agent ignores them entirely. Strategy agent only reads `pages.slice(0,5)`. Audit agent only reads `pages` sorted by impressions. This means the richest signal in the data (query intent, query-to-page mapping, CTR per query) never reaches Claude.
- **FINDING — Device dimension not collected:** The GSC API supports `['device']` and `['page', 'device']` dimensions. Neither is in `gsc-pull.ts`. Mobile/desktop CTR split, which can vary 10-30× on SERP-feature-heavy queries, is completely invisible to the pipeline.
- **FINDING — No date-level data:** Week-over-week trend and velocity detection not possible without `['date']` dimension. Only 90-day aggregates are available.
- **FINDING — Cornell cluster is the single highest-leverage fix on the site right now:** 6 query variants of "cornell ergonomics chair seat depth [two fingers / 2-3 fingers / 2 inches] behind knees" → 165 combined impressions at avg pos 8.9 on `/knee-pain-seat-depth/` → 0 clicks. Title "Seat Depth & Knee Pain: The Fix for Tall People" mismatches the query intent (researcher wants the Cornell rule specifically, not a "pain fix"). This has been true for weeks and no agent has flagged it because none read `pageQueries`.
- **FINDING — AIO diagnostic pattern:** `/chairs/steelcase-gesture/seat-depth/` at pos 4.2 for "steelcase gesture seat depth range inches" (23 impr, 0 CTR). Title already has the exact spec numbers — this is not a meta problem. Pattern = AI Overview consuming the answer above organic results. Fix: restructure content for AIO citation, not title rewrite. This diagnostic is only reachable with query-level data.
- **DECISION — Build `gsc-analyze.ts` as Monday step after `gsc-pull.ts`:** Script reads `data/gsc/latest.json`, groups query variants by intent cluster (normalized, stemmed), identifies CTR leaks with their specific query context, flags AIO pattern (pos ≤ 6, 0 CTR, spec-type query), and writes to `data/gsc/analysis.json` + `wiki/pages/concepts/gsc-analysis-strategy.md`. Strategy agent already reads this concept page directory via `readConceptContext()` — zero other agent changes needed. This converts vague "optimize this page" signals into specific fix instructions with the exact query driving the problem.
- **DECISION — Expand `gsc-pull.ts` with 3 new dimensions:** `['device']` (site-wide device split), `['page', 'device']` (per-page device CTR), `['date']` (daily data for trend analysis). These are additional API calls on the existing Monday pull — no new workflow step needed.
- **NOT DECIDED YET — Exact query clustering algorithm:** Options are TF-IDF similarity, simple word-overlap threshold, or LLM-based grouping via Claude Haiku. To be determined during implementation. LLM grouping is most accurate but adds cost; word-overlap is free and probably sufficient for a 200-query dataset.

## 2026-W19 (May 9c) — Pipeline bug fixes from full system audit (8 fixes)

- **FIX — audit.ts meta description regex:** Changed `(.*?)` to `([^"]*)`. The lazy quantifier stopped at apostrophes in `6'4"` content, truncating descriptions and producing false audit flags. Decision: always use negated char class `[^"]` when matching attribute values bounded by double quotes.
- **FIX — execute-content.ts overwrite guard:** `writeNewPage()` now skips (returns SKIPPED) if the target file already exists. Previously a strategy agent slug collision would silently destroy a live page. Decision: existing pages must go through REWRITE task type, not NEW CONTENT.
- **FIX — AMAZON_URL placeholder detection:** Added `href="AMAZON_URL` check to both `validateAstroFile()` and `checkAffiliateLinks()`. Template placeholder was invisible to the affiliate link checker (which only scans amazon.com URLs). Decision: both generation-time and deploy-time checks now catch this.
- **FIX — competitor-monitor.ts gap deduplication:** `## Recent Competitor Gaps` section is now fully replaced (section slice + rewrite) instead of prepended. Old logic accumulated duplicate rows every Monday run indefinitely. Decision: whole-section replacement is the correct pattern for rolling wikis.
- **FIX — strategy.ts plan validation:** Added post-generation parse check. If plan has section headers but zero pipe-delimited task rows, a WARNING is logged with raw plan preview. Decision: empty plans should be loud, not silent.
- **FIX — verify-deploy.ts Saturday summary:** Added system prompt (factual, terse, trend-aware) and prior-week GSC stats injection from wiki history. Decision: no-system-prompt Claude calls produce generic, low-value output — always set context for weekly summaries.
- **FIX — tca-audit.md memory path:** Was pointing to wrong directory (`/Downloads/Claude TCA Workspace/`) and wrong agent name (`tca-seo-strategist`). Corrected to `/Downloads/Claude-Projects/PROJECTS/Claude TCA Workspace/.claude/agent-memory/tca-audit/`.
- **FIX — tca-audit.md Python regex:** `["\'\]` pattern had backslash before `]` making the character class unterminated — would raise `re.error` at runtime. Fixed to `["\']\s+` (unescaped `]` closes the class).

## 2026-W19 (May 9b) — Saturday workflow: stale GSC data + main overwrite

- **ROOT CAUSE — Agents using stale GSC data:** Monday's `gsc-pull.ts` commits fresh `data/gsc/latest.json` to `main`. Saturday workflow checked out `staging` — which was behind main — so all agents read the previous week's GSC snapshot. Fix: merge `origin/main` into staging immediately after checkout, before any agent or build step runs.
- **ROOT CAUSE — Manual main fixes being overwritten weekly:** Saturday used `--force-with-lease` to push staging → main. Any fix committed directly to main (not via staging) would survive until Saturday, then be silently erased. The upfront merge of main into staging eliminates this — staging is now a superset of main before the push, so a regular non-force push is safe and correct.
- **Decision:** Saturday workflow now follows: checkout staging → merge main → npm ci → build → lint → agent → commit + push. No force on final push.

## 2026-W19 (May 9) — Agent reliability audit + deep fixes

- **AUDIT FINDING — execute-fixes.ts full-file rewrite was root cause:** Every meta/title fix regenerated the entire Astro file. Title and description are just string literals on the `<Layout>` tag — no full-file rewrite needed. Full-file approach introduced em-dash bleed, structural regressions, and word count drops. **Decision:** Added targeted edit mode. `classifyFix()` detects meta/title tasks and routes them to `applyTargetedFix()` which generates only the changed value and applies it via `applyLayoutPropReplace()` — a regex replacement scoped to the Layout opening tag in the HTML section. Frontmatter is never touched for these tasks.
- **AUDIT FINDING — execute-content.ts example truncation caused missing Layout wrapper:** `getExamplePage()` read `gesture.astro` and truncated to 3000 chars. The gesture frontmatter is ~130 lines of schema JSON — 3000 chars doesn't reach `<Layout>`. Claude wrote correct frontmatter then fell back to raw HTML. **Decision:** Replaced with `buildTemplate(slug)` — a purpose-built compact template showing every structural element (verdict box, citation capsule, affiliate CTA, FAQ, `<Layout>...</Layout>`) regardless of content length. Also added `getImportPrefix(slug)` to correctly calculate `../layouts/` vs `../../layouts/` by slug depth.
- **AUDIT FINDING — execute-content.ts had no retry:** One bad generation = zero content that week. **Decision:** Added one retry with the specific validation failure reason injected back into the prompt.
- **AUDIT FINDING — strategy.ts REWRITE format silently broken:** Template showed 3 pipe-separated fields; parser regex requires 4. All REWRITE tasks from the strategy agent were silently dropped unless Claude happened to add a 4th field. **Decision:** Fixed template comment to show correct 4-field format.
- **AUDIT FINDING — Thursday workflow all-or-nothing build:** One bad file blocked all fixes from committing. **Decision:** Added per-file rollback to `thursday.yml` — identifies failing `.astro` from build error output, rolls back just that file, commits the rest.
- **AUDIT FINDING — wiki/index.md summaries were stale:** Entity row text stuck at March/April numbers. Underlying `gsc-performance.md` concept page was current (updated by Tuesday audit agent). **Decision:** Updated index summaries to current data. Index.md summary rows are now clearly labeled with dates to prevent silent staleness.
- **Cost analysis:** Weekly API cost ~$3–5/month. Rebuilding to use Claude Code CLI or a second Claude Pro account ($20/month) is not justified — API approach is correct architecture for automation.

## 2026-W19 (May 7) — Thursday build failure recovery + weekly plan execution

- **BUILD FAILURE DIAGNOSED AND FIXED:** Thursday `execute-fixes.ts` wrote a Claude-generated `.astro` file with an em dash (U+2014) in a JavaScript expression context inside the HTML template (not a string). esbuild emits `Unexpected "—"` — the character is a valid JS string value but not a valid token in expression position. Build failed; CI aborted before the commit step, so repo was clean.
- **Root cause:** The fix prompt for `/knee-pain-seat-depth/` asked only for a title + meta change, but the agent regenerated the entire file. Claude introduced something like `{...—...}` in the template. The underlying write was not validated before esbuild ran.
- **Fix applied to `execute-fixes.ts`:**
  1. `sanitizeFrontmatter()` — parses the `---...---` frontmatter block, replaces `—` → `—`, `–` → `–`, curly quotes → straight quotes before writing. HTML template section is not touched. This is a safety net for the frontmatter JS block where any non-ASCII token is fatal.
  2. System prompt rule — explicit instruction: "FRONTMATTER ONLY: Use only ASCII characters between the --- markers. Never use em dashes, curly quotes, or other Unicode characters directly in the JavaScript frontmatter."
- **Decision:** The deeper fix (validating generated output with a syntax checker before writing) is deferred — `sanitizeFrontmatter()` covers the most common failure mode. The `validateAstroFile()` function in `execute-content.ts` already checks for "bare English operators in JS" — consider adding equivalent check to `execute-fixes.ts` in a future hardening pass.
- **All Thursday weekly-plan tasks executed manually:** 5 FIX tasks + 1 REWRITE. See log entry 2026-05-07 for full details. Note: `/review/gesture/` and `/aeron-vs-gesture/` redirects were already live in `_redirects` — confirmed no duplicate needed.
- **Pages updated today:** `/review/aeron-size-c/` (meta), `/chairs/steelcase-gesture/` (meta), `/knee-pain-seat-depth/` (title + meta), `/best-office-chairs/` (affiliate links in verdict table).

## 2026-W19 (May 6) — manual session + pipeline repair

- **First commission:** $18 on May 1 from Amazon affiliate. Validated full funnel. **CORRECTED (May 6):** Commission came from /knee-pain-seat-depth/, not /review/gesture/ — confirmed via GSC click data for May 1. This was a pain-pillar educational page, not a review. The page embeds two Amazon CTAs (Leap Plus + Gesture). Visitor arrived problem-aware ("knee pain from office chair"), read the seat depth analysis, and clicked through to buy. Implication: pain-pillar pages have real conversion potential, not just topical authority value.
- **GSC trajectory confirmed:** 4,443 → 12,209 impressions over 4 weeks (90-day rolling). Clicks 10 → 29. Position 14.3 → 11.5. Not a fluke — consistent weekly improvement.
- **CRITICAL BUG FIXED — Thursday cooldown:** `thursday.yml` used `actions/checkout@v4` without `fetch-depth: 0` (shallow clone). `git log -1 --format=%ai` always returned today's date for every file → `daysSinceLastEdit()` always returned 0 → every page permanently locked at "edited 0d ago." 3 weeks of zero fixes directly caused by this. Fix: added `fetch-depth: 0` to thursday.yml checkout.
- **CRITICAL BUG FIXED — Friday silent failure:** Strategy agent formats plan slugs with Markdown backticks (e.g. `` `/slug/` ``). Backticks survived into `task.slug`, corrupting file paths. Pages were written to invalid paths → `CONTENT_WRITTEN` stayed false → commit step skipped → content lost silently for 3 weeks. Fix: strip backticks from parsed slug/keyword in `execute-content.ts`. Also added: validation failure logging, always-commit content-log.md step on failure so errors are visible.
- **Local workspace was 12 commits behind remote** — agents had been running correctly all along. Workspace just needed `git pull`.
- **SERP suppression conclusion reassessed:** April 22 finding (AI Overviews + carousels = root CTR cause) is still valid for specific query types. But "meta rewrites won't help" was overgeneralized. Review/comparison pages (gesture, leap-plus, aeron-size-c) are on editorial SERPs without carousels — meta rewrites are valid there. Thursday fixes now correctly target these pages.
- **Decision:** `what-works.md` updated with post-April growth data. `thesis.md` updated with current state and revised priorities.
- **PIPELINE IMPROVEMENT — CRITICAL threshold bypass:** `execute-fixes.ts` now loads GSC data at runtime and detects CRITICAL pages (400+ impr, pos ≤10, 0 clicks). These pages use a 7-day minimum cooldown instead of 14-day. Technical fixes still bypass both. The 14-day rule protects ranking signals — but a page with literally 0 clicks has no signal to protect, so the full wait was wasteful.
- **PIPELINE IMPROVEMENT — Richer content prompt:** `execute-content.ts` system prompt now mandates 5 structural elements on every generated page: verdict box, answer-first opening, standalone citation capsule, 2-CTA affiliate block, FAQ section + FAQPage schema. Previous prompt specified these loosely; now they're explicit requirements.
- **PIPELINE IMPROVEMENT — Quality gate:** `execute-content.ts` now runs a second Claude call (Haiku 4.5) after generation to score content 0-100 against the 5 structural criteria. Pages scoring below 80 are rejected before writing to disk. Enforces the 80+ gate that was only aspirational in the strategy prompt before.
- **Decision:** These three changes do not conflict with the May 8 CTR test (meta rewrites on review pages) — the CRITICAL bypass only fires on 0-click pages, and the content changes only affect new pages.

## 2026-W15 (Apr 7 – Apr 13)

- **Automation system hardened:** 7 blind spots identified by GPT review, all fixed in one commit
- **Fix 1 (voice):** One remaining voice violation fixed in `/chairs/steelcase-leap-plus/index.astro` ("every other chair I tested seriously" → "every other chair evaluated for this height range"). All other author/about/llms.txt/height-guide pages were already clean.
- **Fix 2 (competitors):** Replaced 4 competitor URLs (RTINGS, Ergonomic Trends, OfficechairPicks, Wirecutter kept) with 5 verified URLs. Added `dead: boolean` tracking through interface → output JSON → wiki log.
- **Fix 3 (audit history):** Replaced wholesale `writeWikiPage()` overwrite of `gsc-performance.md` with read-preserve-append logic. Max 8 historical snapshots retained on each run.
- **Fix 4 (deploy checks):** Added 3 new verify-deploy checks: `checkSchemaValidity()` (JSON-LD parse), `checkInternalLinks()` (broken hrefs), `checkContentRegression()` (>15% word count drop).
- **Fix 5 (word count guard):** execute-fixes.ts now rejects any Claude-generated file where word count drops >15% from original.
- **Fix 7 (edit cadence):** strategy.ts now injects recently-edited pages list (21-day window) and impression thresholds into Claude prompt. execute-fixes.ts now enforces 14-day cooldown on non-technical fixes.
- **Decision:** Edit cadence policy codified — technical fixes anytime; CTR/meta changes require 14-day cooldown; impression thresholds: <100=noise, 100-300=technical only, 300+=CTR changes OK, 400+@pos≤10+0clicks=CRITICAL.

## 2026-W14 (Mar 31 – Apr 6)

- **Audit score:** 89/100 (+3 from Mar 30)
- **Fixed:** 7 issues from prior audit (404, meta lengths, sitemap priorities, og:type, internal links)
- **Identified:** CTR crisis is the #1 problem — 0.29% avg CTR across ~4,100 impressions
- **Prescribed:** Verdict-first meta rewrites for 3 pages (NOT YET IMPLEMENTED)
- **Prescribed:** Height-bracket verdict table for /best-office-chairs/ (NOT YET IMPLEMENTED)
- **New signal:** "steelcase gesture review independent" query emerging (11 impr, pos 8.91)
- **Decision:** All previously unindexed pages submitted to GSC → confirmed indexed by Apr 5
- **Decision:** Automation system designed (AUTOMATION-SYSTEM.md) for weekly agent pipeline
- **ARCHITECTURE: LLM Wiki system implemented.** 22 wiki pages created from ~35 scattered workspace files. 3-layer pattern: raw/ (immutable sources), wiki/ (LLM-maintained knowledge), SCHEMA.md (operating rules). All 6 automation agents wired to read/write wiki. Wednesday strategy agent now gets compiled multi-week history instead of just last week's raw data. Wiki + raw moved inside git repo for CI access. Obsidian vault configured with graph view, color groups, and symlinks for browsing.

## 2026-W13 (Mar 24 – Mar 30)

- **Audit score:** 86/100
- **Fixed:** gesture review meta (171→146), leap-plus seat-height meta (166→133)
- **Identified:** 404 on /leap-plus/weight-limit/, og:type wrong on 3 pages, sitemap priority wrong on height pages
- **Decision:** Sitemap priority for height pages raised to 0.8

## 2026-W12 and earlier (Mar 2 – Mar 23)

- **Site launched:** ~Jan 2026
- **Phase 1 (Foundation):** All chair clusters created, comparison pages expanded, E-E-A-T foundation (about page, bylines, Person schema)
- **Phase 2 (Expansion):** Aeron + Leap Plus clusters, FAQ schema, Quick Answer boxes
- **Blog audit (Mar 19):** 37 pages, avg score 71/100
- **GEO analysis (Mar 16):** Score 71/100, identified citation capsules and passage blocks as gaps
- **Multiple SEO audits:** Mar 2, 8, 12, 15, 16, 17, 19 — iterative improvement cycle

---

## 2026-W18 (2026-05-02)

- **Deploy:** Passed
- **GSC:** 23 clicks, 8455 impr, pos 12.6
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W17 (2026-04-25)

- **Deploy:** Passed
- **GSC:** 19 clicks, 7096 impr, pos 13.2
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W16 (2026-04-18)

- **Deploy:** Passed
- **GSC:** 12 clicks, 5590 impr, pos 13.6
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W16 (2026-04-13) — CI/CD repair + new content

- **Deploy:** Passed (Saturday, after multiple failures and manual repairs)
- **GSC:** 12 clicks, 5590 impr, pos 13.6
- **New page created:** `/chairs/herman-miller-aeron/size-guide/` — "Aeron Size B vs Size C for tall people." Planned by Wednesday agent; Friday agent generated the file with invalid JS (`and` used as a JS operator in frontmatter), breaking the build. File was rewritten manually and committed.
- **Root cause of Friday failure:** `execute-content.ts` wrote a Claude-generated file without validating its syntax. The esbuild error `Expected "}" but found "and"` was a bare English word in a JavaScript expression. Build failed → commit step skipped → file never pushed. System behaved correctly (no bad file shipped) but content was lost.
- **Fixes applied to CI pipeline (all committed):**
  1. `execute-content.ts` — added `validateAstroFile()` pre-write check (frontmatter fences, Layout wrapper, bare `and`/`or` in JS); hardened system prompt with explicit Astro syntax rules
  2. `saturday.yml` — reordered steps: build now runs BEFORE verify-deploy (was after — caused schema check to always fail with "dist/ not found")
  3. `saturday.yml` — added `fetch-depth: 0` so `git diff HEAD~1` works for content regression check
  4. `saturday.yml` — final push now goes to both `staging` and `main`
  5. `friday.yml` + `thursday.yml` — added `lint:content` step before commit
  6. `friday.yml` + `thursday.yml` — push now goes to `staging` (not directly to `main`)
  7. `verify-deploy.ts` — internal link checker now skips root-level static files (`.png`, `.ico`, `.svg`, etc.) — was incorrectly flagging favicons as broken links and blocking every Saturday deploy
  8. `package.json` — added missing `lint:content` script entry
  9. `scripts/lint-content.mjs` — committed (was untracked)
- **Decision:** `staging` branch is now the deploy target for all weekly agents. Saturday is the only step that merges `staging → main`. This was already the intended design but wasn't enforced in the committed workflow files.
- **Decision:** Friday agent now validates generated files before writing to disk. Invalid files are skipped with `success: false` — `CONTENT_WRITTEN` stays `false`, build is never attempted, pipeline is clean.



*Append new entries at the top. Each week's entry should note: what was done, what was decided, what was deferred, and any surprising outcomes.*
