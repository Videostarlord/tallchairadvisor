# RunPod + Local Model Migration Proposal
**Date:** 2026-05-10
**Status:** 🟡 UNDER CONSIDERATION — not approved, not implemented
**Author:** Research conversation with Claude Sonnet 4.6
**Purpose:** Evaluate replacing Anthropic API calls in the TCA automation workflow with self-hosted open-source models on RunPod serverless GPUs

---

## 1. Problem Statement

### 1a. Manual SEO audit revealed automation gaps

A manual `/seo-audit` run on 2026-05-09 produced a multi-specialist audit report (COMBINED_2026-05-09_MASTER_AUDIT.md) catching issues the automated weekly workflow had never flagged:

- Relative canonical on author page (`/about/` — invalid relative URL)
- URL canonical pollution (slash vs. no-slash variants splitting impressions in GSC)
- Security headers missing (HSTS, CSP, X-Frame-Options)
- robots.txt not audited automatically
- Sitemap cross-referenced against live pages
- Voice constraint regex too narrow (misses natural first-person phrasing)
- Reddit data stale (~7 weeks) and disconnected from strategy agent
- Schema validation only checks presence, not structural correctness

The gap: the automated `audit.ts` fetches meta tags for top-20 GSC pages and makes one Claude call. The manual `/seo-audit` skill spawns 6 specialist subagents (technical, content, schema, sitemap, performance, visual), each making multiple LLM calls.

### 1b. Current Claude API spend is higher than originally estimated

Mapping Claude API calls across the full weekly cycle:

| Day | Agent | Claude calls/run | Est. cost |
|---|---|---|---|
| Monday | competitor-monitor | 1 | ~$0.04 |
| Monday | index-monitor | 1 | ~$0.06 |
| Monday | gsc-analyze | 1 | ~$0.05 |
| Tuesday | audit | 1 | ~$0.06 |
| Wednesday | strategy | 1 (large context) | ~$0.15 |
| Thursday | execute-fixes | **3 per fix × 3–5 fixes** | ~$0.72–1.20 |
| Friday | execute-content | **2 per page × 1–2 pages** | ~$0.50–1.00 |
| Saturday | verify-deploy | 1 | ~$0.05 |

**Total: ~$1.63–2.61/week → $85–136/year**

This is the actual baseline. The initial estimate of "a few cents per run" was wrong because execute-fixes.ts makes 3 Claude calls per fix and execute-content.ts makes 2 calls per page.

---

## 2. Proposed Solution

Replace Anthropic API calls in the intelligence and execution pipeline with open-source reasoning models served via RunPod serverless GPU endpoints, while retaining Claude API only for the highest-quality-sensitivity task (content generation in execute-content.ts on Fridays).

### 2a. How RunPod serverless works

RunPod serverless functions like AWS Lambda but for GPU inference:
- Worker spins up on demand when a job is submitted
- vLLM or Ollama serves the model via an OpenAI-compatible REST API
- You pay per second of active compute time
- Worker shuts down after idle period (~5 minutes)
- No charge when idle

Integration with existing scripts requires changing only the API base URL and model name:

```typescript
// Before
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// After — OpenAI-compatible endpoint, same message format
import OpenAI from 'openai';
const client = new OpenAI({
  baseURL: process.env.RUNPOD_ENDPOINT,
  apiKey: process.env.RUNPOD_API_KEY,
});
```

### 2b. Cold start behavior

Cold start time depends on model weight storage strategy:

| Strategy | Cold start | Additional cost | Notes |
|---|---|---|---|
| Fresh HuggingFace download each run | 200–600s | None (no storage) | Practical for weekly jobs |
| Network volume (pre-cached weights) | 60–120s | $0.07–0.10/GB/month | Better for daily or higher frequency |
| Warm worker (recent invocation) | 5–10s | None | Worker still alive |

**Key point:** For weekly jobs, the worker is always cold. Fresh HuggingFace download is cheaper than a network volume for weekly-or-less frequency because the storage cost ($1.40–$16.80/year for 20–40GB models) exceeds the time savings at that cadence.

### 2c. Triggering from GitHub Actions

Existing GitHub Actions cron workflows call RunPod's REST API instead of Anthropic's:

```yaml
# No structural change to .github/workflows/*.yml needed
# Only the script's API client changes
- name: Run audit agent
  run: npx tsx scripts/agents/audit.ts
  env:
    RUNPOD_ENDPOINT: ${{ secrets.RUNPOD_ENDPOINT }}
    RUNPOD_API_KEY: ${{ secrets.RUNPOD_API_KEY }}
```

