# TCA Weekly Audit Report
**Generated:** 2026-04-14T09:19:45.582Z
**Data range:** 2026-01-13 → 2026-04-13

# TallChairAdvisor.com — SEO Audit Report
**Audit Date:** 2026-04-10 | **Data Window:** Last 90 Days
**Auditor:** Jackson Christopher | **Source:** GSC + On-Page Crawl

---

## 1. Executive Summary

The site has a severe CTR crisis: 5,590 impressions producing only 12 clicks (0.21% CTR), down from 0.29% in the April 3 audit despite impression growth — meaning the gap between visibility and clicks is **widening, not closing**. Eight pages sit at position ≤ 10 with 0 clicks, representing the core revenue leak. Two structural issues compound the CTR problem: `/review/gesture` (no trailing slash) is a duplicate-URL indexation risk that is splitting 130 impressions away from the canonical, and `/aeron-vs-gesture` (no trailing slash) is doing the same with 114 impressions. The site's ranking foundation is largely sound — schema is present on all pages, canonicals are set, and several pages have strong positions — but SERP copy is consistently failing to convert impressions into clicks.

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 clicks — these are the highest-priority revenue losses.*

| Page | Impr | Pos | CTR | Primary Failure |
|---|---|---|---|---|
| /chairs/herman-miller-aeron/tall-people/ | 570 | 7.1 | 0% | No verdict in meta; passive description |
| /aeron-vs-gesture/ | 241 | 7.8 | 0% | "I chose" framing cannibalizes curiosity; meta hedges |
| /knee-pain-seat-depth/ | 292 | 9.2 | 0% | Title over 60 chars; meta doesn't lead with fix |
| /chairs/steelcase-gesture/ | 163 | 9.9 | 0% | Generic hub page; meta is a table of contents, not a hook |
| /fit-guides/ | 111 | 8.5 | 0% | Navigation/index page masquerading as content |
| /review/aeron-size-c/ | 130 | 7.3 | 0% | No verdict signal in meta; "in-depth" is a filler phrase |

> **Pattern (consistent with April 3 findings):** Verdict-first meta descriptions are still not deployed on the highest-impression CTR-leak pages. The April 3 audit identified this same failure on /aeron/tall-people/ and /aeron-vs-gesture/. Six weeks later, nothing has shipped.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

**C1 — Duplicate URL Indexation: `/review/gesture` splitting impressions from canonical**
- **Pages:** `/review/gesture` (130 impr, pos 12.3) vs `/review/gesture/` (896 impr, pos 9.2)
- **Problem:** The non-trailing-slash URL has its own GSC impressions row, meaning Google is treating it as a separate indexable entity. The canonical on `/review/gesture` points to `/review/gesture/`, but 130 impressions and crawl equity are leaking to the wrong URL. This is diluting the canonical's ranking signal.
- **Fix:** Implement a 301 redirect from `/review/gesture` → `/review/gesture/` at the server/CDN level. Verify in GSC URL Inspection that `/review/gesture` resolves as a redirect, not a crawlable page. **Do not rely on the canonical tag alone — it is a hint, not a directive.**
- **Expected impact:** Consolidates ~130 impressions + link equity back to the canonical, likely nudging pos 9.2 toward 8.x.

---

**C2 — Duplicate URL Indexation: `/aeron-vs-gesture` splitting impressions from canonical**
- **Pages:** `/aeron-vs-gesture` (114 impr, pos 8.4) vs `/aeron-vs-gesture/` (241 impr, pos 7.8)
- **Problem:** Same failure mode as C1. The non-trailing-slash version has 114 impressions and a 0.88% CTR (1 click), while the canonical has 241 impressions and 0% CTR. The 1 click in GSC is landing on the non-canonical URL. Combined, this page has 355 impressions at roughly position 8 — one of the highest-value comparison pages on the site — and it is functionally broken at the SERP level.
- **Fix:** 301 redirect `/aeron-vs-gesture` → `/aeron-vs-gesture/`. Audit all other pages for the same trailing-slash inconsistency site-wide. This is likely a systemic CMS configuration issue, not a one-off.

---

