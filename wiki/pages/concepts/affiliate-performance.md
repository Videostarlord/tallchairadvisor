---
type: concept
last_updated: 2026-08-28
sources: [raw/affiliate/2026-08-28-amazon-associates-report.md, raw/affiliate/2026-08-26-amazon-associates-report.md, raw/affiliate/2026-08-13-amazon-associates-report.md, raw/affiliate/2026-08-04-amazon-associates-report.md, raw/affiliate/2026-08-03-amazon-associates-report.md, raw/affiliate/2026-07-31-amazon-associates-report.md, raw/affiliate/2026-07-28-amazon-associates-report.md, raw/affiliate/2026-07-17-amazon-associates-report.md, raw/affiliate/2026-06-30-amazon-associates-report.md, raw/audits/2026-07-04-affiliate-revenue-audit.md, raw/strategy/2026-07-25-affiliate-program-research.md, data/keywords/raw/2026-08-01T09-51-48.json]
tags: [affiliate, amazon, revenue, monetization, conversion]
---

# Affiliate Performance (Amazon Associates)

Tracking IDs (split 2026-08-13, `20aab85`): `tcachair-20` (chairs) · `tcaaccessory-20` · `tcadesk-20` · `tallchairadvi-20` (legacy catch-all, retains all pre-2026-08-13 attribution). Commission tier: ~3% (furniture/home office). Map: `src/data/affiliate-tags.ts`.

---

## Performance Log — BY MONTH

> **Read this first — two rules.**
> 1. **Snapshots within a month supersede each other — never add them.** Amazon month-to-date snapshots are cumulative. Proven 2026-08-01: Jul 28 and Jul 31 carry an identical order set and identical ordered revenue ($3,109.76), shipped catching up to ordered, clicks rising monotonically (82 → 87 → 92).
> 2. **Check the window type before logging any export.** The window is whatever was selected in Associates Central and is *not* recorded in the CSV. Month-to-date and rolling-30-day exports look identical in the file. A rolling window cannot be appended to this monthly log — see the Aug 3 export below, which was 99.7% July's money re-reported and briefly read as a second positive month. **Record the selected range on every download.**
>
> **Rule 2 applies to EVERY export again (2026-08-26).** The automated pull that used to state its own window was retired; `scripts/amazon-pull.ts` no longer exists. Every export from here on is hand-downloaded, so **record the selected date range at download time.** When that was not done, the window can often still be *solved* — see Rule 3.
>
> 3. **An unrecorded window is SOLVED by algebra, never guessed.** Match the export's totals against the per-day rows frozen in `data/affiliate/latest.json` (2026-07-11 → 2026-08-09). If three independent quantities match to the cent, the window is established; if the algebra does not resolve, the window stays **unknown**. Proven 2026-08-26. **This is why `latest.json` must never be overwritten from a CSV drop — those daily rows are the decoder, not just old data.** See `data/affiliate/README.md`.

| Month | Clicks | Orders | CVR | Ordered Revenue | Shipped Revenue | Net Earnings | Status |
|--------|--------|--------|-----|-----------------|-----------------|--------------|--------|
| **2026-08** | — | 8 (partial) | — | — | — | **+$35.38** | Days 1–27, from the **Aug 28** export (window Jul 29–Aug 27, solved). $6.84 booked Aug 1–4 plus **$28.54 earned on `tcachair-20`** — the chair tag's first revenue. Still short of the $100 gate but ~3x the Aug 26 forecast, and the return window is open. Confirming month for the kill-list gate; closes 2026-09-01. |
| **2026-07** | 92 | 5 (1 direct) | 5.4% | $3,109.76 | $3,109.76 | **+$92.06** | Best month in site history (~2.5x prior best). 66% from a single order. Return window open. |
| 2026-06 | 70 | 7 | 10.0% | $578.08 | $578.08 | **−$0.41** | 1 return ($610) wiped earnings. |

### July interim snapshots (superseded — retained for audit trail only)

| Snapshot | Clicks | Ordered Rev | Shipped Rev | Net | Note |
|---|---|---|---|---|---|
| Jul 31 (final) | 92 | $3,109.76 | $3,109.76 | +$92.06 | All 5 items shipped |
| Jul 28 | 87 | $3,109.76 | $1,060.96 | +$30.60 | $2,048.80 still unshipped |
| Jul 17 | 82 | $1,252.11 | — | +$36.06 | 6 items ordered (later restated to 5) |

*Correction 2026-08-01: the Jul 28 ingest treated these as discrete periods and favored a "not cumulative" reading based on items ordered falling 6 → 5. That was wrong — the 6 → 5 change was an order restatement, not a new window. There is **one** positive month on record (July), not three positive periods. The Jul 3 kill-list gate ("2–3 consecutive positive revenue months") therefore stands at 1 of 2–3. August is the confirming period.*

### Aug 28 export — rolling 30-day, **Jul 29 – Aug 27**. ⚠ REVERSES THE AUG 26 HEADLINE.

> **Read this before the Aug 26 section below it.** That section reports `tcachair-20` at
> **45 clicks, 0 orders, $0.00** and a decision built on it. **Two days later the same tag reads
> 59 clicks, 6 orders, $28.54.** The section is left standing as written — the archive does not
> rewrite its own history — but its conclusion is superseded here.

