# Amazon Associates Report — snapshot dated 2026-07-22

**Source:** 4 CSV exports (Category, Linked-Product, Top-Sellers, Tracking-Id), downloaded 2026-07-23.
Raw CSVs: `raw/affiliate/2026-07-22-amazon-csv/`.
Report rows carry a single date (2026-07-22). Same July month-to-date window as the 2026-07-17 export, re-read 5 days later — **this is an update/restatement of the July window, not an independent period.** Evidence: click count barely moved (82 → 84), and the same single $49.99 return / $1.50 clawback carries through both snapshots. Treat July 17 and July 22 as two reads of one July-to-date window, not additive months.

## Headline (Tracking-Id: tallchairadvi-20)

| Metric | Jul 22 | Jul 17 | June 30 |
|---|---|---|---|
| Clicks | 84 | 82 | 70 |
| Items ordered | 5 | 6 | 7 |
| Ordered revenue | $3,142.77 | $1,252.11 | $578.08 |
| Items shipped | 5 | 6 | 6 |
| Shipped revenue | $1,383.96 | — | — |
| Items returned | 1 ($49.99) | 1 ($49.99) | 1 ($610) |
| Shipped earnings | $41.52 | $37.56 | $17.89 |
| Returned earnings clawback | −$1.50 | −$1.50 | −$18.30 |
| **Total earnings** | **+$40.02** | **+$36.06** | **−$0.41** |

## Key mechanic this snapshot — ordered ≠ shipped ≠ earned

Ordered revenue jumped $1,252 → **$3,142.77**, but shipped revenue is only **$1,383.96**. That means **~$1,758.81 of ordered basket has not shipped yet.** Amazon pays commission on *shipment*, not order — so the +$40.02 earned so far reflects only the $1,383.96 shipped (3.0% ≈ $41.52, minus the $1.50 return clawback). If the unshipped ~$1,759 ships and isn't returned, it adds **~$52 more** commission (~3%), for a potential ~$92 on this window. Pending, not banked.

## Click attribution (Category report)

| Category | Clicks | Share | Jul 17 share | Jun 30 share |
|---|---|---|---|---|
| Furniture (attributed ASINs) | 60 | 71% | 50% | 6% |
| Unknown | 20 | 24% | 45% | 94% |
| others | 4 | 5% | 5% | — |

**Unknown attribution share fell again: 45% → 24%.** The July 4 ASIN fix keeps compounding — attributed Furniture clicks are now 71% of the total (up from 50%, and from just 6% before the fix). Unknown is approaching the structural floor of Amazon's indirect tracking.

## Linked products (Linked-Product report)

| ASIN | Product | Clicks | Jul 17 | Notes |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | 28 | 19 | Top clicked product again; verified ASIN from Jul 4 fix |
| B016OIF2JU | Steelcase Gesture | 17 | 12 | Verified ASIN from Jul 4 fix |
| B01N32UFNT | Herman Miller Aeron Size C | 12 | — | **New: third verified ASIN now visible individually** |
| None (Unknown) | — | 20 | 30 | 0 orders attributed |
| others (aggregated) | — | 7 | 21 | 5 items ordered, $3,142.77 revenue, $40.02 earnings |

All three verified chair ASINs (Leap Plus, Gesture, Aeron) now surface individually — Aeron appears for the first time. Direct orders on the tracked chairs themselves: still 0 (expected at this volume for $1,000+ items).

Orders this window: 5 items = 4 indirect + **1 direct** (first direct-classed order; sits in "others" aggregation so the specific product isn't exposed). Visitors clicked a TCA link and bought within Amazon's cookie window.

## Daily breakdown (Group By: Date view, pulled Jul 23)

Aggregate header on this view: Clicks 84, Ordered Items 5, Conversion 5.95%, Ordered Revenue $3,142.77, Shipped Items 5, Returned Items 1, Total Revenue **$1,333.97** (= gross shipped $1,383.96 − $49.99 return), Total Earnings $40.02. Days with 0 activity omitted:

| Date | Clicks | Items Ordered | Ordered Rev | Items Shipped | Returned | Net Rev | Earnings |
|---|---|---|---|---|---|---|---|
| 2026-07-22 | 9 | 1 | $304.99 | 1 | 0 | $304.99 | $9.15 |
| 2026-07-21 | 1 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-20 | 2 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-19 | 3 | 1 | $2,048.80 | 0 | 0 | $0 | $0 |
| 2026-07-18 | 6 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-17 | 1 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-16 | 3 | 0 | $0 | 1 | 0 | $729.00 | $21.87 |
| 2026-07-15 | 4 | 1 | $729.00 | 0 | 0 | $0 | $0 |
| 2026-07-13 | 11 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-12 | 1 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-11 | 6 | 0 | $0 | 0 | 1 | −$49.99 | −$1.50 |
| 2026-07-10 | 2 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-09 | 2 | 0 | $0 | 0 | 0 | $0 | $0 |
| 2026-07-08 | 2 | 0 | $0 | 0 | 0 | $0 | $0 |

Notes:
- **Ordered ≠ shipped, on different days.** $729 order shows Ordered Rev on 07-15 ($0 earnings), its $21.87 payout lands on 07-16 (0 items ordered). Commission accrues on shipment, not order.
- **The unshipped $1,759 is one order:** 07-19 ordered $2,048.80, shipped 0 → $0 earned so far (~$61 pending at ~3% when it ships). 65% of the window's ordered revenue.
- **Return:** 07-11, −$49.99 rev / −$1.50 clawback (the same return carried in both the Jul 17 and Jul 22 aggregates).
- **Hidden low-volume days:** visible daily earnings sum to $29.52 vs $40.02 aggregate; ~$10.50 (~$350 shipped rev) is on days below Amazon's disclosure threshold. Amazon's own note: "individual day metrics may not sum to aggregate totals."
- **Not a tracking failure:** anything under Ordered Revenue with the tag is already attributed. "Unshipped" is a timing state (slow-shipping high-ticket furniture + mid-window snapshot + occasional cancellations), not lost credit. Permanent $0 only via returns/cancellations, both itemized.

## Top-Sellers report

Still empty (header only) — populates only with direct-link ASIN purchases.

## Read

- **Same July window, updated:** a large basket (~$1,900 incremental ordered revenue) landed between Jul 17 and Jul 22, pushing ordered revenue past $3,100. Earnings only edged +$36.06 → +$40.02 because most of the new order is ordered-but-unshipped; commission accrues on shipment.
- **Attribution keeps improving** (Unknown 94% → 45% → 24%). This is the Jul 4 fix compounding, and it is now near the indirect-tracking floor — don't expect Unknown to reach 0%.
- **Same $49.99 return** as Jul 17 (not a chair). June's "one chair return wipes the month" fragility still has not repeated.
- **Guardrail:** still one July window, not a proven monthly trend. Per the Jul 3 kill-list condition ("until repeatable positive revenue months"), needs 2–3 consecutive positive *periods* before relaxing. July is tracking clearly positive; the August export is the next independent data point. Amazon may still restate this window as the unshipped order ships or returns.
