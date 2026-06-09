# TCA Weekly Audit Report
**Generated:** 2026-06-09T11:16:23.065Z
**Data range:** 2026-02-24 → 2026-05-25

# TCA Weekly Audit Report
**Generated for:** tallchairadvisor.com
**Data window:** 90-day rolling
**Auditor:** Jackson Christopher

---

## 1. Executive Summary

Site-level performance has improved significantly from the April baseline (4,443 impressions → 23,105 impressions, 35 → 55 clicks), confirming the hub-and-spoke architecture is working. However, the aggregate CTR of **0.24%** remains structurally broken — 23,105 impressions producing only 55 clicks is not a content-quality problem, it is a SERP-presence problem concentrated in 7 pages that hold position ≤ 10 with zero clicks. The most actionable lever this week is meta description rewrites on the zero-CTR near-p1 pages, with one high-urgency anomaly: `/office-chairs-for-6-foot-4/` sitting at **position 4.5 with 0 clicks and 361 impressions**, which is the single most alarming data point in the audit and warrants immediate diagnosis. Two distinct suppression mechanisms (AI Overviews and SERP feature displacement) are documented in prior audits and must be applied as a filter before assuming meta rewrites will fix any given page.

---

## 2. Critical CTR Leaks
*Pages at position ≤ 10, 0 clicks — highest priority by definition*

| Page | Pos | Impr | Clicks | CTR | Leak Severity |
|---|---|---|---|---|---|
| `/office-chairs-for-6-foot-4/` | 4.5 | 361 | 0 | 0% | 🔴 CRITICAL |
| `/chairs/steelcase-leap-plus/tall-people/` | 8.3 | 658 | 0 | 0% | 🔴 CRITICAL |
| `/chairs/steelcase-gesture/` | 8.9 | 586 | 0 | 0% | 🔴 CRITICAL |
| `/aeron-vs-gesture/` | 8.5 | 466 | 0 | 0% | 🔴 CRITICAL |
| `/chairs/steelcase-gesture/seat-depth/` | 8.1 | 1,145 | 1 | 0.09% | 🔴 CRITICAL |
| `/fit-guides/` | 8.3 | 252 | 0 | 0% | 🟠 HIGH |

> **Standing policy reminder (from statistical-confidence-policy.md):** Before rewriting metas on any zero-CTR page, check incognito SERP for AI Overview presence. If an AI Overview is confirmed, meta rewrites will not recover clicks — content restructuring (FAQ schema, direct answer hooks) is the correct action. Apply the `/chairs/steelcase-gesture/seat-depth/` AIO finding (confirmed in prior audit for `steelcase gesture seat depth range inches`) before committing effort to that page.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C-1: `/office-chairs-for-6-foot-4/` — Position 4.5, 0 Clicks, 361 Impressions
**This is the single most urgent item on the site.**

A page at **position 4.5** with 361 impressions and zero clicks is not a normal CTR suppression pattern. Even under AI Overview conditions, position 4.5 typically generates some clicks. Three hypotheses in order of likelihood:

1. **Title/meta mismatch with query intent** — current title is `Best Office Chair for 6'4" | Tall Chair Advisor` (HTML-encoded apostrophe `&#39;` and quote `&quot;` in raw data — verify these render correctly in SERP; malformed special characters in titles cause Google to rewrite the title to something generic, destroying click appeal)
2. **SERP feature saturation** — "best office chair for 6'4"" may be triggering a shopping carousel + AI Overview combination that pushes organic results below fold
3. **Canonical or indexing anomaly** — zero clicks at pos 4.5 with meaningful impressions warrants a manual GSC coverage check

**Immediate actions:**
- [ ] Run incognito SERP on `best office chair for 6'4"` and `office chair for 6 foot 4` — document what SERP features appear above organic
- [ ] Verify HTML entities in title tag render correctly in browser (check raw `<title>` source)
- [ ] Check GSC URL Inspection for indexing status and last crawl date
- [ ] If no SERP feature suppression: rewrite meta description (current 157 chars is within spec, but the copy is passive — see rewrite below)

**Current meta (157 chars):**
> At 6'4", the Leap Plus is the safest default: 22.5" seat height, 19.75" depth. Full comparison with Gesture and Aeron — height-by-height verdict.

**Rewritten meta (148 chars):**
> You're in the hardest bracket. Leap Plus clears 22.5" seat height; Gesture tops out at 21". Side-by-side verdict for exactly 6'4" users.

