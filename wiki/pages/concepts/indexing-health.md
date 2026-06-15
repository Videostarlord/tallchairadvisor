---
type: concept
last_updated: 2026-06-15
sources: [raw/audits/2026-06-15-index-monitor.md]
tags: [indexing, gsc, coverage, technical-seo]
---

# Indexing Health

Last checked: **2026-06-15**

## Current Status

| Metric | Value |
|--------|-------|
| Total pages | 47 |
| Indexed | 35 |
| Issues | 12 |

## Issues — Grouped by Priority

### 🔴 Crawled but rejected — likely thin content (action needed)
Google fetched these successfully but chose not to index. Persistent since at least May 25 (3+ weeks). This is a content quality signal, not a crawl budget issue.

| URL | Coverage State |
|-----|---------------|
| /chairs/herman-miller-aeron/seat-height/ | Crawled - currently not indexed |
| /chairs/steelcase-gesture/seat-height/ | Crawled - currently not indexed |
| /chairs/steelcase-gesture/tall-people/ | Crawled - currently not indexed |

**Recommended fix:** Audit these 3 pages for thin content — add spec tables, unique height-specific data, or merge/301 into the parent chair hub if the content can’t be meaningfully expanded.

### 🟡 Discovered but not yet crawled — wait/resubmit
Google knows about these but hasn’t visited yet. Sitemap resubmitted 2026-06-14. Give it 1–2 weeks.

| URL | Notes |
|-----|-------|
| /heavy-duty-ergonomic-chairs-tall-people/ | Created May 26 — substantial page, should index fine |
| /leg-pain-circulation/ | Content page — monitor |
| /office-chair-return-policy/ | Content page — monitor |
| /chairs/herman-miller-aeron/size-guide/ | Sub-page — monitor |

### ⚪ Non-issues (expected/intentional)
| URL | Reason |
|-----|--------|
| /privacy-policy/ | noindex — intentional |
| /404/ | Unknown to Google — expected, 404 pages shouldn’t be indexed |
| /affiliate-disclosure/ | Unknown — utility page, low priority |
| /contact/ | Unknown — utility page, low priority |
| /author/jackson-christopher/ | Unknown — author page not yet discovered |

## Fix History

| Date | Page | Fix Type | Result |
|------|------|----------|--------|
| 2026-06-14 | Sitemap | Resubmitted sitemap-index.xml | +2 indexed since May 25 (gesture/weight-limit, leap-plus/weight-limit resolved) |
| 2026-06-14 | 3 seat-height/tall-people sub-pages | No fix available — thin content diagnosis | Content expansion needed |
