# TallChairAdvisor.com — Site Structure
*Last updated: March 2026*

---

## Architecture Principles

1. **Hub-and-spoke clusters** — Each major chair brand gets a hub page + micro-pages underneath it. The hub links to all micro-pages; micro-pages link back to the hub and to the main money pages.
2. **Shallow depth** — All pages reachable within 3 clicks from home
3. **Internal linking discipline** — Every page has at least 3 internal links (to cluster hub, to money page, to one related page)
4. **URL predictability** — URL pattern reveals content type: `/review/` for reviews, `/chairs/brand/spec/` for micro-pages, `/desks/` for desk content

---

## Full URL Hierarchy

```
/                                            ← Home
├── /best-office-chairs/                     ← Pillar: Money page (P1 — EXPAND NOW)
├── /office-chairs-for-tall-people/          ← Pillar: Guide/educational

├── /review/                                 ← Review hub
│   ├── /review/gesture/                     ← Steelcase Gesture review (EXISTS, pos ~10)
│   ├── /review/aeron-size-c/                ← Herman Miller Aeron Size C review (EXISTS)
│   ├── /review/leap-plus/                   ← Steelcase Leap Plus review (EXISTS)
│   ├── /review/haworth-fern/                ← [PLANNED — Month 3]
│   └── /review/secretlab-titan-xl/          ← [PLANNED — Month 3]

├── /chairs/                                 ← Chair cluster hub
│   ├── /chairs/steelcase-gesture/           ← Gesture cluster hub [PLANNED — Week 2]
│   │   ├── /chairs/steelcase-gesture/seat-height/   ← [PLANNED — Week 2, GSC pos 7]
│   │   ├── /chairs/steelcase-gesture/seat-depth/    ← [PLANNED — Week 2, GSC pos 6]
│   │   ├── /chairs/steelcase-gesture/tall-people/   ← [PLANNED — Week 2, GSC pos 16]
│   │   └── /chairs/steelcase-gesture/weight-limit/  ← [PLANNED — Month 1]
│   │
│   ├── /chairs/herman-miller-aeron/         ← Aeron cluster hub [PLANNED — Month 2]
│   │   ├── /chairs/herman-miller-aeron/seat-height/ ← [PLANNED — Month 2]
│   │   └── /chairs/herman-miller-aeron/tall-people/ ← [PLANNED — Month 2]
│   │
│   └── /chairs/steelcase-leap-plus/         ← Leap Plus cluster hub [PLANNED — Month 4]
│       ├── /chairs/steelcase-leap-plus/tall-people/
│       ├── /chairs/steelcase-leap-plus/seat-height/
│       └── /chairs/steelcase-leap-plus/weight-limit/

├── /aeron-vs-gesture/                       ← Comparison (EXISTS, pos ~7.4)
├── /gesture-vs-leap-plus/                   ← Comparison (EXISTS, thin — EXPAND)
├── /aeron-vs-leap-plus/                     ← Comparison (EXISTS, thin — EXPAND)
├── /steelcase-gesture-vs-embody/            ← [PLANNED — Month 6]
├── /haworth-fern-vs-gesture/               ← [PLANNED — Month 6]
└── /steelcase-leap-vs-aeron/               ← [PLANNED — Month 6]

├── /desks/                                  ← Secondary niche hub [PLANNED — Month 4]
│   ├── /desks/desk-height-tall-people/      ← [PLANNED — Month 3]
│   ├── /desks/desk-height-6-4/             ← [PLANNED — Month 3]
│   ├── /desks/standing-desk-height-chart/  ← [PLANNED — Month 3]
│   ├── /desks/review-uplift-v2/            ← [PLANNED — Month 6]
│   └── /desks/review-fully-jarvis/         ← [PLANNED — Month 6]

├── /fit-guides/                             ← Educational hub (EXISTS)
├── /pain-ergonomics/                        ← Educational hub (EXISTS)
├── /correct-chair-dimensions/              ← Educational (EXISTS)
├── /how-to-adjust-chair/                   ← Educational (EXISTS)
├── /back-pain-spine-height/               ← Educational (EXISTS)
├── /knee-pain-seat-depth/                 ← Educational (EXISTS)
├── /leg-pain-circulation/                 ← Educational (EXISTS)
└── /why-standard-chairs-dont-fit/         ← Educational (EXISTS)
```

---

## Internal Linking Map

### /best-office-chairs/ should link to:
- /review/gesture/
- /review/aeron-size-c/
- /review/leap-plus/
- /review/haworth-fern/ (when live)
- /aeron-vs-gesture/
- /gesture-vs-leap-plus/
- /chairs/steelcase-gesture/tall-people/
- /chairs/herman-miller-aeron/tall-people/

### /review/gesture/ should link to:
- /chairs/steelcase-gesture/ (hub)
- /chairs/steelcase-gesture/seat-height/
- /chairs/steelcase-gesture/seat-depth/
- /chairs/steelcase-gesture/tall-people/
- /chairs/steelcase-gesture/weight-limit/
- /aeron-vs-gesture/
- /gesture-vs-leap-plus/
- /best-office-chairs/

### /chairs/steelcase-gesture/ (hub) should link to:
- All 4 micro-pages underneath it
- /review/gesture/
- /best-office-chairs/
- /aeron-vs-gesture/

