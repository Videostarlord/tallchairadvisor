# Weekly Plan — 2026-05-10

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] FIX: /aeron-vs-gesture/ | Rewrite meta description to ≤155 chars with direct verdict signal and height bracket (e.g., "Aeron Size C vs. Steelcase Gesture for tall users 6'2"+: seat depth, back height, and lumbar fit compared spec-by-spec. Verdict: which fits taller frames better."). Rewrite title tag to include "for Tall People (6'2"+)" and a verdict signal. | 348 impressions at pos 8.5 with 0% CTR — exceeds the 300+ impr / pos ≤10 critical threshold. Not on cooldown. Meta overlength confirmed as primary diagnosis. | FILE: src/pages/aeron-vs-gesture.astro

- [ ] FIX: /fit-guides/ | Rewrite meta description from generic hub copy to a verdict-forward snippet: lead with the site's core promise ("height-specific fit thresholds for 6'0"–6'7" frames") and include a concrete hook (e.g., "Find the minimum seat height, depth, and back height for your exact height."). Rewrite title to include "by Height (6'0"–6'7")" rather than a generic label. | 178 impressions at pos 8.6 with 0% CTR — actionable threshold met. Hub/index pages with no verdict signal consistently underperform on this site. Not on cooldown. | FILE: src/pages/fit-guides.astro

- [ ] FIX: /chairs/steelcase-gesture/seat-depth/ | Rewrite meta to ≤155 chars leading with the spec value: "Steelcase Gesture seat depth adjusts from 15.75" to 18.75" — here's how to set it correctly for 6'+ legs." First-person voice IS permitted here (Gesture only). | 101 impressions at pos 4.1 with 0% CTR on "steelcase gesture adjustment guide" — 0.63 clicks/wk lost at pos 4 is disproportionately damaging. Spec-lead rewrites have outperformed on this site. | FILE: src/pages/chairs/steelcase-gesture/seat-depth.astro

- [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Add passage-anchor sentences per competitor gap finding: prepend each major spec section with a single bolded extractable sentence in format "The Herman Miller Aeron Size C [dimension] is [value]." (seat height 16–20.5", seat depth fixed 18.5", back height ~23.5"). Also verify canonical is pointed correctly relative to /review/aeron-size-c/ to resolve the "aeron chair sizes how to tell" cannibalization risk. | Competitor gap [medium] — AIO citation formatting absent. Cannibalization signal confirmed in GSC intelligence. Not on cooldown. | FILE: src/pages/chairs/herman-miller-aeron/tall-people.astro

- [ ] FIX: /correct-chair-dimensions/ | Rename the "Common Mistakes When Evaluating Dimensions" section to "The 5 Tall-Chair Measurement Rules" and reframe each mistake as a numbered positive rule with a short bold label (e.g., "Rule 1: Read the Maximum, Not the Range"). No new content required — restructure only. Also add the two-sentence Gesture/Leap Plus cylinder compatibility note in the Extended Gas Cylinders subsection: both accept standard 50mm aftermarket cylinders; Aeron Size C requires Herman Miller-specific extended piston. | Competitor gap [high] — 1,658 impressions at pos 16.1, AI Overview citation structure absent. Restructured named lists are the confirmed citation pattern. Not on cooldown. | FILE: src/pages/correct-chair-dimensions.astro

---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->
<!-- Format MUST be exactly 4 pipe-separated fields: title | keyword | slug | description -->

- [ ] NEW: Office Chair Return Policies — What Tall Buyers Should Know Before Spending $1,500 | office chair return policy steelcase herman miller | /office-chair-return-policy/ | Research-voice editorial. Covers Steelcase.com 14-day window (reduced from 30), authorized dealer alternatives with potentially longer windows (Crandall, The Human Solution), refurbished unit policy considerations. Natural internal link target from /review/leap-plus/ and /review/gesture/. Answers a high-purchase-anxiety query that btod.com is currently capturing and TCA has no answer for.

---

## REWRITES (Thursday agent, lower priority)
<!-- Significant content overhaul or section additions for existing pages. No page should appear in both FIXES and REWRITES. -->
<!-- Format MUST be exactly 4 pipe-separated fields matching the FIX format -->
<!-- CRITICAL: FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] REWRITE: /gesture-vs-leap-plus/ | Add a standalone "## Leap Plus vs. Steelcase Gesture — Side-by-Side Specs" section with a two-column comparison table covering: seat height range, seat depth range, back height, armrest adjustment axes (Gesture's 360° vs. Leap's 4D), weight capacity, upholstery options, warranty, and approximate price. Also add use-case verdict labels: Gesture → multi-screen/device switching, Leap Plus → extended-hours or 24-hour use. Add return policy note linking to new /office-chair-return-policy/ page once live. | Competitor gap [high] on /review/leap-plus/ — no on-page comparison table despite multiple prose references to Gesture. Not on cooldown. | FILE: src/pages/gesture-vs-leap-plus.astro

- [ ] REWRITE: /knee-pain-seat-depth/ | Add two targeted content blocks: (1) Before the height-bracket table, add one paragraph citing BIFMA G1 / ANSI/HFES 100 as the anthropometric basis for why standard chairs fail at the 95th-percentile male popliteal length. (2) Add a "Quick Seat Depth Self-Test" callout block with three explicit pass/fail states: <2 fingers = too shallow; 2–3 fingers = correct (Cornell Ergonomics Rule); >3 fingers = too deep. | Competitor gap [high] × 2. Pos 8.6 with 1,925 impressions and near-p1 opportunity score 447.7. Additions are net-new section injections — verify before executing if page is still on cooldown. | FILE: src/pages/knee-pain-seat-depth.astro

---

## STRATEGY NOTES

This week's plan concentrates on two compounding problems: (1) the CTR leak cluster — five pages at pos 8–10 with zero clicks where the fix is meta restructuring, not content, and (2) the AI Overview citation gap exposed by competitor intelligence, where restructuring existing content into named, numbered, passage-anchor formats can convert already-ranking pages into citation sources without adding word count. The one new page (/office-chair-return-policy/) is a low-effort, high-trust gap filler that addresses a confirmed competitor advantage on /review/leap-plus/ without requiring a cooldown-violating edit to that page. The /knee-pain-seat-depth/ rewrite is flagged with a cooldown caveat — execute only if the additions are confirmed as net-new section injections into unedited sections of the page.
