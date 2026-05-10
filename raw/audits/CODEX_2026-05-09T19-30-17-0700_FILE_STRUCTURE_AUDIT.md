# File Structure And Knowledge System Audit
Model: CODEX
Timestamp: 2026-05-09T19-30-17-0700

## Core Verdict
The structure has a good idea inside it: separate code, live data, raw evidence, and institutional memory.

The problem is that too many documents are trying to be authoritative at once. The result is not a lack of documentation. It is document competition.

## Facts
- There are two operational roots:
  - workspace root: `Claude TCA Workspace/`
  - git repo root: `Claude TCA Workspace/tall-chair-advisor/`
- Root-level context files:
  - `CLAUDE.md`
  - `agents.md`
  - `.claude/agents/tca-audit.md`
- Repo-level operational docs:
  - `SCHEMA.md`
  - `wiki/pages/concepts/workflow-system-reference.md`
  - `SESSION-SUMMARY.md`
  - `MANUAL-TODOS.md`
- Knowledge / archive layout inside repo:
  - `raw/`
  - `wiki/`
  - `data/`
  - `reports/`

## What Is Good
- `src/`, `data/`, `raw/`, and `wiki/` are conceptually distinct.
- `raw/` versus `wiki/` is a sound pattern for agent memory.
- The wiki index pattern is usable.
- The archive is committed, so CI can see it.

## What Is Confusing

### 1. Too many "how the system works" documents
Operationally relevant files include:
- `CLAUDE.md`
- `agents.md`
- `SCHEMA.md`
- `wiki/pages/concepts/workflow-system-reference.md`
- `SESSION-SUMMARY.md`
- `MANUAL-TODOS.md`
- `raw/strategy/2026-04-06-automation-system.md`

These documents are not equally fresh, but they all look authoritative.

### 2. Stale documents remain in the operational lane
- `SESSION-SUMMARY.md` says GA4 is hardcoded in `Layout.astro`; current `Layout.astro` uses `PUBLIC_GA_MEASUREMENT_ID`.
- `MANUAL-TODOS.md` says `llms.txt` still needs to be added; `public/llms.txt` already exists.
- `reports/weekly-plan.md` is still dated `2026-04-14`.

### 3. The wiki is helpful, but drifting toward concept sprawl
There are many overlapping GSC concept pages:
- `gsc-analysis-strategy.md`
- `gsc-intelligence-system.md`
- `gsc-intelligence.md`
- `query-clustering-system.md`
- `opportunity-scoring-system.md`
- `market-signal-framework.md`
- `content-gap-engine.md`

These are individually coherent. Together they are too many moving reference points for one intelligence layer.

## Source Of Truth Audit

| Topic | Best source of truth | Current problem |
|---|---|---|
| Live site behavior | `src/`, `astro.config.mjs`, live HTML | Docs and wiki sometimes lag |
| Weekly workflow logic | `.github/workflows/*.yml`, `scripts/agents/*.ts` | wiki docs paraphrase and sometimes overstate |
| Historical evidence | `raw/` | spread across raw, reports, and wiki |
| Current operational state | should be `data/` + latest `reports/` | current reports are stale/mixed |
| Strategic memory | `wiki/synthesis/*` | too many supporting concept pages dilute it |

## Reports Directory Audit
Current `reports/` is not a clean current-week view.

Evidence:
- `reports/audit-report.md` contains `Generated: 2026-05-09...` but also says `Audit date: 2026-05-12`
- `reports/weekly-plan.md` is `2026-04-14`
- `reports/weekly-summary.md` is `2026-05-02`
- `reports/fixes-log.md` is `2026-05-07`

Verdict:
- `reports/` is acting like a scratch area, not a trustworthy dashboard.

## Wiki Usefulness
The wiki is useful when it does one of three things:
- preserve cross-week memory
- capture entity state
- compress historical decisions

The wiki is less useful when it:
- duplicates code behavior line by line
- documents proposed systems as if they are already real
- splinters one concept into several adjacent pages

## Duplicate Truth Sources

| File or area | Why it exists | Why it now hurts |
|---|---|---|
| `SESSION-SUMMARY.md` | migration memory | now stale and misleading |
| `MANUAL-TODOS.md` | unfinished manual backlog | now partly obsolete |
| `reports/*.md` | current-week operational output | dates and freshness inconsistent |
| multiple GSC concept pages | explain intelligence system | too much overlap |
| root docs plus repo docs | support different agents | two root contexts create drift |

## Assumptions
- Humans and agents both inspect these files directly.
- No separate documentation site exists.

## Hypotheses
- Reducing document count will improve agent performance more than adding more documentation.

## Recommendations
1. Declare one operational root:
   - workspace root for human/agent context
   - repo root for code and runtime truth
2. Demote or archive stale files:
   - `SESSION-SUMMARY.md`
   - `MANUAL-TODOS.md`
3. Collapse overlapping GSC concept pages into:
   - one system page
   - one weekly digest
   - one backlog / research page if needed
4. Treat `reports/` as ephemeral and never as the main truth source.
5. Keep `wiki/synthesis/*` as the main strategic memory layer.
