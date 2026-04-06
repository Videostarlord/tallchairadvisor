# NEXT_STEPS.md — Execution Plan for Claude Code
**Generated:** 2026-03-30 | **Source:** AUDIT_SUMMARY.md + GSC data (Dec 30 – Mar 29)

All tasks are atomic and directly executable. Each task names the exact file to edit, the exact change to make, and the expected outcome.

---

## PRIORITY 0 — SCHEMA BUGS (Code fixes, no content work, fix today)

### TASK 0.1 — Remove Duplicate `Article` Schema from `/best-office-chairs/`
**Why:** Two `Article` objects with the same headline in one JSON-LD block. Confuses parsers, can suppress rich results.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/best-office-chairs.astro`

**Action:**
1. Read the file. Find the `schema` prop passed to Layout (should be an array).
2. Identify the two `Article` objects — they will have the same `@type: "Article"` and `headline`.
3. Remove the second (duplicate) one. Keep the first.
4. Verify only one `Article` object remains in the schema array.

---

### TASK 0.2 — Fix `og:type=website` on 3 Article Pages
**Why:** Social crawlers treat `og:type=website` pages as site homepages, suppressing author/date metadata in link previews.

**Files:**
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/correct-chair-dimensions.astro`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/why-standard-chairs-dont-fit.astro`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/how-to-adjust-chair.astro`

**Action for each file:**
1. Read the file. Find the Layout component call.
2. Find the `ogType` prop (or however og:type is set — check Layout.astro if needed).
3. Change value from `"website"` to `"article"`.

---

### TASK 0.3 — Fix `aggregateRating` on 3 Chair Hub Pages
**Why:** Empty `aggregateRating: {}` on Product schema actively blocks review snippet eligibility. Google requires populated ratingValue + reviewCount.

**Files:**
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/herman-miller-aeron/index.astro`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-gesture/index.astro`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-leap-plus/index.astro`

**Action for each file:**
1. Read the file. Find the schema definition.
2. Either:
   - **Option A (preferred):** Change schema `@type` from `Product` to `Article` — these are spec/overview pages, not product listings. Remove the `aggregateRating` property entirely.
   - **Option B:** Populate with real values: `"ratingValue": "4.5", "reviewCount": "1", "bestRating": "5"` pointing to the corresponding /review/ page's rating.
3. If using Option A, also check that FAQPage schema remains in the array alongside the Article schema.

---

### TASK 0.4 — Add FAQPage Schema to `/chairs/herman-miller-aeron/` and `/chairs/steelcase-gesture/`
**Why:** Technical agent confirmed FAQPage schema is missing from these two pages. `/chairs/steelcase-leap-plus/` has it. Inconsistent.

**Files:**
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/herman-miller-aeron/index.astro`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-gesture/index.astro`

**Action:**
1. Read each file. Find the schema array.
2. Read `/src/pages/chairs/steelcase-leap-plus/index.astro` to copy the FAQPage schema structure.
3. Add a FAQPage schema object with 3-4 questions relevant to each chair (e.g., "Is the Aeron Size C good for tall people?", "What is the seat depth of the Aeron Size C?", "What height range does the Aeron Size C fit?").
4. Questions must use research-based voice — no first-person testing claims for non-Gesture chairs.

---

### TASK 0.5 — Fix `fetchpriority="high"` on `/best-office-chairs/` Preload Link
**Why:** Preload link exists but lacks the `fetchpriority="high"` attribute on both the `<link rel="preload">` tag and the hero `<img>`. This is a Core Web Vitals risk on the highest-priority page.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/best-office-chairs.astro`

**Action:**
1. Read the file. Find the hero image `<img>` tag.
2. Add `fetchpriority="high"` to the `<img>` tag.
3. Find the `preloadImage` prop passed to Layout (or the `<link rel="preload">` tag if defined in the page).
4. Ensure the preload link also carries `fetchpriority="high"` — check how `/review/gesture.astro` implements this as the reference implementation.

---

## PRIORITY 1 — CRITICAL (Fix within 24 hours)

