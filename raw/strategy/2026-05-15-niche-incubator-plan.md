# Niche Incubator Plan
**Date:** 2026-05-15  
**Session:** Jackson asked for existing wiki notes on a "niche content generator," whether it should live inside or outside the TCA repo, and how to build a real go / no-go system before launching new sites

---

## Bottom Line

Do **not** start by building a content generator.

Start by building a **niche incubator / validation engine** that can produce one of four outputs:
- **DO NOT BUILD**
- **HOLD / NEEDS MANUAL REVIEW**
- **BUILD INSIDE AN EXISTING SITE**
- **BUILD AS A NEW-SITE MVP**

The generator comes **after** that gate, not before it.

---

## Repo Boundary Decision

This should be a **separate repo / directory adjacent to TCA**, not a new module inside `tall-chair-advisor/`.

Why:
- TCA is a **single live site** with one audience, one voice model, one wiki, one weekly post-launch automation loop
- The incubator is **portfolio-level and pre-launch**
- TCA's core entities are pages, chairs, and GSC rows; the incubator's entities are niches, SERP sets, monetization programs, and launch blueprints
- TCA's weekly cycle starts from GSC and existing rankings; the incubator starts from **seed ideas before a site exists**
- Mixing them will pollute the TCA wiki with non-TCA candidate niches and make the automation harder to reason about

Use the same architecture pattern, but in a different repo:
- raw data layer
- wiki memory layer
- live data / reports layer
- TypeScript scripts

TCA can keep a **reference note** about the incubator, but should not become the incubator's codebase.

---

## What The Product Actually Is

The right product is not "write me niche content."

It is:

1. **Niche intake**
2. **Market validation**
3. **SERP penetrability audit**
4. **Monetization audit**
5. **Format-edge audit**
6. **Verdict engine**
7. **Launch blueprint generator**
8. **Site scaffold generator** only if the verdict passes

That ordering matters. Otherwise you automate the expensive wrong thing.

---

## Required Verdict States

Do not reduce the output to only yes / no.

The system should return:

### 1. DO NOT BUILD
Use when hard disqualifiers are present.

### 2. HOLD / NEEDS MANUAL REVIEW
Use when demand is real but either monetization or penetrability is too uncertain.

### 3. BUILD INSIDE AN EXISTING SITE
Use when the topic is adjacent enough to an existing property that a new domain would be wasteful.

Examples:
- standing desks for tall people
- monitor arms for tall people
- desk height calculators for tall people

### 4. BUILD AS A NEW-SITE MVP
Use when the niche is strong, differentiated, monetizable, and meaningfully separate from the current portfolio.

---

## Hard No-Build Flags

These should override any aggregate score.

Kill or reject the niche if one or more of these are true:

1. **No real monetization path**
   - weak Amazon-only economics
   - no direct affiliate programs
   - no lead-gen path
   - no obvious product adjacency

2. **SERP moat is too strong**
   - top results are dominated by giant brands across the full query set
   - no smaller independent winners appear
   - forums do not break through
   - there is no visible opening in the top 20

3. **No format advantage**
   - the niche can only be served by generic listicles
   - no measurements, calculators, comparisons, databases, original images, or synthesis edge are possible
   - the answer is too compressible by AI overviews

4. **Too little query breadth**
   - one head term exists but there is no real long-tail cluster
   - there is not enough topic depth to support a site rather than a single page

5. **Credibility requirement is mismatched**
   - the niche demands first-hand testing, medical credentials, legal expertise, or local trust that you do not have
   - faking this would destroy the site's defensibility

6. **Regulatory / YMYL risk is too high**
   - health, legal, financial, or safety claims where lightweight affiliate content would be structurally weak

7. **Maintenance burden is too high for the upside**
   - rapidly changing catalog
   - fast price churn
   - heavy compliance needs
   - data freshness requirements that would force near-daily maintenance

---

## Scorecard

Use a weighted scorecard after the hard-no screen.

### A. Demand breadth — 25 points
- search volume across the full cluster
- number of meaningful subtopics
- repeat question density on Reddit/forums
- informational + commercial spread

### B. SERP penetrability — 25 points
- presence of smaller sites ranking
- percentage of editorial vs retailer vs forum vs brand results
- visible weaknesses in current winners
- AI Overview saturation and whether it still cites independents

### C. Monetization depth — 20 points
- affiliate programs available
- EPC / CPC proxy
- average product price
- adjacency products or follow-on offers
- ability to move informational readers into commercial pages

### D. Format edge — 15 points
- can the site provide something structurally better than current winners?
- examples: calculators, fit tables, proprietary categorization, expert synthesis, comparison matrices, first-hand testing, local/fresh data

### E. Expansion potential — 10 points
- can one niche expand into 3-5 adjacent content / offer clusters without diluting topical focus?

### F. Operational fit — 5 points
- content sourcing difficulty
- update burden
- image/data availability
- whether the niche fits your actual expertise or process

