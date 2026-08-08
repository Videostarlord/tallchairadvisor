---
type: concept
last_updated: 2026-05-11
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

## GEO Score: 76/100 (May 10 — updated from 71/100 Mar 16)

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
2. **Citation capsules site-wide** — 40–60 word self-contained summaries. None present on any page. /correct-chair-dimensions/ is best first candidate. See [[correct-chair-dimensions]] for prescribed text.
3. **Author ME credentials in body text** — Author bio references ME background in schema but not always in visible page content.
4. **Passage-anchor sentences on /chairs/herman-miller-aeron/tall-people/** — AIO citation format absent. Competitor intelligence flagged this gap. Thursday W20 queues fix: prepend each spec section with bolded extractable sentence. See [[aeron-tall-people]].
5. **AIO suspect: /chairs/steelcase-gesture/seat-depth/** — pos 4.1 on "steelcase gesture seat depth range inches" (23 impr, 0 CTR). Title already has spec numbers — pattern indicates AI Overview consuming the answer. Fix: restructure content for AIO citation, not title rewrite. Thursday W20 addresses meta; AIO restructure is a separate deeper fix.

## Why This Matters

TCA's precise height-specific data is ideal AI citation material. Spec-driven content resists AI summary displacement because the numbers are verifiable. But the content needs to be structured so AI systems can extract clean passages.

## Links

- [[best-office-chairs]] — verdict table opportunity
- [[correct-chair-dimensions]] — citation capsule candidate
- [[schema-markup]] — supports rich results
- [[competitor-landscape]] — no competitor has height-bracket tables

## 2026-08-08 — Site-wide GEO marker rollout complete

The nightly escalated 48 `aio-suppression` findings across 44 pages. All are now closed at source: **49/49 crawled pages satisfy the `geo-capsule` predicate**, with 0 answer-first ordering warnings.

What the predicate actually requires (`scripts/probes/probe-page.ts` `extract()`, mirrored in a verifier run against `dist/`):

| Marker | Requirement |
|---|---|
| Direct Answer | an element inside `<article>` whose text is exactly `Direct Answer`, whose **parent** holds another `<p>` of ≥80 chars |
| Citation capsule | an HTML comment matching `tca-aio-capsule` whose **next element sibling** carries ≥80 chars |
| Answer-first | the Direct Answer element precedes the article's first `<h2>` |

Three traps found the hard way:

1. **A label that is itself an `<h2>` breaks answer-first ordering** — it becomes the article's own first `<h2>`. `/gesture-vs-leap-plus/` had exactly this, so its box was left as "Quick Answer" and a proper block was added above it.
2. **A `<ul>` does not satisfy the ≥80-char `<p>` requirement**, however substantial its content.
3. **`<p class="citation-capsule">` is invisible to the probe without the sentinel comment.** `/aeron-size-c-vs-leap-plus/` and `/office-chair-return-policy/` had the capsule prose all along and were failing only for the missing marker.

Utility pages (`/404/`, `/contact/`, `/privacy-policy/`, `/affiliate-disclosure/`, `/author/`) are excluded by design — hence 44 content pages against 49 crawled.

Capsules are written in third-person attributable register ("TCA's X analysis reports that…") so a model can quote them intact. Per the voice rules, first-person appears only where Jackson has genuinely used the chair; `/review/sihoo-doro-s300/` states explicitly that its assessment is from published specifications.
