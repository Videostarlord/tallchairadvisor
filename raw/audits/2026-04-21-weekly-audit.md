# TCA Weekly Audit Report
**Generated:** 2026-04-21T09:28:15.260Z
**Data range:** 2026-01-20 → 2026-04-20

# TallChairAdvisor.com — Full Site SEO Audit
**Audit Date:** 2026-04-10 | **Data Window:** Last 90 Days
**Auditor:** Based on GSC data + historical context from prior audits

---

## 1. Executive Summary

The site has grown from ~4,100 to 7,096 impressions since the April 3 audit, which confirms crawl and indexation improvements are working. However, CTR has barely moved — 19 clicks on 7,096 impressions is 0.27%, up from 0.29% on far fewer impressions, meaning the site is accumulating visibility without converting it. **The core problem remains identical to last week: position ≤ 10 pages are not getting clicked.** Seven pages now sit at position ≤ 10 with 0 clicks, representing a combined ~2,100 impressions being almost entirely wasted. A newly discovered canonical/duplicate issue on `/review/gesture` (no trailing slash) is silently splitting ~10% of that page's impression share. The technical foundation is stable; this week's work is almost entirely meta rewrites and one structural fix.

---

## 2. Critical CTR Leaks

*Pages at position ≤ 10 with 0 or near-0 clicks. These are the highest-ROI fixes on the site.*

| Page | Pos | Impr | CTR | Primary Cause |
|---|---|---|---|---|
| /aeron-vs-gesture/ | 8.2 | 276 | 0% | Title uses first-person "I chose" — limits searcher appeal; meta too spec-heavy, no decision framing |
| /review/aeron-size-c/ | 7.5 | 205 | 0% | Generic title; meta lists content but gives no verdict signal |
| /chairs/steelcase-gesture/ | 10.7 | 210 | 0% | Hub page title identical to brand name — no differentiation; meta is descriptive not persuasive |
| /fit-guides/ | 9.4 | 137 | 0% | Category page with zero verdict signal; reads like a sitemap entry |
| /back-pain-spine-height/ | 9.5 | 135 | 0% | Title (42 chars) is too short and vague; meta undersells the specific insight |
| /chairs/steelcase-leap-plus/tall-people/ | 10.3 | 154 | 0% | Meta is 156 chars (over limit); no verdict in first 100 chars |
| /knee-pain-seat-depth/ | 9.4 | 445 | 0% | **Largest waste on site.** Title is 70 chars (over limit); query intent mismatch (known from Apr 3 — still unfixed) |

> **Combined exposure:** ~1,562 impressions at position ≤ 10 generating 0 clicks. At a conservative 3% CTR these pages should deliver ~47 clicks/period. Current yield: 0.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C-1 — Trailing-Slash Duplicate: `/review/gesture` vs `/review/gesture/`
**Pages:** `/review/gesture` (121 impr, pos 12.6, 0 CTR) and `/review/gesture/` (1108 impr, pos 9, 0.18%)

The non-trailing-slash URL has its own GSC presence and is being indexed separately. The canonical on the duplicate *does* point to the correct URL (`/review/gesture/`), but Google is still serving impressions to the duplicate — meaning the signal is split. This is suppressing the canonical's ability to rank higher and is the likely reason `/review/gesture/` has stalled at position 9 despite being the strongest review on the site.

**Fix:**
1. Confirm the server returns a **301 redirect** from `/review/gesture` → `/review/gesture/`. Do not rely solely on the canonical tag.
2. Verify in GSC Coverage report that `/review/gesture` (no slash) is listed as "Duplicate, Google chose different canonical" or "Redirect" — not "Indexed."
3. After redirect is confirmed, submit `/review/gesture/` for recrawl.

**Why critical:** This is actively suppressing your highest-impression review page. A position move from 9 → 6 on 1,000+ impressions could add 20–30 clicks alone.

---

#### C-2 — `/knee-pain-seat-depth/` Title Over Character Limit + Intent Mismatch (Known Issue, Unfixed Since Apr 3)
**Page:** `/knee-pain-seat-depth/` | Pos 9.4 | 445 impr | 0 CTR

Title is **70 characters** — Google will truncate it in SERPs, cutting the fix-oriented end ("Fix for Tall People") that justifies the click. This has been flagged since April 3 and the CTR is still 0% on 445 impressions.

The April 3 audit identified a query intent mismatch ("knee brace" queries landing on this page). That diagnosis still stands.

