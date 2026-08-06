# Weekly Plan — 2026-08-06

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->





- [ ] FIX: /best-office-chairs-under-500/ | Add AggregateRating schema to the Steelcase Leap V2 ListItem (ratingValue, reviewCount, bestRating fields) to unlock star-display eligibility in SERPs; verify all existing ItemList/ListItem schema is valid | Competitor gap (audit finding, /best-office-chairs-under-500/ schema section); page is #1 GA4 session page and #2 in affiliate clicks — schema upgrade has zero downside risk and may improve SERP CTR on a converting page | FILE: src/pages/best-office-chairs-under-500.astro

---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Steelcase Leap Plus vs Herman Miller Aeron Size C: Which Fits Tall People Better? | steelcase leap plus vs herman miller aeron | /leap-plus-vs-aeron-size-c/ | Direct comparison targeting buyers deciding between the two most-searched tall-user chairs. Structure: answer-first verdict block (Leap Plus wins for 6'4"+, Aeron wins for 6'0"–6'3" lean builds), spec table (seat height, depth, back height, weight capacity, armrests, price), height-tier fit grid, and a "Not the right fit if…" disqualifier block. Research voice only for both chairs. Amazon links with tag=tallchairadvi-20. Targets the cannibalization gap between /review/leap-plus/ and /review/aeron-size-c/ while filling the missing direct comparison that /aeron-size-c-vs-leap-plus/ currently occupies but may not be optimally structured for this query intent.

---

## REWRITES (Thursday agent, lower priority)


---

## STRATEGY NOTES

This week's plan is almost entirely conversion and structure work, not traffic acquisition — consistent with the Aug 4 decision log finding that the constraint has moved to traffic volume, not monetization mechanics, which means every incremental click from existing impressions compounds faster than new content. The two highest-ROI moves are the `/knee-pain-seat-depth/` meta fix (40K impressions, 0.04% CTR — even a move to 0.3% CTR adds ~10 clicks/week from a single edit) and the spec error correction on `/chairs/steelcase-leap-plus/seat-height/` (a factual contradiction that actively suppresses trust and bypasses the cooldown gate on technical grounds). The single new content piece targets the `/leap-plus-vs-aeron-size-c/` comparison gap, which fills the cannibalization risk between the two review pages while capturing buyers in the highest-intent decision phase.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/chairs/steelcase-leap-plus/seat-height.astro edited within 14d] - [ ] FIX: /chairs/steelcase-leap-plus/seat-height/ | Correct the spec contradic
- [cooldown: src/pages/knee-pain-seat-depth.astro edited within 14d] - [ ] FIX: /knee-pain-seat-depth/ | Shorten title from 67 chars to ≤60 chars; re
- [cooldown: src/pages/correct-chair-dimensions.astro edited within 14d] - [ ] FIX: /correct-chair-dimensions/ | Shorten title from 73 chars to ≤60 chars
- [cooldown: src/pages/review/aeron-size-c.astro edited within 14d] - [ ] FIX: /review/aeron-size-c/ | Add a 3-tier "Fit Verdict" callout block (Bes
- [cooldown: src/pages/review/leap-plus.astro edited within 14d] - [ ] REWRITE: /review/leap-plus/ | (1) Add a 3-row "Fit Verdict" callout block 