### TASK 1.1 — Fix 404: Create `/chairs/steelcase-leap-plus/weight-limit/`
**Why:** GSC flags this as a "Not found (404)" critical error. The equivalent page exists for Steelcase Gesture (`/chairs/steelcase-gesture/weight-limit/`).

**Action:**
1. Read `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-gesture/weight-limit.astro` as a structural template.
2. Create `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-leap-plus/weight-limit.astro`
3. Content: Steelcase Leap Plus weight capacity is **400 lbs (181 kg)**. Use research-based voice (Jackson has not tested this chair).
4. Title: `Steelcase Leap Plus Weight Limit: 400 lbs Capacity` (≤60 chars)
5. Meta desc: `Steelcase Leap Plus weight capacity is 400 lbs (181 kg). How it compares to the Gesture (400 lbs) and Aeron Size C (350 lbs) for heavy users.` (≤155 chars)
6. Add to `pageLastmod` in `astro.config.mjs`: `'https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/': new Date('2026-03-30')`
7. Add to priority tier in `astro.config.mjs` serialize() — include in the `/chairs/` condition at priority 0.6.
8. Internal links: Add link from `/chairs/steelcase-leap-plus/index.astro` to `/chairs/steelcase-leap-plus/weight-limit/`.

**Expected outcome:** 404 resolved; GSC error cleared on next crawl.

---

### TASK 1.2 — Fix Meta Description: `/review/gesture/`
**Why:** 171 chars → truncated in SERPs. This is the site's highest-impression page (490 impr) with only 0.2% CTR. The query "steelcase gesture review independent" ranks pos 8.67 — the word "independent" should be in the meta.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/review/gesture.astro`

**Action:**
1. Find the `description=` prop in the Layout call (around line 141-142).
2. Replace current description (171 chars) with:
   `"Independent daily-use review by a 6'4\" ME student who owns the Gesture. Seat depth, armrests, back height verdict — who it fits and who should look elsewhere."`
   (Length: 162 chars — verify with `len()` before saving; target ≤155 chars)
   
   **Exact target (≤155 chars):**
   `"Independent review by a 6'4\" owner. Seat depth, armrests, back height verdict for tall users 6'1\"–6'7\". Who the Gesture fits — and who it doesn't."`
   (148 chars ✓)

3. Verify no truncation by counting characters.

**Expected outcome:** Full meta description visible in SERPs; "independent" keyword matched; CTR improvement from 0.2% toward 3-5%.

---

### TASK 1.3 — Fix Meta Description: `/chairs/steelcase-gesture/seat-depth/`
**Why:** 167 chars → truncated. Page ranks pos 9.05 with 139 impr and 0 clicks. Query "steelcase gesture seat depth range inches" ranks pos 5.75.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-gesture/seat-depth.astro`

**Action:**
1. Read the file to find the description prop.
2. Replace with a description that:
   - Opens with the exact answer (spec numbers)
   - Is ≤155 chars
   - Example: `"Gesture seat depth: 15.75\"–18.75\" (3\" range). Adequate for users 6'0\"–6'4\"; tall users above 6'4\" should verify against leg length. Adjustment guide included."`
   (Verify length ≤155 chars)

**Expected outcome:** CTR improvement on a page ranking pos 9 with 0 clicks.

---

### TASK 1.3b — Fix Meta Description: `/chairs/steelcase-leap-plus/seat-height/`
**Why:** 166 chars → truncated. Third truncated meta desc found by technical agent. Page has 182 impressions at pos 10.09 — 3rd highest impression spec page.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/steelcase-leap-plus/seat-height.astro`

**Action:**
1. Read the file. Find the description prop.
2. Replace with a ≤155 char version that opens with the spec answer: `"Steelcase Leap Plus seat height: 15.5\"–20.5\" range (industry-leading 5\" adjustment). Fits users 5'5\"–6'6\". Why the extra range matters for tall users."`
3. Verify character count ≤155.

---