**Current title (70 chars — truncated in SERP):**
> Why Your Office Chair Causes Knee Pain: Seat Depth Fix for Tall People

**Current meta (154 chars — within range but problem is elsewhere):**
> Seat edge pressure causes knee pain in tall people when seat depth is too shallow. How to measure the right depth for your height and which chairs fix it.

**Fixes:**
```
Title (57 chars):
Office Chair Knee Pain Fix: Seat Depth Guide for Tall Users

Meta (152 chars):
Seat edge pressure causes knee pain in tall people. Find the right seat depth for your height (6'0–6'6) and which chairs actually fix the problem.
```
Also audit the page body for "knee brace" and related queries — if that content is present, either remove it or split into a separate page. If the page is purely about seat depth mechanics, ensure the H1 and first paragraph make that explicit so Google stops associating it with knee brace intent.

---

### 🔴 CRITICAL (Schema)

---

#### C-3 — Schema `@type: Article` with `name` Instead of `headline` on Two Hub Pages
**Pages:** `/chairs/steelcase-gesture/` and `/chairs/herman-miller-aeron/`

Both use `"@type":"Article"` but have `"name"` as the primary property instead of `"headline"`. Per Schema.org spec, `Article` requires `headline`, not `name`. `name` is valid for `Product` and `Organization` types. This is a structured data error that will cause Google's Rich Results Test to flag these as invalid, potentially preventing any rich result eligibility.

**Fix:** In both schema blocks, change `"name": "Steelcase Gesture for Tall People"` → `"headline": "Steelcase Gesture for Tall People"` (and same for the Aeron page). Run both through Google's Rich Results Test after fix.

---

### 🟠 HIGH

---

#### H-1 — `/aeron-vs-gesture/` — First-Person Title Limits CTR + Meta Has No Decision Frame
**Page:** Pos 8.2 | 276 impr | 0% CTR

This page is at position 8.2 — it should be getting ~2–3% CTR. The title "Why I Chose the Gesture" works for a blog but alienates searchers who want a comparison, not someone else's personal narrative. The meta leads with specs, not with the decision logic that makes someone click.

**Current title (58 chars):**
> Aeron vs Gesture at 6'4": Why I Chose the Gesture

**Current meta (134 chars):**
> At 6'4", I chose Gesture over Aeron. Seat depth (18.75" vs 18.25"), armrests, and price — the spec verdict for tall users.

**Issues:**
- "I chose" framing: personal, not authoritative. Searchers want "which is better," not whose opinion this is.
- Meta confirms the conclusion before the click — no reason to visit.

**Rewrite:**
```
Title (57 chars):
Aeron vs Steelcase Gesture: Tall People Fit Comparison

Meta (148 chars):
Seat depth, back height, armrests, and price compared for users 6'0–6'6. The Gesture wins at 6'4+, but the Aeron is the better fit below that.
```

> **Note for Jackson:** The page content can still include your personal Gesture ownership and testing — that's an E-E-A-T asset. The title and meta just need to lead with the comparison utility, not the personal conclusion.

---

#### H-2 — `/review/aeron-size-c/` — Generic Title, No Verdict in Meta
**Page:** Pos 7.5 | 205 impr | 0% CTR

Position 7.5 is prime real estate. The title is completely generic (identical structure to the hub page `/chairs/herman-miller-aeron/`) and the meta lists topics without a verdict.

**Current title (56 chars):**
> Aeron Size C Review for Tall People | Tall Chair Advisor

**Current meta (154 chars):**
> In-depth Herman Miller Aeron Size C review for users 6'0"–6'6". Seat depth, height range, PostureFit SL lumbar assessment, and who should skip it.

**Issues:**
- Title: "Review for Tall People" is what every Aeron review claims. No differentiation.
- Meta: "who should skip it" is a hook but buried. Move it forward.
- No verdict = no click signal.

**Rewrite:**
```
Title (58 chars):
Herman Miller Aeron Size C: Honest Tall People Verdict

Meta (151 chars):
Fixed 18.25" seat depth is a real problem at 6'4+. Who the Aeron Size C fits, who should skip it, and how it stacks up on back height and lumbar.
```

---

#### H-3 — `/back-pain-spine-height/` — Title Too Short (42 chars) + Undersells Core Insight
**Page:** Pos 9.5 | 135 impr | 0% CTR

Title is 42 characters — well below the 50-char floor. This wastes SERP real estate and the vague "A Tall User Fix" doesn't communicate the specific, clinically interesting insight the page apparently contains (lumbar hitting wrong spinal segment).

