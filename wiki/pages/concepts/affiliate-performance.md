---
type: concept
last_updated: 2026-07-25
sources: [raw/affiliate/2026-07-17-amazon-associates-report.md, raw/affiliate/2026-06-30-amazon-associates-report.md, raw/audits/2026-07-04-affiliate-revenue-audit.md, raw/strategy/2026-07-25-affiliate-program-research.md]
tags: [affiliate, amazon, revenue, monetization, conversion]
---

# Affiliate Performance (Amazon Associates)

Tracking ID: `tallchairadvi-20` | Commission tier: ~3% (furniture/home office)

---

## Performance Log

| Period | Clicks | Orders | CVR | Ordered Revenue | Net Earnings | Notes |
|--------|--------|--------|-----|-----------------|--------------|-------|
| 2026-07-17 | 82 | 6 | 7.3% | $1,252.11 | **+$36.06** | First positive snapshot. ASIN fix validated — see July analysis. |
| 2026-06-30 | 70 | 7 | 10.0% | $578.08 | **-$0.41** | 1 return ($610) wiped earnings. See analysis below. |

---

## July 2026 Analysis (snapshot dated Jul 17 — ASIN fix validation)

**The July 4 link-architecture fix worked on both of its named success metrics:**

1. **Unknown attribution share: 94% → 45%.** Furniture (attributed ASINs) now carries 50% of clicks. The two verified chair ASINs are individually visible for the first time: Leap Plus B00TYE4QXU (19 clicks — top clicked product), Gesture B016OIF2JU (12 clicks).
2. **Revenue quality up:** ordered revenue $578 → $1,252 (+117%) on only +17% clicks. Verified `/dp/` links land buyers on real product pages; indirect baskets got bigger.

**First positive earnings in site history: +$36.06** ($37.56 shipped − $1.50 clawback). This period's single return was a $49.99 item, not a chair — June's "one chair return wipes the month" fragility did not repeat.

All 6 orders were still indirect (0 direct orders on tracked chairs — expected at this volume for $1,000+ items). Top-Sellers report still empty; populates only with direct purchases.

**Interpretation guardrail** (per [[statistical-confidence-policy]]): one positive snapshot ≠ repeatable revenue. The Jul 3 decision's kill-list condition — "until repeatable positive revenue months" — needs 2-3 consecutive positive periods before relaxing. Next checkpoints: August report, and Amazon may still restate this period (returns window).

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

| Issue | Impact | Fix |
|-------|--------|-----|
| 94% "Unknown" click attribution | Can't optimize which pages drive conversions | Amazon doesn't expose this — use GA4 outbound click events as proxy |
| Single tracking ID | No page-level split in Amazon dashboard | Add per-page tracking IDs (e.g., `tallchairadvi-gesture-20`) to isolate top performers |
| $610 return risk | Single return = negative month | Unavoidable at low volume; resolves with scale |
| Commission rate ~3% | Low margin on high-ticket items | Price-range diversification (accessories, books) adds stability |

---

## Benchmarks & Targets

| Metric | Current (Jun 30) | Target |
|--------|-----------------|--------|
| Monthly clicks | ~70 (one day?) | 500+ |
| Order CVR | 10% | Maintain 8–12% |
| Monthly earnings | -$0.41 | $100+ |
| Return rate | 14% (1/7) | <10% |
| ASIN attribution | 0% | 20%+ via per-page tracking IDs |

*Note: June 30 data may represent one day, not the full month. Pull a 30-day date-range export to get per-day breakdown.*

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

1. **Add per-page tracking IDs** — Create `tallchairadvi-gesture-20`, `tallchairadvi-leap-20`, etc. in Amazon Associates. Update affiliate links in `/review/gesture/`, `/review/leap-plus/`, `/aeron-vs-gesture/`. This splits the "Unknown" blob into attributable page buckets.
2. **Pull full 30-day export** — Re-export with a June 1–30 date range to confirm if this is one day or the full month's aggregated data.
3. **GA4 outbound click events** — Cross-reference Amazon clicks with GA4 `outbound_click` events per page as a proxy for page-level attribution until tracking IDs are in place.

---

## Links

- [[affiliate-compliance]] — FTC disclosure status per page
- [[gsc-performance]] — Organic traffic driving the clicks
- [[review-gesture]] — Flagship review, highest affiliate intent
- [[best-office-chairs]] — Money page, primary commission target
- [[aeron-vs-gesture]] — Comparison page with CTAs
