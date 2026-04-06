---
type: synthesis
last_updated: 2026-04-06
tags: [decisions, history]
---

# Decisions Log

A rolling record of key strategic decisions and their outcomes. The most valuable RAG source for the automation agents — before making a new strategy, query this first.

## 2026-W14 (Mar 31 – Apr 6)

- **Audit score:** 89/100 (+3 from Mar 30)
- **Fixed:** 7 issues from prior audit (404, meta lengths, sitemap priorities, og:type, internal links)
- **Identified:** CTR crisis is the #1 problem — 0.29% avg CTR across ~4,100 impressions
- **Prescribed:** Verdict-first meta rewrites for 3 pages (NOT YET IMPLEMENTED)
- **Prescribed:** Height-bracket verdict table for /best-office-chairs/ (NOT YET IMPLEMENTED)
- **New signal:** "steelcase gesture review independent" query emerging (11 impr, pos 8.91)
- **Decision:** All previously unindexed pages submitted to GSC → confirmed indexed by Apr 5
- **Decision:** Automation system designed (AUTOMATION-SYSTEM.md) for weekly agent pipeline
- **ARCHITECTURE: LLM Wiki system implemented.** 22 wiki pages created from ~35 scattered workspace files. 3-layer pattern: raw/ (immutable sources), wiki/ (LLM-maintained knowledge), SCHEMA.md (operating rules). All 6 automation agents wired to read/write wiki. Wednesday strategy agent now gets compiled multi-week history instead of just last week's raw data. Wiki + raw moved inside git repo for CI access. Obsidian vault configured with graph view, color groups, and symlinks for browsing.

## 2026-W13 (Mar 24 – Mar 30)

- **Audit score:** 86/100
- **Fixed:** gesture review meta (171→146), leap-plus seat-height meta (166→133)
- **Identified:** 404 on /leap-plus/weight-limit/, og:type wrong on 3 pages, sitemap priority wrong on height pages
- **Decision:** Sitemap priority for height pages raised to 0.8

## 2026-W12 and earlier (Mar 2 – Mar 23)

- **Site launched:** ~Jan 2026
- **Phase 1 (Foundation):** All chair clusters created, comparison pages expanded, E-E-A-T foundation (about page, bylines, Person schema)
- **Phase 2 (Expansion):** Aeron + Leap Plus clusters, FAQ schema, Quick Answer boxes
- **Blog audit (Mar 19):** 37 pages, avg score 71/100
- **GEO analysis (Mar 16):** Score 71/100, identified citation capsules and passage blocks as gaps
- **Multiple SEO audits:** Mar 2, 8, 12, 15, 16, 17, 19 — iterative improvement cycle

---

*Append new entries at the top. Each week's entry should note: what was done, what was decided, what was deferred, and any surprising outcomes.*
