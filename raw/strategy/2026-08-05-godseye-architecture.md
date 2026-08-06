# God's-Eye Nightly — architecture for a 99%-robust pipeline

**Written:** 2026-08-05. Requirements: account for all strategy, verify every page is SEO+GEO optimized, know exact agent/pipeline cost with no guessing, catch and correct pipeline errors, verify Cloudflare/GSC/GA4/Clarity are live and current via headless browser, catch GSC indexing errors.

---

## 0. The principle

**Robustness does not come from adding a smarter watcher.** Five agents already generate opinions; a sixth adds another unchecked opinion. It comes from three properties:

1. **Invalid states are unrepresentable** — a mis-keyed or stale input throws instead of degrading to `[]`.
2. **Nothing is "done" without proof** — every claim ships with a machine-evaluable closure predicate.
3. **Silence is impossible** — empty output and healthy output must be distinguishable from outside, including for the watcher itself.

The verified bug that prompted this is the canonical example: `reconcileInterventions` reads `raw.pages` from history snapshots that have no `pages` key, so `?? []` yields an empty Map, every entry returns unchanged, and the file is rewritten byte-identical. Six green checkmarks a week, zero reconciliations, and `strategy.ts:443` instructing the planner to "wait for reconciliation" that cannot arrive.

---

## Layer 0 — Contracts (kills silent no-ops)

The highest-leverage layer. Add `zod`. One helper replaces every raw read:

```ts
readValidated<T>(path, schema, { maxAgeHours, minRows }): T   // throws, loudly
```

Every `JSON.parse(readFileSync(...))` in `scripts/` migrates to it. Each data file gets a schema declaring required keys, plus a freshness SLA and a non-empty floor.

Under this, the reconciler bug is impossible: the history schema declares what it actually contains, and asking for `pages` fails at read time naming the file and the missing key — rather than three months later.

**Ban list, enforced by a lint rule:** `?? []` and `?? {}` on a parsed external input; empty `catch {}`; `JSON.parse` outside `readValidated`.

## Layer 1 — Collectors (kills stale and missing data)

One collector per source, each emitting `{ data, meta: { collectedAt, rowCount, healthy, reason } }`.

| Source | Transport | Notes |
|---|---|---|
| GSC | `googleapis` (already a dep) | + URL Inspection API for per-page index state |
| GA4 | `googleapis` | sessions, channels, affiliate events |
| Clarity | existing `CLARITY_TOKEN` | scroll, rage/dead clicks |
| Cloudflare | **needs an API token** | deployment id, build status, cache, WAF events |
| GitHub Actions | `gh api` | did Mon–Sat actually succeed, and what did they write |
| Amazon Associates | **manual CSV — no API** | cannot be automated; track staleness and nag |
| DataForSEO / Firecrawl | existing creds | quota remaining |

A collector that returns nothing writes `healthy: false` with a reason. It never silently succeeds.

**Amazon is the one hard human dependency.** The nightly can say "affiliate data is 9 days stale" but cannot pull it.

## Layer 2 — Probes (headless; kills "is it actually live and tracking")

Playwright, per URL. This is the genuine reason for a browser — no API can tell you whether a tag *fires*:

- HTTP status with `redirect: 'manual'` (redirect sources must not be audited as pages)
- console errors and unhandled rejections
- **network assertions**: does `gtag` collect fire, does Clarity load, does the affiliate click handler attach and emit
- `<head>` truth: meta, canonical, OG, JSON-LD parse — the CLAUDE.md rule that WebFetch strips `<head>` is precisely why this belongs in a real browser
- Core Web Vitals (INP/LCP/CLS) via `web-vitals` injected on the page
- GEO checks: Direct Answer block present, citation capsule present, FAQPage schema valid, answer-first ordering

This class of check would have caught the **June 16 GA4 CSP incident**, where hits were silently blocked for a month while every dashboard looked fine.

## Layer 3 — Ledger + closure predicates (kills "nothing tracks closure")

`data/ledger.jsonl`, append-only, one record per state transition. Every finding, intervention, and alert carries:

```
id (stable — findingId already exists), firstSeen, lastSeen, status,
attempts, closurePredicate, closedAt, closedBy
```

**The load-bearing idea:** a finding cannot be filed without a machine-evaluable closure predicate.

```json
{"kind":"meta-length","url":"/review/gesture/","min":130,"max":165}
{"kind":"no-console-errors","url":"/review/gesture/"}
{"kind":"asin-registered","url":"/review/leap-plus/"}
{"kind":"gsc-indexed","url":"/chair-headrest-tall-people/"}
{"kind":"gsc-position","url":"/x/","op":"<","value":6,"afterDays":14}
```

A small evaluator (one function per `kind`) re-runs every open predicate nightly against fresh Layer 1/2 data. Passes → auto-close. Fails N nights → escalate. Passed-then-failed → flag as regression, which is the case nobody currently catches.