**Window solved again, on five quantities.** Summing `data/affiliate/latest.json` from 2026-07-29
gives 3 shipped / $2,276.78 / $68.30 / 2 ordered / $227.98 — exactly this export's `others` row. The
algebra method now has two independent confirmations and can be treated as reliable.

| Tracking ID | Clicks | Ordered | Shipped rev | **Earnings** | vs Aug 26 |
|---|---|---|---|---|---|
| `tallchairadvi-20` (legacy) | 75 | — | — | **$0.00** | 81 clicks, $68.98 |
| **`tcachair-20` (chairs)** | **59** | **6** | **$943.79** | **$28.54** | **45 clicks, $0.00** |
| `others` | 5 | 2 | $2,276.78 | $68.30 | 5 clicks, $12.15 |
| **Total** | **139** | **8** | **$3,220.57** | **$96.84** | 131 clicks, $81.13 |

#### The correction, stated plainly

**Chair links earn $0.48/click. They just do not sell chairs.**

`$943.79 ÷ 6 = $157.30 average item.` The Leap Plus is ~$1,300, the Gesture ~$1,500, the Aeron Size
C ~$1,800. **Not one of the six items is a chair this site recommends.** They are cheaper products
bought inside the 24-hour window a chair click opened. Amazon states the conversion rate directly on
the Leap Plus row: **12.24% product conversion**.

So the July–August diagnosis splits in two, and only half of it survives:

| Claim | Status |
|---|---|
| "$500+ chair links do not produce chair sales" | **STILL TRUE** — 0 chair units in the entire archive |
| "Chair clicks are not a revenue lever" | **FALSE** — they are a $0.48/click lever, via basket spillover |

**What the tag split actually bought is now clear.** Before 2026-08-13 this money sat in an `others`
bucket and read as an accident. It is not an accident — it is a repeatable ~10% conversion on
traffic this site originates. **The split did not prove chairs fail; it made a working revenue
channel visible for the first time.**

#### Restraint the numbers demand

**n = 6 orders, one export, and the same tag read $0.00 forty-eight hours earlier.** That is the size
of swing this volume produces. Per [[statistical-confidence-policy]] neither reading stands alone —
**do not build a plan on this one either.** At ~139 clicks/30d and $0.48 EPC the run rate is
**~$67/month** from chair links, which is worth watching against the $100 gate and not yet worth
betting on.

**August close (2026-09-01) is materially better than the Aug 26 forecast:** at least
**$35.38** recoverable ($28.54 chair-tag + $6.84 booked Aug 1–4), against ~$12.15 projected two days
ago. Return window still open.

#### Everything else in this export

Clicks 131 → 139. Leap Plus 49 (still #1, and the row carrying the conversions), Gesture 30, Aeron
18, Crandall 11, others 31. **Tag migration nearly complete** — `tcachair-20` 59 vs legacy 75, up
from 45 vs 81; the legacy tag decays as cached pages age out. `tcaaccessory-20` and `tcadesk-20`
still have no rows.

**Cross-dimension mismatch again, and which row to trust:** `linked-product.csv` books $87.15 to the
Leap Plus ASIN where `tracking-id.csv` books $28.54 to `tcachair-20`; `category.csv` books all
$96.84 to `others`. All three total $96.84 and reconcile at 139 clicks and nowhere else. **For "do
chair links earn?", the tracking-ID row is authoritative** — the tag is what `affiliate-tags.ts`
controls and what Amazon attributes the whole session against.

Raw: `raw/affiliate/2026-08-28-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-08-28-amazon-csv/`).

---

### Aug 26 export — rolling 30-day, **Jul 27 – Aug 25 (WINDOW SOLVED, not guessed)**

**First export after the 2026-08-13 tracking-ID split. First export in the archive whose window was
*derived and verified* rather than inferred or left unknown.**

**How the window was solved — the method is reusable.** `data/affiliate/latest.json` holds per-day
rows from the 2026-08-09 automated pull. Summing only 2026-07-27 onward gives **4 shipped items /
$2,293.77 shipped revenue / $68.98 earnings** — identical *to the cent on all three quantities* to
this export's `tallchairadvi-20` row. Three independent figures matching is not coincidence. The
date stamp `2026-08-25` fixes the end; 30 days back is 2026-07-27. *(2026-07-26 contributed $0/0
items, so algebra alone cannot separate a Jul 26 from a Jul 27 start — the 30-day count settles it.)*

**Rule 2 now has a third clause:** a hand export's unknown window can be *recovered* by algebra
against the automated daily rows, as long as the automated pull's coverage overlaps it. Guessing is
still forbidden; solving is not. This is a second reason never to overwrite `latest.json` with a
hand export — the daily rows are the instrument that decodes the hand exports.

**Also confirmed: the date column is a boundary, not a day.** 131 clicks / 30 days = ~4.4/day,
inside the 3–9/day baseline. 131 clicks on 2026-08-25 alone would be a 15–40x spike.

#### THE FINDING: the chair tag's first readout is 45 clicks and $0.00

| Tracking ID | Clicks | Items ordered | Items shipped | Shipped revenue | **Total earnings** |
|---|---|---|---|---|---|
| `tallchairadvi-20` (legacy) | 81 | — | 4 | $2,293.77 | **$68.98** |
| **`tcachair-20` (chairs)** | **45** | **—** | **0** | **—** | **$0.00** |
| `others` | 5 | 5 | 1 | $404.99 | **$12.15** |
| **Total** | **131** | **5** | **5** | **$2,698.76** | **$81.13** |

