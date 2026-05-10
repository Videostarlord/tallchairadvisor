# Data Pipeline Audit
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## Data Sources Inventory

| Source | Collection Method | Frequency | Current State |
|--------|-----------------|-----------|--------------|
| Google Search Console (performance) | GSC API v3 via googleapis | Weekly Monday | ✅ Active. 6 dimensions. |
| GSC URL Inspection | GSC URL Inspection API | Weekly Monday | ✅ Active. All 46 pages. |
| Competitor page HTML | Native fetch() | Weekly Monday | ✅ Active. 5 URLs, metadata only. |
| Reddit posts (Apify) | Apify Reddit scraper | Manual only | ⚠️ Last run March 2026. |
| Live site HTML | Native fetch() in audit.ts | Weekly Tuesday | ✅ Active. Top 20 pages. |
| Raw GSC CSVs (manual exports) | Manual upload to raw/gsc/ | Ad hoc | ✅ 12 exports dating to March 7. |

**No SERP data source.** No Ahrefs, SEMrush, DataForSEO, or SerpAPI integration. The system cannot observe what is ranking on Google for TCA's target keywords — only what Google tells TCA about its own pages.

---

## What Data Is Collected

### GSC Data (latest.json)

6 dimensions collected per weekly pull:

| Dimension | Fields | Row limit | Purpose |
|-----------|--------|-----------|---------|
| page | page, clicks, impressions, ctr, position | 500 | Page-level rankings |
| query | query, clicks, impressions, ctr, position | 200 | Top queries site-wide |
| page+query | page, query, clicks, impressions, ctr, position | 500 | CTR leak detection |
| device+page | device, page, clicks, impressions, ctr, position | 500 | Mobile vs desktop split |
| date | date, clicks, impressions, ctr, position | 500 | Daily trend |
| totals | site-wide aggregates | 1 | Executive metrics |

**Row limit of 500 on page+query is a real constraint.** If TCA grows to >500 page+query combinations with impressions, the most important rows (highest impressions) will be returned but some long-tail will be cut. This is currently not a problem at 29 clicks/90 days but will become relevant at 500+ clicks.

### Competitor Data (latest.json)

Per URL: title, meta description, H1, first 8 H2s, approximate word count, schema types.

**What's missing:** Keyword rankings, backlink profile, traffic estimates, publishing cadence, author information.

### Reddit Data (published/*.json)

Per chair: summary of owner experiences, key themes, common complaints, common praises, purchase context.

**Last updated:** March 14, 2026. Stale but structurally correct for the chairs covered (gesture, aeron, leap-plus). Sihoo Doro S300 — no Reddit data.

---

## What Data Is Ignored

1. **Query date dimension** — The GSC pull does NOT include page+query+date combinations. This means CTR trends per query are invisible. You can see a query's 90-day aggregate CTR but not whether it improved or degraded over time.

2. **Country split** — The raw GSC CSVs include country data but the API pull does not request a country dimension. If TCA has significant UK/Australia/Canada traffic (likely given the chair niche spans English-speaking markets), this is invisible.

3. **Search appearance types** — The raw CSVs include "Search appearance" data (rich results, featured snippets). The API pull does not request this. TCA can't programmatically detect when it gains or loses a featured snippet or FAQ rich result.

4. **Backlink data** — Zero. No source collects or tracks backlinks. For a young site, backlink acquisition is a primary ranking lever. The system has no visibility into this at all.

5. **Core Web Vitals** — Not in the GSC pull. Mentioned in audits as "9/10 performance score" but no programmatic tracking.

6. **Revenue/conversion data** — The system knows impressions and clicks. It has no connection to Amazon Associates data (commission amounts, product click-throughs per link, conversion rate). The $18 commission was discovered manually, not through any pipeline.

---

## What Data Is Duplicated

