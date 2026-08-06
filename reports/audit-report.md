# TCA Weekly Audit Report
**Generated:** 2026-08-06T10:03:35.341Z
**Data range:** 2026-05-08 → 2026-08-06

> Rendered from `data/audit-findings.json`. Do not parse this file — downstream
> agents read the JSON. Finding IDs are `sha1(page|issueClass)` and are stable
> week over week, so they can be retracted in `data/retractions.jsonl`.

## Executive Summary

The site has strong impression volume (99,415 over 90 days) but a critically low overall CTR of 0.24%, driven primarily by one page (/knee-pain-seat-depth/) that alone accounts for 41% of all impressions yet converts at only 0.04% CTR. Title and meta length violations are widespread, with several pages exceeding or falling short of ideal ranges. A confirmed spec discrepancy exists on /chairs/steelcase-leap-plus/seat-height/ where the title and meta contradict each other on the max seat height (22.5" vs 20.5"). Multiple pages with strong positional data (pos 5–10) are leaking clicks due to weak or overlong meta descriptions, and the site's hub page (/office-chairs-for-tall-people/) has an overlong title suppressing SERP display.

## Issues by Severity


### 🔴 CRITICAL

**`e56f5c82ad68` /knee-pain-seat-depth/ — ctr-leak**

Page has the site's highest impression volume by far but an almost non-existent CTR of 0.04%, indicating the title/meta is failing to earn clicks despite near-page-1 position.

*Evidence:* 40,752 impr, pos 5.7, 17 clicks, 0.04% CTR — 41% of all site impressions, yet the worst CTR of any ranked page.

*Fix:* Rewrite meta description to lead with a concrete verdict/promise. Suggested (145 chars): "Seat edge cutting into the back of your knees? The Cornell 17-inch rule fixes it. See exact seat depth minimums for 6'0–6'7 and the chairs that hit them."

**`fae650db38e2` /chairs/herman-miller-aeron/ — ctr-leak**

Page has 551 impressions with 0 clicks and is ranked at pos 20.6, indicating thin content or weak E-E-A-T is suppressing rank and preventing any CTR.

*Evidence:* 551 impr, pos 20.6, 0 clicks, 0% CTR. Top queries: 'aeron size c', 'aeron chair size c', 'herman miller aeron size c'.

*Fix:* This page competes directly with /review/aeron-size-c/ and /chairs/herman-miller-aeron/tall-people/ for the same queries. Conduct a content depth audit: add a full spec table (seat height range, depth, back height, weight limit), height-by-height verdict section, and at least 3 internal links from higher-authority pages. Consider whether this page should be merged into /review/aeron-size-c/ or clearly differentiated with unique depth.

**`32766b2a9f2c` /chairs/steelcase-leap-plus/seat-height/ — spec-error**

The page title states the seat height range as '15.5"–22.5"' but the meta description contradicts this, stating '15.5"–20.5" range' — one figure is wrong and will damage trust and E-E-A-T.

*Evidence:* Title: 'Steelcase Leap Plus Seat Height: 15.5"–22.5" Range'. Meta desc: 'Steelcase Leap Plus seat height: 15.5"–20.5" range (5" adjustment).' The Leap Plus official max is 22.5" per /review/leap-plus/ data.

*Fix:* Correct the meta description to match the title and the verified spec from /review/leap-plus/. Updated meta (153 chars): "Steelcase Leap Plus seat height: 15.5"–22.5" range (7" adjustment). Fits users 5'5"–6'6". Why the extra range matters most if you're 6'2" or taller."

**`31788964418d` /chairs/steelcase-leap-plus/seat-height/ — ctr-leak**

Page has 527 impressions at pos 8.8 with 0 clicks — a complete CTR failure on a near-page-1 spec page with clear commercial query intent.

*Evidence:* 527 impr, pos 8.8, 0 clicks, 0% CTR. Top queries include 'steelcase leap chair dimensions seat depth official'.

