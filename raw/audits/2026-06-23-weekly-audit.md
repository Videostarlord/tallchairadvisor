# TCA Weekly Audit Report
**Generated:** 2026-06-23T11:17:34.963Z
**Data range:** 2026-03-24 → 2026-06-22

# TCA Site Audit Report
**Date:** Week of 2026-05-15 | **Auditor:** GSC + SERP Audit Agent

---

## 1. Executive Summary

The site has grown dramatically (52,635 impressions, 125 clicks, avg pos 8.9) and the hub-and-spoke architecture is clearly working — but the funnel is leaking badly at the click layer. Site-wide CTR is 0.24%, nearly identical to the 0.24% benchmark from the April audit despite impression volume increasing ~4x, meaning the CTR problem has not improved in absolute terms. The two root causes identified in April (AI Overview suppression on spec queries, and title/meta underperformance on editorial pages) are still active and now affect a much larger impression base. Three pages — `/chairs/steelcase-gesture/`, `/chairs/steelcase-leap-plus/seat-height/`, and `/chairs/herman-miller-aeron/` — are sitting at pos 7–10 with 0 clicks and a combined 1,531 impressions; these are the clearest priority. One spec data inconsistency (seat height range on the Leap Plus seat-height page) is a credibility risk that must be fixed before any traffic push on that URL.

---

## 2. Critical CTR Leaks (Position ≤ 10, 0 Clicks)

These pages have meaningful impression volume, competitive positions, and are generating zero revenue signal. Per the Statistical Confidence Policy, these are prioritization bets, not certainties — but the volume justifies immediate action.

| Page | Pos | Impr | CTR | Primary Cause |
|---|---|---|---|---|
| `/chairs/steelcase-gesture/` | 8.9 | 608 | 0% | Meta too long (170 chars), generic brand voice, no click trigger |
| `/chairs/steelcase-leap-plus/seat-height/` | 8.8 | 465 | 0% | **Spec inconsistency in title vs meta** (see Critical issues below) |
| `/chairs/herman-miller-aeron/` | 19.2 | 458 | 0% | Position too deep; content-depth problem, not meta problem |
| `/back-pain-spine-height/` | 12.5 | 363 | 0% | Title too vague, meta undersells the diagnostic angle |
| `/knee-pain-seat-depth/` | 6.6 | 17,581 | 0.09% | AIO suppression on top queries confirmed; CTR gap on non-AIO queries |

> **Note on AIO-suppressed queries:** `/knee-pain-seat-depth/` Cornell queries and `/chairs/steelcase-gesture/seat-depth/` spec queries show confirmed AI Overview flags. Meta rewrites will not recover clicks on those specific queries. The fix for AIO-suppressed pages is content depth + internal links to chase non-AIO queries, not SERP copy.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C1 — Spec Inconsistency: Leap Plus Seat Height Title vs Meta (`/chairs/steelcase-leap-plus/seat-height/`)
**Severity: Critical**
**Why:** The page title says `15.5"–22.5"` and the meta description says `15.5"–20.5"`. These are contradictory specs on a page whose entire purpose is to be the authoritative number. One is wrong. The standard Leap V2 seat height range is 15.5"–20.5"; the 22.5" figure appears in Leap *Plus* specs but must be verified against the manufacturer sheet before publishing. A searcher who sees both numbers in the SERP snippet will not click — the inconsistency signals unreliability. This is also a credibility risk for E-E-A-T.

**Fix:**
1. Verify the correct Leap Plus seat height ceiling against Steelcase's current spec sheet.
2. Make title, meta, H1, and all in-body references consistent with the verified figure.
3. If 22.5" is correct (Leap Plus), the meta must be updated immediately:

