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

⚠️ **Known contamination:** the false "15.5"–22.5" / 7-inch range / standard" claim was published across ~34 pages. Only `/review/leap-plus/`, `/chairs/steelcase-leap-plus/seat-height/` and `/chairs/herman-miller-aeron/tall-people/` are corrected as of 2026-08-06. See History.

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

## Links

- [[steelcase-gesture]] — Jackson chose Gesture over this
- [[herman-miller-aeron]] — third comparison point
- [[schema-markup]] — itemReviewed + Product @id missing
- [[meta-descriptions]] — /review/leap-plus/ at 170 chars, over limit
