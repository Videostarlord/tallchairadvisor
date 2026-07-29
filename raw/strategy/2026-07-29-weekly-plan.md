# Weekly Plan — 2026-07-29

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->






---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Best Office Chairs for Tall People — Reviewed by Height Bracket | best office chairs for tall people | /best-office-chairs/ | Answer-first buyer's guide segmented by height bracket (6'0"–6'3", 6'4"–6'5", 6'5"+) AND weight tier (standard, 250lb+, 300lb+). Opens with a one-paragraph verdict naming the top pick per bracket. Includes per-chair spec tables (seat height range, seat depth range, back height, weight capacity) with bolded tall-specific callouts. Jackson's Gesture testing disclosed up front; all other chairs in research voice. Byline block above the fold. Targets 276 buyer-intent impressions currently landing on the page with 0 affiliate structure to capture them. Implement JSON-LD ItemList schema. Include Amazon affiliate links with tag=tallchairadvi-20.

> **Note:** `/best-office-chairs/` does not appear in the EXISTING PAGES list. If it resolves to an existing file (e.g., `src/pages/best-office-chairs/index.astro` or similar unlisted path), move this to REWRITES and apply the competitor gap fixes from the audit instead. Friday agent must verify before publishing.

---

## REWRITES (Thursday agent, lower priority)
<!-- Significant overhauls only. No overlap with FIX targets above. -->

- [ ] REWRITE: /review/leap-plus/ | The AIO capsule for "steelcase leap plus review" is already inserted and the page has 12,391 impressions at pos 8.7 — meaning the content is ranking but not converting clicks. Add a fit-tier verdict table identical in structure to the Gesture fix above (Strong fit / Marginal / Not recommended rows with seat depth and back height as the limiting dimensions for each tier). Also add a scannable "Who This Is For" summary box in the first screen, since the Leap Plus is the recommended alternative for 6'5"+ users referenced in the Gesture verdict fix — internal consistency matters for AIO citation chains. Cannibalization risk ("steelcase leap v2 for tall people") should be addressed by ensuring this review page owns the transactional angle while /chairs/steelcase-leap-plus/tall-people/ handles informational fit queries — add a clear canonical distinction in the intro paragraph. | FILE: src/pages/review/leap-plus.astro

---

## STRATEGY NOTES

This week's plan concentrates on the two highest-leverage levers simultaneously: converting the site's massive impression inventory into clicks (five FIX tasks targeting pages with 39K, 12K, 9K, 17K, and 508 impressions respectively) and closing the structural content gaps that competitors like Forbes and BTOD are using to win AIO citations that TCA is currently losing. The /best-office-chairs/ new page targets the 276 buyer-intent impressions that currently have no strong affiliate capture structure and directly addresses four high-priority competitor gaps identified in the intelligence report. All fixes are grounded in confirmed competitor gap data and behavioral signals (Clarity scroll depth, dead clicks) rather than speculative improvements — consistent with the statistical confidence policy of acting on 300+ impression signals with position ≤10.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/review/gesture.astro edited within 14d] - [ ] FIX: /review/gesture/ | Restructure the "Verdict" section to open with a t
- [cooldown: src/pages/office-chairs-for-tall-people.astro edited within 14d] - [ ] FIX: /best-office-chairs/ | (a) Add a visible byline block in the first sc
- [cooldown: src/pages/correct-chair-dimensions.astro edited within 14d] - [ ] FIX: /correct-chair-dimensions/ | Add at least one sub-$300 chair row (Sih
- [cooldown: src/pages/chairs/herman-miller-aeron/tall-people.astro edited within 14d] - [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Convert the "Aeron vs Gest
- [cooldown: src/pages/knee-pain-seat-depth.astro edited within 14d] - [ ] FIX: /knee-pain-seat-depth/ | Expand the "Adjustable Seat Depth vs Fixed S
