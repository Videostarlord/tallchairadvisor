# TCA Weekly Audit Report
**Generated:** 2026-07-20T07:23:29.399Z
**Data range:** 2026-04-21 → 2026-07-20

# TCA SEO Audit Report
**Audit Date:** 2026-05-15 (current week)
**Auditor:** Jackson Christopher | tallchairadvisor.com

---

## 1. Executive Summary

The site has grown impressively (94,576 impressions, 207 clicks, avg pos 8.1), continuing the trajectory confirmed in prior audits. However, the sitewide CTR remains critically suppressed at **0.22%** — nearly identical to the 0.24% baseline from May 10 — meaning impression gains are not yet converting to proportional traffic. The most urgent structural problem is a **canonical-collision duplicate**: `/best-office-chairs/` has identical title, meta, and canonical pointing to `/office-chairs-for-tall-people/`, wasting a crawled URL and cannibalizing authority. The second-largest opportunity is **mass CTR suppression on spec/informational sub-pages** (seat depth, weight limit, gesture hub) where pages sit at position 7–10 with hundreds of impressions and 0–1 clicks — several confirmed as AIO-suppressed, others fixable via meta rewrites. The three highest-leverage actions this week are: (1) resolve the duplicate page, (2) rewrite metas on the two highest-impression CTR failures (`/knee-pain-seat-depth/` and `/chairs/steelcase-gesture/seat-depth/`), and (3) address the Gesture review's first-person framing compliance issue before it compounds with traffic growth.

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 or near-zero clicks, 90-day window*

| Page | Pos | Impressions | Clicks | CTR | AIO Confirmed? |
|---|---|---|---|---|---|
| `/knee-pain-seat-depth/` | 5.7 | 38,644 | 18 | **0.05%** | Unconfirmed — investigate |
| `/chairs/steelcase-gesture/seat-depth/` | 7.9 | 1,257 | 1 | **0.08%** | Partial (1 of 3 queries) |
| `/chairs/steelcase-gesture/` | 8.6 | 631 | 0 | **0%** | Unconfirmed |
| `/chairs/steelcase-leap-plus/seat-height/` | 8.3 | 493 | 0 | **0%** | Unconfirmed |
| `/chairs/steelcase-gesture/weight-limit/` | 8.1 | 524 | 1 | **0.19%** | Unconfirmed |
| `/review/gesture/` | 7.9 | 9,077 | 7 | **0.08%** | Unconfirmed |

> **Historical note:** Prior audit (Apr 22) confirmed AIO suppression on spec queries like `steelcase gesture 360 armrests description` (pos 7.8, 0 clicks). The seat-depth and weight-limit sub-pages match this exact pattern. Before rewriting metas on AIO-affected queries, verify via incognito SERP — meta rewrites cannot fix AIO suppression and effort is better spent elsewhere if confirmed.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C1 — Duplicate Page: `/best-office-chairs/` is a canonical ghost
**Page:** `/best-office-chairs/`
**Data:** 9 clicks | 1,952 impr | pos 17.7 | CTR 0.46%

**Issue:** This page has identical title, meta description, and canonical tag pointing to `/office-chairs-for-tall-people/`. It is a fully duplicate page that Google is indexing and crawling separately at position 17.7. It is splitting impressions between two URLs, diluting link equity, and wasting crawl budget. The canonical *is* set correctly (pointing to the primary), but the page itself should not exist as a separate crawlable entity if the content is identical.

**Evidence of harm:** 1,952 impressions at pos 17.7 means Google is indexing and ranking the duplicate — it has not fully consolidated signals to the canonical. The primary (`/office-chairs-for-tall-people/`) is only at pos 8.1 with 3,233 impressions despite being the far stronger target URL.

**Fix:**
1. Confirm content is truly identical (spot-check body copy, H1, internal links).
2. If identical: implement a **301 redirect** from `/best-office-chairs/` → `/office-chairs-for-tall-people/`. Do not rely on canonical alone — a crawlable duplicate with 1,952 impressions is not being adequately consolidated by the canonical signal.
3. Update any internal links pointing to `/best-office-chairs/` to point directly to the primary URL.
4. After redirect, monitor `/office-chairs-for-tall-people/` for impression and position improvement within 2–3 weeks.

---

