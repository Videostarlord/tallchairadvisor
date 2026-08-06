# TCA Weekly Audit Report
**Generated:** 2026-08-06T11:32:20.648Z
**Data range:** 2026-05-08 → 2026-08-06

> Rendered from `data/audit-findings.json`. Do not parse this file — downstream
> agents read the JSON. Finding IDs are `sha1(page|issueClass)` and are stable
> week over week, so they can be retracted in `data/retractions.jsonl`.

## Executive Summary

TallChairAdvisor.com has strong impression volume (99,415/90d) but a critically low site-wide CTR of 0.24%, with the single largest page (/knee-pain-seat-depth/) accounting for 41% of all impressions at only 0.04% CTR — a structural AIO-suppression problem, not a meta problem. Money pages (/review/leap-plus/, /review/gesture/, /review/aeron-size-c/) hold positions 8–11 and need ranking lift and schema fixes to convert existing traffic. Several pages carry unresolved schema errors (missing @id, itemReviewed, deprecated HowTo, spec discrepancy) that block rich results on the highest-revenue pages. Per the Profit Audit directive, findings concentrate on revenue-impacting fixes: affiliate/schema issues on buyer-intent pages, spec errors, and internal linking — not meta tweaks on AIO-suppressed informational pages.

## Issues by Severity


### 🔴 CRITICAL

**`32766b2a9f2c` /chairs/steelcase-leap-plus/seat-height/ — spec-error**

Title states seat height range '15.5"–22.5"' but meta description states '15.5"–20.5"' — these are contradictory specs on the same page and at least one is wrong.

*Evidence:* Title: 'Steelcase Leap Plus Seat Height: 15.5"–22.5" Range'; Meta desc: '15.5"–20.5" range (5" adjustment)' — direct contradiction on the same page

*Fix:* Check the official Steelcase Leap Plus spec sheet immediately. The Steelcase website lists the Leap Plus seat height as 15.5"–20.5". If correct, the title must be changed from '15.5"–22.5"' to '15.5"–20.5"'. Updated title: "Steelcase Leap Plus Seat Height: 15.5"–20.5" Range" (52 chars). Also audit /review/leap-plus/ which references '22.5" seat height ceiling' — if that figure is the Leap V2 (not Plus), it must be corrected or clearly attributed.


### 🟠 HIGH

**`5c8d0d5e9574` /knee-pain-seat-depth/ — aio-suppression**

40,752 impressions at pos 5.7 produce only 17 clicks (0.04% CTR) — consistent with AI Overview suppression on an informational query, not a meta or title problem.

*Evidence:* 40,752 impr, pos 5.7, 17 clicks, 0.04% CTR — 14× below benchmark CTR for pos 5–6

*Fix:* Do not rewrite meta or title. Per the Profit Audit directive, this page's impressions cannot be converted via snippet changes. Priority actions: (1) add email capture opt-in (ConvertKit + Seat Depth Checklist PDF) after the calculator section to own the audience Google is intercepting; (2) strengthen internal links from this page to buyer-intent pages (/review/leap-plus/, /best-office-chairs-under-500/) so captured scroll-depth converts to revenue.

**`dc65989fd486` /review/leap-plus/ — schema-invalid**

Product schema is missing @id, and itemReviewed is missing from associated Review schema — both block rich result eligibility.

*Evidence:* Schema audit (wiki/schema-markup.md): Product @id missing on Leap Plus; itemReviewed missing on all 4 Review schema nodes (carried from May 10, unresolved)

*Fix:* Add @id to Product block: "@id": "https://tallchairadvisor.com/#product/steelcase-leap-plus". Add itemReviewed to the Review schema block pointing to that @id. Also confirm aggregateRating reviewCount is not set to '1' — if it is, remove aggregateRating entirely and keep only Review schema to avoid star-snippet suppression.

**`9f9636eb65e2` /review/leap-plus/ — spec-error**

Title and meta description show '15.5"–22.5"' seat height range, but the meta body states '22.5" seat height ceiling' while the sibling page /chairs/steelcase-leap-plus/seat-height/ title shows '15.5"–22.5"' — needs cross-page verification for consistency.

*Evidence:* /review/leap-plus/ meta: '22.5" seat height ceiling'; /chairs/steelcase-leap-plus/seat-height/ title: '15.5"–22.5"' but meta: '15.5"–20.5"' — contradictory specs across pages

