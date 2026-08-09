# Amazon Associates Report — snapshot dated 2026-08-09

**Source:** Associates Central reporting API, pulled automatically by `scripts/amazon-pull.ts`.
Raw daily rows: `raw/affiliate/2026-08-09-amazon-json/overview-daily.json`.

**Window: ROLLING-30-DAY (2026-07-11 -> 2026-08-09) — set by this script, not inferred.**

The window is stated because it is not recoverable from the data itself. Month-to-date
and rolling-30-day exports are indistinguishable once downloaded, and one export in this
archive was already misread that way (see the 2026-08-04 note). Because this run chose
the range explicitly, that ambiguity does not apply to it.

## Totals for the window

| Metric | Value |
|---|---|
| Clicks | 108 |
| Items ordered | 7 |
| Ordered revenue | $3337.74 |
| Items shipped | 7 |
| Items returned | 0 |
| Shipped revenue | $3337.74 |
| **Shipped earnings (before returns clawback)** | **$100.40** |

Covering **25 day(s)** in range, of which 25 had at least one click.

> **`total_earnings` is SHIPPED earnings, not net.** Verified against the 2026-08-04
> archive export: this column returned $100.40 where that report's headline net was
> **$98.90**, the difference being a $1.50 returned-item clawback. The clawback amount
> is not in this column set — only the returned-item *count* is. So do not copy the
> figure above into the monthly log in [[affiliate-performance]] as net earnings; it is
> an upper bound, and the gap is the clawback.

## Days with activity

| Day | Clicks | Ordered | Ordered rev | Earnings |
|---|---|---|---|---|
| 2026-08-08 | 4 | 0 | $0.00 | $0.00 |
| 2026-08-07 | 8 | 0 | $0.00 | $0.00 |
| 2026-08-06 | 3 | 0 | $0.00 | $0.00 |
| 2026-08-05 | 5 | 0 | $0.00 | $0.00 |
| 2026-08-04 | 9 | 1 | $219.99 | $6.60 |
| 2026-08-03 | 4 | 0 | $0.00 | $0.24 |
| 2026-08-02 | 4 | 1 | $7.99 | $0.00 |
| 2026-08-01 | 3 | 0 | $0.00 | $0.00 |
| 2026-07-30 | 5 | 0 | $0.00 | $0.00 |
| 2026-07-29 | 3 | 0 | $0.00 | $61.46 |
| 2026-07-28 | 2 | 0 | $0.00 | $0.00 |
| 2026-07-27 | 4 | 1 | $16.99 | $0.68 |
| 2026-07-26 | 3 | 0 | $0.00 | $0.00 |
| 2026-07-25 | 5 | 1 | $9.98 | $0.40 |
| 2026-07-24 | 3 | 0 | $0.00 | $0.00 |
| 2026-07-23 | 3 | 0 | $0.00 | $0.00 |
| 2026-07-22 | 9 | 1 | $304.99 | $9.15 |
| 2026-07-21 | 1 | 0 | $0.00 | $0.00 |
| 2026-07-20 | 2 | 0 | $0.00 | $0.00 |
| 2026-07-19 | 3 | 1 | $2048.80 | $0.00 |
| 2026-07-18 | 6 | 0 | $0.00 | $0.00 |
| 2026-07-17 | 1 | 0 | $0.00 | $0.00 |
| 2026-07-16 | 3 | 0 | $0.00 | $21.87 |
| 2026-07-15 | 4 | 1 | $729.00 | $0.00 |
| 2026-07-13 | 11 | 0 | $0.00 | $0.00 |

## Scope of this pull

This is the **daily overview** report only. The ASIN-level breakdown (linked products,
category, top sellers) uses different `query[type]` values on the same endpoint, and the
correct parameters for those were not established — probing for them started returning
HTTP 429, so it was stopped rather than risk the account. Those tables are still
available by hand in Associates Central.

**Consequence worth stating:** click-to-ASIN attribution — the "0 chair orders on N chair
clicks" pattern tracked in [[affiliate-performance]] — is NOT in this pull and still needs
a manual export to update.

