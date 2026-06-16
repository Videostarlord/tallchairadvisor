# TCA Weekly Audit Report
**Generated:** 2026-06-16T12:54:47.089Z
**Data range:** 2026-03-17 → 2026-06-15

# TCA Site Audit Report
**Period:** 90-day rolling | **Generated for:** tallchairadvisor.com
**Auditor:** Jackson Christopher, 6'4", ME student, UC Berkeley

---

## 1. Executive Summary

The site has scaled to 43,748 impressions across 20 pages but is converting at 0.25% CTR (109 clicks) — structurally below what positions 5–10 should produce. The core problem is unchanged from prior audits: high-impression pages are sitting in positions 7–10 with near-zero CTR, and the gap between impressions and clicks has widened as impression volume grows. Three distinct problems drive this: (1) title/meta tags that fail to pull clicks at competitive positions, (2) a cluster of spec/informational pages being suppressed by AI Overviews where rewrites cannot help, and (3) two pages with genuine content-depth deficits sitting at pos 18–29 where clicks are structurally impossible until content improves. The single highest-leverage action this week is meta rewrites on the four pages with >1,000 impressions and sub-0.15% CTR, particularly `/knee-pain-seat-depth/` (13,347 impressions, 0.10% CTR).

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 or near-0 clicks — ranked by impression waste*

| Page | Impr | Pos | CTR | Diagnosis |
|---|---|---|---|---|
| `/knee-pain-seat-depth/` | 13,347 | 6.8 | 0.10% | Meta weak; some queries AIO-suppressed but not all |
| `/correct-chair-dimensions/` | 6,689 | 10.8 | 0.15% | Title too long (73 chars); meta too generic |
| `/review/gesture/` | 6,385 | 7.9 | 0.09% | Meta over-length (158 chars); first-person voice claim needs care |
| `/chairs/steelcase-gesture/seat-depth/` | 1,123 | 8.1 | 0.09% | Two top queries AIO-suppressed; meta too short/thin |
| `/chairs/steelcase-gesture/` | 604 | 8.6 | 0.00% | Meta over-length (170 chars); title generic |
| `/chairs/steelcase-leap-plus/seat-height/` | 535 | 9.1 | 0.00% | **Spec inconsistency** in title vs meta (see below) |
| `/fit-guides/` | 301 | 8.0 | 0.00% | Index/hub page with no value proposition in meta |

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

**C1 — Spec Contradiction: `/chairs/steelcase-leap-plus/seat-height/`**
**Severity:** Critical | **Impact:** Trust/E-E-A-T destruction, likely causing 0% CTR

The **title says `15.5"–22.5"`** but the **meta description says `15.5"–20.5"`**. These are two different numbers on the same page in the same SERP snippet. Users see a factual contradiction before clicking. The correct Steelcase Leap Plus seat height range is **15.5"–20.5"** (the standard Leap V2 Plus cylinder). The title is wrong.

- **Fix title to:** `Steelcase Leap Plus Seat Height: 15.5"–20.5" Range` (51 chars ✓)
- **Verify internally:** audit the page body for any mention of 22.5" and correct or explain if it refers to a different cylinder configuration. Do not publish conflicting specs on the same page.
- If 22.5" appears anywhere, it needs a sourced footnote explaining which specific cylinder/config produces that measurement — or remove it entirely.

---

**C2 — First-Person Voice Scope Violation: `/review/gesture/` meta description**
**Severity:** Critical | **Impact:** E-E-A-T integrity, brand trust, FTC compliance risk

Current meta (158 chars):
> *"Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't."*

Jackson has personally tested the Gesture — this is the **one page** where first-person ownership language is legitimate. However, the meta is **158 characters** (over the 155-char ceiling) and will be truncated in SERPs, cutting off the critical "who it doesn't" verdict.

Additionally, audit the **Schema block** — it uses `@type: Product` which is correct for a review page, but verify `review` and `aggregateRating` sub-properties are populated, otherwise Google may not surface the rich result.

- **Rewrite meta to (148 chars):** `"6'4" owner review. Seat depth 15.75"–18.75", 360° armrests, 21" seat height — height-by-height verdict for tall users 6'1"–6'7". Who it fits."`
- **Schema fix:** confirm `"review": {"@type": "Review", "author": {"@type": "Person", "name": "Jackson Christopher"}}` is present inside the Product schema block.

---

