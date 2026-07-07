# TCA Weekly Audit Report
**Generated:** 2026-07-07T10:56:57.049Z
**Data range:** 2026-04-07 → 2026-07-06

# TCA SEO Audit Report
**Generated for:** tallchairadvisor.com
**Audit period:** Last 90 days
**Auditor:** Jackson Christopher

---

## 1. Executive Summary

The site is generating strong impression volume (78,826 across 90 days) but converting at a deeply suppressed 0.21% CTR (167 clicks) — a structural problem, not a content quality problem. Two distinct suppression mechanisms are at work: AIO capture on spec/informational queries (unfixable via meta rewrites) and title/meta underperformance on commercial review and comparison pages (fixable). The highest-leverage opportunity is the `/knee-pain-seat-depth/` page: 30,405 impressions at position 5.9 represents roughly 38% of all site impressions on a single page, and its 0.06% CTR is catastrophically low even after accounting for AIO bleed. Duplicate title/meta content between `/best-office-chairs/` and `/office-chairs-for-tall-people/` is actively cannibalizing the site's most competitive head term. Fixing the three issues flagged in Section 6 this week could plausibly 3–5x click yield without a single new content piece.

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 or near-0 clicks — top priority*

| Page | Pos | Impr | CTR | Leak Type |
|---|---|---|---|---|
| `/knee-pain-seat-depth/` | 5.9 | 30,405 | 0.06% | Partial AIO + meta failure |
| `/chairs/steelcase-gesture/seat-depth/` | 8.1 | 1,236 | 0.08% | AIO (2 of 3 queries confirmed) + meta failure |
| `/chairs/steelcase-gesture/` | 9.0 | 606 | 0% | Meta failure (no AIO flagged) |
| `/chairs/steelcase-leap-plus/seat-height/` | 8.6 | 458 | 0% | Meta failure + spec error in title |
| `/review/gesture/` | 7.9 | 8,296 | 0.08% | Meta voice mismatch |

> **AIO note (per historical policy):** Queries flagged ⚠AIO on `/knee-pain-seat-depth/` and `/steelcase-gesture/seat-depth/` cannot be rescued by meta rewrites. The fix on those pages is to recover the *non-AIO* click share — rewrite metas to target users who scroll past the AI Overview (i.e., people who want chair recommendations, not just the rule definition).

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C-1: Duplicate Title + Meta Across Two Live Pages
**Pages:** `/best-office-chairs/` and `/office-chairs-for-tall-people/`

Both pages share:
- **Title:** `Best Office Chairs for Tall People 2026 (6'0"–6'7" Guide)` (75 chars)
- **Meta:** `Best office chairs for tall people: Leap Plus (22.5" seat height) for 6'4"+, Aeron Size C and Gesture to 6'4" — verdicts by height bracket with exact specs.` (168 chars)

This is active cannibalization on the site's highest-volume head term (`best office chairs for tall people`). Google cannot distinguish the pages, splits equity between them, and neither reaches page 1. `/office-chairs-for-tall-people/` is at pos 8.1 with 2,895 impressions; `/best-office-chairs/` is at pos 18.1 with 1,846 impressions — they are competing against each other.

**Fixes:**
1. **Decision required first:** Determine which page is the canonical hub. Given `/office-chairs-for-tall-people/` has 2x the impressions and better position, it should be the hub.
2. **Either** 301-redirect `/best-office-chairs/` → `/office-chairs-for-tall-people/` (if content is substantially the same), **or** differentiate `/best-office-chairs/` as a separate page targeting a distinct intent (e.g., broader audience, not tall-specific).
3. If keeping both, rewrite `/best-office-chairs/` title and meta immediately:
   - **Title (58 chars):** `Best Ergonomic Office Chairs 2026: Tall User Ranked Guide`
   - **Meta (148 chars):** `Top-rated ergonomic chairs ranked by seat height, depth, and back height — with fit verdicts for users 6'0" to 6'7"+. Updated for 2026.`
4. Both current titles are also **over 60 chars** (75 chars) — expect truncation in SERPs.

---

#### C-2: Spec Inconsistency in Title — `/chairs/steelcase-leap-plus/seat-height/`
**Severity: Critical** (wrong data visible in SERP snippet)

- **Title reads:** `Steelcase Leap Plus Seat Height: 15.5"–22.5" Range`
- **Meta reads:** `15.5"–20.5" range`