**Current title (42 chars):**
> Back Pain From Your Chair? A Tall User Fix

**Current meta (132 chars — slightly under floor):**
> Standard chair lumbar support hits the wrong spinal segment at 6'2+. Why tall users get back pain — and chair fixes by height range.

**Fixes:**
```
Title (57 chars):
Office Chair Back Pain: Why Lumbar Hits Wrong at 6'2+

Meta (148 chars):
Standard lumbar support targets the wrong spinal segment in tall users. Height-specific back pain causes and which chairs fix lumbar position at 6'2+.
```
The insight ("wrong spinal segment") is the hook — lead with it in the title, not hidden in the meta.

---

#### H-4 — `/chairs/steelcase-gesture/` Hub Page — 0 Clicks at Position 10.7 With Generic Meta
**Page:** Pos 10.7 | 210 impr | 0% CTR

This is the hub page for the site's most-reviewed chair. A position just over 10 with 0 clicks means it's right on the edge of page 1 and not earning any of it. The meta is purely descriptive with no verdict or comparison signal.

**Current title (54 chars):**
> Steelcase Gesture for Tall People | Tall Chair Advisor

**Current meta (141 chars):**
> Steelcase Gesture for tall users — seat height range, seat depth adjustment, fit for 6'0–6'4, and how it compares to the Aeron and Leap Plus.

**Fixes:**
```
Title (55 chars):
Steelcase Gesture for Tall People: Fit Guide + Verdict

Meta (147 chars):
Gesture fits 6'0–6'4 well; seat depth maxes out at 6'4+. Full spec breakdown, height-by-height fit guide, and comparison to Aeron and Leap Plus.
```

---

#### H-5 — `/fit-guides/` — Category Page With Zero Conversion Signal
**Page:** Pos 9.4 | 137 impr | 0% CTR

This is a category/hub page sitting at position 9.4 — on the edge of page 1 — with a meta that reads like a table of contents. No urgency, no differentiation, no reason to click over a competitor's result.

**Current meta (147 chars):**
> Fit and adjustment guides for tall people choosing and setting up ergonomic office chairs. Seat depth, back height, and lumbar targeting by height.

**Rewrite:**
```
Title (53 chars — fine, keep):
Chair Fit Guides for Tall People | Tall Chair Advisor

Meta (149 chars):
Height-specific fit guides: find the right seat depth, back height, and lumbar setting for your height. Built for users 6'0–6'7, not average-height defaults.
```
→ That's 159 chars. Trim:
```
Meta (150 chars):
Seat depth, back height, and lumbar guides built for 6'0–6'7 users — not average-height defaults. Find the right chair settings for your exact height.
```

---

### 🟡 MEDIUM

---

#### M-1 — `/review/gesture/` Meta 3 Characters Over Limit
**Page:** 158 chars, limit is 155.

**Current meta:**
> Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.

This is 158 chars. Google will truncate at ~155, cutting "doesn't" — which is actually the most compelling word in the sentence.

**Fix (154 chars):**
```
6'4" owner review. Seat depth, armrests, and back height verdict for tall users 6'1"–6'7". Exactly who the Gesture fits — and who should look elsewhere.
```

---

#### M-2 — `/gesture-vs-leap-plus/` Meta Over Limit (165 chars)
**Page:** Pos 15 | 291 impr | 0.34% CTR

Meta is 165 chars — 10 over. The truncation point will land mid-sentence, cutting the "verdict inside" hook.

**Current meta:**
> Seat depth (18.75" vs 19.75"), back height, and armrest comparison for users 6'0"–6'6". Which one wins depends on your exact height — verdict inside.

**Fix (152 chars):**
```
Seat depth (18.75" vs 19.75"), back height, and armrests compared for 6'0"–6'6". Which chair wins depends on your height — breakdown inside.
```

---

#### M-3 — `/review/leap-plus/` Meta Over Limit (170 chars)
**Page:** Pos 10.4 | 265 impr | 0.38% CTR

170 chars — 15 over. At position 10.4 this page is borderline page 1. The truncation will cut the most useful part ("Who fits and who doesn't").

**Current meta:**
> Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.

**Fix (153 chars):**
```
Spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 22.5" max seat height, 500 lb capacity. Who the Leap Plus fits and who it doesn't.
```

---

#### M-4 — `/chairs/steelcase-leap-plus/tall-people/` Meta Over Limit (156 chars)
**Page:** Pos 10.3 | 154 impr | 0% CTR

One char over, but also no verdict in