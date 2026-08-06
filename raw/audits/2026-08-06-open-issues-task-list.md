# TCA Open Issues — Task List

**Generated:** 2026-08-06 (v2 — regenerated after the strategy classifier shipped)
**Sources:** `data/audit-findings.json` (14 in-scope + 14 held back), `data/ledger.jsonl`, `data/probes/2026-08-06.json`, GSC URL Inspection, full-week CI stress test

> **v1 of this file was contaminated and has been replaced.** It was built from audit
> findings produced while the auditor was receiving 1.4% of the strategy synthesis, so it
> recommended meta rewrites on AIO-suppressed pages the kill list has forbidden since
> 2026-07-24 — and called `/knee-pain-seat-depth/` "your largest traffic lever", which is
> the exact page the directive names as a trap. Jackson caught it. Root cause and fix:
> `wiki/synthesis/decisions-log.md`, 2026-08-06.

**Current strategy** (`wiki/synthesis/thesis.md` + decisions-log 2026-08-04): monetization mechanics are fixed and performing above category norms. The constraint has moved back to **traffic**, but the kill list still stands — *no meta/CTR iteration below pos 8, no AIO capsules on informational queries, no snippet work on AI-Overview-eaten pages.*

Every item carries its stable `findingId`. 14 further findings are recorded in `outOfStrategy[]` and listed at the end — real, not deleted, just not what the strategy is paying for right now.

---

# A. SYSTEM & WORKFLOW

## A-CRITICAL

### A1. Cooldown gate applies zero fixes
The stress test ran a full week: **29 findings → 6 planned → 5 dropped at plan time → 1 dropped at execution → zero applied.** The critical spec contradiction sat behind a 14-day timer because the page was touched 2 days earlier. The strategy agent argued for bypassing on technical grounds; deterministic enforcement overrode it.

- [ ] Let correctness classes (`spec-error`, `schema-invalid`, `canonical-*`) bypass the cooldown — they are not thrash, they are corrections
- [ ] Keep the cooldown for optimization classes
- [ ] Verify a factual fix lands within one cycle of being found

**Everything else is downstream of this.** The pipeline currently finds problems competently and ships none.

---

## A-HIGH

### A2. Nightly cannot see the agents' own execution logs
The week's most important event — the trust layer rejecting fabricated ASIN `B006H1QYBA` on a page that scored 100/100 — appears nowhere in the report. `reports/content-log.md` and `fixes-log.md` are not nightly sources.

- [ ] Add them as sources in `scripts/nightly-report.ts` with contracts

### A3. Clarity quota — structurally guaranteed to fail
10 requests/day/project; Monday spends 2, the nightly then 429s. Causes a recurring `regressed` ledger entry.

- [ ] Reuse the on-disk snapshot when <24h old instead of re-pulling
- [ ] Or request a higher quota

### A4. Architecture lint backlog — 163 known violations
76 `?? []`, 6 `?? {}`, 10 empty catch, 62 raw `JSON.parse`, 15 direct `messages.create`. New violations already fail the build; the backlog does not. Each `?? []` on parsed input is a latent copy of the reconciler bug.

- [ ] Migrate `JSON.parse` sites to `readValidated`, prioritizing the ones reading pipeline state
- [ ] Migrate the 15 `messages.create` sites to `meteredCreate` so cost accounting is complete
- [ ] Re-baseline as it drops; `--strict` is the end state

---

## A-MEDIUM

- [ ] **A5.** Probe artifacts ~470KB/night (~14MB/month), no retention policy. Same question for the append-only `data/ledger.jsonl`.
- [ ] **A6.** `npm run cost:reconcile` never run against a real Anthropic invoice. Metered to date: $3.62 across 29 calls.
- [ ] **A7.** GSC URL Inspection adds ~6 min to the nightly (49 URLs × ~6s). Consider rotating 10/night.
- [ ] **A8.** `.env` name drift: `SERP_API_KEY`/`DATAFORSEO_USERNAME` vs vendor docs. `quotas.ts` accepts both, which masks it.

---

## A-RESOLVED TODAY (verify they stay fixed)

| Was | Now |
|---|---|
| Audit truncated findings every week for a month (`max_tokens: 4000`, 5/5 runs at ceiling) | Fixed → 28 findings |
| Auditor received 1.4% of synthesis, and the surviving slice argued FOR the abandoned strategy | Fixed → full context, 43,670 tokens |
| 8 context truncations across audit/strategy/wiki-utils | Removed; `assertPromptBudget()` throws instead |
| Kill-list violations reaching the planner | 3 → **0** via `strategy-filter.ts` |
| `audit-findings.json` never committed → Wednesday fell back to `slice(0, 3000)` | Fixed |
| `interventions.jsonl` never committed → reconciler had nothing to reconcile | Fixed |
| Workflows discarded entire runs on concurrent push | Fixed in 6 workflows |
| `reconcileInterventions` read a key that does not exist | Fixed → 8/8 entries enrich |
| Friday failing 3 weeks | Fixed → first success since 07-17 |
| Dead-man's alarm could never be delivered (em dash in HTTP header) | Fixed |

---

# B. WEBSITE — IN SCOPE

## B-CRITICAL

### B1. `/chairs/steelcase-leap-plus/seat-height/` — contradictory specs
**`32766b2a9f2c`** · Title says **15.5″–22.5″**; meta says **15.5″–20.5″**. One is wrong, on a spec page, about the exact number the page exists to answer.

