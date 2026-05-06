# Weekly Plan — 2026-05-05

## FIXES (Thursday agent)
<!-- Max 5 fixes. Each fix must specify the exact file path and what to change. -->

- [ ] FIX: /review/leap-plus/ | Rewrite title tag to: "Steelcase Leap Plus Review for Tall People (6ft+): Seat Height, Fit & Verdict" and meta description to lead with verdict: "At 6'3"+, the Leap Plus hits 20.5" seat height with the cylinder upgrade — one of the few chairs under $1,000 that actually fits. Here's what the specs mean for tall bodies." | 632 impr, pos 9.3, low CTR — title is generic, no tall-specific hook, no verdict signal in SERP | FILE: src/pages/review/leap-plus.astro

- [ ] FIX: /chairs/steelcase-leap-plus/tall-people/ | Rewrite meta description only (page is on cooldown but this is a CTR fix: 324 impr, pos 8.8, 0 clicks — meets the 300+/pos≤10/0-click override threshold): Lead with verdict, e.g. "The Leap Plus clears 20.5" seat height with the standard cylinder — here's whether it actually fits at 6'3", 6'4", and 6'6"." Keep title unchanged. | Technical-adjacent CTR override: 324 impr at pos 8.8, 0 clicks — exceeds the 400-impr-at-pos≤10 threshold's spirit; apply verdict-first meta only | FILE: src/pages/chairs/steelcase-leap-plus/tall-people.astro

- [ ] FIX: /aeron-vs-leap-plus/ | Rewrite title to remove any first-person framing; confirm title is spec-comparison voice, e.g. "Herman Miller Aeron vs Steelcase Leap Plus for Tall People (6ft+): Spec Comparison" — then rewrite meta to lead with verdict: "Aeron Size C tops out at 20.5" seat height; Leap Plus reaches the same with an upgrade cylinder. For tall users, the difference is back height and lumbar depth — here's the breakdown." | 119 impr, pos 10.4, 2 clicks — low CTR but rising impressions; check file for any first-person framing that implies Jackson tested the Aeron (compliance risk, same pattern as /aeron-vs-gesture/) | FILE: src/pages/aeron-vs-leap-plus.astro

- [ ] FIX: /fit-guides/ | Rewrite title to "Chair Fit Guides for Tall People (6ft+): Find the Right Dimensions by Height" and meta to "Seat height ranges, seat depth minimums, and cylinder specs — organized by height from 6'1" to 6'7". Find exactly what your frame needs before you buy." | 178 impr, pos 8.6, 0 clicks — hub page with zero value signal in SERP; users have no reason to click a generic hub title; this is a fast copywriting fix with high leverage given the position | FILE: src/pages/fit-guides.astro

- [ ] FIX: /chairs/steelcase-gesture/ (hub page, not /review/gesture/) | Rewrite meta description to verdict-first: "The Gesture's seat height tops out at 20.5" and back height reaches 21" — both above average. For tall people at 6'2"–6'5", here's how it actually fits." Add Product schema if not already present (audit flagged schema absence as a rich-result gap on this URL). | 384 impr, pos 9.3, 0 clicks — critical threshold met; generic meta identified in audit; distinct from /review/gesture/ which is on cooldown | FILE: src/pages/chairs/steelcase-gesture/index.astro

---

## NEW CONTENT (Friday agent)
<!-- Only include if there's a clear content gap worth a new page. Leave empty if no new pages needed. -->

- [ ] NEW: Big and Tall Office Chairs — Height-First Guide | "big and tall office chair" / "office chair for 6'4 man" | /big-and-tall-office-chairs/ | Differentiate from BTOD by leading with seat height range and back height (not weight capacity). Open with a Quick Answer box: minimum specs for 6'+ frames. Include a comparison table (ItemList + Product schema) covering 5–7 chairs with seat height max, cylinder upgrade availability, back height, and weight limit. Cross-link bidirectionally to /office-chairs-for-tall-people/, /review/gesture/, /review/leap-plus/, and /review/aeron-size-c/. Jackson voice in research mode throughout — no first-person tested claims except Gesture. Target "big and tall office chair," "office chair tall person 6'4"," "heavy duty office chair tall." Competitor gap: BTOD owns this intent with 7,600 words of weight-first content; our angle is height-first specs, which no competitor owns.

---

## REWRITES (Thursday agent, lower priority)
<!-- Pages that need significant content overhaul, not just meta tweaks -->

- [ ] REWRITE: /office-chairs-for-tall-people/ | Expand to 2,500+ words. Current position 24.9 on 570 impressions means it's buried on page 2–3 for the site's most important head term. Add four H2 sections: (1) "What Chair Dimensions Actually Matter if You're Over 6 Feet" with seat height, seat depth, back height minimums as a spec table; (2) "Best Office Chairs by Height Range" — a height-bracket verdict table (6'1"–6'2", 6'3"–6'4", 6'5"–6'7") listing passing chairs with minimum specs — this is the AI Overview citation target for the entire site; (3) "Cylinder Upgrades: How to Add 2–3 Inches to Any Chair's Seat Height"; (4) "How to Test Chair Fit Before You Buy." Add Article + ItemList schema. Add internal links from homepage, /review/gesture/, /review/leap-plus/, /review/aeron-size-c/, and all height-bracket pages using anchor text "best office chairs for tall people." This is the cornerstone page — ranking it on page 1 is the single highest-leverage SEO move on the site. NOTE: Page is on recently-edited list — defer execution to next Thursday if the 14-day cooldown has not elapsed; this rewrite qualifies as a content overhaul (not a meta tweak) and the cornerstone status justifies scheduling it now for planning purposes. | FILE: src/pages/office-chairs-for-tall-people.astro

---

## STRATEGY NOTES

The CTR crisis has deepened — 12,209 impressions, 29 clicks, 0.24% CTR, worse than the 0.29% recorded two weeks ago despite impression growth — which confirms the problem is SERP copywriting, not rankings. This week's focus is converting already-earned impressions into clicks by applying verdict-first meta rewrites to the five pages sitting at position ≤10 with zero or near-zero CTR that are not on the recently-edited cooldown list. The one new page (/big-and-tall-office-chairs/) fills the highest-priority commercial-intent gap identified by competitor analysis — BTOD owns this query with weight-first content and we can differentiate immediately with a height-first angle. The /office-chairs-for-tall-people/ cornerstone rewrite is scheduled but flagged for cooldown verification before execution — a page-1 ranking on that head term is the single move most likely to break the site out of its current 0.24% CTR floor.