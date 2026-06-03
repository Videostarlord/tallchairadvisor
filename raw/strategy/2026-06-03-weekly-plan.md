# Weekly Plan — 2026-06-03

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->



- [ ] FIX: /aeron-vs-gesture/ | Rewrite title tag and meta description to remove any first-person framing that misrepresents the content voice (audit flags "First-person title misrepresents content" as the suspected mechanism); title should read something like "Aeron vs. Gesture for Tall Users: Which Chair Fits 6'3"+?" — factual, comparison-framed, no implied personal test of both chairs; meta should lead with the verdict ("The Aeron wins on breathability; the Gesture wins on armrests and multi-device postures — here's the full breakdown by height bracket") | 466 impressions at pos 8.5 with 0 clicks; voice violation risk (CRITICAL RULE: Jackson only tested the Gesture — title must not imply he sat in both) | FILE: src/pages/aeron-vs-gesture.astro



---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. If a slug is already live, put it in REWRITES instead. -->


> **Note:** `/standing-desk-height-tall-people/` was Priority 2 on the roadmap but already appears in the existing pages list — it is live. Do not publish again. If it needs content improvement, use REWRITES.

---

## REWRITES (Thursday agent, lower priority)
<!-- For significant content overhaul of existing pages AND for adding new sections to existing pages. -->
<!-- CRITICAL: Do NOT emit a REWRITE for a page that already has a FIX in this plan. -->

- [ ] REWRITE: /knee-pain-seat-depth/ | (Carrying forward from last week — confirm whether the FAQ section was added by the previous Thursday agent; if not yet applied, add it now) Add a fully rendered FAQ section with 5 explicitly labeled Q&A pairs drawn from existing prose: (1) "What is the Cornell Ergonomics seat depth rule?" (2) "How much seat depth do I need if I'm 6'3"?" (3) "Can a seat that's too shallow cause knee pain?" (4) "What's the difference between fixed and adjustable seat depth?" (5) "Does the Herman Miller Aeron have enough seat depth for tall users?" — align with FAQPage schema already declared but currently schema-only with no rendered block; also expand the "Adjustable vs Fixed Seat Depth" section intro from its current ~73-character stub to 150–250 characters explaining *why* adjustability is structurally required for the 6'0"–6'5"+ range before making any product recommendation | Competitor gap analysis (btod.com) confirms both issues; page has 3,484 impressions at pos 8.4 — the FAQ section directly targets the Cornell-rule query cluster (77+62 impressions, 0 clicks) and gives Google a citable rendered answer block to replace the schema-only signal | FILE: src/pages/knee-pain-seat-depth.astro



---

- [ ] NEW: Wide Seat Office Chairs for Tall People | widest office chair | /wide-seat-office-chairs-tall-people/ | Research-voice. Targets users who are both tall and broad-shouldered. Seat width + seat depth interaction. Covers which chairs have 20"+ seat width with tall-user seat height range.

- [ ] NEW: Best Big and Tall Office Chairs (Tall People Guide) | best rated big and tall office chair | /best-big-and-tall-office-chairs/ | Research-voice. Targets 3,600+ searches/mo for "big and tall" chair variants. Separate from tall-only — addresses weight capacity + wide seat + height dimensions as three distinct requirements. TCA differentiation: height-specific fit analysis that big-and-tall retailers skip. Amazon affiliate links required.

## STRATEGY NOTES

The week's focus is the CTR crisis: the site has 23,105 impressions and only 55 clicks (0.24% CTR), and the five pages identified in the critical tier (pos ≤ 10, 0 clicks) represent roughly 2,300 impressions of completely wasted ranking authority every 90 days. All five FIX targets this week are meta/title interventions on that exact tier — the lowest-effort, highest-leverage move available given that all underlying pages were recently edited and are off-limits for content changes. The `/office-chairs-for-6-foot-4/` anomaly (pos 4.5, 0 clicks) is treated as an active incident requiring root-cause investigation before any meta rewrite, since the cause may be non-meta (AIO displacement, position-averaging artifact, or rendering issue). The new `/shoulder-pain-tall-people/` post is the highest E-E-A-T opportunity on the roadmap — first-person voice is fully permitted, Jackson has lived experience to draw on, and the Ergonomics & Pain pillar needs a flagship personal-experience piece to anchor affiliate conversion from pain-aware visitors (the pattern that produced the site's first commission).

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/office-chairs-for-6-foot-4.astro edited within 14d] - [ ] FIX: /office-chairs-for-6-foot-4/ | Investigate and fix the 0-click anomal
- [cooldown: src/pages/chairs/herman-miller-aeron/tall-people.astro edited within 14d] - [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Rewrite meta description t
- [cooldown: src/pages/chairs/steelcase-gesture/index.astro edited within 14d] - [ ] FIX: /chairs/steelcase-gesture/ | Rewrite meta description: current is fla
- [cooldown: src/pages/fit-guides.astro edited within 14d] - [ ] FIX: /fit-guides/ | Rewrite title tag to include a query-anchored phrase (
- [no FILE ref] - [ ] REWRITE: Shoulder Pain from Office Chair (Tall People) | shoulder pain from office chair tall 
- [FIX+REWRITE overlap — REWRITE dropped] - [ ] REWRITE: /chairs/herman-miller-aeron/tall-people/ | Add a complete structu
- [cooldown: src/pages/office-chairs-for-tall-people.astro edited within 14d] - [ ] REWRITE: /office-chairs-for-tall-people/ | Add one cited external authorit