*Fix:* Fix the spec error (see spec-error finding) first, as inconsistent data may be triggering Google's quality filters. Then rewrite meta with the corrected spec as the lead. Add internal links from /review/leap-plus/ and /chairs/steelcase-leap-plus/tall-people/ pointing to this page.


### 🟠 HIGH

**`212811006ec2` /knee-pain-seat-depth/ — title-length**

Title is 67 characters, exceeding the 50–60 char ideal and likely truncating in SERPs.

*Evidence:* Title length: 67 chars. Ideal max: 60 chars.

*Fix:* Shorten to: "Seat Depth & Knee Pain: The Fix for Tall People" (57 chars) — preserves the core keyword and removes the verbose 'Cornell Ergonomics Rule' prefix.

**`9f99335dd373` /correct-chair-dimensions/ — ctr-leak**

Page sits at pos 9.6 with 18,707 impressions but achieves only 0.18% CTR, well below the expected ~2–3% for that position.

*Evidence:* 18,707 impr, pos 9.6, 34 clicks, 0.18% CTR. Query leak: 'ergonomic chair dimensions' (62 impr, pos 19.3, 0%); 'standard size of a office chair' (97 impr, pos 16.3, 0%).

*Fix:* Rewrite meta to be verdict-first and height-specific. Suggested (150 chars): "Exact seat height, depth, and back height minimums for 6'0–6'7+, based on Cornell ergonomics. Copy these numbers before you buy any office chair."

**`ef9fbd421bf3` /correct-chair-dimensions/ — title-length**

Title is 73 characters, significantly exceeding the 60-char cap and will be truncated in Google SERPs.

*Evidence:* Title length: 73 chars. Ideal max: 60 chars.

*Fix:* Shorten to: "Office Chair Dimensions for Tall People: Specs by Height" (61 chars) or "Ergonomic Chair Dimensions for Tall People (6'0–6'7)" (53 chars).

**`d0d72d28e7be` /review/leap-plus/ — meta-length**

Meta description is 170 characters, exceeding the 155-char ideal and risking truncation.

*Evidence:* Meta desc length: 170 chars. Ideal max: 155 chars.

*Fix:* Trim to under 155 chars. Suggested (151 chars): "Research-based spec analysis for tall users 6'0–6'6. Seat depth 15.75–19.75", 500 lb capacity, 22.5" seat height ceiling — who fits and who doesn't."

**`822656ebbd96` /review/leap-plus/ — ctr-leak**

Top query 'steelcase leap plus' has 1,084 impressions at pos 10.2 but only 1.01% CTR — the page is just off page 1 and leaking significant high-intent clicks.

*Evidence:* Query 'steelcase leap plus': 1,084 impr, pos 10.2, 1.01% CTR. Page total: 13,223 impr, pos 8.8, 0.29% CTR.

*Fix:* Push this page to p1 via internal linking from /office-chairs-for-tall-people/, /gesture-vs-leap-plus/, and /chairs/steelcase-leap-plus/tall-people/. Add a structured 'Fast Facts' schema-eligible spec table at the top to increase rich-result eligibility and CTR.

**`018c617c0678` /review/gesture/ — ctr-leak**

Despite being the site's only first-person-tested product at pos 8.0, the page achieves only 0.12% CTR across 8,415 impressions — well below potential.

*Evidence:* 8,415 impr, pos 8.0, 10 clicks, 0.12% CTR.

*Fix:* Leverage the unique first-person E-E-A-T angle harder in the meta. Suggested (153 chars): "Reviewed by a 6'4" owner after 18 months of daily use. Seat depth, armrests, back height verdict for 6'1–6'7 — who fits and who should look elsewhere."

**`1760ee88a1cd` /office-chairs-for-tall-people/ — title-length**

Hub page title is 75 characters — the most over-length title on the site and the highest-priority fix given this page's commercial importance.

*Evidence:* Title length: 75 chars. Ideal max: 60 chars. Page: 3,707 impr, pos 8.5, 20 clicks.

