# God's-Eye Nightly — Product Requirements Document

**Version:** 1.0 · **Written:** 2026-08-05 · **Owner:** Jackson Christopher
**Plan of record:** supersedes the build order in `2026-08-05-godseye-build-order.md`; that doc keeps the reasoning, this one is the spec.
**Reasoning sources:** `2026-08-05-godseye-architecture.md`, `2026-08-05-agent-trust-architecture.md`

---

## 1. Problem

TCA runs a six-day autonomous pipeline (Mon–Sat GitHub Actions) against a live money site. Its failures are silent by construction:

- `reconcileInterventions` (`scripts/agents/wiki-utils.ts:235`) reads `raw.pages` from history snapshots that have no `pages` key. `?? []` yields an empty Map, every entry returns unchanged, the file is rewritten byte-identical. **Green checkmarks weekly, zero reconciliations, for months.**
- The June 16 GA4 CSP incident blocked analytics hits for a month while every dashboard looked healthy.
- Cost visibility is effectively zero: **8 token-log entries since 2026-05-15, 3 of 9 agent files logging, 15 `messages.create` call sites, no pricing anywhere in `scripts/`.**

Jackson opens Claude Code to check whether the system is working, because nothing else can tell him.

## 2. Goal

**Opening Claude Code to check on TCA becomes unnecessary.**

Success is met when all three hold:

1. Every open item has a machine-evaluable closure predicate and an age.
2. Every closed item has evidence attached.
3. Last month's spend is a number nobody estimated, reconciled against the Anthropic Console within 5%.

## 3. Requirements (Jackson's, verbatim intent)

| # | Requirement | Delivered by |
|---|---|---|
| R1 | Account for all strategy | Ledger + closure predicates (§7.3) |
| R2 | All site data and pages verified SEO + GEO optimized | Playwright probes (§7.5) |
| R3 | Exact agent/pipeline cost, no guessing | Metered client + price table (§7.1) |
| R4 | Catch and correct pipeline errors | Contracts (§7.2) + bounded corrector (§7.7) |
| R5 | Headless verification that Cloudflare / GSC / GA4 / Clarity are live and current | Collectors (§7.4) + probes (§7.5) |
| R6 | Catch GSC indexing errors | GSC URL Inspection API collector (§7.4) |
| R7 | 99% robust | All of the above + dead-man's switch (§7.6) |

## 4. Non-goals

- **Amazon Associates automation.** No API exists. The nightly reports staleness and nags; it cannot pull.
- **Unattended LLM page edits.** Explicitly out of scope forever (§7.7 deny list).
- **PR-based human review of agent output.** Considered and declined — autonomy is the point.
- **Reddit pipeline.** Permanently closed; do not touch.
- **Replacing the Mon–Sat pipeline.** God's-eye observes and repairs it; it does not rewrite it.

## 5. Verified current state (2026-08-05)

Do not re-derive these. They were measured tonight.

| Fact | Value |
|---|---|
| `messages.create` call sites | 15, across 9 files |
| Files with LLM calls | `agents/{audit,strategy,execute-fixes,execute-content,verify-deploy,competitor-monitor,index-monitor}.ts`, `competitor-intelligence.ts`, `reddit-summarize.ts` |
| Files calling `logCacheUsage` | 3 (`audit`, `strategy`, `execute-content`) |
| `data/token-log.jsonl` entries | 8, spanning 2026-05-15 → 2026-08-05 |
| Pricing logic in `scripts/` | none |
| `JSON.parse` sites | 62 |
| `?? []` / `?? {}` on parsed input | 80 |
| `zod` installed | no |
| `playwright` installed | no |
| `googleapis` installed | **yes**, `^171.4.0` |
| Models in use | `claude-sonnet-4-6` (12 sites), `claude-haiku-4-5-20251001` (3 sites) |
| Workflows | `monday`…`saturday`, `clarity-history`, `keywords-monthly` |

**Already shipped tonight** (commits `b241a29`…`7beb3aa`) — build on these, do not rebuild:

| Artifact | Role in this build |
|---|---|
| `scripts/redirect-map.ts` | Probes must exclude 301 sources via `isRedirectSource()` |
| `scripts/assert-safe-to-act.ts` | Corrector routes every auto-fix through this |
| `scripts/audit-findings.ts` | `findingId = sha1(page\|issueClass)` — **the ledger's stated precondition, now met** |
| `data/retractions.jsonl` | Prototype of the ledger record shape |
| Full audit delivery | `slice(0,3000)` removed — proves §7.6's no-truncation rule |

