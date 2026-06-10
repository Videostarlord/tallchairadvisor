# Weekly Plan — 2026-06-10

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] FIX: /office-chairs-for-6-foot-4/ | Audit title tag for malformed HTML entities (&#39; and &quot; rendering in SERP), rewrite meta description with verdict-first format ("Best office chairs for 6'4" users: seat height, depth, and back height specs that actually fit — with picks from $400 to $1,400"), confirm canonical is self-referencing; do NOT rewrite body content (cooldown active) | Position 4.5 with 361 impressions and 0 clicks is the single most anomalous data point on the site — expected CTR at this position is ~8–10%, meaning ~29 clicks/week are being lost; title encoding corruption is the leading hypothesis per audit C-1 | FILE: src/pages/office-chairs-for-6-foot-4.astro

- [ ] FIX: /knee-pain-seat-depth/ | Add a rendered FAQ section (5 labeled Q&A pairs visible on-page, not schema-only) using existing prose answers: (1) "What is the Cornell Ergonomics seat depth rule?" (2) "How much seat depth do I need if I'm 6'3"?" (3) "Can a seat that's too shallow cause knee pain?" (4) "What's the difference between fixed and adjustable seat depth?" (5) "Does the Herman Miller Aeron have enough seat depth for tall users?" Align FAQPage schema to match rendered content | Competitor gap audit confirms FAQ schema exists at structured-data layer only with no visible Q&A block; btod.com outranks on this pattern; AIO passage for "cornell ergonomics chair seat depth two fingers behind knee" (77 impr, pos 7.6, 0 clicks) is confirmed — rendered FAQ directly addresses the AIO question format and gives Google citable discrete answers to surface | FILE: src/pages/knee-pain-seat-depth.astro




---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->


> **Note:** `/shoulder-pain-tall-people/` and `/standing-desk-height-tall-people/` both appear in the EXISTING PAGES list (already published). The roadmap listed them as priority 1 and 2, but they are live. The Friday agent should treat these as complete and select the next unbuilt topic. If the pipeline requires a NEW entry regardless, the next logical topic from the content pillars is: **"Office Chair Lumbar Support for Tall People"** | keyword: lumbar support office chair tall people | /lumbar-support-tall-people/ | Pain pillar — complements knee-pain and shoulder-pain pages; targets users whose lumbar curve sits above standard chair lumbar pads due to torso length; spec-driven content on lumbar height adjustment ranges across Gesture, Aeron, Leap Plus.

---

## REWRITES (Thursday agent, lower priority)
<!-- Significant overhaul or new section additions for existing pages. -->
<!-- No page appears in both FIXES and REWRITES. -->


---

- [ ] NEW: Wide Seat Office Chairs for Tall People | widest office chair | /wide-seat-office-chairs-tall-people/ | Research-voice. Targets users who are both tall and broad-shouldered. Seat width + seat depth interaction. Covers which chairs have 20"+ seat width with tall-user seat height range.

- [ ] NEW: Best Big and Tall Office Chairs (Tall People Guide) | best rated big and tall office chair | /best-big-and-tall-office-chairs/ | Research-voice. Targets 3,600+ searches/mo for "big and tall" chair variants. Separate from tall-only — addresses weight capacity + wide seat + height dimensions as three distinct requirements. TCA differentiation: height-specific fit analysis that big-and-tall retailers skip. Amazon affiliate links required.

## STRATEGY NOTES

This week's plan has one overriding priority above all others: diagnose and fix `/office-chairs-for-6-foot-4/` immediately — a page at position 4.5 with 361 impressions and 0 clicks is a technical encoding anomaly, not a content problem, and the fix cost is near-zero while the potential recovery (8–10% CTR × 361 impr = ~29 clicks/week) represents more than half the site's current weekly click volume. The remaining four fixes execute the highest-confidence competitor gap items (FAQ rendering on knee-pain, spec table on Aeron tall-people, E-E-A-T credential block on best-office-chairs, authority citation on office-chairs-for-tall-people) — all backed by direct competitor gap audit evidence at medium-to-high confidence, all scoped to additive changes that cannot hurt existing rankings. The Gesture review rewrite is queued as lower-priority because it requires structural changes to the highest-traffic page on the site and should not block the five targeted fixes from shipping first.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/chairs/herman-miller-aeron/tall-people.astro edited within 14d] - [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Add a structured spec tabl
- [cooldown: src/pages/best-office-chairs.astro edited within 14d] - [ ] FIX: /best-office-chairs/ | Insert a 2–3 sentence author credential block 
- [cooldown: src/pages/office-chairs-for-tall-people.astro edited within 14d] - [ ] FIX: /office-chairs-for-tall-people/ | In the "Why Dimensions Matter More 
- [no FILE ref] - [ ] REWRITE: Shoulder Pain from Office Chair (Tall People Guide) | shoulder pain from office chair
- [cooldown: src/pages/review/gesture.astro edited within 14d] - [ ] REWRITE: /review/gesture/ | Restructure opening 200 words to answer-first 