*Fix:* Shorten to: "Best Office Chairs for Tall People 2026 (6'0–6'7)" (52 chars) — drops the word 'Guide' and the redundant closing quote mark to stay under 60 chars while keeping the year and height bracket.

**`4d4660bb8c27` /best-office-chairs-under-500/ — meta-quality**

Meta description references Jackson's personal purchase of the Gesture in first-person ('an ME student who spent months researching before buying the $1,649 Gesture'), but the Gesture is the ONLY personally tested chair — this framing must not imply first-hand testing of the budget chairs listed on this page.

*Evidence:* Meta: 'Honest budget picks for tall users from an ME student who spent months researching before buying the $1,649 Gesture.' 152 chars. None of the under-$500 chairs were personally tested by Jackson.

*Fix:* Rewrite to maintain E-E-A-T without implying personal testing of budget picks. Suggested (150 chars): "Budget picks for tall users 6'0–6'7: spec-verified seat height and depth minimums by height, with clear guidance on where to compromise and where not to."

**`5d47576a55b8` /chairs/steelcase-gesture/weight-limit/ — ctr-leak**

Three query clusters totalling 149 impressions at positions 9.1–10.1 generate 0% CTR, with only 1 click total across 682 impressions.

*Evidence:* 'steelcase gesture weight limit': 82 impr, pos 9.1, 0% CTR. 'steelcase gesture weight': 51 impr, pos 10.1, 0% CTR. 'steelcase gesture chair weight capacity official': 16 impr, pos 9.4, 0% CTR. Page total: 682 impr, pos 8.3, 1 click.

*Fix:* Rewrite meta to lead with the definitive answer and create urgency for heavier-tall users. Suggested (149 chars): "Steelcase Gesture weight limit is 400 lbs (BIFMA certified). How that compares to the Leap Plus at 500 lbs — and which to choose if you're 6'2+ and 250+ lbs."

**`2f44da9be495` /chairs/steelcase-gesture/ — ctr-leak**

Hub page for Gesture chair sits at pos 9.4 with 615 impressions and only 1 click, a near-zero CTR that indicates the SERP snippet is failing to capture intent.

*Evidence:* 615 impr, pos 9.4, 1 click, 0.16% CTR. Query leak: 'steelcase gesture for tall people' (17 impr, pos 11, 0% CTR).

*Fix:* Rewrite meta to be verdict-first. Suggested (148 chars): "Gesture fits 6'0–6'4 per Steelcase specs (21" seat height, 18.75" adjustable depth). Tall-person fit verdict, adjustment guide, and comparison to Leap Plus."

**`81bc473ec908` /pain-ergonomics/ — thin-content**

Page ranks at pos 29.3 — far from page 1 — with 487 impressions and 1 click, signalling Google does not consider this content authoritative enough to surface for its target queries.

*Evidence:* 487 impr, pos 29.3, 1 click, 0.21% CTR. No query leak data provided, suggesting no single query has significant traction.

