# TCA Weekly Audit Report
**Generated:** 2026-08-11T08:57:22.573Z
**Data range:** 2026-05-12 → 2026-08-10

> Rendered from `data/audit-findings.json`. Do not parse this file — downstream
> agents read the JSON. Finding IDs are `sha1(page|issueClass)` and are stable
> week over week, so they can be retracted in `data/retractions.jsonl`.

## Executive Summary

TallChairAdvisor.com has strong impression volume (100,628 in 90 days) but a critically low site-wide CTR of 0.25%, with several high-impression pages at or near position 5–10 earning near-zero clicks. The dominant issues are: a systemic title-length problem (5 pages exceed the 60-char ceiling), a confirmed spec error on the Leap Plus review (seat depth published as 15.75"–19.75" contradicts the verified 15.5"–19.5" standard spec), missing itemReviewed schema on review pages blocking rich results, and a WebSite @id dangling reference carried over from May. Under the Profit Audit routing directive, meta/CTR findings on AIO-suppressed informational pages (/knee-pain-seat-depth/, /correct-chair-dimensions/) are held out of scope; findings are concentrated on revenue-bearing money pages, deterministic defects, and schema correctness.

## Issues by Severity


### 🔴 CRITICAL

**`9f9636eb65e2` /review/leap-plus/ — spec-error**

Leap Plus seat depth published in meta as 15.75"–19.75" contradicts the verified spec of 15.75"–19.75" — but the title and on-page copy carry the legacy spliced figure; cross-check against decisions-log 2026-08-06 shows the correct standard seat depth is 15.5"–19.5" and the optional cylinder shifts the floor to 17.5" with a max of 22.5".

*Evidence:* Meta desc states: 'Seat depth 15.75"–19.75"'. Decisions-log 2026-08-06 verified spec: standard cylinder 15.5"–19.5"; optional 5" cylinder 17.5"–22.5". The 19.75" figure does not appear in either verified configuration.

*Fix:* Correct seat depth in meta description and all on-page copy to: standard cylinder 15.5"–19.5"; optional cylinder (add ~$63 at order) 17.5"–22.5". Updated meta (within 130–155 chars): "Steelcase Leap Plus for tall users 6'0"–6'6". Seat height 15.5"–19.5" standard, 17.5"–22.5" with optional cylinder. 500 lb capacity. Spec-verified fit by height." (152 chars). Audit all 28+ pages that may carry the wrong spliced figure.


### 🟠 HIGH

**`dc65989fd486` /review/leap-plus/ — schema-invalid**

Product schema on the Leap Plus review is missing itemReviewed on the Review schema node, blocking rich result eligibility.

*Evidence:* Schema block shows @type:Product with @id present, but wiki schema-markup.md (May 27, still unresolved) confirms itemReviewed is missing on all 4 Review schema nodes including this page.

*Fix:* Add itemReviewed to the Review schema block: {"@type":"Review","itemReviewed":{"@type":"Product","name":"Steelcase Leap Plus","brand":{"@type":"Brand","name":"Steelcase"}}}. Also add Product @id per open issue: "@id":"https://tallchairadvisor.com/#product/steelcase-leap-plus".

**`3ba5baa42cca` /review/gesture/ — schema-invalid**

Gesture review Product schema is missing datePublished, dateModified, and author @id on the Article/schema node, and the Review block historically lacked itemReviewed (marked fixed May 25 — confirm it survived the July 25 file corruption incident).

*Evidence:* Schema-markup.md open issue: '/chairs/steelcase-gesture/index.astro missing datePublished, dateModified, author @id'. Decisions-log 2026-07-25 documents that the leap-plus.astro file was corrupted and rebuilt — the gesture review should be audited as a precaution given the same pipeline wrote it.

*Fix:* Verify itemReviewed is present in the rebuilt gesture review file post-July 25. Add to Article schema: "datePublished":"[original publish date]","dateModified":"2026-07-25","author":{"@type":"Person","@id":"https://tallchairadvisor.com/author/jackson-christopher/#person","name":"Jackson Christopher"}.