---

## 6. Architecture

```
                    ┌───────────────────────────────────────┐
                    │  L0  contracts  (readValidated + zod)  │
                    └───────────────────┬───────────────────┘
                                        │ every read
    ┌───────────────┬───────────────┬───┴───────────┬──────────────────┐
    │ L1 collectors │ L2 probes     │ L3 ledger     │ L4 cost meter    │
    │ GSC GA4       │ Playwright    │ ledger.jsonl  │ meteredCreate()  │
    │ Clarity CF GH │ tags/head/CWV │ + predicates  │ cost-ledger.jsonl│
    └───────┬───────┴───────┬───────┴───────┬───────┴────────┬─────────┘
            └───────────────┴───────┬───────┴────────────────┘
                                    ▼
                       ┌────────────────────────┐
                       │ L5 report (1 Sonnet call)│──▶ wiki/nightly/ + phone push
                       └────────────┬───────────┘
                                    ▼
                       ┌────────────────────────┐
                       │ L6 dead-man's switch    │──▶ alerts on ABSENCE
                       └────────────────────────┘
                                    ▼
                       ┌────────────────────────┐
                       │ L7 corrector (bounded)  │──▶ fix(auto): commits
                       └────────────────────────┘
```

**Invariant:** no component may return a degraded-but-plausible value. Every failure is loud, named, and lands in the ledger.

---

## 7. Component specifications

### 7.1 Cost meter — `scripts/lib/metered-client.ts`

**NEW FILE.** Wraps the Anthropic SDK so no agent calls it directly.

```ts
export interface MeterContext {
  agent: string;        // 'audit' | 'strategy' | ...
  run: string;          // ISO date of the pipeline run
  purpose?: string;     // optional sub-label, e.g. 'finding-extraction'
}

export async function meteredCreate(
  params: Anthropic.MessageCreateParams,
  ctx: MeterContext
): Promise<Anthropic.Message>;
```

Behavior:
1. Calls `client.messages.create(params)`.
2. Reads `usage.{input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens}`.
3. Prices at write time using the table below.
4. Appends one record to `data/cost-ledger.jsonl`.
5. Returns the message unchanged.

**Record shape:**

```json
{"ts":"2026-08-06T03:12:44.108Z","agent":"audit","run":"2026-08-06","purpose":"finding-extraction",
 "model":"claude-sonnet-4-6","input":6430,"output":4000,"cacheWrite":0,"cacheRead":18200,
 "usd":{"input":0.01929,"output":0.06,"cacheWrite":0,"cacheRead":0.00546,"total":0.08475}}
```

**Price table — `scripts/lib/pricing.ts` (NEW FILE).** USD per million tokens. Cache-write is 1.25× input at 5-minute TTL and 2× input at 1-hour TTL; cache-read is 0.1× input.

| Model | Input | Output | Cache-write 5m | Cache-write 1h | Cache-read |
|---|---|---|---|---|---|
| `claude-sonnet-4-6` | $3.00 | $15.00 | $3.75 | $6.00 | $0.30 |
| `claude-haiku-4-5` | $1.00 | $5.00 | $1.25 | $2.00 | $0.10 |
| `claude-opus-5` | $5.00 | $25.00 | $6.25 | $10.00 | $0.50 |
| `claude-sonnet-5` | $3.00 † | $15.00 † | $3.75 | $6.00 | $0.30 |

† Sonnet 5 carries introductory pricing of $2.00 / $10.00 per MTok **through 2026-08-31**. The table must encode this as a dated override, not a hardcoded constant, and fall back to standard rates from 2026-09-01. Not currently used by any agent — include it so a model switch doesn't silently mis-price.

Unknown model ID → **throw**, naming the model. Never price at zero.

**Non-LLM metering.** Same ledger, `agent` field names the service:
- DataForSEO returns `cost` per response — record verbatim.
- SerpAPI: credits consumed (250/month free tier).
- Firecrawl: pages consumed (500/month free tier).

**Lint rule.** `messages.create` may appear only in `scripts/lib/metered-client.ts`. Enforce across **all of `scripts/`**, not just `scripts/agents/` — `competitor-intelligence.ts` and `reddit-summarize.ts` sit outside that directory.

**Rollup.** `npm run cost:rollup` → per run / agent / day / month, written to `data/cost-summary.json`.