*Fix:* Expand with: (1) a height-segmented pain diagnosis section (e.g., 'Pain at 6'0–6'2 vs 6'4+'), (2) citations to ergonomics research (Cornell, NIOSH), (3) specific chair dimension fixes for each pain type, and (4) internal links from /knee-pain-seat-depth/ and /back-pain-spine-height/ as contextual anchors. Target 1,500+ words with structured H2/H3 hierarchy.

**`2afb01154404` /back-pain-spine-height/ — title-length**

Title is 42 characters, well below the 50-char minimum, wasting keyword signal in the most weighted on-page SEO element.

*Evidence:* Title length: 42 chars. Ideal minimum: 50 chars.

*Fix:* Expand to: "Back Pain From Your Office Chair? A Tall User Fix" (50 chars) or "Office Chair Back Pain for Tall People: The Fix" (47 chars) — best option: "Back Pain From Your Chair: Lumbar Fix for Tall People" (54 chars).


### 🟡 MEDIUM

**`ea09e7be3cda` /correct-chair-dimensions/ — aio-suppression**

Top query 'cornell ergonomics chair seat height feet flat thighs parallel' is confirmed AIO-suppressed, meaning meta rewrites cannot recover clicks for that specific query.

*Evidence:* Query: 'cornell ergonomics chair seat height feet flat thighs parallel' — 17 impr, pos 4.8, 0% CTR, flagged ⚠AIO.

*Fix:* Do not invest in meta optimisation targeting this exact query. Instead, redirect content strategy toward transactional variants like 'chair seat height for 6 foot 4' where AIO coverage is less complete. Add a comparison table of chairs meeting the Cornell spec to capture downstream purchase intent.

**`5663893947e9` /review/gesture/ — meta-length**

Meta description is 158 characters, exceeding the 155-char ideal.

*Evidence:* Meta desc length: 158 chars. Ideal max: 155 chars.

*Fix:* The CTR-focused rewrite above (see ctr-leak recommendation) lands at 153 chars and resolves both issues simultaneously.

**`47248c01f0c3` /review/aeron-size-c/ — meta-length**

Meta description is 166 characters, 11 chars over the 155-char ceiling.

*Evidence:* Meta desc length: 166 chars. Ideal max: 155 chars.

*Fix:* Trim to: "Aeron Size C fits most 6'0–6'3 users: seat height to 20.5", fixed depth 18.5". Who it fits, who should step up to the Leap Plus, and why." (152 chars).

**`c5a9b74a3b06` /office-chairs-for-tall-people/ — meta-length**

Meta description is 168 characters, 13 chars over the 155-char limit.

*Evidence:* Meta desc length: 168 chars. Ideal max: 155 chars.

*Fix:* Trim to: "Leap Plus (22.5" seat height) for 6'4+, Aeron Size C and Gesture to 6'4 — height-bracket verdicts with exact specs for tall office workers." (149 chars).

**`f0baa4b52fb4` /best-office-chairs-under-500/ — title-length**

Title is 45 characters, below the 50-char minimum, leaving keyword real estate unused.

*Evidence:* Title length: 45 chars. Ideal range: 50–60 chars.

*Fix:* Expand to: "Best Office Chairs for Tall People Under $500 (2026)" (53 chars) — adds the year signal and stays comfortably within range.

**`369f0d637ae2` /gesture-vs-leap-plus/ — meta-length**

Meta description is 165 characters, 10 chars over the 155-char ceiling.

*Evidence:* Meta desc length: 165 chars. Ideal max: 155 chars.

*Fix:* Trim to: "Seat depth (18.75" vs 19.75"), back height, armrest comparison for 6'0–6'6. Which one wins depends on your exact height — full verdict inside." (152 chars).

**`6f2887c79740` /chairs/steelcase-gesture/ — meta-length**

Meta description is 170 characters, 15 chars over the 155-char limit.

*Evidence:* Meta desc length: 170 chars. Ideal max: 155 chars.

*Fix:* The CTR rewrite above (see ctr-leak recommendation) lands at 148 chars and resolves both issues simultaneously.

**`16b4f4925969` /back-pain-spine-height/ — meta-length**

Meta description is 132 characters, below the 130-char minimum — barely in range but at risk of being too short to fill SERP snippet space competitively.

*Evidence:* Meta desc length: 132 chars. Ideal minimum: 130 chars.

*Fix:* Expand slightly to add specificity and reach ~145 chars. Suggested: "Standard chair lumbar hits the wrong spinal segment at 6'2+. Here's why tall users get back pain from 'ergonomic' chairs — and exact chair fixes by height range." (156 chars — trim to 153): "Standard lumbar support hits the wrong spinal segment at 6'2+. Why tall users get back pain from 'ergonomic' chairs and which chair fixes it by height."

**`abca2db3aac4` /chairs/steelcase-gesture/seat-depth/ — ctr-leak**