The title claims 22.5" ceiling; the meta says 20.5". These are both visible in the SERP snippet simultaneously. 22.5" is the correct Leap Plus maximum seat height — the meta contains the error. A user reading the snippet sees a contradiction and loses confidence. With 458 impressions at position 8.6 and 0 clicks, this may be a direct conversion killer.

**Fix:**
- **Rewrite meta (149 chars):** `Steelcase Leap Plus seat height: 15.5"–22.5" range (7" adjustment). Why the extra-high ceiling matters for users 6'4"+ and how to set it correctly.`

---

### 🔴 HIGH

---

#### H-1: `/knee-pain-seat-depth/` — Meta Not Targeting Commercial Intent Below AIO
**Page:** `/knee-pain-seat-depth/`
**GSC:** 30,405 impr | pos 5.9 | 0.06% CTR

This is the single most important page on the site by impression volume. The three flagged query leaks are all ⚠AIO — Google is answering "Cornell ergonomics 2-inch rule" definitionally. However, at 30,405 impressions and position 5.9, there is a substantial non-AIO query pool also hitting this page (the 30K impressions cannot be explained by three queries totaling ~256 impressions).

The current meta is informationally accurate but passive:
> *"Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it."*

This reads like a definition page. Users who scroll past an AI Overview are looking for **chair recommendations**, not the Cornell rule restatement. The meta needs to signal that this page delivers actionable product-level guidance.

**Rewrite meta (153 chars):**
`If your chair seat is too long, it compresses the backs of your knees. Exact seat depth targets by height — and which chairs actually reach them.`

**Also fix: Title is 67 chars (over limit)**
Current: `Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People`
- **Rewrite title (58 chars):** `Seat Depth & Knee Pain: The Tall Person's Fix`

> ⚠️ **OG Title mismatch:** OG Title uses HTML entity `&#38;` which renders as `&` — visually correct, but verify it renders properly in social share previews. Not a SERP issue but worth a sanity check.

---

#### H-2: `/review/gesture/` — First-Person Meta on a Non-Personally-Tested Chair
**Page:** `/review/gesture/`
**GSC:** 8,296 impr | pos 7.9 | 0.08% CTR

Current meta:
> *"Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't."*

**This is accurate** — Jackson personally owns and tested the Steelcase Gesture. The meta voice is legitimate. However, "Independent review by a 6'4" owner" with 0.08% CTR at position 7.9 across 8,296 impressions suggests the meta is failing to communicate *verdict*, not failing on credibility. The current meta frontloads methodology; users scanning SERPs want the outcome.

**Rewrite meta (152 chars):**
`Tested by a 6'4" ME student: the Gesture fits 6'1"–6'4" well, borderline at 6'5"+. Seat depth, armrest, and back height verdict — and who should skip it.`

**Title is fine** at 55 chars and verdict-clear.

---

#### H-3: `/chairs/steelcase-gesture/` — 0 Clicks at Position 9, Meta Too Spec-Heavy
**Page:** `/chairs/steelcase-gesture/`
**GSC:** 606 impr | pos 9.0 | 0% CTR

Current meta (170 chars — over 155 char ideal):
> *"Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus."*

This is 170 chars (truncated in SERP) and leads with raw specs that Google may already show in rich snippets or AIO. No AIO is flagged for this page's top query, meaning this is a pure meta/title conversion problem.

**Rewrite meta (147 chars):**
`The Gesture fits most 6'0"–6'4" users — but seat height tops at 21". Full fit analysis by height, with comparison to Leap Plus for users 6'4"+.`

**Title is fine** at 54 chars.

---

#### H-4: `/review/leap-plus/` — Meta Over Character Limit, CTR Suppressed
**Page:** `/review/leap-plus/`
**GSC:** 9,774 impr | pos 8.8 | 0.26% CTR
**Meta length:** 170 chars (over 155 limit — will be truncated mid-sentence)

Current meta:
> *"Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't."*

Gets truncated before "Who fits and who doesn't" — the most valuable part — is displayed.

**Rewrite meta (150 chars):**
`Leap Plus for tall users: 22.5" seat height, 19.75" max depth, 500 lb capacity. Who it fits from 6'0"–6'6"+, and who should look elsewhere.`

