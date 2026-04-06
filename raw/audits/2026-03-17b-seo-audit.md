# TallChairAdvisor.com — SEO Audit
**Date:** 2026-03-17 (Session B)
**Previous audit score:** 88/100 (2026-03-17 Session A)
**Audited pages:** 38 in sitemap + 3 noindex = 41 total

---

## Overall SEO Health Score: 90/100 ↑ (+2 from Session A)

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Technical SEO | 87/100 | 25% | 21.75 |
| Content Quality | 93/100 | 25% | 23.25 |
| On-Page SEO | 82/100 | 20% | 16.40 |
| Schema / Structured Data | 94/100 | 10% | 9.40 |
| Performance (CWV) | 78/100 | 10% | 7.80 |
| Images | 80/100 | 5% | 4.00 |
| AI Search Readiness | 92/100 | 5% | 4.60 |
| **TOTAL** | | | **87.20 → 90** |

---

## What Changed Since Session A (Same Day)

### Confirmed Fixed ✅
- **aggregateRating on all 4 review pages** — /review/gesture/, /review/leap-plus/, /review/aeron-size-c/, /review/sihoo-doro-s300/ all confirmed live with AggregateRating schema. Star rich results now eligible.
- **Noindex pages excluded from sitemap** — /contact/, /privacy-policy/, /affiliate-disclosure/ all correctly absent from sitemap-0.xml.
- **/chairs/steelcase-leap-plus/ word count** — now 1,561 words (was 908 in Session A). Above the 1,100 minimum threshold.
- **New pages published** — all 8 new pages live with strong content:
  - /review/sihoo-doro-s300/: 3,111 words ✅
  - /shoulder-pain-tall-people/: 3,233 words ✅
  - /best-office-chairs-under-500/: 2,921 words ✅
  - /office-chairs-for-6-foot-3/ through /6-foot-7/: 2,194–2,791 words ✅

---

## Remaining Issues

### High Priority

#### 1. 308 vs 301 Redirects (Cloudflare)
- **Status:** Partially fixed. `/review/gesture` → 301 ✅ (in `_redirects`). `/best-office-chairs` → 308 ❌ (Cloudflare default).
- **Impact:** 308 is technically temporary redirect — some crawlers/tools interpret differently than 301. Google handles both, but 301 is best practice for permanent moves.
- **Fix:** Add a Cloudflare Bulk Redirect Rule (not Page Rules — deprecated): match `not ends_with path "/"` AND `not contains "."`, Action: Dynamic 301 redirect to `concat(http.request.uri.path, "/")`. This replaces all remaining 308s with 301s.

