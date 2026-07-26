---
type: concept
last_updated: 2026-07-23
sources: [raw/affiliate/2026-07-22-amazon-associates-report.md, raw/affiliate/2026-07-17-amazon-associates-report.md, raw/affiliate/2026-06-30-amazon-associates-report.md, raw/audits/2026-07-04-affiliate-revenue-audit.md, raw/strategy/2026-07-21-profit-projections-monetization.md]
tags: [affiliate, amazon, revenue, monetization, conversion]
---

# Affiliate Performance (Amazon Associates)

Tracking ID: `tallchairadvi-20` | Commission tier: ~3% (furniture/home office)

---

## Performance Log

| Period | Clicks | Orders | CVR | Ordered Revenue | Net Earnings | Notes |
|--------|--------|--------|-----|-----------------|--------------|-------|
| 2026-07-22 | 84 | 5 | 6.0% | $3,142.77 | **+$40.02** | Same July window re-read (supersedes Jul 17). Big basket landed; ~$1.76K ordered-but-unshipped, ~$52 commission pending. Unknown attrib 45%→24%. |
| 2026-07-17 | 82 | 6 | 7.3% | $1,252.11 | **+$36.06** | First positive snapshot. ASIN fix validated — see July analysis. |
| 2026-06-30 | 70 | 7 | 10.0% | $578.08 | **-$0.41** | 1 return ($610) wiped earnings. See analysis below. |

---

## July 2026 Update (snapshot dated Jul 22 — same window, re-read)

The Jul 22 export is the **same July month-to-date window** as Jul 17, re-pulled 5 days later — not a new period. Confirmed by clicks barely moving (82 → 84) and the identical single $49.99 return / $1.50 clawback carrying through both. It **supersedes** the Jul 17 numbers.

**What changed in 5 days:**

1. **A large basket landed.** Ordered revenue jumped $1,252 → **$3,142.77** (+$1,890). But shipped revenue is only **$1,383.96** — so **~$1,758.81 is ordered-but-unshipped.** Amazon pays on *shipment*, so net earnings only edged **+$36.06 → +$40.02**. The unshipped portion, if it ships and holds, adds **~$52** more (~3%) → potential ~$92 on this window. Pending, not banked.
2. **Attribution improved again: Unknown 45% → 24%** (was 94% pre-fix). Attributed Furniture clicks now 71% of total. The Jul 4 ASIN fix keeps compounding and is near the indirect-tracking floor — don't expect Unknown to hit 0%.
3. **Third verified ASIN now visible:** Aeron Size C B01N32UFNT (12 clicks) surfaces individually for the first time, alongside Leap Plus B00TYE4QXU (28, still top) and Gesture B016OIF2JU (17). All three tracked chairs are individually attributable.
4. **First direct-classed order:** of 5 items, 4 indirect + 1 direct (vs 0 direct on Jul 17). Sits in "others" aggregation, so the product isn't exposed. Direct orders on the tracked chairs themselves: still 0 (expected for $1,000+ items at this volume).

**Guardrail unchanged** (per [[statistical-confidence-policy]]): July is tracking clearly positive, but it's still *one* window, not 2–3 consecutive positive *periods*. The Jul 3 kill-list condition needs independent months. Next real checkpoint: the August export. Amazon may still restate this window as the unshipped order ships or returns.

### Daily breakdown (Group By: Date view, pulled Jul 23)

The per-day export — the breakdown previously flagged as missing — pins down exactly where the earnings and the "missing" commission sit. Days with 0 activity omitted:

| Date | Clicks | Ordered | Ordered Rev | Shipped | Returned | Net Rev | Earnings |
|---|---|---|---|---|---|---|---|
| 2026-07-22 | 9 | 1 | $304.99 | 1 | 0 | $304.99 | **$9.15** |
| 2026-07-19 | 3 | 1 | **$2,048.80** | **0** | 0 | $0 | **$0** |
| 2026-07-16 | 3 | 0 | $0 | 1 | 0 | $729.00 | **$21.87** |
| 2026-07-15 | 4 | 1 | $729.00 | 0 | 0 | $0 | $0 |
| 2026-07-11 | 6 | 0 | $0 | 0 | 1 | −$49.99 | **−$1.50** |

