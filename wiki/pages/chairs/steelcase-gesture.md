---
type: entity
entity: chair
last_updated: 2026-05-11
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-19-blog-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/misc/2026-03-07-session-context.md, data/gsc/latest.json]
tags: [chair, steelcase, gesture, first-person, tested]
---

# Steelcase Gesture

**Jackson's primary chair.** This is the ONLY chair he has personally tested. All Gesture content can use first-person voice.

## Key Specs

| Spec | Value |
|------|-------|
| Seat depth | 15.75"–18.75" (3" adjustable range) |
| Seat height | 16"–21" |
| Back height | 24" |
| Weight capacity | 400 lbs |
| Seat width | 19.25" |
| Price range | ~$1,200–$1,600 |

## Site Pages (May 11 GSC)

### /review/gesture/
- **Role:** Flagship review, first-person authority page
- **Blog audit score:** 90/100 (May 10 audit — best content page on site)
- **GSC (May 11):** 2,672 impr, pos 8.2, 0.11% CTR, 3 clicks
- **Schema open issue:** `itemReviewed` missing from Review node — blocks rich results. See [[schema-markup]].
- **Revenue issue:** Single affiliate link at 85% of page — add CTA after DIRECT ANSWER box.
- **C1 queued:** Depth expansion REWRITE (3,000+ words, first-person 6'4" measurements) for a future weekly plan.

### /chairs/steelcase-gesture/ (hub)
- **GSC:** Low volume (hub page)
- **Schema:** Missing `datePublished`, `dateModified`, author `@id` — only page that can't qualify for Article rich results. See [[schema-markup]].
- **Meta rewrite ran May 7** — verdict-first, leads with height fit + key specs

### /chairs/steelcase-gesture/seat-depth/
- **GSC (May 11):** 921 impr, pos 8.2, 0.11% CTR, 1 click
- **AIO suspect:** pos 4.1 on "steelcase gesture seat depth range inches" (23 impr, 0 CTR) — AI Overview consuming answer. Meta rewrite queued Thursday W20.
- **Meta queued (Thursday W20):** Lead with spec value "adjusts from 15.75" to 18.75""

### /chairs/steelcase-gesture/seat-height/
- **Key query:** "steelcase gesture seat height range" (~8 impr)

### /chairs/steelcase-gesture/tall-people/
- Sub-page for tall-specific Gesture fit analysis. **Not yet indexed** (per index-monitor May 11).

### /chairs/steelcase-gesture/weight-limit/
- Created 2026-03-07. **Not yet indexed** (per index-monitor May 11).

## Competitive Position

- BTOD ranks for "steelcase gesture seat depth" and "steelcase gesture seat height range"
- TCA advantage: height-specific fit analysis that BTOD doesn't do
- ChairsFX has generic comparison but no tall-user verdict

## History

| Date | What changed |
|------|-------------|
| 2026-03-07 | Quick Answer box added, height fit guide, FAQ section, FAQPage schema, 2000+ words |
| 2026-03-07 | Byline + Person schema added |
| 2026-03-30 | Meta description fixed (171→146 chars) |
| 2026-04-03 | 581 impressions, still low CTR |
| 2026-05-07 | /chairs/steelcase-gesture/ meta verdict-first rewrite |
| 2026-05-10 | Blog audit score confirmed 90/100 |

## Links

- [[steelcase-leap-plus]] — main competitor in Steelcase lineup
- [[herman-miller-aeron]] — main competitor overall
- [[review-gesture]] — flagship page entity
- [[schema-markup]] — itemReviewed fix needed
- [[ctr-optimization]] — /review/gesture/ is a CTR case study
- [[content-quality-scores]] — highest scoring page at 90/100
