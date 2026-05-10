# Data Pipeline Audit
Model: CODEX
Timestamp: 2026-05-09T19-30-17-0700

## Core Verdict
The data layer is the most important part of the "intelligent SEO engine" claim, and it is not strong enough yet.

The system collects some useful data. It does not yet transform that data with enough rigor to justify autonomous content changes.

## Facts
- `data/gsc/latest.json` at audit time:
  - `pulledAt`: `2026-05-04T10:18:17.753Z`
  - keys present: `pulledAt`, `dateRange`, `totals`, `pages`, `queries`, `pageQueries`
  - keys missing relative to current `scripts/gsc-pull.ts`: `deviceSplit`, `dailyTrend`
- `data/gsc/analysis.json` at audit time:
  - `generatedAt`: `2026-05-10T00:59:37.875Z`
  - built from a stale May 4 raw pull
- `data/gsc/history/` currently contains only one snapshot: `2026-05-10.json`
- `raw/gsc/` contains multiple weekly archived JSONs:
  - `gsc-2026-04-06.json`
  - `gsc-2026-04-13.json`
  - `gsc-2026-04-20.json`
  - `gsc-2026-04-27.json`
  - `gsc-2026-05-04.json`
- `data/competitors/latest.json` is built from 5 competitor URLs and contains page metadata plus an LLM summary.
- Reddit is a separate manual pipeline:
  - `scripts/reddit-fetch.ts`
  - `scripts/reddit-normalize.ts`
  - `scripts/reddit-summarize.ts`
- Analytics implementation in `src/layouts/Layout.astro` is GA4 pageview setup only.

## What Data Is Collected

| System | Collected now | Where |
|---|---|---|
| GSC raw | totals, pages, queries, pageQueries | `data/gsc/latest.json` |
| GSC archive | weekly raw json snapshots | `raw/gsc/` |
| GSC analysis | opportunity heuristics, leaks, clusters, affiliate opportunities | `data/gsc/analysis.json` |
| Competitors | title, meta, H1, H2s, word count, schema types | `data/competitors/latest.json` |
| Reddit | raw items, normalized evidence, summarized owner insights | `data/reddit/` |
| Reports | audit text, plan text, fix log, summary | `reports/` |
| Wiki memory | concept pages, synthesis, entity pages | `wiki/` |

## What Data Is Ignored Or Underused
- GSC data is still too truncated:
  - queries capped at 200
  - page-query rows capped at 500
  - no pagination
- No canonical URL normalization before analysis.
- No search-appearance dimension.
- No page-by-date or query-by-date history table.
- No SERP feature capture in raw data.
- No affiliate click event data.
- No revenue attribution per page.
- No impression-to-click-to-Amazon funnel measurement.
- Competitor monitor collects no rankings, keyword sets, or backlink context.

## What Data Is Duplicated
- GSC history exists in both:
  - `raw/gsc/*.json`
  - `data/gsc/history/*.json`
- System state is duplicated across:
  - `reports/*.md`
  - `raw/audits/*.md`
  - `wiki/pages/concepts/*.md`
- Some strategic conclusions are duplicated in:
  - `wiki/synthesis/*`
  - `raw/strategy/*`
  - manual audit files

## What Data Is Stale
- `data/gsc/latest.json` is stale relative to the audit date.
- `data/gsc/analysis.json` was regenerated later than the raw pull, not from a fresh pull.
- `reports/weekly-plan.md` is dated `2026-04-14`, while other reports are from May.
- `SESSION-SUMMARY.md` and `MANUAL-TODOS.md` are historical artifacts but still sit near the operational root.

## What Data Is Too Raw For Agents
- Raw GSC queries without:
  - entity filtering
  - canonical URL normalization
  - junk-query suppression
  - intent sanity checks
- Competitor HTML metadata without SERP evidence.
- Reddit evidence without integration into ranking or conversion decisions.

## What Data Should Be Compressed Into Intelligence Summaries
- Canonicalized page-query opportunity queue
- Per-page dominant intent and off-intent leakage
- weekly delta tables:
  - impressions
  - clicks
  - CTR
  - position
- device split deltas
- internal link recommendation queue
- monetization opportunity queue

## What Should Feed Each Agent

### Strategy agent
Should receive:
- normalized page clusters
- top 10 high-confidence opportunities
- trend deltas
- cannibalization with canonicalized URLs only
- page freshness / recency mismatches

### Content agent
Should receive:
- only content gaps with:
  - clear intent
  - no competing internal page
  - confidence threshold
  - recommended supporting internal links

### Technical SEO agent
Should receive:
- sitemap / canonical / robots mismatches
- redirect drift
- noindex/sitemap contradictions
- schema validation queue

## Specific Pipeline Problems

### 1. Raw pull and analysis are out of sync
`data/gsc/latest.json` is from May 4, 2026. `data/gsc/analysis.json` is from May 10, 2026. That means the system can look "fresh" while actually reasoning over stale source data.

### 2. Code and data format are out of sync
Current `scripts/gsc-pull.ts` expects to write `deviceSplit` and `dailyTrend`. Current `data/gsc/latest.json` does not contain them. The code and the state file are describing different pipeline generations.

### 3. URL duplication pollutes analysis
Canonical duplicates in current GSC data:
- `/office-chairs-for-tall-people/` and `/office-chairs-for-tall-people`
- `/review/gesture/` and `/review/gesture`
- `/aeron-vs-gesture/` and `/aeron-vs-gesture`
- others as well

This creates fake cannibalization, fake leakage, and split opportunity scoring.

### 4. Competitor data is too thin for the confidence level used
Current competitor analysis is basically:
- fetch 5 URLs
- extract page structure
- ask Claude for a strategy summary

That is not a serious competitive intelligence system.

### 5. Analytics logic is underbuilt
The site has pageview analytics, but not business analytics.

Missing:
- affiliate click events
- page-to-CTA conversion rates
- CTA placement testing
- outbound link segmentation
- content-to-revenue attribution

## Assumptions
- GSC is the main and only reliable search-demand source in this repo.
- No external BI stack exists.

## Hypotheses
- The site can scale on file-based storage for a while.
- It cannot scale on heuristic-only intelligence and row-capped pulls.

## Recommendations
1. Treat `data/gsc/latest.json` as invalid unless freshness and completeness checks pass.
2. Canonicalize URL variants before any scoring or clustering.
3. Add pagination to GSC pulls immediately.
4. Split raw and modeled layers cleanly:
   - raw pulls
   - normalized tables
   - intelligence outputs
5. Add outbound affiliate click tracking before adding more content agents.
6. Downgrade competitor monitoring from "intelligence engine" to "supporting evidence feed" until it has rankings or keyword data.
