# Amazon Associates Report — snapshot dated 2026-08-03

**Source:** 3 CSV exports (Category, Linked-Product, Tracking-Id), downloaded 2026-08-04. No Top-Sellers export in this download.
Raw CSVs: `raw/affiliate/2026-08-03-amazon-csv/`.

**Window: LAST 30 DAYS (confirmed by Jackson 2026-08-04) = 2026-07-05 → 2026-08-03.**

This is the first export with a **confirmed** date range. It is a **rolling 30-day window**, not month-to-date — a different window type from every prior export in the archive. It therefore cannot be appended to the monthly performance log.

---

## Headline (Tracking-Id: tallchairadvi-20)

| Metric | Aug 3 export (rolling Jul 5 – Aug 3) | July final (Jul 1–31, MTD) |
|---|---|---|
| Clicks | 101 | 92 |
| Items ordered | 6 (5 indirect + 1 direct) | 5 (4 indirect + 1 direct) |
| Ordered revenue | $3,117.75 | $3,109.76 |
| Items shipped | 6 | 5 |
| Items returned | 1 ($49.99) | 1 ($49.99) |
| Shipped earnings | $93.80 | $93.56 |
| Returned clawback | −$1.50 | −$1.50 |
| **Total earnings** | **+$92.30** | **+$92.06** |

---

## This export is ~99.7% July's money re-reported

The rolling window overlaps July almost entirely. Reconciliation against the Jul 31 month close:

| Delta | Value |
|---|---|
| Clicks | +9 |
| Items ordered | +1 |
| Ordered revenue | **+$7.99** |
| Net earnings | **+$0.24** |

$0.24 / $7.99 = **3.00%** — exactly the furniture tier, consistent with one new low-value item.

Window algebra: `(Jul 5 – Aug 3) = (Jul 1–31) − (Jul 1–4) + (Aug 1–3)`. With $92.30 ≈ $92.06 + $0.24 and a single $7.99 item added, Jul 1–4 contributed ~$0 and **August 1–3 contributed one $7.99 order = $0.24 net.**

**Consequence: August has produced $0.24 in its first three days.** The $92.30 headline is July's earnings viewed through a shifted window — it is *not* a second positive month and *not* evidence of acceleration.

### Kill-list gate status — unchanged

The Jul 3 gate ("2–3 consecutive positive revenue months") stands at **1 of 2–3**. July is the one positive month on record. **August remains the confirming period and closes 2026-09-01.** No relaxation is warranted on this export.

---

## Click attribution (Category report)

| Category | Clicks | Orders | Earnings |
|---|---|---|---|
| Furniture | 97 | 0 | $0.00 |
| others | 4 | 6 | $92.30 |

Unknown attribution remains **0%** — the Jul 4 ASIN fix continues to hold across a fourth consecutive export (94% Jun → 45% Jul 17 → 0% Jul 28 → 0% Jul 31 → 0% Aug 3). This is the most durable result in the affiliate dataset.

## Linked products

| ASIN | Product | Clicks | Orders |
|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | 49 | **0** |
| B016OIF2JU | Steelcase Gesture | 26 | **0** |
| B01N32UFNT | Herman Miller Aeron Size C | 13 | **0** |
| — | others | 13 | 6 (all $3,117.75) |

**88 named chair clicks → 0 chair orders.** Fourth consecutive export showing this pattern. Cumulative across the archive, the three promoted chairs have absorbed well over 200 clicks and produced zero attributed purchases. At this sample size the conclusion is no longer tentative: **visitors click the chair links and buy something else on Amazon.**

Order economics unchanged: 6 items / $3,117.75 = **$520 average item**. The buyers are purchasing chair-priced goods — just not the three chairs TCA promotes.

---

## Concentration risk (carried forward from Jul 31, still open)

~$2,048.80 of the $3,109.76 July base — **66%** — came from a single high-ticket order. Excluding it, July nets ~$31.83 rather than $92.06.

| Measure | With outlier | Ex-outlier |
|---|---|---|
| July net | $92.06 | ~$31.83 |
| July EPC | $1.00/click | $0.35/click |

Both figures are respectable for Amazon home/furniture (typical band ~$0.20–0.80 EPC), but the headline number should be read as **one lucky basket on top of a ~$32/month baseline**, not a $92/month run rate. The return window on that order is still open; Amazon can restate.

---

## NEW: market-value benchmark (DataForSEO CPC vs realized EPC)

First time this comparison has been run. Source: `data/keywords/raw/2026-08-01T09-51-48.json` (DataForSEO monthly discovery, cost $0.014), matched against GSC queries in `data/gsc/latest.json`.

**Impression-weighted market CPC across 16 matched ranking queries (1,910 impressions): $3.73/click.** All HIGH competition; intent mostly commercial/transactional.

| Query | Impr | CPC |
|---|---|---|
| steelcase leap plus | 1,013 | $3.39 |
| aeron size c | 262 | $4.60 |
| aeron c | 79 | $4.53 |
| best office chairs for tall people | 71 | $5.28 |
| best office chair tall person | 33 | $5.28 |

| TCA metric (July) | Value |
|---|---|
| Affiliate EPC | $1.00/click (ex-outlier $0.35) |
| Revenue per session | ~$0.30 (92.06 / 303 GA4 sessions, 28d) |
| Market CPC for same traffic | $3.73 |

**Interpretation.** The naive read — "capturing 8% of traffic value" — is misleading. Checked against realistic alternatives:

- **Display ads** (Mediavine/Raptive tier, home/furniture) run roughly **$15–30 RPM** as an industry rule of thumb ≈ $0.015–0.030/session → **$6–9/month** at 303 sessions. Affiliate is ~10x better.
- **Amazon Associates EPC** in home/furniture typically runs **$0.20–0.80**. TCA's ex-outlier $0.35 sits mid-band; the with-outlier $1.00 sits above it.

**The monetization layer is performing at or above category norms. The binding constraint is session volume (303/28d), not conversion or commission rate.**

Caveat: DataForSEO publishes CPC, not EPC — no SEO API carries affiliate EPC, and Amazon has never published it. For a true apples-to-apples EPC comparison, use networks that publish program-level EPC (Impact, CJ, ShareASale, Awin). The Impact.com UTT is already live (`941c7d1`), so approved-program EPC becomes readable there.

---

## Data-quality notes

- **GA4 undercounts affiliate clicks ~4x.** GA4 logged 26 `affiliate_click` events (Jul 6 – Aug 3) against Amazon's 101 for a near-identical window. Likely ad blockers plus consent gating. **Do not use GA4 affiliate-click counts for page-level revenue attribution.**
- GA4 channel mix (28d): Direct 170 (56%), Organic Search 65 (22%), **AI Assistant 47 (16%)**, Unassigned 26 (9%). The 56% direct share on a 7-month domain with no brand is implausible as pure human traffic and warrants investigation.
- Organic Search 65 sessions cross-validates cleanly against GSC (~68 clicks/28d).
- No Top-Sellers CSV in this export; prior exports showed it empty (header only) regardless.

## Action recorded

**Record the selected date range on every future export.** This export is the first with a confirmed window, and the confirmation is what made the reconciliation possible. Prefer **calendar-month** ranges for continuity with the monthly performance log; rolling windows cannot be appended to it.