[[affiliate-tags]] / `src/data/affiliate-tags.ts` was built to ask one question — *does a $500+
chair click EVER convert on Amazon?* Twelve clean days (2026-08-13 → 08-25) answer it:
**45 chair clicks, zero orders, zero dollars.**

Sixth consecutive period with zero chair conversions, and **the first where the zero is a direct
measurement rather than an inference.** Before the split, "0 chair orders" was read off ASIN click
rows sitting next to an `others` earnings bucket. Now it is a dedicated tracking ID that attributes
every purchase in the 24-hour session — and nothing bought in a session that began on a chair link
produced a cent.

**Every dollar in this window is old money or unlinked money:**
- **$68.98 (85%)** — legacy tag, and the algebra dates all of it to **on or before 2026-08-04**. The
  legacy tag has earned **nothing new in 22 days**.
- **$12.15 (15%)** — `others` tracking bucket; the only new money since the 2026-08-09 pull
  ($81.13 − $68.98). 5 clicks → 5 items ordered is a **100% product conversion rate, the highest in
  this archive**, on $1,979.96 ordered. Only 1 item ($404.99) has shipped, leaving **~$1,575
  ordered-but-unshipped ≈ $47 unrealized at 3%**. `tcaaccessory-20` and `tcadesk-20` have no rows of
  their own, so whether accessories are what is converting here **cannot be determined from this
  file** — watch for those rows to appear.

**New earnings in the 17 days since the last automated pull: $12.15, none from a chair link.**

#### The Leap Plus earnings row is NOT a chair sale — do not log it as one

`linked-product.csv` books **99.7% of earnings ($80.89 of $81.13) to Steelcase Leap Plus
`B00TYE4QXU`** — the first named-chair earnings row in site history, where every prior export put
100% in `others`. It reads like the breakthrough. **It is not.**

The tracking-ID table attributes those same 4 shipped items to the *legacy* tag, and the window
algebra dates them to Jul 27 – Aug 4 — a period already logged here as zero chair orders. The
dedicated chair tag, covering the same ASIN over the same file, earned $0.00. The two readings
reconcile only if the linked-product row credits **session-basket revenue to the referring ASIN**
rather than sales of that ASIN. Corroborating: $2,690.77 over 4 items is $672.69 average, and the
Leap Plus is a ~$1,300+ chair — 4 of them cannot cost $2,690.77. **It is a Leap Plus referral whose
basket was something else** — the same "toll on sessions TCA originated" pattern logged since June.

**Data quality — the two dimensions disagree by exactly $397.00** ($11.91 of earnings), sitting on
the chair row in linked-product and the `others` row in tracking-id. `category.csv` disagrees a
third way, putting all $81.13 on `others` (15 clicks) while Furniture (116 clicks) is dashes end to
end. All three reconcile at **131 clicks**. Per the standing rule, **the three reports are not
reconciled line-for-line** — nothing downstream reads the difference.

`top-sellers.csv`: header only. No top sellers, consistent with every export in the archive.

#### Click movement — Leap Plus still #1, but its share is eroding

| ASIN | Product | Aug 26 (Jul 27–Aug 25) | Aug 13 | Jul 31 | Jul 28 |
|---|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **47** (36%) | 50 (41%) | 45 (49%) | 41 (47%) |
| B016OIF2JU | Steelcase Gesture | 28 | 23 | 24 | 23 |
| B01N32UFNT | Herman Miller Aeron Size C | 14 | 16 | 12 | 12 |
| B08PPVCCST | Crandall Remanufactured Leap V2 | **11 (first appearance)** | — | — | — |
| others | — | 31 | 33 | 11 | 11 |
| **Total** | | **131** | 122 | 92 | 87 |

**Crandall Remanufactured Leap V2 `B08PPVCCST` appears with attributed clicks for the first time** —
[[refurbished-steelcase-leap]] is generating real affiliate traffic. Leap Plus holds the top slot for
a fourth period but its share has fallen 49% → 41% → 36% as Gesture and the Crandall pick up.

**What this changes about the Leap Plus reframe:** the queued "I almost bought this" rewrite of
[[review-leap-plus]] still has the strongest click support of anything on the board — but this export
establishes that **clicks are not the constraint.** 134 named chair clicks across two periods,
$0.00. Do the reframe for CTR and E-E-A-T reasons; do not expect it to produce Amazon chair revenue.

#### What this does NOT change

- ~~**The automated pull is still down.**~~ **OVERTAKEN THE SAME DAY — the pull was RETIRED
  2026-08-26.** This bullet originally flagged it 17 days stale against a 3-day SLA and called for
  `AMAZON_STORAGE_STATE` to be re-captured. Jackson declined to re-auth; the automation was deleted
  instead. See **Automated pulling — RETIRED** below. **August's close on 2026-09-01 is reconstructed
  from hand exports** — now the normal path, not a fallback.
- **`latest.json` was NOT overwritten.** This export is a rolling window with no per-day rows;
  writing it would replace 25 dated daily rows with one undated aggregate and destroy the instrument
  that solved this window in the first place.
- **August is on track to fail the $100 gate.** Recoverable Aug 1–25 earnings: **$12.15**, with ~$47
  unshipped that may land. Gate stands at **1 of 2–3**; August closes 2026-09-01.

