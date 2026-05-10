# TCA Agent Workflow Audit
Model: CODEX
Timestamp: 2026-05-09T19-30-17-0700

Risk score interpretation: `10 = highest risk`.

## Facts
- Scheduled workflows:
  - `monday.yml`
  - `tuesday.yml`
  - `wednesday.yml`
  - `thursday.yml`
  - `friday.yml`
  - `saturday.yml`
- Manual audit agent:
  - `.claude/agents/tca-audit.md`
- Production-writing agents:
  - `scripts/agents/index-monitor.ts`
  - `scripts/agents/execute-fixes.ts`
  - `scripts/agents/execute-content.ts`

## Score Table

| Agent / workflow | Purpose | Use | Clarity | Reliability | Scalability | Risk | Data | Strategic value | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| `gsc-pull.ts` | Pull raw GSC data | 8 | 8 | 4 | 3 | 4 | 5 | 8 | Rewrite |
| `gsc-analyze.ts` | Convert GSC into ranked intelligence | 7 | 6 | 3 | 3 | 5 | 4 | 8 | Rewrite |
| `competitor-monitor.ts` | Competitor gap scanning | 4 | 6 | 4 | 3 | 4 | 3 | 4 | Rewrite or Merge |
| `index-monitor.ts` | Index health plus auto-fixing | 3 | 6 | 1 | 1 | 10 | 5 | 3 | Delete or manual-only |
| `audit.ts` | Weekly live-site audit | 6 | 6 | 4 | 4 | 5 | 5 | 6 | Rewrite |
| `strategy.ts` | Weekly planning | 8 | 7 | 4 | 4 | 6 | 5 | 8 | Keep, but rewrite validation |
| `execute-fixes.ts` | Apply plan fixes | 6 | 6 | 1 | 2 | 10 | 5 | 6 | Manual approval only |
| `execute-content.ts` | Generate new pages | 5 | 7 | 2 | 2 | 9 | 4 | 5 | Manual approval only |
| `verify-deploy.ts` | Guardrail and deployment summary | 7 | 7 | 5 | 5 | 4 | 5 | 7 | Keep and strengthen |
| `.claude/agents/tca-audit.md` | Manual deep audit | 7 | 6 | 5 | 5 | 3 | 6 | 7 | Keep and integrate |

## Workflow-Level Findings

### Monday: `monday.yml`
Purpose: data pull, competitor scan, indexing health, plus direct commit.

Facts:
- Writes directly to `main`.
- Runs `gsc:pull`, `gsc:analyze`, `competitor-monitor.ts`, and `index-monitor.ts`.
- Commits `src/` changes if index-monitor edits pages.

Why this is a problem:
- Monday mixes data collection with autonomous production edits.
- That bypasses the rest of the weekly plan-and-approval logic.
- One workflow failure can still leave partial outputs committed if earlier steps wrote files.

Verdict: split into `data-only` and `manual-review-needed` tracks.

### Tuesday: `tuesday.yml`
Purpose: produce a weekly audit.

Facts:
- Reads `data/gsc/latest.json`.
- Writes to `reports/`, `raw/`, and `wiki/`.

Problem:
- Audit quality depends on raw data freshness and correct normalization.
- Right now the audit reads a stale `latest.json` and can still sound authoritative.

Verdict: keep, but only after raw data validation passes.

### Wednesday: `wednesday.yml`
Purpose: convert system state into the weekly plan.

Facts:
- This is the best conceptual workflow in the repo.
- It is the correct place for decisions to happen.

Problem:
- It produces text that downstream regex parsers must interpret exactly.
- Its own output validation is too weak.

Verdict: keep, but validate its own output before commit.

### Thursday: `thursday.yml`
Purpose: apply FIX and REWRITE tasks.

Facts:
- Force-pushes to `staging`.
- Can build-fail and selectively roll back a file.

Problem:
- It is still a fully automated content/code editing workflow driven by LLM output.
- Current `execute-fixes.ts` on `main` contains smart quotes in code at lines 64-67, which is itself a critical reliability defect.

Verdict: put behind manual approval immediately.

### Friday: `friday.yml`
Purpose: create new pages.

Facts:
- Generates new `.astro` files from plan text.
- Pushes to `staging` with force.

Problem:
- The quality gate mostly checks structure, not substance.
- New content enters the repo without human editorial review.

Verdict: put behind manual approval immediately.

### Saturday: `saturday.yml`
Purpose: verify and ship.

Facts:
- Builds first, then runs `verify-deploy.ts`.
- Merges `main` into `staging` before pushing to `main`.

Problem:
- It still inherits all prior-week branch complexity.
- If earlier agents wrote bad but buildable content, Saturday mostly checks syntax and a few regexes.

Verdict: keep, but simplify branch model.

## Detailed Agent Findings

### `gsc-pull.ts`
Inputs:
- GSC API
- `credentials/gsc-service-account.json`

