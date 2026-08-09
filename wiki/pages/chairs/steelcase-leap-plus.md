---
type: entity
entity: chair
last_updated: 2026-08-06
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/misc/2026-03-07-session-context.md, data/gsc/latest.json, "https://www.steelcase.com/content/uploads/2020/10/Seating-Leap-Seat.pdf"]
tags: [chair, steelcase, leap-plus, research-based]
---

# Steelcase Leap Plus

**Research-based content only.** Jackson has NOT tested this chair. Content voice: "I almost bought the Leap Plus — here's the spec analysis that drove my decision toward the Gesture."

## Key Specs

| Spec | Value |
|------|-------|
| Seat depth | 15.75"–19.75" (4" range — best in class) |
| Seat height (standard cylinder) | 15.5"–19.5" (4" range — **default configuration**) |
| Seat height (optional 5" cylinder, ~$63) | 17.5"–22.5" (floor rises with the ceiling) |
| Back height | 25.5" |
| Weight capacity | 500 lbs |
| Seat width | 22" |

Seat height source: [Steelcase Seating Specification Guide — Leap (Oct 2020 PDF)](https://www.steelcase.com/content/uploads/2020/10/Seating-Leap-Seat.pdf), corroborated by the 2017 edition.

**Reference points:** standard Leap / Leap v2 = 15.5"–20.5" standard, 17"–24" optional. Gesture = 21" standard. Aeron Size C = 16"–20.5", hard limit.

**For tall users:** Deepest seat depth max (19.75"), tallest back, highest weight capacity. On seat height the answer is conditional: **with the optional 5" cylinder it reaches 22.5" — the highest ceiling of any mainstream chair. At its default 19.5" ceiling it is LOWER than both the Gesture (21") and the Aeron C (20.5").** The cylinder must be specified at order time. Any content recommending the Leap Plus above ~6'2" must state the cylinder requirement.

✅ **Contamination cleared 2026-08-09.** The false "15.5"–22.5" / 7-inch range / standard" claim was published across 29 files (146 individual statements). All corrected. `scripts/lint-content.mjs` now fails the build on any unqualified `22.5"` seat-height claim and bans the fabricated range outright, reading `data/chair-specs.json` as the canonical source — so this class cannot propagate again. Verified against the **rendered** HTML, not just the source.

## Site Pages (May 11 GSC)

### /review/leap-plus/
- **Blog audit score:** 76/100 (Acceptable)
- **GSC (May 11):** 1,046 impr, pos 8.5, 0.29% CTR, 3 clicks
- **Schema open issue:** `itemReviewed` missing from Review node — blocks rich results. Product `@id` also missing. See [[schema-markup]].
- **Meta (May 10):** 170 chars — over limit. Needs trim to ≤155. See [[meta-descriptions]].
- **C2 queued (future week):** Reframe opening as "I almost bought this — here's the spec analysis that drove my decision toward the Gesture." Adds first-person narrative framing without false testing claim.

### /chairs/steelcase-leap-plus/ (hub)
- **AggregateRating:** Status unknown — may be empty `{}`. Needs verification.

### /chairs/steelcase-leap-plus/seat-height/
- **Meta fixed (Mar 30):** 166→133 chars ✅

### /chairs/steelcase-leap-plus/tall-people/
- **GSC (May 11):** 481 impr, pos 8.6, 0% CTR, 0 clicks — CRITICAL threshold met (400+, pos ≤10, 0 clicks). Cooldown bypass applies.

### /chairs/steelcase-leap-plus/weight-limit/
- **404 fixed (Apr 3):** Now HTTP 200 ✅
- **Not yet indexed** (per index-monitor May 11).

## Competitive Position

- BTOD is the primary competitor for "steelcase leap plus review" — they're an authorized dealer
- TCA angle: height-specific analysis (BTOD focuses on weight capacity)

## History

| Date | What changed |
|------|-------------|
| 2026-03-07 | Cluster hub + seat-height + tall-people created |
| 2026-03-30 | seat-height meta fixed |
| 2026-04-03 | weight-limit 404 confirmed fixed |
| 2026-05-11 | /tall-people/ hit CRITICAL threshold (481 impr, 0 CTR) — strategy agent should flag |
| 2026-08-06 | **Factual spec correction.** Site claimed Leap Plus seat height was "15.5"–22.5", a 7-inch range, standard/out of the box." That configuration does not exist — it welded the standard cylinder's minimum (15.5") to the optional cylinder's maximum (22.5"). Corrected to 15.5"–19.5" standard / 17.5"–22.5" with the optional 5" cylinder (~$63), per the Steelcase Seating Specification Guide. Also corrected the inverted claim that the Leap Plus has the highest max seat height of any mainstream chair (false at default config — it is lower than Gesture and Aeron C) and the backwards Leap→Leap Plus comparison ("seat height increases from 20" to 22.5""; in fact the Plus is 1" *lower* at default). Fixed in `/review/leap-plus/` and `/chairs/steelcase-leap-plus/seat-height/`; `/chairs/herman-miller-aeron/tall-people/` fixed in parallel by another session. ~31 further pages still carry the wrong figure — see the contamination note above. |
| 2026-08-09 | **B11 closed — the remaining 29 files corrected, and the cause fixed.** The 2026-08-06 pass fixed 2 pages; a deterministic gate found **146 statements across 29 files**, not the ~31 files hand-counted, and showed `/chairs/steelcase-leap-plus/seat-height/` still carried one unqualified claim in an FAQ *question* feeding its JSON-LD. Recommendations kept but made conditional on ordering the optional 5" cylinder. Worst individual finds: `/chairs/steelcase-leap-plus/` claimed "22.5" as standard, with no aftermarket modifications required"; `/chairs/steelcase-leap-plus/tall-people/` had a stat card reading "15.5"–22.5" — Highest of the three top chairs… **as standard**. No dealer configuration needed"; `/review/gesture/`'s SVG chart plotted 22.5" against the other two chairs unqualified. **Cause fix:** `data/chair-specs.json` (canonical, every figure carrying its primary source) + a `guarded` rule in `lint-content.mjs` — a value true only in a non-default configuration must carry its qualifier, and the fabricated range fails the build. Same argument `verified-asins.json` makes about hallucinated ASINs. Also corrected here: a first-person claim about a chair Jackson has never sat in, and a 28.0" back height contradicting the 25.5" used everywhere else. |

## Links

- [[steelcase-gesture]] — Jackson chose Gesture over this
- [[herman-miller-aeron]] — third comparison point
- [[schema-markup]] — itemReviewed + Product @id missing
- [[meta-descriptions]] — /review/leap-plus/ at 170 chars, over limit
