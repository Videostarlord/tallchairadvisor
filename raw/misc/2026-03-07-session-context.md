# TallChairAdvisor.com — LLM Session Context
*Last updated: 2026-03-07 (session 2)*

---

## Project

**Site:** TallChairAdvisor.com — affiliate chair review site for tall people (6'0"+)
**Stack:** Astro + Cloudflare Pages, static site, Tailwind CSS
**Repo:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/`
**Strategy docs:** `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/`
**Affiliate tag:** `tallchairadvi-20` (Amazon Associates)
**GA4:** `G-TWK4EPV8DT`

---

## Author / Site Identity

- **Author:** Marcus Reid, 6'4", founder & ergonomics researcher
- Named across all review pages via `Byline` component and Person schema
- About page: `/src/pages/about.astro` — full bio, methodology, FTC disclosure, Person + Organization + WebPage schema

---

## Key Specs to Keep Consistent

| Chair | Seat Depth | Seat Height | Back Height | Weight Cap | Seat Width |
|---|---|---|---|---|---|
| Steelcase Gesture | 15.75"–18.75" | 16"–21" | 24" | 400 lbs | 19.25" |
| Steelcase Leap Plus | 15.75"–19.75" | 15.5"–22.5" | 25.5" | 500 lbs | 22" |
| Herman Miller Aeron Size C | ~18.5" (fixed) | 16"–20.5" | ~23.5" | 350 lbs | 20.75" |

---

## Site Structure (33 pages as of 2026-03-07 session 2)

### Reviews
- `/review/gesture/` — Steelcase Gesture (pos ~10, target top 5)
- `/review/leap-plus/` — Steelcase Leap Plus
- `/review/aeron-size-c/` — Herman Miller Aeron Size C

### Money Page
- `/best-office-chairs/` — main revenue driver, indexed

### Comparison Pages
- `/gesture-vs-leap-plus/` — expanded to ~1,350 words, FAQPage schema
- `/aeron-vs-leap-plus/` — expanded to ~1,450 words, FAQPage schema
- `/aeron-vs-gesture/` — expanded to ~1,400 words, FAQPage schema, Byline, buy buttons (session 2)

### Steelcase Gesture Cluster (complete)
- `/chairs/steelcase-gesture/` — hub
- `/chairs/steelcase-gesture/seat-height/`
- `/chairs/steelcase-gesture/seat-depth/`
- `/chairs/steelcase-gesture/tall-people/`
- `/chairs/steelcase-gesture/weight-limit/`

### Herman Miller Aeron Cluster (complete)
- `/chairs/herman-miller-aeron/` — hub (created session 2)
- `/chairs/herman-miller-aeron/seat-height/` — created session 2
- `/chairs/herman-miller-aeron/tall-people/` — created session 2

### Educational Pages
- `/why-standard-chairs-dont-fit/`
- `/back-pain-spine-height/`
- `/leg-pain-circulation/`
- `/knee-pain-seat-depth/`
- `/correct-chair-dimensions/`
- `/how-to-adjust-chair/`
- `/office-chairs-for-tall-people/`
- `/pain-ergonomics/`
- `/fit-guides/`

### Utility
- `/about/`, `/affiliate-disclosure/`, `/privacy-policy/`, `/contact/`

---

## Components

- `src/components/Byline.astro` — author byline with published/updated dates
  - Props: `publishedDate: string` (ISO 8601), `updatedDate?: string`
  - Used on: all 3 reviews, best-office-chairs
- `src/components/Header.astro`, `src/components/Footer.astro`
- `src/layouts/Layout.astro` — accepts `title`, `description`, `canonical?`, `ogImage?`, `ogType?`, `schema?`, `noindex?`

**Note on Astro attribute escaping:** Use `&quot;` not `\"` for double quotes inside HTML string attributes. Template literals (backticks) are an alternative for complex titles but regular strings are preferred.

---

## Completed This Session (2026-03-07)

### E-E-A-T Foundation
- [x] Rewrote `/about/` — named author (Marcus Reid, 6'4"), bio, methodology, FTC disclosure, Person + Organization + WebPage schema
- [x] Created `Byline.astro` component
- [x] Added bylines to: gesture review, leap-plus review, aeron-size-c review, best-office-chairs

### Content Expansion
- [x] `/gesture-vs-leap-plus/` — expanded from 375 words to ~1,350 words (specs table, seat depth deep-dive, height guide, FAQPage schema, buy buttons)
- [x] `/aeron-vs-leap-plus/` — expanded from 375 words to ~1,450 words (same treatment, mesh vs foam section)
- [x] `/chairs/steelcase-gesture/weight-limit/` — new page (BIFMA testing, Gesture vs Leap Plus capacity table, warranty implications, FAQPage schema)
- [x] `/review/gesture/` — added Quick Answer box, height fit guide (6'1"–6'7"), FAQ section + FAQPage schema, updated author to Person, added dateModified

### Technical / SEO
- [x] Fixed 11 truncated title tags (all now under 65 chars)
- [x] Staggered `datePublished` on 7 educational pages (Nov–Dec 2024, away from generic 2025-01-15)
- [x] Added `dateModified: "2026-03-07"` to all 3 review schemas
- [x] Created `/public/llms.txt` — AI crawler permission + all key pages listed
- [x] Updated Article schema `author` to `Person` on all comparison + review pages

---

## Roadmap Status

### Phase 1 — Foundation ✅ (content complete)
Remaining Phase 1 items require Cloudflare dashboard (not code):
- [ ] Fix HSTS max-age (300s → 31536000) — Cloudflare Pages `_headers` or dashboard
- [ ] Add Cloudflare edge caching rule for static assets
- [ ] Self-host Google Fonts (currently loaded from fonts.googleapis.com)
- [ ] Submit new/updated pages to GSC for indexing

### Phase 2 — Expansion ✅ COMPLETE
- [x] `/chairs/steelcase-gesture/weight-limit/`
- [x] Updated `/review/gesture/` to 2,000+ words
- [x] `/chairs/herman-miller-aeron/` — cluster hub (session 2)
- [x] `/chairs/herman-miller-aeron/seat-height/` (session 2)
- [x] `/chairs/herman-miller-aeron/tall-people/` (session 2)
- [x] `/aeron-vs-gesture/` — expanded ~1,400 words, FAQPage schema, Byline (session 2)

### Steelcase Leap Plus Cluster (complete)
- `/chairs/steelcase-leap-plus/` — hub (created session 2)
- `/chairs/steelcase-leap-plus/seat-height/` — created session 2
- `/chairs/steelcase-leap-plus/tall-people/` — created session 2

### Phase 3 — Next (Month 4+)
- `/desks/` hub + desk height guides
- New reviews: Haworth Fern, Secretlab Titan XL
- Height-specific money pages: `/best-chair-for-6-4/` etc.

---

## Patterns to Follow

### New cluster page
1. Import `Layout` from `../../../layouts/Layout.astro` (adjust depth)
2. Import `Byline` from `../../../components/Byline.astro`
3. Schema: `FAQPage` + `BreadcrumbList` (+ `Article` if content-heavy)
4. Article schema author: `{ "@type": "Person", "name": "Marcus Reid", "url": "https://tallchairadvisor.com/about/" }`
5. Add disclosure box (amber), `<Byline publishedDate="..." />`, prose-tca wrapper
6. Add to parent cluster index page's navigation grid

### Quick Answer box pattern
```astro
<div class="not-prose bg-card border border-border rounded-lg p-5 mb-10">
  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Answer</p>
  <p class="font-semibold text-heading text-lg mb-2">...</p>
  <p class="text-sm text-muted-foreground">...</p>
</div>
```

### Specs table pattern
```astro
<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse">
    <thead><tr class="border-b border-border bg-secondary/30">...</tr></thead>
    <tbody class="divide-y divide-border">...</tbody>
  </table>
</div>
```

### Buy button pattern
```astro
<a href="https://www.amazon.com/s?k=...&tag=tallchairadvi-20" target="_blank" rel="noopener noreferrer sponsored" class="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors text-sm">
  View [Chair] on Amazon →
</a>
```

---

## Title Tag Rules
- Target: under 65 chars total (including ` | Tall Chair Advisor` = 21 chars)
- Content portion: ~44 chars max
- Use `"..."` attributes (not template literals) unless title contains `"` characters
- If title needs `"` inside, use `&quot;` not `\"`

## Date Conventions
- `datePublished`: real staggered dates (Nov–Dec 2024 for educational, Jan 2025 for reviews/comparisons, 2026-03-07 for new pages)
- `dateModified`: `"2026-03-07"` for all updated pages
- Byline `publishedDate` matches schema `datePublished`
- Byline `updatedDate` matches schema `dateModified`