Outputs:
- `data/gsc/latest.json`
- `raw/gsc/gsc-YYYY-MM-DD.json`
- wiki snapshot

Problems:
- Hard caps: `queries` rowLimit 200, `pageQueries` rowLimit 500, `pages` rowLimit 500.
- No pagination.
- No minimum-completeness guard before overwrite.
- Current `data/gsc/latest.json` does not even contain `deviceSplit` or `dailyTrend`, despite current source code expecting them.

Should it exist: yes.

### `gsc-analyze.ts`
Inputs:
- `data/gsc/latest.json`

Outputs:
- `data/gsc/analysis.json`
- `data/gsc/history/*.json`
- `wiki/pages/concepts/gsc-intelligence.md`

Problems:
- Real example of bad intelligence: `data/gsc/analysis.json` ranks `"steelcase knee brace review"` as the biggest leak for `/review/gesture/`.
- That is fake sophistication. It is a keyword heuristic with no entity sanity check.
- If the top leak is nonsense, the rest of the stack is suspect.

Should it exist: yes, but rewritten.

### `competitor-monitor.ts`
Inputs:
- `data/competitors/config.json`
- 5 live competitor URLs

Outputs:
- `data/competitors/latest.json`
- wiki update

Problems:
- Only page metadata, word count, and schema types are collected.
- No SERP positions, no keyword overlap source, no clickstream, no backlink context.
- Strategic conclusions are too confident relative to the thin evidence.

Should it exist: only if enriched or narrowed.

### `index-monitor.ts`
Inputs:
- URL Inspection API
- site file inventory
- Anthropic

Outputs:
- `reports/index-monitor.md`
- `wiki/pages/concepts/indexing-health.md`
- possible `src/pages/` edits

Problems:
- Highest-risk agent in the system.
- It writes code on Monday without going through the weekly strategy loop.
- It is too broad: diagnosis, repair, and reindexing all in one.

Should it exist: as diagnostics only, not as an editor.

### `audit.ts`
Inputs:
- `data/gsc/latest.json`
- live page fetches
- limited wiki context

Outputs:
- `reports/audit-report.md`
- `raw/audits/*`
- wiki GSC page update

Problems:
- Limited page sample.
- Thin historical context window.
- Can produce strong-seeming conclusions on stale data.

Should it exist: yes, but tied to stronger raw inputs.

### `strategy.ts`
Inputs:
- audit report
- GSC data and analysis
- wiki synthesis pages
- competitor data

Outputs:
- `reports/weekly-plan.md`
- `raw/strategy/*`

Problems:
- Plan output is a brittle interface contract.
- The workflow is only as good as the parser downstream.

Should it exist: yes. This is the right place for reasoning.

### `execute-fixes.ts`
Inputs:
- `reports/weekly-plan.md`
- page source
- Anthropic

Outputs:
- page edits
- `reports/fixes-log.md`

Problems:
- Current source contains literal smart quotes in executable code at `scripts/agents/execute-fixes.ts:64-67`.
- Full-file rewrites are still allowed for "complex" tasks.
- Cooldown logic and page normalization are fragile.

Should it exist: only with human approval and patch-level edits.

### `execute-content.ts`
Inputs:
- `reports/weekly-plan.md`
- Anthropic

Outputs:
- new pages
- content log
- wiki entries

Problems:
- Structural validation is decent.
- Substantive quality validation is weak.
- It is still too easy to mass-produce plausible but low-leverage pages.

Should it exist: yes, but as a draft generator, not a live publisher.

### `verify-deploy.ts`
Inputs:
- built site
- git history
- source files

Outputs:
- weekly summary
- deploy/no-deploy outcome

Problems:
- No monetization event verification.
- No semantic quality review.
- Regex-based voice enforcement is easy to evade.

Should it exist: yes. It is useful as a guardrail layer.

### `.claude/agents/tca-audit.md`
Inputs:
- manual invocation
- workspace docs
- GSC and site audits

Outputs:
- manual audit files

Problems:
- It is not integrated into the scheduled system.
- It creates another audit dialect on top of the weekly pipeline.

Should it exist: yes, but as the authoritative manual-review path.

## Overlap and Redundancy
- `audit.ts` and `.claude/agents/tca-audit.md` both perform strategic auditing.
- `gsc-analyze.ts`, `strategy.ts`, and multiple wiki concept pages all try to explain the same ranking logic.
- `index-monitor.ts` overlaps with `execute-fixes.ts` but acts on a different day and branch path.

## Recommendations
1. Delete auto-edit behavior from `index-monitor.ts`.
2. Keep `strategy.ts` as the single decision engine.
3. Demote `execute-fixes.ts` and `execute-content.ts` to draft generation behind manual approval.
4. Treat `gsc-pull.ts` plus a rewritten `gsc-analyze.ts` as the only autonomous Monday stack.
5. Collapse duplicated audit logic into one authoritative manual audit path plus one lightweight scheduled audit.
