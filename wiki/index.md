---
type: index
last_updated: 2026-05-15 (DataForSEO reference page added)
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
| [[review-gesture]] | Flagship review. Score 88. 2,529 impr, pos 8.2. AIO capsule applied May 12 (18.75" seat depth). |
| [[review-leap-plus]] | Research-based "almost bought" review. AIO capsule applied May 12 (19.75"/22.5"/500lb specs). |
| [[aeron-tall-people]] | 1,353 impr, pos 7.4, 4 clicks (0.30% CTR). May 10. |
| [[aeron-vs-gesture]] | 385 impr, pos 8.5, 0 clicks (0% CTR). Comparison. May 10. |
| [[chairs-herman-miller-aeron-size-guide]] | NEW 2026-04-13. Size B vs C guide for tall users. No GSC data yet. |
| [[correct-chair-dimensions]] | Educational. 1,766 impr, pos 15.8. Top GSC opportunity (content-depth, score 883). May 12. |
| [[best-office-chairs]] | Money page. 776 impr, pos 22.5, 0 clicks. AIO capsule applied May 12 (21" Aeron seat height). |

## Concept Pages

| Page | Summary |
|------|---------|
| [[ctr-optimization]] | #1 site bottleneck. 0.23% CTR (May 2026). Cause A: AIO suppression (80%). Cause B: carousels. Build geo-optimize.ts to fix. |
| [[geo-optimize-plan]] | **COMPLETE (May 11).** Integrated into competitor-intelligence.ts v2.3. 3 capsules applied (gesture, best-office-chairs, leap-plus). SERP cache live (72h). 3 pages pending (page_token — unfixable). Strategy.ts reads AIO context. |
| [[meta-descriptions]] | Length constraints, regex bug, current status per page. |
| [[schema-markup]] | Types in use, JSON-LD parse error on money page, aggregateRating issues. |
| [[ai-citation-readiness]] | GEO score 71/100. Missing: citation capsules, verdict table. |
| [[internal-linking]] | Hub-and-spoke architecture. Verified + unverified link inventory. |
| [[competitor-landscape]] | 5 direct competitors. TCA advantage: height specificity. |
| [[gsc-performance]] | 12,209 impr, 29 clicks, 0.24% CTR (May 4, 90-day). Page-level rankings. KPI targets. |
| [[keyword-opportunities]] | Monthly keyword discovery results. Top-20 scored gaps for Jackson to review and approve. |
| [[dataforseo-reference]] | Official DataForSEO V3 reference for TCA. Auth model, priority endpoints, and current repo integration. Read before any DataForSEO work. |
| [[gsc-analysis-strategy]] | Query-level GSC analysis. Cornell cluster (164 impr, 0 CTR). AIO pattern detection. Plan for gsc-analyze.ts. Read before any CTR fix decision. |
| [[gsc-intelligence]] | **AUTO-GENERATED WEEKLY** by gsc-analyze.ts. Current week's ranked opportunities, CTR leaks, affiliate alerts, device split. Read before strategy.ts runs. |
| [[gsc-intelligence-system]] | Architecture reference: data flow, scoring formulas, expected CTR curve, file locations. Includes bug fix history. Read when modifying the pipeline. |
| [[systems-architecture-audit-2026-05-13]] | **May 13 systems-level architecture audit. 5.5/10.** Top gaps: no keyword research, no fix attribution, no prompt caching. $20-60/month API cost risk. Read before any pipeline changes. |
| [[audit-implementation-2026-05-10]] | **May 10 audit fix tracker.** 14 items done, 5 deferred. Read this to know what's been fixed and what's still outstanding from the COMBINED_2026-05-09_MASTER_AUDIT. |
| [[audit-2026-05-10-seo]] | **May 10 full SEO audit. SNAPSHOT ONLY — findings now ingested into entity pages.** 77/100 overall. Read [[schema-markup]], [[affiliate-compliance]], [[meta-descriptions]], entity pages for current status. |
| [[query-clustering-system]] | How queries are grouped into semantic clusters. Intent weights, known TCA cluster families, cannibalization logic. |
| [[opportunity-scoring-system]] | Scoring formulas for near-p1, ctr-leak, content-depth, affiliate-capture opportunity types. Priority thresholds. |
| [[content-gap-engine]] | Internal + competitor gap detection. Current known gaps. Integration with competitor-monitor. |
| [[market-signal-framework]] | Velocity signals, AIO suppression detection, seasonal intent emergence, impression gravity. Current market state. |
| [[niche-validation-framework]] | How to tell "dead niche" vs distribution lag. Separates demand, ranking, and monetization validation. TCA verdict: not dead; expand adjacently first. |
| [[content-gaps]] | Standing desk page, verdict table, citation capsules, depth upgrades. |
| [[content-quality-scores]] | Blog audit Mar 19. Avg 71/100. Gate: 80+ for new content. |
| [[system-setup-guide]] | Step-by-step replication guide for Jackson (human reference only — not LLM context). Do not read for operational questions. |
| [[workflow-system-reference]] | Current operational setup: weekly agent cycle, GitHub Actions, scripts, Obsidian vault, data flow. Read this for any question about how the automation works. |
| [[indexing-health]] | Per-page GSC indexing status. Updated every Monday by index-monitor agent. Shows which pages are indexed, excluded, or waiting. |
| [[affiliate-compliance]] | **NEW 2026-05-11.** FTC body disclosure missing on 6 pages. Revenue leaks: aeron-vs-gesture (0 CTAs in 84%), gesture review (CTA at 85%), best-office-chairs (Quick Picks → internal not Amazon). |
| [[runpod-migration-proposal]] | 🔴 BACKLOG / soft rejected. Broad RunPod migration for TCA deferred; Anthropic Batch research is now the preferred low-friction cost path. Raw proposal remains as historical research only. |

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
- `raw/audits/` — Audit/analysis files (latest: 2026-05-10). Key files: `COMBINED_2026-05-09_MASTER_AUDIT.md` (system audit), `2026-05-10-full-seo-audit.md` (6-specialist parallel SEO audit, 77/100).
- `raw/strategy/` — Strategy/planning files (latest: 2026-05-07)
- `raw/reddit/` — Reddit/Apify pipeline docs
- `raw/misc/` — Session context, PDF
- `raw/assets/` — Images, XML files