Raw: `raw/affiliate/2026-08-26-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-08-26-amazon-csv/`).

---

### Aug 13 export — window UNKNOWN and deliberately not guessed *(ingested late, 2026-08-26)*

*This export was archived on 2026-08-13 but never ingested into this page. Recorded here for the
audit trail; the Aug 26 export above supersedes its numbers.*

`tracking-id.csv` carried **one** row (`tallchairadvi-20`) — the last single-tag export, taken the
same day the tag split shipped. Totals: **122 clicks, 7 items ordered, $3,337.74 ordered revenue,
7 shipped, $100.40 earnings, 0 returns.**

**The window was not recoverable at the time and was left unknown rather than invented.** Rows were
stamped `2026-08-12`, but the order figures were identical to the cent to the 30-day window ending
2026-08-09 — so the date was a report boundary, not a day. `latest.json` was correctly not
overwritten. *(The Aug 26 method would likely have solved it; it had not been discovered yet.)*

**Its finding — 89 chair clicks, zero chair orders** (Leap Plus 50, Gesture 23, Aeron 16), with all
7 orders and 100% of the $100.40 in the `others` bucket. Combined with the Aug 26 export's 45
clicks / $0.00 on the dedicated chair tag, this is **134 named chair clicks → $0 across two
periods**, the direct evidence behind the "clicks are not the constraint" conclusion above.

Identical order figures to the 2026-08-09 pull ($3,337.74 / 7 items / $100.40) indicated **no order
landed between 2026-08-09 and 2026-08-13** — since confirmed by the Aug 26 algebra, which dates the
last legacy-tag earnings to 2026-08-04.

Raw: `raw/affiliate/2026-08-13-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-08-13-amazon-csv/`).

---

### Aug 4 export — rolling 30-day (inferred), Jul 6 – Aug 4

**Window NOT confirmed.** Inferred rolling because the $3,337.74 total still contains July's ~$3,109.76 base including the single ~$2,048.80 order from the Jul 31 close — a month-to-date August export covering Aug 1–4 could not contain it.

| Metric | Aug 4 | Aug 3 | Δ |
|---|---|---|---|
| Clicks | 108 | 101 | +7 |
| Orders | 7 | 6 | +1 |
| Ordered revenue | $3,337.74 | $3,117.75 | **+$219.99** |
| Net earnings | $98.90 | $92.30 | **+$6.60** |

$6.60 / $219.99 = 3.00%, furniture tier. One new order on Aug 4. Subtracting the July final gives **August 1–4 = $227.98 ordered / $6.84 net / 2 orders**.

**The $98.90 headline is 93% July's money.** Only $6.84 is August.

Click movement worth watching: **Leap Plus flat at 49** while Gesture +2 (28) and Aeron +2 (15). Leap Plus has been the top click generator all summer (47% of site affiliate clicks at one point) — single-day data, but watch for a plateau.

Fifth consecutive export with **0 chair orders on 92 named-chair clicks (85% of traffic)**. All 7 orders in `others`, $477 average item. Top-Sellers present but still empty (header only).

Raw: `raw/affiliate/2026-08-04-amazon-associates-report.md`.

### Aug 3 export — ROLLING 30-DAY window (not a month; excluded from the log above)

**Window confirmed by Jackson 2026-08-04: last 30 days = Jul 5 – Aug 3.** First export in the archive with a verified date range, and the first that is *not* month-to-date.

| Metric | Aug 3 (rolling Jul 5–Aug 3) | July final (MTD) | Δ |
|---|---|---|---|
| Clicks | 101 | 92 | +9 |
| Items ordered | 6 | 5 | +1 |
| Ordered revenue | $3,117.75 | $3,109.76 | **+$7.99** |
| Net earnings | $92.30 | $92.06 | **+$0.24** |

$0.24 / $7.99 = 3.00%, exactly the furniture tier. Window algebra `(Jul 5–Aug 3) = (Jul 1–31) − (Jul 1–4) + (Aug 1–3)` resolves to: Jul 1–4 ≈ $0, **Aug 1–3 = one $7.99 order = $0.24 net.**

**The $92.30 headline is July's earnings through a shifted window — not a second positive month, not acceleration.** Kill-list gate remains **1 of 2–3**; August closes 2026-09-01.

Raw: `raw/affiliate/2026-08-03-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-08-03-amazon-csv/`).

---

## Automated pulling — RETIRED 2026-08-26. Do not rebuild it.

**`scripts/amazon-pull.ts`, `scripts/lib/amazon-session.ts`, `scripts/lib/affiliate-store.ts`,
`.github/workflows/amazon-weekly.yml` and the nightly's affiliate step are DELETED.** The
`amazon:pull*` npm scripts are gone. Affiliate data is hand-exported by Jackson and nothing else.

**Why, in one line: it worked for eleven days and then asked for a manual login to a financial
account, forever.**

P3 replayed a Playwright `storageState` session against Associates Central's internal reporting
endpoint. It was genuinely well-built — it harvested the app's own bearer token rather than guessing
an auth scheme, it detected expiry positively instead of trusting a parsed zero, and it refused to
write a `$0` row on failure. None of that was the problem.