1. **GSC data** exists in: `raw/gsc/gsc-YYYY-MM-DD.json` (weekly archives), `raw/gsc/GSC-*/` (manual CSV exports), `data/gsc/latest.json` (current week), `data/gsc/history/` (analysis snapshots), `wiki/pages/concepts/gsc-performance.md` (wiki digest), `wiki/pages/concepts/gsc-intelligence.md` (processed digest).

2. **Competitor data** exists in: `raw/competitors/competitors-YYYY-MM-DD.json` (weekly archives), `data/competitors/latest.json` (current week), `wiki/pages/concepts/competitor-landscape.md`.

3. **Audit reports** exist in: `raw/audits/YYYY-MM-DD-weekly-audit.md` (archives), `reports/audit-report.md` (current week).

This duplication is INTENTIONAL and correct — raw/ is immutable, data/ is current, wiki/ is processed. The architecture is right.

---

## What Data Is Stale

| Data | Last Updated | Acceptable? |
|------|-------------|------------|
| Reddit published summaries | March 14, 2026 | No — 7+ weeks stale |
| Competitor URL list in config.json | Unknown (never versioned) | Monitor |
| Raw GSC CSVs (manual) | April 3, 2026 | Superseded by API pull — OK |
| Wiki `what-failed.md` | April 22, 2026 | Should be updated |

---

## Intelligence Transformation Assessment

### Raw → Intelligence pipeline works correctly:

```
GSC API (6 dimensions) → latest.json (structured) → gsc-analyze.ts → analysis.json (ranked intelligence)
```

The transformation adds:
- CTR leak scoring (query × impression × intent weight)
- Opportunity type classification (near-p1, ctr-leak, content-depth, affiliate-capture)
- Cannibalization detection
- AIO suspect detection
- Device split analysis
- Query entropy and impression gravity (phase-2 advanced)

### What's NOT being transformed:

1. **Competitor data → actionable gap** — The transformation from HTML metadata to "content gaps" is done by Claude with insufficient data. The gaps produced are generic.

2. **Revenue data → page-level ROI** — No transformation exists because revenue data isn't collected. You can't calculate "this page earned $X per 1,000 impressions."

3. **Reddit data → content decisions** — The published Reddit summaries are used in the RedditInsights component on pages (correct) but NOT fed back into the strategy or content agents as context. If users on r/ergonomics consistently mention a specific concern about a chair, the content agent should know this.

4. **Audit history → trend analysis** — The audit reports go to raw/audits/ but no agent reads multiple historical audits to detect recurring issues or improvement trends. The wiki synthesis pages do this manually but not systematically.

---

## Data Flow Integrity

### Confirmed working:
- gsc-pull.ts → latest.json → gsc-analyze.ts → analysis.json ✅
- analysis.json → strategy.ts (as structured input) ✅
- analysis.json → audit.ts (CTR leak context per page) ✅
- analysis.json → execute-fixes.ts (critical page classification) ✅

### Confirmed broken:
- siteTrend: null in analysis.json ❌ (2 modules inactive)
- deviceIntelligence: null in analysis.json ❌
- pageVelocity: null (only 1 history snapshot) ❌

### Unknown status:
- Whether execute-content.ts passes new page slugs to the wiki correctly (wiki index injection bug noted)
- Whether Reddit data is stale enough to be misleading on review pages

---

## GSC History Assessment

**Only 1 snapshot:** `data/gsc/history/2026-05-10.json`

The history directory was created when gsc-analyze.ts was built. Before that, there was no history tracking. The system correctly retains up to 16 weekly snapshots — but it needs 2+ to enable page velocity.

**The good news:** Once the second Monday's history snapshot is written, velocity tracking activates automatically. No code change needed.

**The concern:** The history snapshots store `opportunities[]` entries (page, position, impressions) for velocity comparison. But this means velocity is computed from the opportunity-scored page set (≥30 impressions, known position). Pages below the impression threshold are invisible to velocity tracking.