**Also:** Title at 49 chars is under the 50-char minimum. Consider:
- **Title (54 chars):** `Steelcase Leap Plus Review: Tall User Fit Guide 2026`

---

#### H-5: `/aeron-vs-gesture/` — First-Person Voice Implied for Non-Gesture Chair
**Page:** `/aeron-vs-gesture/`
**GSC:** 481 impr | pos 9.1 | 0.21% CTR

Current meta:
> *"At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage. Height-by-height verdict for tall users."*

Schema headline: *"Why I Chose the Steelcase Gesture Over the Aeron at 6'4""*

**The meta is legitimate** — Jackson personally tested the Gesture and can speak to this comparison from the Gesture side. However, the Aeron dimension of the comparison must be research-based. The meta implies a head-to-head personal use comparison of both chairs. If the page contains first-person language about *sitting in* the Aeron, that is an E-E-A-T integrity issue.

**Action:** Audit page body copy for any first-person Aeron testing claims. If present, rewrite to research-based voice. The meta itself is borderline acceptable but the schema headline ("Why I Chose") may overclaim — consider:
- **Schema headline update:** `Steelcase Gesture vs Herman Miller Aeron: Tall User Fit Analysis`

---

### 🟡 MEDIUM

---

#### M-1: `/correct-chair-dimensions/` — Title Over 60 Chars, Meta Over 155
**Page:** `/correct-chair-dimensions/`
**GSC:** 13,879 impr | pos 9.6 | 0.12% CTR

- **Title:** 73 chars (will truncate at ~60) — `Correct Office Chair Dimensions for Tall People: Required Specs by Height`
- **Meta:** 153 chars (at the edge of acceptable, likely fine)

**Title rewrite (58 chars):** `Office Chair Dimensions for Tall People: Specs by Height`

The AIO-flagged query (`cornell ergonomics chair seat height feet flat thighs parallel`, pos 4.8) is informational and likely unrescuable. The bigger opportunity is the `standard size of a office chair` (pos 17) and `ergonomic chair dimensions` (pos 18.8) — both deep in page 2, suggesting content may not be covering these sub-topics with enough depth.

**Content fix:** Add a section explicitly addressing standard/generic office chair dimension ranges and why they fail tall users — this targets the non-tall-specific variant queries at pos 17–18.

---

#### M-2: `/chairs/steelcase-gesture/seat-depth/` — AIO Capture + Meta Too Narrow
**Page:** `/chairs/steelcase-gesture/seat-depth/`
**GSC:** 1,236 impr | pos 8.1 | 0.08% CTR

Two of three queries are ⚠AIO-flagged. The page's meta is currently a spec statement:
> *"Gesture seat depth: 15.75"–18.75" (3" range). Fits 6'0"–6'4"; at 6'4"+ use full extension. How to adjust it."*

This is exactly what an AI Overview would answer. Users who scroll past need a reason to click — currently there is none.

**Rewrite meta (143 chars):**
`Gesture seat depth adjusts 15.75"–18.75". At 6'4"+ you'll need full extension — here's whether that's enough, and how to set it for your leg length.`

Note: This page is a candidate for **consolidation with `/review/gesture/`** as a subsection rather than a standalone page — 1,236 impressions is low and the AIO capture rate is high. Flag for next content strategy review.

---

#### M-3: `/office-chairs-for-tall-people/` — Title Over 60 Chars
**Title:** 75 chars — `Best Office Chairs for Tall People 2026 (6'0"–6'7" Guide)`

**Rewrite title (58 chars):** `Best Office Chairs for Tall People 2026: Ranked by Fit`

Meta at 168 chars is also over the 155-char ideal:
**Rewrite meta (151 chars):**
`Leap Plus for 6'4"+, Gesture and Aeron Size C to 6'4" — exact seat height, depth, and back height verdicts for every height bracket.`

---

#### M-4: `/gesture-vs-leap-plus/` — Query Intent Mismatch
**Page:** `/gesture-vs-leap-plus/`
**GSC:** 1,169 impr | pos 11.2 | 0.43% CTR

Top leak: `steelcase gesture vs leap v2` (pos 13.9) — note the query says **Leap V2**, not Leap Plus. These are different products. If the page does not address the Leap V2 explicitly (including why the Leap Plus is the relevant comparison for tall users), it will continue to miss this query cluster.

**Content fix:** Add a section explicitly addressing "Gesture