# God's-Eye Nightly — merged build order

**Written:** 2026-08-05. Supersedes the *build order* of two same-day docs, both of which remain the reference for their reasoning:

- `2026-08-05-agent-trust-architecture.md` — stop bad claims reaching the live site. **Phases 1–4 shipped tonight.**
- `2026-08-05-godseye-architecture.md` — 8-layer robustness design. **Layers 0–7 not started.**

They are different builds. Trust is *"an agent must not assert what it could compute."* God's-eye is *"the system must be unable to fail silently, and must prove its own state without me looking."* Trust is the precondition; god's-eye is the goal.

**Goal, restated:** opening Claude Code to check on TCA becomes unnecessary. Every open item has a predicate and an age, every closed item has evidence, last month's spend is a number nobody estimated.

---

## Part 1 — What already shipped (2026-08-05, commits `b241a29`…`7beb3aa`)

| Artifact | What it gives the god's-eye build |
|---|---|
| `scripts/redirect-map.ts` | Redirect truth, shared. Layer 2 probes need it to avoid auditing 301 sources as pages. |
| `scripts/assert-safe-to-act.ts` | Executor preflight. Becomes the **hard floor under Layer 5's corrector** — auto-fixes route through the same gate. |
| `scripts/audit-findings.ts` | `findingId = sha1(page\|issueClass)` over an 18-value enum. **This is Layer 3's stated precondition. It is met.** Ledger work is unblocked now. |
| `data/retractions.jsonl` | Append-only claim ledger — a working prototype of the Layer 3 record shape. |
| Full audit delivery (`slice(0,3000)` removed) | Layer 6's "no truncation in the report path" already proven necessary: the slice was discarding H-1 and M-1 from every plan. |

**Deliberately not built, stays not built:** trust doc Phase 4 *as originally written* (executors open PRs instead of committing). Autonomy is the point; PR review reintroduces the manual load the pipeline exists to remove. Revisit only if a bad change reaches production despite the preflight.

## Part 2 — What the merge revealed

Three things neither doc says on its own.

**1. There are now five overlapping claim/state stores.** `data/interventions.jsonl`, `data/retractions.jsonl`, `data/audit-findings.json`, plus the proposed `data/ledger.jsonl` and `data/cost-ledger.jsonl`. Writing Layer 0 schemas for five stores that mean nearly the same thing is waste. **Unify first:** the ledger absorbs interventions and findings as record *kinds*; retractions stay separate (they are assertions about claims, not claims). This is new work the merge exposes — fold ~2 h into Step 2.

**2. Cost work is not greenfield.** `logCacheUsage()` in `wiki-utils.ts:153` already writes token counts to `data/token-log.jsonl`. Verified state tonight:

- **8 entries total**, spanning 2026-05-15 → 2026-08-05
- **3 agents logging** (`audit`, `strategy`, `execute-content`) out of **9 files** containing `messages.create` — 15 call sites total
- **Zero pricing.** Tokens only, no USD anywhere in `scripts/`

So Step 1 is a wrapper upgrade + 6 unlogged call sites + a price table — not a new subsystem.

**3. The two docs disagree on how much to build, and the disagreement is real.** The trust doc argues for a hard stop: the site earns ~$92/mo, the binding constraint is traffic not automation quality, so hardening past the loss-prevention point optimizes a system capped by traffic. God's-eye proposes ~30 h.

The resolution is in god's-eye's own ranking table: **Layers 0/3/7 buy most of the robustness**, and that subset is ~13 h, not 30. The trust doc's objection lands against *general polish*; it does not land against work that prevents losses or removes Jackson's manual load. Every step below is justified on one of those two grounds, or it is cut.

## Part 3 — Reordering, and why it differs from both docs

God's-eye sequences report → last (step 7), on the logic that it is "the presentation layer."

**That ordering never delivers the actual goal until hour 30.** The requirement is *not opening Claude Code to check*. That is delivered by the report and the dead-man's switch. Build them at hour 30 and Jackson checks manually for the whole build.

So: **report moves earlier, corrector moves last.**

