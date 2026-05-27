# Action Plan — tallchairadvisor.com SEO Audit
**Date:** 2026-05-27
**Source:** 2026-05-27-full-seo-audit.md

Priority order: Critical → High → Medium → Low. Within each tier, ordered by revenue/traffic impact.

---

## CRITICAL (fix within 48 hours)

### C1 — Fix `/aeron-vs-gesture/` H1 + meta + CTA placement
**Impact:** 385 impressions, 0% CTR, $0 revenue. Highest-leverage page fix on the site.
**Files:** `src/pages/aeron-vs-gesture.astro`
- Change H1 from "Herman Miller Aeron Size C vs Steelcase Gesture" → "Why I Chose the Steelcase Gesture Over the Aeron at 6'4""
- Rewrite meta description to ~150 chars with verdict + spec + differentiation
- Move at least one affiliate CTA from the 90%+ depth mark to after the Quick Answer box (first 20% of page)
- Move 2–3 internal links from footer cluster into contextual body paragraphs

### C2 — Fix homepage WebSite schema `@id`
**Impact:** Broken entity graph — Google cannot link WebSite to WebPage. 5-minute fix.
**Files:** `src/layouts/Layout.astro` or `src/pages/index.astro` (wherever WebSite block is defined)
- Add `"@id": "https://tallchairadvisor.com/#website"` to the WebSite block

### C3 — Remove deprecated HowTo schema from `/correct-chair-dimensions/`
**Impact:** Dead markup. HowTo removed from Google rich results Sep 2023.
**Files:** `src/pages/correct-chair-dimensions.astro`
- Delete the HowTo JSON-LD block entirely

---

## HIGH (fix within 1 week)

### H1 — Apply `/correct-chair-dimensions/` citation capsule
**Impact:** 1,766 impressions at pos 15.8 — highest-impression page not ranking on page 1. Citation capsule prescribed May 11 still not live.
**Files:** `src/pages/correct-chair-dimensions.astro`
- Add the citation capsule block as prescribed in wiki/pages/concepts/geo-optimize-plan.md
- Format key stats as blockquotes for AI extraction

### H2 — Fix title truncation: `/correct-chair-dimensions/` (72→55 chars) and `/heavy-duty-ergonomic-chairs-tall-people/` (80→49 chars)
**Files:** respective `.astro` pages, `title` prop
- `/correct-chair-dimensions/`: "Chair Dimensions for Tall People: Exact Specs by Height" (55 chars)
- `/heavy-duty-ergonomic-chairs-tall-people/`: "Best Heavy-Duty Ergonomic Chairs for Tall People" (49 chars)

### H3 — Fix meta descriptions: 9 pages (prioritize homepage and /aeron-vs-gesture/)
**Pattern for each:** height-specific verdict + one named spec with number + differentiated value claim, 130–155 chars
- Homepage (102→150+ chars): lead with "At 6'4", most chairs are too short..."
- /aeron-vs-gesture/ (~90→150+ chars): lead with verdict
- /best-office-chairs/ (117→150+ chars): add seat height range stat
- Remaining 6 pages: bring to 130+ chars on next scheduled edit pass

### H4 — Fix Aeron Size C and Leap Plus Product schema `@id`
**Files:** `src/pages/review/aeron-size-c.astro`, `src/pages/review/leap-plus.astro`
- Aeron: `"@id": "https://tallchairadvisor.com/#product/herman-miller-aeron-size-c"`
- Leap Plus: `"@id": "https://tallchairadvisor.com/#product/steelcase-leap-plus"`

### H5 — Fix ItemList `url` → `item` on `/best-office-chairs/` and `/aeron-vs-gesture/`
**Files:** respective `.astro` pages
- Each `ListItem`: change `"url": "..."` to `"item": "..."`

### H6 — Fix `/author/` 404
**Files:** `src/pages/author/` — add index.astro or ensure Byline links to `/author/jackson-christopher/` only
- Audit all Byline usages and confirm link target is `/author/jackson-christopher/`, not `/author/`

### H7 — Expand `/review/aeron-size-c/` to 2,500+ words
**Files:** `src/pages/review/aeron-size-c.astro`
- Add FAQ section (5–7 questions)
- Add community data quotes (r/ergonomics attributions)
- Add comparison table with Gesture and Leap Plus
- Bring to parity with Gesture review depth

### H8 — Fix Quick Picks CTAs on `/best-office-chairs/` → Amazon
**Files:** `src/pages/best-office-chairs.astro`
- Quick Picks at top of page currently link to internal pages, not Amazon
- Replace with direct Amazon affiliate links (tag=tallchairadvi-20)
- Confirmed revenue leak from wiki/pages/concepts/affiliate-compliance.md

