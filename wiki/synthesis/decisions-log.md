---
type: synthesis
last_updated: 2026-04-06
tags: [decisions, history]
---

# Decisions Log

A rolling record of key strategic decisions and their outcomes. The most valuable RAG source for the automation agents — before making a new strategy, query this first.

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
