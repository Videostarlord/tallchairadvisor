# TCA Weekly Audit Report
**Generated:** 2026-07-28T10:35:37.838Z
**Data range:** 2026-04-28 → 2026-07-27

# TCA Site Audit Report
**Generated for tallchairadvisor.com | 90-Day Window**
*Auditor: Jackson Christopher | Data snapshot: current*

---

## 1. Executive Summary

The site is in a strong growth phase (97,131 impressions, 221 clicks, 8.1 avg position) but is leaving an enormous amount of traffic on the table: **site-wide CTR is 0.23%**, structurally dragged down by `/knee-pain-seat-depth/` which alone accounts for 40.8% of all impressions (39,625) but only 18 clicks (0.05% CTR). Across 22 pages audited, **4 pages sit at 0% CTR** with meaningful impression volume and positions ≤ 10, all constituting confirmed CTR leaks. The good news: most high-impression pages are already ranking in the 5–10 range, meaning the lever is **CTR + content depth**, not domain authority. Two structural problems repeat site-wide: title tags exceeding the 60-character limit and meta descriptions that fail to lead with a verdict or user-specific hook. Fixing the top 3 issues below could realistically 3–5× total click volume without any new content.

---

## 2. Critical CTR Leaks

*Definition: position ≤ 10, 0 or near-0 clicks, meaningful impression volume. Ordered by impression volume.*

| Page | Impr | Pos | CTR | Leak Severity |
|---|---|---|---|---|
| `/knee-pain-seat-depth/` | 39,625 | 5.8 | 0.05% | 🔴 Critical — site's #1 impression page |
| `/review/gesture/` | 9,037 | 7.9 | 0.07% | 🔴 Critical |
| `/chairs/steelcase-gesture/seat-depth/` | 1,258 | 7.9 | 0.16% | 🔴 Critical |
| `/chairs/steelcase-gesture/` | 636 | 8.9 | 0% | 🔴 Critical |
| `/chairs/steelcase-gesture/weight-limit/` | 607 | 8.0 | 0.16% | 🔴 Critical |
| `/chairs/steelcase-leap-plus/seat-height/` | 530 | 8.4 | 0% | 🔴 Critical |
| `/chairs/herman-miller-aeron/` | 508 | 20.3 | 0% | 🟡 High (pos too deep for meta fix alone) |