---

## MEDIUM (fix within 1 month)

### M1 — Fix `og:type` default in Layout.astro
**Files:** `src/layouts/Layout.astro`
- Change default from `"website"` to accept `ogType` prop; default to `"article"` for page routes
- Homepage and hub pages: explicitly pass `ogType="website"`
- All review/content pages: pass `ogType="article"` or set as default

### M2 — Raise cache-control TTL in `public/_headers`
- HTML routes: raise from `max-age=300` to `max-age=86400`
- `/_astro/*`: set exactly `max-age=31536000, immutable` (remove duplicate rule collision)

### M3 — Add preconnect hints for Clarity and Cloudflare Insights
**Files:** `src/layouts/Layout.astro`
- Add `<link rel="preconnect" href="https://www.clarity.ms">`
- Add `<link rel="preconnect" href="https://cloudflareinsights.com">`

### M4 — Fix `loading=lazy` + `fetchpriority=high` conflict on `/best-office-chairs/` hero
**Files:** `src/pages/best-office-chairs.astro`
- Remove `loading="lazy"` from the above-fold hero image

### M5 — Add FTC body disclosure to Gesture review, /correct-chair-dimensions/, /review/aeron-size-c/
- Body disclosure (not just footer) is required for FTC compliance on pages with Amazon links
- Add one sentence at the top of the content area

### M6 — Fix 5 stale lastmod entries in `astro.config.mjs`
- `leg-pain-circulation` → `2026-05-26`
- `office-chair-return-policy` → `2026-05-26`
- `gesture-vs-leap-plus` → `2026-05-26`
- `chairs/steelcase-leap-plus/weight-limit` → `2026-05-26`
- `chairs/herman-miller-aeron/size-guide/` → add entry with correct date

### M7 — Fix `heavy-duty-ergonomic-chairs/` priority to 0.8 in sitemap serialize()
**Files:** `astro.config.mjs`
- Add URL pattern to the 0.8 priority tier

### M8 — Add ItemList schema to `/heavy-duty-ergonomic-chairs-tall-people/`
**Files:** `src/pages/heavy-duty-ergonomic-chairs-tall-people.astro`
- Add ItemList JSON-LD for the chairs compared on the page

### M9 — Add internal links from `/shoulder-pain-tall-people/` and `/office-chairs-for-6-foot-4/` to `/best-office-chairs/`
- `/shoulder-pain/`: add contextual link in "Chairs worth considering" section
- `/6-foot-4/`: add to Related Guides footer block

### M10 — Add `potentialAction` SearchAction to homepage WebSite schema
**Files:** `src/pages/index.astro`
- Add Sitelinks Searchbox `SearchAction` to WebSite block

### M11 — Update Organization logo to square logomark
**Files:** `src/layouts/Layout.astro` or `src/pages/index.astro`
- Replace `og-default.webp` (wide OG image) with a dedicated square logo for Organization schema

### M12 — Fix `/shoulder-pain-tall-people/` title to match H1
- Title: "Why Tall People Get Shoulder Pain at Desks" (43 chars)
- H1: "Why Tall People Get Shoulder Pain at Desks — And How to Fix It"
- Align title to match H1 (or shorten H1 to a tighter 55-char form)

---

## LOW (backlog)

### L1 — Remove deprecated `changefreq` and `priority` from sitemap `serialize()`
**Files:** `astro.config.mjs`
- No SEO impact, just removes ~40% sitemap bloat

### L2 — Split bundled JSON-LD arrays into separate `<script>` blocks
- `/review/gesture/`: Product, FAQPage, BreadcrumbList as three separate blocks
- Other pages: same pattern

### L3 — Add `@id` to all Article schema blocks
- Pattern: `"@id": "https://tallchairadvisor.com/PAGE-PATH/#article"`

### L4 — Add H2 questions to content pages
- Current ratio: 0% on 5 of 6 content pages (target: 60–70%)
- Apply going forward on new content; retrofit on next major page edit

### L5 — Format `/shoulder-pain-tall-people/` EMG stat as blockquote
- Move PMC5462674 citation into a blockquote/callout for AI extraction
- Also surface Jackson's personal resolution at top of page, not buried at end

### L6 — Verify Brotli compression on CSS via Cloudflare Speed settings
- CSS bundle is 35KB — confirm Brotli active, consider Cloudflare Auto Minify

---

## Summary Count

| Priority | Count |
|---|---|
| Critical | 3 |
| High | 8 |
| Medium | 12 |
| Low | 6 |
| **Total** | **29** |
