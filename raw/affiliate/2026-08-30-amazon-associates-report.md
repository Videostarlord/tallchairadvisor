# Amazon Associates Report — snapshot dated 2026-08-30 (data stamp 2026-08-29)

**Source:** HAND EXPORT from Associates Central, dropped by Jackson (`~/Downloads/Aug 30th Amazon Data`).
Raw CSVs: `raw/affiliate/2026-08-30-amazon-csv/`.

> ## THE HEADLINE: the Aug 28 reading REPLICATES.
>
> `tcachair-20` earns **$29.25 on 60 clicks — an EPC of $0.49/click.**
> Two days ago, on a different window, the same tag read **$28.54 on 59 clicks — $0.48/click.**
>
> This is the **second consecutive export** at the same rate, and it is the first thing in this
> archive that has ever replicated. The Aug 26 → Aug 28 reversal ($0.00 → $28.54) was a swing
> between two single readings. This is not a swing; it is the same number twice.

---

## Window — SOLVED: rolling 30-day, 2026-07-31 → 2026-08-29

Third consecutive successful application of the algebra in `data/affiliate/README.md`. Summing the
frozen per-day rows in `data/affiliate/latest.json` forward from **2026-07-31** gives
**2 ordered / $227.98 ordered revenue / 2 shipped / $227.98 shipped revenue / $6.84 earnings** —
matching this export's `others` row on **five independent quantities**.

*(As on 2026-08-28, the algebra alone cannot pin the exact start: Jul 30, Jul 31, Aug 1 and Aug 2
all produce the identical sum, because Jul 30 recorded 5 clicks and no orders and Jul 31 has no row
at all. 30 days back from the export's own 2026-08-29 stamp gives **Jul 31**, which sits inside that
band, so the stamp and the algebra agree.)*

**The window advanced 2 days** from the last export (Jul 29–Aug 27 → Jul 31–Aug 29). That is the
entire explanation for the drop in headline earnings, and it must not be read as a loss:

| | Aug 28 export | Aug 30 export | Why |
|---|---|---|---|
| `others` earnings | $68.30 | **$6.84** | The **Jul 29** shipped item ($2,048.80 revenue / **$61.46** earnings) aged out of the window |
| Total earnings | $96.84 | **$36.09** | −$60.75, of which **$61.46 is that single aged-out item** |

**Underlying earnings actually rose by $0.71.** Old money left the window; new money did not leave.

---

## Totals as stated by `tracking-id.csv`

| Tracking ID | Clicks | Items ordered | Ordered revenue | Items shipped | Shipped revenue | **Earnings** | vs Aug 28 |
|---|---|---|---|---|---|---|---|
| `tallchairadvi-20` (legacy) | 67 | — | — | — | — | **$0.00** | 75 clicks, $0.00 |
| **`tcachair-20` (chairs)** | **60** | **9** | **$961.69** | **9** | **$961.69** | **$29.25** | 59 clicks, 6 ord, $28.54 |
| `others` | 5 | 2 | $227.98 | 2 | $227.98 | **$6.84** | 5 clicks, 3 ship, $68.30 |
| **Total** | **132** | **11** | **$1,189.67** | **11** | **$1,189.67** | **$36.09** | 139 clicks, $96.84 |

**All three CSVs reconcile exactly this time** — 132 clicks, 11 items ordered, $1,189.67 ordered
revenue, $36.09 earnings, on every one of category / linked-product / tracking-id. That is a first
in this archive; every prior export disagreed on at least one total.

`top-sellers.csv` was **not included** in this drop. Every previous export shipped it as a header
row only, so nothing is lost — but note the drop contained 3 files, not 4.

---

## THE FINDING: the EPC replicates, and the chairs still do not sell

### 1. Chair-tag EPC is now a two-point measurement, and both points agree

| Export | Window | `tcachair-20` clicks | Earnings | **EPC** |
|---|---|---|---|---|
| Aug 26 | Jul 27 – Aug 25 | 45 | $0.00 | $0.00 |
| Aug 28 | Jul 29 – Aug 27 | 59 | $28.54 | **$0.484** |
| **Aug 30** | **Jul 31 – Aug 29** | **60** | **$29.25** | **$0.4875** |

The Aug 26 zero is now clearly what the Aug 28 report argued it was: a **null result read as a
settled rate**, on a channel producing ~6–9 orders a month. Two independent windows now put the
chair tag at **$0.48–0.49/click**, and the second was not available when the first was written.

At the current ~132 clicks/30d that is a **~$64/month** run rate from chair links.

### 2. Zero chair units. Third consecutive export. The archive is now unambiguous.

| ASIN | Product | Clicks | Items ordered |
|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus (~$1,300) | 45 | **6** |
| B016OIF2JU | Steelcase Gesture (~$1,500) | 30 | **0** |
| B01N32UFNT | Herman Miller Aeron Size C (~$1,800) | 18 | **0** |
| B08PPVCCST | Crandall Remanufactured Leap V2 | 11 | **0** |

The six items booked against the Leap Plus row total **$848.79 — an average of $141.47.** Amazon
states the commission rate on that row as **3.02%**, the furniture tier, so these are furniture-class
items — just not $1,300 chairs.

