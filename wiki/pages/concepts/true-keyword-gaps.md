---
type: concept
last_updated: 2026-05-15
sources: [data/keywords/true-gaps.json, data/keywords/raw/2026-05-15T16-05-29-competitor-ranked-keywords.json]
tags: [keywords, gaps, competitors, dataforseo, monthly]
---

# True Keyword Gaps

## Summary

Monthly competitor-gap run using DataForSEO `ranked_keywords/live` against competitor pages surfaced by the Monday SERP + Firecrawl workflow.

Current snapshot:
- **23** competitor pages analyzed
- **302** competitor ranked-keyword rows returned
- **40** queries removed because TCA already ranks for them in GSC
- **225** grouped true keyword gaps remain

The output lives in `data/keywords/true-gaps.json`.

## Main Finding

The biggest missed territory is **big-and-tall / wide / heavy-user adjacency**, not just more of the same tall-person phrasing.

The gap set is dominated by:
- `btod.com`
- `thehumansolution.com`

This means the next growth lane is not random long-tail expansion. It is competitor-owned commercial coverage around:
- big and tall office chairs
- wide-seat / widest chairs
- heavy-user / higher-weight-capacity chairs
- tall chair phrasing adjacent to existing TCA tall-user intent

## Strongest Gap Clusters

### 1. Big-and-Tall Commercial Cluster

Representative queries:
- `best rated big and tall office chair`
- `big tall chairs`
- `ergonomic chair for big and tall`
- `best office chairs for big and tall men`
- `big person office chair`
- `office chair for larger person`
- `widest office chair`
- `big and tall office chairs 400 lbs`

Interpretation:
- This is the clearest adjacent money-page expansion lane for TCA.
- Multiple terms point to the same user need: wider frame, larger body, higher capacity, broader seat.
- These should be clustered into a small number of canonical pages, not treated as separate articles.

### 2. Tall-Chair Commercial Cluster

Representative queries:
- `desk chairs tall`
- `tall ergonomic office chair`
- `tall chair`
- `ergonomic tall desk chair`
- `extra tall desk chairs`
- `tall office chair`

Interpretation:
- TCA already owns some tall-person territory, but competitors are still surfacing on adjacent commercial variants that TCA does not rank for.
- The risk here is cannibalization: these are close to existing tall roundup intent, so page design and internal linking need to be deliberate.

### 3. Chair-Dimensions / Seat-Depth Cluster

Representative queries:
- `chair depth`
- `seat pan depth`
- `office chair seat depth`
- `desk chair dimensions`
- `average chair dimensions`

Interpretation:
- This is a real educational depth opportunity, but it is not a 225-page opportunity.
- TCA should likely deepen the existing dimensions hub rather than fragment it into many thin pages.
- Cornell-style ergonomics sources are strongest in this slice.

### 4. Brand / Accessory Cluster

Representative queries:
- `steelcase gesture office chair`
- `steelcase gesture headrest`
- `gesture headrest`
- `steelcase leap ergo office chair`

Interpretation:
- These are viable only when TCA has a clear page angle.
- Some are too broad or too close to existing review intent to be immediate stand-alone priorities.

## Competitor Pattern

Top competitor domains contributing to the current gap file:
- `btod.com` — 98 appearances
- `thehumansolution.com` — 47 appearances
- `ergo.human.cornell.edu` — 44 appearances
- `thebackstore.com` — 19 appearances
- `creativebloq.com` — 16 appearances
- `boulies.com` — 15 appearances

Interpretation:
- `btod.com` and `thehumansolution.com` are the main commercial models to study.
- Cornell-style ergonomics pages dominate the posture / dimension / seat-depth informational slice.

## What This Does **Not** Mean

- TCA should **not** write 225 new pages.
- The raw gap count is inflated by near-duplicates and phrasing variants.
- The right next step is canonical clustering, not direct content production.

Examples of duplicates that should collapse into the same project:
- `big tall chairs`
- `big and tall chairs`
- `big person office chair`
- `office chair for large person`

## Current Strategic Read

The true-gap run says:
- TCA has already proven relevance on tall-user queries.
- The next expansion lane is **big-and-tall / wide / heavy-user adjacency**.
- The dimensions / seat-depth cluster is a secondary depth lane.
- The strongest opportunities are commercial pages, not just more informational articles.

This is consistent with the broader niche-validation thesis: TCA is not a dead niche; the real opportunity is adjacent monetization around the same ergonomic buyer.

## Recommended Next Step

Convert the current gap file into a short canonical project list, roughly:
- `best-big-and-tall-office-chairs`
- `widest-office-chair`
- `office-chair-for-heavy-people` / `office-chair-for-larger-person`
- deeper `correct-chair-dimensions` / seat-depth hub
- one carefully scoped `tall-office-chair` commercial page if cannibalization risk is acceptable

## Related Pages

- [[keyword-opportunities]]
- [[content-gap-engine]]
- [[niche-validation-framework]]
- [[competitor-landscape]]

