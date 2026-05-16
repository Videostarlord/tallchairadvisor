---
type: concept
last_updated: 2026-05-15
sources: [raw/strategy/2026-05-15-niche-incubator-plan.md, raw/strategy/2026-05-11-niche-validation-evaluation.md, wiki/pages/concepts/dataforseo-reference.md, wiki/pages/concepts/runpod-migration-proposal.md]
tags: [niche-validation, portfolio, automation, incubator, site-generation]
---

# Niche Incubator System

Reference page for the adjacent project that evaluates candidate niches **before** a new site is launched.

## Core Decision

This should be a **separate repo / directory adjacent to TCA**, not another subsystem inside `tall-chair-advisor/`.

Why:
- TCA is a single-site, post-launch automation stack
- the incubator is multi-niche, pre-launch, and portfolio-level
- the entity model is different: niches, SERPs, monetization programs, and site blueprints instead of pages, chairs, and GSC rows

## Product Definition

Do not start with a content generator.

Start with a **verdict engine** that can return:
- **DO NOT BUILD**
- **HOLD / NEEDS REVIEW**
- **BUILD INSIDE AN EXISTING SITE**
- **BUILD AS A NEW-SITE MVP**

The site/content generator is phase 2, not phase 1.

## Hard No-Build Rules

Reject a niche when one or more of these are true:
- no real monetization path
- SERP moat is too strong and smaller winners never appear
- no format advantage beyond generic listicles
- too little long-tail breadth for a real site
- credibility requirements do not match Jackson's actual expertise or operating model
- regulatory / YMYL risk is too high
- maintenance burden is too high for the upside

## Scorecard

Use a weighted score after hard-no flags:
- demand breadth — 25
- SERP penetrability — 25
- monetization depth — 20
- format edge — 15
- expansion potential — 10
- operational fit — 5

Thresholds:
- **0-54** → do not build
- **55-69** → hold / manual review
- **70+** with high overlap to an existing site → build inside existing site
- **70+** with low overlap and no vetoes → new-site MVP

## Tool Strategy

### DataForSEO
Primary research layer for:
- keyword discovery
- ranked keywords
- search intent
- keyword difficulty
- relevant pages
- CPC / volume validation

### SerpAPI
Use for live SERP checks:
- top-10/top-20 snapshots
- AI Overview presence
- screenshots when layout matters

### Firecrawl
Use only after the niche survives first-pass filtering.

SERP selection must come before crawling. Same lesson as TCA's competitor-intelligence pipeline.

### LLMs
Use for:
- SERP-shape summaries
- format-edge classification
- dossier writing
- launch blueprint generation

Do not let the LLM freehand the verdict without structured evidence.

## RunPod / Qwen Position

Do not make RunPod mandatory in v1.

If used at all:
- use provider abstraction
- prefer Qwen3-32B only for read-only summarization or clustering
- prefer 24GB economics for 32B-class experiments
- keep a higher-trust fallback model for shadow testing

This follows the current TCA conclusion that model-cost research alone is not a sufficient reason to redesign the stack.

## Build Order

1. Verdict engine
2. Monetization + format-edge audit
3. Launch blueprint generator
4. Site scaffold generator

The system must get good at saying **no** before it gets good at generating sites.

## Related Pages

- [[niche-validation-framework]]
- [[dataforseo-reference]]
- [[workflow-system-reference]]
- [[runpod-migration-proposal]]
- [[system-setup-guide]]