- The report is useful the moment Layer 1 collectors exist — probes extend its coverage, they do not gate it.
- The corrector is the only step that edits a live money site unattended. It goes last, and only once the ledger can prove a fix actually landed. Both docs agree on this; the merged order makes it explicit.

**The one risk this creates:** an early report over unvalidated data can lie, and a report that lies is worse than no report — you stop checking and it stays wrong. Mitigation is non-negotiable: **until a value has a contract (Layer 0) or a predicate (Layer 3) behind it, the report renders it `unverified`, not as a fact.** Coverage grows tranche by tranche and the report says how much it can currently see.

---

## Part 4 — The build order

### Tranche A — stop flying blind (~15 h)

**A1. Metered client + pricing + rollup — ~3 h**
One `meteredCreate()` wrapping `client.messages.create`; every agent imports it; no direct SDK calls (lint-enforced across all of `scripts/`, not just `scripts/agents/` — `competitor-intelligence.ts` and `reddit-summarize.ts` sit outside it). Model → $/Mtok for input, output, cache-write, cache-read; price at write time; store USD per call. Meter non-LLM too — DataForSEO returns `cost` per response, plus SerpAPI credits, Firecrawl pages. Roll up to `data/cost-ledger.jsonl` per run / agent / day / month.
*Closes the 6 unlogged call sites. Directly answers requirement 3.*