---

## 3. Assumptions

The following assumptions were made in this analysis. Each should be verified before proceeding:

1. **vLLM on RunPod serves an OpenAI-compatible API** — this is standard for current vLLM deployments and well-documented, but the specific RunPod worker template should be verified.

2. **Inference speed estimates are approximate** — the tok/s figures used (25–35 tok/s for 32B Q4 on a 24GB GPU) are community benchmarks from RTX 3090/4090-class hardware. RunPod's actual GPU SKUs may differ.

3. **Fresh HuggingFace download time** — estimated at 200s for 20GB models at 100MB/s average. Actual download speed varies by RunPod region and HuggingFace CDN load. Could be 100s or 600s.

4. **Model quality estimates marked \*** — Qwen3-32B and Qwen3-72B instruct-model benchmark scores are not published in primary text form (they appear as images in the tech report). These were estimated from architectural similarity to QwQ-32B and the R1 distill series.

5. **Claude API cost baseline** — calculated from token estimates: 5,000 input + 1,500 output per audit call. Actual token counts should be measured from real API logs to validate.

6. **Annual cost projection** — uses 1 hr/week (52 runs/year) as the unit. The TCA workflow does not run exactly 1 hour per week; the actual active compute time per workflow run is ~15–45 minutes depending on number of fixes and content pages.

7. **Content generation quality** — assumed that execute-content.ts (Astro page writing) requires Claude-level quality and should NOT be migrated to local models. This is a judgment call; Qwen3-32B in thinking mode may be adequate, but the risk of degraded content quality is considered higher than the cost savings justify.

8. **Kimi and DeepSeek-R1 full models are impractical for single GPU** — 1T and 671–685B parameter models require 370–550GB VRAM at Q4 quantization. This exceeds even the 180GB PRO tier. Multi-GPU RunPod pods have different pricing not covered in this analysis.

---

## 4. RunPod Serverless GPU Pricing

All prices as of 2026-05-10.

| Tier | VRAM | Supply | $/second | **$/hour** | $/week (1hr) | $/year (52 wks) |
|---|---|---|---|---|---|---|
| 16GB Medium | 16GB | Medium | $0.00016 | **$0.576** | $0.58 | $29.95 |
| 24GB High | 24GB | High | $0.00019 | **$0.684** | $0.68 | $35.57 |
| 24GB PRO | 24GB | High | $0.00031 | **$1.116** | $1.12 | $58.03 |
| 32GB PRO | 32GB | High | $0.00044 | **$1.584** | $1.58 | $82.37 |
| 48GB PRO | 48GB | High | $0.00053 | **$1.908** | $1.91 | $99.22 |
| 80GB | 80GB | Low | $0.00076 | **$2.736** | $2.74 | $142.27 |
| 80GB PRO | 80GB | Medium | $0.00116 | **$4.176** | $4.18 | $217.15 |
| 96GB PRO | 96GB | High | $0.00111 | **$3.996** | $4.00 | $207.79 |
| 141GB | 141GB | Low | $0.00155 | **$5.580** | $5.58 | $290.16 |
| 180GB PRO | 180GB | Low | $0.00240 | **$8.640** | $8.64 | $449.28 |

**Supply level matters:** Low supply tiers can have cold start delays of 5–15 minutes while waiting for a worker to become available. High supply tiers spin up within seconds. For automated workflows, prefer High or Medium supply tiers.

---

## 5. VRAM Requirements by Model Size

### Quantization reference

| Quantization | Bytes/param | 14B model | 32B model | 72B model | 235B MoE | 671B MoE |
|---|---|---|---|---|---|---|
| Q4_K_M | ~0.55 | ~8GB | ~18GB | ~40GB | ~129GB | ~369GB |
| Q8_0 | ~1.1 | ~15GB | ~35GB | ~79GB | ~259GB | ~738GB |
| BF16 (full) | ~2.0 | ~28GB | ~64GB | ~144GB | ~470GB | ~1,342GB |

**MoE critical note:** For MoE models (Gemma 4 26B-A4B, Qwen3-235B-A22B, DeepSeek-R1, Kimi K2), VRAM is determined by **total parameters**, not active parameters. A 235B-total/22B-active MoE model needs ~129GB VRAM at Q4 even though only 22B params run per inference step.

---

## 6. Open-Source Model Research