Aggregate row: Total (net shipped) Revenue $1,333.97 = gross shipped $1,383.96 − $49.99 return. Visible daily earnings sum to $29.52; the balance to $40.02 (~$10.50 on ~$350 shipped revenue) is on days Amazon hides under its low-volume privacy threshold ("individual day metrics may not sum to totals").

**The ordered → shipped → paid mechanic (why "unshipped" ≠ "unpaid" ≠ "lost").** Commission accrues on *shipment*, not order, and the two events post on different days:
- **07-15 → 07-16:** the $729 order shows Ordered Revenue on 07-15 ($0 earnings) and its $21.87 payout on 07-16 (0 items ordered). Same sale, split across two rows — a "$0 earnings" order row is usually just waiting for its shipment row.
- **07-19 ($2,048.80, shipped 0, $0):** this single order *is* the "~$1,759 unshipped" from the aggregate — 65% of ordered revenue, earning nothing yet. At ~3% it's worth **~$61 when it ships**, which roughly doubles the window. If cancelled/returned before shipment it stays $0.

**Why big orders sit unshipped (not a tracking failure).** If a sale appears under Ordered Revenue with `tallchairadvi-20`, attribution already succeeded — it could not show otherwise. "Not shipped" is a timing state, not lost credit. Causes, in order of impact here: (1) **high-ticket furniture ships slowly** — Steelcase/Herman Miller-class chairs and desks often ship from the manufacturer or by freight/LTL with 1–3 week lead times, not fast Prime; (2) **mid-window snapshot** — the $2,048.80 order was placed only ~3 days before the pull; re-pulling in August should flip it to shipped; (3) **cancellations** — a small share never ship (buyer cancels), which legitimately pays $0. Third-party/marketplace orders still pay as long as checkout is on Amazon — the sale shows in *your* report tied to *your* tag, which is the proof attribution held. The only permanent $0 cases are **returns** (clawback, itemized — see 07-11) and **cancellations/category exclusions**, never silent re-routing.

Raw: `raw/affiliate/2026-07-22-amazon-associates-report.md` (+ CSVs in `raw/affiliate/2026-07-22-amazon-csv/`).

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

## Direct Program Economics (verified 2026-07-04)

| Program | Commission | Status |
|---------|-----------|--------|
| Amazon Associates | ~3% furniture | Live |
| Autonomous.ai | **~2%** — worse than Amazon; thesis's 8–10% assumption was wrong | Skip |
| Humanscale (via Impact) | Unpublished, 21-day cookie | Jackson to apply |
| Crandall Office | Reman. Leap V2 sold ON Amazon (B08PPVCCST) — monetizable today; direct program TBD | Amazon route live |
| FlexiSpot | Own program; BS14 not on Amazon | Jackson to apply |

`Layout.astro` now tracks autonomous.ai / humanscale.com / inmovement.com / flexispot.com / branchfurniture.com / crandalloffice.com clicks as `affiliate_click` with per-program labels — GA4 will show direct-program EPC the moment links go live.

## GA4 Link Tracking — Verified Working (2026-07-23)

End-to-end verification of the `affiliate_click` event pipeline. **Code is live and correct — no code fix needed.**

| Layer | Status | Evidence |
|---|---|---|
| GA4 base install | ✅ live | `G-TWK4EPV8DT` + `gtag.js` + `dataLayer` in production HTML (`curl` of `/`) |
| Click handler shipped | ✅ live | `affiliate_click` listener present in prod (capture-phase `click` + `auxclick`) |
| Links match tracker condition | ✅ | all money-page links are `www.amazon.com` + `tag=tallchairadvi-20`; CTAs carry `data-affiliate-cta` |
| Handler fires correctly | ✅ | logic simulation: tracks 3 chair ASINs + flexispot + CTA-flagged links; correctly skips untagged Amazon + external non-affiliate |
| Survives navigation | ✅ | `transport_type: 'beacon'` |

Event params sent: `page_path`, `page_title`, `destination_domain`, `affiliate_program`, `cta_label`, `cta_position`, `link_url`.

**Remaining gap is GA4-side config, not code** — events are collected but the params won't appear in standard reports until registered:
1. **Register custom dimensions** (Admin → Custom definitions, Event scope) for `affiliate_program`, `cta_position`, `cta_label`, `destination_domain`, `link_url`, `page_path`.
2. **Mark `affiliate_click` a Key event** (Admin → Events) to count it as a conversion.
3. **Verify:** GA4 → DebugView/Realtime, click any "Check price on Amazon" CTA → event should appear within seconds with all params.