**Migration:** convert all 15 call sites. `logCacheUsage` is retired; `data/token-log.jsonl` is retained as a historical artifact and never written again.

---

### 7.2 Contracts — `scripts/lib/read-validated.ts`

**NEW FILE.** Add `zod` as a dependency.

```ts
export interface ReadOptions {
  maxAgeHours?: number;   // throws if file mtime or embedded timestamp is older
  minRows?: number;       // throws if array/record count is below floor
  label?: string;         // human name used in error messages
}

export function readValidated<T>(
  path: string,
  schema: z.ZodType<T>,
  opts?: ReadOptions
): T;   // throws ContractViolation, never returns a degraded value
```

`ContractViolation` messages must name **the file, the failing key, and the expectation**. Example: `data/gsc/history.json: schema requires 'rows' (array, ≥1); key absent. Did you mean 'pages'?`

**Schemas live in `scripts/schemas/`**, one file per data file. Required at minimum:

| Data file | Freshness SLA | Non-empty floor |
|---|---|---|
| `data/gsc/analysis.json` | 8 days | ≥1 page row |
| `data/ga4/latest.json` | 8 days | ≥1 session row |
| `data/clarity/latest.json` | 8 days | ≥1 page row |
| `data/audit-findings.json` | 8 days | ≥0 (empty is a valid audit) |
| `data/interventions.jsonl` | none | ≥0 |
| `data/retractions.jsonl` | none | ≥0 |
| `data/verified-asins.json` | none | ≥1 |
| `data/content-roadmap.json` | none | ≥0 |
| `data/pipeline-status.json` | 8 days | — |

**Ban list, lint-enforced:**
- `?? []` or `?? {}` applied to a parsed external input (80 occurrences to migrate)
- empty `catch {}`
- `JSON.parse` outside `read-validated.ts` (62 occurrences to migrate)

**Store unification.** Five overlapping claim/state stores exist. Consolidate: `data/ledger.jsonl` absorbs `interventions.jsonl` and `audit-findings.json` as record `kind`s. `retractions.jsonl` stays separate — a retraction is an assertion *about* a claim, not a claim. `cost-ledger.jsonl` stays separate — different lifecycle. Provide one read API over the ledger so future schemas are written once.

**Reconciler fix.** Correct `reconcileInterventions` (`wiki-utils.ts:235`) to read the key that history snapshots actually contain. Under the new contract the original bug is unrepresentable: asking for a missing `pages` key throws at read time.

---

### 7.3 Ledger + predicate evaluator — `scripts/lib/ledger.ts`

**NEW FILE.** `data/ledger.jsonl`, append-only, one record per state transition.

```json
{"id":"838bb5a83119","kind":"finding","firstSeen":"2026-08-06","lastSeen":"2026-08-09",
 "status":"open","attempts":2,
 "closurePredicate":{"kind":"meta-length","url":"/review/gesture/","min":130,"max":165},
 "closedAt":null,"closedBy":null,"evidence":null}
```

`id` reuses the existing `findingId = sha1(page|issueClass)` where the record is a finding.

**Statuses:** `open` → `closed` | `escalated` | `regressed`.

**Hard rule — the load-bearing one:** a finding cannot be filed without a machine-evaluable `closurePredicate`. If an agent cannot state how a fix would be verified, it does not get to claim the problem exists. Filing without one is rejected at write time.

**Predicate kinds** — one evaluator function each, in `scripts/lib/predicates/`:

| `kind` | Fields | Passes when |
|---|---|---|
| `meta-length` | `url, min, max` | meta description length within bounds |
| `no-console-errors` | `url` | probe records zero console errors |
| `asin-registered` | `url` | every `/dp/<ASIN>` on the page is in `verified-asins.json` and not dead |
| `gsc-indexed` | `url` | URL Inspection reports indexed |
| `gsc-position` | `url, op, value, afterDays` | GSC position satisfies comparison after N days |
| `canonical-self` | `url` | canonical resolves to the URL itself |
| `schema-valid` | `url, type` | named JSON-LD type present and parses |
| `geo-capsule` | `url` | Direct Answer block + citation capsule present |
| `tag-fires` | `url, tag` | network assertion confirms the tag fired |