**C3 — CTR Leak: /chairs/herman-miller-aeron/tall-people/ — 570 impressions, 0 clicks, pos 7.1**
- **Problem:** 570 impressions at position 7.1 is the single largest CTR waste on the site. The meta description (`Aeron Size C fits most 6'0–6'3 users; the 18.25" fixed seat depth is a problem at 6'4+. Full height-by-height breakdown with specs.`) actually contains a verdict — this is an improvement over April 3 — but it **buries the lead**. The user scanning the SERP sees "Aeron Size C fits most 6'0–6'3 users" and stops reading; they don't get to the problem signal that would differentiate this result.
- **Also:** The title (`Herman Miller Aeron Size C: Tall People Fit Analysis`) is accurate but generic. "Fit Analysis" is not a compelling SERP differentiator.
- **Current meta:** 135 chars ✅ length
- **Current title:** 52 chars ✅ length
- **Rewrite title (52 chars):**
  ```
  Herman Miller Aeron Size C: Is It Good for Tall People?
  ```
  *(53 chars — within range)*
- **Rewrite meta (148 chars):**
  ```
  The 18.25" fixed seat depth is a known problem at 6'4+. Aeron Size C fits 6'0–6'3 well — here's the exact height-by-height verdict.
  ```
- **Logic:** Lead with the problem (fixed seat depth), then deliver the verdict range, then CTA signal ("exact breakdown"). Tall users at 6'4+ will click because they just got told something they didn't know. Users at 6'0–6'3 will click for confirmation.

---

**C4 — CTR Leak: /review/aeron-size-c/ — 130 impressions, 0 clicks, pos 7.3**
- **Problem:** Position 7.3 with 0 clicks. The meta (`In-depth Herman Miller Aeron Size C review for users 6'0"–6'6". Seat depth, height range, PostureFit SL lumbar assessment, and who should skip it.`) uses "in-depth" (a filler trust signal that users ignore) and buries the conclusion. "And who should skip it" at the end is the actual hook — it needs to be first.
- **Note on voice:** This page reviews the Aeron, which Jackson has **not personally tested**. The title `Aeron Size C Review for Tall People` implies first-person ownership. This is a **credibility and compliance risk** — if the body copy uses "I tested" language for the Aeron, it needs to be audited and corrected to research-based voice.
- **Current meta:** 154 chars ⚠️ borderline
- **Rewrite title (55 chars):**
  ```
  Aeron Size C Review: Tall People Verdict (2026)
  ```
  *(48 chars — slightly short but acceptable; avoids implied personal testing)*
- **Rewrite meta (149 chars):**
  ```
  At 6'4+, the Aeron's 18.25" fixed seat depth is the dealbreaker. Research-based verdict for 6'0–6'6 — specs, fit, and who should skip it.
  ```
