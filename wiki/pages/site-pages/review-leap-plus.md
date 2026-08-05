---
type: entity
entity: site-page
url: /review/leap-plus/
last_updated: 2026-07-29
sources: [raw/affiliate/2026-07-28-amazon-associates-report.md, data/gsc/latest.json, data/competitors/intelligence.json]
tags: [page, review, leap-plus, research-based]
---

# Page: /review/leap-plus/

**Research-based review. Jackson's second-choice finalist — "almost bought" narrative.**

## Current State (May 12 — GSC + competitor:intelligence)

| Metric | Value |
|--------|-------|
| Impressions | (check data/gsc/latest.json) |
| Position | (check data/gsc/latest.json) |
| Voice | Research-based — "I almost bought this" framing. No first-person testing claims. |
| Schema | (not audited — run /seo-page to establish baseline) |

## Affiliate Click Performance (July 2026 month close) — MOST-CLICKED PRODUCT, SOURCE PAGE UNCONFIRMED

Leap Plus ASIN **B00TYE4QXU: 45 clicks = 49% of all site affiliate clicks in July** — more than Gesture (24) + Aeron (12) combined, and up from 19 mid-month. **0 orders.**

**Attribution caveat (added 2026-07-29):** Amazon reports clicks per *ASIN*, not per source page. It does not establish that this page produced those clicks. GA4 page-level `affiliate_click` events for the same period point elsewhere: `/office-chairs-for-tall-people/` recorded 6 of 11 tracked events, the most of any page — its Quick Picks box links the Leap Plus. The likeliest read is that the money hub, not this review, is the main source of Leap Plus clicks. Treat "Leap Plus is the top product" as established and "this page is the top surface" as unconfirmed. See [[affiliate-performance]], [[office-chairs-for-tall-people]].

The queued "I almost bought this" reframe (Open Issue 2) remains worthwhile on its own merits, but it is not established as the highest-leverage revenue action.

## AIO Suppression Status (May 12 — competitor:intelligence v2.3)

- **Query:** "steelcase leap plus review"
- **AIO detected:** Yes — TCA not cited. 15 cited URLs, 1,087-char passage.
- **Capsule:** Applied ✅ — after H2 "Overview" (spec-validated: 19.75" depth, 22.5" height, 25.5" back, 500lb)
- **Sentinel:** `<!-- tca-aio-capsule -->` present — future runs will not re-apply.
- **Source of truth:** `data/competitors/intelligence.json` (2026-05-12 run)

## Open Issues

1. **Not yet audited with /seo-page** — no SEO baseline established.
2. **Reframe as "almost bought" narrative** — **priority raised 2026-07-29 (was C2).** Page draws 47% of all affiliate clicks and converts 0. Current draft may not fully leverage Jackson's purchase decision story. See [[steelcase-leap-plus]], [[affiliate-performance]].
3. **FTC affiliate disclosure** — verify inline disclosure is present. See [[affiliate-compliance]].

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-05-12 | AIO citation capsule inserted after "Overview" H2 | Spec-validated (19.75"/22.5"/25.5"/500lb) |

## Links

- [[steelcase-leap-plus]] — chair entity
- [[ai-citation-readiness]] — AIO suppression context
- [[affiliate-compliance]] — disclosure requirements
