# Weekly Plan — 2026-05-13

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->




- [ ] FIX: /office-chairs-for-tall-people/ | Add 2–3 sentence authority statement as first visible prose in the opening section (not in schema/byline only): "This guide is written by Jackson Christopher, a 6'4" Mechanical Engineering senior at UC Berkeley. The Steelcase Gesture assessment is based on 18+ months of personal daily use; all other chairs are evaluated from manufacturer specs, anthropometric data, and published user research." | Competitor intelligence confirms BTOD outranks on authority-surfacing; TCA credentials exist only in schema/byline, invisible to AI crawlers and readers. Medium-confidence gap from competitor analysis. Page in recently-edited list — authority block qualifies as structural E-E-A-T fix. | FILE: src/pages/office-chairs-for-tall-people.astro

- [ ] FIX: /review/leap-plus/ | Expand "Compare With" section into a structured HTML comparison table: Leap Plus vs. Steelcase Gesture, rows — Seat Height Max, Seat Depth Max, Back Height, Armrest Type, Weight Capacity, Price Range, Mesh Option, Warranty. Add one-paragraph verdict below table. Verify all Amazon links include tag=tallchairadvi-20. Verify no first-person voice used (research voice only — Jackson has NOT tested Leap Plus). | Competitor intelligence (thehumansolution.com) confirms absence of head-to-head table is a coverage gap. 81 comparison buyer-intent impressions on gesture-vs-leap-plus suggest this query cluster has purchase intent. Affiliate tag audit is a technical fix, always eligible. | FILE: src/pages/review/leap-plus.astro

---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Office Chair Return Policy Guide for Steelcase & Herman Miller | office chair return policy steelcase herman miller | /office-chair-return-policy/ | Research-voice guide covering Steelcase.com 14-day direct return window, authorized dealer 30-day trial options (flag retailer dependency), Herman Miller authorized dealer policies, and refurbished unit return considerations. Answer-first format: open with a one-sentence declarative answer to "can I return a Steelcase chair?" Internal links to /review/leap-plus/ and /review/gesture/. No first-person voice — Jackson has not purchased through these channels under test conditions. Include affiliate CTAs for Gesture and Leap Plus with tag=tallchairadvi-20.

- [ ] NEW: Seat Depth by Height Calculator — What Seat Depth Do You Need? | seat depth for tall people by height | /seat-depth-by-height/ | Answer-first guide structured around a height-to-seat-depth recommendation table (5 rows minimum: 6'0"–6'5"+). Columns: Height Range, Typical Thigh Length, Minimum Seat Depth Needed, Chairs That Cover It. Bridges the AIO-suppressed Cornell ergonomics queries on /knee-pain-seat-depth/ (68 impr, pos 7.8, 0 clicks) by targeting the adjacent sizing intent query rather than the suppressed definition query. Internal links to /knee-pain-seat-depth/, /chairs/steelcase-gesture/seat-depth/, /correct-chair-dimensions/. Structured with FAQ schema targeting "what seat depth do I need for my height" format.

---

## REWRITES (Thursday agent, lower priority)
<!-- Significant content overhaul of existing pages. No FIX+REWRITE overlap. -->

- [ ] REWRITE: /correct-chair-dimensions/ | Full content depth upgrade: add height-segmented spec tables (5'10"–6'7" in 1-inch increments), a structured "How to Measure Your Chair Fit" step-by-step section, and FAQ schema with ≥5 questions targeting position-aware queries. Add internal links to /seat-depth-by-height/ (once published), /knee-pain-seat-depth/, /chairs/steelcase-gesture/seat-depth/. | Highest opportunity score on site (883) at pos 15.8 with 1,766 impressions — signals Google finds the page relevant but not authoritative enough to surface higher. Content-depth diagnosis confirmed in GSC intelligence. Not in cooldown conflict (already in recently-edited list — however this is a full structural overhaul, not a meta tweak; new sections qualify). **Note to agent: if cooldown enforcement blocks this, defer to next week.** | FILE: src/pages/correct-chair-dimensions.astro

---

## STRATEGY NOTES

This week's plan executes on two parallel tracks: (1) CTR recovery on pages with fixable failures — specifically `/office-chairs-for-6-foot-4/` at pos 5.3 with confirmed zero clicks and no AIO suppression, which is the single highest-ROI fix on the site, and (2) AIO citation positioning, with the authority credential block on `/office-chairs-for-tall-people/` and the answer-first new content pages designed to give Google extractable passages TCA currently lacks. New content prioritizes `/seat-depth-by-height/` as a flanking page that captures the sizing-intent query cluster adjacent to the AIO-suppressed Cornell ergonomics queries, converting suppressed impressions into a rankable adjacent page rather than fighting the AIO directly. The `/office-chair-return-policy/` page addresses the confirmed BTOD content gap and adds a purchase-anxiety-reducing page that supports conversion on the Gesture and Leap Plus review pages.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/office-chairs-for-6-foot-4.astro edited within 14d] - [ ] FIX: /office-chairs-for-6-foot-4/ | Rewrite title tag and meta description
- [cooldown: src/pages/review/gesture.astro edited within 14d] - [ ] FIX: /review/gesture/ | Add AIO-citation anchor block: a single bolded sta
- [cooldown: src/pages/gesture-vs-leap-plus.astro edited within 14d] - [ ] FIX: /gesture-vs-leap-plus/ | Rewrite meta description to ≤155 chars with 
