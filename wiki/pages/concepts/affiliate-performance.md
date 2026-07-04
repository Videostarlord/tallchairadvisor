---
type: concept
last_updated: 2026-07-04
sources: [raw/affiliate/2026-06-30-amazon-associates-report.md, raw/audits/2026-07-04-affiliate-revenue-audit.md]
tags: [affiliate, amazon, revenue, monetization, conversion]
---

# Affiliate Performance (Amazon Associates)

Tracking ID: `tallchairadvi-20` | Commission tier: ~3% (furniture/home office)

---

## Performance Log

| Period | Clicks | Orders | CVR | Ordered Revenue | Net Earnings | Notes |
|--------|--------|--------|-----|-----------------|--------------|-------|
| 2026-06-30 | 70 | 7 | 10.0% | $578.08 | **-$0.41** | 1 return ($610) wiped earnings. See analysis below. |

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

## Direct Program Economics (verified 2026-07-04)

| Program | Commission | Status |
|---------|-----------|--------|
| Amazon Associates | ~3% furniture | Live |
| Autonomous.ai | **~2%** — worse than Amazon; thesis's 8–10% assumption was wrong | Skip |
| Humanscale (via Impact) | Unpublished, 21-day cookie | Jackson to apply |
| Crandall Office | Reman. Leap V2 sold ON Amazon (B08PPVCCST) — monetizable today; direct program TBD | Amazon route live |
| FlexiSpot | Own program; BS14 not on Amazon | Jackson to apply |

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