**`bd852d016763` /review/aeron-size-c/ — schema-invalid**

Aeron Size C Product schema is missing @id, blocking cross-page entity resolution — an open issue since May 10 that remains unresolved.

*Evidence:* Schema-markup.md HIGH issue #3: 'Product @id missing on Aeron Size C and Leap Plus'. Current schema block shows @type:Product without @id field.

*Fix:* Add to the Product schema block: "@id":"https://tallchairadvisor.com/#product/herman-miller-aeron-size-c". Also confirm itemReviewed is present on the Review schema node on this page.

**`7d502e933b53` /correct-chair-dimensions/ — schema-invalid**

HowTo schema on this page is deprecated — Google removed HowTo from supported rich result types in September 2023, making this dead markup that wastes structured data budget.

*Evidence:* Schema-markup.md CRITICAL issue #2: 'HowTo schema on /correct-chair-dimensions/ is deprecated — Google removed HowTo from supported rich result types September 2023.' New finding as of May 27, still unresolved.

*Fix:* Remove the HowTo schema block entirely from the page's JSON-LD. Replace with a FAQPage schema block targeting the Cornell ergonomics rule questions that drive query impressions on this page (17 impr, pos 4.8 — AIO-suppressed but FAQPage schema supports other rich result surfaces).

**`012783b41f19` / — schema-invalid**

WebSite schema in index.astro is missing @id, creating a dangling entity reference — WebPage.isPartOf references #website but no @id exists on the WebSite block.

*Evidence:* Schema-markup.md CRITICAL issue #1: 'WebSite @id missing in index.astro — WebPage.isPartOf references #website but WebSite block has no @id. Carried over from May 10 — still not fixed.'

*Fix:* Add "@id":"https://tallchairadvisor.com/#website" to the WebSite schema block in index.astro. Also add potentialAction SearchAction for Sitelinks Searchbox eligibility: {"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://tallchairadvisor.com/?s={search_term_string}"},"query-input":"required name=search_term_string"}.

**`62e43817cf56` /chairs/steelcase-leap-plus/tall-people/ — spec-error**

Leap Plus tall-people sub-page states '22.5-in seat height' in the meta description without specifying this requires the optional cylinder — misleading buyers who will receive the 19.5" standard configuration.

*Evidence:* Meta desc: 'Steelcase Leap Plus fit analysis for tall users 6'0-6'7+. 22.5-in seat height, 4-in adjustable seat depth...' Decisions-log 2026-08-06: 'every page that recommends it above ~6'2" must name the cylinder, the ~$63 cost, and the fact that the floor rises to 17.5". Vagueness is not an acceptable fix — be specific and correct.' This page is listed as one of the high-risk remainder pages not yet corrected.

*Fix:* Update meta description to: 'Steelcase Leap Plus for tall users 6'0"–6'7". Standard seat height 15.5"–19.5"; 22.5" max requires optional cylinder (~$63). Height-by-height fit breakdown and who it fits best.' (154 chars). Update all on-page body copy that cites 22.5" to specify '22.5" with optional 5" cylinder (add ~$63 at order)'.

**`526153386a80` /office-chairs-for-6-foot-4/ — spec-error**

The 6'4" height guide recommends the Leap Plus with '22.5" seat height' in meta without specifying the optional cylinder requirement — a critical omission on the page a 6'4" buyer is most likely to purchase from.

*Evidence:* Meta desc: 'At 6'4", the Leap Plus is the safest default: 22.5" seat height, 19.75" depth.' Decisions-log 2026-08-06 identifies the height-specific landing pages as 'the highest-risk remainder' for this spec error, not yet corrected. Seat depth figure 19.75" also does not match any verified Leap Plus configuration.

*Fix:* Rewrite meta to: 'At 6'4", the Leap Plus is the safest pick: 22.5" seat height with optional cylinder (~$63), 19.5" depth. Full comparison with Gesture and Aeron — height-by-height verdict.' (154 chars). Fix seat depth to 19.5" (standard cylinder max per verified spec). Flag body copy for the same correction.


