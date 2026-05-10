---
type: concept
last_updated: 2026-05-10
sources: [scripts/gsc-analyze.ts, scripts/gsc-pull.ts]
tags: [gsc, intelligence, architecture, pipeline]
---

# GSC Intelligence System

## Overview

The GSC intelligence system transforms raw Search Console data into compressed, ranked intelligence consumed by downstream agents. It runs every Monday in two stages.

## Data Flow

```
Monday workflow:
  1. gsc-pull.ts      → data/gsc/latest.json     (raw: pages, queries, pageQueries, deviceSplit, dailyTrend)
  2. gsc-analyze.ts   → data/gsc/analysis.json   (intelligence: ranked leaks, opportunities, clusters)
                      → data/gsc/history/YYYY-MM-DD.json (16-week archive)
                      → wiki/pages/concepts/gsc-intelligence.md (agent-readable digest)

Tuesday:
  audit.ts            ← reads analysis.json for per-page query context injected into Claude prompt

Wednesday:
  strategy.ts         ← reads analysis.json for structured intelligence block in strategy prompt
```

## What `latest.json` Contains

| Field | Rows | Used By |
|-------|------|---------|
| `pages[]` | ~46 | audit.ts, strategy.ts, gsc-analyze.ts |
| `queries[]` | 200 | gsc-analyze.ts |
| `pageQueries[]` | ~427 | gsc-analyze.ts (primary input for all analysis) |
| `deviceSplit[]` | ~150 | gsc-analyze.ts → device intelligence |
| `dailyTrend[]` | ~90 | gsc-analyze.ts → velocity computation |

## What `analysis.json` Contains

| Field | Description |
|-------|-------------|
| `ctrLeaks[]` | Top 30 page-query pairs where actual CTR << expected CTR, sorted by leakScore |
| `opportunities[]` | All pages ≥30 impr scored and typed (near-p1, ctr-leak, content-depth, affiliate-capture) |
| `clusters[]` | Semantic query clusters grouped by 3-gram fingerprint, sorted by opportunityScore |
| `cannibalization[]` | Multi-page conflicts where the same normalized query ranks from 2+ pages |
| `affiliateOpportunities[]` | Pages with buyer-intent query traffic but low CTR |
| `siteTrend` | Week-over-week velocity (impressions, clicks, position delta) |
| `deviceIntelligence` | Mobile vs desktop CTR gap + underperforming pages |
| `executiveSummary` | Pre-computed string summaries for agent prompt injection |

## Scoring Formulas

### CTR Leak Score
```
leakScore = CTR_gap * impressions * intent_value
CTR_gap   = expectedCTR(position) - actualCTR
intent_value: buyer=3.0, brand=2.0, spec=1.5, informational=1.0
```

### Opportunity Score (by type)
```
near-p1:          (impressions / position) * 2
ctr-leak:         sum(leakScore) for all leaks on this page
content-depth:    impressions * 0.5
affiliate-capture: buyerIntentImpressions * 1.5
```

### AIO Suspect Detection
```
aioSuspect = position ≤ 6 AND actualCTR < 0.5% AND query contains spec/how-to terms
```

## Expected CTR Benchmarks

| Position | Expected CTR |
|----------|-------------|
| 1 | 35% |
| 2 | 18% |
| 3 | 12% |
| 4 | 8% |
| 5 | 6% |
| 6 | 4% |
| 7 | 3% |
| 8–10 | 2–2.5% |
| >10 | ~1.5% |

## File Locations

| File | Purpose |
|------|---------|
| `scripts/gsc-pull.ts` | GSC API pull — raw data collection |
| `scripts/gsc-analyze.ts` | Intelligence engine — transforms raw to structured |
| `data/gsc/latest.json` | Current raw pull |
| `data/gsc/analysis.json` | Current intelligence output |
| `data/gsc/history/` | 16-week archive of analysis.json snapshots |
| `wiki/pages/concepts/gsc-intelligence.md` | Weekly agent-readable digest (auto-generated) |

## Known Bugs / Fix History

### 2026-05-10 — `mergeCanonicalDuplicates` collapsed all pageQuery rows per page

**Bug:** `mergeCanonicalDuplicates()` was called on `gsc.pageQueries` using only `normalizeUrl(row.page)` as the map key. Because every page-query pair shares the same page URL, all queries on a given page were collapsed into a single row — summing their impressions and taking the minimum position across all queries. The first query encountered for that page became the surviving row's `query` field.

**Symptom:** `analysis.json` showed `"steelcase gesture review"` in `ctrLeaks` with `impressions: 304` (sum of all 46 queries on `/review/gesture/`) and `position: 1` (best position across all those queries). Actual raw GSC values: 12 impressions, position 49.9. The query was below the 15-impression and ≤20-position filters and should have been absent from leaks entirely. The `leakScore` was also inflated because it multiplied the wrong impression count.

**Secondary symptom:** The stored row's `page` field was set to `key` (the map key), so after adding the compound key fix, page fields in leak records contained `"page|query"` strings until corrected.

**Fix (2026-05-10):**
- Added optional `keyFn` parameter to `mergeCanonicalDuplicates<T>()`. When provided, the map key is `keyFn(row)` instead of `normalizeUrl(row.page)`.
- The stored row's `page` field now always uses `normalizeUrl(row.page)` regardless of `keyFn`.
- The `pageQueries` call now passes `pq => \`${normalizeUrl(pq.page)}|${pq.query}\`` as `keyFn`, so each page+query pair deduplicates independently (only trailing-slash variants of the same page+query combo merge).
- `pages` and `deviceSplit` calls are unchanged — they correctly key on page URL only.

**Downstream impact corrected:** The May 10 `decisions-log` entry "DEFERRED C1 — Gesture review highest priority — 304 impr at pos 1, 8.33% CTR vs 35% expected" was based on this corrupted data. Actual "steelcase gesture review": 12 impressions, position 49.9, 8.33% CTR (1/12 clicks = real). The Gesture review page's real GSC profile: 2,589 impressions at position 8.2, 3 clicks (0.12% CTR). Content depth expansion remains the right call, but the CTR leak framing was wrong.
