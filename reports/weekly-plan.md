# Weekly Plan — 2026-04-10

## FIXES (Thursday agent)

- [ ] FIX: /review/gesture/ | Confirm 301 redirect exists from `/review/gesture` (no trailing slash) → `/review/gesture/`; if missing, add redirect rule in Astro config/netlify.toml so the 153 ghost impressions consolidate into the canonical URL | Duplicate URL pair splitting 802 combined impressions across two GSC entries, killing unified authority on the flagship review | FILE: netlify.toml (or astro.config.mjs redirect rules)

- [ ] FIX: /aeron-vs-gesture/ | Confirm 301 redirect exists from `/aeron-vs-gesture` (no trailing slash) → `/aeron-vs-gesture/`; verify canonical tag on the slash version points to itself | Same trailing-slash split as Gesture review — 304 combined impressions across two entries; the slash version has 0 clicks despite pos 7.5 and the non-slash version has 1 click at pos 8.4, meaning Google is confused about which to serve | FILE: netlify.toml (or astro.config.mjs redirect rules)

- [ ] FIX: /chairs/herman-miller-aeron/tall-people/ | Rewrite meta description to verdict-first format, e.g. "The Aeron fits tall people only in Size C — here's exactly which dimensions work for 6'2\"–6'6\" and where it falls short." Keep under 155 chars. | 440 impressions, pos 7.3, 0% CTR — CRITICAL threshold (400+ impr, pos ≤10, 0 clicks). In cooldown but this qualifies for the technical/CTR-critical override. Meta currently buries the verdict behind a spec caveat. | FILE: src/pages/chairs/herman-miller-aeron/tall-people.astro

- [ ] FIX: /review/leap-plus/ | Rewrite meta description to verdict-first format under 155 chars, e.g. "The Leap Plus fits tall people up to 6'6\" — but only if you need weight capacity over 400 lbs. Here's the spec breakdown." Current meta is 170 chars and leads with features, not verdict. Also check title tag for tall-specific hook. | 102 impressions, pos 8.9, 0% CTR — crosses the 100-impression floor; positionally actionable; meta over-length is a confirmed technical failure mode | FILE: src/pages/review/leap-plus.astro

- [ ] FIX: /review/gesture/ | Add Article + BreadcrumbList + AggregateRating schema to the page head. Product schema with tall-specific description ("ergonomic chair for tall people 6'+"). Do NOT alter body content (in cooldown). | 649 impressions at pos 10, 0.15% CTR — schema is confirmed absent per competitor gap analysis; ChairsFX at lower positions steals CTR via rich results; this is a pure technical add, not a content rewrite, so cooldown does not block it | FILE: src/pages/review/gesture.astro

---

## NEW CONTENT (Friday agent)

- [x] NEW: "Best Office Chairs for Tall People — The 6'+ Fit Guide" | `best office chairs for tall people` / `office chair for 6 foot person` | /office-chairs-for-tall-people/ | **WAIT — page is in cooldown (recently edited).** Do NOT republish. Instead, use this slot for the standing desk page below.

- [x] NEW: Standing Desk Height Guide for Tall People | `standing desk height tall people` / `standing desk for 6 foot person` | /standing-desk-height-tall-people/ | **WAIT — page is in cooldown (recently edited).** Flagged as unwritten in every audit since March but now appears in the recently-edited list — confirm whether the published version is live and indexed before scheduling a rewrite.

> **Friday agent note:** Both highest-priority new content targets (`/office-chairs-for-tall-people/` and `/standing-desk-height-tall-people/`) are in the recently-edited list. If both are confirmed live and indexed, **no new page is needed this week** — the content gap is filled. If either is a stub/placeholder under 800 words, flag it for next week's REWRITE queue after the 14-day cooldown expires (≈ April 24).

- [x] NEW: "Herman Miller Aeron Size C vs Size B — Which Fits Tall People?" | `herman miller aeron size c tall people` / `aeron size c vs b height` | /chairs/herman-miller-aeron/size-guide/ | Research-voice only (Jackson has not tested the Aeron). Cover: seat height range by size, seat depth, back height, lumbar position for 6'+ users, height bracket verdict table (6'0"–6'3" → Size B or C?, 6'4"+ → Size C only?). Internal links from /chairs/herman-miller-aeron/tall-people/, /review/aeron-size-c/, /aeron-vs-gesture/. Target AI Overview citation with answer-first lede: "For users 6'2\" and taller, the Herman Miller Aeron Size C is the only viable fit — here's why." Include comparison table of seat dimensions. ~1,200–1,500 words. Affiliate link to Aeron Size C on Amazon with tag=tallchairadvi-20.

---

## REWRITES (Thursday agent, lower priority)

*No rewrites scheduled this week.* All pages with sufficient impression signal (300+) are either in cooldown or already covered by the FIXES above. The `/correct-chair-dimensions/` page (532 impressions, pos 23.4) is in cooldown — add to rewrite queue for the week of April 24 once cooldown expires. At position 23 it needs a full structural overhaul (height-bracket measurement table, tall-person-specific angle, internal links from Gesture and Aeron pages), not just a meta fix.

---

## STRATEGY NOTES

This week's priority is eliminating the structural authority bleed before touching content. The two trailing-slash redirect fixes are the highest-leverage actions on the site: consolidating the Gesture review's 802 split impressions into a single URL could move it from position 10 to 8–9 without writing a single word. The Aeron tall-people meta rewrite and Leap Plus meta rewrite address the 0%-CTR-at-position-7-9 crisis that has now persisted across two audit cycles. The one new content piece (Aeron Size C vs B guide) fills a confirmed gap in the Aeron sub-page architecture that competitor analysis flagged as a topical authority hole, and it supports the already-ranking comparison pages (/aeron-vs-gesture/, /review/aeron-size-c/) via internal linking. No rewrites are scheduled because the cooldown list covers virtually every page with actionable signal — the correct move is to let the recently-edited pages accumulate impressions for two more weeks before touching them again.