**Nightly evaluation loop:** re-run every open predicate against fresh L1/L2 data.
- Passes → auto-close, attach evidence (the probe/collector record that proved it).
- Fails N consecutive nights (default **3**) → escalate.
- **Passed, then failed → `regressed`.** This is the case nothing currently catches and is the highest-value output of the whole system.

---

### 7.4 Collectors — `scripts/collectors/`

**NEW DIRECTORY.** One file per source. Uniform return shape:

```ts
export interface CollectorResult<T> {
  data: T | null;
  meta: {
    collectedAt: string;   // ISO
    rowCount: number;
    healthy: boolean;
    reason: string | null; // required when healthy === false
  };
}
```

**A collector that returns nothing writes `healthy: false` with a reason. It never silently succeeds.** A failed collector is a finding in the ledger, not a skipped section in the report.

| Collector | Transport | Status | Notes |
|---|---|---|---|
| `gsc.ts` | `googleapis` | extend | **Add URL Inspection API** for per-page index state (R6) |
| `ga4.ts` | `googleapis` | partial | `data/ga4/` exists; wrap in the contract |
| `clarity.ts` | `CLARITY_TOKEN` | partial | `clarity-history.yml` runs; wrap in the contract |
| `cloudflare.ts` | REST API | **new** | Deployment id, build status, cache hit rate, WAF events. **Needs an API token from Jackson.** |
| `github-actions.ts` | `gh api` | **new** | Did Mon–Sat actually succeed, and what did each write |
| `quotas.ts` | DataForSEO / SerpAPI / Firecrawl | **new** | Remaining quota per service |
| `amazon.ts` | manual CSV | **new** | **Cannot pull.** Reports file age; nags past 7 days. |

---

### 7.5 Probes — `scripts/probes/`

**NEW DIRECTORY.** Add `playwright` as a dev dependency. One run per indexable URL.

This is the only genuine reason for a headless browser: **no API can tell you whether a tag actually fires.** Playwright, not Claude-in-Chrome — this runs unattended in CI at 03:00 and cannot depend on a browser session.

Per URL, assert:

1. **HTTP status** with `redirect: 'manual'`. Exclude redirect sources via `isRedirectSource()` from `redirect-map.ts` — auditing a 301 source as a page is the exact bug that produced the C-1 false positive.
2. **Console errors and unhandled rejections** — count and capture.
3. **Network assertions** — does `gtag` collect fire? does Clarity load? does the affiliate click handler attach and emit?
4. **`<head>` truth** — meta description, canonical, OG, Twitter Card, JSON-LD parses. CLAUDE.md's rule that WebFetch strips `<head>` is precisely why this belongs in a real browser.
5. **Core Web Vitals** — INP, LCP, CLS via `web-vitals` injected on the page.
6. **GEO** — Direct Answer block present, citation capsule present, FAQPage schema valid, answer-first ordering.

Output: one `ProbeResult` per URL, written to `data/probes/YYYY-MM-DD.json`, feeding the predicate evaluator.

---

### 7.6 Report — `scripts/nightly-report.ts`

**NEW FILE.** One Sonnet call. The ledger is tens of KB and fits whole.

**No `.slice()` anywhere in this path.** Truncation is the bug class that already discarded every high and medium audit finding when `strategy.ts` did `auditReport.slice(0, 3000)`.

**Output sections:** what changed · what closed (with evidence) · what is stuck and for how long · what regressed · what needs a human · **what the system could not see tonight**.

**The `unverified` rule — non-negotiable.** Until a value has a contract (§7.2) or a predicate (§7.3) behind it, the report renders it `unverified`, never as fact. A report that lies is worse than no report, because Jackson stops checking and it stays wrong. The report states its own coverage percentage.

Written to `wiki/nightly/YYYY-MM-DD.md`; pushed to phone.

**Self-metering:** the nightly records its own cost and duration into `cost-ledger.jsonl` and asserts its own collectors ran healthy.

---

### 7.7 Dead-man's switch

**If no nightly report lands by 08:00, the absence itself alerts.**

Checked by an external cron or a scheduled GitHub Action **in a second repository** — a watcher inside the repo it watches cannot report its own death. Without this, the build has only moved silent failure up one level.

---

### 7.8 Corrector — `scripts/corrector.ts`

**NEW FILE.** Split strictly by reversibility. Every auto-fix routes through the existing `assertSafeToAct()` and commits separately as `fix(auto):`.

