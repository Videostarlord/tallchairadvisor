# TCA Weekly Audit Report
**Generated:** 2026-08-18T08:37:56.663Z
**Data range:** 2026-05-19 → 2026-08-17

> Rendered from `data/audit-findings.json`. Do not parse this file — downstream
> agents read the JSON. Finding IDs are `sha1(page|issueClass)` and are stable
> week over week, so they can be retracted in `data/retractions.jsonl`.

## Executive Summary

TallChairAdvisor is generating strong impressions (100,403 in 90 days) but a catastrophically low site-wide CTR of 0.25%, driven primarily by /knee-pain-seat-depth/ which alone accounts for 41% of all impressions at a 0.04% CTR — a confirmed AIO-suppression pattern that no snippet rewrite will fix. The highest-leverage opportunities are deterministic defects: a spec error on /chairs/steelcase-leap-plus/seat-height/ (title states wrong standard cylinder minimum), a voice-policy violation on /aeron-vs-gesture/ (first-person Gesture verdict on a page that must use research voice), a title over the 60-char limit on /correct-chair-dimensions/, and schema structural issues including a deprecated HowTo block and missing itemReviewed on review pages. The Profit Audit directive is enforced throughout: meta/CTR findings are suppressed for AIO-eaten informational pages, and findings are concentrated on correctness, affiliate integrity, and buyer-intent pages.

## Issues by Severity


### 🔴 CRITICAL

**`32766b2a9f2c` /chairs/steelcase-leap-plus/seat-height/ — spec-error**

Page title and likely body copy state the Leap Plus standard cylinder minimum as 15.5" — but the verified spec (Steelcase Seating Specification Guide) is 15.5"–19.5" standard, which is internally consistent, yet the decisions log (2026-08-06) confirmed the site had previously published a spliced 15.5"–22.5" range treating the optional cylinder max as standard; the title here still leads with '15.5"–19.5" Standard' which must be verified against body copy to ensure the standard vs. optional cylinder distinction is explicit throughout.

*Evidence:* Title: 'Steelcase Leap Plus Seat Height: 15.5"–19.5" Standard'. Meta desc correctly states both configurations. GSC: 0 clicks, 476 impr, pos 8.9, CTR 0%. Decisions log 2026-08-06: 28 pages still carried wrong figures after initial correction; this sub-page was one of the first corrected but the body copy must be verified.

*Fix:* Audit body copy to confirm every instance specifies: standard cylinder = 15.5"–19.5"; optional 5" cylinder (~$63 at order time) = 17.5"–22.5". Confirm no sentence quotes 15.5" min alongside 22.5" max without the cylinder caveat. The title is acceptable as-is only if body copy is clean. If any spliced figures remain, correct them. Also reduce title to ≤60 chars: 'Steelcase Leap Plus Seat Height: 15.5"–19.5" (Standard)' (53 chars — already within limit, verify no truncation in GSC).


### 🟠 HIGH

**`ea09e7be3cda` /correct-chair-dimensions/ — aio-suppression**

Query 'cornell ergonomics chair seat height feet flat thighs parallel' (pos 4.8, 0% CTR) is a confirmed AIO pattern — the page ranks strongly but earns zero clicks because Google's AI Overview answers the spec query inline.

*Evidence:* Query: 'cornell ergonomics chair seat height feet flat thighs parallel' — 17 impr, pos 4.8, 0% CTR, flagged ⚠AIO in audit data. Per [[ctr-optimization]] wiki, AIO suppression is confirmed on Cornell/spec queries at this position band.

*Fix:* Add a Direct Answer / citation capsule block immediately after the H1 that states the Cornell rule in structured, citable prose (40–60 words, specific numeric answer). Format: 'The Cornell Ergonomics rule: seat height is correct when your feet are flat on the floor, thighs parallel, with no pressure under the thighs. For tall users (6'0"–6'7"), this typically requires a seat height of [X"–Y"] depending on inseam.' This feeds the AI Overview rather than competing with it, per the 2026-08-13 capsule decision.

**`abca2db3aac4` /chairs/steelcase-gesture/seat-depth/ — ctr-leak**

'steelcase gesture seat depth' (45 impr, pos 8.5, 0% CTR) is a CTR leak on a branded spec query — the page ranks well but earns no clicks, likely due to AIO suppression on a pure spec query.

