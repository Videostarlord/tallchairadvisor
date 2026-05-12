---
type: entity
entity: site-page
url: /review/leap-plus/
last_updated: 2026-05-12
sources: [data/gsc/latest.json, data/competitors/intelligence.json]
tags: [page, review, leap-plus, research-based]
---

# Page: /review/leap-plus/

**Research-based review. Jackson's second-choice finalist — "almost bought" narrative.**

## Current State (May 12 — GSC + competitor:intelligence)

| Metric | Value |
|--------|-------|
| Impressions | (check data/gsc/latest.json) |
| Position | (check data/gsc/latest.json) |
| Voice | Research-based — "I almost bought this" framing. No first-person testing claims. |
| Schema | (not audited — run /seo-page to establish baseline) |

## AIO Suppression Status (May 12 — competitor:intelligence v2.3)

- **Query:** "steelcase leap plus review"
- **AIO detected:** Yes — TCA not cited. 15 cited URLs, 1,087-char passage.
- **Capsule:** Applied ✅ — after H2 "Overview" (spec-validated: 19.75" depth, 22.5" height, 25.5" back, 500lb)
- **Sentinel:** `<!-- tca-aio-capsule -->` present — future runs will not re-apply.
- **Source of truth:** `data/competitors/intelligence.json` (2026-05-12 run)

## Open Issues

1. **Not yet audited with /seo-page** — no SEO baseline established.
2. **Reframe as "almost bought" narrative** (C2 priority) — current draft may not fully leverage Jackson's purchase decision story. See [[steelcase-leap-plus]].
3. **FTC affiliate disclosure** — verify inline disclosure is present. See [[affiliate-compliance]].

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-05-12 | AIO citation capsule inserted after "Overview" H2 | Spec-validated (19.75"/22.5"/25.5"/500lb) |

## Links

- [[steelcase-leap-plus]] — chair entity
- [[ai-citation-readiness]] — AIO suppression context
- [[affiliate-compliance]] — disclosure requirements
