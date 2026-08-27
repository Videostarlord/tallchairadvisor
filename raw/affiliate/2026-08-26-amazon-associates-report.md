# Amazon Associates Report — snapshot dated 2026-08-26

**Source:** HAND EXPORT from Associates Central, dropped by Jackson. Not the automated pull.
Raw CSVs: `raw/affiliate/2026-08-26-amazon-csv/` (category, linked-product, top-sellers, tracking-id).

**This is the FIRST export produced after the 2026-08-13 tracking-ID split (`20aab85`).**
`tracking-id.csv` now carries three rows where every prior export carried one. The per-product-class
revenue question that `src/data/affiliate-tags.ts` was built to ask has its first answer.

---

## Window — DERIVED AND CONFIRMED: rolling 30-day, 2026-07-27 → 2026-08-25

Every prior hand export in this archive left the window unknown (see the 2026-08-13 note, which
refused to guess). **This one is recoverable, and it was solved by algebra against the 2026-08-09
automated daily pull, not assumed.**

`data/affiliate/latest.json` holds per-day rows for 2026-07-11 → 2026-08-09. Summing only the days
from 2026-07-27 onward:

| Day | Shipped items | Shipped revenue | Earnings |
|---|---|---|---|
| 2026-07-27 | 1 | $16.99 | $0.68 |
| 2026-07-29 | 1 | $2,048.80 | $61.46 |
| 2026-08-03 | 1 | $7.99 | $0.24 |
| 2026-08-04 | 1 | $219.99 | $6.60 |
| **Total** | **4** | **$2,293.77** | **$68.98** |

The `tallchairadvi-20` row of this export reads **4 items shipped, $2,293.77 shipped revenue,
$68.98 total earnings** — identical on all three figures to the cent. Three independent quantities
matching exactly is not coincidence; the window starts 2026-07-27.

*One-day caveat:* 2026-07-26 contributed $0 and 0 shipped items, so the algebra alone cannot
separate a Jul 26 start from a Jul 27 start. The CSV date stamp of `2026-08-25` fixes the end, and
30 days back from 2026-08-25 inclusive is 2026-07-27.

**Corollary — the date column is a boundary, not a day.** 131 clicks over the window is ~4.4/day,
squarely inside the 3–9 clicks/day baseline in `latest.json`. 131 clicks in the single day
`2026-08-25` would be a 15–40x spike. It is a 30-day total.

---

## Totals as stated by `tracking-id.csv`

| Tracking ID | Clicks | Items ordered | Ordered revenue | Items shipped | Shipped revenue | **Total earnings** |
|---|---|---|---|---|---|---|
| `tallchairadvi-20` (legacy) | 81 | — | — | 4 | $2,293.77 | **$68.98** |
| `tcachair-20` (chairs) | **45** | **—** | **—** | **0** | **—** | **$0.00** |
| `others` | 5 | 5 | $1,979.96 | 1 | $404.99 | **$12.15** |
| **Total** | **131** | **5** | **$1,979.96** | **5** | **$2,698.76** | **$81.13** |

`tcaaccessory-20` and `tcadesk-20` do not appear at all — no rows of their own, meaning either zero
clicks or a bucketing into `others`. Cannot be distinguished from this file.

---

## THE FINDING: the chair tag's first readout is 45 clicks, $0.00

`affiliate-tags.ts` exists to answer one question — *does a $500+ chair click EVER convert on
Amazon?* Twelve days of clean data (2026-08-13 → 2026-08-25) under a dedicated tag:

**45 chair clicks. Zero orders. Zero dollars.**

This is the sixth consecutive period with zero chair conversions, and the first where the zero is
**unambiguous**. Before the split, "0 chair orders" was an inference from ASIN-level click rows next
to an `others` earnings bucket. Now it is a direct measurement on a dedicated tracking ID that
attributes every purchase in the 24-hour session. Nothing bought in a session that started on a
chair link produced a cent.

**Every dollar in this window is old money or unlinked money:**

- **$68.98 (85%)** is the legacy tag, and the algebra above proves all of it landed on or before
  **2026-08-04**. The legacy tag has earned **nothing new since Aug 4** — 22 days.
- **$12.15 (15%)** is the `others` tracking-ID bucket, on 5 clicks / 5 items ordered / $1,979.96
  ordered revenue. This *is* new since the 2026-08-09 pull ($81.13 − $68.98 = $12.15). Only 1 of the
  5 ordered items has shipped ($404.99), so **~$1,575 of ordered revenue is still unshipped** —
  roughly $47 of unrealized commission at the 3% furniture tier, if it ships and is not returned.

**New earnings in the 17 days since the last automated pull: $12.15, none of it from a chair link.**

---

## Linked-product: the first named-chair earnings row in site history — read it carefully

| Product | ASIN | Clicks | Items shipped | Shipped revenue | Earnings |
|---|---|---|---|---|---|
| Steelcase Leap Plus | `B00TYE4QXU` | **47** | 4 | $2,690.77 | **$80.89** |
| Steelcase Gesture | `B016OIF2JU` | 28 | — | — | — |
| Herman Miller Aeron Size C | `B01N32UFNT` | 14 | — | — | — |
| Crandall Remanufactured Leap V2 | `B08PPVCCST` | 11 | — | — | — |
| *(others — unlinked)* | — | 31 | 1 | $7.99 | $0.24 |

**Every prior export booked 100% of earnings to `others`. This one books 99.7% ($80.89 of $81.13)
to the Steelcase Leap Plus row.** That looks like the conversion breakthrough the site has been
waiting on. **It is not, and the tracking-ID table above is why:** the same 4 shipped items are
attributed to the *legacy* tag, and the algebra dates them to Jul 27 – Aug 4 — before the tag split,
in a period already logged as zero chair orders. The dedicated chair tag, covering the same ASIN,
earned $0.00.