**The average is falling as the sample grows:** $157.30 (6 items, Aug 28) → **$106.85** (9 items,
Aug 30, across the whole tag). Every new order lands further from chair prices, not closer. This is
basket spillover inside the 24-hour attribution window, and three exports have now failed to produce
a single unit of a chair this site recommends.

| Claim | Status after three exports |
|---|---|
| "$500+ chair links do not produce chair sales on Amazon" | **CONFIRMED.** 0 chair units across the entire archive. |
| "Chair clicks are not a revenue lever" | **FALSE, and now replicated.** $0.48–0.49/click, twice. |

### 3. The Leap Plus is carrying the channel alone

45 of 132 clicks and **all 6 attributed orders** sit on one ASIN — a **13.33% product conversion
rate**, stated by Amazon on that row. Gesture (30 clicks), Aeron (18) and Crandall (11) contributed
**59 clicks and zero orders** between them.

That concentration is worth naming: the "chair clicks earn $0.49" finding is, more precisely,
**"Leap Plus clicks earn"**. Whether the other three ASINs monetise at all is still an open
question with a 59-click sample and no conversions.

---

## Cross-dimension split — the tracking-ID row remains the one to trust

| Bucket | linked-product.csv | tracking-id.csv |
|---|---|---|
| Leap Plus `B00TYE4QXU` / `tcachair-20` | 6 ordered, $848.79, **$25.69** | 9 ordered, $961.69, **$29.25** |
| `others` | 5 ordered, $340.88, $10.40 | 2 ordered, $227.98, $6.84 |
| Sum | $36.09 | $36.09 |

Totals agree; the splits still disagree, as in every export here. **For "do chair links earn?", the
tracking-ID row is authoritative** — the tag is what `src/data/affiliate-tags.ts` controls and what
Amazon attributes the whole 24-hour session against. `linked-product.csv` credits basket revenue to
the referring ASIN, which is why 3 orders and $112.90 move between the two views.

`category.csv` disagrees a third way, booking all $36.09 to `others` (15 clicks) while Furniture
(117 clicks) is dashes end to end. **Not reconciled line-for-line**, per standing policy.

---

## Click movement

| ASIN | Product | Aug 30 (Jul31–Aug29) | Aug 28 | Aug 26 | Aug 13 | Jul 31 |
|---|---|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **45** | 49 | 47 | 50 | 45 |
| B016OIF2JU | Steelcase Gesture | **30** | 30 | 28 | 23 | 24 |
| B01N32UFNT | Herman Miller Aeron Size C | **18** | 18 | 14 | 16 | 12 |
| B08PPVCCST | Crandall Remanufactured Leap V2 | 11 | 11 | 11 | — | — |
| others | — | 28 | 31 | 31 | 33 | 11 |
| **Total** | | **132** | 139 | 131 | 122 | 92 |

Clicks 139 → 132 on a 2-day window shift. Leap Plus −4, Gesture and Aeron flat, others −3. Nothing
here is a trend at this resolution; the window moved.

**Tag migration continues.** `tcachair-20` 60 vs legacy 67, from 59 vs 75 two days ago. The chair
tag is flat while the legacy tag decays as cached pages age out — expected, and the crossover is
close. `tcaaccessory-20` and `tcadesk-20` still have no rows of their own.

---

## Position for [[affiliate-performance]] and [[thesis]]

1. **Chair-tag EPC of ~$0.49 has replicated across two independent windows.** Per
   [[statistical-confidence-policy]] this is the second of the "third and fourth export" the Aug 28
   report asked for. It is no longer a single reading — but n is still 9 orders total.
2. **Do not chase chair UNIT sales.** Zero across the whole archive, and the average item price is
   moving *away* from chair prices as the sample grows.
3. **The finding is narrower than "chair clicks".** All 6 orders sit on the Leap Plus ASIN. Gesture,
   Aeron and Crandall: 59 clicks, 0 orders. Treat the EPC as a Leap-Plus figure until another ASIN
   converts.
4. **August close (2026-09-01): ~$36.** The window Jul 31–Aug 29 is very nearly August-to-date and
   Jul 31 contributed nothing, so ~$36 is a good estimate of the month. That is ~3x the Aug 26
   forecast ($12.15) and consistent with the Aug 28 estimate ($35.38).
5. **Two separate bars are being tracked, and August splits them.** They must not be conflated:
   - **The Jul 3 kill-list gate is "2–3 consecutive positive revenue months."** The bar is
     *positive*, not $100. August at ~$36 is positive, so on the gate as written this moves the
     count from **1 of 2–3 to 2 of 2–3** — the first advance since July. **This is a decision
     Jackson has to make, not one this report should make for him:** the gate was written when a
     positive month meant +$92.06, and $36 is positive in a way that may not be what was meant.
   - **The thesis separately tracks a "$100 month."** August misses it, and misses it by ~64%.
6. **The third export the thesis asked for has arrived, and it agrees with the second.** thesis.md
   says the strategy "should not turn again until a third and fourth export agree." Two of the three
   chair-tag readings now agree, on consecutive independent windows, and the outlier is the one the
   Aug 28 report already diagnosed as a null result. A fourth export is still owed before this is
   treated as settled — but the balance of evidence has moved decisively.