### Claude Sonnet 4 benchmark baseline

| Benchmark | Score | Notes |
|---|---|---|
| GPQA Diamond | 75.4% | Third-party evaluation |
| AIME 2024 | 70.5% | Anthropic announcement |
| MMLU-Pro | ~85.4% | DataCamp / Anthropic |

Source: DataCamp, Anthropic announcement page, llm-stats.com

---

### Tier 1 — Exceeds Claude Sonnet 4 (GPQA > 75.4%)

| Model | Provider | HF Model ID | Params (Total / Active) | Arch | GPQA Diamond | AIME 2024 | MMLU-Pro | vs. Sonnet |
|---|---|---|---|---|---|---|---|---|
| Gemma 4 31B | Google | `google/gemma-4-31B-it` | 31B / 31B | Dense | **84.3%** | 89.2%† | **85.2%** | ✅ +8.9pt GPQA |
| Gemma 4 26B-A4B | Google | `google/gemma-4-26B-A4B-it` | 26B / 4B | MoE | **82.3%** | 88.3%† | 82.6% | ✅ +6.9pt GPQA |
| Qwen3-235B-A22B | Qwen/Alibaba | `Qwen/Qwen3-235B-A22B` | 235B / 22B | MoE | **84.0%** | **85.7%** | 84.4% | ✅ +8.6pt GPQA |
| DeepSeek-R1-0528 | DeepSeek | `deepseek-ai/DeepSeek-R1-0528` | 685B / ~37B | MoE | **81.0%** | **91.4%** | **85.0%** | ✅ +5.6pt GPQA |
| Kimi K2-Thinking | Moonshot AI | `moonshotai/Kimi-K2-Thinking` | 1T / 32B | MoE | **84.5%** | N/A (AIME25: 94.5%) | 84.6% | ✅ +9.1pt GPQA |
| Kimi K2.5 | Moonshot AI | `moonshotai/Kimi-K2.5` | 1T / 32B | MoE | **87.6%** | N/A (AIME25: 96.1%) | 87.1% | ✅ +12.2pt GPQA |
| Kimi K2.6 | Moonshot AI | `moonshotai/Kimi-K2.6` | ~1T / ~32B | MoE | **90.5%**‡ | — | — | ✅ +15.1pt GPQA |

**† Gemma 4 AIME scores are AIME 2026, not AIME 2024.** These are different exams. GPQA Diamond scores are comparable across all models.

**‡ Kimi K2.6 GPQA** sourced from llm-stats.com live leaderboard, not primary model card. Treat as indicative.

**⚠️ Kimi K2 family and DeepSeek-R1-0528 require 370–550GB VRAM at Q4 — not runnable on any single RunPod GPU tier.**

---

### Tier 2 — Matches / Close to Claude Sonnet 4 (GPQA 60–75%)

| Model | Provider | HF Model ID | Params (Total / Active) | Arch | GPQA Diamond | AIME 2024 | MMLU-Pro | vs. Sonnet |
|---|---|---|---|---|---|---|---|---|
| DeepSeek-R1 (original) | DeepSeek | `deepseek-ai/DeepSeek-R1` | 671B / 37B | MoE | **71.5%** | **79.8%** | 84.0% | ⚡ −3.9pt GPQA |
| DeepSeek-V3-0324 | DeepSeek | `deepseek-ai/DeepSeek-V3-0324` | 671B / 37B | MoE | **68.4%** | 59.4% | ~75.9% | ⚡ −7.0pt GPQA |
| Qwen3-72B | Qwen/Alibaba | `Qwen/Qwen3-72B` | 72B / 72B | Dense | ~75%* | ~82%* | — | ⚡ ~parity |
| QwQ-32B | Qwen/Alibaba | `Qwen/QwQ-32B` | 32B / 32B | Dense | **62.1%** | **72.6%** | ~88.2 (MMLU-Redux) | ⚡ −13.3pt GPQA |
| Qwen3-32B | Qwen/Alibaba | `Qwen/Qwen3-32B` | 32.8B / 32.8B | Dense | ~62–68%* | ~72%* | 65.54 (base) | ⚡ similar to QwQ |
| DS-R1-Distill-Qwen-32B | DeepSeek | `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B` | 32B / 32B | Dense | ~62% | 72.6% | — | ⚡ −13.3pt GPQA |
| DS-R1-Distill-Llama-70B | DeepSeek | `deepseek-ai/DeepSeek-R1-Distill-Llama-70B` | 70B / 70B | Dense | ~65–68%* | ~75%* | — | ⚡ close |

