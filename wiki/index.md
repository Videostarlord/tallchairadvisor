---
type: index
last_updated: 2026-05-09 (agent reliability audit + fixes)
---

# TCA Wiki Index

Master catalog of all wiki pages. The LLM reads this first to find relevant pages before answering queries.

---

## Chair Entities

| Page | Summary |
|------|---------|
| [[steelcase-gesture]] | Jackson's chair. Only first-person content. 1895 impr, pos 8.4. Flagship. |
| [[herman-miller-aeron]] | Research-only. /tall-people/ at 1175 impr, pos 7.3, 3 clicks. Previously 0% CTR — improving. |
| [[steelcase-leap-plus]] | Research-only. Best raw specs for tall users. "Almost bought" narrative. |
| [[sihoo-doro-s300]] | Research-only. Budget option. Rising in AI citations. Newly indexed Apr 5. |

## Site Page Entities

| Page | Summary |
|------|---------|
| [[review-gesture]] | Flagship review. Score 88. 1895 impr, pos 8.4, 3 clicks (0.16% CTR). Meta rewrite shipped May 7. |
| [[aeron-tall-people]] | 1175 impr, pos 7.3, 3 clicks (0.26% CTR). No longer 0% CTR. Monitor for improvement. |
| [[aeron-vs-gesture]] | Comparison. Trailing-slash redirect confirmed in _redirects. Low CTR. |
| [[chairs-herman-miller-aeron-size-guide]] | NEW 2026-04-13. Size B vs C guide for tall users. No GSC data yet. |
| [[correct-chair-dimensions]] | Educational. 1422 impr, pos 16.7. Citation capsule candidate. |
| [[best-office-chairs]] | Money page. Height-bracket verdict table + affiliate links live as of May 7. |

## Concept Pages

| Page | Summary |
|------|---------|
| [[ctr-optimization]] | #1 site bottleneck. 0.24% CTR on 12,209 impr (May 2026). Verdict-first meta pattern. |
| [[meta-descriptions]] | Length constraints, regex bug, current status per page. |
| [[schema-markup]] | Types in use, JSON-LD parse error on money page, aggregateRating issues. |
| [[ai-citation-readiness]] | GEO score 71/100. Missing: citation capsules, verdict table. |
| [[internal-linking]] | Hub-and-spoke architecture. Verified + unverified link inventory. |
| [[competitor-landscape]] | 5 direct competitors. TCA advantage: height specificity. |
| [[gsc-performance]] | 12,209 impr, 29 clicks, 0.24% CTR (May 4, 90-day). Page-level rankings. KPI targets. |
| [[content-gaps]] | Standing desk page, verdict table, citation capsules, depth upgrades. |
| [[content-quality-scores]] | Blog audit Mar 19. Avg 71/100. Gate: 80+ for new content. |
| [[system-setup-guide]] | Step-by-step replication guide for Jackson (human reference only — not LLM context). Do not read for operational questions. |
| [[workflow-system-reference]] | Current operational setup: weekly agent cycle, GitHub Actions, scripts, Obsidian vault, data flow. Read this for any question about how the automation works. |
| [[indexing-health]] | Per-page GSC indexing status. Updated every Monday by index-monitor agent. Shows which pages are indexed, excluded, or waiting. |

## Synthesis

| Page | Summary |
|------|---------|
| [[what-works]] | Confirmed wins: hub-and-spoke, spec sub-pages, FAQ schema, content expansion. |
| [[what-failed]] | Comparison table didn't fix CTR. Meta trim had marginal effect. |
| [[thesis]] | The strategic bet: own height-specific chair ergonomics. Current priorities. |
| [[decisions-log]] | Week-by-week record of what was done, decided, and deferred. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W16]] | Deployed. 12 clicks, 5590 impr. |
| [[2026-W17]] | Deployed. 19 clicks, 7096 impr. |
| [[2026-W18]] | Deployed. 23 clicks, 8455 impr. |

## Raw Sources (reference only — don't edit)

Located in `raw/`. Organized by type:
- `raw/gsc/` — GSC data exports (Mar 7 through May 4)
- `raw/audits/` — Audit/analysis files (latest: 2026-05-07)
- `raw/strategy/` — Strategy/planning files (latest: 2026-05-07)
- `raw/reddit/` — Reddit/Apify pipeline docs
- `raw/misc/` — Session context, PDF
- `raw/assets/` — Images, XML files
