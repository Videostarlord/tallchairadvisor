# Weekly Plan — 2026-07-20

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] FIX: /best-office-chairs-under-500/ | Investigate and fix broken CTA element causing 17 dead clicks and 5 rage clicks — check that all buttons/links are properly interactive, anchor tags have valid hrefs, and no non-clickable elements visually resemble CTAs | Clarity behavioral alert: 17 dead clicks + 5 rage clicks = highest UX distress signal on the site; revenue is being lost on a buyer-intent page | FILE: src/pages/best-office-chairs-under-500.astro

- [ ] FIX: /correct-chair-dimensions/ | Add a visible anchor-linked table of contents in the first 200 words and move the most critical verdict content (height-bracket table) above the fold; do NOT move or alter body content | Clarity shows 12% avg scroll depth on 2 sessions — users are bouncing before reaching any useful content; the page has 16,917 impressions at pos 9.6 making this a top-3 opportunity by score, and scroll failure is killing conversion before any CTA is reached | FILE: src/pages/correct-chair-dimensions.astro

- [ ] FIX: /correct-chair-dimensions/ | Add a "Methodology" callout block directly beneath the height-bracket verdict table: state (1) popliteal-height-to-standing-height ratio assumed (popliteal ≈ 28–30% of standing height), (2) thigh-length-to-standing-height ratio assumed, (3) that Cornell Ergonomics Lab and OSHA guidelines were used as the ergonomic posture baseline | Competitor gap: karo.co.za outranks TCA on "ergonomic chair dimensions" (TCA pos 18.9) partly because methodology is opaque; named rules + numbered criteria satisfy AIO citation formatting requirements and provide the authority signal competitors lack | FILE: src/pages/correct-chair-dimensions.astro

> ⚠ **Execution agent note:** The two FIXes above are both for `correct-chair-dimensions.astro` — apply both in a single edit pass. They are listed separately for clarity of instruction only.

- [ ] FIX: /office-chairs-for-tall-people/ | Add per-chair spec rows (seat height range, seat depth range, back height, weight capacity) beneath each chair entry or in a consolidated comparison table; add weight-capacity guidance callout distinguishing tall-only vs. tall+heavy builds (Aeron Size C 350 lb, Gesture 400 lb, Leap Plus 500 lb) | Competitor gap: thehumansolution.com outranks on weight+height segmentation; page has 291 buyer-intent impressions and the affiliate capture gap is rated [high]; also addresses [low] competitor gap from /office-chairs-for-tall-people/ analysis | FILE: src/pages/office-chairs-for-tall-people.astro

- [ ] FIX: /review/leap-plus/ | Investigate and fix the 1 dead click (Clarity signal); audit all CTA links to confirm amazon affiliate tag `tallchairadvi-20` is present on every product link | Dead click on a page with 4 sessions and 66% scroll depth means engaged users are hitting a broken link; /review/leap-plus/ is the #3 opportunity by GSC score (2,738) with 11,911 impressions at pos 8.7 | FILE: src/pages/review/leap-plus.astro

---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Herman Miller Aeron Size C vs Steelcase Leap Plus for Tall People | aeron size c vs steelcase leap plus | /aeron-size-c-vs-leap-plus/ | Answer-first comparison targeting tall users 6'0"–6'5" choosing between the two highest-impression review pages on the site. Open with a one-paragraph verdict, then a spec table (seat height, seat depth, back height, weight limit for both chairs), then height-bracket recommendations (6'0"–6'2", 6'2"–6'4", 6'4"+). Research voice throughout — no first-person testing claims for either chair. Target "aeron size c vs leap plus" and "herman miller aeron vs steelcase leap plus tall" query variants. Include Amazon affiliate links with tag=tallchairadvi-20. Addresses cannibalization risk on "aeron size c" between /review/aeron-size-c/ and /chairs/herman-miller-aeron/ by giving both pages a clear comparison destination to link to.

---

## REWRITES (Thursday agent, lower priority)
<!-- Significant content overhaul of existing pages. Do NOT emit for any page already receiving a FIX above. -->

- [ ] REWRITE: /chairs/herman-miller-aeron/tall-people/ | Add a structured spec comparison table under "The Three Dimensions That Determine Fit" with columns: Dimension | Aeron Size C | Steelcase Gesture | Steelcase Leap Plus — rows: Seat Height Range, Seat Depth (with adjustability note), Back Height, Weight Limit; all values in inches with explicit min/max | Competitor gap [high]: thehumansolution.com outranks because specs are prose-only; page has a confirmed AIO capsule already inserted; a scannable spec table satisfies the AIO passage format and supports the comparison queries this page receives | FILE: src/pages/chairs/herman-miller-aeron/tall-people.astro

---

## STRATEGY NOTES

This week's plan is dominated by two themes: **fixing behavioral UX failures before they compound** (the /best-office-chairs-under-500/ CTA breakage and the /correct-chair-dimensions/ scroll collapse are both active revenue leaks, not hypothetical risks) and **shoring up the three highest-opportunity pages** (/knee-pain-seat-depth/, /correct-chair-dimensions/, /review/leap-plus/) before the WoW impression drop (−42.7%) stabilizes into a new lower baseline. The new Aeron-vs-Leap-Plus comparison page is the single highest-leverage new content opportunity this week: it targets a natural query that bridges the two highest-impression review pages, has no existing TCA page, and will serve as the canonical destination for internal links from both /review/aeron-size-c/ and /chairs/herman-miller-aeron/ — directly addressing the "aeron size c" cannibalization risk flagged in GSC intelligence. No fixes are scheduled for /review/gesture/ or the recently-edited Gesture sub-pages, which are all in cooldown.