**Rationale:** The original leads with a conclusion. The rewrite acknowledges the user's specific frustration (6'4" is a known edge-case bracket on this site) and creates a reason to click for the verdict.

---

#### C-2: `/chairs/steelcase-gesture/` — Position 8.9, 586 Impressions, 0 Clicks
**Schema error + meta overlength + content cannibalizes `/review/gesture/`**

**Issue 2a — Schema type mismatch (CRITICAL):**
The schema block uses `"@type":"Article"` with `"name"` instead of `"headline"`. For Article schema, the correct property is `headline`. Using `name` on an Article type is invalid structured data — Google will ignore the block entirely.

```json
// WRONG (current)
{"@type":"Article","name":"Steelcase Gesture for Tall People",...}

// CORRECT
{"@type":"Article","headline":"Steelcase Gesture for Tall People",...}
```

**Issue 2b — Meta description overlength:**
Current meta is **170 chars** (15 chars over the 155-char ideal ceiling). Google will truncate, cutting off "and comparison to Aeron and Leap Plus" — the exact differentiator that justifies the page over `/review/gesture/`.

**Current meta (170 chars):**
> Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus.

**Rewritten meta (150 chars):**
> Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" depth. How it stacks up against the Aeron and Leap Plus by height bracket.

**Issue 2c — Cannibalization risk:**
This page competes directly with `/review/gesture/` for `steelcase gesture tall users` queries. Differentiation strategy: `/chairs/steelcase-gesture/` should own **fit-guide voice** (can you physically fit, specs-first), while `/review/gesture/` owns **verdict voice** (should you buy it, owner perspective). Clarify this in the H1 and intro — do not duplicate the comparison section.

---

#### C-3: `/aeron-vs-gesture/` — Position 8.5, 466 Impressions, 0 Clicks
**Schema headline misrepresents content + voice integrity violation**

**Issue 3a — Schema headline implies personal testing of Aeron (CRITICAL voice integrity):**
```json
// CURRENT — FLAGGED
{"headline":"Why I Chose the Steelcase Gesture Over the Aeron at 6'4\""}
```
Jackson has **only personally tested the Gesture**. The headline "Why I Chose" implies a direct comparison from personal use of both chairs. This is a factual misrepresentation and an E-E-A-T risk if a reader or Google evaluator interprets it as first-person Aeron experience.

**Fix:**
```json
{"headline":"Steelcase Gesture vs Herman Miller Aeron for Tall People: Spec Comparison"}
```

The page body must also be audited to ensure no first-person language describes Aeron fit from personal experience. Research-based voice only for Aeron.

**Issue 3b — Meta description uses "6ft3 Plus" (inconsistent unit formatting):**
Current title: `Aeron vs Gesture for Tall Users: Which Fits 6ft3 Plus?`
The site standard is `6'3+` or `6'3"`. "6ft3 Plus" is non-standard and will not match user search query formatting, slightly reducing relevance signal.

**Current meta (143 chars):**
> Gesture wins on armrests and multi-device postures; Aeron wins on breathability. Full breakdown by height bracket for users 6ft 3in and taller.

**Rewritten meta (144 chars):**
> Gesture wins on armrests and multi-device postures; Aeron wins on breathability. Height-by-height verdict for users 6'3" and taller.

**Issue 3c — Title length:**
`Aeron vs Gesture for Tall Users: Which Fits 6ft3 Plus?` = 54 chars. Within spec, but fix unit formatting:
**Revised title:** `Aeron vs Gesture for Tall Users: Who Fits at 6'3+?` (51 chars)

---

#### C-4: `/chairs/steelcase-leap-plus/tall-people/` — Position 8.3, 658 Impressions, 0 Clicks
**Title tag duplicate signal + meta within spec but not differentiated from `/review/leap-plus/`**

**Issue 4a — Cannibalization:**
This page (`/chairs/steelcase-leap-plus/tall-people/`) and `/review/leap-plus/` are competing for nearly identical queries (`steelcase leap plus`, `steelcase leap tall`). GSC shows the review page at pos 8.1 with 5 clicks; this page at pos 8.3 with 0 clicks. They are splitting impressions without splitting intent.

**Recommended differentiation:**
- `/review/leap-plus/` → buyer verdict, research-based voice, "should I buy" intent
- `/chairs/steelcase-leap-plus/tall-people/` → fit guide, "will I physically fit" intent, measurement-forward

**Issue 4b — Meta description spec mismatch:**
Current meta (156 chars) is 1 char over the 155-char ceiling. Trim:

