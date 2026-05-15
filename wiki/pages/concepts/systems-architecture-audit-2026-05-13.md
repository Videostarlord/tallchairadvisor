---
type: concept
name: systems-architecture-audit-2026-05-13
description: Systems-level architecture audit of the TCA autonomous SEO stack. Score 5.5/10. Key finding: sound engineering, wrong data scale. Top gaps: no keyword research, no fix attribution, no prompt caching.
last_updated: 2026-05-13
---

# TCA Autonomous SEO Stack — Systems Architecture Audit (2026-05-13)

Raw snapshot: `raw/audits/2026-05-13-systems-architecture-audit.md`

---

## Overall Score: 5.5/10

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Code quality / engineering rigor | 8/10 | Cache architectures, enforcement logic, wiki memory, AIO pipeline all well-built |
| Strategic intelligence | 4/10 | Can't discover new territory, no attribution, no competitive difficulty model |
| Business viability | 3/10 | ~$20-60/month API cost vs. cents/week in revenue |

---

## Core Problem

**Mismatch between system sophistication and data scale.** 7 clicks/week, 3,231 weekly impressions. Entropy analysis, gravity scoring, velocity signals, and per-query CTR curves are statistically meaningless at this volume. The system runs Formula 1 telemetry on a go-kart.

---

## Critical Blindspots

### 1. No Upstream Keyword Research (Existential)
The entire pipeline is GSC-backward — it only analyzes queries where TCA already has impressions. There is no mechanism to find keyword opportunities where TCA has zero presence. Content topics are bounded by existing impressions. This is the primary blocker to growing from 7 → 700 clicks/week.

**Fix:** DataForSEO or Ahrefs API → `data/keywords/opportunities.json` → feed top 20 unranked, buyer-intent keywords to content agent each week.

### 2. No Fix Attribution (Existential)
No record of "this change applied on this date → here is the before/after on this metric." The system cannot learn whether its interventions work. Strategy agent makes the same type of plan week over week.

**Fix:** `data/interventions/log.json` (append-only). Audit agent compares current metrics against log to assess outcomes.

### 3. Manual Priority Queue Invisible to Automation
The highest-priority unwritten content (shoulder-pain, standing-desk-height) is in CLAUDE.md but has zero GSC impressions, so the strategy agent never surfaces it. The automation is blind to Jackson's curated priorities.

**Fix:** `data/content-roadmap.json` with the top 10 unwritten topics. Strategy agent pulls 1-2 per week regardless of GSC signal.

---

## Severity-Ranked Weaknesses

| # | Severity | Issue |
|---|----------|-------|
| 1 | Existential | No keyword discovery pipeline |
| 2 | Existential | Statistical signals are noise at current traffic |
| 3 | Strategic | No content refresh / decay-based triggers |
| 4 | Strategic | Internal linking tracked conceptually, not implemented |
| 5 | Strategic | Strategy agent plans from unstable signals (LLM confabulation risk) |
| 6 | Operational | No DAG dependency enforcement between days — stale state risk |
| 7 | Operational | Git used as event bus — bad wiki write can break deploy |
| 8 | Operational | AIO capsule injection fails on component-rendered headings (3 live) |
| 9 | Operational | Voice constraint regex misses non-anchor-keyword violations |
| 10 | Operational | Quality gate (80/100) measures structure, not competitive depth |

---

## Cost / Token Issues

**Estimated cost: $20-60/month.** No prompt caching used anywhere in the codebase.

- `strategy.ts` injects ~8,000 chars of stable wiki context on every call — should be cached
- `execute-fixes.ts` sends full file content for complex fixes
- `competitor-intelligence.ts` re-sends cached competitor content each run

**Fix:** Add `cache_control: {"type": "ephemeral"}` to system prompts and wiki context. Estimated 40% cost reduction. See [[runpod-migration-proposal]] for broader cost research.

---

## Over-Engineered (can simplify)

- Query entropy analysis — meaningless at <15 impressions/cluster
- Impression gravity / hub detection — hubCandidate: false every week at current scale
- 4-layer confidence filter for competitor gap injection
- Multi-layer query clustering for 8 pages/month

---

## Under-Engineered (needs building)

- Keyword research pipeline (absent entirely)
- Affiliate conversion tracking (absent)
- Competitive difficulty modeling (absent)
- Content aging / decay-based refresh triggers (absent)
- Cross-page internal link audit and rebuild (absent)
- Niche expansion logic (absent)
- API cost tracking per run (absent)
- Fix attribution (absent)
- Mobile-specific fix pipeline (detected but not acted on)

---

## Recommended Priorities

1. **Upstream keyword research** — DataForSEO/Ahrefs → `data/keywords/opportunities.json`
2. **Fix attribution tracker** — `data/interventions/log.json`, audit agent reads it
3. **Niche expansion topic injection** — `data/content-roadmap.json` visible to strategy agent
4. **Prompt caching** — strategy.ts + execute-fixes.ts system prompts
5. **Decouple data commits from code commits** — prevent wiki write from triggering bad deploy

---

## Scalability Ceilings

| Component | Current | Ceiling |
|-----------|---------|---------|
| Wiki context injection | ~40 pages | ~80 pages before token overflow |
| Competitor intelligence | 8 pages × 3 queries | ~30 pages before Firecrawl budget hit |
| GSC index monitor | ~20 pages, ~20s | ~100 pages hits daily API quota |
| Content generation | variable | 4+ pages/week, no budget tracking |

---

## Sustainability Risks

1. **API cost exceeds affiliate revenue** for 6+ months → economically unsustainable
2. **AIO expansion** continues suppressing CTR on review/comparison queries
3. **Single-author E-E-A-T ceiling** — Jackson can only first-person review chairs he's bought

---

## Related Pages

- [[workflow-system-reference]] — current operational setup
- [[gsc-intelligence-system]] — GSC pipeline architecture
- [[gsc-performance]] — current traffic numbers
- [[affiliate-compliance]] — conversion gaps
- [[thesis]] — strategic priorities
- [[decisions-log]] — action log
