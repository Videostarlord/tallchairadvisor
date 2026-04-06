# ACTION-PLAN.md — Execution Plan (Updated 2026-04-03)
**Source:** FULL-AUDIT-REPORT.md | **Score:** 89/100 (+3 since Mar 30)

All tasks are atomic. Each names the exact file and exact change.

---

## PRIORITY 0 — Fix Critical CTR (Do Today)

### TASK 0.1 — Rewrite Meta for /chairs/herman-miller-aeron/tall-people/
**File:** `tall-chair-advisor/src/pages/chairs/herman-miller-aeron/tall-people.astro`
**Change:** Replace current meta description with verdict-first copy:
> *"Aeron Size C fits most 6'0–6'3 users; the 18.25" fixed seat depth is a problem at 6'4+. Full height-by-height breakdown with specs."*
(140 chars)
**Why:** 406 impressions, pos 7.4, **0 clicks**. Highest CTR opportunity on the site.

---

### TASK 0.2 — Rewrite Meta for /aeron-vs-gesture/
**File:** `tall-chair-advisor/src/pages/aeron-vs-gesture.astro`
**Change:** Replace current meta description:
> *"At 6'4", I chose Gesture over Aeron. Seat depth (18.75" vs 18.25"), armrests, and price — the spec verdict for tall users."*
(131 chars)
**Why:** 171 impressions, pos 7.59, **0% CTR**.

---

### TASK 0.3 — Fix Schema Parse Error on /best-office-chairs/
**File:** `tall-chair-advisor/src/pages/best-office-chairs.astro`
**Action:** Read the schema prop. Find and remove the duplicate `@type: "Article"` block. Validate JSON is parseable. Also verify the hero image `<link rel="preload">` has `fetchpriority="high"`.
**Why:** JSON-LD parse failure suppresses rich result eligibility.

---

### TASK 0.4 — Submit Unindexed Pages to GSC (Manual)
Submit URL Inspection requests in GSC for:
1. /review/sihoo-doro-s300/
2. /shoulder-pain-tall-people/
3. /best-office-chairs-under-500/
4. /office-chairs-for-6-foot-3/
5. /office-chairs-for-6-foot-4/
6. /office-chairs-for-6-foot-5/
7. /office-chairs-for-6-foot-6/

---

## PRIORITY 1 — Meta + Schema Cleanup

### TASK 1.1 — Trim /chairs/steelcase-gesture/seat-depth/ Meta (156 → ≤150 chars)
**File:** `tall-chair-advisor/src/pages/chairs/steelcase-gesture/seat-depth.astro`
**New meta:**
> *"Gesture seat depth: 15.75"–18.75" (3" range). Fits 6'0"–6'4"; at 6'4"+ use full extension. How to adjust it."*

---

### TASK 1.2 — Verify/Fix AggregateRating on 3 Chair Hub Pages
**Files:** `src/pages/chairs/herman-miller-aeron/index.astro`, `src/pages/chairs/steelcase-gesture/index.astro`, `src/pages/chairs/steelcase-leap-plus/index.astro`
**Action:** If `aggregateRating: {}` still present: either remove it (change `@type` to `Article`) or populate with `ratingValue: "4.5", reviewCount: "1", bestRating: "5"`.

---

### TASK 1.3 — Confirm "independent" in /review/gesture/ First Paragraph
**File:** `tall-chair-advisor/src/pages/review/gesture.astro`
**Action:** Verify the word "independent" appears in the first paragraph body text (not just meta). If missing, add it naturally.
**Why:** "steelcase gesture review independent" has 11 impr at pos 8.91 — near page 1.

---

## PRIORITY 2 — Internal Linking Verification

### TASK 2.1 — Height Guides → /correct-chair-dimensions/
**Files:** `src/pages/office-chairs-for-6-foot-[3-7].astro` (5 files)
**Action:** Check each for a link to `/correct-chair-dimensions/`. Add if missing.

### TASK 2.2 — /aeron-vs-gesture/ → /review/aeron-size-c/
**File:** `src/pages/aeron-vs-gesture.astro`
**Action:** Check for link to `/review/aeron-size-c/`. Add if missing.

### TASK 2.3 — /best-office-chairs/ → Under-500 and Sihoo
**File:** `src/pages/best-office-chairs.astro`
**Action:** Check for links to `/best-office-chairs-under-500/` and `/review/sihoo-doro-s300/`. Add if missing.

### TASK 2.4 — /correct-chair-dimensions/ → /review/gesture/
**File:** `src/pages/correct-chair-dimensions.astro`
**Action:** Verify link back to `/review/gesture/` is present. Add if missing.

---

## PRIORITY 3 — Content Upgrades (This Week)

### TASK 3.1 — Add Height-Bracket Verdict Table to /best-office-chairs/
**File:** `src/pages/best-office-chairs.astro`
**Content:** Add a table mapping user height → min seat height, min seat depth, passing chairs.
**Why:** Google AI Overview citation target. Competitor gap — no competitor has this table.

### TASK 3.2 — Fix /knee-pain-seat-depth/ Title/Meta
**File:** `src/pages/knee-pain-seat-depth.astro`
**Action:** Ensure title and meta clearly address seat edge pressure/knee pain, not a "knee brace" product. 108 impr at pos 7.9, 0 clicks — user intent mismatch is the likely cause.

### TASK 3.3 — Add Citation Capsule to /correct-chair-dimensions/
**File:** `src/pages/correct-chair-dimensions.astro`
**Action:** Add a 40–60 word summary block near the top of the page content:
> *"For a tall person (6'0"+), the correct office chair needs: seat height ≥19.5", seat depth ≥17.5" (18.5"+ at 6'3"+), and back height ≥22". Standard office chairs (17.5–19.5" seat height) leave tall users' knees above hip level, causing lower back strain."*

---

## PRIORITY 4 — New Content (This Month)

### TASK 4.1 — Write /standing-desk-height-tall-people/
**Why:** "steelcase standing desk review 2026" appears at 4 impr, pos 9.75 — direct demand. Jackson has a real desk. Zero competition confirmed. First-person + ME angle.

### TASK 4.2 — Monitor Indexing (Check April 17)
If any of the 7 submitted pages (TASK 0.4) still not indexed after 2 weeks, investigate for crawl/canonical issues.

---

## What NOT to Do
- Do not write "I tested" / "in my experience" for any non-Gesture chair
- Do not use WebFetch to check meta tags (use curl/Python instead)
- Do not add content claiming personal testing of Aeron, Leap Plus, Sihoo, or any budget chair
