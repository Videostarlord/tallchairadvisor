# TCA Weekly Audit Report
**Generated:** 2026-06-02T12:05:33.353Z
**Data range:** 2026-02-24 → 2026-05-25

# TCA Site Audit Report
**Generated for:** tallchairadvisor.com
**Data window:** 90-day rolling
**Auditor:** Jackson Christopher

---

## 1. Executive Summary

The site has grown impressively to 23,105 impressions but converts at only **0.24% CTR (55 clicks)** — a structural problem, not a traffic problem. The core issue is unchanged from the April 22 SERP analysis: the site ranks well (median position ~8–9 across key pages) but fails to earn clicks because meta descriptions are too spec-heavy and not differentiated enough to beat AI Overviews and Featured Snippets on informational queries. Three pages in the critical CTR-leak tier (**0 clicks at position ≤ 10**) represent the highest-leverage targets this week. One hard data integrity error was found in a title/meta spec mismatch that needs immediate correction. The hub-and-spoke architecture is working — impressions are up — but the funnel breaks at the SERP click.

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 clicks — highest priority*

| Page | Pos | Impr | CTR | Mechanism Suspected |
|---|---|---|---|---|
| `/chairs/steelcase-leap-plus/tall-people/` | 8.3 | 658 | 0% | Meta too generic, possibly AIO |
| `/chairs/steelcase-gesture/` | 8.9 | 586 | 0% | Meta over-length, spec-dump |
| `/aeron-vs-gesture/` | 8.5 | 466 | 0% | First-person title misrepresents content |
| `/fit-guides/` | 8.3 | 252 | 0% | Index/hub page — weak title, no query signal |
| `/office-chairs-for-6-foot-4/` | 4.5 | 361 | 0% | **Most alarming** — pos 4.5 with 0 clicks |

`/office-chairs-for-6-foot-4/` is the single most alarming data point in this audit. Position 4.5 with 361 impressions and 0 clicks is abnormal — at that position the expected CTR is 8–12%. Likely causes: title truncation/mismatch in mobile SERP, AIO displacement, or possible manual penalty signal. This needs investigation before any meta rewrite.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

#### C1 — `/office-chairs-for-6-foot-4/` — Position 4.5, 0 Clicks (Unexplained)
**Severity:** Critical
**Why:** A page at position 4.5 with 361 impressions should have roughly 29–43 clicks in 90 days. Zero clicks is a statistical impossibility under normal SERP conditions. This is not a CTR optimization problem — something structural is wrong.

**Possible causes to rule out in order:**
1. **AIO full-page displacement** — Run an incognito SERP for `best office chair for 6'4"` and confirm whether an AI Overview is consuming the entire above-the-fold real estate.
2. **GSC position averaging artifact** — If the page ranks pos 1 for one very low-volume query and pos 20 for several others, the "4.5 average" is misleading. Pull the query-level breakdown immediately.
3. **Title rendering truncation** — Current title is 56 chars (`Best Office Chair for 6'4" | Tall Chair Advisor`) — within spec, but the `6'4"` with special characters should be verified for SERP rendering.
4. **Canonical or indexing issue** — Confirm the canonical is self-referencing and the page is not accidentally noindexed.

**Action:** Before rewriting anything, open GSC → Pages → this URL → Queries. If top queries are all at pos 15+, the "4.5" is an average illusion. If queries genuinely cluster at pos 4–5, open incognito SERP immediately.

---

#### C2 — `/chairs/steelcase-leap-plus/seat-height/` — Spec Error in Title vs. Meta
**Severity:** Critical (data integrity)
**Why:** The title reads `Steelcase Leap Plus Seat Height: 15.5"–22.5" Range` but the meta description reads `15.5"–20.5" range`. These are different numbers. The correct Leap Plus seat height ceiling is **22.5"** (which is the key differentiator for tall users — this is why the Leap Plus matters). The meta description is publishing the wrong spec to 521 impressions per 90 days.

