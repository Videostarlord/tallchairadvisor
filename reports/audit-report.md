# TCA Weekly Audit Report
**Generated:** 2026-04-07T09:04:39.108Z
**Data range:** 2026-01-06 → 2026-04-06

# Tall Chair Advisor — Weekly SEO Audit Report
**Audit Date:** 2026-04-10 | **Data Window:** 90 days

---

## 1. Executive Summary

The site is in a deep CTR crisis: 4,443 impressions generated only 10 clicks (0.22% CTR), a regression from the 12 clicks recorded in the April 3 audit despite impression growth of ~340. Nine pages sit at position ≤ 10 with zero clicks — the canonical CTR leak pattern identified last week has not been resolved and is now wider. The most urgent structural problem is a trailing-slash duplicate pair (`/review/gesture` vs `/review/gesture/` and `/aeron-vs-gesture` vs `/aeron-vs-gesture/`) that is splitting authority and impressions across two URLs for the same content. Secondary priority is meta description rewrites on the position 7–10 zero-click pages, where verdict-absent copy continues to suppress click-through despite strong ranking.

---

## 2. Critical CTR Leaks

Pages at position ≤ 10 with 0 clicks. These are the highest-leverage targets on the site.

| Page | Impressions | Position | CTR | Primary Failure |
|---|---|---|---|---|
| /chairs/herman-miller-aeron/tall-people/ | 440 | 7.3 | 0% | Meta buries verdict; leads with spec caveat |
| /aeron-vs-gesture/ | 190 | 7.5 | 0% | "I chose" framing without payoff in 155 chars |
| /knee-pain-seat-depth/ | 178 | 8.0 | 0% | Query intent mismatch (known from Apr 3); no fix applied |
| /chairs/steelcase-gesture/tall-people/ | 125 | 8.6 | 0.8% | ⚠️ Borderline — only 1 click, watch |
| /review/leap-plus/ | 102 | 8.9 | 0% | Meta over-length (170 chars); no verdict lead |
| /back-pain-spine-height/ | 84 | 9.9 | 0% | Title too short (42 chars); meta buries the fix |
| /fit-guides/ | 69 | 8.3 | 0% | Category page with zero conversion hook |
| /chairs/steelcase-gesture/ | 123 | 10.4 | 0% | Borderline position; generic meta |

> **Note:** `/chairs/steelcase-gesture/tall-people/` at 0.8% CTR is the only position ≤ 10 page performing near acceptable range. All others require immediate action.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C1 — Duplicate URL Pairs Splitting Authority and Impressions

**Pages affected:**
- `/review/gesture/` (649 impr, pos 10, 1 click) + `/review/gesture` (153 impr, pos 11.8, 0 clicks)
- `/aeron-vs-gesture/` (190 impr, pos 7.5, 0 clicks) + `/aeron-vs-gesture` (114 impr, pos 8.4, 1 click)

**Problem:** Both URL variants are appearing in GSC separately, meaning Google is crawling and indexing (or soft-404ing) the non-canonical version. The trailing-slash version has the correct canonical tag in both cases, but the non-slash variant is still accumulating impressions and clicks independently. This splits link equity and creates cannibalisation. Combined, the Gesture review pair has 802 impressions — it should be one URL at position ~9 with unified authority.

**Fix:**
1. Confirm 301 redirect exists: `/review/gesture` → `/review/gesture/` and `/aeron-vs-gesture` → `/aeron-vs-gesture/`. Check server config or `.htaccess` — the redirects are either missing or not being followed cleanly.
2. Verify in GSC URL Inspection that `/review/gesture` returns a 301, not 200.
3. After redirect confirmation, submit the canonical URLs for re-indexing.

**Expected impact:** Consolidates ~153 + ~114 impressions back into the canonical pages, improves position signal for both.

---

#### C2 — /chairs/herman-miller-aeron/tall-people/: 440 Impressions, Position 7.3, 0 Clicks

**This is the single highest-value unfixed CTR leak on the site.** Identified in the April 3 audit with a comparison table added, but the meta was not rewritten. The fix is overdue by one week.

**Current meta (135 chars):**
> `Aeron Size C fits most 6'0–6'3 users; the 18.25" fixed seat depth is a problem at 6'4+. Full height-by-height breakdown with specs.`

**Problem:** Opens with a partial fit statement, not a verdict. A tall user scanning SERPs at 6'4" sees "fits most 6'0–6'3" and self-selects out before reaching the useful part. The meta confirms the chair's limitation but doesn't tell the user what they get by clicking.