**\* Scores estimated** — primary source benchmark tables are embedded as images in tech reports and not accessible as text. Treat as approximate.

**⚠️ DeepSeek-R1 (original) and V3-0324 are 671B MoE models requiring ~369GB VRAM at Q4 — not single-GPU viable.**

---

### Tier 3 — Capable but Below Sonnet (GPQA < 60%)

| Model | Provider | HF Model ID | Params | Arch | GPQA Diamond | AIME 2024 | MMLU-Pro | vs. Sonnet |
|---|---|---|---|---|---|---|---|---|
| Phi-4 | Microsoft | `microsoft/phi-4` | 14B | Dense | 56.1% | N/A | ~84.8 (MMLU) | ⚠️ −19.3pt |
| Llama 3.3 70B | Meta | `meta-llama/Llama-3.3-70B-Instruct` | 70B | Dense | 50.5% | N/A | 68.9% | ⚠️ −24.9pt |
| Llama 3.1 405B | Meta | `meta-llama/Llama-3.1-405B-Instruct` | 405B | Dense | 50.7% | N/A | 73.4% | ⚠️ −24.7pt |
| Mistral Small 3.1 24B | Mistral | `mistralai/Mistral-Small-3.1-24B-Instruct-2503` | 24B | Dense | 45.9% | N/A | 66.8% | ⚠️ −29.5pt |

---

### GPU Tier Mapping — Which Model Fits Where

| Model | Best Quant | VRAM Req | Minimum GPU Tier | $/hr | $/year (1hr/wk) | Single GPU? |
|---|---|---|---|---|---|---|
| Phi-4 (14B) | Q4_K_M | ~8GB | **16GB** | $0.58 | $29.95 | ✅ |
| Mistral Small 3.1 (24B) | Q4_K_M | ~13GB | **16GB** | $0.58 | $29.95 | ✅ |
| Gemma 4 26B-A4B | Q4_K_M | ~15GB | **24GB** | $0.68 | $35.57 | ✅ ⭐ fast (4B active) |
| Gemma 4 31B | Q4_K_M | ~18GB | **24GB** | $0.68 | $35.57 | ✅ |
| QwQ-32B | Q4_K_M | ~18GB | **24GB** | $0.68 | $35.57 | ✅ |
| Qwen3-32B | Q4_K_M | ~18GB | **24GB** | $0.68 | $35.57 | ✅ |
| DS-R1-Distill-Qwen-32B | Q4_K_M | ~18GB | **24GB** | $0.68 | $35.57 | ✅ |
| Gemma 4 26B-A4B | Q8_0 | ~29GB | **32GB PRO** | $1.58 | $82.37 | ✅ |
| Gemma 4 31B | Q8_0 | ~35GB | **48GB PRO** | $1.91 | $99.22 | ✅ |
| QwQ-32B | Q8_0 | ~35GB | **48GB PRO** | $1.91 | $99.22 | ✅ |
| DS-R1-Distill-Llama-70B | Q4_K_M | ~39GB | **48GB PRO** | $1.91 | $99.22 | ✅ |
| Qwen3-72B | Q4_K_M | ~40GB | **48GB PRO** | $1.91 | $99.22 | ✅ |
| Llama 3.3 70B | Q4_K_M | ~39GB | **48GB PRO** | $1.91 | $99.22 | ✅ |
| Gemma 4 31B | BF16 | ~64GB | **80GB** | $2.74 | $142.27 | ✅ |
| QwQ-32B | BF16 | ~64GB | **80GB** | $2.74 | $142.27 | ✅ |
| Qwen3-72B | Q8_0 | ~79GB | **80GB** | $2.74 | $142.27 | ✅ (tight) |
| Qwen3-235B-A22B | Q4_K_M | ~129GB | **141GB** | $5.58 | $290.16 | ✅ |
| DeepSeek-R1 (671B) | Q4_K_M | ~369GB | 🚫 Multi-GPU | — | — | 🚫 |
| Kimi K2 (1T) | Q4_K_M | ~550GB | 🚫 Multi-GPU | — | — | 🚫 |
| Llama 3.1 405B | Q4_K_M | ~223GB | 🚫 Multi-GPU | — | — | 🚫 |

---

## 7. Cost Comparison

### 7a. Current vs. proposed (weekly 1-hour intelligence pod)