### TASK 1.4 — Fix Sitemap Priority for Height-Specific Pages
**Why:** `/office-chairs-for-6-foot-[3-7]/` fall into the default `else` clause in `astro.config.mjs` → priority 0.3/yearly. These are high-commercial-intent pages that should be 0.8/monthly.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/astro.config.mjs`

**Action:**
1. In the `serialize()` function, find the `else if (item.url.includes('/review/')` block (approx line 79).
2. Add to that condition (the 0.8/monthly block):
   ```
   item.url.includes('/office-chairs-for-6-foot-') ||
   ```
3. Final condition should include: `/review/`, `/aeron-vs-`, `/gesture-vs-`, `/shoulder-pain-tall-people/`, `/best-office-chairs-under-500/`, and `/office-chairs-for-6-foot-`.

**Expected outcome:** Height pages get priority 0.8/monthly in sitemap; faster Googlebot crawl scheduling.

---

## PRIORITY 2 — HIGH (Fix within 1 week)

### TASK 2.1 — Content Upgrade: Add Comparison Table to `/chairs/herman-miller-aeron/tall-people/`
**Why:** This page has 332 impressions at pos 7.64 with 0 clicks — the biggest CTR waste on the site. Root cause: no comparison table (confirmed: 0 `<table>` tags). The "Aeron vs Gesture vs Leap Plus" H2 is prose only. A table would increase both CTR (richer content signals in snippet) and AI citation rate (47% higher with `<thead>`).

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/herman-miller-aeron/tall-people.astro`

**Action:**
1. Read the file. Find the "Aeron vs Gesture vs Leap Plus for Tall People" H2 section.
2. After the intro paragraph of that section, insert an HTML comparison table with `<thead>`:
   ```html
   <table>
     <thead>
       <tr>
         <th>Spec</th>
         <th>Aeron Size C</th>
         <th>Steelcase Gesture</th>
         <th>Steelcase Leap Plus</th>
       </tr>
     </thead>
     <tbody>
       <tr><td>Seat Height Range</td><td>16.25"–20.25"</td><td>16"–21"</td><td>15.5"–20.5"</td></tr>
       <tr><td>Seat Depth</td><td>18.25" (fixed)</td><td>15.75"–18.75"</td><td>15.75"–19.75"</td></tr>
       <tr><td>Back Height</td><td>23.25"</td><td>24"–26"</td><td>N/A (curved)</td></tr>
       <tr><td>Weight Capacity</td><td>350 lbs</td><td>400 lbs</td><td>400 lbs</td></tr>
       <tr><td>Best Fit Height</td><td>6'0"–6'4"</td><td>6'0"–6'5"</td><td>6'0"–6'6"</td></tr>
     </tbody>
   </table>
   ```
3. Use the same Tailwind table styling as other pages (check `/review/gesture.astro` or `/correct-chair-dimensions.astro` for existing table CSS classes).
4. Add a link to `/review/aeron-size-c/` in the Verdict section: `For the full spec analysis, see our <a href="/review/aeron-size-c/">Aeron Size C review</a>.`

**Voice constraint:** Research-based only. Do NOT use first-person testing voice for the Aeron.

**Expected outcome:** Content depth improvement → potential CTR improvement (332 impr, pos 7.64, 0 → target 2-3% CTR = 7-10 clicks/quarter); higher AI citation rate.

---

### TASK 2.2 — Internal Links: Height Pages → `/correct-chair-dimensions/`
**Why:** `/correct-chair-dimensions/` has 441 impressions at pos 25.4 — deep ranking that needs more internal link authority. The 5 height-specific pages are the most relevant source and none of them link to it.

**Files (edit all 5):**
- `/src/pages/office-chairs-for-6-foot-3.astro`
- `/src/pages/office-chairs-for-6-foot-4.astro`
- `/src/pages/office-chairs-for-6-foot-5.astro`
- `/src/pages/office-chairs-for-6-foot-6.astro`
- `/src/pages/office-chairs-for-6-foot-7.astro`

**Action for each file:**
1. Read the file. Find a section discussing seat height, seat depth, or "how to measure your fit."
2. Add a contextual sentence linking to /correct-chair-dimensions/. Example:
   `For the full measurement framework behind these numbers, see our <a href="/correct-chair-dimensions/">office chair dimensions guide for tall people</a>.`
3. Place within the body text — not in a sidebar or "related links" section. Contextual inline links carry more weight.

**Expected outcome:** 5 new internal links to /correct-chair-dimensions/; should improve its ranking from pos 25 toward pos 15-20 over 4-8 weeks.

---

### TASK 2.3 — Internal Links: `/review/gesture/` → New Pages
**Why:** The highest-impression page (490 impr) doesn't link to 4 relevant new pages.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/review/gesture.astro`

**Action:**
1. Read the file. Find the "Pros and Cons" or "Who Should Buy" section (toward end of page).
2. Add these links contextually:
   - In the "Who Should NOT Buy" section: `If budget is a constraint, our <a href="/best-office-chairs-under-500/">best office chairs under $500</a> covers spec-matched alternatives.`
   - In the lumbar/ergonomics section: `Tall users with shoulder pain should also read <a href="/shoulder-pain-tall-people/">why tall people get shoulder pain at desks</a>.`
   - In the comparison section: `Also considered: <a href="/review/aeron-size-c/">Herman Miller Aeron Size C review</a> and <a href="/review/sihoo-doro-s300/">Sihoo Doro S300 review</a>.`

**Expected outcome:** Link equity flows to new pages; new pages get initial authority before external links are built.

---

### TASK 2.4 — Internal Links: `/best-office-chairs/` → `/best-office-chairs-under-500/`
**Why:** Budget visitors hit /best-office-chairs/ and find no path to the budget guide.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/best-office-chairs.astro`

**Action:**
1. Read the file. Find the introduction or near the top of the main content area.
2. Add a callout box or inline sentence: `If you're on a budget, we have a separate guide: <a href="/best-office-chairs-under-500/">Best office chairs for tall people under $500</a>.`

**Expected outcome:** Users and Googlebot can navigate from the flagship guide to the budget variant.

---

### TASK 2.5 — Internal Links: `/chairs/herman-miller-aeron/tall-people/` → `/review/aeron-size-c/`
**Why:** The Aeron spec page (332 impr) doesn't link to the full Aeron review. A buyer at L4 (spec validation) needs a path to L3 (full review) before purchasing.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/chairs/herman-miller-aeron/tall-people.astro`

**Action:**
1. Read the file. Find the "Verdict" H2 section.
2. Add: `For the complete spec analysis, see our <a href="/review/aeron-size-c/">Herman Miller Aeron Size C review for tall people</a>.`

**Expected outcome:** Funnel continuity from L4 → L3 for Aeron buyers.

---

### TASK 2.6 — Request Indexing via GSC (Manual Step — User Action Required)
**Why:** 9 pages are not indexed. These pages are live and contain high-value content. Google must be requested to crawl them.

**Pages to submit via Google Search Console → URL Inspection → Request Indexing:**
1. https://tallchairadvisor.com/review/sihoo-doro-s300/
2. https://tallchairadvisor.com/shoulder-pain-tall-people/
3. https://tallchairadvisor.com/best-office-chairs-under-500/
4. https://tallchairadvisor.com/office-chairs-for-6-foot-3/
5. https://tallchairadvisor.com/office-chairs-for-6-foot-4/
6. https://tallchairadvisor.com/office-chairs-for-6-foot-5/
7. https://tallchairadvisor.com/office-chairs-for-6-foot-6/
8. https://tallchairadvisor.com/office-chairs-for-6-foot-7/
9. https://tallchairadvisor.com/review/aeron-size-c/
10. https://tallchairadvisor.com/knee-pain-seat-depth/
11. https://tallchairadvisor.com/leg-pain-circulation/

**Note:** Do this AFTER completing Tasks 2.2 and 2.3 so the pages have internal links pointing to them before Googlebot crawls.

---

## PRIORITY 3 — MEDIUM (Fix within 2-4 weeks)

### TASK 3.0 — GEO: Add Height-Bracket Verdict Table to `/best-office-chairs/`
**Why:** Research agent confirmed this is the #1 missing AI citation element. AI tools answering "what chair for 6'4"?" extract structured height → chair lookup tables. No competitor has this. BTOD and ChairInsights are outranking TCA at pos 32 without it.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/best-office-chairs.astro`

**Action:**
1. Read the file. Find the section near the top of the content (after intro, before individual chair sections) or in a "How to Choose" section.
2. Add a section with H2: `Which Chair Is Best at Your Height?`
3. Insert this table with `<thead>`:

```html
<table>
  <thead>
    <tr>
      <th>User Height</th>
      <th>Spec Floor</th>
      <th>Top Pick</th>
      <th>Runner-Up</th>
      <th>Fails At</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>6'0"–6'1"</td><td>Seat height ≥18", depth ≥17.5"</td><td>Aeron Size C or Gesture</td><td>Leap Plus</td><td>Standard chairs (18" max seat height)</td></tr>
    <tr><td>6'2"–6'3"</td><td>Seat height ≥19.5", depth ≥18"</td><td>Gesture or Leap Plus</td><td>Aeron Size C (fixed depth risk)</td><td>Aeron if femurs are long</td></tr>
    <tr><td>6'4"–6'5"</td><td>Seat height ≥20.5", depth ≥18.5"</td><td>Leap Plus (22.5" ceiling)</td><td>Gesture (21" ceiling)</td><td>Aeron Size C (18.25" fixed depth)</td></tr>
    <tr><td>6'6"–6'7"</td><td>Seat height ≥21", depth ≥19"</td><td>Leap Plus only</td><td>Sihoo S300 (budget)</td><td>Gesture, Aeron</td></tr>
  </tbody>
</table>
```

4. Add a sentence before the table: `Use the height bracket below to find your spec floor, then read each chair section for full analysis.`

**Voice constraint:** Research-based. Do NOT claim personal testing for non-Gesture chairs.

**Expected outcome:** Google AI Overview and Perplexity citation target; CTR improvement on pos 32 ranking; internal navigation improvement.

---

### TASK 3.1 — Content Creation: `/standing-desk-height-tall-people/`
**Why:** Mentioned in CLAUDE.md as "zero competition." This is an ME + tall-user authority play. No specific GSC impressions yet because the page doesn't exist — but the content cluster is high-intent.

**Action:**
1. Create `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/standing-desk-height-tall-people.astro`
2. Title: `Standing Desk Height for Tall People (6'3"–6'7") | Exact Settings` (≤60 chars: `Standing Desk Height for Tall People: The Exact Settings`)
3. Content focus: Exact elbow-height formula, recommended desk heights by height (table with `<thead>`), recommended standing desk brands with height range ≥50", affiliate links.
4. Schema: Article + FAQPage + HowTo
5. Author voice: Jackson's ME background (formula derivation) + 6'4" frame. Research-based for specific products.
6. Add to `pageLastmod` and sitemap priority 0.8/monthly in `astro.config.mjs`.
7. Internal links FROM: /review/gesture/, /correct-chair-dimensions/, /pain-ergonomics/ → new page.

---

### TASK 3.2 — CTR Fix: Title/Meta for `/gesture-vs-leap-plus/`
**Why:** 119 impressions at pos 16.9 with 0 clicks. Title is generic: "Gesture vs Leap Plus for Tall People | Tall Chair Advisor."

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/gesture-vs-leap-plus.astro`

**Action:**
1. Read the file. Find the `title=` prop.
2. New title: `Gesture vs Leap Plus: Spec Comparison for Tall Users` (52 chars ✓)
3. New meta description (≤155 chars): `Seat depth (18.75\" vs 19.75\"), back height, and armrest comparison for users 6'0\"–6'6\". Which one wins depends on your exact height — verdict inside.`

---

### TASK 3.3 — CTR Fix: Title/Meta for `/review/leap-plus/`
**Why:** 38 impressions at pos 9.79 with 0 clicks. Query "steelcase leap plus reviews" ranks pos 6 — near page 1 but no one clicks.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/review/leap-plus.astro`

**Action:**
1. Read file. Check current title and description length.
2. New title: `Steelcase Leap Plus Review for Tall People (2026)` (49 chars ✓)
3. Ensure meta description mentions: "research-based spec analysis," seat depth range, weight capacity, and height range served. Must be ≤155 chars.

**Voice constraint:** Research-based. Do NOT use first-person testing voice.

---

### TASK 3.4 — CTR Fix: Title/Meta for `/back-pain-spine-height/`
**Why:** 71 impressions at pos 10.07 with 0 clicks. The query "tall people back problems" ranks pos 35 — not the right anchor. The page should target "back pain from office chair tall person" type queries.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/back-pain-spine-height.astro`

**Action:**
1. Read file. Check title (current: "Back Pain From Your Chair? A Tall User Fix" — 42 chars).
2. Title is fine for click appeal. Meta description (132 chars) is under limit ✓.
3. Add "lumbar support" and "tall users" to the first paragraph if not already present to match incoming queries.

---

### TASK 3.5 — Add Conversion CTA to `/correct-chair-dimensions/`
**Why:** 441 impressions, pos 25.4, but the page is purely informational with no clear "here's what to buy" conversion path. Users who understand dimensions need to know which chairs meet those specs.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/correct-chair-dimensions.astro`

**Action:**
1. Read the file. Find the "Chair Model Fit by Height: Gesture vs Leap Plus vs Aeron" H2 section.
2. Add a CTA after the section: `Ready to buy? See our <a href="/best-office-chairs/">complete guide to the best office chairs for tall people</a>, or if budget is a factor, the <a href="/best-office-chairs-under-500/">best tall office chairs under $500</a>.`
3. If not already present, add an inline Amazon affiliate link for the Gesture in the "recommended for 6'4"" section.

---

### TASK 3.6 — Internal Links: `/review/sihoo-doro-s300/` from Hub Pages
**Why:** Once indexed, /review/sihoo-doro-s300/ will rank in isolation without incoming internal links.

**Files to edit (add link to sihoo review):**
1. `/src/pages/best-office-chairs.astro` — Add Sihoo to the budget/value chair list
2. `/src/pages/best-office-chairs-under-500.astro` — Add Sihoo as a featured chair with affiliate link
3. `/src/pages/office-chairs-for-tall-people.astro` — Mention Sihoo as a rising budget-friendly option

**Action:** For each file, read it, find the section that discusses multiple chairs, and add a contextual mention with link: `<a href="/review/sihoo-doro-s300/">Sihoo Doro S300</a>`

---

### TASK 3.7 — Add "independent" Signal to `/review/gesture/`
**Why:** Query "steelcase gesture review independent" ranks pos 8.67 — the word "independent" is not in the current H1 or first paragraph.

**File:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/review/gesture.astro`

**Action:**
1. Read the file. Find the H1 tag and the first paragraph.
2. Ensure the word "independent" appears in either the first 50 words OR in the H1.
3. Example H1: `Steelcase Gesture Review: Independent Daily-Use Analysis at 6'4"` — check if this over-extends the H1 length.
4. First paragraph already mentions "own the Gesture" — add "This is an independent review" as a sentence.

---

### TASK 3.8 — Fix LCP Images: Homepage and `/best-office-chairs/`
**Why:** Hero images with `loading="lazy"` and no `fetchpriority` cause LCP degradation. Carried from previous audit (Mar 19).

**Files:**
- `/src/pages/index.astro` — Find `jackson-christopher.webp` or hero image
- `/src/pages/best-office-chairs.astro` — Find hero image

**Action for each:**
1. Read the file. Find the first visible image (`<img` or Astro `<Image`).
2. Remove `loading="lazy"` if present.
3. Add `fetchpriority="high"`.
4. Add a `<link rel="preload">` in the `<head>` via the Layout `preloadImage` prop if available, or directly in the page's head slot.

---

## PRIORITY 4 — LOW (Backlog)

### TASK 4.1 — Near-Limit Meta Descriptions (trim as bandwidth allows)
Pages with 155-160 char descriptions — borderline but not critical:
- /office-chairs-for-6-foot-4/ (157) — trim by 5 chars
- /office-chairs-for-6-foot-5/ (159) — trim by 5 chars
- /office-chairs-for-6-foot-7/ (159) — trim by 5 chars
- /best-office-chairs/ (156) — trim by 2 chars
- /office-chairs-for-6-foot-6/ (156) — trim by 2 chars

### TASK 4.6 — GEO: Add Author Entity to Article Schema Site-Wide
All Article/Review schema blocks should include:
```json
"author": {
  "@type": "Person",
  "name": "Jackson Christopher",
  "description": "Mechanical Engineering student at UC Berkeley, 6'4\", daily Steelcase Gesture user",
  "url": "https://tallchairadvisor.com/author/jackson-christopher/"
}
```
This is a GEO differentiator no competitor has. Check current schema — if the Person type and URL are present but `description` is missing, add it.

### TASK 4.7 — Consolidate `/about/` vs `/author/jackson-christopher/`
Two pages covering similar ground (author bio). Technical agent flagged these as potentially competing for branded queries. Options:
1. Add `<link rel="canonical" href="/author/jackson-christopher/">` to /about/ and set noindex on /about/
2. Or redirect /about/ → /author/jackson-christopher/ in public/_redirects

Check analytics for which gets more traffic before deciding.

### TASK 4.2 — GEO: Add Citation Capsules to `/correct-chair-dimensions/`
The page already ranks at pos 25 for dimension queries. Adding 40-60 word self-contained citation capsules at the end of each H2 section will increase AI citation rate. Format:
`[Specific claim with number]. This means [implication for tall users specifically]. [Source or methodology note].`

### TASK 4.3 — GEO: Add Comparison Table to `/back-pain-spine-height/`
Low priority but would improve AI citability for pain-related queries. Add a table showing "height vs lumbar support position mismatch" with `<thead>`.

### TASK 4.4 — Investigate GSC "Redirect Error" (2 pages)
Check which 2 pages are causing redirect errors in GSC. Likely candidates: /best-office-chairs (308 redirect not yet resolved), /pain-ergonomics or similar.

**Action:** In GSC Console → Coverage → Redirect error → identify exact URLs → fix in `public/_redirects`.

### TASK 4.5 — Review Aeron Size C: Content Upgrade Pre-Indexing
Once /review/aeron-size-c/ gets indexed, verify it has:
- FAQPage schema
- Comparison table with `<thead>`
- TL;DR
- ≤60 char title, ≤155 char meta desc
- Link to /chairs/herman-miller-aeron/tall-people/

---

## Execution Order (Optimal Sequence)

```
Day 1 (code-only, no content):
  - Tasks 0.1–0.5 (schema bugs: duplicate Article, og:type, aggregateRating, FAQPage, fetchpriority)
  - Tasks 1.2, 1.3, 1.3b (3 truncated meta desc fixes — highest CTR impact)
  - Task 1.4 (sitemap priority — 2-minute config change)

Day 2:
  - Task 1.1 (create 404 page: leap-plus/weight-limit/)
  - Task 2.2 (5 height pages → /correct-chair-dimensions/ links)

Day 3:
  - Task 2.1 (Aeron tall-people comparison table — biggest CTR fix)
  - Tasks 2.3, 2.4, 2.5 (internal link fixes across 4 pages)

Day 4:
  - Task 3.0 (height-bracket verdict table on /best-office-chairs/ — GEO + CTR)
  - Task 2.6 (GSC indexing requests — user action, do AFTER link fixes)

Week 2:
  - Tasks 3.1–3.7 (CTR fixes, new content, Sihoo links, "independent" signal)
  - Task 3.8 (LCP image fixes)

Backlog:
  - Tasks 4.1–4.7 (near-limit meta descs, citation capsules, author schema, review consolidation)
```

---

## Success Metrics (4-Week Targets)

| Metric | Current | Target |
|--------|---------|--------|
| Overall CTR | 0.29% | 1.0%+ |
| /review/gesture/ CTR | 0.2% | 2-3% |
| /aeron-tall-people/ CTR | 0% | 1-2% |
| Indexed pages | 23 | 34+ |
| /correct-chair-dimensions/ position | 25.4 | 18-20 |
| Total weekly clicks | ~0-1 | 5-10 |
| 404 errors | 1 | 0 |