**The problem was structural.** The session captured on 2026-08-09 expired by 2026-08-20. Recapturing
it is `playwright codegen` against a live Amazon financial login — an act only Jackson may ever
perform, because an agent must never handle that credential. So the "last manual step in the
pipeline" was never removed; it was **converted from a monthly CSV download into a fortnightly
credential-capture chore**, and the new chore was strictly worse: the CSV download produces ASIN-level
attribution, and the automated pull produced only the daily overview. Jackson declined to re-auth on
2026-08-26 and the automation was removed the same day.

### The reasoning that must survive this, because the temptation will return

**Any session-replay scheme against Amazon has the same expiry treadmill underneath it.** Rebuilding
it with a longer-lived cookie, a different browser profile, or a retry loop does not change the
shape — it changes how many days pass before a human is asked for a credential again. **If the 7-day
nag becomes annoying, the correct responses are a longer threshold or a different affiliate program.
Never a new scraper.** `scripts/collectors/amazon.ts` carries this warning in its own header so an
agent reading only that file still finds it.

### What was ACTUALLY lost, stated honestly

| | Before retirement | Now |
|---|---|---|
| Revenue in the nightly's field of view | daily | only as export staleness |
| `data/affiliate/latest.json` | refreshed daily | **frozen at 2026-08-09** |
| ASIN-level attribution | manual export (unchanged) | manual export (unchanged) |
| Windows stated as fact | automated exports only | none — but now *solvable*, see Rule 3 |

The real loss is the daily revenue signal. Set against it: the automated figure was **SHIPPED
earnings, not net** (it read $100.40 where the true net was $98.90, a $1.50 clawback it structurally
could not see), so it was never the number the kill-list gate wanted anyway.

### `latest.json` is KEPT and is now more valuable frozen than it was live

`data/affiliate/latest.json` and `history.jsonl` stay on disk. **They are the decoder for every
hand-dropped CSV** — the 25 per-day rows are what let the 2026-08-26 export's window be solved rather
than guessed. `data/affiliate/README.md` records this at the file, where someone about to "clean up a
stale data file" will actually read it. `collectors/amazon.ts` now **excludes `data/affiliate/` from
its staleness scan**, because `latest.json` has no date in its filename and would be dated by mtime —
which CI stamps with "now" on every checkout, making the nag read *0 days old* forever on a frozen
file. That is the same self-resetting-nag bug this collector already hit once with its own output.

### The collector went back to the question it started with

`collectors/amazon.ts` no longer asks "did the automated pull run and succeed?" It asks **"how old is
the newest export Jackson dropped on disk?"** — one threshold, `NAG_THRESHOLD_DAYS = 7`, where a human
is the bottleneck. The 3-day `AUTOMATED_STALE_DAYS` SLA is gone with the thing it measured. The
unchanged guarantee: **a stale export is reported as stale, never as zero.** A fabricated `$0` could
trip the kill-list gate on a month that actually earned.

---

## What this does NOT pull — still true, and now the whole picture

The ASIN-level tables (linked-product, category, top-sellers) always required a manual export; the
automated pull only ever produced the daily overview. So **click-to-ASIN attribution — the "0 chair
orders on N chair clicks" pattern this page tracks — was never automated and is unaffected by the
retirement.** It comes from Jackson's CSV drops, exactly as it always did.

---

## July 2026 Month Close (snapshot Jul 31) — best month in site history

**+$92.06 net** ($93.56 shipped earnings − $1.50 clawback) on 92 clicks and $3,109.76 of shipped revenue. Realized commission 3.01%.

**The $2,048.80 unshipped balance flagged on Jul 28 resolved fully in TCA's favor** — all 5 ordered items shipped, shipped earnings rose $32.10 → $93.56 (+$61.46), matching the ~$61 projected at 3%.

**Final click attribution:** Furniture 87/92 (95%), others 5, **Unknown 0**. Named-ASIN share 81/92 = **88%**.

| ASIN | Product | Jul 31 | Jul 28 | Jul 17 |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **45** | 41 | 19 |
| B016OIF2JU | Steelcase Gesture | 24 | 23 | 12 |
| B01N32UFNT | Herman Miller Aeron Size C | 12 | 12 | — |
| others | — | 11 | 11 | 21 |

### ⚠ The Jul 3 monetization-ceiling math was wrong — revisit [[thesis]]

The Jul 3 pivot computed: *"$3,300/month shipped revenue ÷ $600 avg chair ÷ 10% CVR = 55 Amazon clicks/month needed; at 0.22% CTR = 25,000 organic clicks/month needed; current = 150/month"* — concluding the site was ~167x short of $100/month.

July actual: **$3,109.76 shipped revenue (94% of the $3,300 target), $622 avg item, 5.4% CVR, 92 Amazon clicks, $92.06 earned (92% of the $100 target).**

The click-side math was sound — ~55–92 Amazon clicks is indeed what $100/month takes. **The error was the final step:** converting Amazon clicks into required Google organic clicks via the site-wide 0.22% CTR. That assumes every affiliate click originates from a Google organic visitor. GA4 shows Google organic is only **19% of sessions** (Direct 54%, AI Assistant 12%). Affiliate clicks come substantially from direct and AI traffic, so the 25,000-organic-clicks requirement is not real.

**Implication:** the "structural monetization ceiling" that justified the July pivot is far less severe than modeled. This does not invalidate the pivot's direction (diversify away from 3% Amazon, build Google-independent assets) — email capture and higher-commission programs are still correct. It does invalidate the framing that the current traffic level cannot produce meaningful revenue. It can, and in July it did.

