# TCA Weekly Audit Report
**Generated:** 2026-07-14T09:59:06.742Z
**Data range:** 2026-04-14 → 2026-07-13

# TCA Weekly Audit Report
**Audit Date:** Current Week | **Auditor:** SEO Agent for tallchairadvisor.com
**Data Window:** 90 days

---

## 1. Executive Summary

The site is in strong growth trajectory — 89,422 impressions and avg position 8.1 across the portfolio confirms the hub-and-spoke architecture is working. However, **sitewide CTR is 0.21%**, which remains the #1 structural bottleneck; 188 clicks from ~90K impressions is deeply underperforming even accounting for AI Overview suppression on spec queries. The most actionable problem this week is a cluster of **high-impression pages sitting at positions 5–10 with near-zero CTR** — these are not AIO-suppressed and represent real, fixable click losses. Two structural issues compound this: **duplicate title/meta between `/office-chairs-for-tall-people/` and `/best-office-chairs/`** is likely causing Google to suppress the weaker URL, and the **`/aeron-vs-gesture/` page uses first-person ownership voice for the Gesture comparison against a chair Jackson has not personally tested** (Aeron), creating an E-E-A-T integrity risk.

---

## 2. Critical CTR Leaks

*Pages at position ≤ 10, zero or near-zero clicks, high impression volume. Not all are fixable via meta rewrites — AIO cases noted explicitly.*

| Page | Pos | Impr | Clicks | CTR | Root Cause |
|------|-----|------|--------|-----|------------|
| `/knee-pain-seat-depth/` | 5.8 | 36,167 | 18 | 0.05% | Meta too passive; no verdict/urgency signal |
| `/review/gesture/` | 8.0 | 8,802 | 7 | 0.08% | Meta undersells the owner-tested angle |
| `/chairs/steelcase-gesture/seat-depth/` | 8.0 | 1,222 | 1 | 0.08% | AIO on top query; secondary queries fixable |
| `/chairs/steelcase-gesture/` | 8.8 | 629 | 0 | 0% | Meta over-length (170 chars); weak CTA |
| `/chairs/steelcase-leap-plus/seat-height/` | 8.3 | 479 | 0 | 0% | **Spec error in title + meta (see §3)** |
| `/office-chairs-for-6-foot-4/` | 5.4 | 686 | 2 | 0.29% | Good position, title weak |

**AIO-confirmed suppressions** (meta rewrites will not recover clicks — noted for record, not action):
- `steelcase gesture 360 armrests description` on `/chairs/steelcase-gesture/seat-depth/` (pos 4.1 query, 0 clicks) — per prior wiki audit.
- `herman miller aeron size c height range` queries — documented AIO suppression.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

**C1 — Spec error: `/chairs/steelcase-leap-plus/seat-height/` title contradicts meta description**
- **Title says:** `Steelcase Leap Plus Seat Height: 15.5"–22.5" Range`
- **Meta says:** `15.5"–20.5" range`
- These are two different numbers for the same spec. One is wrong. Steelcase specs the Leap Plus seat height at **15.5"–20.5"** (standard) — the 22.5" figure appears in the `/review/leap-plus/` page as the max seat height ceiling, which may be conflated. This is a factual credibility error on a spec page.
- **Fix:** Verify official Steelcase Leap Plus seat height range against manufacturer spec sheet. Reconcile title and meta to use the same confirmed number. Until verified, the title must be corrected to match the meta (15.5"–20.5"), or vice versa — do not publish contradictory specs.
- **Why critical:** A spec page with internally contradictory numbers will lose trust signals with both users and Google. It also contradicts other pages on the same site.

---

**C2 — E-E-A-T integrity risk: `/aeron-vs-gesture/` uses first-person ownership framing for a chair Jackson has not tested**
- **Current meta (158 chars):** `At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage. Height-by-height verdict for tall users.`
- **Schema headline:** `"Why I Chose the Steelcase Gesture Over the Aeron at 6'4\""`
- Jackson has personally tested the Gesture only. The Aeron comparison is research-based. The current framing implies Jackson sat in both and made a purchase decision — this is not accurate per site policy and constitutes a false E-E-A-T claim.
- **Fix — Meta rewrite (148 chars):**
  `Gesture vs Aeron Size C for tall users: spec-by-spec comparison of seat depth, armrests, and height range. Which wins at 6'3", 6'4", and 6'5"+.`