### Each micro-page (/chairs/steelcase-gesture/seat-height/, etc.) should link to:
- /chairs/steelcase-gesture/ (hub) — "See full Gesture overview"
- /review/gesture/ — "Read our full Gesture review"
- /best-office-chairs/ — "Compare all top chairs for tall people"
- 1–2 sibling micro-pages

---

## Breadcrumb Structure

Every page should display breadcrumbs matching its URL depth:

```
Home > Review > Steelcase Gesture Review
Home > Chairs > Steelcase Gesture > Seat Height Range
Home > Comparisons > Steelcase Gesture vs Herman Miller Aeron
Home > Desks > Desk Height for Tall People
```

Implement as BreadcrumbList JSON-LD schema on every non-home page.

---

## Schema Strategy by Page Type

| Page type | Schema types to implement |
|---|---|
| Home | WebSite, Organization |
| Money page (/best-office-chairs/) | ItemList, FAQPage |
| Full review | Review, AggregateRating (if applicable), FAQPage, BreadcrumbList |
| Comparison page | FAQPage, BreadcrumbList |
| Micro-intent page | FAQPage, HowTo (if instructional), BreadcrumbList |
| Hub page | ItemList, BreadcrumbList |
| About page | Person (author), Organization |

---

## Page Status Legend

- **EXISTS** — Page is live on the site
- **EXPAND** — Page exists but needs significant content expansion
- **PLANNED** — Page does not exist yet; in content calendar
- **P1/P2/P3** — Priority tier

## Current Page Inventory

| URL | Status | Word count (est.) | Priority |
|---|---|---|---|
| / | EXISTS | — | — |
| /best-office-chairs/ | EXISTS — EXPAND | 408 | P1 critical |
| /review/gesture/ | EXISTS — UPDATE | ~1,000+ | P1 |
| /review/aeron-size-c/ | EXISTS | ~800? | P2 |
| /review/leap-plus/ | EXISTS | ~800? | P2 |
| /aeron-vs-gesture/ | EXISTS | ~800? | P1 |
| /gesture-vs-leap-plus/ | EXISTS — EXPAND | 375 | P1 |
| /aeron-vs-leap-plus/ | EXISTS — EXPAND | 375 | P1 |
| /fit-guides/ | EXISTS | — | P2 |
| /pain-ergonomics/ | EXISTS | — | P2 |
| /correct-chair-dimensions/ | EXISTS | — | P3 |
| /how-to-adjust-chair/ | EXISTS | — | P3 |
| /back-pain-spine-height/ | EXISTS | — | P3 |
| /knee-pain-seat-depth/ | EXISTS | — | P3 |
| /leg-pain-circulation/ | EXISTS | — | P3 |
| /why-standard-chairs-dont-fit/ | EXISTS | — | P3 |
| /chairs/steelcase-gesture/ | PLANNED | — | P1 |
| /chairs/steelcase-gesture/seat-height/ | PLANNED | — | P1 |
| /chairs/steelcase-gesture/seat-depth/ | PLANNED | — | P1 |
| /chairs/steelcase-gesture/tall-people/ | PLANNED | — | P1 |
| /chairs/steelcase-gesture/weight-limit/ | PLANNED | — | P1 |
| /chairs/herman-miller-aeron/ | PLANNED | — | P2 |
| /chairs/herman-miller-aeron/seat-height/ | PLANNED | — | P2 |
| /chairs/herman-miller-aeron/tall-people/ | PLANNED | — | P2 |
| /review/haworth-fern/ | PLANNED | — | P2 |
| /review/secretlab-titan-xl/ | PLANNED | — | P3 |
| /desks/ | PLANNED | — | P3 |
| /desks/desk-height-tall-people/ | PLANNED | — | P2 |
| /desks/desk-height-6-4/ | PLANNED | — | P2 |
| /desks/standing-desk-height-chart/ | PLANNED | — | P2 |

---

## Robots.txt and Crawl Directives

Ensure the following is in place:

```
# /robots.txt
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://tallchairadvisor.com/sitemap.xml
```

---

## llms.txt (Add at site root)

```
# TallChairAdvisor.com
> Ergonomic office chair reviews and fit guides for tall people (6'1"–6'7")

## Key pages
- [Best Office Chairs for Tall People](https://tallchairadvisor.com/best-office-chairs/)
- [Steelcase Gesture Review](https://tallchairadvisor.com/review/gesture/)
- [Herman Miller Aeron Size C Review](https://tallchairadvisor.com/review/aeron-size-c/)
- [Steelcase Gesture vs Herman Miller Aeron](https://tallchairadvisor.com/aeron-vs-gesture/)
- [Fit Guides](https://tallchairadvisor.com/fit-guides/)
```

---

## Sitemap Notes

- Submit XML sitemap to GSC: https://tallchairadvisor.com/sitemap.xml
- Astro should auto-generate sitemap via @astrojs/sitemap integration
- Verify all live pages appear in sitemap; verify all planned pages are added as they go live
- Exclude any noindex pages from sitemap
- Set `<priority>` values: home = 1.0, money pages = 0.9, reviews = 0.8, micro-pages = 0.6, educational = 0.5
