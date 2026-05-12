---
type: concept
last_updated: 2026-05-11
sources: [raw/strategy/2026-05-11-ctr-revenue-analysis.md]
tags: [geo, aio, automation, ctr, build-plan]
---

# geo-optimize.ts — Build Plan

**Status: INTEGRATED — runs inside `competitor-intelligence.ts` v2.1**  
**Output: `reports/geo-optimize-tasks.md` + `data/competitors/intelligence.json` (`aioTasks` field)**  
**Priority: #1 CTR fix (implemented)**

---

## Why This Exists

TCA's dominant CTR problem is AI Overview suppression. Pages ranking pos 5–15 with >30 impressions and <0.3% CTR are invisible to users because Google answers the query inline before showing organic results. Meta rewrites cannot fix this. The only path to clicks on these queries is getting cited *inside* the AI Overview.

This script detects suppressed pages, reverse-engineers what citation format the AI Overview uses, and rewrites the relevant page section to match that format.

---

## Detection Signature (AIO-Suppressed Page)

All of these must be true:
- Position 5–15 (ranked but not top-3)
- Impressions >30 in 90-day window
- CTR <0.3%
- Query type: spec/informational (not navigational/branded)

Confirmed AIO-suppressed right now:
- `/chairs/steelcase-gesture/seat-depth/` — pos 4.1, 23 impr, 0 CTR on "steelcase gesture seat depth range inches"
- `/chairs/herman-miller-aeron/tall-people/` — pos 7.4, passage-anchor sentences missing (flagged in gsc-intelligence)
- Any query where TCA ranks pos 5–15 and CTR < expected curve by >80%

---

## Integration Note

This was integrated into `competitor-intelligence.ts` (v2.1) rather than built as a standalone script. `fetchSerp()` now parses `data.ai_overview` from the existing SerpAPI response (zero extra credits). AIO capsule generation runs for the primary query of each page when TCA is not cited. Output writes to `reports/geo-optimize-tasks.md` and `data/competitors/intelligence.json` (`aioTasks[]`).

---

## Script Architecture (Reference — now runs inside competitor-intelligence.ts)

```
geo-optimize.ts
├── detectAIOCandidates()
│   └── Reads data/gsc/analysis.json → filters for AIO suppression pattern
│       Returns: [{page, topQuery, impressions, position, ctr}]
│
├── fetchAIOContent(query)  [SerpAPI]
│   └── Queries SerpAPI with 'gl=us&hl=en&num=10'
│       Parses ai_overview block from response
│       Extracts: cited URLs, citation passage text, passage word count, format (list/table/prose)
│       Returns: {hasAIO: bool, citedUrls: string[], passageFormat: string, samplePassage: string}
│
├── fetchTCAPageSection(page, query)  [Firecrawl or local src read]
│   └── Reads current .astro source for the target page
│       Extracts the section most relevant to the query (heading match)
│       Returns: {sectionHeading, sectionText, hasCitationCapsule: bool}
│
├── generateCitationFix(page, query, aioData, currentSection)  [Claude Sonnet]
│   └── Prompt: "The AI Overview on [query] cited [samplePassage format].
│               TCA's current section is [currentSection].
│               Write a 40-60 word standalone citation capsule in the same format.
│               It must include: specific measurement numbers, height context (6'3"+),
│               and be self-contained (readable without surrounding context)."
│       Returns: {citationCapsule: string, insertAfterHeading: string}
│
└── outputFixTasks()
    └── Writes structured fix objects to reports/geo-optimize-tasks.md
        Format matches what execute-fixes.ts can consume
        Each task: page path, section to update, new citation capsule text
```

---

## Integration with Existing Pipeline

**Option A — Standalone monthly run:**
- Add to `package.json`: `"geo:optimize": "npx tsx scripts/geo-optimize.ts"`
- Run manually once/month after Monday GSC pull
- Review `reports/geo-optimize-tasks.md`, then trigger execute-fixes.ts manually

**Option B — Integrate into Monday workflow:**
- Add as step 5 in `monday.yml` after competitor-intelligence.ts
- Writes tasks to `reports/geo-optimize-tasks.md`
- Wednesday strategy.ts reads this file and incorporates into weekly plan
- Thursday execute-fixes.ts applies the fixes

Option A is lower risk to start — manually reviewable before fixes apply.

---

## Cost Estimate

| Resource | Per run | Monthly (4 runs/mo) |
|----------|---------|---------------------|
| SerpAPI | ~5–10 credits (1 query × 5–8 pages) | 20–40 credits (8–16% of 250/mo quota) |
| Firecrawl | 0 credits (reads local src files instead of crawling) | $0 |
| Claude API | ~$0.10–0.30 per run (Sonnet, 5–8 pages) | $0.40–1.20/mo |
| **Total** | | **<$2/month** |

Note: Use local `fs.readFileSync` on src/pages/ instead of Firecrawl to avoid burning crawl credits. The source files are the ground truth anyway.

---

## Output Format

`reports/geo-optimize-tasks.md` — consumed by execute-fixes.ts or reviewed manually:

```markdown
## GEO Optimize Tasks — 2026-05-11

### /chairs/steelcase-gesture/seat-depth/
- Query: "steelcase gesture seat depth range inches"
- AIO format: prose, 52 words, cited thehumansolution.com
- Current section: "Seat Depth" — no standalone capsule
- Insert after: "## Seat Depth Adjustment"
- Citation capsule:
  > The Steelcase Gesture offers a seat depth range of 15.5"–18.5", adjustable via a front-tilt lever.
  > For users 6'3" and taller (thigh length typically 23"–26"), setting depth to 17"–18" prevents
  > pressure behind the knee while maintaining lumbar contact.

### /chairs/herman-miller-aeron/tall-people/
...
```

---

## Success Criteria

A page is "fixed" when:
1. Citation capsule is present and ≥40 words
2. Capsule is self-contained (readable without context)
3. Capsule includes specific numbers + height context
4. Format matches the AIO citation style detected for that query

**Measurement:** 28-day post-fix window. Check if impressions stay flat while CTR lifts (AIO citation = new entry point, not ranking change). If AIO starts citing TCA, CTR on AIO-adjacent position rises.

---

## Related

- [[ctr-optimization]] — full CTR diagnosis, this script addresses Cause A
- [[ai-citation-readiness]] — GEO score 76/100, citation capsules are missing site-wide
- [[gsc-intelligence-system]] — analysis.json schema, AIO candidate detection uses this
- [[workflow-system-reference]] — integration point: monday.yml step 5 (Option B)