#### C2 — Voice/Attribution Integrity Violation: `/aeron-vs-gesture/` uses first-person comparison framing for a chair Jackson has NOT tested
**Page:** `/aeron-vs-gesture/`
**Data:** 2 clicks | 467 impr | pos 8.9

**Issue:** The Schema headline reads `"Why I Chose the Steelcase Gesture Over the Aeron at 6'4\""` and the meta description reads `"At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage."` This implies Jackson personally sat in and evaluated the Aeron, which he has NOT done. Per site policy, only the Steelcase Gesture may use first-person testing voice. The Aeron review must use research-based, spec-driven voice.

This is not merely a style issue. If a reader, brand, or Google Quality Rater interprets this as a false personal experience claim, it undermines the E-E-A-T credibility the entire site depends on.

**Fix:**
- **Schema headline:** Change to `"Steelcase Gesture vs. Herman Miller Aeron: Tall People Fit Comparison (6'0–6'6+)"` or similar research-voice framing.
- **Meta description (current 159 chars — also over target):** Rewrite to:
  > `Gesture vs. Aeron for tall users: adjustable seat depth and 360° armrests give the Gesture the edge at 6'4"+. Spec-by-spec breakdown.`
  *(131 chars — within 130–155 target)*
- **Body copy audit:** Scan for any "I sat in," "I found," or "I preferred the Aeron" constructions. Replace with `"specs show," "Steelcase data indicates,"` or similar.
- **Title is acceptable** (54 chars, within range, no false attribution).

---

### 🔴 HIGH

---

#### H1 — Catastrophic CTR Failure on Highest-Impression Page: `/knee-pain-seat-depth/`
**Data:** 38,644 impressions | pos 5.7 | 18 clicks | CTR **0.05%**

This is the site's single largest impression asset by a factor of 2x. At position 5.7, a healthy CTR for an informational query should be roughly 3–6%, which would yield ~1,150–2,300 clicks. The site is getting 18. Something is structurally wrong beyond meta copy.

**Diagnosis checklist (in order):**
1. **AIO suppression probability: HIGH.** "Seat depth for knee pain" and "Cornell ergonomics" are perfect AIO targets. Run an incognito SERP check immediately. If AIO is present above organic results, this is the primary cause and meta rewrites alone will not recover it.
2. **Title is 67 chars — over the 60-char hard limit.** Likely truncating in SERP. This reduces perceived quality and CTR.
3. **Meta description:** Current (144 chars) is within range and benefit-led. It's decent but could be more specific.

**Fixes:**

*Title (current 67 chars — MUST shorten):*
- Current: `Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People`
- Rewrite: `Seat Depth & Knee Pain: The Fix for Tall People` (47 chars)
- Or: `Why Your Chair Hurts Your Knees (Tall People Fix)` (49 chars)
- Keep the "Cornell" authority signal if space allows: `Seat Depth & Knee Pain Fix for Tall People (Cornell Rule)` — 57 chars ✓

*If AIO is NOT confirmed, also rewrite meta:*
- Current: `Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it.` (144 chars)
- Rewrite: `Seat edge pressure on your hamstrings is the cause. Measure your exact seat depth in 60 seconds — and see which chairs actually reach it for 6'+ users.` (152 chars ✓)

**Note:** This page produced the site's first affiliate commission ($18, May 1). Protecting and growing this page's traffic is the highest-value content action on the site.

---

#### H2 — Title Over Length on `/correct-chair-dimensions/` + Underperforming at pos 9.6
**Page:** `/correct-chair-dimensions/`
**Data:** 30 clicks | 16,917 impr | pos 9.6 | CTR 0.18%

**Issues:**
1. **Title is 73 chars** — significantly over limit, will truncate in SERPs.
2. **Meta is 153 chars** — technically 1 char over the 130–155 ideal (marginal, acceptable).
3. **Query leak:** `standard size of a office chair` (88 impr, pos 16.6) and `ergonomic chair dimensions` (54 impr, pos 18.9) are ranking too low to drive clicks regardless of meta. These signal content may not be speaking the language of searchers who don't know they need "tall-person specs."
4. The AIO-flagged query (`cornell ergonomics chair seat height feet flat thighs parallel`, pos 4.8, 0% CTR) is confirmed suppressed — do not optimize for it.

**Fixes:**

