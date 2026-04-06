# Tall Chair Advisor — Unified SEO Audit & Strategy Report
**Date:** 2026-03-30 | **GSC Period:** 2025-12-30 → 2026-03-29 | **Overall SEO Score: 86/100**

---

## Executive Summary: Top 8 Issues / Opportunities

| # | Issue | Impact | Revenue Link |
|---|-------|--------|-------------|
| 1 | **404 page**: `/chairs/steelcase-leap-plus/weight-limit/` | Critical | Blocks indexing, wastes link equity |
| 2 | **CTR crisis on 4 high-impression pages** — gesture review (490 impr, 0.2% CTR), aeron/tall-people (332 impr, 0% CTR), gesture/seat-depth (139 impr, 0% CTR), leap-plus/seat-height (182 impr, 0.55%) | Critical | Largest near-term traffic gain — 3 pages have truncated meta descs |
| 3 | **3 schema bugs** — duplicate Article on /best-office-chairs/, empty aggregateRating on 3 chair hub pages, og:type=website on 3 article pages | High | Blocks rich results eligibility; social share CTR degraded |
| 4 | **9 new pages not indexed** — 6-foot guides, shoulder-pain, budget-under-500, sihoo review | High | Budget + pain pillar completely invisible |
| 5 | **/correct-chair-dimensions/ stuck at pos 25** with 441 impressions — starved of internal link authority | High | Funnel entry page for buyers at research stage |
| 6 | **Internal linking broken** between height guides ↔ correct-chair-dimensions and new pages ↔ existing funnel | High | Traffic siloing prevents L1→L5 conversion |
| 7 | **AI citation gap** — site not being cited by ChatGPT/Perplexity despite good schema; missing direct-answer capsules and height-bracket verdict tables | High | AI-driven discovery channel completely untapped |
| 8 | **Competitor gap**: ChairInsights (4,500 words, Oct 2025) and BTOD (4,500 words, Feb 2026) outrank TCA on "best office chair for tall people" — both use tall-person spec tables but lack Jackson's ME angle | Medium | Primary revenue query ranking at pos 32 |

---

## Site Inventory (2026-03-30)

**41 pages total** | **23 indexed** | **12 not indexed** | **3 noindex** (contact, privacy, affiliate-disclosure) | **1 dead page** (404)

### Indexed Pages (GSC Data)
| Page | Impressions | Position | CTR | Clicks |
|------|-------------|----------|-----|--------|
| /review/gesture/ | 490 | 10.6 | 0.2% | 1 |
| /correct-chair-dimensions/ | 441 | 25.4 | 0.45% | 2 |
| /chairs/herman-miller-aeron/tall-people/ | 332 | 7.64 | 0% | 0 |
| /office-chairs-for-tall-people/ | 297 | 35.4 | 0.34% | 1 |
| /best-office-chairs/ | 226 | 32.6 | 0% | 0 |
| /chairs/steelcase-leap-plus/seat-height/ | 182 | 10.1 | 0.55% | 1 |
| /aeron-vs-gesture/ | 155 | 7.56 | 0% | 0 |
| /chairs/steelcase-gesture/seat-depth/ | 139 | 9.05 | 0% | 0 |
| /chairs/steelcase-gesture/seat-height/ | 126 | 12.7 | 0% | 0 |
| /chairs/herman-miller-aeron/ | 120 | 17.5 | 0% | 0 |
| /gesture-vs-leap-plus/ | 119 | 16.9 | 0% | 0 |
| /chairs/steelcase-gesture/ | 79 | 11.4 | 0% | 0 |
| /back-pain-spine-height/ | 71 | 10.1 | 0% | 0 |
| /chairs/steelcase-leap-plus/tall-people/ | 60 | 12.7 | 0% | 0 |
| /fit-guides/ | 54 | 8.31 | 0% | 0 |
| /review/leap-plus/ | 38 | 9.79 | 0% | 0 |
| /chairs/steelcase-leap-plus/ | 36 | 22.5 | 0% | 0 |
| /how-to-adjust-chair/ | 25 | 36.2 | 0% | 0 |
| /pain-ergonomics/ | 21 | 20.4 | 0% | 0 |
| /why-standard-chairs-dont-fit/ | 19 | 8.58 | 0% | 0 |
| / (homepage) | 9 | 3.89 | 22.2% | 2 |
| /aeron-vs-leap-plus/ | 60 | 12.4 | 1.67% | 1 |
| /chairs/steelcase-gesture/tall-people/ | 114 | 8.61 | 0.88% | 1 |

