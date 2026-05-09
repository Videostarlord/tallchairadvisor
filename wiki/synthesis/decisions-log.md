---
type: synthesis
last_updated: 2026-05-09
tags: [decisions, history]
---

# Decisions Log

A rolling record of key strategic decisions and their outcomes. The most valuable RAG source for the automation agents — before making a new strategy, query this first.

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
