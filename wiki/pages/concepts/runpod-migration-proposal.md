---
type: concept
last_updated: 2026-05-11
status: BACKLOG — soft rejected for TCA automation
sources: [raw/strategy/2026-05-10-runpod-migration-proposal.md]
tags: [infrastructure, automation, llm, cost, runpod, local-models]
---

# RunPod + Local Model Migration — Proposal Review

**Status: 🔴 BACKLOG / SOFT REJECTED for TCA.** Do not implement a broad RunPod migration in the Tall Chair Advisor automation stack. The raw proposal remains useful as historical research, but it is no longer the recommended near-term path.

Full research document: `raw/strategy/2026-05-10-runpod-migration-proposal.md`

---

## 2026-05-11 Decision Update

### Final call

The proposal is moved from "under consideration" to **backlog / soft reject**.

### Why it was deferred

1. **The same-model GPU benchmark did not justify the bigger tier.** Qwen3-32B-AWQ on 48GB was only about 7-19% faster than 24GB, while costing about 50-67% more per call. That makes 48GB the wrong cost tier for the current 32B AWQ experiment.

2. **The benchmark was synthetic, not TCA-shaped.** The current RunPod benchmark harness measures token throughput and cost using generic filler-text prompts. That is useful for infrastructure sizing, but it does not prove that an open model can safely replace Claude on `audit.ts`, `strategy.ts`, `execute-fixes.ts`, `index-monitor.ts`, or `execute-content.ts`.

3. **Claude Batch is now the better next step to investigate.** Batch preserves the existing Anthropic integration and model quality while reducing cost by 50% for non-urgent jobs. That is a much simpler experiment than adding a second inference provider, model-hosting layer, retries, fallback logic, and quality benchmarking across all agents.

4. **TCA has several output-heavy or write-capable agents.** RunPod only looked attractive on very input-heavy, concise-output workloads. TCA includes multiple large-output jobs and source-writing agents where cheap GPU time does not matter if quality or reliability drops.

### What this means operationally

- **Do not migrate the stack broadly to RunPod.**
- **Research Anthropic Batch first** for read-only, non-urgent jobs like Tuesday/Wednesday analysis and monthly intelligence work.
- **If RunPod is revisited later**, limit it to read-only, long-context, concise-output experiments after running real TCA prompt packs in shadow mode.

---

## Original Proposal Context

1. The automated weekly workflow (Mon–Sat GitHub Actions) misses a class of technical SEO issues that only surfaced when a manual `/seo-audit` run was triggered on 2026-05-09. The gap: the automated `audit.ts` makes one Claude call on top-20 GSC pages. The manual audit spawns 6 specialist subagents covering robots.txt, security headers, sitemap, schema validation, Core Web Vitals, and mobile rendering.

2. The Claude API spend is higher than originally estimated: **$85–136/year** across the full weekly cycle (not "a few cents per run") once execute-fixes.ts (3 calls/fix × 3–5 fixes/week) and execute-content.ts (2 calls/page) are accounted for.

---

## Proposed Approach (Historical)

Replace Anthropic API calls in intelligence and fix-execution agents with open-source reasoning models served via **RunPod serverless GPU endpoints**. Retain Claude API only for execute-content.ts (Astro page writing) where output quality matters most.

The API integration change is minimal — RunPod vLLM serves an OpenAI-compatible endpoint, so only the base URL and model name change in each agent script.

---

## Key Cost Data (Historical)

### RunPod pricing (per hour)

| Tier | VRAM | $/hr | $/year at 1hr/wk |
|---|---|---|---|
| 16GB Medium | 16GB | $0.58 | $29.95 |
| 24GB High | 24GB | **$0.68** | **$35.57** |
| 48GB PRO | 48GB | $1.91 | $99.22 |
| 80GB | 80GB | $2.74 | $142.27 |
| 141GB | 141GB | $5.58 | $290.16 |

### vs. Current Claude API spend

