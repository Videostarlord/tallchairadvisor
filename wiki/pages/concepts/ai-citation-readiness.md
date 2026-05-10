---
type: concept
last_updated: 2026-05-10
sources: [raw/audits/2026-03-16-geo-analysis.md, raw/audits/2026-04-03-full-audit.md, raw/audits/2026-04-22-serp-analysis.md]
tags: [geo, ai-search, citations, perplexity, chatgpt]
---

# AI Citation Readiness (GEO)

## Confirmed AI Overviews on TCA Queries (Apr 22)

Incognito SERP audit confirmed Google AI Overviews on two queries where TCA ranks:

| Query | TCA Position | Impressions | CTR | Status |
|---|---|---|---|---|
| herman miller aeron size c height range | 9.0 | 10 | 0% | AI Overview present — answers spec fully |
| steelcase gesture 360 armrests description | 7.8 | 4 | 0% | AI Overview present |

**Implication:** These rankings are real but clicks are impossible without being cited inside the AI Overview itself. GEO optimization — specifically height-bracket verdict tables and citation capsules — is the path to traffic from these queries.

---

## GEO Score: 71/100 (Mar 16)

| Category | Score |
|----------|-------|
| Citability | 60/100 |
| Structural Readability | 82/100 |
| Multi-Modal Content | 78/100 |
| Authority & Brand Signals | 68/100 |
| Technical Accessibility | 73/100 |

## Platform Scores

| Platform | Score | Primary Gap |
|----------|-------|------------|
| Google AI Overviews | 74/100 | No FAQ rich results on some pages; author credentials in body text missing |
| ChatGPT | 69/100 | llms.txt lacks full coverage; no Wikipedia/YouTube presence |
| Perplexity | 72/100 | Passage blocks need 134–167 word self-contained targets |

## What's Done

- ✅ AI bots allowed (GPTBot, ClaudeBot, PerplexityBot) in robots.txt
- ✅ llms.txt present at root
- ✅ FAQPage schema on top pages
- ✅ Comparison tables on key pages
- ✅ TL;DR / Quick Answer blocks on top pages

## What's Missing

1. **Height-bracket verdict table on /best-office-chairs/** — ✅ DONE (2026-05-07). Added with Amazon affiliate links. Now the site's highest AI Overview citation target.
2. **Citation capsules site-wide** — 40–60 word self-contained summaries. None present on any page. /correct-chair-dimensions/ is best first candidate.
3. **Author ME credentials in body text** — Author bio references ME background in schema but not always in visible page content.

## Why This Matters

TCA's precise height-specific data is ideal AI citation material. Spec-driven content resists AI summary displacement because the numbers are verifiable. But the content needs to be structured so AI systems can extract clean passages.

## Links

- [[best-office-chairs]] — verdict table opportunity
- [[correct-chair-dimensions]] — citation capsule candidate
- [[schema-markup]] — supports rich results
- [[competitor-landscape]] — no competitor has height-bracket tables
