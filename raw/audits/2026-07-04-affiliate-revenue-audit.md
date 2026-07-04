# Affiliate Revenue Audit — 2026-07-04

**Type:** Hostile affiliate revenue audit (requested by Jackson). Cold review of page source, GSC intelligence, GA4, Amazon Associates data, and wiki claims.
**Verdict:** Monetization problem wearing an SEO costume, caused by a strategy problem. Not a traffic problem.

---

## A. Top 3 Weaknesses (ranked by revenue impact)

### 1. Affiliate links architecturally designed to lose money
- 82 of ~90 Amazon links were **search-results links** (`amazon.com/s?k=...`), not product links. Only the 6-foot-X pages used `/dp/` links.
- June 2026 Amazon data: 70 clicks → 7 orders, **every order was for a non-recommended product** (all "Unknown/None" ASIN — buyers landed on Amazon search results and bought something else). Net: -$0.41.
- **Worse:** the 8 existing `/dp/` ASINs in the codebase (B00IYXRJWK, B00BKVTJK0, B002LBSEJ4, B00IYXROJY, B00F0XFD2M, B00F01SFIC, B01N0H73KU, B00N3YV4MS) matched no findable Amazon listing — almost certainly hallucinated by the content agent. The 6-foot-X pages were sending buyers to dead/wrong product pages.
- Zero non-Amazon affiliate programs deployed despite thesis identifying them July 3.

### 2. Traffic and money live on different pages; money pages cannibalize
- /knee-pain-seat-depth/ (~25k impr/mo, #1 asset): informational intent, AIO-suppressed (Cornell queries 0% CTR at pos 2.6–6.1), first CTA at ~68% scroll, no email capture despite being thesis priority #1.
- Commercial intent split across 8+ overlapping list pages (best-office-chairs, office-chairs-for-tall-people, best-big-and-tall, heavy-duty, wide-seat, 5× 6-foot-X). GSC confirms cannibalization ("steelcase leap plus" across 4 URLs / 661 impr; "steelcase leap v2 for tall people" across 3 URLs). /best-office-chairs/ stuck pos 18–22 while /office-chairs-for-tall-people/ rose to 8.8.

### 3. Trust/proof deficit on the differentiator
- Entire E-E-A-T thesis is "6'4", owns a Gesture" — but 9 images site-wide, 2 on the flagship review, no photo of Jackson in the chair, no measurement shots, no video. GA4: 23.6% engagement, 76% bounce, 67s sessions.

## B. Biggest blind spot
Building an SEO automation company with a chair site as its demo. 8 agents + weekly intelligence servicing ~26 clicks/week and negative revenue. The two afternoon-sized changes that alter revenue-per-click (ASIN links, direct programs) sat as "next actions" for weeks while pipeline tuning continued. Secondary: GA4 contaminated (63% Direct, homepage 3s/93% bounce = own monitoring); desktop CTR 0.02% vs mobile 0.47% anomaly uninvestigated.

## D. 30-day plan (by money impact)
1. Replace all search links with hand-picked verified /dp/ links + per-page tracking IDs — **DONE 2026-07-04 (links; tracking IDs pending Jackson)**
2. Join 2–3 direct programs; refurb-Steelcase content angle — **PARTIAL 2026-07-04** (infra + refurb page done; applications are Jackson's)
3. Consolidate commercial cluster: crown /office-chairs-for-tall-people/, merge/301 overlapping list pages + 4 dead spec sub-pages
4. Ship knee-pain email capture + post-calculator CTA block
5. Photo shoot: 15–20 original photos (Jackson + Gesture + tape measure)
6. Freeze pipeline development for 30 days

## E. Kill list
- No new automation/intelligence features until $100/mo
- No meta/CTR iteration below pos 8 (what-failed.md proved 3×)
- No AIO capsule work on informational queries (feeds the AIO that's eating the clicks; the calculator is the defensible asset)
- Merge wide-seat + best-big-and-tall into heavy-duty; resolve best-office-chairs vs office-chairs-for-tall-people
- Defer adjacent niche until repeatable positive months

## F. Experiments
1. ASIN links: Amazon "Unknown" attribution 0% → 20%+ in 30 days; ordered products start matching recommendations
2. Per-page tracking IDs: which pages produce orders (prediction: leap-plus review + 6-foot-X outperform best-office-chairs)
3. Direct program vs Amazon EPC on /review/leap-plus/ (confirmed if direct 2x+)
4. Consolidation: surviving page gains 3+ positions in 4 weeks
5. Proof photos on Gesture review: affiliate CTR +50% relative (Clarity before/after)

## G. Program economics correction (found during execution)
- **Autonomous.ai pays ~2%** (their own program) — WORSE than Amazon's 3%. Thesis assumption of 8–10% was wrong.
- Humanscale: real program via Impact/CJ, commission unpublished, 21-day cookie — worth applying.
- **Crandall Office Furniture**: remanufactured Leap V2 sold ON Amazon (B08PPVCCST) — monetizable under existing tag today; direct program worth investigating.
- FlexiSpot: sells direct; has own program; BS14 not on Amazon.

## Execution log (same day)
- 78 search links → verified /dp/ links; 8 hallucinated ASINs replaced. Verified ASIN map:
  - Steelcase Gesture → B016OIF2JU
  - Steelcase Leap Plus → B00TYE4QXU (500 lb in title)
  - Herman Miller Aeron Size C → B01N32UFNT
  - Sihoo Doro S300 → B0DQTRVSHS
  - La-Z-Boy Trafford B&T → B0116W5BG8
  - Hbada E3 Pro → B0CQ4K1KXT
  - Ergotron HX → B01MXYN33U
  - VIVO extra-tall pole (STAND-V011) → B01BO42XK0
  - Crandall reman. Leap V2 → B08PPVCCST
- 4 search links intentionally left (no verifiable Amazon listing): Branch chair, FlexiSpot BS14, Ergotron LX Tall Pole, OFM ESS-200.
- Layout.astro: DIRECT_PROGRAMS map added (autonomous.ai, humanscale.com, inmovement.com, flexispot.com, branchfurniture.com, crandalloffice.com) — GA4 now tracks these as affiliate_click with program label.
- NEW PAGE: /refurbished-steelcase-leap-tall-people/ (blog-analyze: 82/100, passes gate). Inbound links from best-office-chairs-under-500, best-big-and-tall, review/leap-plus. Crandall Amazon CTA added to under-500 refurb section (was un-monetized plain text).
- Build verified: 52 pages.

## Jackson's required actions (cannot be done by agent)
1. **Create per-page tracking IDs** in Amazon Associates (Account → Manage Tracking IDs): suggested set: `tallchairadvi0d-20` style or `tallchairadvi-knee-20`, `-gest-20`, `-leap-20`, `-best-20`, `-6ft-20`, `-refurb-20`. Links currently all use `tallchairadvi-20` (safe). Once IDs exist, swap per page.
2. **Click-verify the 9 new ASIN links** (5 min) — confirm listings are live, in stock, sane prices.
3. **Apply to direct programs**: Humanscale (via Impact), Crandall Office (check program), FlexiSpot. Skip Autonomous (2% < Amazon 3%).