Page sits at pos 7.7 with 969 impressions but only 2 clicks (0.21% CTR), and the primary query 'steelcase gesture seat depth' has 0% CTR at pos 8.8.

*Evidence:* 969 impr, pos 7.7, 2 clicks, 0.21% CTR. Query leak: 'steelcase gesture seat depth' (39 impr, pos 8.8, 0% CTR).

*Fix:* Rewrite meta to front-load the spec answer. Suggested (133 chars): "Gesture seat depth: 15.75–18.75" (3" range). Fits 6'0–6'4; at 6'4+ use full extension. Step-by-step adjustment guide inside."

**`5c033f2e62af` /office-chairs-for-6-foot-4/ — meta-quality**

Page title uses an HTML-encoded apostrophe (&#39;) in the OG Title field, which may render as a literal entity string in some social/preview contexts.

*Evidence:* OG Title: "Best Office Chair for 6'4" | Tall Chair Advisor" — standard title appears correct but OG field shows encoding discrepancy in raw data.

*Fix:* Ensure the OG Title field outputs a properly decoded UTF-8 apostrophe character (') rather than the HTML entity &#39; — check the template/CMS output for the og:title meta tag specifically.

**`e2e8be9482a4` /chairs/steelcase-leap-plus/tall-people/ — internal-linking**

Spoke page for Leap Plus tall-people fit sits at pos 9.2 with 488 impressions and low CTR — it is likely under-linked from the hub and review pages, limiting authority flow.

*Evidence:* 488 impr, pos 9.2, 2 clicks, 0.41% CTR. Top queries include 'steelcase leap v2 for tall people' — a high-value commercial query.

*Fix:* Add a contextual internal link to this page from /office-chairs-for-tall-people/, /review/leap-plus/, and /chairs/steelcase-leap-plus/seat-height/ using anchor text 'Steelcase Leap Plus for tall people' or 'Leap Plus tall-person fit guide'. This will consolidate authority on the spoke and improve its ranking for the top query.


### ⚪ LOW

**`a6b8138171ac` /chairs/herman-miller-aeron/ — title-length**

Title is 49 characters, just under the 50-char minimum.

*Evidence:* Title length: 49 chars. Ideal minimum: 50 chars.

*Fix:* Expand by one word: "Aeron Size C for Tall People: Full Fit Analysis" (47 chars) — or "Herman Miller Aeron Size C for Tall People" (43 chars, though this risks being shorter). Better: "Aeron Size C for Tall People: Specs & Fit Guide" (49 chars). Safest: "Herman Miller Aeron Size C: Tall Person Fit Guide" (50 chars exactly).

**`e97fddd47a65` /chairs/steelcase-gesture/seat-depth/ — meta-length**

Meta description is 132 characters, just at the lower boundary of the 130–155 char ideal range — tighter than recommended for competitive SERPs.

*Evidence:* Meta desc length: 132 chars. Ideal minimum: 130 chars.

*Fix:* The CTR rewrite above targets 133 chars, which resolves both issues. Aim for 140+ chars to give Google more snippet content to display.

## Week's Recommended Focus

1. 1. FIX SPEC ERROR on /chairs/steelcase-leap-plus/seat-height/ — correct the meta to read '15.5"–22.5"' (not 20.5") and rewrite for CTR. This is the only page with a factual data conflict and it has 0 clicks at pos 8.8.
2. 2. REWRITE META on /knee-pain-seat-depth/ — 40,752 impressions at 0.04% CTR is the single largest click-recovery opportunity on the site. Even lifting CTR to 1% yields ~400 clicks/month from one page.
3. 3. SHORTEN TITLES on /correct-chair-dimensions/ (73 chars) and /office-chairs-for-tall-people/ (75 chars) — both hub/pillar pages are being truncated in SERPs, directly suppressing click-through on the site's most commercially important pages.

## Pages Not Needing Action

- /office-chairs-for-6-foot-3/
- /office-chairs-for-6-foot-6/
- /chairs/herman-miller-aeron/tall-people/