**Rewrite (149 chars):**
> `Aeron Size C: good fit for 6'0–6'3, problematic at 6'4+ due to fixed 18.25" seat depth. Height-by-height verdict + Gesture/Leap Plus comparison.`

**Also fix title** — current title (52 chars) is functional but could be stronger:

Current: `Herman Miller Aeron Size C: Tall People Fit Analysis`
Rewrite (54 chars): `Herman Miller Aeron for Tall People: Size C Verdict`

---

#### C3 — /knee-pain-seat-depth/: 178 Impressions, Position 8.0, 0 Clicks — Intent Mismatch Unresolved

**This was flagged in the April 3 audit** as a query intent mismatch ("knee brace" searches vs. seat depth content). Zero action taken. Now 8 positions, still 0 clicks.

**Current title (70 chars — OVER LIMIT):**
`Why Your Office Chair Causes Knee Pain: Seat Depth Fix for Tall People`

**Current meta (154 chars):**
> `Seat edge pressure causes knee pain in tall people when seat depth is too shallow. How to measure the right depth for your height and which chairs fix it.`

**Problems:**
1. Title is 70 chars — truncates in SERPs at ~60 chars. Google is rewriting it or cutting it, which hurts CTR.
2. The page is ranking for queries where users want pain relief information first, chair specs second. The meta leads with mechanism (seat edge pressure) not with the user's goal (stop knee pain).
3. "Fix" in the title creates intent mismatch if the user is searching for medical causes, not chair solutions.

**Fix title (58 chars):**
`Knee Pain from Office Chairs: Seat Depth Fix (Tall People)`

**Fix meta (152 chars):**
> `Tall users (6'0+) get knee pain from chairs with shallow seat depth. Exact depth targets by height, how to measure, and which chairs eliminate it.`

---

#### C4 — /review/leap-plus/: Meta Over-Length at 170 Characters, 0 Clicks at Position 8.9

**Current meta (170 chars — 15+ chars over limit):**
> `Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.`

**Problem:** At 170 chars it is being truncated by Google in the SERP snippet, almost certainly mid-sentence. The truncation point likely cuts off before "Who fits and who doesn't" — the only verdict language — leaving a raw spec list with no call to action. Additionally, "Research-based spec analysis" is a weak opener that signals the author hasn't personally tested the chair (which is accurate — Jackson hasn't — but this framing shouldn't be the SERP hook).

**Rewrite (148 chars):**
> `Leap Plus fits tall users up to 6'6" with a 22.5" seat height and 19.75" max seat depth. Height-by-height fit verdict, specs, and who should skip it.`

**Note:** Do not use first-person voice on this page. Jackson has not tested the Leap Plus. The rewrite above is research-voice compliant.

---

### 🟠 HIGH

---

#### H1 — /aeron-vs-gesture/: Position 7.5, 0 Clicks, Meta Needs Verdict-First Rewrite

**Current meta (134 chars):**
> `At 6'4", I chose Gesture over Aeron. Seat depth (18.75" vs 18.25"), armrests, and price — the spec verdict for tall users.`

**Problem:** The meta opens with a verdict ("I chose Gesture") but doesn't complete it within the skim-readable opening clause. A user sees "I chose Gesture over Aeron" and needs to know *why that matters to them* within the same breath. The current version makes them read the whole meta to get the payoff — too much friction in a SERP scan context. Also confirmed: the non-trailing-slash duplicate (C1 above) is absorbing clicks that should land here.

**Rewrite (147 chars):**
> `Gesture wins at 6'4": deeper seat (18.75" vs 18.25"), better armrests, lower price. Full spec-by-spec comparison — Aeron only wins for 6'0–6'2 users.`

**Note:** First-person "I chose" framing is appropriate here — this is a page where Jackson's personal Gesture ownership is the credibility hook. Retain it in body copy but make the SERP snippet outcome-focused.

---

#### H2 — /back-pain-spine-height/: Title Under-Length (42 chars), Position 9.9, 0 Clicks

**Current title (42 chars):** `Back Pain From Your Chair? A Tall User Fix`

**Problem:** At 42 chars, this title wastes ~18 chars of available SERP real estate. It's also written as a question + vague noun phrase, which doesn't signal specificity. At position 9.9 this page is one ranking position from page 2 — the title needs to do more work to earn clicks when it does appear.

**Current meta (132 chars):**
> `Standard chair lumbar support hits the wrong spinal segment at 6'2+. Why tall users get back pain — and chair fixes by height range.`

The meta is actually decent — specific mechanism, height callout, implies actionable content. The title is the primary failure.

**Fix title (57 chars):**
`Office Chair Back Pain: Lumbar Fit Fix for Tall People`