| Scenario | Annual cost | What's covered |
|---|---|---|
| **Current (all Claude API)** | **$85–136/yr** | All 8+ agents |
| RunPod 24GB + Claude for content | ~$36–55/yr | Pod for intelligence; Claude for execute-content only |
| RunPod 48GB PRO + Claude for content | ~$99–118/yr | Higher quality; Claude for execute-content only |
| All RunPod 24GB (including content) | ~$36/yr | Full migration; content quality risk |

### 7b. Per-run cost comparison (single audit call, 1,500 output tokens)

| Option | $/run | $/year (52 runs) |
|---|---|---|
| Claude Sonnet 4.6 API | $0.038 | $1.97 |
| RunPod 24GB fresh download (200s + 50s inference) | $0.048 | $2.50 |
| RunPod 48GB PRO fresh download | $0.232 | $12.07 |

### 7c. Per-run cost comparison (full 6-agent audit equivalent, 8,000 output tokens)

| Option | $/run | $/year (52 runs) |
|---|---|---|
| Claude Sonnet 4.6 API (6 subagents) | $0.25 | $13.00 |
| RunPod 24GB fresh download | $0.092 | $4.80 |
| RunPod 48GB PRO fresh download | $0.435 | $22.60 |

---

## 8. New Capabilities Unlocked by Cheap Inference

The economic case is not primarily cost savings — it's that marginal-cost-near-zero inference unlocks capabilities that are currently either impossible or economically unviable with per-token API pricing.

### 8a. The "Sunday Intelligence Pod" architecture

Instead of 6 separate GitHub Actions each cold-starting Node and making individual Claude calls:

```
Sunday 3am — RunPod pod starts, model loads once into VRAM
  ├── reddit:all (Apify fetch + local model summarize) ← currently stale 7 weeks
  ├── Pull fresh GSC data
  ├── Embed all GSC queries → cluster into topic groups (free embedding model)
  ├── Crawl 20–30 competitor pages (currently only 5)
  ├── Embed your pages + competitor pages → semantic gap matrix
  ├── Run full-site quality audit (all 50 pages, local LLM)
  ├── Generate weekly intelligence report (all above as context)
  ├── Generate content brief for this week's planned page
  └── Generate strategy with full context
  
  Total: 45–70 minutes, model loaded once, zero repeated cold starts
  Est. cost: $0.68–0.80/week on 24GB tier
```

Mon–Fri GitHub Actions become dumb executors reading pre-computed intelligence. The key insight: **once the pod is running, additional inference calls cost $0 extra.** You pay for time, not per-token. This inverts the optimization — instead of minimizing agents, you should maximize value per pod hour.

### 8b. GSC query clustering via embeddings

Use a tiny embedding model (`BAAI/bge-small-en-v1.5`, ~130MB, runs on CPU or small GPU fraction) to cluster all GSC queries into topical groups:

```
Cluster: "lumbar support tall people" (28 queries, avg pos 8.2, 0.3% CTR)
Cluster: "best office chair 6'4"" (41 queries, avg pos 4.1, 2.1% CTR)
Cluster: "standing desk height" (22 queries, avg pos 18.4, 0% CTR) ← topic gap
```

Strategy agent then sees topic-level patterns, not individual query CTR leaks. Zero LLM token cost.

### 8c. Semantic competitor analysis

Currently competitor-monitor.ts fetches 5 pages and analyzes H2 headings. With a pod:
- Crawl 20–30 competitor pages
- Embed your pages + competitor pages
- Find cosine distance between your content and theirs
- Identify semantic territory they cover that you don't — at the content level, not just heading level

This directly addresses the master audit finding: "competitor intelligence is theater."

### 8d. Full-site quality matrix

Currently audit.ts audits only top-20 GSC pages. With marginal-cost-zero inference, audit all ~50 pages monthly and maintain a quality matrix:

```
Page                           Quality  Voice  Schema  Priority
/review/gesture/               94       ✓      ✓       maintain
/review/leap-plus/             61       ✓      ✗       rewrite
/chairs/aeron/seat-height/     42       ✓      ✗       expand
```

Weakest pages get targeted before they drop, not after.

### 8e. Content brief pre-generation

Currently execute-content.ts receives a sparse task (`- [ ] NEW: Title | keyword | /slug/ | brief description`). With a pod pre-run, by Friday there's a full `reports/content-briefs/<slug>.md` containing competitor coverage analysis, GSC queries to target, H2 structure, statistics to cite, internal pages to link, relevant Reddit quotes. The content agent writes from a brief instead of from four words.

