# Weekly Plan — 2026-07-22

## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->

- [ ] FIX: /correct-chair-dimensions/ | Insert a named "Fit Verdict Methodology" block immediately before the chair-model fit table — formatted as a numbered 3-point list labeled "The Three-Dimension Rule": (1) seat height must reach popliteal height at max cylinder extension, (2) seat depth must reach thigh-length minimum, (3) back height must clear torso-length minimum. This gives AI Overviews a discrete, quotable named framework to cite rather than burying the logic in prose. Also add a `speakable` + FAQ schema entry anchored to "what are the correct chair dimensions for a tall person?" | Competitor gap: Forbes cites Dr. Echebiri + explicit criteria upfront; TCA's methodology is implicit. Page at pos 9.6 with 16,917 impressions is the second-highest opportunity score on site — adding a citable named framework directly targets AIO citation eligibility. AIO passage currently cites Forbes/Eureka/Hinomi; TCA is not cited. | FILE: src/pages/correct-chair-dimensions.astro


- [ ] FIX: /best-big-and-tall-office-chairs/ | Add ItemList + AggregateRating JSON-LD schema wrapping all chair picks (ListItem with url, name, position properties). Add use-case badge labels to each chair entry (e.g., "Best for All-Day Corporate Use", "Best for Home Office on a Budget", "Best for Very Tall Users 6'5"+"). | Competitor gap: Forbes's "Best Big And Tall Office Chairs" is cited by the AIO on "ergonomic chairs for tall people" — TCA is not. Missing ItemList schema makes TCA ineligible for Top Picks carousel rich results. This is the page with 291 buyer-intent impressions and the highest affiliate capture gap score. Schema is a technical fix, not a content edit — cooldown does not apply per cadence rules. | FILE: src/pages/best-big-and-tall-office-chairs.astro

- [ ] FIX: /knee-pain-seat-depth/ | Expand the "Adjustable Seat Depth vs Fixed Seat Depth" section intro from its current ~73 characters to 150–200 words explaining why this distinction is the decision gate for tall users — frame it as: "Once you have your minimum seat depth measurement, the next question is whether a given chair can actually deliver it — and that depends entirely on whether it has a seat slider." Then add one FAQ entry: "Why do I keep shifting or crossing my legs at my desk?" with an answer citing the Cornell fidgeting-as-discomfort-index concept and redirecting to the seat-depth measurement method. | Highest opportunity score on site (13,559) at pos 5.7 with 38,644 impressions. AIO capsule already inserted. Content expansion — not a meta change — is the correct lever here per confirmed diagnosis. The structural gap (73-char section intro) was flagged by competitor intelligence vs. Forbes. FAQ addition targets a long-tail variant that could drive AIO citation. | FILE: src/pages/knee-pain-seat-depth.astro


---

## NEW CONTENT (Friday agent)


<!-- Roadmap is empty per content roadmap note. No new slugs queued. Generating one net-new topic based on GSC gap analysis. -->

- [ ] NEW: Ergonomic Chair Dimensions Guide for Tall People — The Three-Number Rule | ergonomic chair dimensions tall people | /ergonomic-chair-dimensions-tall-people/ | Answer-first guide targeting "ergonomic chair dimensions" gap (TCA at pos 18.9 vs dimensions.com at pos 2). Opens with exact minimums for users 6'0"–6'7" (seat height, seat depth, back height), names the "Three-Number Rule" framework for AI Overview citation eligibility, includes a per-height-bracket spec table, and links to /correct-chair-dimensions/ and /office-chairs-for-tall-people/ as the deeper resources. Research-voice only — no personal testing claims. Amazon links must include tag=tallchairadvi-20.

---

## REWRITES (Thursday agent, lower priority)


---

## STRATEGY NOTES

This week's focus is **AIO citation eligibility and content depth on the two highest-leverage pages**: /knee-pain-seat-depth/ (38K impressions, pos 5.7, 0.05% CTR) and /correct-chair-dimensions/ (17K impressions, pos 9.6), both of which are suppressed by AI Overviews citing Forbes and not TCA. The fixes prioritize named, quotable frameworks ("The Three-Dimension Rule") and structured spec tables — the two content formats Google's AIO system preferentially extracts — rather than meta rewrites, which the confirmed April 22 SERP diagnosis showed are ineffective against AIO suppression. The /best-big-and-tall-office-chairs/ schema fix is the only pure-technical action this week and addresses the site's largest affiliate capture gap (291 buyer-intent impressions) with a lever that requires no cooldown override. The new content entry targets the "ergonomic chair dimensions" query cluster where TCA ranks at position 18.9 and a non-authoritative domain holds position 2 — a winnable gap that also reinforces the Three-Dimension Rule framework being inserted into /correct-chair-dimensions/ this same week.

## DROPPED TASKS (enforcement log — not for execution)

- [cooldown: src/pages/office-chairs-for-tall-people.astro edited within 14d] - [ ] FIX: /office-chairs-for-tall-people/ | Restructure the "Which Chair Is Bes
- [cooldown: src/pages/chairs/herman-miller-aeron/tall-people.astro edited within 14d] - [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Add a direct comparison sp
- [no FILE ref] - [ ] REWRITE: Best Office Chair for 6'5" Tall People — Fit-Verified Picks | office chair for 6 foot
- [cooldown: src/pages/review/gesture.astro edited within 14d] - [ ] REWRITE: /review/gesture/ | Add a direct comparison table in the Alternati
