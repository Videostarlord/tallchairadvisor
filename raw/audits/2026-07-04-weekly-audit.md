# TCA Weekly Audit Report
**Generated:** 2026-07-04T06:03:04.625Z
**Data range:** 2026-03-17 → 2026-06-15

# TallChairAdvisor.com — SEO Audit Report
**Audit Date:** Current Week | **Data Window:** 90 days
**Auditor:** Jackson Christopher, ME Student, UC Berkeley

---

## 1. Executive Summary

The site is showing strong structural momentum — 43,748 impressions across 20 audited pages with average position 9.2 — but is bleeding clicks at a rate that should alarm you. **109 clicks from 43,748 impressions = 0.25% sitewide CTR**, which is functionally broken for a site at this position range. The core problem splits into two distinct mechanisms: AI Overview suppression on spec/informational queries (unrecoverable via meta rewrites, confirmed pattern from prior audits), and title/meta failures on high-impression pages where rewrites *can* move the needle. Three pages — `/knee-pain-seat-depth/`, `/chairs/steelcase-gesture/`, and `/chairs/steelcase-leap-plus/seat-height/` — are collectively sitting on 2,262 impressions at positions 6.8–9.1 with near-zero CTR, representing the highest-leverage recovery targets this week. One spec discrepancy (the Leap Plus seat height title/meta conflict) is a credibility risk that needs to be fixed regardless of CTR impact.

---

## 2. Critical CTR Leaks
*Pages at position ≤ 10, 0–1 clicks, material impression volume*

| Page | Position | Impressions | Clicks | CTR | AIO Confirmed? |
|---|---|---|---|---|---|
| `/chairs/steelcase-gesture/` | 8.6 | 604 | 0 | 0% | No |
| `/chairs/steelcase-leap-plus/seat-height/` | 9.1 | 535 | 0 | 0% | Partial (title conflict) |
| `/chairs/steelcase-gesture/seat-depth/` | 8.1 | 1,123 | 1 | 0.09% | Yes (2 of 3 top queries) |
| `/fit-guides/` | 8.0 | 301 | 0 | 0% | No |
| `/aeron-vs-gesture/` | 9.1 | 495 | 1 | 0.2% | No |
| `/office-chairs-for-6-foot-4/` | 4.8 | 454 | 1 | 0.22% | Suspected |
| `/review/gesture/` | 7.9 | 6,385 | 6 | 0.09% | No |
| `/knee-pain-seat-depth/` | 6.8 | 13,347 | 13 | 0.1% | Yes (2 of 3 top queries) |

> **Note on AIO pages:** Per the statistical confidence policy and prior SERP audit findings, meta rewrites on confirmed AIO queries will not recover clicks. The strategic response for those query clusters is content restructuring to target non-AIO adjacent queries, not title/meta iteration.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C1 — Spec Discrepancy: Leap Plus Seat Height Title vs. Meta (Credibility/Trust Risk)
**Page:** `/chairs/steelcase-leap-plus/seat-height/`

The **title says `15.5"–22.5"`** but the **meta description says `15.5"–20.5"`**. These are two different numbers for the same spec on the same page. A user who reads both in the SERP sees a contradiction before clicking. This also suggests a potential content-level error that could undermine E-E-A-T on a spec-authority page.

**Verified Steelcase spec:** The Leap Plus cylinder range tops out at **20.5"** for the standard version; the 22.5" figure appears in some third-party listings and may refer to a different cylinder option or be an error introduced during content creation.

**Fix:**
1. Audit the page content against Steelcase's official spec sheet immediately.
2. Align title and meta to the confirmed number — do not guess. If 22.5" is confirmed, fix the meta. If 20.5" is correct, fix the title.
3. Proposed corrected title (assuming 15.5"–20.5" is correct, 55 chars):
   ```
   Steelcase Leap Plus Seat Height: 15.5"–20.5" Range
   ```
4. Proposed corrected meta (148 chars):
   ```
   Leap Plus seat height: 15.5"–20.5" (5" range). Fits users 5'5"–6'6". Why the 5-inch adjustment range matters more than peak height for tall users.
   ```

**Severity rationale:** A factual spec conflict in SERP snippets destroys the one thing this site is built on — spec accuracy. One user noticing this and posting about it in an ergonomics forum could cause lasting trust damage.