---

## 9. What Should NOT Be Migrated

More LLM calls is not always better. The following would create noise or drift, not value:

| What | Why not |
|---|---|
| **execute-content.ts** | Writes live Astro pages. Quality gap vs. Claude is most visible and impactful here. |
| **Running analysis on the same data twice** | Second agent looking at same GSC data amplifies errors, doesn't add signal |
| **Strategy reviewing strategy** | Without ground truth access, a review agent just validates whatever errors the first pass made |
| **More frequent strategy without new data** | Running strategy Wed + again Fri produces confident drift, not refinement |
| **LLM-driven competitor monitoring without real keyword data** | Adding LLM calls to poor input data produces expensive theater |

---

## 10. Final Recommendation

### Short-term (low risk, high value)
**Extend `audit.ts` with scriptable technical checks — no migration needed.**

The following checks can be added as pure code (no LLM cost) before the existing single Claude call:
- `curl -I` → security headers (HSTS, CSP, X-Frame-Options, Referrer-Policy)
- Fetch `robots.txt` → parse disallow rules, flag if Googlebot blocked, check AI crawler rules
- Fetch `sitemap.xml` → count URLs, cross-check vs. GSC pages, flag missing pages
- Follow redirects → count hops, flag chains > 1
- Normalize trailing slashes → fix the slash/no-slash impression split bug
- Full schema extraction → validate @id is absolute URL, validate @type matches page context
- PageSpeed Insights API → Core Web Vitals for top 5 pages (free, 25K queries/day)

This brings automated coverage close to what the manual `/seo-audit` caught, at $0 additional cost.

### Medium-term (if Claude API costs grow or frequency increases)
**Deploy RunPod 24GB with Gemma 4 31B or QwQ-32B at Q4_K_M.**

- Cost: $0.68/hr → $35.57/year at 1hr/week
- GPQA Diamond: 84.3% (Gemma 4 31B) or 62.1% (QwQ-32B) vs. Sonnet's 75.4%
- Gemma 4 31B is the better choice — exceeds Sonnet on GPQA at the same GPU tier
- Keep execute-content.ts on Claude API
- Implement the Sunday Intelligence Pod architecture
- Total annual cost: ~$36–60/yr vs. current $85–136/yr, with 3–5x deeper intelligence

### Do not pursue
**Kimi K2, DeepSeek-R1 full, DeepSeek-V3 full** — all require 370–550GB VRAM, not viable on single-GPU RunPod serverless at any price tier in this analysis.

---

## 11. Open Questions Before Any Decision

1. Does Gemma 4 31B produce acceptable content quality for the TCA voice (research-based, ME-credentialed author)? Needs a test prompt comparison vs. Claude Sonnet output on a non-Gesture page.
2. What is the actual token count per agent run? API logs should be checked to validate the cost baseline.
3. Does RunPod's vLLM worker template support Gemma 4 architecture? Gemma 4 is new (April 2026); vLLM support should be verified.
4. What is RunPod's 24GB GPU SKU? The actual GPU model affects memory bandwidth and therefore inference speed.
5. Is the 1hr/week "Sunday pod" cadence sufficient, or does the workflow need execution agents to also call a local model on their specific days?

---

## Sources Referenced

- DeepSeek-R1 HuggingFace model card: `deepseek-ai/DeepSeek-R1`
- DeepSeek-R1-0528 HuggingFace model card: `deepseek-ai/DeepSeek-R1-0528`
- DeepSeek-R1 technical report: arXiv 2501.12948
- DeepSeek-V3 technical report: arXiv 2412.19437
- Qwen3 technical report: arXiv 2505.09388
- Qwen3 blog: qwenlm.github.io/blog/qwen3
- Kimi K2-Thinking HF model card: `moonshotai/Kimi-K2-Thinking`
- Kimi K2.5 HF model card: `moonshotai/Kimi-K2.5`
- Gemma 4 HuggingFace blog: huggingface.co/blog/gemma4
- Gemma 4 31B model card: `google/gemma-4-31B-it`
- Gemma 4 26B-A4B model card: `google/gemma-4-26B-A4B-it`
- Phi-4 HF model card: `microsoft/phi-4`
- Claude 4 DataCamp overview
- Anthropic Claude 4 announcement page
- llm-stats.com GPQA leaderboard
- RunPod serverless pricing page (as quoted by user, 2026-05-10)