### Caveats — do not over-read one month

- **One order carried the month.** ~$2,049 of $3,110 came from a single high-ticket item. Remove it and July is ~$32.
- **Return window still open.** Amazon can restate; June's $610 return is the precedent.
- Per [[statistical-confidence-policy]], one month is not a trend. August is the confirming period.

### The open problem, sharper at month close

**81 named chair clicks → 0 chair orders.** All 5 orders and all $93.56 of earnings booked against the `others` row — products TCA does not link. Every dollar earned in July was a toll on Amazon sessions TCA originated, not commission on a recommended chair. Click growth alone will not change this.

**Data quality:** Category vs Linked-Product `others` discrepancy widened to 5 vs 11 (was 8 vs 11). Both total 92. Do not reconcile the two reports click-for-click.

Raw: `raw/affiliate/2026-07-31-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-07-31-amazon-csv/`).

---

## Late-July 2026 Analysis (snapshot dated Jul 28 — SUPERSEDED by the Jul 31 month close above; retained for the attribution narrative)

**Attribution is now fully resolved.** Unknown click share: 94% (Jun) → 45% (Jul 17) → **0% (Jul 28)**. Furniture carries 79 of 87 clicks (91%); named-ASIN share is 76/87 = **87%** (was 38%). Aeron Size C B01N32UFNT appears for the first time — all three flagship chairs are individually attributed. **No further link-architecture work is warranted**; the residual opacity is Amazon's indirect-purchase model, not TCA's links.

**Per-ASIN click ranking (the important new signal):**

| ASIN | Product | Clicks | Share | Jul 17 |
|---|---|---|---|---|
| B00TYE4QXU | Steelcase Leap Plus | **41** | 47% | 19 |
| B016OIF2JU | Steelcase Gesture | 23 | 26% | 12 |
| B01N32UFNT | Herman Miller Aeron Size C | 12 | 14% | — |
| others | — | 11 | 13% | 21 |

**Leap Plus is the site's most-clicked product** — 47% of affiliate clicks, more than Gesture + Aeron combined, and more than double period-over-period.

**Which page produces those clicks is NOT established by this data.** Amazon reports per-ASIN, not per-source-page. GA4 page-level `affiliate_click` events (working again since the Jul 18 CSP fix) put `/office-chairs-for-tall-people/` first with 6 of 11 tracked events — its Quick Picks box links the Leap Plus. The money hub, not [[review-leap-plus]], is the likelier source. *Corrected 2026-07-29: an earlier version of this section asserted the review page was the top commercial surface, which the data does not support.*

**The conversion gap is the story now:** 76 attributed chair clicks → **0 chair orders**. All 5 orders and all $32.10 of earnings booked against the `others` row (indirect baskets). The site earns on accidents, not intent. Expected at $1,000+ price points and 87 clicks/period, but it means click growth alone won't produce chair commissions.

**First direct order in site history** — `Direct Items Ordered = 1` (was 0 in every prior period). Top-Sellers is still empty, so the direct ASIN isn't exposed.

**$2,048.80 ordered-but-unshipped.** Ordered revenue $3,109.76 vs shipped $1,060.96. At 3% that's ~$61 of unrealized commission. → **RESOLVED at month close: shipped in full, +$61.46 realized.**

~~**Window caveat — the two positive snapshots may overlap.**~~ **RESOLVED 2026-08-01: snapshots are cumulative month-to-date.** The Jul 31 export carries an identical order set and ordered revenue to Jul 28, settling it. The "discrete window favored" reading recorded here was wrong. See the month-close section above.

**Data quality:** Category and Linked-Product disagree on bucketing (`others` 8 vs 11; Furniture 79 vs 76). Both total 87. Don't reconcile the two reports click-for-click.

Raw: `raw/affiliate/2026-07-28-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-07-28-amazon-csv/`).

---

## July 2026 Analysis (snapshot dated Jul 17 — ASIN fix validation)

**The July 4 link-architecture fix worked on both of its named success metrics:**

1. **Unknown attribution share: 94% → 45%.** Furniture (attributed ASINs) now carries 50% of clicks. The two verified chair ASINs are individually visible for the first time: Leap Plus B00TYE4QXU (19 clicks — top clicked product), Gesture B016OIF2JU (12 clicks).
2. **Revenue quality up:** ordered revenue $578 → $1,252 (+117%) on only +17% clicks. Verified `/dp/` links land buyers on real product pages; indirect baskets got bigger.

**First positive earnings in site history: +$36.06** ($37.56 shipped − $1.50 clawback). This period's single return was a $49.99 item, not a chair — June's "one chair return wipes the month" fragility did not repeat.

All 6 orders were still indirect (0 direct orders on tracked chairs — expected at this volume for $1,000+ items). Top-Sellers report still empty; populates only with direct purchases.

**Interpretation guardrail** (per [[statistical-confidence-policy]]): one positive snapshot ≠ repeatable revenue. *Note added 2026-08-01: this snapshot is a July-to-date interim, later restated to the $92.06 month close — it was never an independent period.*

Raw: `raw/affiliate/2026-07-17-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-07-17-amazon-csv/`).

---

## June 2026 Analysis

