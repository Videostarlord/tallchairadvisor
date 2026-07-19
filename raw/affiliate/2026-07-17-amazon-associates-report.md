# Amazon Associates Report — snapshot dated 2026-07-17

**Source:** 4 CSV exports (Category, Linked-Product, Top-Sellers, Tracking-Id), downloaded 2026-07-18.
Raw CSVs: `raw/affiliate/2026-07-17-amazon-csv/`.
Report rows carry a single date (2026-07-17) — Amazon aggregates the selected range into one snapshot, same format as the 2026-06-30 export. Treated as the July-to-date window (~Jul 1–17).

## Headline (Tracking-Id: tallchairadvi-20)

| Metric | Value | June 30 report |
|---|---|---|
| Clicks | 82 | 70 |
| Items ordered | 6 | 7 |
| Ordered revenue | $1,252.11 | $578.08 |
| Items shipped | 6 | 6 |
| Items returned | 1 ($49.99) | 1 ($610) |
| Shipped earnings | $37.56 | $17.89 |
| Returned earnings clawback | −$1.50 | −$18.30 |
| **Total earnings** | **+$36.06** | **−$0.41** |

## Click attribution (Category report)

| Category | Clicks | Share |
|---|---|---|
| Furniture (attributed ASINs) | 41 | 50% |
| Unknown | 37 | 45% |
| others | 4 | 5% |

June baseline: 94% Unknown. **The July 4 ASIN fix's named success metric — Unknown attribution share — dropped from 94% to 45%.**

## Linked products (Linked-Product report)

| ASIN | Product | Clicks | Notes |
|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | 19 | Top clicked product; verified ASIN from Jul 4 fix |
| B016OIF2JU | Steelcase Gesture | 12 | Verified ASIN from Jul 4 fix |
| others (aggregated) | — | 21 | 6 indirect items ordered, $738.99 revenue, $22.17 earnings |
| None (Unknown) | — | 30 | 4 items ordered, $513.12 revenue, $13.89 net after return |

All 6 orders were indirect (visitor clicked a TCA link, bought something else Amazon showed them). Direct orders on the two tracked chairs: 0 — expected at this volume for $1,000+ items.

## Top-Sellers report

Still empty (header only) — populates only with direct-link purchases.

## Read

- First meaningfully positive earnings snapshot in site history (+$36.06).
- Ordered revenue more than doubled vs the June report ($578 → $1,252) on only +17% clicks — verified product links land buyers on real product pages, which converts to bigger indirect baskets.
- The return this period was $49.99, not a chair — clawback $1.50 vs June's $18.30. June's "one chair return wipes the month" fragility didn't repeat.
- Remaining Unknown share (45%) is structural to Amazon's indirect tracking, not a link bug.
