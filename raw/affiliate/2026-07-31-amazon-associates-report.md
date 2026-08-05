# Amazon Associates Report — snapshot dated 2026-07-31 (JULY MONTH CLOSE)

**Source:** 4 CSV exports (Category, Linked-Product, Top-Sellers, Tracking-Id), downloaded 2026-08-01.
Raw CSVs: `raw/affiliate/2026-07-31-amazon-csv/`.

## This snapshot settles the window question

The Jul 28 report flagged that snapshot windows could not be dated and favored a "discrete window" reading. **That reading was wrong. The snapshots are cumulative month-to-date.** Proof:

| | Jul 17 | Jul 28 | Jul 31 |
|---|---|---|---|
| Clicks | 82 | 87 | 92 |
| Items ordered | 6 | 5 | **5** |
| Ordered revenue | $1,252.11 | $3,109.76 | **$3,109.76 (identical)** |
| Items shipped | 6 | 4 | 5 |
| Shipped revenue | — | $1,060.96 | **$3,109.76** |
| Returned | 1 ($49.99) | 1 ($49.99) | 1 ($49.99) |

Identical order set and identical ordered revenue across Jul 28 and Jul 31, with shipped catching up to ordered. Clicks rise monotonically (82 → 87 → 92). These are three restatements of one July-to-date window, not three periods.

**Consequence: July's total is $92.06 — not $36.06 + $30.60 + $92.06.** Prior snapshots are superseded, not additive. The "2–3 consecutive positive periods" gate on the Jul 3 kill list therefore has **one** positive month on the board (July), not three. August is period two.

## Headline (Tracking-Id: tallchairadvi-20) — July final

| Metric | July final (Jul 31) | Jul 28 interim | June (final) |
|---|---|---|---|
| Clicks | 92 | 87 | 70 |
| Items ordered | 5 (4 indirect + 1 direct) | 5 | 7 |
| Ordered revenue | $3,109.76 | $3,109.76 | $578.08 |
| Items shipped | **5 (all)** | 4 | 6 |
| Shipped revenue | **$3,109.76** | $1,060.96 | $578.08 |
| Items returned | 1 ($49.99) | 1 ($49.99) | 1 ($610) |
| Shipped earnings | **$93.56** | $32.10 | $17.89 |
| Returned clawback | −$1.50 | −$1.50 | −$18.30 |
| **Total earnings** | **+$92.06** | +$30.60 | −$0.41 |

Realized commission: $93.56 / $3,109.76 = **3.01%**.

**The $2,048.80 unshipped balance flagged on Jul 28 resolved fully in TCA's favor.** All 5 ordered items shipped; shipped earnings rose $32.10 → $93.56 (+$61.46), matching the ~$61 projected at 3%.

**+$92.06 is the best month in site history — ~2.5x the previous best.**

## Click attribution (Category report)

| Category | Clicks | Share |
|---|---|---|
| Furniture | 87 | 95% |
| others | 5 | 5% |
| **Unknown** | **0** | **0%** |

Unknown remains eliminated (94% June → 45% Jul 17 → 0% Jul 28 → 0% Jul 31).

## Linked products

| ASIN | Product | Jul 31 | Jul 28 | Δ |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **45** | 41 | +4 |
| B016OIF2JU | Steelcase Gesture | 24 | 23 | +1 |
| B01N32UFNT | Herman Miller Aeron Size C | 12 | 12 | — |
| others | — | 11 | 11 | — |

Named-ASIN share: **81 of 92 = 88%**. All 5 clicks added in the final three days went to Furniture, 4 of them to Leap Plus.

## The conversion gap — confirmed at month close

**81 named chair clicks → 0 chair orders.** Every one of the 5 orders and all $93.56 of earnings booked against the `others` row (products TCA does not link). July's revenue came entirely from indirect baskets: visitors clicked a TCA chair link, then bought something else on Amazon.

Order economics: 5 items / $3,109.76 = **$622 average item**, 5.4% CVR on 92 clicks. High-ticket purchases did happen — just not on the three chairs TCA promotes.

**Single-order concentration risk:** ~$2,049 of the $3,110 came from one high-ticket item. One order made this month. The return window on it is still open — Amazon can restate.

## Direct order + Top-Sellers

`Direct Items Ordered = 1` (unchanged from Jul 28). Top-Sellers still empty (header only).

## Data quality note

The Category vs Linked-Product `others` discrepancy widened: Category says 5, Linked-Product says 11 (was 8 vs 11). Both still total 92. Amazon's own bucketing is inconsistent — do not reconcile the two reports click-for-click.

## Read

- **July closed at +$92.06 — 92% of the $100/month target the Jul 3 pivot treated as far out of reach.**
- **The Jul 3 monetization-ceiling math needs revisiting.** That analysis computed "55 Amazon clicks/month needed for $100" and then converted it to "25,000 organic clicks/month needed" using the site-wide 0.22% Google CTR. July delivered $92.06 on **92 Amazon clicks** — the click math was sound; the organic-traffic conversion step was not, because affiliate clicks come substantially from direct and AI traffic, not only Google organic (GA4: Google organic = 19% of sessions).
- **Attribution work is finished.** 0% Unknown, 88% named-ASIN, three flagship chairs individually visible.
- **The open problem is unchanged and now sharper:** 81 chair clicks, 0 chair orders, all revenue incidental. TCA is earning a toll on Amazon sessions it originates, not commission on the chairs it recommends.
- **One month is not a trend** (per [[statistical-confidence-policy]]), and one order carried two-thirds of it. August is the confirming period.