### What happened
- 70 clicks → 7 orders (10% CVR — strong)
- 6 items shipped, earned $17.89 (~$3/item, ~3% commission)
- 1 item returned for $610 (almost certainly a chair — the only product in this price range on the site)
- Return triggered $18.30 commission clawback
- Net: $17.89 − $18.30 = **-$0.41**

### Attribution gap
66 of 70 clicks (94%) fall into Amazon's "Unknown" category — no page-level attribution. We know clicks happened and orders resulted, but cannot tie them to specific TCA pages. This is structural to how Amazon tracks indirect purchases.

The 6 "Unknown/None" ASIN orders ($568.09 revenue) represent visitors who clicked a TCA affiliate link and then purchased a *different* product Amazon recommended. These are indirect conversions — legitimate commission but untrackable at the product level.

### The $610 return
High-ticket affiliate is inherently fragile: one chair return equals ~6 months of accessory commissions. The $610 item is consistent with an Aeron, Leap, or similar premium chair. No action to take — this is statistical noise at current volume.

### Top Sellers report: empty
No ASIN-level rank data populated because all purchases were "Unknown/None" indirect. Will populate as volume grows and direct link purchases accumulate.

---

## Structural Issues

| Issue | Impact | Fix | Status |
|-------|--------|-----|--------|
| ~~"Unknown" click attribution~~ | ~~Can't tie clicks to products~~ | Jul 4 ASIN fix | **RESOLVED** — 94% → 45% → 0% (Jul 28) |
| **0 chair orders on 81 attributed chair clicks** | Earnings come from indirect baskets, not chair intent | No link-side fix available; needs conversion work on the pages producing clicks (GA4 says the money hub leads) | **OPEN — primary constraint** |
| Single tracking ID | No page-level split in Amazon dashboard | Add per-page tracking IDs (e.g., `tallchairadvi-gesture-20`) — now lower priority since ASIN-level attribution works | Open, deprioritized |
| ~~Snapshot date range not recorded~~ | ~~Can't tell if snapshots overlap~~ | Settled 2026-08-01: snapshots are **cumulative month-to-date**; within a month they supersede, never add | **RESOLVED** |
| **Single-order revenue concentration** | ~$2,049 of July's $3,110 came from one item; remove it and July is ~$32 | Volume + price-range diversification | **OPEN — fragility** |
| Return clawback risk | Single chair return = negative period | Unavoidable at low volume; resolves with scale ($49.99 returns are survivable, $610 was not) | Open, tolerated |
| Commission rate ~3% (realized 3.03%) | Low margin on high-ticket items | Price-range diversification (accessories, books) adds stability | Open |

---

## Benchmarks & Targets

| Metric | July 2026 (final) | Target |
|--------|-------------------|--------|
| Monthly clicks | 92 | 500+ |
| Order CVR | 5.4% | Maintain 8–12% |
| **Monthly earnings** | **+$92.06** | $100+ — **92% of target, effectively reached** |
| Return rate | 20% (1/5) | <10% |
| ASIN attribution (named-ASIN click share) | **88%** | ✅ target exceeded (was 20%+) |
| **Chair orders on attributed chair clicks** | **0 / 81** | 1+ per month |
| Revenue concentration | 66% from one order | <33% from any single order |

*Snapshots are cumulative month-to-date — compare month finals only (the last snapshot of each month), never interim exports.*

---

## Market-Value Benchmark: DataForSEO CPC vs realized EPC (first run 2026-08-04)

**No SEO API carries affiliate EPC** — it is a network-side metric and Amazon has never published it. DataForSEO provides **CPC** (what advertisers pay per click), which is the best available proxy for what TCA's traffic is worth on the open market.

Source: `data/keywords/raw/2026-08-01T09-51-48.json` (monthly discovery, run cost $0.014), matched against GSC queries in `data/gsc/latest.json`.

**Impression-weighted market CPC across 16 matched ranking queries (1,910 impressions): $3.73/click.** All HIGH competition; intent predominantly commercial/transactional.

| Query | Impr | CPC |
|---|---|---|
| steelcase leap plus | 1,013 | $3.39 |
| aeron size c | 262 | $4.60 |
| aeron c | 79 | $4.53 |
| best office chairs for tall people | 71 | $5.28 |
| best office chair tall person | 33 | $5.28 |

| TCA metric (July) | Value |
|---|---|
| Affiliate EPC | **$1.00/click** (ex-outlier **$0.35**) |
| Revenue per session | **~$0.30** ($92.06 / 303 GA4 sessions, 28d) |
| Market CPC, same traffic | $3.73 |

### Interpretation — the monetization layer is NOT the constraint

The naive read ("capturing 8% of traffic value") is misleading. Against realistic alternatives:

- **Display ads** (Mediavine/Raptive tier, home/furniture) run roughly **$15–30 RPM** as an industry rule of thumb ≈ $0.015–0.030/session → **$6–9/month** at 303 sessions. Affiliate is ~10x better.
- **Amazon Associates EPC** in home/furniture typically runs **$0.20–0.80**. TCA's ex-outlier $0.35 sits mid-band; with-outlier $1.00 sits above it.

**Conclusion: EPC and commission capture are performing at or above category norms. The binding constraint is session volume (303/28d), not conversion or rate.** This is the evidence base for the traffic-vs-monetization reframe recorded in [[decisions-log]] 2026-08-04.

