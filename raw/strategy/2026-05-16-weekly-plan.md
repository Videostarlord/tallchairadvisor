# Weekly Plan — 2026-05-16

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] FIX: /review/gesture/ | Add AIO-optimized answer-first intro passage (≤60 words, self-contained) directly answering "Is the Steelcase Gesture good for tall people?" with specific measurements; also add FAQ schema entry targeting "steelcase gesture review" to compete with Reddit/BTOD AIO citations | FILE: src/pages/review/gesture.astro





---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Wrist Pain from Office Chair (Tall People) — Armrest Height Guide | wrist pain office chair tall people armrest | /wrist-pain-armrest-height/ | Ergonomics & Pain pillar. Tall users suffer wrist pain when armrests sit too low relative to desk height — a near-universal fit problem at 6'+. Cover the armrest-to-desk height relationship, the 90-degree elbow rule with height-specific measurements, and which chairs (Gesture 360 armrests, Leap Plus, Aeron) have the adjustability range to serve 6'2"+ users. Research voice for all chair specs; Jackson's ME background supports the biomechanics framing. Answer-first structure targeting AI Overview citation.

---

## REWRITES (Thursday agent, lower priority)
<!-- For significant content overhaul of existing pages. Do NOT emit a REWRITE for a page that already has a FIX in this plan. -->

- [ ] REWRITE: /best-office-chairs/ | Insert 2–4 sentence methodology disclosure block between intro paragraph and Quick Picks section (Jackson Christopher, 6'4" ME at UC Berkeley; Gesture personally owned and tested 18+ months; Aeron and Leap Plus research-evaluated via specs, user reports, ergonomic literature); add AggregateRating schema nested within each ListItem sourced from Amazon/manufacturer ratings; add 3-row "Which Chair for Your Work Context?" decision block (home office → Aeron; corporate/multi-device → Gesture; all-day/heavy-use → Leap Plus) | Score 439 opp score, 878 impr at pos 22.4 — E-E-A-T and schema gaps are suppressing ranking on a high-intent head term; methodology credentialing directly addresses the Forbes competitive gap | FILE: src/pages/best-office-chairs.astro


---

## STRATEGY NOTES

This week's plan is dominated by **AIO citation capture and E-E-A-T credentialing** — the two root causes of the 0.23% CTR ceiling. The five fixes all target passage-level extractability (named standards, explicit height-to-setting mappings, numbered criterion counts) on pages that already have 400–3,000+ impressions but are losing clicks to AI Overviews citing Reddit and BTOD instead of TCA. The single new piece pivots away from the highest-priority roadmap items (shoulder pain and standing desk are already live per the existing pages list) toward wrist pain / armrest height, which is the next logical Ergonomics & Pain spoke, has zero competition in the existing pages, and gives the Gesture's 360-degree armrests a first-person-adjacent content hook. The two rewrites address the **affiliate capture gap** on /best-office-chairs/ (143 buyer-intent impressions, no AggregateRating schema) and the **cannibalization risk** on the tall-people cornerstone — both are lower-priority than the fixes but address structural issues that compound week-over-week if left unresolved.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/review/leap-plus.astro edited within 14d] - [ ] FIX: /review/leap-plus/ | Add visually distinct verdict callout block at t
- [cooldown: src/pages/chairs/steelcase-gesture/seat-depth.astro edited within 14d] - [ ] FIX: /chairs/steelcase-gesture/seat-depth/ | Add a dedicated 3-sentence he
- [cooldown: src/pages/knee-pain-seat-depth.astro edited within 14d] - [ ] FIX: /knee-pain-seat-depth/ | Add visually distinct definition block (bord
- [cooldown: src/pages/correct-chair-dimensions.astro edited within 14d] - [ ] FIX: /correct-chair-dimensions/ | Add 2–4 sentence methodology note direct
- [cooldown: src/pages/office-chairs-for-tall-people.astro edited within 14d] - [ ] REWRITE: /office-chairs-for-tall-people/ | Add weight capacity as a column
