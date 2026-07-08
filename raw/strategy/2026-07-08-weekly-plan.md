# Weekly Plan — 2026-07-08

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->


> ⚠ **Execution agent note:** The file `src/pages/best-office-chairs-under-500.astro` does not match `/best-office-chairs/`. The correct target page for the duplicate-meta fix is the "best office chairs" landing page. **Verify the actual file path before editing** — it may be a separate unlisted file or a dynamic route. Do not edit `best-office-chairs-under-500.astro` for this task.





---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [ ] NEW: Steelcase Leap Plus vs Aeron Size C for Tall People | steelcase leap plus vs aeron size c | /leap-plus-vs-aeron-size-c/ | Comparison pillar targeting tall users (6'2"–6'6") deciding between the two non-Gesture premium options. Answer-first verdict in first 100 words. Structured table: seat height, seat depth, back height, weight capacity, mesh vs. foam, warranty, price. Height-bracket verdicts: who wins at 6'2"–6'4" vs 6'4"–6'6". Research voice throughout (neither chair personally tested by Jackson). Internal links to /review/leap-plus/, /review/aeron-size-c/, /gesture-vs-leap-plus/. Targets affiliate capture gap — buyer-intent comparison queries currently unserved by TCA. Amazon links with tag=tallchairadvi-20.

---

## REWRITES (Thursday agent, lower priority)

- [ ] REWRITE: /best-office-chairs/ | After the FIX (title/meta/byline) is applied, add: (1) an audience matrix near the top — three labeled sections or a short table: "Best for Tall + Lean (6'2"–6'6", under 220 lbs)", "Best for Tall + Heavy (6'0"+, 250–350 lbs)", "Best for Very Tall (6'6"+, any weight)"; (2) a "Best For" use-case badge on each chair entry (e.g., Gesture: "Best for multi-device / home office"; Leap Plus: "Best for all-day use, max seat depth"; Aeron Size C: "Best for tall users who run hot"); (3) JSON-LD ItemList schema wrapping each chair recommendation, with nested AggregateRating where applicable, and a full Review schema for the Gesture (Jackson as author). | Three high-priority competitor gaps on this page (Forbes, btod.com). 279 buyer-intent impressions with zero affiliate conversion. ItemList + AggregateRating schema is table-stakes for rich result eligibility on "best office chair for tall people" — btod.com and crandalloffice.com both have structured content signals TCA lacks. | FILE: src/pages/best-big-and-tall-office-chairs.astro

> ⚠ **Execution agent note:** Confirm the correct file path for the /best-office-chairs/ URL before executing. If the route resolves to a different .astro file, use that file instead of the one listed above.

---

## STRATEGY NOTES

This week's plan attacks two compounding problems simultaneously: the cannibalization crisis on the site's most competitive head term (the /best-office-chairs/ duplicate meta fix is the single highest-leverage mechanical fix available), and the AIO citation gap on the two cornerstone pages (/correct-chair-dimensions/ methodology callout, /office-chairs-for-tall-people/ bracket table restructure) that are generating 44,000+ combined impressions but sending almost no clicks. The Aeron tall-people spec table and Leap Plus comparison table are the fastest fixes to close the dead-click and low-scroll behavioral signals from Clarity. The new /leap-plus-vs-aeron-size-c/ comparison fills the one high-purchase-intent comparison slot that TCA currently has zero coverage for, and pairs naturally with the existing /gesture-vs-leap-plus/ and /aeron-vs-gesture/ pages to complete the comparison cluster for the three flagship chairs.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/best-office-chairs-under-500.astro edited within 14d] - [ ] FIX: /best-office-chairs/ | Differentiate title and meta from /office-chai
- [cooldown: src/pages/correct-chair-dimensions.astro edited within 14d] - [ ] FIX: /correct-chair-dimensions/ | Add a methodology callout block (3–4 sen
- [cooldown: src/pages/office-chairs-for-tall-people.astro edited within 14d] - [ ] FIX: /office-chairs-for-tall-people/ | Restructure the "Which Chair Is Bes
- [cooldown: src/pages/chairs/herman-miller-aeron/tall-people.astro edited within 14d] - [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Add a "Herman Miller Aeron
- [cooldown: src/pages/review/leap-plus.astro edited within 14d] - [ ] FIX: /review/leap-plus/ | Add a "Steelcase Leap Plus vs. Steelcase Gesture
