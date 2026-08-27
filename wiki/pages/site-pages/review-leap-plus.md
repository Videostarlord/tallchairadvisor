---
type: entity
entity: site-page
url: /review/leap-plus/
last_updated: 2026-08-26
sources: [raw/affiliate/2026-08-26-amazon-associates-report.md, raw/affiliate/2026-08-13-amazon-associates-report.md, raw/affiliate/2026-07-28-amazon-associates-report.md, data/gsc/latest.json, data/competitors/intelligence.json]
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

## UPDATE 2026-08-26 — clicks are not the constraint, and the reframe should not be sold as a revenue action

| Period | Leap Plus clicks | Share | Orders |
|---|---|---|---|
| Jul 27 – Aug 25 (Aug 26 export) | **47** | 36% | **0** |
| Aug 13 export | 50 | 41% | 0 |
| Jul 31 month close | 45 | 49% | 0 |
| Jul 28 | 41 | 47% | 0 |

Leap Plus holds the #1 click slot for a fourth consecutive period, but its share is eroding (49% → 41% → 36%) as Gesture and the newly-attributed Crandall Leap V2 pick up.

**The decisive new evidence is the 2026-08-13 tracking-ID split.** Chair links now carry a dedicated tag, `tcachair-20`. Its first readout: **45 chair clicks, 0 orders, $0.00** over 12 clean days. Across the last two periods that is **134 named chair clicks → $0**, now measured directly rather than inferred.

**One trap in the same export:** `linked-product.csv` books $80.89 — 99.7% of all earnings — to `B00TYE4QXU`. That is **not** a Leap Plus sale. The same 4 items are attributed to the *legacy* tag and date to Jul 27 – Aug 4, and $2,690.77 over 4 items ($672.69 avg) cannot be four ~$1,300 chairs. It is a referral whose basket was something else. **Do not log it as a conversion for this page.** See [[affiliate-performance]].

**Implication for the reframe:** still do it — the CTR and E-E-A-T case stands on its own, and this remains the most-clicked product on the site. But the constraint is the 3% furniture tier against a $500+ considered purchase, not traffic to this page. **Do not justify the rewrite as an Amazon revenue action**; more clicks on this ASIN have twice produced nothing.

## AIO Suppression Status (May 12 — competitor:intelligence v2.3)

- **Query:** "steelcase leap plus review"
- **AIO detected:** Yes — TCA not cited. 15 cited URLs, 1,087-char passage.
- **Capsule:** Applied ✅ — after H2 "Overview". Rewritten 2026-08-06: the original capsule asserted a 22.5" seat height ceiling as standard, which is false. Now states 15.5"–19.5" standard / 17.5"–22.5" with the optional 5" cylinder (19.75" depth, 25.5" back, 500lb unchanged).
- **Sentinel:** `<!-- tca-aio-capsule -->` present — future runs will not re-apply.
- **Source of truth:** `data/competitors/intelligence.json` (2026-05-12 run)

## Open Issues

1. **Not yet audited with /seo-page** — no SEO baseline established.
2. **Reframe as "almost bought" narrative** — **priority raised 2026-07-29 (was C2).** Page draws 47% of all affiliate clicks and converts 0. Current draft may not fully leverage Jackson's purchase decision story. See [[steelcase-leap-plus]], [[affiliate-performance]].
3. **FTC affiliate disclosure** — verify inline disclosure is present. See [[affiliate-compliance]].

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-05-12 | AIO citation capsule inserted after "Overview" H2 | Spec-validated (19.75"/22.5"/25.5"/500lb) — seat height figure later found false |
| 2026-08-06 | **Factual seat-height correction.** Page claimed a 22.5" ceiling as standard and "seat height increases from 20" to 22.5"" vs the standard Leap. Both false: standard Leap Plus is 15.5"–19.5"; 22.5" requires the optional 5" cylinder (~$63, raises floor to 17.5"); the Plus is 1" *lower* than the standard Leap at default. Corrected FAQPage JSON-LD (5 answers), visible FAQ, Direct Answer, AIO capsule, key specs, Cons, height-fit guide, verdict, title/meta. Steelcase spec-guide PDF cited. | Build + lint:content pass; schema and visible FAQ verified in sync |

## Links

- [[steelcase-leap-plus]] — chair entity
- [[ai-citation-readiness]] — AIO suppression context
- [[affiliate-compliance]] — disclosure requirements