> **Proposed meta (if 22.5" is correct, 148 chars):**
> `Steelcase Leap Plus seat height: 15.5"–22.5" range (7" adjustment). Fits users up to 6'7". Why the ceiling matters for tall users.`

> **Proposed meta (if 20.5" is correct, standard Leap V2, 149 chars):**
> `Steelcase Leap Plus seat height: 15.5"–20.5" range (5" adjustment). Why the ceiling is the limiting factor for users 6'4" and taller.`

---

#### C2 — Voice Policy Violation: First-Person Testing Implied for Non-Gesture Chairs
**Severity: Critical**
**Why:** Per site policy, Jackson has **only personally tested the Steelcase Gesture**. Two pages use first-person testing voice for chairs he has not tested:

- `/aeron-vs-gesture/` meta: *"At 6'4", the Gesture won"* — this is acceptable for the Gesture, but the framing implies a live A/B test sitting in both chairs.
- `/best-office-chairs-under-500/` meta: *"from an ME student who spent months researching before buying the $1,649 Gesture"* — this is acceptable framing (research-based, not testing-based) but is borderline.
- `/aeron-vs-gesture/` Schema headline: *"Why I Chose the Steelcase Gesture Over the Aeron at 6'4\""* — this directly implies he sat in the Aeron and rejected it, which violates the policy.

**Fix:**
- `/aeron-vs-gesture/` Schema `headline`: Change to `"Steelcase Gesture vs Herman Miller Aeron: Tall User Spec Comparison"` or `"Aeron vs Gesture for Tall Users: Which Specs Win at 6'4+?"`
- `/aeron-vs-gesture/` meta: Reframe as spec-driven conclusion. Proposed (157 chars):
> `Spec comparison at 6'4": Gesture's adjustable seat depth and 360° armrests outperform Aeron's fixed 18.25" depth. Height-by-height verdict inside.`
- Audit body copy on `/aeron-vs-gesture/` for any "I sat in the Aeron" language and convert to research voice.

---

### 🔴 HIGH

---

#### H1 — Meta Description Over Character Limit (Multiple Pages)
**Severity: High**
**Why:** Google truncates metas over ~155 chars, cutting off the verdict/CTA. Ideal range is 130–155 chars. Three pages are over:

| Page | Current Length | Problem |
|---|---|---|
| `/review/gesture/` | 158 chars | Truncated after "who it doesn't" — cuts the key differentiator |
| `/review/leap-plus/` | 170 chars | Over by 15+ chars, spec data at end likely cut |
| `/review/aeron-size-c/` | 166 chars | "and why" verdict cut |
| `/gesture-vs-leap-plus/` | 165 chars | "verdict inside" likely truncated |
| `/chairs/steelcase-gesture/` | 170 chars | Over by 15+ chars |
| `/aeron-vs-gesture/` | 159 chars | Marginally over; also has voice issue (C2) |
| `/office-chairs-for-6-foot-4/` | 157 chars | Marginally over |
| `/standing-desk-height-tall-people/` | 161 chars | Over |

**Fixes (exact rewrites):**

**/review/gesture/** — Current 158 chars → Proposed (151 chars):
> `Tested by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who should look elsewhere.`

**/review/leap-plus/** — Current 170 chars → Proposed (147 chars):
> `Research-based spec analysis for tall users 6'0"–6'6": seat depth 15.75"–19.75", 500-lb capacity, 22.5" seat height ceiling. Who fits, who doesn't.`

**/review/aeron-size-c/** — Current 166 chars → Proposed (152 chars):
> `Aeron Size C fits most 6'0"–6'3" users: seat height to 20.5", fixed depth 18.5". Who it fits, who should step up to the Leap Plus instead.`

**/gesture-vs-leap-plus/** — Current 165 chars → Proposed (153 chars):
> `Seat depth (18.75" vs 19.75"), back height, armrests — compared for 6'0"–6'6". Which one wins depends on your exact height. Verdict inside.`

**/chairs/steelcase-gesture/** — Current 170 chars → Proposed (149 chars):
> `Gesture spec check for tall users: 21" seat height, 18.75" adjustable depth, fits 6'0"–6'4". Full fit analysis vs Aeron and Leap Plus.`

**/office-chairs-for-6-foot-4/** — Current 157 chars → Proposed (152 chars):
> `At 6'4", Leap Plus is the safest default: 22.5" seat height, 19.75" depth. Full comparison with Gesture and Aeron — height-by-height verdict.`

**/standing-desk-height-tall-people/** — Current 161 chars → Proposed (148 chars):
> `Exact standing desk height formula for 6'0"–6'7": elbow-height method, recommended ranges, and why most desks max out too low for tall people.`

---

#### H2 — Title Tag Over 60 Characters (3 Pages)
**Severity: High**
**Why:** Titles over 60 chars are rewritten by Google in SERPs, destroying the click signal. Google's rewrite is often worse than the original.

| Page | Current Title | Chars | Fix |
|---|---|---|---|
| `/knee-pain-seat-depth/` | `Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People` | 67 | Shorten |
| `/correct-chair-dimensions/` | `Correct Office Chair Dimensions for Tall People: Required Specs by Height` | 73 | Shorten |
| `/review/aeron-size-c/` | `Aeron Size C Review for Tall People \| Tall Chair Advisor` | 56 | Acceptable — brand suffix is standard |

**Proposed rewrites:**

**/knee-pain-seat-depth/** (67 → 56 chars):
> `Cornell Seat Depth Rule: Knee Pain Fix for Tall People`

**/correct-chair-dimensions/** (73 → 57 chars):
> `Office Chair Dimensions for Tall People: Specs by Height`

---

#### H3 — `/best-office-chairs/` Buried at Position 19.7 (Head Term, 1,562 Impressions)
**Severity: High**
**Why:** This is the head-term hub page for "best office chairs for tall people" — the highest-intent cluster on the site. Position 19.7 means page 2, effectively invisible. With 1,562 impressions it is being indexed and crawled for the right queries, but the content depth is insufficient to compete. Per historical context, hub-and-spoke architecture is what drove the impression tripling — this hub page needs to be the strongest node in the graph.

**Fix:**
- This is a content-depth problem, not a meta problem. Do not fix the meta until the content earns a top-10 position.
- Audit for: word count vs top-3 competitors, number of chairs covered, spec table completeness, internal links from spoke pages, and E-E-A-T signals (Jackson's 6'4" frame, ME student analytical voice).
- Add a comparison table with exact specs (seat height range, seat depth range, weight capacity, price) for every chair recommended.
- Ensure every spoke review page links back to this hub with anchor text containing "best office chairs for tall people."

---

#### H4 — `/pain-ergonomics/` at Position 28.3 (337 Impressions, 0 Clicks)
**Severity: High**
**Why:** Position 28 is page 3. This is a content-depth failure — the page is being discovered but cannot compete. The title (`Office Chair Pain for Tall People | Tall Chair Advisor`) is generic and the page likely lacks the specific diagnostic depth that `/knee-pain-seat-depth/` and `/back-pain-spine-height/` have. At pos 28 a meta rewrite has near-zero impact; content is the only lever.

**Fix:**
- Diagnose whether this page is cannibalizing `/knee-pain-seat-depth/` and `/back-pain-spine-height/`. If the query intent overlaps, consider making `/pain-ergonomics/` the hub that links to both as spokes rather than competing with them.
- If kept as standalone: add height-specific diagnostic sections (6'0"–6'2", 6'2"–6'4", 6'4"+), specific pain mechanisms per height range, and chair spec remedies.
- Title is only 42 chars on `/back-pain-spine-height/` — has room. Current `/pain-ergonomics/` title is 54 chars and acceptable once the content earns a better position.

---

### 🟡 MEDIUM

---

#### M1 — `/chairs/steelcase-gesture/` Zero Clicks at Position 8.9 — Meta Not Pulling
**Severity: Medium** (would be Critical but AIO may be partial cause)
**Why:** 608 impressions, pos 8.9, 0 clicks. The current meta leads with a spec dump (`Gesture fits 6'0"–6'4" per Steelcase specs`) which is exactly the kind of content AI Overviews answer inline. The meta needs a verdict-first reframe that gives searchers a reason to click for the *judgment*, not just the spec.

**Fix (already included in H1 rewrites above, restated for action tracking):**
> `Gesture spec check for tall users: 21" seat height, 18.75" adjustable depth, fits 6'0"–6'4". Full fit analysis vs Aeron and Leap Plus.`
- Additionally: review the top queries (`steelcase gesture for tall people`, `steelcase gesture height range tall users`) — these have decision intent. The meta should end with a comparative verdict hook, not just specs.

---

#### M2 — `/correct-chair-dimensions/` Ranking for Wrong Queries
**Severity: Medium**
**Why:** Top query leaks are "standard size of a office chair" (pos 18.2) and "chair specs" (pos 17.2) — generic queries with no tall-people modifier. These are not TCA's audience and the low positions confirm weak relevance signals. The page is not ranking well for the queries it should own (e.g., "office chair dimensions for 6 foot 4").

**Fix:**
- Audit H1, H2s, and intro paragraph for tall-specific language density. "Standard size" language may be diluting the tall-user signal.
- Add explicit height-range sections (6'0"–6'2", 6'2"–6'4", 6'4"–6'7") with spec minimums for each.
- Add internal links from `/office-chairs-for-6-foot-4/` and `/best-office-chairs/` to this page with tall-specific anchor text.

---

#### M3 — `/back-pain-spine-height/` Title Too Vague (42 Chars, No Spec Signal)
**Severity: Medium**
**Why:** `Back Pain From Your Chair? A Tall User Fix` reads like a listicle headline, not a diagnostic guide. It undersells the lumbar height mechanism, which is the actual differentiator for this page. At pos 12.5 with 363 impressions and 0 clicks, a stronger title may improve both position and CTR.

**Proposed title (54 chars):**
> `Chair Back Pain at 6'2"+: Lumbar Height Fix for Tall Users`

**Proposed meta (current 132 chars —