For a true apples-to-apples EPC comparison, use networks that publish program-level EPC (**Impact, CJ, ShareASale, Awin**). The Impact.com UTT is live (`941c7d1`), so approved-program EPC becomes readable there — see [[affiliate-compliance]].

### Data-quality warning — GA4 undercounts affiliate clicks ~4x

GA4 logged **26** `affiliate_click` events (Jul 6 – Aug 3) against Amazon's **101** for a near-identical window. Likely ad blockers plus consent gating. **Do not use GA4 affiliate-click counts for page-level revenue attribution.** GA4 channel mix is still trustworthy; the event counts are not.

---

## Link Architecture Fix (2026-07-04) — ROOT CAUSE FOUND

The July 4 revenue audit found the structural cause of the 94% "Unknown" attribution and non-recommended-product orders: **82 of ~90 Amazon links were search-results links** (`/s?k=`), dumping buyers onto Amazon SERPs. Worse, all 8 existing `/dp/` ASINs were **hallucinated** (matched no real listing) — the 6-foot-X pages linked to dead product pages.

**Fixed same day:** all links now point to verified live ASINs — Gesture B016OIF2JU, Leap Plus B00TYE4QXU, Aeron Size C B01N32UFNT, Sihoo Doro S300 B0DQTRVSHS, La-Z-Boy Trafford B0116W5BG8, Hbada E3 Pro B0CQ4K1KXT, Ergotron HX B01MXYN33U, VIVO tall pole B01BO42XK0, Crandall reman. Leap V2 B08PPVCCST. 4 search links remain by design (Branch, FlexiSpot BS14, Ergotron LX Tall Pole, OFM ESS-200 — no verifiable Amazon listing). **Jackson: click-verify the 9 ASINs and create per-page tracking IDs before the next tag swap.** Expect "Unknown" attribution share and ordered-product match rate to be the success metrics (30-day window).

## Direct Program Economics (updated 2026-07-25 — multi-source research, `raw/strategy/2026-07-25-affiliate-program-research.md`)

| Program | Commission | Cookie | Network / apply | Verdict |
|---------|-----------|--------|-----------------|---------|
| Amazon Associates | 3% furniture ✅ verified | 24h | Live | Baseline to beat |
| Autonomous.ai | ~2% — worse than Amazon | — | — | Skip |
| Humanscale | ⚠️ UNVERIFIED (only stale 3% legacy-CJ; real rate visible only after approval) | 21 days ✅ | Impact.com (CJ→Impact migration; page shows "COMING SOON" — single-source) | Apply, verify rate before linking |
| Crandall Office | ⚠️ Not publicly disclosed (read after signup) | Not disclosed | **In-house BixGrow Shopify app** at crandalloffice.com/affiliate-program (NOT ShareASale — that claim is wrong) | **Apply now** — self-serve, near-auto-approve; + Amazon B08PPVCCST live today |
| FlexiSpot | ⚠️ SOURCES CONFLICT: 0.8% (FlexOffers) → 3% (CJ) → ~7% (Awin) → "up to 15%"; ~3% baseline | 30 days ✅ | CJ / Awin / in-house | Wait — desk-first brand; apply when standing-desk content ships |

**Benchmark conversion (ranges, not precision):** affiliate click→sale ~0.5–2% for chair reviews; furniture eComm site conv ~1.2–1.9%. A $300–$1,000 chair at 3% ($9–$30/sale) beats most low-ticket niches on EPC — higher commission only helps if cookie + approval don't cost conversions.

**Approval gate (do first):** FTC affiliate-disclosure + privacy pages are the most likely rejection cause — see [[affiliate-compliance]] (6 pages missing disclosure). Networks also need W-9 + PayPal/ACH payout.

`Layout.astro` now tracks autonomous.ai / humanscale.com / inmovement.com / flexispot.com / branchfurniture.com / crandalloffice.com clicks as `affiliate_click` with per-program labels — GA4 will show direct-program EPC the moment links go live.

## Recommended Next Actions

*Updated 2026-08-01 after the July month close. Attribution and window questions are settled; conversion and confirmation are the live items.*

1. **Revisit the Jul 3 monetization-ceiling math in [[thesis]]** — July earned $92.06 on 92 Amazon clicks against a model that said 25,000 organic clicks/month were required. The click math held; the organic-CTR conversion step did not (Google organic is 19% of sessions). The pivot's direction stays valid, its "current traffic cannot monetize" framing does not.
2. **Treat August as the confirming month.** One positive month, 66% of it from a single order. The kill-list gate stands at 1 of 2–3.
3. **Close the conversion gap** — 81 chair clicks, 0 chair orders. GA4 points at `/office-chairs-for-tall-people/` as the main click source; that's where fit-verdict and CTA work should land. See [[office-chairs-for-tall-people]].
4. **Per-page tracking IDs — deprioritized.** ASIN-level attribution now works (88% named). Only worth doing if multiple pages start linking the same ASIN heavily.
5. ~~Record the export date range~~ — no longer needed; cumulative month-to-date behavior is confirmed.

---

## Links

- [[affiliate-compliance]] — FTC disclosure status per page
- [[gsc-performance]] — Organic traffic driving the clicks
- [[review-gesture]] — Flagship review, highest affiliate intent
- [[best-office-chairs]] — Money page, primary commission target
- [[aeron-vs-gesture]] — Comparison page with CTAs