*Evidence:* 'steelcase gesture seat depth' — 45 impr, pos 8.5, 0% CTR. Page total: 2 clicks, 880 impr, pos 7.5, 0.23% CTR.

*Fix:* Add a Direct Answer citation capsule at the top of the page (per 2026-08-13 decision: capsules are always in scope). Suggested capsule: 'The Steelcase Gesture seat depth adjusts from 15.75" to 18.75" — a 3" range controlled by a slider beneath the seat. Tall users at 6'4" typically use full extension (18.75").' This makes the page citable by AI Overviews rather than invisible to them.

**`dc65989fd486` /review/leap-plus/ — schema-invalid**

Product schema on /review/leap-plus/ is missing the 'itemReviewed' property in its associated Review schema node — a standing open issue from the May 27 audit that blocks rich result eligibility for all review pages.

*Evidence:* Schema wiki (last_updated 2026-05-27): 'itemReviewed missing on all 4 Review schema nodes — blocks rich results.' /review/leap-plus/ is one of the four affected. GSC: 38 clicks, 13,475 impr, pos 8.9 — the highest-traffic review page.

*Fix:* Add itemReviewed to the Review schema block: {"@type": "Review", "itemReviewed": {"@type": "Product", "name": "Steelcase Leap Plus", "@id": "https://tallchairadvisor.com/#product/steelcase-leap-plus"}, ...}. Also confirm Product @id is present (schema wiki notes it was missing on Leap Plus): add "@id": "https://tallchairadvisor.com/#product/steelcase-leap-plus" to the Product block.

**`bd852d016763` /review/aeron-size-c/ — schema-invalid**

Review schema on /review/aeron-size-c/ is missing 'itemReviewed' (blocks rich results) and Product schema is missing '@id' — both are standing open issues from the May 27 audit.

*Evidence:* Schema wiki: 'itemReviewed missing on all 4 Review schema nodes'; 'Product @id missing on Aeron Size C and Leap Plus'. GSC: 23 clicks, 4,836 impr, pos 11, CTR 0.48%.

*Fix:* Add to Review schema: "itemReviewed": {"@type": "Product", "name": "Herman Miller Aeron Size C", "@id": "https://tallchairadvisor.com/#product/herman-miller-aeron-size-c"}. Add to Product schema: "@id": "https://tallchairadvisor.com/#product/herman-miller-aeron-size-c". These are the same fixes required on /review/leap-plus/ — batch them.

**`7d502e933b53` /correct-chair-dimensions/ — schema-invalid**

HowTo schema on /correct-chair-dimensions/ is deprecated — Google removed HowTo from supported rich result types in September 2023. The block is dead markup consuming schema budget.

*Evidence:* Schema wiki (2026-05-27): 'HowTo schema on /correct-chair-dimensions/ is deprecated — Google removed HowTo from supported rich result types September 2023. Dead markup. Remove the block entirely.' Still listed as unresolved (CRITICAL in the wiki). GSC: 36 clicks, 19,446 impr, pos 9.6.

*Fix:* Remove the HowTo schema block entirely from /correct-chair-dimensions/. Replace with FAQPage schema if the page contains FAQ-style content, which would be eligible for rich results. This is a carried-over critical fix from May 27 — prioritise immediately.

**`012783b41f19` / — schema-invalid**

WebSite schema in index.astro is missing '@id', causing a dangling entity reference — WebPage.isPartOf references '#website' but the WebSite block has no @id to resolve against.

*Evidence:* Schema wiki (2026-05-27, CRITICAL, carried from May 10): 'WebSite @id missing in index.astro — WebPage.isPartOf references #website but WebSite block has no @id. Dangling entity reference.' Still listed as unresolved.

*Fix:* Add "@id": "https://tallchairadvisor.com/#website" to the WebSite schema block in index.astro. This is a one-line fix that has been open since May 10 — apply immediately.


### 🟡 MEDIUM

**`62d0f4cb97eb` /aeron-vs-gesture/ — internal-linking**

The comparison page does not link to /review/aeron-size-c/ or /chairs/herman-miller-aeron/tall-people/ — missing contextual internal links that would pass authority to buyer-intent review pages and give readers a clear next step.

*Evidence:* GSC for /aeron-vs-gesture/: 2 clicks, 429 impr, pos 8.7. /review/aeron-size-c/ is at pos 11 and needs authority. Wiki (2026-05-27) notes the comparison page has historically had CTA placement issues. No specific internal link audit data provided but the page is a natural hub for Aeron-side traffic.

