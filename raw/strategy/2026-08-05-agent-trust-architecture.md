# Agent Trust Architecture — plan to stop bad claims reaching the live site

**Written:** 2026-08-05, after the C-1 false positive nearly had the Friday agent recreate a deliberately consolidated page.

---

## 1. The defect, generalized

The pipeline is a 4-day relay with three handoffs and no human checkpoint:

```
Mon  data pull         → data/*.json
Tue  audit.ts          → reports/audit-report.md      reads: data, wiki
Wed  strategy.ts       → reports/weekly-plan.md       reads: audit-report, data, wiki
Thu  execute-fixes.ts  → EDITS src/pages/             reads: weekly-plan, data — NO WIKI
Fri  execute-content   → CREATES src/pages/           reads: weekly-plan, data, some wiki
Sat  verify-deploy     → DEPLOYS (can exit 1)         reads: reports, wiki
```

**One agent's claim becomes the next agent's fact, and there is no representation for "this claim is wrong."**

Three incidents, all the same shape:

| Date | Bad claim | Reached |
|---|---|---|
| 2026-07-04 | 8 invented ASINs are real products | Live site |
| 2026-07-20 | 2 more invented ASINs on a money page | Live site, undetected 2 weeks |
| 2026-08-05 | `/best-office-chairs/` is a duplicate page | Blocked manually at Wed; would have executed Fri |

The 2026-08-05 correction was written into the wiki on 2026-08-04 — **and the agent planned the destructive work anyway**, because `strategy.ts` reads `reports/audit-report.md` as primary input and the finding there was uncorrected. Prose in the wiki has no authority over a downstream agent.

### The single generalizable rule

> **Every one of these bugs was an agent asserting a fact it could have computed.**

Is this URL a page? Does this ASIN resolve? Does this file exist? Is this slug taken? All checkable in code. All were instead left to an LLM's judgment, and the LLM was confidently wrong.

### Why upstream fixes are not sufficient

Tonight I guarded `enforcePlanConstraints()` in strategy.ts — then found `injectMandatoryRoadmapItems()`, a **second injection path that appends tasks after enforcement runs**, which would have reintroduced the identical bug from `data/content-roadmap.json`. Any upstream gate can be bypassed by a path added later.

**Principle: validate at the point of action, not the point of claim.** Upstream checks are an optimization (fail fast, cheaper); the executor preflight is the actual guarantee.

### Current validation gap

Both executors already validate *syntax* and have no *semantic* checks:

| | Has | Missing |
|---|---|---|
| `execute-fixes.ts` | file exists, cooldown, meta/title length, word-count | is the target a redirect source? is it noindex? |
| `execute-content.ts` | Astro compiles (real compiler + esbuild), quality score | is the slug a redirect source? already taken? are the ASINs real? |

---

## 2. Plan

Four layers, ordered by value per hour. **Recommended stop line after Phase 2** — see §3.

### Phase 1 — Executor preflight (the actual guarantee) — ~2–3 h

A single `assertSafeToAct(task)` called by both executors immediately before touching a file. Rejects the task and logs the reason; never throws away the whole run.

Checks, all deterministic:
- target slug is not a redirect source (`redirect-map.ts`, built 2026-08-05)
- for NEW: slug is not already a page
- for FIX/REWRITE: file exists and is not `noindex`
- every `/dp/ASIN` in generated content is in `data/verified-asins.json` (registry built 2026-08-04; currently only enforced by `lint-content.mjs` at deploy time, which is 2 days too late and blocks the *whole* deploy rather than the *one* bad task)

**Why first:** it is the last gate before a live money site, and it catches bad tasks regardless of which upstream path produced them — including paths that do not exist yet. Roughly 60 lines plus wiring.

### Phase 2 — Retraction ledger (machine-readable) — ~2 h

`data/retractions.jsonl`, append-only:

```json
{"date":"2026-08-05","target":"C-1","scope":"audit-finding",
 "claim":"/best-office-chairs/ duplicates /office-chairs-for-tall-people/",
 "why":"URL is a 301 source; audit followed the redirect and compared the page to itself",
 "rule":"never flag duplicate content between a redirect source and its target"}
```

- `audit.ts` reads it before writing findings — a finding matching a retraction is suppressed, or emitted with a `RETRACTED` banner
- `strategy.ts` reads it before planning — tasks citing a retracted finding are dropped
- One helper in `wiki-utils.ts`; the wiki entry stays as the human-readable record and links to the ledger entry

**Why second:** this is precisely what was missing on 2026-08-05. A correction becomes enforceable instead of advisory. Cheap, and it compounds — every future retraction is one append.

### Phase 3 — Claim provenance — ~4–6 h — DEFER

Findings carry structured metadata (source data, checks passed, confidence) rather than prose. Downstream agents weigh claims by provenance. Makes debugging trivial.

**Defer:** requires reworking the audit output format and the strategy prompt that consumes it. High effort, and Phases 1–2 already prevent the damage. Revisit only if the site scales to multiple properties.

### Phase 4 — Human checkpoint — ~1 h — OPTIONAL

Executors open a PR instead of committing to `main`, so Saturday's deploy merges only reviewed changes.

**Optional and arguably wrong for this site.** The autonomy is the point, and PR review reintroduces the manual load the pipeline exists to remove. Consider only if Phases 1–2 prove insufficient — i.e. if a bad change still reaches production after they ship.

---

## 3. Recommended scope — stop after Phase 2

Total ~4–5 hours. That buys:

- No agent can act on a URL that is not a page
- No agent can ship an unverified ASIN (at write time, not deploy time)
- A correction, written once, is enforced everywhere and permanently

**Do not build Phases 3–4 now.** The site earns ~$92/month, the binding constraint is session volume (303/28d), not automation quality, and the kill-list gate resolves 2026-09-01. Hardening beyond Phase 2 optimizes a system whose output is capped by traffic. Phases 1–2 are justified because they prevent *losses* — dead affiliate links and destroyed consolidations cost real money at any traffic level.

## 4. Sequencing

1. **Phase 1 now** — highest value, and Thursday's `execute-fixes` runs 2026-08-06
2. **Phase 2 next** — before the following Tuesday audit, so C-1 cannot resurface
3. Re-evaluate at the 2026-09-01 August close, alongside the kill-list decision

## 5. Test that the work is real

Replay all three historical incidents against the new guards. Each must be blocked with a named reason:

| Incident | Expected |
|---|---|
| Invented ASIN in generated content | rejected — not in registry |
| NEW page at `/best-office-chairs/` | rejected — redirect source |
| Audit re-raises C-1 | suppressed — matches retraction |

Anything that does not block all three is not finished.
