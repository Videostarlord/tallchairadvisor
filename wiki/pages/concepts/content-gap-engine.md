---
type: concept
last_updated: 2026-05-09
sources: [scripts/gsc-analyze.ts, data/competitors/latest.json]
tags: [content, gaps, competitors, keywords]
---

# Content Gap Engine

## Purpose

Identifies topics/queries where competitors rank and TCA doesn't. Combines GSC `clusters` output with `data/competitors/latest.json` to find addressable traffic opportunities.

## Current Gap Detection (Phase 1 — implemented)

The `gsc-analyze.ts` script detects **internal** content gaps:

1. **Pages with buyer-intent queries but no affiliate CTAs** (`affiliateOpportunities[]`) — TCA ranks for commercial queries but doesn't monetize them
2. **Query clusters with 0 CTR despite good position** — TCA has the ranking real estate but the content doesn't convert the intent
3. **Cannibalization conflicts** — topic covered by 2 pages, neither ranks cleanly

## Competitor Gap Detection (Phase 2 — planned)

Cross-reference `gscAnalysis.clusters` against competitor content inventory:

```typescript
// Pseudocode for future gsc-analyze.ts addition
const competitorKeywords = extractKeywordsFromCompetitorPages(competitorData);
const tca_clusters = new Set(gscAnalysis.clusters.map(c => c.representativeQuery));

const gaps = competitorKeywords.filter(kw =>
  !tca_clusters.has(kw) &&
  estimatedSearchVolume(kw) > 100
);
```

## Known TCA Content Gaps (as of May 2026)

| Topic | Gap Type | Evidence | Priority |
|-------|----------|----------|----------|
| Standing desk height for tall people | Missing page | High CPC, no TCA content | High |
| Shoulder pain + ergonomic chair | Missing page | Jackson's real experience | High |
| Best chairs under $500 | Missing affiliate page | Budget segment, no testing claim needed | High |
| Aeron vs Gesture comparison | CTR gap | pos 5, 0 clicks | High |
| Sihoo Doro S300 review | Missing page | Rising in AI citations | Medium |

## Gap Prioritization

Gaps are prioritized by the product of:
- **Search demand estimate** (from GSC impressions for related queries)
- **Revenue potential** (buyer intent × commission rate)
- **Content effort** (first-person testing not required = lower barrier)
- **Competitive difficulty** (thin competition = faster ranking)

## Integration Point

The content gap engine feeds `strategy.ts` via the `competitors.analysis.gaps` array (from `competitor-monitor.ts`) and the `gscAnalysis.affiliateOpportunities` array (from `gsc-analyze.ts`).

When both sources point to the same gap, it's elevated to CRITICAL priority in the weekly plan.