*Fix:* Add contextual links from /aeron-vs-gesture/ to: (1) /review/aeron-size-c/ — anchor text 'full Aeron Size C review'; (2) /chairs/herman-miller-aeron/tall-people/ — anchor text 'Aeron tall-person fit analysis'; (3) /review/gesture/ — anchor text 'Gesture review (tested at 6'4")'. Place within the body comparison sections, not just a footer list.

**`e0e118743276` /pain-ergonomics/ — internal-linking**

Page ranks at pos 29.7 — well outside the top 10 — with 492 impressions and 1 click. No opportunity data suggests content depth is the constraint, but this page is also an orphan risk given its low position and the site's historical orphan problem.

*Evidence:* GSC: 1 click, 492 impr, pos 29.7, CTR 0.2%. Audit opportunity: [content-depth]. Decisions log 2026-08-08 noted /office-chair-return-policy/ was a true orphan with zero inbound links — this page may have the same problem.

*Fix:* Verify /pain-ergonomics/ has ≥3 inbound internal links from high-impression pages. If not, add contextual links from /knee-pain-seat-depth/, /back-pain-spine-height/, and /correct-chair-dimensions/ using anchor text variants of 'office chair pain for tall people' and 'ergonomic pain causes'. Then assess whether the content is comprehensive enough to merit its own URL or should be folded into a pillar.

**`268393cc75b8` /office-chairs-for-6-foot-3/ — affiliate-missing**

Height-specific landing pages are identified in the decisions log (2026-08-06) as 'highest-risk remainder' for Leap Plus spec corrections — these pages must also carry verified Amazon affiliate CTAs with tag=tallchairadvi-20 and the optional cylinder caveat for the Leap Plus recommendation.

*Evidence:* Decisions log 2026-08-06: 'The height-specific landing pages (office-chairs-for-6-foot-4 through -7) and chairs/steelcase-leap-plus/tall-people.astro are the highest-risk remainder' for spec and affiliate integrity. /office-chairs-for-6-foot-3/ GSC: 6 clicks, 717 impr, pos 7.6, CTR 0.84% — converting traffic exists.

*Fix:* Verify every Leap Plus Amazon link on this page: (1) uses ASIN B00TYE4QXU (the verified earner per decisions log 2026-07-25), (2) includes tag=tallchairadvi-20, (3) carries the caveat 'requires optional 5" cylinder (~$63 at order time) for users at 6'3"+ — standard cylinder reaches only 19.5"'. Apply the same check to /office-chairs-for-6-foot-4/, /office-chairs-for-6-foot-6/.


### ⚪ LOW

**`5c8d0d5e9574` /knee-pain-seat-depth/ — aio-suppression**

The page generates 41,072 impressions at pos 5.7 but only 0.04% CTR — a confirmed AIO suppression pattern on informational seat-depth queries. Per the Profit Audit directive, snippet rewrites cannot fix this; the only in-scope action is a citation capsule to feed the AI Overview surface.

*Evidence:* GSC: 15 clicks, 41,072 impr, pos 5.7, CTR 0.04%. Historical context: 'farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages)' is on the explicit stop list (decisions log 2026-07-24). The 2026-08-13 decision confirmed capsules remain in scope on informational pages.

*Fix:* Verify the Direct Answer / citation capsule block is present and well-formed (per 2026-08-08 GEO rollout — 44 content pages received capsules). If the capsule is present, no further action on this page's CTR is warranted. The email capture opt-in (ConvertKit + Seat Depth Checklist PDF) from thesis item #1 remains unbuilt and is the highest-ROI action on this page — file as a separate project task for Jackson.

## Held Back by the Current Strategy

These are real findings, recorded in `data/audit-findings.json` under `outOfStrategy` —
withheld from the planner by `data/strategy-rules.json`, not deleted. Edit that file to act on them.