**A2. Contracts + store unification + fix the reconciler — ~6 h** *(god's-eye says 4 h; it is 6)*
Add `zod`. `readValidated<T>(path, schema, { maxAgeHours, minRows })`, throwing loudly. Migrate **62 `JSON.parse` sites**; remove **80 `?? []` / `?? {}` swallows**. Lint-ban `?? []`/`?? {}` on parsed external input, empty `catch {}`, and `JSON.parse` outside `readValidated`. Unify the five stores per Part 2. Fix `reconcileInterventions` (`wiki-utils.ts:235`) — it reads `raw.pages` from snapshots that have no `pages` key, so `?? []` yields an empty Map and the file is rewritten byte-identical, green, forever.
*Kills the largest bug class. Retroactively closes the pending interventions.*

**A3. Ledger + predicate evaluator — ~6 h**
`data/ledger.jsonl`, append-only, one record per state transition: `id, firstSeen, lastSeen, status, attempts, closurePredicate, closedAt, closedBy`. **A finding cannot be filed without a machine-evaluable closure predicate.** One evaluator function per `kind` (`meta-length`, `no-console-errors`, `asin-registered`, `gsc-indexed`, `gsc-position`). Re-run every open predicate nightly: pass → auto-close; fail N nights → escalate; **passed-then-failed → regression**, the case nothing currently catches.
*Requirement 1. Unblocked now that `findingId` ships.*

### Tranche B — get the nightly off my desk (~7 h)

**B1. Collectors + health records — ~4 h**
One per source, each emitting `{ data, meta: { collectedAt, rowCount, healthy, reason } }`. A collector returning nothing writes `healthy: false` with a reason — never silent success.

| Source | Transport | State |
|---|---|---|
| GSC | `googleapis` (dep exists) | live; **add URL Inspection API** for per-page index state |
| GA4 | `googleapis` | partial — `data/ga4/` exists |
| Clarity | `CLARITY_TOKEN` | partial — `clarity-history.yml` runs |
| Cloudflare | **needs an API token — Jackson** | not started; deployment id, build status, cache, WAF |
| GitHub Actions | `gh api` | not started; did Mon–Sat succeed, what did they write |
| Amazon Associates | **manual CSV — no API exists** | cannot be automated; track staleness and nag |
| DataForSEO / Firecrawl | existing creds | quota remaining |

**B2. Nightly report + push + dead-man's switch — ~3 h**
One Sonnet call, ledger in whole — **no `.slice()` anywhere in this path**, the bug class that already cost every high and medium finding. Out: what changed, what closed, what is stuck and for how long, what regressed, what needs a human, what it could not see. Written to `wiki/nightly/YYYY-MM-DD.md`, pushed to phone. **Dead-man's switch:** if no report lands by 08:00, the absence itself alerts, checked by an external cron or a scheduled Action in a second repo. The nightly asserts its own collectors ran, and records its own cost and duration into the same ledger.
*This is the step that ends manual checking. Requirement 5 (partly), plus watching the watcher.*

### Tranche C — verify reality (~6 h)

**C1. Playwright probes — ~6 h**
Per URL, in a real browser. This is the genuine reason for headless — **no API can tell you whether a tag fires.**
- HTTP status with `redirect: 'manual'`; redirect sources excluded via `redirect-map.ts`
- console errors and unhandled rejections
- **network assertions** — does `gtag` collect fire, does Clarity load, does the affiliate click handler attach and emit
- `<head>` truth — meta, canonical, OG, JSON-LD parse. The CLAUDE.md rule that WebFetch strips `<head>` is exactly why this belongs in a browser
- Core Web Vitals (INP/LCP/CLS) via injected `web-vitals`
- GEO — Direct Answer block, citation capsule, FAQPage validity, answer-first ordering

*Requirements 2 and 5. This class of check is what would have caught the **June 16 GA4 CSP incident**, where hits were silently blocked for a month while every dashboard looked fine.*

### Tranche D — close the loop (~4 h)

**D1. Bounded corrector — ~4 h**
Split by reversibility. Every auto-fix routes through the existing `assertSafeToAct()` and commits separately as `fix(auto):`.

**Auto-fix** — deterministic, verifiable, reversible: dead ASIN → registry replacement; missing `pageLastmod`; broken internal link → nearest valid target; malformed JSON → last-good from git; missing `[skip cd]` on a data-only commit.

**Never auto-fix** — file a finding with a predicate and escalate: anything needing an LLM to rewrite page content; anything touching `public/_redirects`, canonicals, or schema semantics; anything creating or deleting a page.

*No unattended LLM page edits at 3 am. Requirement 4, bounded.*

---

## Totals and stop lines

| Tranche | Hours | Cumulative | Delivers |
|---|---|---|---|
| A — stop flying blind | ~15 | 15 | exact cost; no silent no-ops; nothing closes without proof |
| B — off my desk | ~7 | 22 | **the nightly report and dead-man's switch — manual checking ends here** |
| C — verify reality | ~6 | 28 | tag-firing, `<head>` truth, CWV, GEO per page |
| D — close the loop | ~4 | 32 | bounded auto-repair |

**Recommended stop line: end of Tranche B (~22 h).** That is the point where the stated goal is met — the system reports its own state, unprompted, and its silence is itself alarming. C and D extend coverage and remove toil; neither is required for "nothing left to check."

**Marginal running cost:** one Sonnet call/night over a ledger of tens of KB ≈ **$4–8/month**, plus Playwright CI minutes from Tranche C.

## Prerequisites needing Jackson

1. **Cloudflare API token** — blocks the Cloudflare collector in B1. Nothing else.
2. **Amazon Associates stays manual.** There is no API. The nightly can say "affiliate data is 9 days stale"; it cannot pull it. This is the one permanent human dependency.

## Test that the work is real

Per tranche, not at the end:

| Tranche | Must demonstrate |
|---|---|
| A1 | A month's spend reconciles against the Anthropic Console within 5%. Drift > 5% is itself a finding. |
| A2 | `reconcileInterventions` actually reconciles — replay a history snapshot and see a non-identical rewrite. Every `?? []` on external input is gone. |
| A3 | A finding filed without a predicate is rejected. A passed-then-failed predicate surfaces as a regression. |
| B1 | Kill a collector's credential; the nightly reports `healthy: false` with a reason rather than a missing section. |
| B2 | Suppress the nightly entirely; the dead-man's switch fires by 08:00. |
| C1 | Re-introduce the June 16 CSP rule in a preview deploy; the probe fails on `gtag` not firing. |
| D1 | A dead ASIN is auto-swapped and committed as `fix(auto):`; an LLM content rewrite is refused and escalated. |

Anything that does not demonstrate its row is not finished.

## Re-evaluation gate

**2026-09-01**, alongside the kill-list decision. If Tranches A–B have landed and the site's constraint is still traffic, C and D are optional and should be judged on toil removed, not on robustness in the abstract.