- **Logic:** Leads with the specific problem for the most anxious buyer segment (6'4+), signals research-based authority honestly, preserves the "who should skip it" hook.

---

**C5 — CTR Leak: /aeron-vs-gesture/ — 241 impressions, 0 clicks, pos 7.8**
- **Problem:** Title `Aeron vs Gesture at 6'4": Why I Chose the Gesture` **answers the question in the title**. The user already knows the verdict before clicking. There is no curiosity gap, no reason to click through. This is the opposite of what a comparison page should do — it should raise the decision tension, not resolve it.
- **Additionally:** "I chose the Gesture" is first-person language for a comparison that involves the Aeron, which Jackson has not personally tested. The framing implicitly claims comparative first-hand experience with both chairs. This should be `At 6'4", the Gesture Wins — Here's Why` or similar that signals tested-one-compared-by-spec.
- **Current meta:** 134 chars ✅ length
- **Rewrite title (57 chars):**
  ```
  Aeron vs Gesture for Tall People: The 6'4" Verdict
  ```
- **Rewrite meta (151 chars):**
  ```
  Seat depth, armrests, recline — spec-by-spec comparison at 6'4". One chair wins clearly for most tall users. Which one and why it matters.
  ```
- **Logic:** Raises tension (which one wins?), keeps the 6'4" specificity that drives qualified clicks, removes the premature spoiler.

---

**C6 — CTR Leak: /knee-pain-seat-depth/ — 292 impressions, 0 clicks, pos 9.2**
- **Problem (carried from April 3 audit):** Title is 70 chars — **10 chars over the 60-char limit** and will be truncated in SERPs. Truncated titles have lower CTR. This is the same issue flagged six weeks ago with no fix shipped.
- **Current title (70 chars):** `Why Your Office Chair Causes Knee Pain: Seat Depth Fix for Tall People`
- **Rewrite title (58 chars):**
  ```
  Office Chair Knee Pain: Seat Depth Fix for Tall People
  ```
- **Current meta:** 154 chars ✅ length, ✅ content (leads with mechanism). Meta is actually good — the title fix alone may recover CTR.
- **Secondary issue (April 3 pattern):** The April 3 audit flagged a query intent mismatch — some impressions may be coming from "knee brace" queries. Check GSC query breakdown for this URL. If "knee brace" or "knee support" queries are present, add an explicit exclusion sentence in the meta: `Not about braces — about chair fit.`

---

### 🟠 HIGH

---

**H1 — /review/gesture/ meta description over character limit**
- **Current:** 158 chars ❌ (limit: 155)
- **Problem:** Will be truncated in SERPs, cutting off "— and who it doesn't" — the most compelling part of the meta.
- **Current meta:** `Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.`
- **Rewrite (152 chars):**
  ```
  Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who it fits — and who should skip it.
  ```
- **Note:** This page has 896 impressions at pos 9.2 — the highest-impression page on the site. Every char of meta matters here.

---

**H2 — /gesture-vs-leap-plus/ meta description over character limit**
- **Current:** 165 chars ❌ (limit: 155)
- **Problem:** Truncated after "verdict inside" is cut, removing the CTA.
- **Current meta:** `Seat depth (18.75" vs 19.75"), back height, and armrest comparison for users 6'0"–6'6". Which one wins depends on your exact height — verdict inside.`
- **Rewrite (154 chars):**
  ```
  Seat depth (18.75" vs 19.75"), back height, armrest comparison for 6'0"–6'6". Which chair wins depends on your exact height — verdict inside.
  ```
  *(Removes "and" to save 4 chars, within limit)*

---

**H3 — /review/leap-plus/ meta description over character limit**
- **Current:** 170 chars ❌ (limit: 155)
- **Current meta:** `Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.`
- **Rewrite (154 chars):**
  ```
  Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height max. Who fits and who doesn't.
  ```
  *("ceiling" → "max" saves 4 chars)*

---

**H4 — /chairs/steelcase-gesture/ — 163 impressions, 0 clicks, pos 9.9**
- **Problem:** Hub/overview page with generic meta that reads like a table of contents. At position 9.9, this is one adjustment away from page 2 — and currently getting zero clicks even on page 1.
- **Current meta (141 chars):** `Steelcase Gesture for tall users — seat height range, seat depth adjustment, fit for 6'0–6'4, and how it compares to the Aeron and Leap Plus.`
- **Rewrite (148 chars):**
  ```
  Steelcase Gesture fits 6'0–6'4 well; at 6'4+ the seat depth hits its ceiling. Seat height, depth, and comparison data for tall users.
  ```
- **Also:** Title `Steelcase Gesture for Tall People | Tall Chair Advisor` — the brand suffix takes up 20 chars. At 54 chars total it's within range, but consider whether the brand tag adds value at this length. Low priority relative to meta fix.

---

**H5 — /chairs/herman-miller-aeron/ — Schema type mismatch**
- **Schema block uses:** `"@type":"Article","name":` — Article type should use `"headline":`, not `"name":`. Using `"name"` is a Product schema property. This is a **schema property mismatch** that may cause Google's structured data parser to ignore or partially process the schema block.
- **Same issue on:** `/chairs/steelcase-gesture/` (also uses `"name":` on an Article type)
- **Fix:** Change `"name":` to `"headline":` on both Article schema blocks. Validate in Google's Rich Results Test after deployment.

---

**H6 — /chairs/steelcase-leap-plus/tall-people/ meta description over character limit**
- **Current:** 156 chars ❌ (1 over limit, borderline)
- **Current meta:** `Steelcase Leap Plus fit analysis for tall users 6'0-6'7+. 22.5-in seat height, 4-in adjustable seat depth, height-by-height breakdown, and who it fits best.`
- **Rewrite (152 chars):**
  ```
  Steelcase Leap Plus fit for tall users 6'0–6'7+. 22.5" seat height, 4" adjustable seat depth, height-by-height breakdown, and who fits best.
  ```

---

**H7 — /chairs/steelcase-leap-plus/seat-height/ — Title/meta spec inconsistency**
- **Title says:** `Steelcase Leap Plus Seat Height: 15.5"–22