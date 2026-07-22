---
type: entity
entity: site-page
url: /review/leap-plus/
last_updated: 2026-07-21
sources: [data/gsc/latest.json, data/competitors/intelligence.json, raw/audits/2026-07-21-full-seo-audit.md]
tags: [page, review, leap-plus, research-based]
---

# Page: /review/leap-plus/

**Research-based review. Jackson's second-choice finalist — "almost bought" narrative.**


## 🔴 CRITICAL — source file is structurally destroyed (found 2026-07-21, NOT yet live)

`src/pages/review/leap-plus.astro` line 1 is **raw LLM chat output**, not the `---` frontmatter fence:

> "Looking at the file, I need to identify the dead click. The Amazon ASIN `B00TYE4QXU` appears in both CTA buttons — but that ASIN is for the standard Steelcase Leap, not the Leap Plus..."

Because the fence is not at byte 0, Astro never executes the frontmatter. **The build succeeds silently** (49 pages, no error). The emitted `dist/review/leap-plus/index.html` has **no `<title>`, no meta description, no canonical, and zero JSON-LD** — and renders the chat text as visible body copy.

Committed in `3505a12` (**unpushed**). Live production is currently clean. **The next deploy ships it.**

Stakes: this page is the site's **#1 click source** — 34 clicks/90d, 16.3% of all site clicks. Shipping this zeroes its SEO and removes it from the AI citation pool.

**Fix:** delete lines 1–5 and the trailing ```` ``` ```` fence artifact. Then add a build assertion that every `dist/**/index.html` contains `<title>` and `rel="canonical"` — the silent build pass is the real systemic defect. Note the ASIN change the leaked text describes was never applied; `B00TYE4QXU` is still in the file.

Also on this page (from the same audit): `aggregateRating` with `reviewCount: 1` mirroring the single self-authored review (remove); the retracted "Gesture 3–4 week break-in" fabrication survives at L116 (FAQ schema), L282, L322 (delete); `hasMerchantReturnPolicy` + `shippingDetails` asserted as though TCA were the seller (remove). Full audit: `raw/audits/2026-07-21-full-seo-audit.md`.

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
