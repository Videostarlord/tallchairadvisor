# Weekly Plan — 2026-04-28

## FIXES (Thursday agent)
<!-- Max 5 fixes. Each fix must specify the exact file path and what to change. -->

- [ ] FIX: /aeron-vs-gesture/ | Add 301 redirect in netlify.toml to consolidate trailing-slash duplicate: `[[redirects]] from = "/aeron-vs-gesture" to = "/aeron-vs-gesture/" status = 301 force = true` — then verify GSC is only reporting the slash version. This consolidates 418 split impressions onto one URL. **Do NOT rewrite page content — it's on the recently-edited cooldown list; this is a technical fix only.** | C1 critical duplicate from audit — 418 impressions split across two URLs at pos ~8.3, 0.24% effective CTR | FILE: netlify.toml

- [ ] FIX: /review/leap-plus/ | Correct spec inconsistency: title tag says "22.5" seat height ceiling" but meta description says "20.5"" — align both to the verified spec (confirm against manufacturer data before editing; update whichever value is wrong). This is a trust/credibility issue visible in the SERP snippet before the user even clicks. | Spec mismatch undermines click trust at 377 impr, pos 10.1 — technical accuracy fix, not a content rewrite | FILE: src/pages/review/leap-plus.astro

- [ ] FIX: /knee-pain-seat-depth/ | Rewrite meta description only (not page content) to verdict-first format targeting "seat depth knee pain" intent, not "knee brace" queries. Example direction: "Knee pain from your office chair? If you're over 6', seat depth is almost always the cause — here's the exact measurement fix." Keep under 155 chars. | 662 impressions, pos 8.9, 0% CTR — highest-volume zero-click page on the site; the wiki confirms the root cause is query intent mismatch in the meta, not the page content itself | FILE: src/pages/knee-pain-seat-depth.astro

- [ ] FIX: /chairs/steelcase-leap-plus/tall-people/ | Rewrite meta description to verdict-first format. Example direction: "Is the Leap Plus tall-person-friendly? At 6'2"–6'5", seat height maxes at X" and seat depth reaches Y" — here's whether it fits." Keep under 155 chars. Do not touch page content (cooldown). | 204 impressions, pos 9.5, 0% CTR — new entrant to the critical CTR leak list; meta fix is the only lever available given cooldown | FILE: src/pages/chairs/steelcase-leap-plus/tall-people.astro

- [ ] FIX: /back-pain-spine-height/ | Rewrite meta description to verdict-first format targeting the informational intent. Example direction: "Back pain when sitting tall? For people over 6', standard chair backs end 2–4" below the thoracic spine — here's what that does and how to fix it." Keep under 155 chars. Do not touch page content (cooldown). | 147 impressions, pos 9.3, 0% CTR — new entrant to critical leak list; crosses the 100-impression threshold and sits at pos ≤10 | FILE: src/pages/back-pain-spine-height.astro

---

## NEW CONTENT (Friday agent)

- [ ] NEW: Herman Miller Aeron vs. Steelcase Gesture for Tall People | `office chair aeron vs gesture tall people` | `/aeron-vs-gesture-tall-people/` | Dedicated height-specific comparison page (distinct from the existing `/aeron-vs-gesture/` which is on cooldown and lacks height framing). Angle: side-by-side spec table showing seat height range, seat depth, back height, arm height max for both chairs with explicit verdicts by height bracket (6'–6'2", 6'3"–6'5", 6'6"+). Use research voice for Aeron throughout; first-person Gesture sections permitted per site rules. Answer-first structure for AI Overview citation potential. Target ~1,600 words. Must score 80+ on /blog-analyze before publish. Include Amazon affiliate links with tag=tallchairadvi-20.

- [ ] NEW: Best Office Chairs for 6'8" and Taller | `office chairs for 6 foot 8` | `/office-chairs-for-6-foot-8/` | Completes the height-bracket series (6'3 through 6'7 already exist). Angle: at 6'8"+ standard ergonomic chairs almost universally fail — content must lead with that verdict and narrow to chairs with seat height ≥22", seat depth ≥19.5", and back height ≥26". Research voice throughout (no chair in this bracket was personally tested). Structured for AI Overview citation with a spec table at the top. ~1,200 words. Must score 80+ before publish.

---

## REWRITES (Thursday agent, lower priority)

*No rewrites scheduled this week.* Every page with actionable impression volume is on the recently-edited cooldown list. The two pages most warranting a rewrite (`/review/gesture/` and `/correct-chair-dimensions/`) are both on cooldown — they were flagged in the competitor gap analysis as needing significant expansion, but editing them again this week would violate the 14-day rule and risks thrashing signal during an active ranking window. Schedule both for the **2026-05-12 plan** when cooldowns clear.

---

## STRATEGY NOTES

This week's focus is surgical: stop the SERP bleed on zero-click pages that already have visibility, and add two pages that extend proven content patterns (height-bracket guides, head-to-head comparisons) into uncovered territory. The CTR crisis is unchanged since April 3 — impressions doubled but clicks barely moved — so meta description rewrites on the three new zero-click entrants (knee-pain, leap-plus/tall-people, back-pain) are the highest-ROI actions available given that most high-impression pages are in cooldown. The aeron-vs-gesture trailing-slash fix is the one true technical quick win: consolidating 418 split impressions onto a single URL at position 8 could produce a ranking lift with zero content risk. New content prioritizes the height-bracket series completion and a height-specific Aeron vs. Gesture page that can rank independently of the cooldown-blocked existing comparison page.