**If an agent cannot state how a fix would be verified, it does not get to claim the problem exists.** This is the rule that makes "all strategy accounted for" true rather than aspirational — every planned item is either open with a predicate, closed with evidence, or escalated.

## Layer 4 — Cost accounting (kills guessing)

Currently: 15 LLM call sites, 6 logged, 8 entries over 7 days since May, no pricing. Effective cost visibility is zero.

1. **One metered client.** `meteredCreate()` wraps `client.messages.create` in a single module; every agent imports it. No agent may call the SDK directly (lint-enforced). This alone closes the 9 unlogged call sites.
2. **Price at write time.** Model → $/Mtok for input, output, cache-write, cache-read. Anthropic returns exact counts; multiply and store USD per call.
3. **Meter non-LLM too.** DataForSEO returns `cost` in every response (already visible in the keyword JSON). SerpAPI credits, Firecrawl pages, Apify units.
4. **Roll up** to `data/cost-ledger.jsonl` → per run, per agent, per day, per month.
5. **Reconcile monthly** against the Anthropic Console total. Drift > 5% is itself a finding — that is what makes it "no guessing" rather than "our best estimate."

## Layer 5 — Corrector (bounded auto-repair)

Auto-correction is where systems get dangerous. Split by reversibility:

**Auto-fix** — deterministic, verifiable, reversible, committed separately as `fix(auto):`:
- dead ASIN → swap to the registry's verified replacement
- missing `pageLastmod` entry for a new page
- broken internal link → nearest valid target
- malformed JSON in a data file → restore last-good from git
- missing `[skip cd]` on a data-only commit

**Never auto-fix** — file a finding with a predicate and escalate:
- anything requiring an LLM to rewrite page content
- anything touching `public/_redirects`, canonicals, or schema semantics
- anything that would create or delete a page

No unattended LLM page edits at 3am. That is how you get a bad week you cannot unwind.

## Layer 6 — Report (one LLM call, untruncated)

The ledger is tens of KB — it fits whole. **No `.slice()` anywhere in this path**; truncation is the bug class that already cost you every high and medium audit finding.

One call in, one brief out: what changed, what closed, what is stuck and for how long, what regressed, what needs a human. Written to `wiki/nightly/YYYY-MM-DD.md`, pushed to phone.

## Layer 7 — Watching the watcher

Without this you have only moved silent failure up a level.

- The nightly asserts its own collectors ran and were healthy; a failed collector is a finding, not a skipped section.
- **Dead-man's switch:** if no nightly report lands by 08:00, that absence itself alerts. An external cron (or a scheduled GitHub Action in a second repo) checks for the artifact.
- The nightly records its own cost and duration into the same ledger.

---

## Where the 99% actually comes from

Ranked by failure-modes-eliminated per hour:

| Rank | Mechanism | Eliminates |
|---|---|---|
| 1 | Layer 0 contracts | every silent no-op, including the reconciler bug |
| 2 | Layer 3 predicates | "fixed" claims with no proof; work that quietly never closes |
| 3 | Layer 4 metered client | unknown spend |
| 4 | Layer 7 dead-man's switch | the watcher failing silently |
| 5 | Layer 2 probes | tags/CSP silently broken while dashboards look fine |
| 6 | Layer 5 bounded corrector | toil, without adding unattended-edit risk |

Adding a nightly *analyst* without Layers 0/3/7 buys almost nothing. Adding Layers 0/3/7 without a nightly analyst buys most of the robustness.

---

## Build order and effort

| Step | Layer | Effort | Why here |
|---|---|---|---|
| 1 | Metered client + pricing + rollup | ~3 h | Self-contained; directly answers "exact cost"; currently ~unknowable |
| 2 | Contracts (`zod` + `readValidated`) + fix the reconciler | ~4 h | Kills the largest bug class; retroactively closes 8 pending interventions |
| 3 | Ledger + predicate evaluator | ~6 h | The actual complaint. `findingId` (shipped 2026-08-05) is the precondition |
| 4 | Collectors + health records | ~4 h | Feeds predicates real data; adds Cloudflare + URL Inspection |
| 5 | Playwright probes | ~6 h | Tag-firing and `<head>` truth; catches the CSP class |
| 6 | Bounded corrector | ~4 h | Only after the ledger can prove a fix landed |
| 7 | Report + push + dead-man's switch | ~3 h | Last — it is the presentation layer |

**~30 h total.** Steps 1–3 (~13 h) deliver most of the robustness and all of the cost visibility.

Marginal running cost: one Sonnet call/night on a ledger of tens of KB ≈ **$4–8/month**, plus Playwright CI minutes. Trivial next to build time.

## Success test

When you open Claude Code, there is nothing left to check. Concretely: every open item has a predicate and an age, every closed item has evidence, and last month's spend is a number you did not estimate.
