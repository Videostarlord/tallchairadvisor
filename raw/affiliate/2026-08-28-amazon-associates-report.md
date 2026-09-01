# Amazon Associates Report — snapshot dated 2026-08-28

**Source:** HAND EXPORT from Associates Central, dropped by Jackson.
Raw CSVs: `raw/affiliate/2026-08-28-amazon-csv/`.

> ## ⚠ THIS EXPORT REVERSES THE HEADLINE FINDING OF THE 2026-08-26 EXPORT, TWO DAYS LATER.
>
> On 2026-08-26 `tcachair-20` read **45 clicks, 0 orders, $0.00**, and a decision was recorded on
> that basis: *"Amazon chair clicks are no longer counted as a revenue lever."*
>
> **It now reads 59 clicks, 6 items ordered, $943.79 revenue, $28.54 earnings.**
>
> That decision is **wrong as stated** and is revised below. It was made on 12 days of data and a
> single reading; this is what a sample size of one export buys.

---

## Window — SOLVED: rolling 30-day, 2026-07-29 → 2026-08-27

Same algebra as the 2026-08-26 export, and it resolved again. Summing the frozen per-day rows in
`data/affiliate/latest.json` from 2026-07-29 onward gives **3 shipped / $2,276.78 shipped revenue /
$68.30 earnings / 2 ordered / $227.98 ordered revenue** — matching this export's `others` row on
**five independent quantities**. The method now has two confirmations and is reliable.

*(Jul 28 contributed nothing, so the algebra alone cannot separate a Jul 28 from a Jul 29 start;
30 days back from the 2026-08-27 stamp gives Jul 29.)*

The window has advanced 2 days from the last export (Jul 27–Aug 25 → Jul 29–Aug 27), which is what
dropped the Jul 27 order ($16.99 / $0.68) out of the totals.

---

## Totals as stated by `tracking-id.csv`

| Tracking ID | Clicks | Items ordered | Ordered revenue | Items shipped | Shipped revenue | **Earnings** |
|---|---|---|---|---|---|---|
| `tallchairadvi-20` (legacy) | 75 | — | — | — | — | **$0.00** |
| **`tcachair-20` (chairs)** | **59** | **6** | **$943.79** | **6** | **$943.79** | **$28.54** |
| `others` | 5 | 2 | $227.98 | 3 | $2,276.78 | **$68.30** |
| **Total** | **139** | **8** | **$1,171.77** | **9** | **$3,220.57** | **$96.84** |

Cross-checks: clicks reconcile at **139** across all three reports; earnings, shipped revenue and
shipped items all reconcile to the `category.csv` totals. `top-sellers.csv` is a header row only,
as in every export in this archive.

---

## THE FINDING: chair links earn — but not by selling chairs

**`tcachair-20`: 59 clicks → 6 items ordered → $28.54.** An EPC of **$0.48/click** and a product
conversion rate Amazon states directly on the Leap Plus row as **12.24%**.

**All $28.54 is new since the 2026-08-26 export**, where the same tag read $0.00. The other $68.30
is old money — the algebra dates every cent of it to on or before 2026-08-04, exactly as the last
export found.

### What did NOT change: $500+ chairs still do not sell

**$943.79 ÷ 6 items = $157.30 average.** The Leap Plus is a ~$1,300 chair, the Gesture ~$1,500, the
Aeron Size C ~$1,800. **Not one of the six items is a chair this site recommends.** They are
cheaper products bought inside the 24-hour attribution window that a chair click opened.

So the original diagnosis survives in its narrow form and dies in its broad form:

| Claim | Status |
|---|---|
| "$500+ chair links do not produce chair sales on Amazon" | **STILL TRUE.** 139 clicks, 0 chair units, across every export in this archive. |
| "Chair clicks are not a revenue lever" | **FALSE.** They are a $0.48/click lever. The revenue arrives as basket spillover, not as the recommended product. |

**This is the same "toll on sessions TCA originated" pattern the archive has logged since June — but
for the first time it is attributed, measurable, and attached to a tag that can be optimised.**
Before the 2026-08-13 tag split this money was invisible inside an `others` bucket and looked like
an accident. It is not an accident. It is a repeatable ~10% conversion on traffic this site sends.

---

## Cross-dimension mismatch, again — and why the tracking-ID row is the one to trust

| Bucket | linked-product.csv | tracking-id.csv |
|---|---|---|
| Leap Plus `B00TYE4QXU` / `tcachair-20` | 6 ordered, 7 shipped, $2,897.59, **$87.15** | 6 ordered, 6 shipped, $943.79, **$28.54** |
| `others` | 2 ordered, 2 shipped, $322.98, $9.69 | 2 ordered, 3 shipped, $2,276.78, $68.30 |
| Sum | $96.84 | $96.84 |

Both totals are right; the splits disagree, as they have in every export here. **For the question
this site actually asks — "do chair links earn?" — the tracking-ID row is authoritative**, because
the tracking ID is what `src/data/affiliate-tags.ts` controls and what Amazon attributes the whole
24-hour session against. The linked-product row credits basket revenue to the referring ASIN, which
is why $2,897.59 appears against four items that cannot cost that.

`category.csv` disagrees a third way, booking all $96.84 to `others` (15 clicks) while Furniture
(124 clicks) is dashes end to end. **The three reports are not reconciled line-for-line here**, per
standing policy.

---

## Click movement

| ASIN | Product | Aug 28 (Jul 29–Aug 27) | Aug 26 | Aug 13 | Jul 31 |
|---|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **49** | 47 | 50 | 45 |
| B016OIF2JU | Steelcase Gesture | **30** | 28 | 23 | 24 |
| B01N32UFNT | Herman Miller Aeron Size C | **18** | 14 | 16 | 12 |
| B08PPVCCST | Crandall Remanufactured Leap V2 | 11 | 11 | — | — |
| others | — | 31 | 31 | 33 | 11 |
| **Total** | | **139** | 131 | 122 | 92 |

Clicks up 131 → 139 in two days of window shift. Leap Plus still #1 and is also the row carrying the
conversions. Gesture and Aeron both up.

**Tag migration is nearly complete:** `tcachair-20` now carries 59 clicks against the legacy tag's
75, up from 45 vs 81 two days ago. The legacy tag is decaying as cached pages age out, as expected.
`tcaaccessory-20` and `tcadesk-20` still have no rows of their own.

---

## Revised position for [[affiliate-performance]] and [[thesis]]

1. **Chair clicks monetise at ~$0.48 EPC.** At the current ~139 clicks/30d that is **~$67/month**
   from chair links alone, if the rate holds. That is not nothing against a $100/month gate.
2. **Do not chase chair UNIT sales.** Zero in the entire archive. The money is spillover.
3. **n=6 orders. One export.** The 2026-08-26 reading was $0.00 on the same tag two days earlier,
   which is precisely how large the swing can be at this volume. **Do not build a plan on either
   reading alone.** Per [[statistical-confidence-policy]], wait for a third and fourth export.
4. **August close (2026-09-01) is now materially better than forecast.** The Aug 26 export projected
   ~$12.15 for August against a $100 gate. Recoverable August earnings are now at least
   **$28.54 + $6.84 = $35.38**, with the return window still open.