- `8487e2472c50` **/aeron-vs-gesture/** — meta-quality (critical) — _no-ctr-iteration-below-position-8_
  Meta description uses first-person Gesture verdict ('At 6'4", the Gesture won') on a comparison page that Jackson has not personally tested the Aeron on — violating the site's voice policy that reserves first-person testing claims exclusively for /review/gesture/.
- `ef9fbd421bf3` **/correct-chair-dimensions/** — title-length (high) — _no-snippet-work-on-aio-eaten-informational_
  Page title is 73 characters, 13 characters over the 60-char maximum, causing truncation in SERPs.
- `5d47576a55b8` **/chairs/steelcase-gesture/weight-limit/** — ctr-leak (high) — _no-ctr-iteration-below-position-8_
  Three query clusters totalling 164 impressions at positions 9.1–10.2 earn zero clicks — a textbook CTR leak on an escapable editorial SERP.
- `c5a9b74a3b06` **/office-chairs-for-tall-people/** — meta-length (medium) — _no-ctr-iteration-below-position-8_
  Meta description is 158 characters, 3 characters over the 155-char maximum, risking SERP truncation.
- `2afb01154404` **/back-pain-spine-height/** — title-length (medium) — _no-ctr-iteration-below-position-8_
  Page title is 42 characters — significantly under the 50-char floor — leaving keyword capacity unused on a page with decent GSC position.
- `f0baa4b52fb4` **/best-office-chairs-under-500/** — title-length (medium) — _no-ctr-iteration-below-position-8_
  Page title is 45 characters, below the 50-char floor, leaving character budget unused on a high-converting money page (1.39% CTR).
- `64b6050a5f82` **/chairs/herman-miller-aeron/** — thin-content (medium) — _no-thin-content-expansion-during-content-freeze_
  Page ranks at position 20.4 with 507 impressions and zero clicks — the audit opportunity tag flags 'content too thin or lacks E-E-A-T signals' and the page competes directly with /chairs/herman-miller-aeron/tall-people/ (pos 8.2, 1.24% CTR) for the same top queries.

## Week's Recommended Focus

1. 1. VOICE + SCHEMA on /aeron-vs-gesture/: Remove first-person Gesture verdict from meta description and schema headline — this is a policy violation on a page Jackson has not personally tested. Rewrite meta to research voice (154 chars provided above) and fix schema headline. Simultaneously add itemReviewed to Review schema on /review/leap-plus/ and /review/aeron-size-c/ — these are the two highest-traffic review pages and rich result eligibility is blocked site-wide until this is resolved. All three fixes are deterministic and can ship in one Thursday execute-fixes run.
2. 2. SCHEMA CRITICAL CARRIES: Fix the WebSite @id in index.astro (one-line addition, open since May 10) and remove the deprecated HowTo schema block from /correct-chair-dimensions/ (open since May 27). Both are deterministic defects with no cooldown concern — they should have shipped weeks ago. Also shorten /correct-chair-dimensions/ title from 73 to ≤60 chars in the same commit.
3. 3. SPEC INTEGRITY SWEEP on height-specific pages: Verify /chairs/steelcase-leap-plus/seat-height/ body copy contains no spliced 15.5"–22.5" figures (standard + optional cylinder minimums mixed). Simultaneously audit /office-chairs-for-6-foot-3/, /office-chairs-for-6-foot-4/, and /office-chairs-for-6-foot-6/ to confirm Leap Plus affiliate links use ASIN B00TYE4QXU with tag=tallchairadvi-20 and include the optional cylinder caveat — these are the pages a buyer at exactly the relevant height lands on.

## Pages Not Needing Action

- /review/gesture/ — title (58 chars), meta (146 chars), and schema are all within spec. The 2026-08-09 rewrite is the active CTR test; no further action until next GSC readout. AIO suppression is not confirmed on this editorial SERP.
- /office-chairs-for-6-foot-4/ — title (47 chars, borderline low but within tolerance), meta (146 chars) correctly states the optional cylinder caveat. No schema issues visible.
- /office-chairs-for-6-foot-6/ — title and meta are within spec. The optional cylinder caveat is correctly stated in meta. CTR 2.44% is the highest on the site — page is performing well.
- /chairs/steelcase-gesture/ — title (54 chars), meta (154 chars) within spec. Schema and canonical are clean.
- /chairs/steelcase-gesture/seat-depth/ — title (49 chars) and meta (151 chars) are within spec. CTR leak finding is filed separately as aio-suppression; no additional on-page defects.
- /gesture-vs-leap-plus/ — title (52 chars), meta (149 chars), canonical all clean. No schema anomalies in the truncated data.
- /chairs/herman-miller-aeron/tall-people/ — title (52 chars), meta (131 chars, borderline low but above 130-char floor), CTR 1.24% is healthy for a sub-page.
- /back-pain-spine-height/ — meta (132 chars) is within the 130–155 range. Title is filed as a separate finding. No other defects visible.
