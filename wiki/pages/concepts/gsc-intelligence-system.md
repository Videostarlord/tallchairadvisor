---
type: concept
last_updated: 2026-05-09
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