### Verdict thresholds

- **0-54** → DO NOT BUILD
- **55-69** → HOLD / REVIEW
- **70+** with strong overlap to an existing property → BUILD INSIDE EXISTING SITE
- **70+** with low overlap and no vetoes → NEW-SITE MVP

Add one more output:
- **confidence score** based on how much of the score came from hard data vs inference

---

## Tool Roles

### DataForSEO — primary data backbone
Use DataForSEO for most of the decision engine:
- keyword discovery
- related keywords
- keywords for site / competitor research
- ranked keywords
- relevant pages
- bulk keyword difficulty
- search intent
- keyword overview
- CPC / volume checks
- AI Optimization APIs later if needed

Reason:
- broader niche-discovery surface than current SerpAPI usage
- already partly integrated in TCA
- better for structured scoring than ad hoc SERP scraping alone

### SerpAPI — live SERP spot checks
Use for:
- current top 10 / top 20 snapshot validation
- AI Overview presence
- screenshots when layout matters
- resolving edge cases where structured data is not enough

Do not use it as the main data warehouse.

### Firecrawl — shortlist only
Use **after** a niche survives the first filter.

Use it to crawl only:
- top editorial winners
- category leaders
- forum threads that reveal pain language

Reason:
- crawling first is wasteful
- SERP selection must come before crawling, same lesson as TCA's competitor-intelligence pipeline

### GitHub
Use for:
- versioning the incubator repo
- storing candidate dossiers and outputs
- eventually creating new site repos from a starter template

### Cloudflare
Use only after pass:
- rapid launch of SEO MVP sites
- cheap preview deploys

It is not part of the pre-build verdict engine.

### LLM layer
Use LLMs for:
- summarizing SERP shape
- classifying format opportunities
- converting raw evidence into a readable dossier
- generating the site blueprint after a pass

Do **not** let the LLM invent the verdict without structured evidence.

---

## Qwen / RunPod Decision

Do not make RunPod a hard dependency in MVP v1.

Better rule:
- Build the incubator with a **provider abstraction**
- Default to the simplest reliable option first
- Only route to Qwen3-32B on RunPod for **read-only analysis / summarization**

If RunPod is used:
- prefer the **24GB tier** for Qwen3-32B-class experiments
- do not pay for 48GB just to run the same 32B AWQ model
- keep Claude or another higher-trust model available as the reference / fallback

Reason:
- the wiki's RunPod research was clear that synthetic token economics are not enough
- the incubator's core leverage is better data and better gating, not just cheaper tokens
- model choice should be swappable without changing the system design

---

## Recommended Repo Structure

```text
niche-incubator/
├── raw/
│   ├── candidates/
│   ├── serp/
│   ├── keywords/
│   ├── monetization/
│   └── strategy/
├── wiki/
│   ├── index.md
│   ├── log.md
│   ├── pages/
│   │   ├── niches/
│   │   ├── concepts/
│   │   └── blueprints/
│   └── synthesis/
├── data/
│   ├── candidates/
│   ├── verdicts/
│   └── templates/
├── reports/
├── scripts/
│   ├── niche-intake.ts
│   ├── niche-discovery.ts
│   ├── niche-serp-audit.ts
│   ├── niche-monetization-audit.ts
│   ├── niche-verdict.ts
│   ├── niche-blueprint.ts
│   └── site-factory.ts
└── templates/
    └── astro-affiliate-starter/
```

---

## MVP Build Order

### Phase 1 — Verdict engine only
Build:
- `niche-intake.ts`
- `niche-discovery.ts`
- `niche-serp-audit.ts`
- `niche-verdict.ts`

Output:
- one dossier per candidate niche
- hard-no flags
- weighted score
- recommended path: reject / hold / existing site / new site

### Phase 2 — Monetization + format edge
Build:
- `niche-monetization-audit.ts`
- targeted Firecrawl extraction
- affiliate / program evidence capture

### Phase 3 — Launch blueprint
Build:
- `niche-blueprint.ts`

Output:
- audience definition
- site thesis
- content graph
- first 10 pages
- monetization map
- author / credibility requirements

### Phase 4 — Site scaffold
Build:
- `site-factory.ts`

Output:
- new repo from template
- env placeholders
- Cloudflare deploy config
- starter wiki / raw structure

---

## First Implementation Move

The first thing to code is **not** the site generator.

The first thing to code is:

1. candidate intake schema
2. deterministic verdict schema
3. DataForSEO-backed discovery
4. SERP penetration audit
5. dossier writer

That gives you a machine that can say **no** with evidence. That is the actual strategic moat.

---

## Relationship To TCA

The incubator can still borrow from TCA:
- TypeScript tooling style
- wiki architecture
- raw/wiki/data separation
- Cloudflare + Astro starter
- some utility code patterns

But TCA should remain a live-site repo, not the parent container for all future niche experiments.

