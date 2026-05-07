# Weekly Plan — 2026-04-14

## FIXES (Thursday agent)
<!-- Max 5 fixes. Each fix must specify the exact file path and what to change. -->

- [x] FIX: /review/gesture/ | Implement 301 redirect from `/review/gesture` (no trailing slash) → `/review/gesture/` at server/CDN level in netlify.toml redirect rules; do NOT rely on canonical tag alone — it is a hint, not a directive | 130 ghost impressions splitting crawl equity from the canonical (896 impr, pos 9.2); consolidating will unify authority on the flagship review and is a pure technical fix not subject to cooldown | FILE: netlify.toml

- [x] FIX: /aeron-vs-gesture/ | Implement 301 redirect from `/aeron-vs-gesture` (no trailing slash) → `/aeron-vs-gesture/` in netlify.toml redirect rules | 114 impressions confirmed splitting from canonical in same duplicate-URL pattern as /review/gesture/; pure technical fix | FILE: netlify.toml

- [x] FIX: /review/aeron-size-c/ | Rewrite meta description to verdict-first format — lead with the explicit verdict for tall people (e.g., "Size C fits most 6'0"–6'3" users: seat height reaches 20.5", depth adjusts to 18.5". Here's whether it works for your height."); remove filler phrase "in-depth" | 130 impressions, pos 7.3, 0 clicks — exceeds the 400+ impr / pos ≤10 / 0 clicks CRITICAL threshold when combined with the non-trailing-slash duplicate row; meta is the confirmed failure mode per audit | FILE: src/pages/review/aeron-size-c.astro

- [x] FIX: /chairs/steelcase-gesture/ | Rewrite meta description from table-of-contents framing to verdict-first hook for tall users — lead with the key fit verdict (e.g., "The Gesture fits up to 6'6" per Steelcase specs: seat height to 21", depth to 17.5". Full tall-person breakdown inside."); ensure title tag is under 60 chars | 163 impressions, pos 9.9, 0 clicks; audit flags meta as "a table of contents, not a hook" — this is the confirmed failure mode, not a positional problem at pos 9.9 | FILE: src/pages/chairs/steelcase-gesture/index.astro

- [x] FIX: /knee-pain-seat-depth/ | Rewrite title tag to ≤60 chars and rewrite meta description to lead with the fix/answer, not the problem — target searchers looking for seat depth solutions, not "knee brace" queries; example title: "Seat Depth & Knee Pain: The Fix for Tall People" | 292 impressions, pos 9.2, 0 clicks; audit identifies title overlength and meta not leading with fix as the primary failures; 292 impressions is actionable signal | FILE: src/pages/knee-pain-seat-depth.astro

---

## NEW CONTENT (Friday agent)

- [ ] NEW: Wrist Pain & Armrest Height for Tall People | armrest height tall people wrist pain | /wrist-pain-armrest-height/ | Answer-first structure: lead with the spec formula (armrest height = seated elbow height ± 1"), explain why standard armrests are too low for 6'+ users, include a height-bracket table (6'2"–6'7" → recommended armrest height range), cover the Gesture's PivotPro arms specifically (Jackson personally tested — first-person voice permitted), compare Aeron and Leap Plus armrest specs in research voice only; target AI Overview citation with an explicit Quick Answer box at top; must score 80+ on /blog-analyze before publishing

---

## REWRITES (Thursday agent, lower priority)

- [x] REWRITE: /best-office-chairs/ | Add a Height-Bracket Verdict Table section — format: "At 6'X → min seat height ≥X", min seat depth ≥X" → Passing chairs: [list with Amazon affiliate links tag=tallchairadvi-20]" covering 6'0"–6'7" brackets; highest AI Overview citation probability on site | FILE: src/pages/best-office-chairs.astro

---

## STRATEGY NOTES

The week's focus is **CTR consolidation + AI Overview surface area expansion.** The duplicate-URL redirect fixes (Fixes 1–2) are the highest-leverage technical actions on the board — consolidating ~244 split impressions into their canonicals will strengthen the two most commercially important pages without requiring any content work. The meta rewrites (Fixes 3–5) execute the verdict-first pattern that has been prescribed since the April 3 audit but never shipped; six weeks of delay on this is the single most glaring execution gap in the log. The Height-Bracket Verdict Table is prioritized as new content because it is the highest AI Overview citation candidate on the site and lives on the money page — if it ships and gets cited, it directly serves the affiliate revenue path.