*Title (must shorten to 50–60 chars):*
- Current: `Correct Office Chair Dimensions for Tall People: Required Specs by Height`
- Rewrite: `Office Chair Dimensions for Tall People: By Height` (50 chars ✓)
- Or: `Ergonomic Chair Specs for Tall People (6'0–6'7+)` (49 chars ✓)

*Content depth (addresses rank 9.6 and leaking queries):*
- Add a comparison table explicitly using the phrase "standard office chair dimensions" vs "tall-person minimums" to capture that query cluster at its natural language.
- Add internal links to `/correct-chair-dimensions/` from `/knee-pain-seat-depth/` and `/office-chairs-for-tall-people/` — this page has the volume to justify hub-level internal link support.

---

#### H3 — `/review/gesture/` CTR suppression at pos 7.9 with 9,077 impressions
**Page:** `/review/gesture/`
**Data:** 9,077 impr | pos 7.9 | 7 clicks | CTR **0.08%**

**Issue:** This is the second-highest impression page and the only page with Jackson's genuine first-person test authority. 0.08% CTR at position 7.9 is deeply below expected. No AIO confirmation is noted in the data.

**Meta description (current 158 chars — over target, truncating):*
- Current: `Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.`
- Issue: "Independent review by a 6'4" owner" is the strongest differentiating signal on the site and is leading correctly. But 158 chars risks truncation before "who it doesn't" — the most emotionally compelling part.
- Rewrite: `Independent review by a 6'4" owner. Seat depth, back height, and armrest verdict for 6'1"–6'7" — who it fits and who should look elsewhere.` (141 chars ✓)

**Title (55 chars — within range, acceptable):** No change needed.

**Schema check:** Schema uses `@type: Product` with `@id` — verify that `aggregateRating` is populated. A product schema without a rating is a missed rich result opportunity at this impression volume.

---

#### H4 — `/chairs/steelcase-gesture/` at pos 8.6 with 0 clicks — schema type mismatch
**Page:** `/chairs/steelcase-gesture/`
**Data:** 631 impr | pos 8.6 | 0 clicks | CTR 0%

**Issues:**
1. **Schema `@type` is not `Product` — it is detected as `Article` with a `name` field rather than `headline`.** Product-intent pages (chair fit analyses positioned as landing pages for a specific chair) should use `Product` schema to be eligible for rich results. The current schema uses `@type: Article` with `name` (not `headline`) — malformed for Article type.
2. **Meta description is 170 chars — over the 155-char hard target.** Will truncate.
3. **Query leak:** `steelcase gesture for tall people` (20 impr, pos 11.8, 0% CTR) — this is the primary target query and it's not breaking page 1.

**Fixes:**

*Meta (must shorten — current 170 chars):*
- Current: `Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus.`
- Rewrite: `Steelcase Gesture fits 6'0"–6'4": 21" seat height, 18.75" adjustable depth. Height-by-height verdict vs. Aeron and Leap Plus.` (128 chars — slightly under, acceptable)
- Or: `Gesture for tall people: 21" seat height, 18.75" depth, fits 6'0"–6'4". Spec analysis plus comparison to Aeron and Leap Plus.` (127 chars ✓)

*Schema fix:*
- Either change `@type` to `Product` (if the page functions as a product landing page with spec data) and add `aggregateRating` + `offers` if possible.
- Or fix the Article schema: change `"name"` → `"headline"` to make it valid Article markup.

---

### 🟡 MEDIUM

---

#### M1 — `/review/leap-plus/` meta description over length (170 chars)
**Page:** `/review/leap-plus/`
**Data:** 34 clicks | 11,911 impr | pos 8.7 | CTR 0.29%

**Issue:** Meta is 170 chars, over the 155-char target. Will truncate in SERP, cutting off "Who fits and who doesn't" — the highest-intent signal.

**Query leak:** `steelcase leap plus` (928 impr, pos 10.3, 1.19% CTR) — this is a high-volume branded query just outside page 1. A push to pos 9 or below would meaningfully increase clicks.

**Fix:**

*Meta (shorten from 170 chars):*
- Current: `Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.`
- Rewrite: `Leap Plus for tall people: 22.5" seat height, 19.75" depth, 500 lb capacity. Spec-driven fit analysis for 6'0"–6'6" — who fits, who doesn't.` (142 chars ✓)

**Schema:** `@type: Product` — verify `aggregateRating` is present. 11,911 impressions justifies full rich result optimization.

---