Note: no cookie-consent gate exists — `gtag('config')` fires immediately on load (relevant if a CMP is added later). Live in-browser click test not run this session (Claude browser extension was disconnected); DebugView is the equivalent user-side check.

## Recommended Next Actions

1. **Add per-page tracking IDs** — Create `tallchairadvi-gesture-20`, `tallchairadvi-leap-20`, etc. in Amazon Associates. Update affiliate links in `/review/gesture/`, `/review/leap-plus/`, `/aeron-vs-gesture/`. This splits the "Unknown" blob into attributable page buckets.
2. **Pull full 30-day export** — Re-export with a June 1–30 date range to confirm if this is one day or the full month's aggregated data.
3. **GA4 outbound click events** — Cross-reference Amazon clicks with GA4 `outbound_click` events per page as a proxy for page-level attribution until tracking IDs are in place.

---

---

## Unit Economics & Projections (established 2026-07-21)

Full model: `raw/strategy/2026-07-21-profit-projections-monetization.md`

**Derived from July 1–17 (the only post-ASIN-fix period):**

| Constant | Value |
|---|---|
| Sessions (Clarity, 11.3/day) | 192 |
| Affiliate click rate | **43% of sessions** |
| Order rate on affiliate clicks | **7.3%** |
| Revenue per order | $208.68 |
| Effective commission rate | **3.0%** ($6.26/order) |
| **Net EPC** | **$0.44 per affiliate click** |
| **Net RPS** | **$0.188 per session** |
| Monthly run rate | $63.64 |
| Risk-adjusted baseline (return drag ~$10/mo) | **~$54/month** |

**The funnel is not the problem.** 43% affiliate CTR and 7.3% order conversion are both strong. The constraints are traffic volume and the 3% commission rate.

**Return risk:** 2 returns / 13 orders = 15%. A chair return costs $18–25 (June: $610 chair → −$18.30). Expect one roughly every other month.

### Revenue requires traffic — the key table

| Target/mo | Sessions/mo | Sessions/day | Multiple of today |
|---|---|---|---|
| $100 | 533 | 18 | 1.6x |
| $250 | 1,332 | 44 | 3.9x |
| $500 | 2,664 | 89 | 7.9x |
| $1,000 | 5,327 | 178 | **15.7x** |

$1,000/month needs ~16x current traffic — a 2027 conversation, not a content tweak.

### 12-month scenarios (from $54/mo baseline)

| Scenario | M12 | 12-mo cumulative |
|---|---|---|
| A. Plateau holds | $54 | $644 |
| B. Base — 8%/mo compounding | $135 | $1,099 |
| C. Base + Gesture cluster captured | $244 | $1,914 |
| D. Upside — 15%/mo + direct programs @8% | $461 | $3,093 |

**Most likely: B–C, i.e. $1,100–1,900 over 12 months, exiting at $135–245/mo.**

### Monetization levers, ranked

1. **Reposition `/review/gesture/` onto brand head terms** (~$109/mo, low effort) — see [[review-gesture]] and [[gsc-performance]]. 37,910 searches/mo unclaimed.
2. **Escape the 3% ceiling** — Humanscale / Crandall / FlexiSpot applications **still pending since Jul 4**. Only lever that multiplies revenue without new traffic. Jackson-only.
3. **Per-page tracking IDs** — still pending; 45% of clicks remain "Unknown". Measurement prerequisite for everything else.
4. **More height-specific pages** — `/office-chairs-for-6-foot-6/` converts at 2.76% CTR, 55x `/knee-pain-seat-depth/`. Proven format, only 5 exist.
5. **AI referral channel** — **17% of sessions already arrive from ChatGPT/Perplexity/Copilot**, consistently since mid-June, invisible to GSC. Free and compounding.

**Confidence guardrail:** the entire model rests on 13 orders across 2 reporting periods, and GA4 was broken Jun 16–Jul 18 so Clarity is the only traffic proxy. The August affiliate report and the first clean GA4 month are the two data points that would most change this.

## Links

- [[affiliate-compliance]] — FTC disclosure status per page
- [[gsc-performance]] — Organic traffic driving the clicks
- [[review-gesture]] — Flagship review, highest affiliate intent
- [[best-office-chairs]] — Money page, primary commission target
- [[aeron-vs-gesture]] — Comparison page with CTAs