| Scenario | Annual cost |
|---|---|
| Current (all Claude API) | $85–136/yr |
| RunPod 24GB + Claude for content only | ~$36–55/yr |
| Full RunPod 24GB migration | ~$36/yr |

**Important correction after review:** the real production comparison is **Anthropic Batch**, not only standard API pricing. Batch is simpler to integrate and materially narrows or eliminates the savings on many TCA-shaped jobs.

---

## Best Candidate Models (HuggingFace, Historical Research)

Models verified as available on HuggingFace with benchmark scores exceeding or matching Claude Sonnet 4 (GPQA Diamond baseline: 75.4%):

| Model | HF ID | GPQA Diamond | vs. Sonnet | GPU Tier | $/yr |
|---|---|---|---|---|---|
| Gemma 4 31B | `google/gemma-4-31B-it` | **84.3%** | ✅ +8.9pt | 24GB | $35.57 |
| Gemma 4 26B-A4B | `google/gemma-4-26B-A4B-it` | **82.3%** | ✅ +6.9pt | 24GB | $35.57 |
| Qwen3-235B-A22B | `Qwen/Qwen3-235B-A22B` | **84.0%** | ✅ +8.6pt | 141GB | $290.16 |
| Qwen3-72B | `Qwen/Qwen3-72B` | ~75%* | ⚡ ~parity | 48GB PRO | $99.22 |
| QwQ-32B | `Qwen/QwQ-32B` | 62.1% | ⚡ −13.3pt | 24GB | $35.57 |
| DeepSeek-R1-Distill-32B | `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B` | ~62% | ⚡ −13.3pt | 24GB | $35.57 |

**Original "sweet spot" claim is not approved.** Benchmark and architecture review were not sufficient to justify a production migration on benchmark scores alone.

*Kimi K2 series and DeepSeek-R1 full are not single-GPU viable (require 370–550GB VRAM).*

---

## New Capabilities Unlocked (Potential, Not Approved)

If implemented, cheap inference unlocks:

1. **GSC query clustering via embeddings** — cluster all GSC queries into topic groups using a free embedding model; reveals topic gaps vs. individual query CTR issues
2. **Semantic competitor analysis** — embed your pages and 20–30 competitor pages, find genuine content gaps at the semantic level (currently competitor-monitor is structural metadata only)
3. **Full-site quality matrix** — score all ~50 pages monthly, not just top-20 by impressions
4. **Reddit automation reconnected** — run reddit:all weekly, feed community signal to strategy agent (currently stale 7 weeks)
5. **Content brief pre-generation** — generate pre-researched briefs before Friday's content agent runs; better briefs → better output

---

## What Should NOT Be Migrated

- **execute-content.ts** (Astro page writing) — content quality gap vs. Claude is most visible and highest risk
- Agents that re-analyze the same data as another agent (amplifies errors, not signal)
- High-frequency strategy generation without new data inputs

---

## Open Questions If This Ever Returns From Backlog

1. Does Gemma 4 31B produce acceptable output for TCA voice on non-Gesture pages?
2. What are actual token counts per agent run? (validate cost baseline from API logs)
3. Does RunPod's vLLM template support Gemma 4 31B architecture? (new model, April 2026)
4. Is 1hr/week pod cadence sufficient, or do execution agents also need local model access?
5. What GPU SKU is RunPod's 24GB tier? (affects memory bandwidth and tok/s estimates)

---

## Current Recommendation

1. Investigate **Anthropic Batch pricing and constraints** for `audit.ts`, `strategy.ts`, `competitor-intelligence.ts`, and any other non-urgent read-only jobs.
2. Keep **Claude Sonnet / Haiku** on all write-capable or quality-sensitive agents unless a future shadow test proves otherwise.
3. Treat RunPod as a **separate experimentation track**, not a current TCA architecture project.

## Fix History

*2026-05-11: proposal status changed from UNDER CONSIDERATION to BACKLOG / soft rejected for TCA automation. Raw research document preserved as historical context.*