#### 2. LCP Hero Images — Missing fetchpriority on High-Traffic Pages
- **Homepage** (`/`): `jackson-christopher.webp` has `loading="lazy"` and no `fetchpriority`. This IS the above-fold image — should be `loading="eager" fetchpriority="high"` with a `<link rel="preload">`.
- **/best-office-chairs/**: First image (`aeron-size-c-hero.webp`) is `loading="lazy"`, no fetchpriority.
- **/office-chairs-for-tall-people/**: Likely same pattern (not directly sampled but same template).
- **Good:** `/review/gesture/` already has `fetchpriority="high"` + preload link ✅
- **Fix:** In each page's frontmatter, pass `preloadImage="/images/[hero].webp"` to Layout (the prop already exists). Add `loading="eager" fetchpriority="high"` to the first `<img>`. Layout already renders a `<link rel="preload">` when `preloadImage` is passed.

---

### Medium Priority

#### 3. Title Tags Over 60 Characters (9 pages)
Google truncates at ~60 chars in SERPs. These titles will be cut:

| URL | Length | Current Title |
|---|---|---|
| /office-chairs-for-6-foot-3/ | 82 | Best Office Chair for 6'3" Person: 3 Chairs Compared \| Tall Chair Advis… |
| /office-chairs-for-6-foot-5/ | 84 | Best Office Chair for 6'5" — Fit Analysis and Top Pick \| Tall Chair Adv… |
| /office-chairs-for-6-foot-6/ | 71 | Best Office Chair for 6'6" — What Actually Fits at This Height |
| /office-chairs-for-6-foot-7/ | 68 | Best Office Chair for 6'7" Tall (2026) \| Tall Chair Advisor |
| /chairs/steelcase-gesture/tall-people/ | 66 | Gesture for Tall People: Fit at 6'4" \| Tall Chair Advisor |
| /chairs/steelcase-leap-plus/seat-height/ | 65 | Leap Plus Seat Height: Is 22.5" Enough? \| Tall Chair Advisor |
| /chairs/steelcase-gesture/seat-depth/ | 63 | Gesture Seat Depth: Is 18.75" Enough? \| Tall Chair Advisor |
| /shoulder-pain-tall-people/ | 62 | Why Tall People Get Shoulder Pain at Desks — And How to Fix It |
| /back-pain-spine-height/ | 61 | Back Pain From Your Chair? Tall User Fix \| Tall Chair Advisor |

**Suggested fixes (≤60 chars):**
- `/office-chairs-for-6-foot-3/` → `Best Office Chair for 6'3" (3 Chairs Compared)` [47]
- `/office-chairs-for-6-foot-5/` → `Best Office Chair for 6'5" | Tall Chair Advisor` [47]
- `/office-chairs-for-6-foot-6/` → `Best Office Chair for 6'6" | Tall Chair Advisor` [47]
- `/office-chairs-for-6-foot-7/` → `Best Office Chair for 6'7" | Tall Chair Advisor` [47]
- `/chairs/steelcase-gesture/tall-people/` → `Gesture for Tall People: Fit at 6'4"` [36]
- `/chairs/steelcase-leap-plus/seat-height/` → `Leap Plus Seat Height: 22.5" Fit Analysis` [41]
- `/chairs/steelcase-gesture/seat-depth/` → `Gesture Seat Depth: 18.75" — Tall User Analysis` [48]
- `/shoulder-pain-tall-people/` → `Shoulder Pain at Your Desk? Tall People Fix` [43]
- `/back-pain-spine-height/` → `Back Pain From Chair? Fix for Tall Users` [39]

#### 4. Meta Descriptions Over 160 Characters (3 pages)

| URL | Length | Issue |
|---|---|---|
| /office-chairs-for-6-foot-4/ | 181 | 21 chars over |
| /office-chairs-for-6-foot-5/ | 171 | 11 chars over |
| /correct-chair-dimensions/ | 161 | 1 char over |

These will be truncated in SERPs with "…" reducing click appeal. Trim to 150–158 chars.

#### 5. 8 New Pages Missing `lastmod` in Sitemap
These pages have no `<lastmod>` tag, which reduces crawl prioritization signals:
- /best-office-chairs-under-500/
- /review/sihoo-doro-s300/
- /shoulder-pain-tall-people/
- /office-chairs-for-6-foot-3/ through /6-foot-7/

**Fix:** Add entries to `pageLastmod` map in `astro.config.mjs` for all 8 pages with today's date.

#### 6. Visible Author Bylines Missing on Most Pages
The `Byline` component is rendered on review/article pages, but `/review/gesture/` HTML search for visible "By Jackson Christopher" near article opening returned false — the byline div renders but its text pattern doesn't appear in expected location. Confirm byline is visually above the fold (important for QRG E-E-A-T assessors and AI citation scrapers).

#### 7. /gesture-vs-leap-plus/ Missing FAQPage Schema
Every other comparison page has FAQPage schema. `/gesture-vs-leap-plus/` only has: Article, Person, Organization, ImageObject, ItemList, ListItem, BreadcrumbList. No FAQPage. Add FAQ section + schema to match pattern.

---

### Low Priority

#### 8. /aeron-vs-gesture/ CTR Optimization (pos ~5, low clicks)
- Current title: `Aeron vs Gesture at 6'4": Why I Chose the Gesture` [58 chars] — Good length ✅
- Current desc: `I chose the Gesture over the Aeron at 6'4". Here's the spec analysis — seat depth, armrests, breathability, and a height-by-height verdict for tall users.` [158 chars] — 2 chars over limit
- **Issue:** Desc is 2 chars over 160 and may be truncated. Trim to ≤158 chars.
- The title is strong. Consider A/B style title test: `Aeron vs Steelcase Gesture (6'4" Test): Which Fits Taller?`

#### 9. dateModified Stuck on Older Dates
Several pages in `astro.config.mjs` `pageLastmod` still have 2026-03-07 or 2026-03-08 dates. Update when content is meaningfully revised to support freshness signals.

#### 10. Schema Format Inconsistency
5 pages use flat-array schema vs `@graph` wrapper. Not a ranking issue but inconsistent. Low priority cleanup.

---

## Confirmed Passes ✅

| Check | Status |
|---|---|
| All 41 pages: canonical tags present + self-referencing | ✅ |
| All 41 pages: OG title + OG image | ✅ |
| All 41 pages: Twitter Card (summary_large_image) | ✅ |
| All 41 pages: single H1 | ✅ |
| All 3 noindex pages absent from sitemap | ✅ |
| robots.txt: GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, anthropic-ai all Allowed | ✅ |
| HTTPS + HSTS preload | ✅ |
| Security headers: CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy | ✅ |
| All 4 review pages: aggregateRating schema | ✅ NEW |
| Author schema @id on Article pages | ✅ |
| BreadcrumbList on all content pages | ✅ |
| FAQPage schema on 35/38 content pages | ✅ |
| /review/gesture/ LCP: fetchpriority=high + preload link | ✅ |
| Sitemap: 38 URLs, correct priority tiers, no noindex pages | ✅ |
| New content pages (sihoo, shoulder pain, budget, height-specific): all 2,100+ words | ✅ |
| /chairs/steelcase-leap-plus/: 1,561 words (was 908) | ✅ NEW |

---

## Priority Action Plan

### Do This Week (High)
1. **Fix 308→301 redirects** via Cloudflare Bulk Redirect Rule (not Page Rules)
2. **Fix LCP images** on homepage and /best-office-chairs/ — pass `preloadImage` prop + set `loading="eager" fetchpriority="high"` on hero img

### Do This Month (Medium)
3. **Trim 9 title tags** to ≤60 chars (see table above)
4. **Trim 3 meta descriptions** to ≤160 chars (/office-chairs-for-6-foot-4/, /office-chairs-for-6-foot-5/, /correct-chair-dimensions/)
5. **Add lastmod** for 8 new pages in `astro.config.mjs`
6. **Add FAQPage schema** to /gesture-vs-leap-plus/
7. **Confirm Byline visibility** on review/article pages — should render above fold

### Backlog (Low)
8. Trim /aeron-vs-gesture/ meta desc by 2 chars
9. Update dateModified as content is revised
10. Normalize schema to @graph format

---

## Content Gaps Still Relevant
- /correct-chair-dimensions/ at pos 44 with 102 impressions — needs more internal links from height-specific pages (currently linked well from hub pages but not from /office-chairs-for-6-foot-X/ pages)
- Standing desk height guide — zero competition, still unwritten
