# Amazon Associates Report — snapshot dated 2026-08-04

**Source:** 4 CSV exports (Category, Linked-Product, Top-Sellers, Tracking-Id), downloaded 2026-08-05.
Raw CSVs: `raw/affiliate/2026-08-04-amazon-csv/`.

**Window: inferred ROLLING 30 DAYS (2026-07-06 → 2026-08-04) — not confirmed by Jackson.**

Inference basis: the export totals $3,337.74 ordered revenue, which still contains July's ~$3,109.76 base including the single ~$2,048.80 order documented in the Jul 31 month close. A month-to-date August export covering only Aug 1–4 could not contain that order. The prior export (Aug 3) was confirmed "last 30 days," and this one is consistent with the same setting one day later.

**Confirm the selected range on the next download.** Window type is not recorded in the CSV and has already caused one misreading in this archive.

---

## Headline (Tracking-Id: tallchairadvi-20)

| Metric | Aug 4 export | Aug 3 export | Δ |
|---|---|---|---|
| Clicks | 108 | 101 | +7 |
| Items ordered | 7 (6 indirect + 1 direct) | 6 | +1 |
| Ordered revenue | $3,337.74 | $3,117.75 | **+$219.99** |
| Items shipped | 7 | 6 | +1 |
| Items returned | 1 ($49.99) | 1 ($49.99) | — |
| Shipped earnings | $100.40 | $93.80 | +$6.60 |
| Returned clawback | −$1.50 | −$1.50 | — |
| **Total earnings** | **+$98.90** | **+$92.30** | **+$6.60** |

$6.60 / $219.99 = **3.00%** — exactly the furniture tier. One new order of $219.99 on Aug 4.

---

## August month-to-date, derived

Subtracting the July final ($3,109.76 ordered / $92.06 net) from this rolling window:

| August 1–4 (4 days) | Value |
|---|---|
| Ordered revenue | **$227.98** |
| Net earnings | **$6.84** |
| Orders | 2 ($7.99 + $219.99) |

**Naive 31-day run rate: ~$53.** Below the $100/mo kill-list threshold, and below July's $92.06.

Treat that projection as weak. It rests on **two orders**, one of which is 96% of the revenue. The same concentration problem that inflated July ($2,048.80 of $3,109.76 from a single order) works in both directions at this volume — one more $200 order doubles the month, one return halves it. Per [[statistical-confidence-policy]], 4 days and n=2 support no conclusion about where August lands.

### Kill-list gate status

Unchanged: **1 of 2–3 positive months.** July is the one month on record. August is the confirming period and closes **2026-09-01**. It is currently positive but tracking below the $100 threshold.

---

## Click attribution

| Category | Clicks | Orders | Earnings |
|---|---|---|---|
| Furniture | 103 | 0 | $0.00 |
| others | 5 | 7 | $98.90 |

Unknown attribution remains **0%** — fifth consecutive export holding since the Jul 4 ASIN fix. This result is durable and needs no further work.

## Linked products

| ASIN | Product | Aug 4 | Aug 3 | Δ |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **49** | 49 | **0** |
| B016OIF2JU | Steelcase Gesture | 28 | 26 | +2 |
| B01N32UFNT | Herman Miller Aeron Size C | 15 | 13 | +2 |
| — | others | 16 | 13 | +3 |

**Leap Plus clicks flat at 49 across the day** — notable because it has been the top click generator all summer (45 of 92 in July, 47% of all site affiliate clicks at one point). Gesture and Aeron each gained 2. Single-day movement, so not yet a trend; worth watching whether Leap Plus is plateauing while the other two accumulate.

**92 of 108 clicks (85%) went to named chairs and produced 0 orders.** Fifth consecutive export with this pattern. All 7 orders and all $100.40 of shipped earnings booked to the `others` row — products TCA does not link. Order economics: 7 items / $3,337.74 = **$477 average item**.

## Top-Sellers

Present in this export but still **empty (header row only)**. Populates only on direct-link purchases; the single direct order recorded has not surfaced here.

---

## Read

Nothing in this export changes the strategic picture set on 2026-08-04:

- Monetization mechanics remain solved (0% Unknown, 3.00% realized commission).
- The chair-conversion gap is confirmed again at a fifth export — visitors click chair links and buy other things.
- August is positive but small. The $98.90 headline is **93% July's money**; only $6.84 of it is August.

The accessory pages shipped 2026-08-04 cannot affect this period — they were not indexed at the time of this snapshot. Their earliest possible revenue impact is the October report.
