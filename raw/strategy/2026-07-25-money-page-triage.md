# Money-Page Triage — 2026-07-25

**Purpose:** Step A of the 2026-07-24 Profit Audit. Ranks all pages by revenue potential so Step B (per-page tracking IDs + "Also available at" direct CTAs) and Step C (direct affiliate programs) target only the pages that can actually convert.

**Source:** live GSC pull `raw/gsc/gsc-2026-07-23.json` (95,251 impr, 206 clicks, 0.22% CTR, avg pos 8.1, 90-day).

**Rubric:** `buyer-intent(1-5) × SERP-escapability(1-5) × position-multiplier`. Escapability grounded in the wiki SERP audit — AIO eats informational/spec queries; shopping carousels bury "best chair" head terms; branded review/comparison SERPs stay editorial and winnable. Position-multiplier: pos≤10 = 1.0, 11-15 = 0.7, 16+ = 0.35.

*Note: raw GSC `ctr` field is already in percent units (knee-pain = 0.05%).*

## TIER 1 — Fix the cash register first
| # | Page | Impr | Pos | CTR% | Clicks | Rationale |
|---|------|-----:|----:|-----:|-------:|---|
| 1 | /review/leap-plus/ | 12064 | 8.7 | 0.28 | 34 | Money page. Top Amazon earner (Leap Plus ASIN 19 clicks). Brand-review SERP, no AIO. |
| 2 | /office-chairs-for-tall-people/ | 3287 | 8.1 | 0.55 | 18 | Money hub. Escapable "leap v2 for tall people" brand queries. |
| 3 | /review/aeron-size-c/ | 4739 | 10.9 | 0.44 | 21 | Strong converter. Pos ~11 = CTA + ranking-lift. |
| 4 | /review/gesture/ | 9021 | 7.9 | 0.07 | 6 | Flagship first-person authority. 9k impr → 6 clicks = biggest CTR-recovery upside. |

## TIER 2 — Fast CTA wins (page 1, buyer intent, smaller volume)
| # | Page | Impr | Pos | CTR% | Clicks | Rationale |
|---|------|-----:|----:|-----:|-------:|---|
| 5 | /best-office-chairs-under-500/ | 1294 | 9.1 | 0.85 | 11 | Budget buyer intent; CTR proves conversion. |
| 6 | /chairs/herman-miller-aeron/tall-people/ | 1410 | 8.2 | 0.92 | 13 | Best CTR on site. Brand + tall intent. |
| 7 | /gesture-vs-leap-plus/ | 1329 | 10.5 | 0.45 | 6 | Comparison = peak purchase intent. |
| 8 | /office-chairs-for-6-foot-3/ + /6-foot-4/ | 521/703 | 7.2/5.4 | 0.96/0.28 | 5/2 | Spec-match shoppers, great positions. Trivial CTA adds. |

## TIER 3 — Off-limits for monetization (impression vanity)
| Page | Impr | Reason | Alt use |
|------|-----:|--------|---------|
| /knee-pain-seat-depth/ | 38990 | 41% of site impr, 0.05% CTR, AIO-eaten, non-buyer | **Email capture only** |
| /correct-chair-dimensions/ | 17152 | Informational, queries pos 16-41, AIO-eaten | Internal-link fuel |
| /chairs/steelcase-gesture/{seat-depth,weight-limit}/ + spec hubs | ~2400 | Pure spec lookups, AIO-eaten | Internal-link fuel |
| /best-office-chairs/ | 1920 | Redirected; head terms pos 50-74, carousel-buried | Historical |

## Key figure
~56k of 95k monthly impressions (Tier 3) are structurally unmonetizable. The ~29k in Tiers 1-2 is where all Step B/C revenue work is pointed. Do not optimize Tier 3 for clicks — only for email (knee-pain) and internal linking.
