# Weekly Plan — 2026-08-12

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] FIX: /review/leap-plus/ | Correct seat depth spec throughout: replace all instances of "15.75"–19.75"" with the verified figures — standard cylinder 15.5"–19.5", optional 5" cylinder 17.5"–22.5" (~$63 at order time); update meta description to remove the 19.75" figure entirely; ensure every seat-depth mention in body copy states which configuration applies | Deterministic spec error — the 19.75" figure appears in neither verified Steelcase configuration; qualifies as a factual defect that bypasses cooldown regardless of recent edits; decisions-log 2026-08-06 is the authoritative corrected spec | FILE: src/pages/review/leap-plus.astro

- [ ] FIX: /review/leap-plus/ | Add itemReviewed node to the Review schema block: `"itemReviewed": { "@type": "Product", "name": "Steelcase Leap Plus", "@id": "https://tallchairadvisor.com/chairs/steelcase-leap-plus/#product" }` | Deterministic schema defect — missing itemReviewed blocks rich result eligibility on the site's #1 money page; schema-markup.md confirms this is unresolved since May 27; no cooldown applies to schema fixes | FILE: src/pages/review/leap-plus.astro

- [ ] FIX: /review/aeron-size-c/ | Add `"@id": "https://tallchairadvisor.com/review/aeron-size-c/#product"` to the Product schema block | Deterministic schema defect — Product @id missing since May 10 per schema-markup.md HIGH issue #3; blocks cross-page entity resolution; no cooldown applies to schema fixes | FILE: src/pages/review/aeron-size-c.astro

- [ ] FIX: /correct-chair-dimensions/ | Remove HowTo schema block entirely; replace with FAQPage schema reusing the existing FAQ questions already on the page | Deterministic schema defect — HowTo was removed from Google's supported rich result types in September 2023; dead markup wastes structured data budget; FAQPage is the correct replacement for a Q&A-structured page; no cooldown applies to schema fixes | FILE: src/pages/correct-chair-dimensions.astro

- [ ] FIX: /index.astro | Add `"@id": "https://tallchairadvisor.com/#website"` to the WebSite schema block so the WebPage.isPartOf reference resolves correctly | Deterministic schema defect — dangling @id reference carried over from May 10, confirmed unresolved per schema-markup.md CRITICAL issue #1; affects sitewide entity graph; no cooldown applies | FILE: src/pages/index.astro

---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Steelcase Leap Plus vs Herman Miller Aeron Size C: Which Fits Tall People Better? | steelcase leap plus vs herman miller aeron size c | /leap-plus-vs-aeron-size-c/ | Answer-first verdict block (Leap Plus for 6'4"+ or anyone over 230 lbs; Aeron Size C for 6'0"–6'3" lean builds who prioritize breathability). Spec table covering seat height range, seat depth, back height, weight capacity, armrest adjustability, price. Height-tier fit grid with explicit pass/marginal/fail labels per chair per height bracket. "Why Leap Plus Needs the Optional Cylinder" callout (mandatory for 6'4"+, adds ~$63, raises floor to 17.5" and ceiling to 22.5"). "Not the right fit if…" disqualifier block for each chair. Research voice throughout — neither chair is personally tested by Jackson. Amazon affiliate links with tag=tallchairadvi-20. Closes the direct comparison gap between /review/leap-plus/ and /review/aeron-size-c/ while targeting buyers in highest-intent decision phase; fills the cannibalization gap the audit flagged between those two review pages.

---

## REWRITES (Thursday agent, lower priority)

- [ ] REWRITE: /gesture-vs-leap-plus/ | Add a "Why Leap Plus, Not Leap V2?" section (150–200 words) immediately after the Overview: explain (1) Leap V2 and Leap Plus share the same base mechanism but differ on seat depth, seat width, back height, and weight capacity; (2) for tall users the Leap V2's seat depth matches the Gesture's ceiling, eliminating its dimensional advantage; (3) a tall user choosing Gesture vs standard Leap V2 is choosing on armrests and recline feel alone — not on size. Also add a scored comparison rubric subsection listing 5 criteria weighted for tall users (Seat Depth 30%, Seat Height Range 25%, Back Height 20%, Armrest Range 15%, Value 10%) with a one-sentence winner-per-row verdict | Competitor intelligence identified two high-priority gaps on this page — the V2 vs Plus framing confusion is the #1 reason searchers land on a "steelcase leap v2 vs gesture" query and find a Leap Plus comparison without explanation; btod.com outranks on this query; no substantive content changes in last 21 days so cooldown does not apply | FILE: src/pages/gesture-vs-leap-plus.astro

---

## STRATEGY NOTES

This week is pure defect elimination on the money pages before any content expansion — five schema and spec fixes that are cooldown-exempt by definition, targeting the two pages (leap-plus review, index) that drive nearly all affiliate revenue and sitewide entity resolution. The Gesture review schema audit (datePublished/dateModified/author @id gaps flagged in audit) is not scheduled this week because the audit finding recommends verifying the fix survived the July 25 corruption incident before adding more changes — that verification should happen before a follow-on fix is queued. The new comparison page fills the highest-intent decision query between the site's two most-searched tall-user chairs, and the gesture-vs-leap-plus rewrite directly addresses the V2/Plus framing gap that is costing ranking on a buyer-intent query where btod.com currently outranks.