**C3 — First-Person Voice Violation: `/aeron-vs-gesture/` meta description**
**Severity:** Critical | **Impact:** E-E-A-T integrity — Jackson has NOT personally tested the Aeron

Current meta (159 chars):
> *"At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage. Height-by-height verdict for tall users."*

The phrase **"the Gesture won"** implies Jackson personally compared both chairs. He has only tested the Gesture. The Aeron comparison is research-based. This framing misrepresents his direct experience and violates the site's core E-E-A-T policy.

The Schema headline also says: *"Why I Chose the Steelcase Gesture Over the Aeron at 6'4\""* — same problem, schema-embedded.

- **Rewrite meta to (152 chars):** `"Spec-by-spec: Gesture seat depth 18.75" vs Aeron's fixed 18.25". At 6'4", the adjustable depth wins. Height-by-height breakdown for 6'0"–6'7" users."`
- **Fix schema headline to:** `"Steelcase Gesture vs Herman Miller Aeron Size C: Tall People Fit Comparison"`
- Remove or reframe all "I chose" / "I tested both" body copy — Aeron analysis must be research-voiced.

---

### 🔴→🟠 CRITICAL/HIGH (Boundary)

---

**C4 — First-Person Voice Violation: `/best-office-chairs-under-500/` meta description**
**Severity:** Critical | **Impact:** Same E-E-A-T integrity issue as C3

Current meta (152 chars):
> *"Honest budget picks for tall users from an ME student who spent months researching before buying the $1,649 Gesture. Spec-driven fit analysis by height."*

"Before buying the $1,649 Gesture" implies the budget chairs were personally evaluated as alternatives. Jackson only owns and tested the Gesture — the budget chairs are research/spec-based. The framing implies comparative personal testing that didn't happen.

- **Rewrite meta to (149 chars):** `"Budget ergonomic picks for tall users 6'0"–6'6": spec-verified seat heights, depths, and back heights. Tested framework, research-based comparisons."`

---

### 🟠 HIGH

---

**H1 — Title Over-Length: `/correct-chair-dimensions/`**
**Severity:** High | **Impact:** Title truncation in SERPs, CTR suppression on a 6,689-impression page

Current title: `Correct Office Chair Dimensions for Tall People: Required Specs by Height` — **73 characters** (limit: 60). Google will truncate at roughly char 60, cutting off "by Height" and potentially the most useful qualifier.

- **Rewrite title to (58 chars):** `Office Chair Dimensions for Tall People: Specs by Height`
- **Rewrite meta (currently 153 chars — borderline):** Keep but reorder to front-load the most scannable value. Current is acceptable if title is fixed.

---

**H2 — Meta Over-Length: `/review/leap-plus/`**
**Severity:** High | **Impact:** Truncation on a 4,226-impression page; CTR 0.31% could improve

Current meta: **170 characters** (limit: 155). Truncated at ~155 chars, losing "Who fits and who doesn't" — the exact verdict signal that drives clicks.

- **Rewrite meta to (151 chars):** `"Seat depth 15.75"–19.75", 500-lb capacity, 22.5" seat height ceiling. Research-based fit analysis for tall users 6'0"–6'6". Who fits and who doesn't."`

---

**H3 — Meta Over-Length: `/chairs/steelcase-gesture/`**
**Severity:** High | **Impact:** 170 chars on a 604-impression, 0-click page

Current meta: **170 characters**.

- **Rewrite meta to (148 chars):** `"Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. How it compares to Aeron and Leap Plus for tall users."`

---

**H4 — Meta Over-Length: `/aeron-vs-gesture/`**
**Severity:** High | **Impact:** 159 chars on a 495-impression page (see also C3 above)

Already captured in C3 fix above.

---

**H5 — CTR Leak on High-Value Page: `/knee-pain-seat-depth/`**
**Severity:** High | **Impact:** 13,347 impressions at 0.10% CTR = ~13 clicks vs. ~100+ possible at pos 6.8

The current meta is reasonable but not verdict-first. At position 6.8 with this impression volume, even moving from 0.10% to 0.5% CTR = +50 clicks/quarter. The three top queries split between AIO-suppressed (2 of 3 flagged) and non-suppressed — the non-AIO query `"cornell ergonomics chair seat depth two fingers behind knee"` (122 impr, pos 6.4) is the organic opportunity.

Current meta: *"Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it."* — 144 chars ✓ (length fine)

Problem: meta describes the page rather than delivering the verdict. "Here's how to measure" is process language, not answer language.