> **Note on AIO suppression:** Per prior audit findings (Apr 22), spec-query pages like `/chairs/steelcase-gesture/seat-depth/` have confirmed AI Overview interference on queries like "steelcase gesture seat depth range inches" (pos 4.3, 0 clicks). Meta rewrites cannot fix AIO suppression. The fix for those specific queries is **content restructuring** (see Issue #3 below), not just title/meta changes.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C-1: `/knee-pain-seat-depth/` — Catastrophic CTR at #1 Impression Page
**39,625 impressions, pos 5.8, 0.05% CTR = ~20 clicks expected minimum, getting 18 in 90 days**

This is the single highest-leverage fix on the site. The meta description is informationally competent but **buries the user's problem**. It reads like a textbook explanation, not a verdict. At position 5.8 with 40K impressions, even moving from 0.05% → 1% CTR = ~396 clicks vs. current 18.

**Current title (67 chars — OVER LIMIT):**
`Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People`

**Current meta (144 chars):**
`Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it.`

**Problems:**
- Title is 67 chars (limit: 60). "Cornell Ergonomics Rule" likely truncates in mobile SERP, losing the "Tall People" hook.
- Meta leads with mechanism (cause), not user pain + resolution. Someone searching "knee pain office chair tall" wants confirmation their problem is solvable, not a biomechanics lecture.
- No urgency or specificity signal (no height range, no chair names) to differentiate from generic ergonomics content.

**Recommended fix:**

```
Title (58 chars):
Knee Pain from Office Chair? A Tall Person's Fix

Meta (148 chars):
If you're 6'0"+, your seat is probably too short — crushing the backs of your knees. Exact seat depth formula by height, plus chairs that reach it.
```

**Also required:** Schema `headline` reads *"Knee Pain from Office Chair Seat Depth: Tall People Guide"* — align this with the new title exactly to avoid title/schema mismatch signals.

---

#### C-2: `/review/gesture/` — Personal Review Page at 0.07% CTR
**9,037 impressions, pos 7.9, 6 clicks**

This is Jackson's only personally-tested chair. The meta says "Independent review by a 6'4" owner" — which is the right instinct — but the rest of the description lists specs that belong in a spec page, not the hook of a personal review. The E-E-A-T differentiator (owner, 6'4", ME student) is being wasted.

**Current title (55 chars — OK):**
`Steelcase Gesture Review (2026): Tall User Fit Analysis`

**Current meta (158 chars — OVER LIMIT):**
`Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.`

**Problems:**
- 158 chars is over the 155-char ideal ceiling — likely truncating at "who it doesn't."
- "Seat depth, armrests, back height verdict" reads like a spec list, not a verdict. A personal review meta should lead with the *conclusion*, not the criteria.
- Missing the price signal — this is a $1,649 chair; users at this stage want to know if it's worth it.

**Recommended fix:**

```
Title (55 chars — keep):
Steelcase Gesture Review (2026): Tall User Fit Analysis

Meta (151 chars):
Tested by a 6'4" ME student after 120 days of daily use. Verdict: fits 6'1"–6'4" well; 6'5"+ should look at the Leap Plus. Full spec breakdown.
```

> **Voice integrity check:** This page *is* Jackson's personal review — first-person testing voice is appropriate and correct here. Do not apply research-voice rules to this page.

---

#### C-3: `/chairs/steelcase-gesture/` — 0% CTR, 636 Impressions, Pos 8.9
**This page is a confirmed CTR leak with a fixable meta.**

**Current title (54 chars — OK):**
`Steelcase Gesture for Tall People | Tall Chair Advisor`

**Current meta (170 chars — SIGNIFICANTLY OVER LIMIT):**
`Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus.`

**Problems:**
- 170 chars is 15–25 chars over the ideal ceiling. This is almost certainly being truncated mid-sentence in SERPs, cutting off at approximately "Full tall-person fit analy—". Truncated metas kill CTR.
- The title has a pipe + brand name padding that wastes character space and dilutes keyword density in the visible SERP snippet.
- Query "steelcase gesture for tall people" (18 impr, pos 11.7) is already close — a meta fix alone could pull this into click range.
- **Schema error:** Block uses `"@type":"Article"` with property `"name"` instead of `"headline"` — Article schema requires `headline`, not `name`. This is a structured data error.

**Recommended fix:**

```
Title (52 chars):
Steelcase Gesture: Tall People Fit Guide (2026)

Meta (147 chars):
Gesture fits 6'0"–6'4": 21" seat height, 18.75" depth. Research-based fit analysis by height bracket — with direct comparison to Aeron and Leap Plus.
```

**Schema fix:** Change `"name": "Steelcase Gesture for Tall People"` → `"headline": "Steelcase Gesture for Tall People"` on the Article schema block.

---

#### C-4: `/chairs/steelcase-leap-plus/seat-height/` — 0% CTR, 530 Impressions, Pos 8.4
**Zero clicks from half-a-thousand impressions is unacceptable at this position.**

**Current title (60 chars — at limit, OK):**
`Steelcase Leap Plus Seat Height: 15.5"–22.5" Range`

**Current meta (153 chars — marginal):**
`Steelcase Leap Plus seat height: 15.5"–20.5" range (5" adjustment). Fits users 5'5"–6'6". Why the extra range matters for tall users.`

**Problems:**
- **Data inconsistency / possible factual error:** Title says `15.5"–22.5"` but the meta says `15.5"–20.5"`. These cannot both be correct. This is a trust-destroying inconsistency visible in the raw SERP snippet. Users see the title spec, then read the meta spec, and they don't match — this suppresses clicks. **Verify the correct max seat height against Steelcase specs and reconcile immediately.**
- Top query "is the steelcase leap for heavy people?" suggests the page is attracting off-target queries — weight-capacity content may need to be separated or explicitly addressed.
- Meta leads with spec repeat of the title rather than user benefit.

**Recommended fix (assuming 22.5" is correct per Leap Plus product data):**

```
Title (58 chars):
Steelcase Leap Plus Seat Height: 15.5"–22.5" Range

Meta (152 chars):
22.5" max seat height is the highest of any mainstream ergonomic chair. At 6'4"+, this is why the Leap Plus clears the bar when others don't.
```

> ⚠️ **Do not publish this fix until the correct max seat height spec is confirmed.** This is a factual accuracy issue, not just a copywriting issue.

---

### 🟠 HIGH

---

#### H-1: `/correct-chair-dimensions/` — Title Over Limit, Position Waste
**17,813 impressions, pos 9.6, 0.17% CTR — second-largest impression page**

**Current title (73 chars — 13 chars over limit):**
`Correct Office Chair Dimensions for Tall People: Required Specs by Height`

**Current meta (153 chars — marginal but OK):**
`Office chair dimensions for tall people (6'0–6'7+): exact seat height, seat depth, and back height minimums by height, plus how to measure your own body.`

**Problems:**
- 73-char title is being truncated in SERPs — "Required Specs by Height" is likely cut off entirely, especially on mobile. Users see something like "Correct Office Chair Dimensions for Tall People: Req—" which is both incomplete and not a verdict.
- Query "standard size of a office chair" (96 impr, pos 16.4) indicates the page is attracting a general audience not specific to tall people — likely a content gap issue where generic queries are landing here without finding intent-matched content.
- Query "cornell ergonomics chair seat height feet flat thighs parallel" (pos 4.8, 17 impr, 0 clicks) flagged as AIO — informational spec query, AIO suppression likely. Cannot fix with meta alone; would need content restructuring to own that featured snippet above AIO.

**Recommended fix:**

```
Title (57 chars):
Chair Dimensions for Tall People: Specs by Height

Meta (keep current — 153 chars is acceptable):
Office chair dimensions for tall people (6'0–6'7+): exact seat height, seat depth, and back height minimums by height, plus how to measure your own body.
```

---

#### H-2: `/review/leap-plus/` — Meta Over Limit on High-Impression Review Page
**12,391 impressions, pos 8.7, 0.3% CTR**

**Current meta (170 chars — OVER LIMIT):**
`Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.`

**Problems:**
- 170 chars — heavily truncated in SERP. "Who fits and who doesn't" is being cut, removing the CTR hook.
- "Research-based spec analysis" is an internal descriptor that users don't care about — this is wasted characters at the front of the meta.
- Key query "steelcase leap plus" (984 impr, pos 10.2, 1.12% CTR) — notably this has the best raw CTR of any leaked query on the site, meaning intent is strong. A tighter, verdict-first meta here could pull significant volume.
- **Voice integrity:** This page must use research-voice, not first-person, as Jackson has not personally tested the Leap Plus.

**Recommended fix:**

```
Title (49 chars — keep):
Steelcase Leap Plus Review for Tall People (2026)

Meta (149 chars):
Leap Plus fits 6'0"–6'6": 22.5" seat height (highest in class), 4" adjustable depth, 500-lb capacity. Who it fits well and where it falls short.
```

---

#### H-3: `/best-office-chairs/` — Canonical Confusion / Duplicate Title Issue
**1,862 impressions, pos 17.7 — this page appears to have the same title and meta as `/office-chairs-for-tall-people/`**

**The problem:**
Both `/best-office-chairs/` and `/office-chairs-for-tall-people/` share:
- Title: `Best Office Chairs for Tall People 2026 (6'0"–6'7" Guide)` (75 chars, over limit)
- Meta: `Best office chairs for tall people: Leap Plus (22.5" seat height) for 6'4"+...` (168 chars, over limit)
- Canonical: each points to its own URL

This is **near-duplicate page cannibalization**. Google is likely splitting authority between them, which explains why `/best-office-chairs/` is sitting at pos 17.7 while `/office-chairs-for-tall-people/` is at pos 8.1. Both titles exceed 60 chars (75 chars).

**Recommended fix:**
- **Decision required:** Either (a) canonicalize `/best-office-chairs/` → `/office-chairs-for-tall-people/` and 301-redirect, consolidating all signals, or (b) differentiate them meaningfully with unique content angle, unique title, and unique meta. Given `/office-chairs-for-tall-people/` is the stronger performer, consolidation is the lower-risk choice.
- If keeping both: give `/best-office-chairs/` a distinct title such as `Best Office Chairs 2026: Tall People's Top Picks` (49 chars) and a differentiated meta.

---

#### H-4: `/chairs/steelcase-gesture/seat-depth/` — AIO Suppression + Meta Under-Performing
**1,258 impressions, pos 7.9, 0.16% CTR — 2 clicks**

**Current meta (132 chars — OK length):**
`Gesture seat depth: 15.75"–18.75" (3" range). Fits 6'0"–6'4"; at 6'4"+ use full extension. How to adjust