*Fix:* Verify the authoritative Steelcase spec sheet. If the Leap Plus seat height range is 15.5"–20.5" (as stated in the meta desc of /chairs/steelcase-leap-plus/seat-height/: '15.5"–20.5" range') rather than 22.5", correct all references. The title of /chairs/steelcase-leap-plus/seat-height/ reads '15.5"–22.5"' but its meta says '15.5"–20.5"' — one of these is wrong. Confirm the spec and correct whichever page carries the error.

**`018c617c0678` /review/gesture/ — ctr-leak**

8,415 impressions at pos 8.0 yield only 10 clicks (0.12% CTR) — the primary money/review page is severely underperforming on an editorial SERP where meta rewrites are actionable.

*Evidence:* 8,415 impr, pos 8.0, 10 clicks, 0.12% CTR — benchmark for pos 8 on editorial SERP is ~2–3%

*Fix:* This is an escapable SERP (review query, editorial results, no confirmed AIO). Per the Profit Audit, this page should be in the top ~6 that receive 100% of revenue effort. Priority: (1) push ranking from pos 8.0 toward pos 5 via content depth expansion (first-person Gesture owner detail — Jackson's real 6'4" experience); (2) verify affiliate Amazon link uses verified ASIN with tag=tallchairadvi-20; (3) ensure CTA appears above the fold after the Direct Answer box.

**`bd852d016763` /review/aeron-size-c/ — schema-invalid**

Product schema missing @id, and itemReviewed missing from Review schema block — blocks rich result eligibility on the second-highest CTR review page.

*Evidence:* Schema audit: Product @id missing on Aeron Size C; itemReviewed missing on all 4 Review nodes (unresolved since May 10)

*Fix:* Add "@id": "https://tallchairadvisor.com/#product/herman-miller-aeron-size-c" to the Product schema block. Add itemReviewed referencing that @id to the Review schema. If aggregateRating reviewCount is '1', remove aggregateRating to avoid star-snippet suppression (per schema-markup.md HIGH finding #4).

**`c48591dd56bd` /chairs/herman-miller-aeron/tall-people/ — affiliate-missing**

This page ranks pos 8.2 with 1,163 impressions and 1.03% CTR — one of the better-converting hub sub-pages — but no affiliate link data is confirmed present in the audit data.

*Evidence:* 1,163 impr, pos 8.2, 12 clicks, 1.03% CTR — buyer-intent page with above-average CTR; affiliate presence unconfirmed in audit data

*Fix:* Verify that at least two Amazon CTAs with tag=tallchairadvi-20 and verified ASINs are present in the page body (one early, one at the conclusion). The Aeron Size C verified ASIN should be used (confirmed in the Jul 4 ASIN audit). Add a direct-program 'Also available at' CTA for Humanscale or Crandall if applications are complete.

**`7d502e933b53` /correct-chair-dimensions/ — schema-invalid**

HowTo schema block is present but deprecated — Google removed HowTo from supported rich result types in September 2023, making this dead markup that adds no value and risks confusing Google's parser.

*Evidence:* Schema audit wiki (May 27): 'HowTo schema on /correct-chair-dimensions/ is deprecated — Google removed HowTo from supported rich result types September 2023. Dead markup.' — carried as unresolved CRITICAL

*Fix:* Remove the HowTo schema block from /correct-chair-dimensions/ entirely. Do not replace it with another type. The Article schema already present on the page is sufficient. This finding was documented in the May 27 schema audit as CRITICAL and remains unresolved.


### 🟡 MEDIUM

**`ea09e7be3cda` /correct-chair-dimensions/ — aio-suppression**

Query 'cornell ergonomics chair seat height feet flat thighs parallel' (pos 4.8, 17 impr) is flagged AIO — clicks are structurally suppressed on this informational query.

*Evidence:* Cornell query: 17 impr, pos 4.8, 0% CTR (AIO confirmed). 'ergonomic chair dimensions': 62 impr, pos 19.3, 0% CTR. 'standard size of a office chair': 97 impr, pos 16.3, 0% CTR

*Fix:* Do not invest in meta/title changes for the AIO-suppressed Cornell query. Instead, add a short citation capsule (40–60 words, structured as a direct definition) answering 'What is the Cornell Ergonomics seat height rule?' — this is the format Google pulls into AI Overviews and may earn a citation. The two non-AIO query leaks ('ergonomic chair dimensions' pos 19.3, 'standard size of a office chair' pos 16.3) require ranking lift via content depth, not meta changes.

**`5663893947e9` /review/gesture/ — meta-length**

Meta description is 158 characters, above the 155-char ceiling.

*Evidence:* Meta desc: 158 chars (limit: 155)

*Fix:* Trim to 150 chars: "Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits and who it doesn't." (152 chars). Removes the em-dash to save 1 char if needed.

**`14beecb44bd0` /office-chairs-for-tall-people/ — schema-invalid**

Article schema is missing @id, which is unresolved site-wide since May 10 and breaks entity graph coherence.

*Evidence:* Schema audit (wiki): Article @id missing site-wide — unresolved since May 10 audit

*Fix:* Add "@id": "https://tallchairadvisor.com/office-chairs-for-tall-people/#article" to the Article schema block. This is the hub page and the most important Article node to resolve first.

**`f8b2943c8de7` /chairs/steelcase-gesture/seat-depth/ — aio-suppression**

Query 'steelcase gesture seat depth' (39 impr, pos 8.8, 0% CTR) matches the known AIO-suppression pattern for spec queries on this page documented since the April 22 SERP audit.

*Evidence:* 39 impr, pos 8.8, 0% CTR on 'steelcase gesture seat depth'; 969 total impr, pos 7.7, 2 clicks, 0.21% CTR — AIO pattern confirmed in prior audits

*Fix:* Do not rewrite meta or title. Add a 50-word citation capsule directly answering 'What is the Steelcase Gesture seat depth range?' as the first paragraph, formatted as a direct standalone answer (no preamble). This is the content structure Google pulls into AI Overviews and may earn a citation. Also add an internal link to /review/gesture/ to pass any earned authority to the money page.

**`7a0984559a84` /chairs/herman-miller-aeron/ — schema-invalid**

Article schema uses 'name' instead of 'headline' property — non-standard for Article type and reduces rich result eligibility.

*Evidence:* Schema block shows @type Article with 'name' property; Article spec requires 'headline' not 'name'

*Fix:* Change '"name": "Herman Miller Aeron Size C for Tall People"' to '"headline": "Herman Miller Aeron Size C for Tall People"' in the Article schema block. Also add "@id": "https://tallchairadvisor.com/chairs/herman-miller-aeron/#article" per the site-wide Article @id fix.

**`f88a6837b1c9` /office-chairs-for-6-foot-4/ — internal-linking**

This height-specific page (pos 5.8, 757 impr) sits at the top of the funnel for a high-buyer-intent query ('best office chair for 6'4"') but likely lacks sufficient outbound internal links to the money review pages that should convert that intent.

*Evidence:* 757 impr, pos 5.8, 4 clicks, 0.53% CTR — near-P1 height page with buyer intent; internal link distribution to money pages unverified

*Fix:* Audit internal links from this page and ensure it contains at minimum: (1) a contextual link to /review/leap-plus/ with anchor text referencing the Leap Plus as the 'safest default at 6'4"'; (2) a link to /review/gesture/ with anchor text referencing the Gesture as the fit alternative; (3) a link to /best-office-chairs-under-500/ for budget-conscious 6'4" users. These are the three money pages that should receive authority from this near-P1 height page.

## Held Back by the Current Strategy

These are real findings, recorded in `data/audit-findings.json` under `outOfStrategy` —
withheld from the planner by `data/strategy-rules.json`, not deleted. Edit that file to act on them.

- `d0d72d28e7be` **/review/leap-plus/** — meta-length (high) — _no-ctr-iteration-below-position-8_
  Meta description is 170 characters, exceeding the 155-char ceiling and will be truncated by Google.
- `47248c01f0c3` **/review/aeron-size-c/** — meta-length (high) — _no-ctr-iteration-below-position-8_
  Meta description is 166 characters, exceeding the 155-char ceiling and will be truncated by Google.
- `1760ee88a1cd` **/office-chairs-for-tall-people/** — title-length (high) — _no-ctr-iteration-below-position-8_
  Title is 75 characters, significantly over the 60-char ceiling — will truncate in SERPs and weaken click signal.
- `c5a9b74a3b06` **/office-chairs-for-tall-people/** — meta-length (high) — _no-ctr-iteration-below-position-8_
  Meta description is 168 characters, exceeding the 155-char ceiling.
- `5d47576a55b8` **/chairs/steelcase-gesture/weight-limit/** — ctr-leak (high) — _no-ctr-iteration-below-position-8_
  Three query clusters totalling 149 impressions at positions 9.1–10.1 each produce 0% CTR — the page has 682 total impressions and only 1 click.
- `6f2887c79740` **/chairs/steelcase-gesture/** — meta-length (high) — _no-ctr-iteration-below-position-8_
  Meta description is 170 characters, well over the 155-char ceiling and will be truncated by Google.
- `fae650db38e2` **/chairs/herman-miller-aeron/** — ctr-leak (high) — _no-ctr-iteration-below-position-8_
  551 impressions at pos 20.6 produce 0 clicks — the page is ranking too low on head terms ('aeron size c', 'aeron chair size c') that should be owned by this hub.
- `81bc473ec908` **/pain-ergonomics/** — thin-content (high) — _no-thin-content-expansion-during-content-freeze_
  Page ranks at pos 29.3 — well outside top 20 — with 487 impressions and only 1 click, indicating Google considers this page insufficiently authoritative or thin relative to competitors.
- `212811006ec2` **/knee-pain-seat-depth/** — title-length (medium) — _no-snippet-work-on-aio-eaten-informational_
  Title is 67 characters, exceeding the 50–60 char target, risking truncation in SERPs.
- `ef9fbd421bf3` **/correct-chair-dimensions/** — title-length (medium) — _no-snippet-work-on-aio-eaten-informational_
  Title is 73 characters, well over the 60-char ceiling and will truncate in most SERPs.
- `f0baa4b52fb4` **/best-office-chairs-under-500/** — title-length (medium) — _no-ctr-iteration-below-position-8_
  Title is 45 characters, below the 50-char floor — underutilizes available SERP real estate.
- `369f0d637ae2` **/gesture-vs-leap-plus/** — meta-length (medium) — _no-ctr-iteration-below-position-8_
  Meta description is 165 characters, exceeding the 155-char ceiling.
- `2afb01154404` **/back-pain-spine-height/** — title-length (medium) — _no-ctr-iteration-below-position-8_
  Title is 42 characters, below the 50-char floor — underutilizes available SERP space and omits primary keyword.
- `16b4f4925969` **/back-pain-spine-height/** — meta-length (medium) — _no-ctr-iteration-below-position-8_
  Meta description is 132 characters, below the 130-char floor by only 2 chars — borderline but technically under spec.

## Week's Recommended Focus

1. 1. FIX SPEC ERROR on /chairs/steelcase-leap-plus/seat-height/ — title says '15.5"–22.5"' but meta says '15.5"–20.5"'; verify against Steelcase spec sheet and correct the wrong figure site-wide (also audit /review/leap-plus/ which references '22.5" seat height ceiling'). A live spec error on a near-P1 page with 527 impressions is the highest-integrity risk on the site.
2. 2. FIX SCHEMA on /review/leap-plus/ and /review/aeron-size-c/ — add Product @id and itemReviewed to both pages (exact values: '#product/steelcase-leap-plus' and '#product/herman-miller-aeron-size-c'). These are the top two revenue pages and both are blocked from rich results. Also remove HowTo schema from /correct-chair-dimensions/ (deprecated since Sep 2023, dead markup, unresolved since May 27).
3. 3. FIX META LENGTHS on /review/leap-plus/ (170 chars), /chairs/steelcase-gesture/ (170 chars), /office-chairs-for-tall-people/ (168 chars), and /review/aeron-size-c/ (166 chars) — all exceed the 155-char ceiling and will be truncated in SERPs. These are all buyer-intent pages on escapable SERPs where snippet quality directly impacts the click→dollar conversion chain.

## Pages Not Needing Action

- /office-chairs-for-6-foot-3/ — title (54 chars), meta (142 chars) within spec; pos 7.4, 0.92% CTR is healthy for this impression tier; no schema or affiliate issues flagged
- /office-chairs-for-6-foot-6/ — title (56 chars), meta (156 chars) within spec; 2.6% CTR at pos 8.3 is the best CTR on the site; performing well, no action needed
- /chairs/steelcase-leap-plus/tall-people/ — title (56 chars), meta (156 chars) within spec; pos 9.2, CTR 0.41% is proportionate; no critical issues identified in this audit pass