**Auto-fix** — deterministic, verifiable, reversible:
- dead ASIN → registry's verified replacement
- missing `pageLastmod` entry for a new page
- broken internal link → nearest valid target
- malformed JSON in a data file → restore last-good from git
- missing `[skip cd]` on a data-only commit

**Never auto-fix** — file a finding with a predicate and escalate:
- anything requiring an LLM to rewrite page content
- anything touching `public/_redirects`, canonicals, or schema semantics
- anything that would create or delete a page

**No unattended LLM page edits at 03:00.** That is how you get a bad week you cannot unwind.

---

## 8. Build sequence

The report moves **earlier** than the source architecture placed it, and the corrector moves **last**. Rationale: the goal is *not opening Claude Code*, which the report and dead-man's switch deliver; building them at hour 32 means checking manually for the entire build. The corrector is the only step that edits a live money site unattended, so it ships only once the ledger can prove a fix landed.

| Step | Component | Est. | Cumulative | Depends on |
|---|---|---|---|---|
| 1 | Metered client + pricing + rollup (§7.1) | 3 h | 3 | — |
| 2 | Contracts + store unification + reconciler fix (§7.2) | 6 h | 9 | — |
| 3 | Ledger + predicate evaluator (§7.3) | 6 h | 15 | 2, `findingId` ✅ |
| 4 | Collectors + health records (§7.4) | 4 h | 19 | 2 |
| 5 | Report + push + dead-man's switch (§7.6, §7.7) | 3 h | **22 ← stop line** | 3, 4 |
| 6 | Playwright probes (§7.5) | 6 h | 28 | 3 |
| 7 | Bounded corrector (§7.8) | 4 h | 32 | 3, 5 |

**Recommended stop line: end of step 5 (~22 h).** That is where the stated goal is met — the system reports its own state unprompted and its silence is itself alarming. Steps 6–7 extend coverage and remove toil; neither is required for "nothing left to check."

**Running cost:** one Sonnet call/night over a ledger of tens of KB ≈ **$4–8/month**, plus Playwright CI minutes from step 6.

---

## 9. Acceptance tests

Per step, not at the end. Anything that does not demonstrate its row is not finished.

| Step | Must demonstrate |
|---|---|
| 1 | A month's metered spend reconciles against the Anthropic Console within 5%. Drift > 5% files itself as a finding. An unknown model ID throws rather than pricing at zero. |
| 2 | `reconcileInterventions` produces a **non-identical** rewrite when replayed against a real history snapshot. Zero `?? []` on external input remain. A stale file past its SLA throws, naming the file and its age. |
| 3 | A finding filed without a `closurePredicate` is rejected. A predicate that passed and later fails surfaces as `regressed`, not as a fresh finding. |
| 4 | Revoke a collector's credential → the nightly reports `healthy: false` with a reason, not a missing section. |
| 5 | Suppress the nightly entirely → the dead-man's switch fires by 08:00. A value with no contract or predicate renders `unverified`. |
| 6 | Re-introduce the June 16 CSP rule in a preview deploy → the probe fails on `gtag` not firing. A 301 source is excluded, not audited as a page. |
| 7 | A dead ASIN is auto-swapped and committed as `fix(auto):`. An LLM content rewrite is refused and escalated with a predicate. |

**Regression suite (must stay green).** The three historical incidents already blocked by the trust layer must remain blocked after every step: invented ASIN rejected on create and edit paths; NEW page at `/best-office-chairs/` rejected via both the plan and the roadmap fallback; re-raised C-1 suppressed by the retraction ledger.

---

## 10. Prerequisites on Jackson

1. **Cloudflare API token** — blocks `collectors/cloudflare.ts` (step 4) and nothing else.
2. **Amazon Associates stays manual, permanently.** There is no API. The nightly can say "affiliate data is 9 days stale"; it cannot pull it. This is the one irreducible human dependency in the system.

## 11. Open decisions

| Decision | Default if unanswered |
|---|---|
| Phone push transport | ntfy.sh topic (no account, no cost) |
| Escalation threshold N | 3 consecutive failing nights |
| Dead-man's switch host | scheduled Action in a second GitHub repo |
| Nightly run time | 03:00 America/Los_Angeles |
| Report model | `claude-sonnet-4-6` (matches existing agents) |

## 12. Re-evaluation gate

**2026-09-01**, alongside the kill-list decision. If steps 1–5 have landed and the binding constraint is still traffic rather than automation quality, steps 6–7 are optional and should be judged on toil removed, not on robustness in the abstract.