- [ ] Get the real range from Steelcase source data
- [ ] Fix whichever is wrong
- [ ] **Blocked by A1** — currently waiting behind the cooldown

### B2. `/review/leap-plus/` — same contradiction, second page
**`9f9636eb65e2`** · Title/meta say 15.5″–22.5″ while the body states a 22.5″ ceiling and the sibling page disagrees. Same root fact, propagated.

- [ ] Fix together with B1 so both pages agree

---

## B-HIGH

### B3. Invalid schema blocking rich results on money pages
Five `schema-invalid` findings, all mechanically verifiable:

- [ ] **`dc65989fd486`** `/review/leap-plus/` — Product schema missing `@id`; `itemReviewed` missing from Review
- [ ] **`bd852d016763`** `/review/aeron-size-c/` — same, on the second-highest-CTR review
- [ ] **`7d502e933b53`** `/correct-chair-dimensions/` — **HowTo schema is dead code.** Google removed HowTo rich results in September 2023
- [ ] **`14beecb44bd0`** `/office-chairs-for-tall-people/` — Article missing `@id`, unresolved site-wide since May 10
- [ ] **`7a0984559a84`** `/chairs/herman-miller-aeron/` — Article uses `name` instead of `headline`

### B4. `/chairs/herman-miller-aeron/tall-people/` — no affiliate link
**`c48591dd56bd`** · pos 8.2, 1,163 impressions, **1.03% CTR** — one of your better-converting sub-pages, earning nothing.

- [ ] Add affiliate CTA with a **registered** ASIN from `data/verified-asins.json`

### B5. `/review/gesture/` — 8,415 impressions, 0.12% CTR at pos 8.0
**`018c617c0678`** · Your only first-person-tested page, and the strongest E-E-A-T asset on the site. In scope because it is at position 8.0, not below it.

- [ ] Rewrite title/meta to lead with the tested-at-6'4" angle

---

## B-MEDIUM

### B6. AIO suppression — needs GEO treatment, not snippet rewrites
Three findings confirming clicks are structurally suppressed. **Do not respond with meta rewrites** — that is what the kill list forbids.

- [ ] **`5c8d0d5e9574`** `/knee-pain-seat-depth/` — 40,752 impressions, 17 clicks (0.04%). Decide: citation capsule, or accept and stop spending on it
- [ ] **`ea09e7be3cda`** `/correct-chair-dimensions/` — Cornell query at pos 4.8, AIO-flagged
- [ ] **`f8b2943c8de7`** `/chairs/steelcase-gesture/seat-depth/` — spec query, 0% CTR at pos 8.8

**Context worth weighing:** AI assistants are already **16% of your sessions** (ChatGPT 44, Perplexity 6, Claude 3 — ~72% of Google organic volume) and that is the one surface AI Overviews cannot erode. The kill list bars capsules on *informational* queries; it does not bar them on money pages.

### B7. Other in-scope
- [ ] **`f88a6837b1c9`** `/office-chairs-for-6-foot-4/` — pos 5.8, 757 impressions, high buyer intent, under-linked into the funnel
- [ ] **`5663893947e9`** `/review/gesture/` — meta 158 chars (3 over)

### B8. Two pages 404 their own hero images
Ledger `9764cf8c99c4`, `b5cbab622428` — found by Playwright, invisible to every prior audit.

- [ ] `/review/sihoo-doro-s300/`
- [ ] `/shoulder-pain-tall-people/`

### B9. Four URLs not indexed (GSC URL Inspection, 45/49 PASS)
- [ ] `/chairs/herman-miller-aeron/size-guide/` — Discovered, not indexed
- [ ] `/lumbar-support-tall-people/` — Discovered, not indexed
- [ ] `/office-chair-return-policy/` — Crawled, not indexed
- [ ] `/standing-desk-height-tall-people/` — **unknown to Google.** Never discovered — check sitemap and internal links

---

# C. HELD BACK BY STRATEGY (recorded, not deleted)

14 findings in `data/audit-findings.json` → `outOfStrategy[]`. Each carries the rule and directive that classified it. **To act on any: edit `data/strategy-rules.json`** — they return on the next audit.

| Rule | Count | Directive |
|---|---|---|
| `no-ctr-iteration-below-position-8` | 11 | *no meta/CTR iteration below pos 8* |
| `no-snippet-work-on-aio-eaten-informational` | 2 | *stop farming AI-Overview-eaten informational queries; meta-tweaking suppressed pages* |
| `no-thin-content-expansion-during-content-freeze` | 1 | *freeze new content ~30 days* |

Mostly meta/title length on pages ranking worse than position 8 — where rank, not the snippet, is the binding constraint.

**Also permanently in scope regardless of strategy** (`alwaysInScope`): `spec-error`, `affiliate-missing`, `schema-*`, `canonical-*`, `duplicate-content`, `cannibalization`, `internal-linking`, `aio-suppression`. A factual error is wrong whatever the growth plan; a missing affiliate link is money already on the table.

---

# SUGGESTED ORDER

1. **A1** — unblock the pipeline. Nothing ships until fixes can land.
2. **B1 + B2** — the spec contradiction. It is wrong on the live site right now, on two pages.
3. **B3** — schema fixes. Deterministic, mechanically verifiable, directly affects rich results on money pages.
4. **B4** — the earning page with no affiliate link.
5. **B8 / B9** — broken images and unindexed URLs. Small and concrete.
6. **A2 / A3** — close the observability gaps.
7. **B5 / B6** — Gesture CTR, and the AIO strategic decision.
8. **A4** — lint backlog, continuously, as files are touched.