**Meta:** Keep as-is (132 chars, within range, good specificity). Optionally add 20 chars to hit the 150-char target zone:

**Optional meta improvement (151 chars):**
> `Standard chair lumbar hits the wrong spinal segment at 6'2+. Why tall users get back pain and which chairs with adjustable lumbar fix it by height.`

---

#### H3 — /fit-guides/: Category Page at Position 8.3, 0 Clicks, No Conversion Hook

**Current meta (147 chars):**
> `Fit and adjustment guides for tall people choosing and setting up ergonomic office chairs. Seat depth, back height, and lumbar targeting by height.`

**Problem:** This reads as a navigation/index description, not a click-earning SERP snippet. It describes what the section *contains* rather than what the user *gets*. A user at position 8.3 scanning results needs a reason to click over a result that promises an immediate answer. Also, the title is generic.

**Fix title (55 chars):**
`Ergonomic Chair Fit Guides for Tall People (6'0–6'7)`

**Fix meta (149 chars):**
> `Seat depth, lumbar height, and seat height fit guides built for tall users 6'0–6'7. Find the exact settings for your height — no generic advice.`

---

#### H4 — /chairs/steelcase-gesture/: Position 10.4, 0 Clicks — Hub Page Underperforming

**Current meta (141 chars):**
> `Steelcase Gesture for tall users — seat height range, seat depth adjustment, fit for 6'0–6'4, and how it compares to the Aeron and Leap Plus.`

**Problem:** This is likely the hub/category page for the Gesture. At position 10.4 with 0 clicks, it's borderline page 2. The meta is a spec inventory list with no verdict or urgency. Given Jackson has personally tested this chair, a credibility signal belongs in the snippet.

**Fix meta (150 chars):**
> `Tested at 6'4": Gesture fits well up to 6'3, borderline above. Seat height, seat depth, armrest specs, and how it compares to Aeron and Leap Plus.`

**Note:** "Tested at 6'4"" is first-person voice appropriate here given Jackson's personal ownership of the Gesture.

---

### 🟡 MEDIUM

---

#### M1 — /chairs/steelcase-leap-plus/seat-height/: Title/Meta Spec Inconsistency

**Current title:** `Steelcase Leap Plus Seat Height: 15.5"–22.5" Range`
**Current meta:** `Steelcase Leap Plus seat height: 15.5"–20.5" range (5" adjustment).`

**Problem:** The title states `15.5"–22.5"` and the meta states `15.5"–20.5"`. One of these is wrong. The confirmed Leap Plus seat height range is **15.5"–22.5"** (7" adjustment). The meta is citing the standard Leap range, not the Leap Plus. This is a factual inconsistency that will erode trust if a user clicks through and finds conflicting numbers in the body copy too.

**Fix meta (153 chars — keep, just correct the spec):**
> `Steelcase Leap Plus seat height: 15.5"–22.5" range (7" adjustment). Fits users 5'5"–6'6". Why the extra height range matters for tall users.`

**Also audit the page body copy** for the same error.

---

#### M2 — /chairs/steelcase-gesture/seat-height/: Position 12.3, Generic Meta

**Current meta (134 chars):**
> `Steelcase Gesture seat height is 16-21 in. Recommended settings for 6'0-6'5, how to adjust, and comparison to the Aeron and Leap Plus.`

**Problem:** Uses inch abbreviation inconsistently (`in` vs `"`) and lacks a verdict or outcome statement. At position 12.3 it's close to the CTR-worthy range — improving the meta now sets up a click capture when it moves into page 1.

**Fix meta (148 chars):**
> `Gesture seat height: 16"–21" (5" range). Optimal settings for 6'0–6'5, step-by-step adjustment guide, and how it compares to Aeron and Leap Plus.`

---

#### M3 — /chairs/herman-miller-aeron/: Title Under-Length at 49 Chars, Position 18.9

**Current title (49 chars):** `Aeron Size C for Tall People | Tall Chair Advisor`

This page is at position 18.9 — a ranking problem more than a CTR problem at this stage. However, the title is 11 chars short of the 60-char ceiling, and the meta (142 chars) is functional but generic.

**Fix title (57 chars):**
`Herman Miller Aeron Size C for Tall People: Fit Guide`

**Ranking note:** This page may be cannibalising `/chairs/herman-miller-aeron/tall-people/`. Audit for keyword overlap and consider whether these two URLs should be consolidated or clearly differentiated in focus keyword.

---

#### M4 — /gesture-vs-leap-plus/: Meta Over-Length at 165 Chars, Position 14.7

**Current