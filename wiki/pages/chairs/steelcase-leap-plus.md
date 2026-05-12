---
type: entity
entity: chair
last_updated: 2026-05-11
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/misc/2026-03-07-session-context.md, data/gsc/latest.json]
tags: [chair, steelcase, leap-plus, research-based]
---

# Steelcase Leap Plus

**Research-based content only.** Jackson has NOT tested this chair. Content voice: "I almost bought the Leap Plus — here's the spec analysis that drove my decision toward the Gesture."

## Key Specs

| Spec | Value |
|------|-------|
| Seat depth | 15.75"–19.75" (4" range — best in class) |
| Seat height | 15.5"–22.5" (widest range of all reviewed chairs) |
| Back height | 25.5" |
| Weight capacity | 500 lbs |
| Seat width | 22" |

**For tall users:** Best raw specs of any chair reviewed. Highest seat height max (22.5"), deepest seat depth max (19.75"), tallest back. The "big and tall" choice.

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

## Links

- [[steelcase-gesture]] — Jackson chose Gesture over this
- [[herman-miller-aeron]] — third comparison point
- [[schema-markup]] — itemReviewed + Product @id missing
- [[meta-descriptions]] — /review/leap-plus/ at 170 chars, over limit
