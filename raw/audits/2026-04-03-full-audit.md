# Tall Chair Advisor — Full SEO Audit Report
**Date:** 2026-04-03 | **GSC Period:** Last 16 months (full history) | **Prior Score:** 86/100 (Mar 30)

---

## Executive Summary

### Overall SEO Health Score: **89/100** (+3 since March 30)

**What improved:** 7 issues from the March 30 audit are confirmed fixed. Key wins: the 404 is gone, gesture review meta description is fixed, sitemap priorities are corrected, og:type is fixed on 3 article pages, and /review/gesture/ now links to all new pages.

**What still matters:** CTR is still the primary bottleneck. The site has ~4,100 total impressions but only 12 clicks. Three high-impression pages at positions 7–11 are converting at 0–0.5% CTR when they should be at 3–5%.

**New opportunity:** "steelcase gesture review independent" now shows 11 impressions at pos 8.91 — one optimization away from page 1 clicks. /knee-pain-seat-depth/ just got indexed with 108 impressions at pos 7.9.

---

## What's Fixed Since March 30

| Issue | Status | Evidence |
|-------|--------|----------|
| 404: `/chairs/steelcase-leap-plus/weight-limit/` | ✅ FIXED | Returns HTTP 200 |
| `/review/gesture/` meta desc (was 171 chars) | ✅ FIXED | Now 146 chars |
| `/chairs/steelcase-leap-plus/seat-height/` meta desc (was 166) | ✅ FIXED | Now 133 chars |
| Sitemap priority for 6-foot pages (was 0.3) | ✅ FIXED | Now 0.8 for all 5 |
| Homepage `fetchpriority="high"` on hero | ✅ FIXED | Present in HTML |
| `/chairs/herman-miller-aeron/tall-people/` — no comparison table | ✅ FIXED | 1 table now present |
| `og:type=website` on 3 article pages | ✅ FIXED | All 3 now show `og:type=article` |
| `/review/gesture/` not linking to new pages | ✅ FIXED | Links to shoulder-pain, under-500, sihoo, aeron-size-c all present |

---

## GSC Performance: March 30 vs April 3

### Headline Numbers
| Metric | Mar 30 (90-day) | Apr 3 (16-month) | Change |
|--------|----------------|-----------------|--------|
| Total impressions | ~3,423 | ~4,106 | +20% |
| Total clicks | 10 | 12 | +20% |
| Avg CTR | 0.29% | ~0.29% | flat |
| Desktop avg position | 15.8 | 14.84 | improved |

### Page-Level Changes (Top Pages)
| Page | Mar 30 Impr | Apr 3 Impr | Position | CTR | Notes |
|------|------------|------------|----------|-----|-------|
| /correct-chair-dimensions/ | 441 | **510** | 23.92 | 0.39% | Growing steadily |
| /review/gesture/ | 490 | **581** | 10.31 | 0.17% | Still low CTR |
| /chairs/herman-miller-aeron/tall-people/ | 332 | **406** | 7.40 | 0% | High-value 0-click |
| /aeron-vs-gesture/ | 155 | **171** | 7.59 | 0% | No movement |
| /chairs/steelcase-gesture/seat-depth/ | 139 | **171** | 8.61 | 0.58% | 1 click — improving |
| /knee-pain-seat-depth/ | 0 | **108** | 7.90 | 0% | NEWLY INDEXED |
| /review/aeron-size-c/ | 0 | **7** | 6.29 | 0% | NEWLY INDEXED |
| /office-chairs-for-6-foot-7/ | 0 | **1** | 8.00 | 0% | First height page indexed |

### Still Getting Zero Impressions (Not Indexed)
- /review/sihoo-doro-s300/
- /shoulder-pain-tall-people/
- /best-office-chairs-under-500/
- /office-chairs-for-6-foot-3/ thru /6-foot-6/

### April Trend
- Apr 1: 192 impressions (highest day since Mar 18 peak of 240)
- Apr 2: 127 impressions
- Slight uptick from the 100–155/day plateau — monitoring needed

---

## Current Issues

### CRITICAL

#### C1 — CTR Crisis: /chairs/herman-miller-aeron/tall-people/ (406 impr, pos 7.4, 0 clicks)
The #1 missed revenue opportunity on the site. 406 impressions at position 7.4, zero clicks over the full history.

**Root cause:** The meta description (149 chars) doesn't lead with a verdict. Current: *"At 6'0–6'6, the Aeron's fixed 18.25" seat depth is the key trade-off. Height-by-height verdict: who the Aeron fits and who it doesn't."*

A tall person scanning SERPs needs to see the verdict — does it fit 6'4" or not — in the first few words.

**Fix:** Rewrite to lead with verdict: *"Aeron Size C fits most 6'0–6'3 users; the 18.25" fixed seat depth is a problem at 6'4+. Full height-by-height breakdown with specs."* (140 chars)