### Not Indexed (new pages, added ~Mar 17)
- /review/sihoo-doro-s300/
- /shoulder-pain-tall-people/
- /best-office-chairs-under-500/
- /office-chairs-for-6-foot-3/
- /office-chairs-for-6-foot-4/
- /office-chairs-for-6-foot-5/
- /office-chairs-for-6-foot-6/
- /office-chairs-for-6-foot-7/
- /review/aeron-size-c/ (live but no impressions — likely not indexed yet)
- /knee-pain-seat-depth/ (likely not indexed yet)
- /leg-pain-circulation/ (likely not indexed yet)
- /author/jackson-christopher/ (low priority, may be in this bucket)

---

## 1. Technical SEO Issues

### CRITICAL

#### 1.1 — 404 Page Confirmed: `/chairs/steelcase-leap-plus/weight-limit/`
- Returns HTTP 404. The file `weight-limit.astro` does not exist in the leap-plus chair directory (exists only in steelcase-gesture/).
- GSC flags this as "Not found (404)" — Validation: Not Started.
- **Fix:** Either create the page or add a 301 redirect to `/chairs/steelcase-leap-plus/` in `public/_redirects`.

#### 1.2 — Meta Descriptions Over 160 Characters (Truncated in SERPs)
| Page | Length | Impact |
|------|--------|--------|
| /review/gesture/ | **171 chars** | Gesture is top-impression page (490 impr); truncation actively hurts CTR |
| /chairs/steelcase-gesture/seat-depth/ | **167 chars** | 139 impr, pos 9, 0 clicks — truncated meta is a CTR blocker |

Full text of /review/gesture/ desc: *"Daily-use review by a 6'4" ME student who owns the Gesture. Seat depth, armrests, and back height verdict by height — who it fits and who should look at the Leap Plus."*  
Cut to ≤155 chars. Example: *"Daily-use review by a 6'4" ME student who owns the Gesture. Seat depth, armrests, and back height verdict — who fits, who doesn't."* (133 chars)

#### 1.3 — GSC Indexing Errors (as of 2026-03-30)
| Issue | Count | Status | Action |
|-------|-------|--------|--------|
| Page with redirect (no-slash versions) | 6 | Validation: Failed | Expected post-fix; will clear in 2-4 weeks as Googlebot recrawls. No action needed. |
| Redirect error | 2 | Started | Investigate — likely `/best-office-chairs` 308 redirect still not fixed |
| Not found (404) | 1 | Not Started | Fix /chairs/steelcase-leap-plus/weight-limit/ immediately |
| Excluded by noindex tag | 2 | Expected | Contact + Privacy pages. Correct. |
| Alternate page with proper canonical | 1 | Started | Duplicate content — likely review/gesture (no-slash) being resolved. Monitor. |

### HIGH

#### 1.4 — Sitemap Priority Misconfiguration
- `/office-chairs-for-6-foot-[3-7]/` — 5 pages fall into the default `else` clause → **priority 0.3/yearly**. Should be **0.8/monthly**.
- These are high-commercial-intent pages (people searching for specific heights) and deserve crawl priority.
- **Fix:** Add explicit conditions in `astro.config.mjs` serialize() function.

#### 1.5 — LCP Image Performance (Carried from Previous Audit)
- Homepage and /best-office-chairs/ hero images have `loading="lazy"` and no `fetchpriority`. LCP images must have `fetchpriority="high"` and preload link.

### HIGH (Additional — from technical agent)

#### 1.5a — Duplicate `Article` Schema on `/best-office-chairs/`
The JSON-LD array contains two `Article` objects with the same `headline`. Google's parser uses the first; the duplicate confuses validators and can suppress rich result eligibility.
- **Fix:** Remove the second `Article` object from the schema array in `src/pages/best-office-chairs.astro`.