- **Rewrite meta to (143 chars):** `"Cornell rule: seat edge 2" behind knee. At 6'2"+, most chairs are too short. How to measure your depth and which chairs actually fit."`
- **Title fix (currently 67 chars — over limit):** `Cornell Ergonomics Seat Depth Rule for Tall People` (50 chars ✓) — remove `&amp;` entity which may render oddly

---

**H6 — Near-P1 Page with No Meta CTR Pull: `/office-chairs-for-6-foot-4/`**
**Severity:** High | **Impact:** pos 4.8 with 454 impressions, only 1 click (0.22% CTR)

Position 4.8 should yield 3–6% CTR organically. 0.22% at this position is a serious SERP presentation failure.

Current meta: *"At 6'4", the Leap Plus is the safest default: 22.5" seat height, 19.75" depth. Full comparison with Gesture and Aeron — height-by-height verdict."* — 157 chars (2 chars over limit, likely truncated)

- **Rewrite meta to (149 chars):** `"6'4" fit guide: Leap Plus (22.5" height, 19.75" depth) vs Gesture vs Aeron. Which one clears the threshold — height-by-height verdict."`
- **Also audit:** Is this page cannibalizing `/review/gesture/` or `/review/leap-plus/`? The 6'4" page at pos 4.8 should be the #1 converter on site. Check for internal linking — does every tall-person review page link to this?

---

**H7 — Schema Type Mismatch: `/chairs/steelcase-gesture/`**
**Severity:** High | **Impact:** Incorrect schema suppresses rich results eligibility

Schema block uses `@type: Article` with a `name` property (not `headline`). `Article` schema requires `headline`, not `name`. The `name` property belongs to `Product` or `Organization` schema. This malformed block will not validate correctly and wastes rich-result eligibility.

- **Fix:** Change `"name"` to `"headline"` in the Article schema block, or switch to `@type: Product` if this is a product-fit analysis page (preferred — consistent with `/review/gesture/` treatment).

Same issue exists at `/chairs/herman-miller-aeron/` — Schema uses `@type: Article` with `name` instead of `headline`.

---

### 🟡 MEDIUM

---

**M1 — AIO-Suppressed Query Cluster: `/chairs/steelcase-gesture/seat-depth/`**
**Severity:** Medium | **Impact:** Two of the top queries are AIO-confirmed — meta rewrites have limited upside

Per prior audit methodology (confirmed in wiki): AIO suppression on spec queries cannot be fixed by meta rewrites. The real action here is **content pivoting** — add a section that goes beyond the spec into application territory (e.g., "What the 3" range actually means for 6'4" users sitting 8 hours") to capture the non-spec intent around this query.

- **Do:** Add a "What this means at your height" section with practical framing
- **Don't:** Prioritize meta rewrite — the AIO is answering the raw spec query before organic results appear

---

**M2 — Hub Page Weak Value Prop: `/fit-guides/`**
**Severity:** Medium | **Impact:** 301 impressions, pos 8.0, 0 clicks — hub/index pages need a pull reason

Current meta: *"Fit and adjustment guides for tall people choosing and setting up ergonomic office chairs. Seat depth, back height, and lumbar targeting by height."* — 147 chars

This describes a category, not a benefit. At pos 8.0, users need a reason to click a hub page over a specific guide.

- **Rewrite meta to (145 chars):** `"Seat depth, lumbar height, back clearance — the 3 dimensions most chairs get wrong for tall users. Guides by spec, by chair, and by height range."`

---

**M3 — Content-Depth Deficit: `/best-office-chairs/`**
**Severity:** Medium | **Impact:** pos 21 on "best office chairs for tall people" — can't win clicks until content improves

Position 21 is not a meta problem — it's a content problem. At pos 21, rewrites are irrelevant to CTR (no impressions clicking page 2). The page needs substantive depth upgrade before any SERP work is worth doing.

- **Action:** Add height-by-height comparison table, spec callouts for each chair, and a "who should NOT buy each chair" section for E-E-A-T differentiation. Internal linking from `/office-chairs-for-tall-people/` and `/correct-chair-dimensions/` once content is upgraded.

---

**M4 — Content-Depth Deficit: `/chairs/herman-miller-aeron/`**
**Severity:** Medium | **Impact:** pos 18.1 — same structural issue as M3

- **Action:** Expand from spec summary to full fit analysis with height-by-height breakdown, matching the depth of `/chairs/herman-miller-aeron/tall-people/` (pos 7.6, 1,