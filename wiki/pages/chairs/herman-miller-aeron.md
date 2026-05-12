---
type: entity
entity: chair
last_updated: 2026-05-11
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-19-blog-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/strategy/2026-03-competitor-analysis.md, data/gsc/latest.json]
tags: [chair, herman-miller, aeron, research-based]
---

# Herman Miller Aeron (Size C)

**Research-based content only.** Jackson has NOT tested this chair. Never use first-person testing voice.

## Key Specs

| Spec | Value |
|------|-------|
| Seat depth | ~18.25" (FIXED — not adjustable) |
| Seat height | 16"–20.5" |
| Back height | ~23.5" |
| Weight capacity | 350 lbs |
| Seat width | 20.75" |

**Critical tall-person issue:** The 18.25" fixed seat depth is the key trade-off. Fits most 6'0"–6'3" users; becomes a problem at 6'4"+.

## Site Pages (May 11 GSC)

### /review/aeron-size-c/
- **Blog audit score:** 73/100 (Acceptable)
- **GSC (May 11):** 723 impr, pos 7.1, 0.41% CTR, 3 clicks — strong growth from 7 impr at launch
- **Schema open issue:** `itemReviewed` missing from Review node — blocks rich results. Product `@id` also missing. See [[schema-markup]].
- **Meta (May 7):** Verdict-first rewrite deployed — removed "In-depth" filler, leads with fit verdict + specs (~153 chars). But meta is still 166 chars per May 10 audit — needs trim to ≤155.

### /chairs/herman-miller-aeron/ (hub)
- Cluster hub. Links to all sub-pages.
- **AggregateRating:** Status unknown — may be empty `{}`. Needs verification.

### /chairs/herman-miller-aeron/seat-height/
- Created 2026-03-07. **Not yet indexed** (per index-monitor May 11).

### /chairs/herman-miller-aeron/tall-people/
- **GSC (May 11):** 1,379 impr, pos 7.4, 0.29% CTR, 4 clicks — improved from 0% CTR at 406 impr (Apr 3)
- **Meta rewrite (May 7):** Verdict-first deployed. CTR improved.
- **AIO fix queued (Thursday W20):** Passage-anchor sentences per spec section. Cannibalization check vs /review/aeron-size-c/ also queued.

### /chairs/herman-miller-aeron/size-guide/
- Created 2026-04-13. Size B vs C for tall people.
- **Not yet indexed** (per index-monitor May 11).
- **Orphan resolved (May 10):** Now linked from hub + /review/aeron-size-c/.

## Competitive Position

- BTOD and Wirecutter rank for "herman miller aeron size c tall" — high DA competition
- TCA differentiator: height-by-height breakdown (6'0" through 6'7") with specific seat depth analysis
- No competitor explicitly answers "does the Aeron fit at 6'4"?" with math

## History

| Date | What changed |
|------|-------------|
| 2026-03-07 | Cluster hub + seat-height + tall-people pages created |
| 2026-03-30 | Comparison table added to /tall-people/ |
| 2026-04-03 | /review/aeron-size-c/ newly indexed at pos 6.29 |
| 2026-04-13 | /size-guide/ created |
| 2026-05-07 | /review/aeron-size-c/ and /tall-people/ meta rewrites deployed |
| 2026-05-10 | /size-guide/ orphan resolved (2 inbound links added) |

## Links

- [[steelcase-gesture]] — main comparison target
- [[schema-markup]] — itemReviewed + Product @id missing
- [[ctr-optimization]] — /tall-people/ CTR recovery case
- [[aeron-vs-gesture]] — comparison page
- [[aeron-tall-people]] — site-page entity for /tall-people/