#### 1.5b — `og:type=website` on 3 Article Pages
`/correct-chair-dimensions/`, `/why-standard-chairs-dont-fit/`, and `/how-to-adjust-chair/` have `og:type=website` instead of `og:type=article`. Social crawlers (Facebook, LinkedIn, Reddit) treat these as site homepages, suppressing author + publish date in link previews.
- **Fix:** Set `ogType="article"` (or equivalent Layout prop) on each of those 3 pages.

#### 1.5c — Empty `aggregateRating` on 3 Chair Hub Pages
`/chairs/herman-miller-aeron/`, `/chairs/steelcase-gesture/`, `/chairs/steelcase-leap-plus/` use `Product` schema with `aggregateRating: {}` (empty object). Google requires populated `ratingValue` and `reviewCount` — empty aggregateRating actively blocks review snippet eligibility.
- **Fix:** Either populate with real values (link to the corresponding /review/ page's rating) or remove `aggregateRating` entirely from hub pages and change the schema type to `Article`.

#### 1.5d — `AggregateRating reviewCount: 1` on All Review Pages
All four review pages declare `reviewCount: 1`. Semantically, an `AggregateRating` with count=1 should instead be a plain `Review` type. This is a schema validity issue that may reduce rich result eligibility.
- **Fix for /review/gesture/:** Switch to a single `Review` schema (first-person, Jackson as author). For research-based review pages, use `Article` schema with a note that it's a spec-based analysis, not a personal review.

#### 1.5e — `fetchpriority="high"` Missing from `/best-office-chairs/` Preload Link
The page has a `<link rel="preload">` for the hero image but the preload link itself lacks `fetchpriority="high"`. Compare to /review/gesture/ which correctly sets both preload attribute and img attribute. This is a Core Web Vitals risk on a priority-1.0 page.
- **Fix:** Add `fetchpriority="high"` to the `<link rel="preload">` tag AND the hero `<img>` tag in `src/pages/best-office-chairs.astro`.

#### 1.5f — `/chairs/steelcase-leap-plus/seat-height/` Meta Description = 166 chars (Truncated)
A third truncated meta description not in the original count.
- **Fix:** Trim to ≤155 chars. Apply same approach as Tasks 1.2 and 1.3.

### MEDIUM

#### 1.6 — Near-Limit Meta Descriptions
| Page | Length | Note |
|------|--------|------|
| /office-chairs-for-6-foot-4/ | 157 chars | Borderline |
| /office-chairs-for-6-foot-7/ | 159 chars | Borderline |
| /office-chairs-for-6-foot-5/ | 159 chars | Borderline |
| /best-office-chairs/ | 156 chars | Borderline |
| /office-chairs-for-6-foot-6/ | 156 chars | Borderline |

---

## 2. CTR Crisis Analysis

The site has **3,423 total impressions** (Dec 30 – Mar 29) but only **10 clicks** (0.29% average CTR). Most pages ranking pos 6-12 have 0% CTR. This is the primary revenue bottleneck.

### Root Causes
1. **Truncated meta descriptions** (see 1.2 above) — readers see cut-off snippets
2. **Weak title appeal** for spec pages (e.g., `/chairs/steelcase-gesture/seat-depth/` title encodes `"` as `&quot;` which may display oddly)
3. **Content depth mismatch** — pages ranking pos 7-10 but thin compared to competitors

### Top CTR Leaks (Prioritized)
| Page | Impr | Pos | CTR | Expected CTR at Pos | Monthly Revenue Loss |
|------|------|-----|-----|---------------------|---------------------|
| /review/gesture/ | 490 | 10.6 | 0.2% | ~3-5% | 6-12 clicks/quarter unrealized |
| /chairs/herman-miller-aeron/tall-people/ | 332 | 7.64 | 0% | ~4-6% | 7-10 clicks/quarter unrealized |
| /aeron-vs-gesture/ | 155 | 7.56 | 0% | ~4-6% | 4-6 clicks/quarter unrealized |
| /chairs/steelcase-gesture/seat-depth/ | 139 | 9.05 | 0% | ~3-5% | 3-5 clicks/quarter unrealized |
| /correct-chair-dimensions/ | 441 | 25.4 | 0.45% | ~1% at pos 25 | Acceptable for pos — needs ranking lift |

### Priority Fix: `/chairs/herman-miller-aeron/tall-people/` (332 impr, pos 7.64, 0 clicks)
This is the biggest CTR waste. The page is ranking but no one clicks because:
- **No comparison table** in the content (content audit confirmed: 0 tables, 7 H2s, ~2,334 words)
- The content doesn't signal high specificity to a searcher scanning SERPs
- Users searching "herman miller aeron tall" or "aeron chair size c for tall people" expect a verdict page with clear specs
- **Fix:** Add a spec comparison table. Shorten H2s to be more direct. Inject a concrete verdict in the meta description.

---

## 3. Content & Keyword Gaps

### Confirmed Gaps (No Page or Not Indexed)

| Query | Impr (period) | Pos | Current Status | Gap Type |
|-------|---------------|-----|----------------|----------|
| "steelcase leap plus reviews" | 2 | 6.0 | /review/leap-plus/ exists pos ~10 | Optimize existing |
| "steelcase leap plus" broad | 7 | 35.4 | /review/leap-plus/ exists but weak | Optimize existing |
| "steelcase knee brace review" | 12 | 7.4 | /knee-pain-seat-depth/ exists but not indexed | **Index gap** |
| "aeron chair size c" | 14 | 43 | /review/aeron-size-c/ live but not indexed | **Index gap** |
| "best office chair for tall people" | 20 | 71 | /office-chairs-for-tall-people/ pos 35 | Ranking gap |
| "desk chair for tall person" | 21 | 79 | /office-chairs-for-tall-people/ pos 35 | Ranking gap |
| Height guides (6-foot-3 thru 6-foot-7) | ~0 (new) | N/A | Pages exist, not indexed | **Index gap** |
| Budget under $500 | ~0 (new) | N/A | Page exists, not indexed | **Index gap** |
| Shoulder pain tall people | ~0 (new) | N/A | Page exists, not indexed | **Index gap** |
| Standing desk height tall people | ~0 | N/A | **Page does not exist** | Content gap |

### Keyword Clusters Not Served

**Cluster 1 — "Steelcase Gesture" deep-spec queries (combined ~30 impr, pos 5-10)**
- "steelcase gesture seat depth range inches" — pos 5.75 (page 1!)
- "steelcase gesture seat height range" — pos 8.75
- "steelcase gesture dimensions" — pos 23.7
- "steelcase gesture weight limit" — pos 44.3
- **Issue:** The spec pages exist and rank, but CTR = 0. These are transactional users with high purchase intent. Fix: Add explicit spec callouts at the top of each spec page (answer-first format). The `/chairs/steelcase-gesture/seat-depth/` page at pos 9.05 with 0 clicks needs a direct answer box in the opening paragraph.

**Cluster 2 — "Best office chair for tall people" (combined ~80 impr, pos 65-80)**
- "desk chair for tall person" — 21 impr, pos 79
- "best office chair for tall people" — 20 impr, pos 71
- "office chairs for tall people" — 15 impr, pos 78
- **Issue:** /office-chairs-for-tall-people/ is ranking pos 35 for "tall people" umbrella query but pos 70-80 for more commercial variants. The page title is "Office Chairs for Tall People 2026 | Tall Chair Advisor" — generic. Needs to target the specific transactional query.

**Cluster 3 — "Aeron" queries (combined ~25 impr, mixed positions)**
- "aeron chair size c" — 14 impr, pos 43 (review/aeron-size-c/ not indexed)
- "herman miller aeron tall" — 4 impr, pos 16
- "aeron vs gesture" — 5 impr, pos 9.6 (not same as "aeron-vs-gesture" page)
- **Fix:** Get /review/aeron-size-c/ indexed ASAP. Add internal links from /chairs/herman-miller-aeron/tall-people/ → /review/aeron-size-c/.

**Cluster 4 — "Chair dimensions" informational (combined ~50 impr, pos 50-90)**
- "average dimensions of person sitting" — 18 impr, pos 60
- "chair dimensions" — 7 impr, pos 52
- "standard chair dimensions in inches" — 1 impr, pos 61
- **Status:** /correct-chair-dimensions/ targeting this but at pos 25.4 — not surfacing for informational variants. The page needs more internal links from L1 pages.

---

## 4. Internal Linking & Funnel Analysis

### Funnel Architecture (Intended L1→L5)
```
L1 (Awareness): /office-chairs-for-tall-people/, height guides, /correct-chair-dimensions/, pain pages
L2 (Consideration): Comparisons — /aeron-vs-gesture/, /gesture-vs-leap-plus/, /aeron-vs-leap-plus/
L3 (Deep Research): Full reviews — /review/gesture/, /review/leap-plus/, /review/aeron-size-c/, /review/sihoo-doro-s300/
L4 (Spec Validation): /chairs/{brand}/{spec}/ — seat-height, seat-depth, tall-people, weight-limit
L5 (Purchase): Amazon affiliate links within L2-L4 pages
```

### Critical Linking Gaps

**Gap 1: Height Guides → /correct-chair-dimensions/ (MISSING)**
- `/office-chairs-for-6-foot-[3-7]/` pages each explain what dimensions matter at that height.
- None of them link to `/correct-chair-dimensions/` — the dedicated dimensions guide that already has 441 impressions.
- This is a direct internal link authority issue: /correct-chair-dimensions/ is ranking pos 25 but getting zero PageRank from the most relevant cluster.
- **Fix:** Add contextual link in each height guide to /correct-chair-dimensions/ within the "how these specs are calculated" or "measuring your fit" section.

**Gap 2: /chairs/herman-miller-aeron/tall-people/ → /review/aeron-size-c/ (MISSING)**
- The Aeron tall-people spec page (332 impr, pos 7.64) does NOT link to the full Aeron review page.
- A user landing on the spec page and ready to buy has no clear path to the deeper review.
- **Fix:** Add "See our full Aeron Size C review →" CTA link.

**Gap 3: /review/gesture/ → New Content (MISSING)**
- The #1 impression page does NOT link to:
  - /shoulder-pain-tall-people/ (new)
  - /best-office-chairs-under-500/ (new)
  - /review/sihoo-doro-s300/ (new)
  - /review/aeron-size-c/ (new)
- These are all relevant next-steps for a Gesture review reader.
- **Fix:** Add "Also consider" or "Related" internal links section.

**Gap 4: /best-office-chairs/ → /best-office-chairs-under-500/ (MISSING)**
- The flagship chair guide doesn't link to the budget variant.
- Budget searchers hit a dead end.
- **Fix:** Add a visible "Looking for a budget option?" link section.

**Gap 5: Sihoo Doro S300 — Siloed**
- /review/sihoo-doro-s300/ is not linked from /best-office-chairs/, /office-chairs-for-tall-people/, or any comparison page.
- Once indexed, it will rank in isolation without link equity.
- **Fix:** Add link from /best-office-chairs/ and /best-office-chairs-under-500/.

**Gap 6: Pain Pages Isolated from Purchase Funnel**
- /back-pain-spine-height/ (71 impr, pos 10.07, 0 clicks) has relevant audience but no clear path to affiliate-linked chair pages.
- /shoulder-pain-tall-people/ (not yet indexed) links to gesture and comparison pages — good, but still needs a link from /back-pain-spine-height/ to create cross-pillar equity.

---

## 5. GSC Performance Insights

### Impression Trajectory
- **Dec–Jan:** Near-zero (2-7 impr/day) — site was brand new
- **Late Feb (Feb 24):** First batch of pages indexed (20 not-indexed → 9 indexed) — impr jump to 13/day
- **Mar 3 (Mar 3):** Major index wave (17 indexed) — impr jump to 30/day
- **Mar 7-17:** Steady growth from 52 → 240 impr/day as more pages indexed and rankings improved
- **Mar 17-30:** Plateau at 100-155 impr/day — growth has stalled

**Assessment:** The impression growth was driven primarily by new page indexing. The plateau suggests rankings have stabilized but CTR conversion is not happening. The next growth phase requires: (1) indexing the 9 remaining new pages, (2) fixing CTR on existing pages, (3) improving rankings on key pages through content upgrades + internal link equity.

### Geographic Opportunity
- **US:** 1,830 impr (53%), 10 clicks
- **UK, Canada, Australia (combined):** ~272 impr, 0 clicks
- **Germany, Netherlands, Japan, South Korea (combined):** ~258 impr, 0 clicks
- **Insight:** International traffic is substantial (47% of impressions). This is likely because tall people are a global audience. The site is English-only — content doesn't need translation, but author credibility signals for non-US users could be strengthened. No specific action needed now, but it's a signal that the niche has global demand.

### Device Split
- Desktop: 2,949 impr / 0.17% CTR / pos 15.8
- Mobile: 437 impr / 1.14% CTR / pos 15.03
- **Mobile CTR is 6.7x higher than desktop** (1.14% vs 0.17%) — unusual but suggests desktop searchers are more comparison-focused and less likely to click first result. Mobile users act faster. No specific action, but optimize for both.

### Top Queries by Opportunity

| Query | Impr | Pos | Action |
|-------|------|-----|--------|
| steelcase gesture seat depth range inches | 8 | 5.75 | Fix meta desc on /chairs/steelcase-gesture/seat-depth/ — answer-first format, under 160 chars |
| steelcase gesture seat height range | 8 | 8.75 | Similar fix on /chairs/steelcase-gesture/seat-height/ |
| steelcase knee brace review | 12 | 7.42 | Get /knee-pain-seat-depth/ indexed (it's live, just not indexed) |
| gesture vs aeron | 10 | 12.6 | /aeron-vs-gesture/ is pos 7.56 — CTR fix needed |
| steelcase leap plus (broad) | 7 | 35.4 | /review/leap-plus/ needs content upgrade and links |
| steelcase gesture review | 10 | 50.9 | /review/gesture/ getting impressions at pos 50 for this exact query — needs to rank higher |
| steelcase gesture review independent | 3 | 8.67 | Near page 1! Add "independent" to meta description |

---

## 6. GEO / AI Citation Readiness

### Site-Wide Assessment

| Page | FAQPage Schema | Table w/ thead | TL;DR | H2 Count | AI Score |
|------|---------------|----------------|-------|----------|----------|
| /review/gesture/ | ✅ | ✅ (1) | ✅ | 13 | ~85/100 |
| /correct-chair-dimensions/ | ✅ | ✅ (3) | ✅ | 12 | ~88/100 |
| /aeron-vs-gesture/ | ✅ | ✅ (1) | ✅ | 11 | ~80/100 |
| /chairs/herman-miller-aeron/tall-people/ | ✅ | ❌ | ✅ | 7 | ~62/100 |
| /chairs/steelcase-gesture/seat-depth/ | Unknown | Unknown | Unknown | Unknown | TBD |
| /back-pain-spine-height/ | Unknown | Unknown | Unknown | Unknown | TBD |

### Key GEO Findings

1. **Robots.txt is perfect** — GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, anthropic-ai all explicitly allowed.
2. **Top pages have strong schema** — Product, Review, FAQPage, BreadcrumbList, HowTo all present where relevant.
3. **/chairs/herman-miller-aeron/tall-people/ has no comparison table** — this is a GEO gap AND a content quality gap. The "Aeron vs Gesture vs Leap Plus" H2 exists but appears to be prose, not a table. AI systems heavily favor `<table><thead>` for structured comparisons (47% higher citation rate).
4. **No citation capsules** present on key pages — the 40-60 word self-contained summaries that AI systems can directly quote.
5. **"steelcase gesture review independent"** query at pos 8.67 — Perplexity and ChatGPT favor independent reviews. The word "independent" should be in the meta description AND the first paragraph of /review/gesture/.
6. **FAQPage schema missing** on /chairs/herman-miller-aeron/index, /chairs/steelcase-gesture/index, /correct-chair-dimensions/, /office-chairs-for-tall-people/, and all /office-chairs-for-6-foot-X/ pages — confirmed by technical agent.
7. **Height-bracket verdict table is missing site-wide** — AI tools answering "what chair for 6'4"?" pull from lookup tables. A "User Height → Passing Chairs" table on /best-office-chairs/ would be the highest-probability Google AI Overview citation target on the site.
8. **Author entity missing from Article schema** — Jackson's byline appears visually but `"author": {"@type": "Person", "description": "..."}` in structured data lacks the "ME student, 6'4", daily Gesture owner" differentiation that AI systems use to establish source credibility.

### AI Citation Opportunities (Highest ROI)
1. Add a spec comparison table to /chairs/herman-miller-aeron/tall-people/ — will increase both CTR and AI citability
2. Add "independent" to /review/gesture/ H1 or first paragraph — matches GSC query intent
3. Create citation capsules for /correct-chair-dimensions/ — it's the most data-dense page on the site and already has 441 impressions
4. Add height-bracket verdict table to /best-office-chairs/ — "At 6'4", here are your passing chairs (spec floor: 20.5" seat height, 18.75"+ seat depth)"
5. Add FAQPage schema to /office-chairs-for-tall-people/ and all /office-chairs-for-6-foot-X/ pages

### Competitor Landscape (from research agent)
| Competitor | Words | FAQ Schema | Freshness | TCA Advantage |
|-----------|-------|-----------|-----------|---------------|
| ChairInsights | ~5,000 | No | Oct 2025 | No ME angle; no first-person authority; no height-bracket spec table |
| BTOD | ~5,000 | Yes (6 items) | Feb 2026 | "Big AND tall" conflates heavy vs. tall users; no 6'4" owner voice |
| ErgonomicTrends | ~2,800 | No | Dec 2021 (stale) | Stale; budget/unknown chairs only |
| Eureka Ergonomic | ~1,500 | No | 2024 | Brand site; no comparisons |

**TCA competitive gaps vs. these competitors:**
- None have a height-bracket spec floor calculator ("at 6'X, minimum required: seat height ≥X, depth ≥X")
- None have a first-person 6'4" long-term review of any premium chair
- None cover torso-to-leg ratio fit analysis (femur length → seat depth requirement)
- None have a standing desk height guide for tall users with affiliate potential

---

## 7. Missed Monetization Opportunities

### L5 Leakage Points

| Location | Issue | Fix |
|----------|-------|-----|
| /correct-chair-dimensions/ (441 impr) | No direct affiliate CTA — purely informational | Add "Based on your height, here's what I recommend" CTA linking to /best-office-chairs/ |
| /chairs/herman-miller-aeron/tall-people/ (332 impr, 0 clicks) | Nobody gets there — CTR = 0% | Fix CTR first (meta desc + content table). Affiliate links exist once users land. |
| /review/gesture/ (490 impr, 0.2% CTR) | Truncated meta desc suppresses traffic to the primary conversion page | Shorten meta desc, add "independent" signal |
| /best-office-chairs-under-500/ | Not indexed — entire budget segment invisible | Get indexed ASAP; this is the highest-volume affiliate opportunity |
| /review/sihoo-doro-s300/ | Not indexed — rising in AI citations per CLAUDE.md | Get indexed ASAP |
| /gesture-vs-leap-plus/ (119 impr, pos 16.9, 0 clicks) | Low CTR on a direct purchase-intent comparison | Reframe title/meta to emphasize decision outcome |
| Height pages (6-foot-3 thru 6-foot-7) | Not indexed — high commercial intent pages invisible | Get indexed ASAP |

### Revenue Funnel Assessment
**Current state:** ~3 affiliate clicks realized over the full GSC period (clicks to Amazon)  
**Bottleneck:** Google impressions → click conversion (avg 0.29% CTR vs expected 3-5% for positions held)  
**Root cause:** Meta description quality + content depth mismatches at key positions  
**Addressable opportunity:** Fixing the top 3 CTR pages alone could increase organic clicks by 10-20x from current level

---

## Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Technical SEO | 21/25 | -4: 404 page, meta desc overruns, sitemap priority gaps |
| Content Quality | 21/25 | -4: /aeron-tall-people/ thin, new pages not indexed, correct-chair-dimensions needs more authority |
| On-Page SEO | 16/20 | -4: CTR crisis on 3 major pages, title encoding issues |
| Schema / Structured Data | 9/10 | -1: /aeron-tall-people/ missing table-based schema context |
| Performance (CWV) | 8/10 | -2: LCP lazy loading issue on homepage + best-office-chairs |
| Images | 5/5 | No issues found |
| AI Search Readiness | 6/5 | All AI bots allowed; top pages have good schema |
| **Total** | **86/100** | |