---

#### C2 — `/chairs/steelcase-gesture/` — 604 Impressions, 0 Clicks, No AIO Excuse
**Page:** `/chairs/steelcase-gesture/`
**GSC:** 0 clicks | 604 impr | pos 8.6

This page has no confirmed AIO suppression. The 0% CTR is a pure SERP presentation failure. The current meta is 170 characters (over the 155-char target) and leads with a spec recitation (`Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height`) — a pattern that mirrors the AI Overview content and gives no reason to click beyond what Google already surfaces.

**Current meta (170 chars — over limit):**
> Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus.

**Problem:** Opens with spec recitation. User searching "steelcase gesture for tall people" can get `6'0"–6'4", 21" seat height` from Google's own snippet. There is no hook, no verdict signal, no reason to click.

**Proposed meta rewrite (149 chars):**
```
Gesture officially fits to 6'4" — but the 18.75" seat depth ceiling is what limits taller users. Height-by-height verdict vs. Leap Plus and Aeron.
```

**Proposed title (unchanged — 54 chars, within range):**
```
Steelcase Gesture for Tall People | Tall Chair Advisor
```
Title is fine. Meta is the entire problem.

**Schema note:** Schema block uses `"@type":"Article"` with `"name"` field instead of `"headline"`. Article schema should use `headline`, not `name`. Fix to:
```json
"@type": "Article",
"headline": "Steelcase Gesture for Tall People: Height-by-Height Fit Analysis"
```

---

### 🟠 HIGH

---

#### H1 — `/knee-pain-seat-depth/` — Title Too Long, CTR 0.1% on 13,347 Impressions
**Page:** `/knee-pain-seat-depth/`
**GSC:** 13 clicks | 13,347 impr | pos 6.8 | CTR 0.1%

This is the **highest-impression page on the site** and the **source of the first affiliate commission**. A 0.1% CTR at position 6.8 with 13K impressions is the single largest absolute click opportunity on the site. Even moving to 1% CTR = ~133 clicks/90 days from this page alone.

**Title issue (67 chars — over 60-char limit):**
```
Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People
```
Google will truncate this. The `&amp;` entity renders as `&` in browser but should be verified it renders correctly in SERP. More critically, at 67 chars this likely truncates after "Seat Depth" on mobile, dropping the "Tall People" qualifier — the most important targeting signal.

**AIO conflict:** Two of three top queries are AIO-confirmed. The non-AIO query — `"cornell ergonomics chair seat depth two fingers behind knee"` (122 impr, pos 6.4, 0% CTR) — is the actionable target. This is a measurement/how-to query. The meta should signal a process answer, not just topic coverage.

**Current meta (144 chars — within range, but weak):**
> Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it.

The meta is functional but generic. "Here's how to measure" is passive. No specificity signal. No tall-person differentiation until the very end.

**Proposed title (58 chars):**
```
Cornell Seat Depth Rule: Knee Pain Fix for Tall People
```

**Proposed meta (151 chars):**
```
Cornell's rule: seat edge 2" behind your knee crease. At 6'2+, most chairs fail this test. Measure your fit in 60 seconds — chair recommendations by height.
```

**Content action:** This page needs internal links pushing toward `/correct-chair-dimensions/` and the Leap Plus review (the Leap Plus was the converting chair context per prior commission data). Add a "chairs that pass the Cornell test at 6'2+" section if not present.

---

#### H2 — `/review/gesture/` — 6,385 Impressions, 0.09% CTR, Meta Over Limit
**Page:** `/review/gesture/`
**GSC:** 6 clicks | 6,385 impr | pos 7.9 | CTR 0.09%

This is Jackson's only first-person tested chair — the page should be the highest E-E-A-T asset on the site. 0.09% CTR on 6,385 impressions is a failure.

**Meta issue (158 chars — over 155-char limit):**
> Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.

At 158 chars this will truncate in SERPs, cutting off the most persuasive part ("who it doesn't" — the honesty signal). The meta also front-loads credentials before the verdict. Searchers scanning results want to know what they'll learn, not who wrote it.

**Proposed meta (153 chars):**
```
Seat depth maxes at 18.75" — the Gesture fits 6'1"–6'3" well but gets tight above that. First-hand verdict from a 6'4" owner on fit, armrests, and back height.
```

