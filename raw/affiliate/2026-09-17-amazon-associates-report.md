# Amazon Associates Report — snapshot dated 2026-09-17 (data stamp 2026-09-16)

**Source:** HAND EXPORT from Associates Central, dropped by Jackson (`~/Downloads/TCA Amazon Data/Sept 17 Amazon Data`).
Raw CSVs: `raw/affiliate/2026-09-17-amazon-csv/`.

> ## THE HEADLINE: the Aug 28/Aug 30 "replication" did not replicate — and was never independent.
>
> `tcachair-20` reads **62 clicks → 0 orders → $0.00** across a full 30-day window.
>
> The two-export EPC agreement of $0.484 / $0.4875 that this archive called
> "the first thing that has ever replicated" was **the same order cohort counted twice.**
> That cohort has now aged out of the window and the chair tag reads zero.

---

## Window — RECORDED (not solved): rolling 30-day, 2026-08-18 → 2026-09-16

**Stated by Jackson at ingest time**, per Rule 2. The algebra of Rule 3 was **unavailable** here:
`data/affiliate/latest.json` freezes daily rows only for 2026-07-11 → 2026-08-09, and this window
begins nine days after the decoder ends. Had Jackson not recorded the range, this export would have
been **unloggable**. First export where the algebra could not have rescued a missing window.

Relationship to the previous export (Aug 30, window 2026-07-31 → 2026-08-29):

| | |
|---|---|
| Overlap (in both windows) | **Aug 18 – Aug 29** (12 days) |
| New in this window | **Aug 30 – Sep 16** (18 days) |
| Dropped from prior window | **Jul 31 – Aug 17** (18 days) |

---

## Totals

| Metric | Aug 30 export | **This export** |
|---|---|---|
| Clicks | 132 | **154** |
| Items ordered | 11 | **22** |
| Ordered revenue | $1,189.67 | **$2,073.41** |
| Items returned | 0 | **0** |
| Earnings | $36.09 | **$63.21** |
| Commission rate | 3.02% | **3.05%** |
| Avg item value | $106.85 | **$94.25** |

---

## Tracking IDs — the chair tag is a clean null

| Tracking ID | Clicks | Ordered | Revenue | Earnings |
|---|---|---|---|---|
| `tallchairadvi-20` (legacy) | 34 | — | — | **$0.00** |
| `tcachair-20` (chairs) | **62** | **—** | **—** | **$0.00** |
| `Other` (residual bucket) | 58 | 22 | $2,073.41 | **$63.21** |
| `tcaaccessory-20` | **no rows, ever** | — | — | — |
| `tcadesk-20` | **no rows, ever** | — | — | — |

### The algebra: all 9 prior chair orders were booked before Aug 18

The overlap window Aug 18–29 sits inside **both** exports. If any of the 9 `tcachair-20` orders in
the Aug 30 export had been booked during those 12 days, they would still appear here. They do not.

**Therefore all 9 orders were booked Jul 31 – Aug 17**, and `tcachair-20` has now recorded
**62 clicks and zero orders since Aug 18** — a full 30-day window at $0.00 EPC on the chair tag.

### Why the Aug 28 / Aug 30 "replication" was not a replication

Both prior windows contained the Jul 31 – Aug 17 period, so both were measuring **the same order
cohort**. Aug 28 read 6 orders; Aug 30 read 9 — the same set, further shipped. Two readings of one
cohort is not two independent samples, and the EPC agreement ($0.484 → $0.4875) followed
arithmetically rather than confirming anything.

**This is precisely the failure mode Rule 1 of the monthly log exists to prevent**, applied one
level up: the rule forbids *adding* overlapping snapshots, but the same overlap also invalidates
treating them as independent *confirmations*. The archive caught the addition error on 2026-08-01
and then made the correlation version of it on 2026-08-30.

**Status of the Leap-Plus EPC finding: withdrawn to n = 1 cohort.** The fourth export that
`thesis.md` said was owed has arrived and does not agree.

---

## Zero chair units — fourth consecutive export

Average item value continues to move **away** from chair prices: $157.30 → $106.85 → **$94.25**.
Commission rate 3.05% is the furniture tier, so these remain furniture-class items — just not
$1,300 chairs. **Basket spillover, confirmed a fourth time.** No unit of any chair this site
recommends has ever sold.

---

## ⚠ Amazon changed the export format

This drop is structurally different from every prior export and **the cross-dimension
reconciliation that first succeeded on Aug 30 is broken again**:

- Dates are `MM-DD-YYYY` (`09-16-2026`), previously ISO (`2026-08-29`)
- Numerics are floats (`154.0`), previously integers
- The residual bucket is capitalised `Other`, previously lowercase `others`
- `Product Title` and `Category` are `-` where they were populated
- **`Other` is 105 clicks in `linked-product.csv` but 58 in `tracking-id.csv`** — the same label
  carrying different values in the same drop, which is what identifies it as a per-report residual
  rather than an entity
- The Leap Plus ASIN appears on **two rows** in `linked-product.csv` (19 and 30 clicks)

All three CSVs still agree on the 154-click total and the $63.21 earnings. They disagree on
everything below that.

---

## OPEN — where did 22 orders come from if both named tags are zero?

Both instrumented tags read $0.00, yet 22 orders exist. Two readings, not yet separable:

**(a) Format change collapsed attribution.** The capital `Other` bucket is absorbing per-tag
attribution that previous exports itemised. Supported by the format change and by `Other` holding
inconsistent values across the three CSVs.

**(b) CompanionPicks fired and is landing in the residual.** `CompanionPicks.astro` shipped
2026-09-01 (accessory links 14 → 32, desk 3 → 9); 16 of this window's 30 days are post-ship. The
$94.25 average item value sits squarely in the **sub-$300 band that CompanionPicks was built to
test**, and $94 is not a chair.

**Against (b):** Amazon has emitted zero-rows for known tags before — `tallchairadvi-20` appears at
$0.00 in this very export — so `tcaaccessory-20` would be expected to have its own row if it had
fired at all.

**Discriminating test, and it does not require waiting a month:** Associates Central's UI reports
earnings by tracking ID directly. If `tcaaccessory-20` or `tcadesk-20` show any activity there for
Aug 18 – Sep 16, reading (b) holds and CompanionPicks has its first signal. If they are absent,
reading (a) holds and the residual is a reporting artifact.

**Until that check is run, this is a watchlist hypothesis, not a result.** Per
[[statistical-confidence-policy]] — "do not say a fix worked from one short window" — and per this
file's own record of twice booking a single export as settled and retracting it.

**CompanionPicks readout as it stands: NULL.** The pre-committed read was "the next hand export
showing a non-zero row for `tcaaccessory-20` or `tcadesk-20`." Neither tag has a row. Reported as a
real answer, per the commitment made when the test shipped.

---

## Earnings rose, and that is not yet a trend

$36.09 → $63.21 across windows sharing 12 days. Orders 11 → 22. The increase is real money, but it
arrives entirely in an unattributed bucket during an export-format change, which is the weakest
possible provenance. It should not be read as growth until the tracking-ID question above resolves.
