# Amazon Associates Report — snapshot dated 2026-08-13

**Source:** HAND EXPORT from Associates Central, dropped by Jackson. Not the automated pull.
Raw CSVs: `raw/affiliate/2026-08-13-amazon-csv/` (category, linked-product, top-sellers, tracking-id).

**Window: UNKNOWN — the export does not state it, and it has NOT been guessed.**

This is the ambiguity the 2026-08-09 note warned about, and it applies here in full. The
`tracking-id` CSV carries no date column at all. The `category` and `linked-product` CSVs
stamp every row `2026-08-12`, which is a single date — but the order figures below are
identical **to the cent** to the 30-day window ending 2026-08-09, and one day did not
independently reproduce a month. So the date column is a report boundary, not a day, and
which boundary it is cannot be recovered from the file.

`data/affiliate/latest.json` was therefore **NOT overwritten from this export.** Writing a
snapshot would require inventing `window.start`, and a fabricated window is exactly how
one export in this archive was already misread (see the 2026-08-04 note). The live layer
still says what it honestly knows: last successful automated pull 2026-08-09.

## Totals as stated by `tracking-id.csv`

| Metric | Value |
|---|---|
| Tracking ID | `tallchairadvi-20` |
| Clicks | 122 |
| Items ordered | 7 |
| Ordered revenue | $3,337.74 |
| Items shipped | 7 |
| Items returned | 0 |
| Shipped revenue | $3,337.74 |
| **Total earnings** | **$100.40** |
| Bonus | $0.00 |

## THE FINDING: 89 chair clicks, zero chair orders

`linked-product.csv`, every click attributed to a product:

| Product | ASIN | Clicks | Items ordered | Earnings |
|---|---|---|---|---|
| Steelcase Leap Plus | `B00TYE4QXU` | 50 | — | — |
| Steelcase Gesture | `B016OIF2JU` | 23 | — | — |
| Herman Miller Aeron Size C | `B01N32UFNT` | 16 | — | — |
| *(others — unlinked)* | — | 33 | 7 | $100.40 |

**Every item ordered and 100% of the $100.40 came from the `others` bucket — products this
site never linked to.** The three chairs the entire site is built around took 89 clicks
between them and converted zero. That is not a rounding artifact; the `-` in those rows is
Amazon reporting no orders at all, not a suppressed small number.

`category.csv` splits the same 122 clicks differently — Furniture 111 / others 11, against
linked-product's 89 / 33. Both sum to 122. The two reports attribute clicks on different
dimensions and the difference is **not** reconciled here, because nothing downstream reads
it and a reconciliation invented to make two Amazon reports agree would be a number this
archive cannot support.

`top-sellers.csv` is a header row and nothing else — no top sellers in the period.

## What this does and does not change

**Does:** the revenue picture is no longer four days blind. It also puts a number on
something previously only argued from GSC — the Leap Plus page pulls the most affiliate
clicks of any chair on the site (50, more than Gesture and Aeron combined), which is
direct support for the queued "I almost bought this" reframe.

**Does not:** close the automated pull. `data/affiliate/latest.json` still carries
`fetchedAt: 2026-08-09`, so `collectors/amazon.ts` will keep reporting the automated path
stale past `AUTOMATED_STALE_DAYS = 3` — correctly. A hand-dropped CSV resets the 7-day
human nag, not the 3-day automation check. **The stored Amazon session still has to be
re-captured before `amazon-pull.ts` can run again**, and no CSV drop substitutes for that.

**Comparison with 2026-08-09 (30-day window ending 08-09): items ordered 7 → 7, ordered
revenue $3,337.74 → $3,337.74, earnings $100.40 → $100.40, clicks 108 → 122.** Identical
order figures across two separately-run exports is strong evidence that **no order landed
between 2026-08-09 and this export** and the only movement was ~14 clicks. Stated as
evidence, not as fact, because the windows are not known to be the same.