**Current meta (156 chars):**
> Steelcase Leap Plus fit analysis for tall users 6'0-6'7+. 22.5-in seat height, 4-in adjustable seat depth, height-by-height breakdown, and who it fits best.

**Rewritten meta (149 chars):**
> Steelcase Leap Plus fit guide for 6'0"–6'7"+. 22.5" seat height, 4" adjustable depth — height-by-height breakdown and exact fit verdict.

---

#### C-5: `/chairs/steelcase-gesture/seat-depth/` — Position 8.1, 1,145 Impressions, 1 Click, 0.09% CTR
**Confirmed AI Overview on primary query — meta rewrite is secondary action**

From prior audit (April 22): `steelcase gesture seat depth range inches` (pos 4.3) has a **confirmed AI Overview**. This page's primary impressions are likely driven by this and the adjacent query `steelcase gesture seat depth adjustment range inches` (pos 6.1, 49 impr, 0 CTR).

**Correct action sequence:**
1. **Do not prioritize meta rewrite until SERP re-checked** — if AIO still present, meta rewrite will not move the needle
2. **Add FAQ schema** targeting the exact question format Google is answering in the AIO: `"What is the Steelcase Gesture seat depth adjustment range?"` — this can earn a citation within the AIO box itself
3. **Add a "How to adjust" step-by-step section** with HowTo schema — this targets the `adjustment` variant query which may not be AIO-suppressed
4. If SERP check confirms AIO is gone or partial: rewrite meta to lead with the adjustment action, not the spec:

**Potential meta rewrite (if AIO clears) (131 chars):**
> Gesture seat depth adjusts 15.75"–18.75" (3" range). How to set it for your leg length — and where 6'4"+ users hit the limit.

---

### 🟠 HIGH

---

#### H-1: `/review/gesture/` — Meta Description Overlength + CTR Below Expectation
**Position 7.9, 4,775 impressions, 0.1% CTR — the site's highest-impression page is underperforming**

**Issue H-1a — Meta description is 158 chars (3 chars over ceiling):**

**Current meta (158 chars):**
> Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.

**Analysis:** This is actually strong copy — the "Independent review by a 6'4" owner" opener is a genuine E-E-A-T differentiator (Jackson **has** personally tested the Gesture, this is accurate). The problem is truncation risk at 158 chars.

**Rewritten meta (151 chars):**
> Tested by a 6'4" owner. Seat depth, armrests, and back height verdict for 6'1"–6'7" users. Who the Gesture fits — and who it doesn't.

**Issue H-1b — Query leak pattern:**
`steelcase gesture height range tall users` (22 impr, pos 7.7, 0% CTR) and `steelcase gesture seat height range` (25 impr, pos 8.5, 0% CTR) are both leaking. These are likely AIO candidates (confirmed AIO pattern for similar spec queries in prior audit). Check SERP before acting. If not AIO-suppressed, the fix is adding a visible spec table near the top of the page with exact height range figures — this improves relevance signal for the height-range queries without changing the review's intent.

---

#### H-2: `/knee-pain-seat-depth/` — Query Leak Cluster is AIO Risk, Title Overlength
**Position 8.4, 3,484 impressions, 7 clicks — the site's commission-producing page**

**Issue H-2a — Title is 67 chars (7 chars over the 60-char ceiling):**
`Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People` = 63 chars after entity decoding (the `&amp;` decodes to `&`). This is still 3 chars over. Google will rewrite it.

**Current title (63 chars decoded):** `Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People`

**Rewritten title (57 chars):** `Seat Depth & Knee Pain: The Cornell Rule for Tall People`

**Rationale:** Preserves "Cornell," "seat depth," "knee pain," and "tall people" — all high-relevance terms. Moves the user's pain point earlier.

**Issue H-2b — Query leak cluster:**
Three variants of the Cornell two-fingers rule are leaking (77 + 62 + 37 = 176 combined impressions, 0 clicks). These are almost certainly AIO-suppressed — "two fingers behind knee" is exactly the kind of procedural ergonomics fact Google answers inline.

**Action:** Check SERP incognito for `cornell ergonomics chair seat depth two fingers behind knee`. If AIO confirmed:
- Add FAQ schema: `"How do you measure correct seat depth?"` with the two-fingers answer — aim for AIO citation
- Add a How-To schema block for the measurement procedure
- Do **not** rewrite meta for these queries; the page is already ranking well for conversion queries (it produced the site's first commission)

**Issue H-2c — Meta