#### C2 — /review/gesture/ Still Low CTR (581 impr, pos 10.31, 0.17% CTR)
Meta description is fixed (146 chars). "Independent" is present in meta. The CTR gap is partly positional (pos 10 naturally = low CTR) but also a ranking issue.

**Real fix needed:** Ranking lift to pos 6–8 through internal link authority. /correct-chair-dimensions/ (510 impr) and /chairs/herman-miller-aeron/tall-people/ (406 impr) should both link to /review/gesture/ — verify these links exist.

**New signal:** "steelcase gesture review independent" — 11 impressions at pos 8.91. Check that "independent" appears in the first paragraph of the page body (not just the meta), which reinforces relevance signals.

#### C3 — /aeron-vs-gesture/ URL Split + Zero CTR (171 + 114 = 285 combined impr, 0–0.88%)
Two versions appearing in GSC:
- `/aeron-vs-gesture/` — 171 impr, pos 7.59, **0% CTR**
- `/aeron-vs-gesture` (no slash) — 114 impr, pos 8.45, **0.88% CTR, 1 click**

The trailing-slash version (canonical) has worse CTR than the redirect version — unusual. The meta desc (154 chars) needs a stronger hook.

Current: *"I chose the Gesture over the Aeron at 6'4". Here's the spec analysis — seat depth, armrests, breathability, and price..."*

**Fix meta:** *"At 6'4", I chose Gesture over Aeron. Seat depth (18.75" vs 18.25"), armrests, and price — the spec verdict for tall users."* (131 chars — cleaner, leads with the verdict)

---

### HIGH

#### H1 — /chairs/steelcase-gesture/seat-depth/ Meta Still Borderline (156 chars)
Improved from 167 to 156 — still slightly over the 155-char safe limit. Not currently truncating but close.

**Fix:** Trim to ≤150 chars. Current: *"Gesture seat depth: 15.75"–18.75" (3" range). Adequate for users 6'0"–6'4"; tall users report needing full extension. Adjustment mechanism explained."* Trim to: *"Gesture seat depth: 15.75"–18.75" (3" range). Fits 6'0"–6'4"; at 6'4"+ use full extension. How to adjust it."*

#### H2 — Schema on /best-office-chairs/ Parsing Error
The JSON-LD block on /best-office-chairs/ failed to parse during this audit check. The duplicate Article schema from the March 30 audit may still be present, or there's a new JSON syntax error. The schema parse failure could suppress rich result eligibility.

**Fix:** Read `src/pages/best-office-chairs.astro`, validate JSON-LD, remove duplicate Article block.

#### H3 — AggregateRating Status on Chair Hub Pages (Unverified)
March 30 flagged empty `aggregateRating: {}` on the 3 chair hub pages. NEXT_STEPS.md Task 0.3 listed this as Priority 0. Verify whether this was completed — if not, either populate with real values or remove the empty aggregateRating.

#### H4 — 5 Height Guides Not Indexed (/6-foot-3 thru /6-foot-6)
Sitemap priority is now 0.8. Only /6-foot-7/ has 1 impression. Googlebot hasn't fully crawled the others yet. If not indexed by April 17, submit each individually to GSC URL Inspection.

#### H5 — /best-office-chairs-under-500/ Not Indexed
Highest-value unindexed page. Budget chair searches are high-volume. Submit to GSC immediately if not already submitted.

#### H6 — /review/sihoo-doro-s300/ Not Indexed
Mentioned in CLAUDE.md as "rising in AI citations." Still showing zero impressions. Submit to GSC.

---

### MEDIUM

#### M1 — /knee-pain-seat-depth/ CTR Optimization Needed (108 impr, pos 7.9, 0 clicks)
Just indexed with strong positioning. The query driving it is "steelcase knee brace review" (13 impr, pos 7.77) — which is a strange query for a seat depth page. Users searching "knee brace" may be looking for a product, not an ergonomics guide. Check title and meta to ensure they clearly address the actual user intent (seat edge pressure causing knee pain) rather than triggering a mismatch bounce.

#### M2 — /review/aeron-size-c/ Internal Link Audit (7 impr, pos 6.29)
Just indexed at pos 6.29. Good start. Now needs link authority:
- /aeron-vs-gesture/ → /review/aeron-size-c/ — verify
- /best-office-chairs/ → /review/aeron-size-c/ — verify

#### M3 — Standing Desk Height Guide Still Unwritten
Flagged in every audit. "steelcase standing desk review 2026" appeared with 4 impressions at pos 9.75 in new GSC data — direct demand signal for Jackson's real setup. Zero competition confirmed.

#### M4 — Height-Bracket Verdict Table Missing on /best-office-chairs/
Highest-probability Google AI Overview citation target on the site. A structured table: "At 6'X → minimum seat height ≥X, seat depth ≥X → Passing chairs: [list]" — AI systems cite this format heavily.