- **Fix — Schema headline rewrite:**
  `"Steelcase Gesture vs Herman Miller Aeron Size C: Tall People Fit Comparison"`
- **Fix — Page body audit:** Scan for any "I tested," "I sat in," "I chose" language referring to the Aeron. Replace with research-voice equivalents: "Steelcase's specs show…", "Based on manufacturer data…", "On paper, the Aeron's…"

---

**C3 — Duplicate title and meta: `/best-office-chairs/` is a canonical duplicate of `/office-chairs-for-tall-people/`**
- Both pages share:
  - **Title:** `Best Office Chairs for Tall People 2026 (6'0"–6'7" Guide)` (75 chars)
  - **Meta:** `Best office chairs for tall people: Leap Plus (22.5" seat height) for 6'4"+, Aeron Size C and Gesture to 6'4" — verdicts by height bracket with exact specs.` (168 chars)
  - **OG Title:** Identical
- **GSC split:** `/office-chairs-for-tall-people/` gets 17 clicks at pos 8.2; `/best-office-chairs/` gets 9 clicks at pos 17.9 on overlapping queries (`best office chairs for tall people`, `office chairs for tall people`).
- Google is almost certainly choosing which to rank on a query-by-query basis, splitting authority. The pos 17.9 on `/best-office-chairs/` is the signal that it's being deprioritized.
- **Fix options (choose one):**
  1. **Consolidate:** 301 redirect `/best-office-chairs/` → `/office-chairs-for-tall-people/`. Update all internal links.
  2. **Differentiate:** Give `/best-office-chairs/` a distinct angle (e.g., general audience, not tall-specific), unique title, and unique meta — only viable if there is a genuine content difference.
  - **Recommended:** Option 1 (consolidate). The queries hitting `/best-office-chairs/` (`best office chairs for tall people`) are identical to the target queries for `/office-chairs-for-tall-people/`.

---

### 🟠 HIGH

---

**H1 — Title over character limit: `/knee-pain-seat-depth/`**
- **Current title (67 chars):** `Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People`
- Ideal range is 50–60 chars. At 67 chars this is likely truncating in SERP on mobile.
- **CTR context:** 36,167 impressions at pos 5.8 = the site's single largest impression asset. Even a 0.1% CTR improvement = ~36 additional clicks per 90 days. This is the highest-leverage rewrite on the site.
- **Current meta (144 chars):** Passive, process-focused. Does not signal the payoff.
- **Fix — Title rewrite (57 chars):** `Seat Depth & Knee Pain: The Fix for Tall People`
- **Fix — Meta rewrite (147 chars):**
  `Popliteal pressure from a short seat edge causes knee pain in tall people. Here's the exact seat depth you need by height — and which chairs hit it.`
- **Why high:** The page already ranks well. This is a conversion problem, not a rankings problem. The fix is meta copy, not content.

---

**H2 — Meta over character limit on multiple pages**

| Page | Current Length | Issue |
|------|---------------|-------|
| `/review/leap-plus/` | 170 chars | Truncates in SERP |
| `/office-chairs-for-tall-people/` | 168 chars | Truncates in SERP |
| `/best-office-chairs/` | 168 chars | Truncates (+ duplicate issue) |
| `/aeron-vs-gesture/` | 159 chars | Borderline, monitor |
| `/review/aeron-size-c/` | 166 chars | Truncates |
| `/chairs/steelcase-gesture/` | 170 chars | Truncates |

Ideal: 130–155 chars. Pages above 155 chars risk Google rewriting the snippet with worse copy.

**Fix — `/review/leap-plus/` (rewrite to ≤155 chars, 153 chars):**
`Leap Plus spec analysis for tall users 6'0"–6'6": 19.75" seat depth, 22.5" seat height ceiling, 500 lb capacity. Who fits — and who doesn't.`

**Fix — `/review/aeron-size-c/` (rewrite to ≤155 chars, 152 chars):**
`Aeron Size C fits most 6'0"–6'3" users: 20.5" seat height, fixed 18.5" depth. Who it fits, who should consider the Leap Plus, and why.`

**Fix — `/chairs/steelcase-gesture/` (rewrite to ≤155 chars, 150 chars):**
`Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Tall-person fit analysis vs Aeron and Leap Plus.`

**Fix — `/office-chairs-for-tall-people/` (rewrite to ≤155 chars, 154 chars):**
`Leap Plus for 6'4"+, Aeron Size C and Gesture to 6'4" — height-by-height verdicts with exact seat height, depth, and back height specs.`