**Current meta (153 chars — within range but factually wrong):**
> Steelcase Leap Plus seat height: 15.5"–20.5" range (5" adjustment). Fits users 5'5"–6'6". Why the extra range matters for tall users.

**Fixed meta (152 chars):**
> Steelcase Leap Plus seat height: 15.5"–22.5" range (7" adjustment). Why the extra-high ceiling matters for users 6'2" and taller — and how to use it.

**Also fix:** The title says "15.5"–22.5"" and the meta says "15.5"–20.5"." Whichever is correct, they must match. Confirm against Steelcase spec sheet before publishing.

---

#### C3 — `/review/gesture/` — Meta Description Over Length + First-Person Compliance Risk
**Severity:** Critical
**Why (length):** Meta is 158 chars. Google's display cutoff is ~155 chars. The phrase "and who it doesn't" is being truncated in SERPs, removing the negative-qualifier hook that would differentiate the result. This page has 4,775 impressions at pos 7.9 — it's the highest-impression page on the site. Every pixel of meta description matters here.

**Why (E-E-A-T voice):** The meta says "Independent review by a 6'4" owner." Per site policy, Jackson has **only personally tested the Steelcase Gesture** — so this is technically compliant on the Gesture review page. However, confirm the body copy does not bleed first-person language ("I tested," "I found") into sections covering spec comparisons with chairs Jackson has not personally used.

**Current meta (158 chars — truncated):**
> Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.

**Rewritten meta (148 chars):**
> 6'4" owner's verdict: seat depth, armrests, back height for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.

**Note:** Leading with the height credential earlier captures the key E-E-A-T signal before any truncation point.

---

### 🟠 HIGH

---

#### H1 — `/aeron-vs-gesture/` — First-Person Title on a Page Jackson Cannot Own
**Severity:** High
**Why:** The title is `Aeron vs Gesture at 6'4": Why I Chose the Gesture` and the meta opens with `At 6'4", I chose the Gesture`. Per site policy, Jackson has only tested the Gesture. He has not tested the Aeron. A comparison page that says "I chose X over Y" implies hands-on experience with both. This is an E-E-A-T and FTC compliance risk.

**Additionally:** The page has 466 impressions at pos 8.5 with 0 clicks. The first-person framing may be backfiring — users searching `gesture vs aeron` or `aeron vs gesture` are research-mode buyers who want specs, not a personal narrative from someone they don't yet trust.

**Current title (58 chars):** `Aeron vs Gesture at 6'4": Why I Chose the Gesture`
**Current meta (166 chars — over limit):** `At 6'4", I chose the Gesture: adjustable 18.75" seat depth beats Aeron's fixed 18.5", plus 360° armrests and 400 lb capacity. Aeron wins on breathability.`

**Rewritten title (54 chars):** `Aeron vs Gesture for Tall Users: Spec Verdict (2026)`

**Rewritten meta (149 chars):**
> Gesture wins on seat depth (adjustable 18.75" vs fixed 18.5") and 400 lb capacity. Aeron leads on breathability. Height-by-height verdict inside.

---

#### H2 — `/chairs/steelcase-gesture/` — Meta Over Length, Zero Clicks
**Severity:** High
**Current meta (170 chars — significantly over limit):**
> Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus.

At 170 chars this is truncated before "and comparison to Aeron and Leap Plus" — removing the competitive angle that would differentiate this from the manufacturer's own page.

**Rewritten meta (153 chars):**
> Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable depth. How it compares to the Aeron and Leap Plus for tall users.

---

#### H3 — `/chairs/steelcase-leap-plus/tall-people/` — Zero Clicks at Pos 8.3, Generic Meta
**Severity:** High
**Current meta (156 chars):**
> Steelcase Leap Plus fit analysis for tall users 6'0-6'7+. 22.5-in seat height, 4-in adjustable seat depth, height-by-height breakdown, and who it fits best.

This is 156 chars (slightly over) and reads like a spec sheet table of contents — it describes what the page is, not what the user gets. It competes with AI Overviews on spec queries by offering the same information in snippet form. The fix is to make the meta answer a question the AIO doesn't cleanly resolve.

**Rewritten meta (147 chars):**
> At 6'5"–6'7", the Leap Plus is one of the only chairs that fits without modification. Height-by-height breakdown with seat height and depth specs.

---

#### H4 — `/office-chairs-for-tall-people/` — Anomalous Query Leaks Suggest Index Contamination
**Severity:** High
**Why:** Two of the three query leaks on this page are:
- `"leadership equipment for tall people"` (68 impr, pos 3.9, 0% CTR)
- `"venture capital equipment for tall people"` (16 impr, pos 5.9, 0% CTR)

These are not ergonomic chair queries. "Leadership equipment" and "venture capital equipment" are entirely off-topic. The fact that this page ranks for them (at positions 3.9 and 5.9) suggests either: (a) Google is matching generic "tall people" + "equipment" patterns to this URL, or (b) there is body copy on the page that semantically triggers these associations. Neither is good. These impressions produce 0 clicks and dilute the page's topical authority signal.

**Action:** Audit the page body copy for any language that could trigger "leadership," "VC," or "business equipment" associations. Tighten the copy around ergonomic/chair vocabulary specifically. Also check if there are any outbound links or anchor text that could be creating these signals.

---

#### H5 — `/knee-pain-seat-depth/` — Query Cluster Opportunity Being Missed
**Severity:** High
**Why:** Three nearly identical queries all rank 7.6–9.7 with 0% CTR despite 176 combined impressions:
- `"cornell ergonomics chair seat depth two fingers behind knee"` (77 impr, pos 7.6)
- `"cornell ergonomics chair seat depth two fingers behind knees"` (62 impr, pos 8.1)
- `"cornell ergonomics chair seat depth 2 inches behind knees"` (37 impr, pos 9.7)

All three are mid-funnel research queries with clear intent. The current meta (144 chars, within range) doesn't reference Cornell or the two-finger rule in its opening — it leads with "Seat edge pressure on the back of your knees is the cause." This buries the credibility signal that would make a user click over an AIO.

**Current meta (144 chars):**
> Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it.

**Rewritten meta (150 chars):**
> Cornell's ergonomics rule: 2–3 fingers behind your knee = correct seat depth. Here's how to measure yours and which tall chairs actually reach it.

**Also fix:** The title is 67 chars — over the 60-char limit. Google will truncate it.

**Current title (67 chars):** `Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People`
**Rewritten title (58 chars):** `Cornell Seat Depth Rule: Knee Pain Fix for Tall People`

---

### 🟡 MEDIUM

---

#### M1 — `/correct-chair-dimensions/` — Title Over Length
**Severity:** Medium
**Current title (73 chars):** `Correct Office Chair Dimensions for Tall People: Required Specs by Height`
This will be truncated in SERPs at ~60 chars, cutting off "Required Specs by Height" — which is actually the most useful qualifier.

**Rewritten title (57 chars):** `Office Chair Dimensions for Tall People: Specs by Height`

The meta (153 chars) is within range and descriptive — no change needed there.

---

#### M2 — `/review/leap-plus/` — Meta Over Length
**Severity:** Medium
**Current meta (170 chars):**
> Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.

At 170 chars, "Who fits and who doesn't" is being truncated. That's the click-driving phrase.

**Rewritten meta (152 chars):**
> Research-based spec analysis: seat depth 15.75"–19.75", 500 lb capacity, 22.5" seat height. Who the Leap Plus fits at 6'0"–6'6" — and who it doesn't.

---

#### M3 — `/gesture-vs-leap-plus/` — Meta Over Length + Position Gap
**Severity:** Medium
**Current meta (165 chars):**
> Seat depth (18.75" vs 19.75"), back height, and armrest comparison for users 6'0"–6'6". Which one wins depends on your exact height — verdict inside.

**Rewritten meta (149 chars):**
> Seat depth (18.75" vs 19.75"), back height, armrest comparison for 6'0"–6'6". Which wins depends on your height — height-by-height verdict inside.

**Also:** At pos 12.9, this page is outside the near-p1 zone. Internal linking from `/review/gesture/` and `/review/leap-plus/` with anchor text targeting `steelcase gesture vs leap` would help push this into the top 10.

---

#### M4 — `/review/aeron-size-c/` — Meta Over Length
**Severity:** Medium
**Current meta (166 chars):**
> Aeron Size C fits most 6'0"–6'3" users: seat height reaches 20.5", depth is fixed at 18.5". Who it fits, who should step up to the Leap Plus, and why.

**Rewritten meta (151 chars):**
> Aeron Size C fits 6'0"–6'3": 20.5" seat height, fixed 18.5" depth. Who it fits, who should upgrade to the Leap Plus, and why the depth matters.

---

#### M5 — `/best-office-chairs/` — Position 21.9, Content Depth Signal
**Severity:** Medium
**Why:** This is a