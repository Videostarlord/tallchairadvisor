# Amazon Associates Report — snapshot dated 2026-07-28

**Source:** 4 CSV exports (Category, Linked-Product, Top-Sellers, Tracking-Id), downloaded 2026-07-29.
Raw CSVs: `raw/affiliate/2026-07-28-amazon-csv/`.
All rows carry a single date (2026-07-28) — Amazon collapses the selected range into one snapshot, same format as the 2026-06-30 and 2026-07-17 exports. **Exact date range unknown** (see Window caveat).

## Headline (Tracking-Id: tallchairadvi-20)

| Metric | Value | Jul 17 report | Jun 30 report |
|---|---|---|---|
| Clicks | 87 | 82 | 70 |
| Items ordered | 5 (4 indirect + **1 direct**) | 6 (all indirect) | 7 (all indirect) |
| Ordered revenue | **$3,109.76** | $1,252.11 | $578.08 |
| Items shipped | 4 | 6 | 6 |
| Shipped revenue | $1,060.96 | — | $578.08 |
| Items returned | 1 ($49.99) | 1 ($49.99) | 1 ($610) |
| Shipped earnings | $32.10 | $37.56 | $17.89 |
| Returned earnings clawback | −$1.50 | −$1.50 | −$18.30 |
| **Total earnings** | **+$30.60** | **+$36.06** | **−$0.41** |

Realized commission rate: $32.10 / $1,060.96 = **3.03%** — consistent with the ~3% furniture tier.

## Click attribution (Category report)

| Category | Clicks | Share |
|---|---|---|
| Furniture (attributed ASINs) | 79 | 91% |
| others | 8 | 9% |
| **Unknown** | **0** | **0%** |

**The "Unknown" bucket is gone entirely.** Trajectory: 94% (Jun) → 45% (Jul 17) → 0% (Jul 28). The July 4 ASIN fix's named success metric is fully resolved.

## Linked products (Linked-Product report)

| ASIN | Product | Clicks | Share of total | Jul 17 |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **41** | 47% | 19 |
| B016OIF2JU | Steelcase Gesture | 23 | 26% | 12 |
| B01N32UFNT | Herman Miller Aeron Size C | 12 | 14% | — (new) |
| others (aggregated) | — | 11 | 13% | 21 |

Named-ASIN click share: **76 of 87 = 87%** (was 31/82 = 38%). Aeron Size C appears for the first time; all three flagship chairs are now individually attributed.

All conversions are still booked against the `others` row — the three named chair ASINs recorded 0 orders. Chair clicks are not yet converting into chair purchases; earnings continue to come from indirect baskets.

## First direct order in site history

`Direct Items Ordered = 1` (Category + Linked-Product, `others` row). Every prior period was 100% indirect. Direct attribution is live for the first time — but Top-Sellers is still empty (header only), so the direct ASIN is not exposed.

## Unshipped revenue: $2,048.80

Ordered revenue $3,109.76 vs shipped revenue $1,060.96 — a **$2,048.80 gap** on items ordered but not yet shipped. At 3% that's ~$61 of unrealized commission, more than double the period's booked earnings. The per-item ordered average ($622) sits in chair territory; the shipped average ($265) does not. Something chair-priced was ordered and has not shipped or cleared. It will resolve up or down in the next export.

## Window caveat — cannot date the range

The `$49.99` return and `$1.50` clawback are **identical to the Jul 17 snapshot**. Two readings:

- **Discrete/later window** (favored): items ordered *fell* 6 → 5, which a cumulative month-to-date total cannot do. Ordered revenue tripling alongside that fits a fresh window containing one high-ticket order. The repeated return is then either a second $49.99 return or the same one still inside the reporting window.
- **Cumulative July-to-date:** would mean July total earnings are $30.60, not $36.06 + $30.60. The falling item count argues against it.

Under either reading the two positive snapshots may overlap, so they are **not confirmed as two independent positive periods**. Action for next export: record the exact date range at download time.

## Top-Sellers report

Still empty (header only), even with 1 direct order this period.

## Data quality note

Category and Linked-Product disagree on bucketing: Category says `others` 8 / Furniture 79; Linked-Product says `others` 11 / Furniture ASINs 76. Both total 87. A 3-click discrepancy in Amazon's own categorization — immaterial, but don't reconcile the two reports click-for-click.

## Read

- **Attribution is solved.** 0% Unknown, 87% named-ASIN. No further link-architecture work is warranted; remaining opacity is Amazon's indirect-purchase model, not TCA's links.
- **Leap Plus is the click magnet** — 41 clicks, 47% of all site affiliate clicks, more than Gesture + Aeron combined, and it more than doubled period-over-period. This is the highest-traffic commercial surface on the site and it is a research-based page, not the first-person Gesture review.
- **Second positive snapshot (+$30.60)**, but see the Window caveat — the two positives may overlap, so the "2–3 consecutive positive periods" gate on the Jul 3 kill list is not cleanly met yet.
- **The conversion gap is the real story now:** 76 attributed chair clicks → 0 chair orders. Every dollar earned came from indirect baskets. High-ticket chairs at 87 clicks/period is simply below the volume where $1,000+ conversions show up — but it also means the site is monetizing accidents, not intent.