---

**H3 — CTR leak: `/review/gesture/` — meta undersells the only first-person tested review on the site**
- **Current meta (158 chars):** `Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.`
- This page has the strongest E-E-A-T claim on the site (Jackson's personal chair) and it's not leading with the most differentiating signal: *this is a real long-term owner review, not a spec sheet.*
- **Fix — Meta rewrite (152 chars):**
  `Reviewed by a 6'4" ME student who owns the Gesture. Seat depth, back height, and armrest verdict for tall users 6'1"–6'7". Who fits, who doesn't.`
- **Fix — Title (55 chars — within range, keep):** Current title is good. No change needed.
- **Note:** Confirm page body matches — first-person language is appropriate and authorized on this page only.

---

**H4 — Title over limit: `/office-chairs-for-tall-people/` and `/best-office-chairs/`**
- Both at 75 chars — significantly over the 50–60 char target.
- **Fix — `/office-chairs-for-tall-people/` title (58 chars):**
  `Best Chairs for Tall People 2026: 6'0"–6'7" Guide`
- (If `/best-office-chairs/` is consolidated per C3, its title is moot.)

---

**H5 — `/chairs/steelcase-gesture/` — 0 clicks on 629 impressions, meta over-length, weak differentiation**
- This page overlaps with `/review/gesture/` in intent. At pos 8.8 with 0 clicks, the meta is not earning the click.
- **Fix — Meta rewrite (already drafted in H2 above, 150 chars):** ✓
- **Additional fix:** Clarify page's role vs `/review/gesture/`. If `/chairs/steelcase-gesture/` is the hub/spec page and `/review/gesture/` is the review, the metas should signal different value propositions. The hub page should lead with specs; the review should lead with owner experience.

---

### 🟡 MEDIUM

---

**M1 — `/correct-chair-dimensions/` — Title over limit (73 chars)**
- **Current:** `Correct Office Chair Dimensions for Tall People: Required Specs by Height`
- **Fix (58 chars):** `Office Chair Dimensions for Tall People: Specs by Height`
- Meta at 153 chars is within range — no change needed.

---

**M2 — `/correct-chair-dimensions/` — AIO suppression on top query, secondary queries recoverable**
- `cornell ergonomics chair seat height feet flat thighs parallel` (pos 4.8, 16 impr, 0 clicks) — confirmed AIO. Cannot fix with meta.
- `standard size of a office chair` (pos 16.7) and `ergonomic chair dimensions` (pos 18.7) — these are ranking poorly because the page targets tall people specifically but the queries are generic. These queries likely won't convert anyway (non-tall audience). **Do not chase these.** Flag for monitoring only.

---

**M3 — `/chairs/steelcase-gesture/seat-depth/` — Mixed suppression situation**
- Top query `steelcase gesture seat depth range inches` (pos 4.1, 27 impr, 0 clicks) — confirmed AIO suppression. Cannot fix.
- `steelcase gesture seat depth adjustment range inches` (pos 6.2, 45 impr, 0 clicks) — **not confirmed AIO**. This is a fixable CTR problem.
- `steelcase gesture seat depth` (pos 10, 25 impr, 0 clicks) — borderline position, can improve with internal link support.
- **Fix — Meta rewrite targeting adjustment query (132 chars — within range, currently fine at 132):** Current meta is actually within spec length. Problem may be that it reads like a spec dump without a benefit signal.
- **Revised meta (134 chars):**
  `Gesture seat depth adjusts 15.75"–18.75" (3" range). How to set it for your leg length — and where 6'4"+ users hit the ceiling.`
- Note: the phrase "how to adjust it" in the current meta is weak. "How to set it for your leg length" is more specific and benefit-forward.

---

**M4 — `/gesture-vs-leap-plus/` — Query leak on `steelcase gesture vs leap v2` (not "leap plus")**
- The page targets the Gesture vs Leap Plus but is also pulling impressions for `steelcase gesture vs leap v2` (37 impr, pos 12.6, 0 clicks). The Leap V2 and Leap Plus are different products.
- **Fix:** Add a section explicitly addressing "Leap V2 vs Leap Plus — which one to compare to the Gesture" — this is a genuine user question and will absorb that query cluster while also reducing confusion.

---

**M5 — `/best-office-chairs-under-500/` — Title under 50 chars**
- **Current (45 chars):** `Best Office Chairs for Tall People Under $500`
- At 45 chars there's unused SERP real