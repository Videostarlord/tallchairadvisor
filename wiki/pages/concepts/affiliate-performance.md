---
type: concept
last_updated: 2026-08-09
sources: [raw/affiliate/2026-08-04-amazon-associates-report.md, raw/affiliate/2026-08-03-amazon-associates-report.md, raw/affiliate/2026-07-31-amazon-associates-report.md, raw/affiliate/2026-07-28-amazon-associates-report.md, raw/affiliate/2026-07-17-amazon-associates-report.md, raw/affiliate/2026-06-30-amazon-associates-report.md, raw/audits/2026-07-04-affiliate-revenue-audit.md, raw/strategy/2026-07-25-affiliate-program-research.md, data/keywords/raw/2026-08-01T09-51-48.json]
tags: [affiliate, amazon, revenue, monetization, conversion]
---

# Affiliate Performance (Amazon Associates)

Tracking ID: `tallchairadvi-20` | Commission tier: ~3% (furniture/home office)

---

## Performance Log — BY MONTH

> **Read this first — two rules.**
> 1. **Snapshots within a month supersede each other — never add them.** Amazon month-to-date snapshots are cumulative. Proven 2026-08-01: Jul 28 and Jul 31 carry an identical order set and identical ordered revenue ($3,109.76), shipped catching up to ordered, clicks rising monotonically (82 → 87 → 92).
> 2. **Check the window type before logging any export.** The window is whatever was selected in Associates Central and is *not* recorded in the CSV. Month-to-date and rolling-30-day exports look identical in the file. A rolling window cannot be appended to this monthly log — see the Aug 3 export below, which was 99.7% July's money re-reported and briefly read as a second positive month. **Record the selected range on every download.**
>
> **Rule 2 stops applying to automated exports (2026-08-09).** `scripts/amazon-pull.ts` (P3) chooses the window itself and writes it into the report as a stated fact, so exports it produces are never ambiguous. Hand-downloaded exports still need the range recorded.

| Month | Clicks | Orders | CVR | Ordered Revenue | Shipped Revenue | Net Earnings | Status |
|--------|--------|--------|-----|-----------------|-----------------|--------------|--------|
| **2026-08** | — | 2 (partial) | — | $227.98 | — | **+$6.84** | Days 1–4 only, derived from the Aug 4 rolling export. Naive run rate ~$53/mo — below the $100 gate — but n=2 with one order at 96% of revenue, so the projection carries no weight. Confirming month for the kill-list gate; closes 2026-09-01. |
| **2026-07** | 92 | 5 (1 direct) | 5.4% | $3,109.76 | $3,109.76 | **+$92.06** | Best month in site history (~2.5x prior best). 66% from a single order. Return window open. |
| 2026-06 | 70 | 7 | 10.0% | $578.08 | $578.08 | **−$0.41** | 1 return ($610) wiped earnings. |

### July interim snapshots (superseded — retained for audit trail only)

| Snapshot | Clicks | Ordered Rev | Shipped Rev | Net | Note |
|---|---|---|---|---|---|
| Jul 31 (final) | 92 | $3,109.76 | $3,109.76 | +$92.06 | All 5 items shipped |
| Jul 28 | 87 | $3,109.76 | $1,060.96 | +$30.60 | $2,048.80 still unshipped |
| Jul 17 | 82 | $1,252.11 | — | +$36.06 | 6 items ordered (later restated to 5) |

*Correction 2026-08-01: the Jul 28 ingest treated these as discrete periods and favored a "not cumulative" reading based on items ordered falling 6 → 5. That was wrong — the 6 → 5 change was an order restatement, not a new window. There is **one** positive month on record (July), not three positive periods. The Jul 3 kill-list gate ("2–3 consecutive positive revenue months") therefore stands at 1 of 2–3. August is the confirming period.*

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

## Automated pulling — P3, built 2026-08-09, NOT YET ACTIVE

Amazon Associates has no reporting API, so hand-downloading these CSVs was the last real manual load in the pipeline. `scripts/amazon-pull.ts` replays a `storageState` session Jackson captures once and downloads the same four reports.

**Inert until `AMAZON_STORAGE_STATE` exists as a GitHub secret.** Until then `.github/workflows/amazon-weekly.yml` (Sundays 08:00 UTC) exits 0 silently and `collectors/amazon.ts` keeps nagging at 7 days, so the gap stays tracked rather than forgotten. Capturing the session is a human act — an agent must never handle a login to a financial account.

**The design point that matters for this page: it will never write a `$0` row.** On an expired session it files `amazon-session-expired` and writes **no report at all**. A zero produced by a failed login is indistinguishable, in this log, from a month that genuinely earned nothing — and **the kill-list gate that decides whether this site continues is measured in months above $100.** A fabricated zero could retire a site that was earning fine.

Expiry is detected positively (a sign-in URL, challenge text, or an HTML document where a CSV should be), never by trusting a parsed zero. An `empty` CSV is recorded as empty, never as `$0` — Top-Sellers legitimately has no rows most weeks, as every export in this archive shows.

### Corrected 2026-08-09 against a live session — there is no CSV endpoint

The first version guessed a `?format=csv` download URL. Associates Central is an SPA and has none: that URL returned the page's own 249KB JSON payload, which the CSV classifier read as **"header row only" — an empty report.** A wrong endpoint was one step from being recorded as a period with no earnings.

The data actually comes from `/reporting/table`, which returns **401 to a plain cookie-authenticated request**. It also needs a per-page-load `authorization: Bearer` JWT and an `x-csrf-token` — neither is a cookie, both rotate every page load, so neither can live in `storageState`.

**The fix is to harvest, not construct.** The script opens the reporting page, intercepts the app's OWN first request to `/reporting/table`, captures its headers, and replays them with the date range this run wants. It never guesses an auth scheme; it borrows the one the application just used.

**Verified against this archive:** summing the daily rows over 2026-07-11 → 2026-08-09 reproduces the 2026-08-04 export exactly — $3,337.74 ordered revenue, 7 items ordered, 108 clicks.

### Two things that comparison corrected

- **`total_earnings` from the API is SHIPPED earnings, not net.** It returns **$100.40** where the 2026-08-04 headline net was **$98.90** — a $1.50 returned-item clawback. The clawback *value* is not in the column set (only the returned-item count is). **Do not copy the automated figure into the monthly table above as net earnings** — it is an upper bound, and the gap is the clawback.
- **Days without activity are omitted, not zero-filled.** A 30-day window returned 25 rows. Sparse is normal; only a completely empty window indicates failure, and that is refused rather than recorded as $0.

### What this does NOT pull

The **daily overview only**. The ASIN-level tables (linked-product, category, top-sellers) use different `query[type]` values whose parameters were not established — probing began returning HTTP 429, so it was stopped rather than risk the account.

**Consequence:** click-to-ASIN attribution — the "0 chair orders on 92 named-chair clicks" pattern tracked below, now five consecutive exports old — is **not** in the automated pull and still needs a manual export to update. The generated report says so in its own body rather than appearing complete.

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