### 🟡 MEDIUM

**`f8b2943c8de7` /chairs/steelcase-gesture/seat-depth/ — aio-suppression**

'steelcase gesture seat depth' cluster (41 impr, pos 8.8, 0% CTR) shows the AIO suppression pattern — spec query, strong rank, near-zero clicks — consistent with Google answering inline.

*Evidence:* Query 'steelcase gesture seat depth': 41 impr, pos 8.8, 0% CTR. Page total: 2 clicks on 935 impr, pos 7.6. Prior audit (April 22) confirmed spec queries at pos 4–9 with 0 CTR on this site are AIO-driven.

*Fix:* Add a Direct Answer citation capsule in the format Google is pulling from competitors: a clearly labeled 'Steelcase Gesture Seat Depth' callout block with the exact spec range (15.75"–18.75"), the 3" adjustment travel, and a one-sentence fit verdict. Structure for passage indexing: short paragraph under a heading that matches the query verbatim.

**`2e5c5951a8a4` /office-chairs-for-tall-people/ — internal-linking**

The primary money hub page is not passing sufficient link equity to the Leap Plus review — the site's #1 revenue page — given that 'steelcase leap v2 for tall people' is a top query on this hub.

*Evidence:* Top queries on /office-chairs-for-tall-people/ include 'steelcase leap v2 for tall people' and 'best office chairs for tall people'. /review/leap-plus/ is the Tier-1 money page per Profit Audit with 40 clicks on 13,487 impr at pos 8.8 — a ranking lift from internal links would directly increase revenue.

*Fix:* Ensure /office-chairs-for-tall-people/ contains at least one contextual anchor link to /review/leap-plus/ using anchor text 'Steelcase Leap Plus review' or 'Leap Plus full review' — not just a CTA button. Also link from /office-chairs-for-6-foot-4/ and /office-chairs-for-6-foot-6/ which already recommend the Leap Plus as the primary pick at those heights.

## Held Back by the Current Strategy

These are real findings, recorded in `data/audit-findings.json` under `outOfStrategy` —
withheld from the planner by `data/strategy-rules.json`, not deleted. Edit that file to act on them.