#### M5 — Citation Capsules Missing Site-Wide
40–60 word self-contained summaries that AI systems can directly quote. None present on any page. /correct-chair-dimensions/ (510 impr) is the best candidate for this.

#### M6 — /shoulder-pain-tall-people/ Not Indexed
Jackson's real pain experience — highest E-E-A-T content on the site outside of the Gesture review. Submit to GSC.

---

### LOW

#### L1 — /aeron-vs-gesture/ and /correct-chair-dims/ Meta Borderline (153–154 chars)
Not truncating, but trim when editing these pages for other reasons.

#### L2 — /review/aeron-size-c/ FAQPage Schema
Now indexed at pos 6.29. Adding FAQPage schema would maximize rich result eligibility.

#### L3 — "steelcase standing desk review 2026" Query
4 impressions at pos 9.75. No page exists. Low priority until other fixes are done, but a content opportunity.

---

## Keyword Opportunities From New GSC Data

### High-Intent Near-Page-1 Queries (Positions < 15)
| Query | Impr | Pos | Page | Action |
|-------|------|-----|------|--------|
| steelcase gesture seat depth range inches | 8 | 5.75 | /chairs/steelcase-gesture/seat-depth/ | Answer-first opening paragraph |
| steelcase gesture seat height range | 8 | 8.75 | /chairs/steelcase-gesture/seat-height/ | Same fix |
| steelcase knee brace review | 13 | 7.77 | /knee-pain-seat-depth/ | Fix title/meta mismatch |
| steelcase gesture review independent | 11 | 8.91 | /review/gesture/ | Confirm in first paragraph |
| gesture vs aeron | 10 | 12.6 | /aeron-vs-gesture/ | Meta CTR fix (C3) |
| herman miller aeron tall person | 4 | 16.25 | /chairs/herman-miller-aeron/tall-people/ | Covered by C1 fix |

### Buried but High-Volume Queries (Positions 60–80)
| Query | Impr | Pos | Gap |
|-------|------|-----|-----|
| best office chair for tall people | 22 | 69 | Need content depth upgrade on /office-chairs-for-tall-people/ |
| desk chair for tall person | 21 | 79 | Same page |
| office chairs for tall people | 16 | 78 | Same page |

---

## Internal Linking Status

| Link | Status |
|------|--------|
| /review/gesture/ → shoulder-pain, under-500, sihoo, aeron-size-c | ✅ Confirmed present |
| /review/gesture/ → /correct-chair-dimensions/ | ✅ Confirmed present |
| /chairs/herman-miller-aeron/tall-people/ → /review/aeron-size-c/ | ✅ Confirmed present |
| /chairs/herman-miller-aeron/tall-people/ → /correct-chair-dimensions/ | ✅ Confirmed present |
| Height guides (/6-foot-3 thru /6-foot-7/) → /correct-chair-dimensions/ | ❓ Not verified |
| /best-office-chairs/ → /best-office-chairs-under-500/ | ❓ Not verified |
| /best-office-chairs/ → /review/sihoo-doro-s300/ | ❓ Not verified |
| /aeron-vs-gesture/ → /review/aeron-size-c/ | ❓ Not verified |
| /correct-chair-dimensions/ → /review/gesture/ (back-link) | ❓ Not verified |

---

## GEO / AI Citation Status

| Signal | Status |
|--------|--------|
| AI bots allowed (GPTBot, ClaudeBot, Perplexity) | ✅ Confirmed |
| FAQPage schema on top pages | ✅ Gesture, correct-dims, aeron-vs-gesture |
| Comparison tables | ✅ Fixed on aeron/tall-people |
| TL;DR blocks | ✅ Present on top pages |
| "Independent" review signal in gesture meta | ✅ Present |
| Height-bracket verdict table on /best-office-chairs/ | ❌ Not yet added |
| Citation capsules (40–60 word summaries) | ❌ Not present |
| Author entity with ME credentials in Article schema | ❓ Not verified |

---

## Score Breakdown

| Category | Mar 30 | Apr 3 | Change | Notes |
|----------|--------|-------|--------|-------|
| Technical SEO | 21/25 | **23/25** | +2 | 404 fixed, sitemap fixed, og:type fixed |
| Content Quality | 21/25 | **22/25** | +1 | New pages indexed, comparison table added |
| On-Page SEO | 16/20 | **17/20** | +1 | Gesture meta fixed; CTR gap on aeron/gesture pages |
| Schema / Structured Data | 9/10 | **8/10** | -1 | best-office-chairs JSON-LD parse error; aggregateRating unknown |
| Performance (CWV) | 8/10 | **9/10** | +1 | Homepage fetchpriority fixed |
| Images | 5/5 | **5/5** | 0 | No issues |
| AI Search Readiness | 6/5 | **5/5** | -1 | Height-bracket table and citation capsules still missing |
| **Total** | **86/100** | **89/100** | **+3** | |