The two readings are reconcilable only if the linked-product row credits *session basket* revenue to
the referring ASIN rather than sales of that ASIN. Supporting evidence: $2,690.77 over 4 items is
$672.69 average, and the Leap Plus is a ~$1,300+ chair — 4 Leap Plus chairs cannot cost $2,690.77.
**Do not record this as a Leap Plus sale.** It is a Leap Plus *referral* whose basket was something
else, which is the same "toll on sessions TCA originated" pattern this archive has logged since June.

### The two dimensions disagree by exactly $397.00

| Bucket | linked-product | tracking-id |
|---|---|---|
| Named chair / legacy tag | 4 items, $2,690.77, $80.89 | 4 items, $2,293.77, $68.98 |
| `others` | 1 item, $7.99, $0.24 | 1 item, $404.99, $12.15 |
| Sum | 5 items, $2,698.76, $81.13 | 5 items, $2,698.76, $81.13 |

Both totals are correct; the split is not. Exactly **$397.00 of shipped revenue and $11.91 of
earnings** sit on the chair row in one report and the `others` row in the other. Per standing policy
in [[affiliate-performance]], **the two reports are not reconciled click-for-click here** — nothing
downstream reads the difference, and a reconciliation invented to make two Amazon reports agree
would be a number this archive cannot support.

`category.csv` disagrees a third way: it puts all 5 shipped items and all $81.13 on the `others`
category row (15 clicks) while Furniture (116 clicks) is dashes end to end — directly contradicting
linked-product, which puts $80.89 on a Furniture-category ASIN. Click totals still reconcile at 131
across all three reports.

`top-sellers.csv` is a header row and nothing else — no top sellers in the period. Consistent with
every export in this archive.

---

## Click movement — Leap Plus is still the site's top surface

| ASIN | Product | Aug 26 (Jul 27–Aug 25) | Aug 13 | Jul 31 |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **47** | 50 | 45 |
| B016OIF2JU | Steelcase Gesture | 28 | 23 | 24 |
| B01N32UFNT | Herman Miller Aeron Size C | 14 | 16 | 12 |
| B08PPVCCST | Crandall Remanufactured Leap V2 | **11 (new)** | — | — |
| others | — | 31 | 33 | 11 |
| **Total** | | **131** | 122 | 92 |

Leap Plus holds the top slot for the fourth consecutive period, though its share is eroding
(49% → 41% → 36%) as Gesture and the newly-attributed Crandall Leap V2 pick up. **The Crandall
Remanufactured Leap V2 (`B08PPVCCST`) appears with attributed clicks for the first time** — the
[[refurbished-steelcase-leap]] page is generating real affiliate traffic.

The queued "I almost bought this" reframe of [[review-leap-plus]] still has the strongest click
support of any content item on the board. **What this export adds is that clicks are not the
constraint** — 134 named chair clicks across two periods have produced zero chair revenue.

---

## What this does and does not change

**Does:**
- **Closes the window ambiguity** that has dogged every hand export since Jul 17. The method
  (algebra against the automated daily rows) is reusable on any future hand drop.
- **Validates the 2026-08-13 tag split end to end.** It shipped, Amazon is reporting on it, and it
  produced a decision-grade answer in 12 days.
- **Puts a clean zero on chair conversion.** No longer an inference.
- Flags ~$1,575 of unshipped ordered revenue (~$47 at 3%) to watch.

**Does not:**
- **Does not close the automated pull.** `data/affiliate/latest.json` still carries
  `fetchedAt: 2026-08-09T08:04:51Z` — **17 days stale** against a 3-day SLA. `collectors/amazon.ts`
  will keep reporting the automated path stale, correctly. A hand-dropped CSV resets the 7-day human
  nag, not the 3-day automation check. **The stored Amazon session must be re-captured before
  `amazon-pull.ts` can run again**, and no CSV drop substitutes for that. This is the same blocker
  the 2026-08-13 note recorded; it is now 17 days old and is the reason August's month-close will be
  reconstructed by hand unless it is fixed before 2026-09-01.
- **Does not overwrite `latest.json`.** This export's window (Jul 27–Aug 25) is a rolling window, not
  a month, and it carries no per-day rows. Writing it would replace 25 dated daily rows with one
  undated aggregate and destroy the exact instrument that let this window be solved.
- **Does not settle August.** The kill-list gate ("2–3 consecutive months above $100") measures
  calendar months. August 1–25 earnings recoverable from this export = $12.15 shipped
  ($6.84 booked Aug 1–4 + ~$5.31 in the `others` bucket after), against a $100 gate, with ~$47
  unshipped that could land. **August is on track to fail the gate.** Gate stands at 1 of 2–3;
  August closes 2026-09-01.

---

## Recommended next actions

1. **Re-capture the Amazon session** (`AMAZON_STORAGE_STATE`) — human-only act, 17 days overdue,
   and the only thing standing between the nightly and a clean August close.
2. **Do not spend further effort growing chair clicks on Amazon.** Two periods, 134 named chair
   clicks, $0.00. The constraint is the 3% furniture tier against a $500+ considered purchase, not
   traffic. This is direct evidence for the [[thesis]] diversification argument.
3. **Watch the `others` tracking-ID bucket.** $12.15 on 5 clicks is a 100% product conversion rate —
   the highest in the archive — and it is the only new money in 22 days. If accessories are landing
   there, `tcaaccessory-20` should start showing its own row and confirm it.
4. **Log the Crandall Leap V2's first attributed clicks** on [[refurbished-steelcase-leap]].