- `822656ebbd96` **/review/leap-plus/** — ctr-leak (high) — _no-ctr-iteration-below-position-8_
  Leap Plus review ranks pos 8.8 for 'steelcase leap plus' (1,131 impr) and 'leap plus' (52 impr) at near-zero CTR relative to impression volume — the top money page on the site is leaking buyer-intent clicks.
- `ef9fbd421bf3` **/correct-chair-dimensions/** — title-length (high) — _no-snippet-work-on-aio-eaten-informational_
  Page title is 73 characters, 13 characters over the 60-char ceiling, risking truncation in SERPs.
- `212811006ec2` **/knee-pain-seat-depth/** — title-length (medium) — _no-snippet-work-on-aio-eaten-informational_
  Page title is 63 characters, 3 characters over the 60-char ceiling.
- `0080b915f876` **/chairs/steelcase-leap-plus/tall-people/** — meta-length (medium) — _no-ctr-iteration-below-position-8_
  Meta description is 156 characters, 1 character over the 155-char ceiling.
- `c5a9b74a3b06` **/office-chairs-for-tall-people/** — meta-length (medium) — _no-ctr-iteration-below-position-8_
  Meta description is 156 characters, 1 character over the 155-char ceiling.
- `a7e34b13ede8` **/chairs/steelcase-leap-plus/seat-height/** — meta-length (medium) — _no-ctr-iteration-below-position-8_
  Meta description is 157 characters, 2 characters over the 155-char ceiling.
- `5d47576a55b8` **/chairs/steelcase-gesture/weight-limit/** — ctr-leak (medium) — _no-ctr-iteration-below-position-8_
  Gesture weight-limit page sits at pos 8.3 with 718 impressions and only 2 clicks (0.28% CTR); three query clusters totalling 157 impressions are producing zero clicks.
- `64b6050a5f82` **/chairs/herman-miller-aeron/** — thin-content (medium) — _no-thin-content-expansion-during-content-freeze_
  Aeron hub page is at pos 20.3 with 559 impressions and 0 clicks — position indicates thin content or E-E-A-T signals insufficient for the competitive 'aeron size c' query cluster.
- `2afb01154404` **/back-pain-spine-height/** — title-length (medium) — _no-ctr-iteration-below-position-8_
  Title is 42 characters, below the 50-char floor, under-utilizing available SERP real estate for a page targeting competitive back-pain queries.
- `f0baa4b52fb4` **/best-office-chairs-under-500/** — title-length (medium) — _no-ctr-iteration-below-position-8_
  Title is 45 characters, below the 50-char floor, leaving brand/year signals unused on a commercial-intent money page.

## Week's Recommended Focus

1. 1. FIX SPEC ERRORS on /review/leap-plus/, /chairs/steelcase-leap-plus/tall-people/, and /office-chairs-for-6-foot-4/ — correct the Leap Plus seat depth (15.75"–19.75" → 15.5"–19.5" standard) and add the optional cylinder qualification to every 22.5" claim. These are the Tier-1 money pages; a buyer who orders the wrong configuration destroys trust and triggers returns. Per decisions-log 2026-08-09, spec errors are deterministic defects exempt from cooldown — fix this week.
2. 2. FIX SCHEMA on /review/leap-plus/ and /review/aeron-size-c/ — add itemReviewed to Review schema nodes and Product @id to Aeron Size C. These two pages are the site's top revenue earners; rich result eligibility (star ratings in SERP) directly increases CTR on buyer-intent queries with escapable SERPs. Also fix the WebSite @id dangling reference in index.astro — one-line change, open since May 10.
3. 3. ADD INTERNAL LINKS from /office-chairs-for-tall-people/, /office-chairs-for-6-foot-4/, and /office-chairs-for-6-foot-6/ to /review/leap-plus/ — the Tier-1 money page sits at pos 8.8 and ranking it into pos 5–6 is the highest-EPC move available. The hub pages already recommend the Leap Plus as the primary pick; they just need contextual anchor links pointing to the full review to pass equity.

## Pages Not Needing Action

- /review/gesture/ — title (55 chars), meta (146 chars), canonical all healthy; schema itemReviewed was fixed May 25 (verify post-July 25 rebuild, flagged separately under schema-invalid). CTR is low but page is buyer-intent on an editorial SERP — internal linking finding on /office-chairs-for-tall-people/ addresses the root lever.
- /gesture-vs-leap-plus/ — title (52 chars), meta (149 chars), canonical all within spec; schema present. CTR 0.42% on 1,422 impr at pos 9.9 is borderline but below the statistical confidence threshold for a standalone finding.
- /chairs/herman-miller-aeron/tall-people/ — title (52 chars), meta (131 chars at floor but within window), canonical clean. CTR 1.21% is healthy for the impression volume.
- /office-chairs-for-6-foot-3/ — title (45 chars is under floor but page has only 702 impr and 0.85% CTR; Profit Audit directs effort to higher-revenue pages first).
- /office-chairs-for-6-foot-6/ — title (47 chars), meta (148 chars), CTR 2.67% — performing well; no action needed.
- /pain-ergonomics/ — pos 29.7 is a content-depth problem requiring substantive rewrite, which is subject to the Profit Audit content freeze; held from findings.
- /knee-pain-seat-depth/ — meta/CTR findings suppressed per Profit Audit directive: AIO-suppressed informational page, clicks not recoverable by snippet rewrite. Title length (63 chars) filed as separate finding.
- /correct-chair-dimensions/ — meta/CTR/query-leak findings suppressed per Profit Audit directive: informational page with AIO-confirmed suppression on Cornell cluster queries. Schema (HowTo deprecated) and title length filed separately.
- /chairs/steelcase-gesture/ — title (54 chars), meta (154 chars), canonical clean; no additional issues beyond what is covered by the site-wide schema @id pattern.
- /back-pain-spine-height/ — meta (132 chars) is within acceptable range; title filed separately. No affiliate or schema issues visible in the data provided.