Wait — that's 161 chars. Revised:

**Proposed meta (148 chars):**
```
Seat depth maxes at 18.75": fits 6'1"–6'3" well, gets tight above that. 6'4" owner verdict on fit, armrests, and back height. Who it fits and who it doesn't.
```

Check: "Seat depth maxes at 18.75": fits 6'1"–6'3" well, gets tight above that. 6'4" owner verdict on fit, armrests, and back height. Who it fits and who it doesn't." = 158 chars. Tighten:

**Proposed meta (final, 147 chars):**
```
Seat depth maxes at 18.75" — fits 6'1"–6'3", gets tight above that. Verdict from a 6'4" owner: armrests, back height, and who should look elsewhere.
```

**Schema note:** Product schema is correct type for a review page. Verify `review` and `aggregateRating` sub-properties are populated — if this page has a star rating or verdict score, it should be marked up to potentially trigger rich snippets.

---

#### H3 — `/correct-chair-dimensions/` — Title 73 Chars, Position 10.8 Trending Borderline P1
**Page:** `/correct-chair-dimensions/`
**GSC:** 10 clicks | 6,689 impr | pos 10.8 | CTR 0.15%

At position 10.8 this page is one position push from page 1 meaningful traffic. The title at 73 chars will truncate — Google typically cuts around 60 chars. The visible title in SERPs is likely showing as:
> `Correct Office Chair Dimensions for Tall People: Req…`

The word "Required" is being cut, which weakens the authority signal.

**Current title (73 chars):**
```
Correct Office Chair Dimensions for Tall People: Required Specs by Height
```

**Proposed title (59 chars):**
```
Office Chair Dimensions for Tall People: Specs by Height
```

**Meta (153 chars — 1 over limit, functionally fine but worth trimming):**
Current meta is actually strong and specific. Trim by 1-2 chars:

**Proposed meta (151 chars):**
```
Office chair dimensions for tall people (6'0–6'7+): exact seat height, seat depth, and back height minimums by height. How to measure your own body.
```

**Content action:** The top leaking queries (`"standard size of a office chair"` pos 19.8, `"chair specs"` pos 19.4) are too generic to target for this site. Do not optimize for them — they're informational head terms with no tall-person intent. Focus content expansion on height-specific spec tables and internal linking from `/knee-pain-seat-depth/` and `/best-office-chairs/`.

---

#### H4 — `/review/leap-plus/` — Meta 170 Chars (Significantly Over Limit)
**Page:** `/review/leap-plus/`
**GSC:** 13 clicks | 4,226 impr | pos 8.7 | CTR 0.31%

CTR is the healthiest of the review pages, but the meta at **170 chars** is the most over-limit page in the audit. Google will truncate and auto-generate, likely discarding the carefully written spec details.

**Current meta (170 chars):**
> Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.

**Note:** This is a research-voice page (Jackson has not personally tested the Leap Plus). The meta should not imply personal testing.

**Proposed meta (152 chars):**
```
Leap Plus specs for tall users: 19.75" seat depth, 22.5" seat height, 500 lb capacity. Research-based fit breakdown for 6'0"–6'6" — who fits, who doesn't.
```

**Title (49 chars — under 50-char floor, minor):**
```
Steelcase Leap Plus Review for Tall People (2026)
```
At 49 chars this is one character under the 50-char target. Not a meaningful issue, but if rewriting anyway: `Steelcase Leap Plus Review: Tall People Fit Guide` (50 chars).

---

#### H5 — `/aeron-vs-gesture/` — Meta Implies First-Person Testing of Aeron (CRITICAL E-E-A-T Risk)
**Page:** `/aeron-vs-gesture/`
**GSC:** 1 click | 495 impr | pos 9.1 | CTR 0.2%

**Current meta (159 chars):**
> At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage. Height-by-height verdict for tall users.

**Problem:** "the Gesture won" written in implied first-person strongly suggests Jackson personally tested both chairs side-by-side. Jackson has **only personally tested the Gesture**. This meta — and potentially the page content — may be misrepresenting the basis of comparison, which is an E-E-A-T liability. If a reader or Google's quality evaluator examines this and finds no disclosure that the Aeron analysis is research-based, trust is damaged.

**Schema confirms the issue:** `"@type":"Article","headline":"Why I Chose the Steelcase