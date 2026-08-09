# Autonomous Data Layer — Build Record

**Date:** 2026-08-09
**Branch:** `feat/autonomous-data-layer` (7 commits, not merged)
**Plan executed:** `raw/strategy/2026-08-09-autonomous-data-layer-plan.md`
**Scope approved by Jackson:** all five, in plan order (A1 → P1 → P3 → P2 → P4), with A1 as both phases.

This is the immutable snapshot. Living truth is in `wiki/pages/concepts/autonomous-data-layer.md`.

---

## Result

| Item | Built | Live now? | Notes |
|---|---|---|---|
| A1 cooldown gate | ✅ | ✅ on branch | 49/54 pages locked → **0** |
| P1 visual regression | ✅ | ✅ advisory | 98 baselines; mobile coverage is new |
| P2 sitemap submit | ✅ | ✅ verified live | ran successfully against production |
| P3 Amazon Associates | ✅ | ⏸ inert | needs `AMAZON_STORAGE_STATE` from Jackson |
| P4 / A10 dead ASINs | ✅ | ✅ monthly | first run found a false positive; fixed |

Tests 12 → 17 files. `lint:architecture`: no new violations (and R5 driven 15 → 0). Build green, 54 pages.

---

## Commits

```
ef2cc07  refactor(cost): route every model + external API call through the meter
1cdcfde  fix(a1): stop the pipeline's own commits from blocking its next fix
1aa5171  feat(probe): P1 — visual regression, and the first mobile coverage at all
05703fa  data(visual): seed 98 baselines from production, 49 pages x 2 viewports
a2a7db0  feat(affiliate): P3 — replay a stored Amazon session, and never report $0
a7afd89  feat(gsc): P2 — submit the sitemap on deploy, and read back to prove it
1791cc0  feat(affiliate): P4/A10 — detect dead ASINs, and refuse to guess
```

---

## Measurements taken during the build

Recorded because each one contradicted something that was believed before it.

### A1 — the gate was self-inflicted

```
pages on cooldown, git-based (before):  49 of 54
pages on cooldown, edit-log (after):     0
```

The 49 were locked almost entirely by the pipeline's own commits: `66bc44c` (inbound links, 8 orphans), `a2f809f` (GEO capsules, 45 pages), `fe06db6` (spec qualification, 17 pages).

The five task lines the 2026-08-06 plan dropped, re-run through the new gate:

| Task | Old gate | New gate | Why |
|---|---|---|---|
| Correct the Leap Plus spec contradiction | DROPPED | **PASSES** | deterministic |
| Shorten `/knee-pain-seat-depth/` title 67 → ≤60 | DROPPED | **PASSES** | deterministic |
| Shorten `/correct-chair-dimensions/` title 73 → ≤60 | DROPPED | **PASSES** | deterministic |
| Add Fit Verdict callout, `/review/aeron-size-c/` | DROPPED | **PASSES** | substantive; never substantively revised |
| REWRITE `/review/leap-plus/` | DROPPED | **PASSES** | substantive; last revision 20d ago |

Two of those five are genuine content churn and would be blocked if their pages *had* been revised recently. They pass because the pages have not been — which is the correct answer, and was unavailable before.

### P1 — stability, verified twice

Two independent full production runs (49 pages × 2 viewports):

```
run 1:  98 baselines created
run 2:  d:0% m:0% on every page
```

### P2 — the prediction was wrong

```
permissionLevel:  siteFullUser        (not siteOwner)
submit:           HTTP 204 accepted
read-back:        lastSubmitted 2026-08-06T09:49:58Z -> 2026-08-09T06:42:02Z
                  errors=0 warnings=0
```

Also observed: two legacy sitemaps are still registered on the property — `sitemap.xml` (submitted 2026-03-12) and `sitemap-0.xml` (2026-03-02). Not acted on. `sitemap-index.xml` is the current one.

### P4 — the false positive, in full

First live run:

```
B0CQ4K1KXT  DEAD   listing resolves but the product is currently unavailable
```

Verification scrape of the same page:

```
len=203160  "currently unavailable" x1
ALIVE hits: add to cart | buy now | in stock | ships from | customer reviews
```

The phrase sat inside a **"Newer Version Available"** block advertising the Hbada E3 Ultra (`B0FB37JS43`). The linked product, the E3 Pro, was fully purchasable.

`/best-office-chairs-under-500/` links this ASIN. Acting on the finding would have removed an affiliate link that works.

After the fix, re-run: `2 alive · 0 DEAD · 0 inconclusive`.

---

## Found along the way, not in the plan

**An uncommitted refactor was sitting in the working tree** — the same 10 files the plan's own final note warns about (`"It swept 10 in-flight files into a throwaway branch on 2026-08-09"`). It was complete, passing, and drove `lint:architecture` R5 from 15 to 0. Committed first, on its own, with explicit pathspecs, so it stopped being one stray `git commit -a` from loss.

**`deriveFindings` crashed on pre-P1 probe artifacts.** `visual` is absent (`undefined`), not `null`, on every artifact written before this change — and `pr-gate.ts` re-derives findings from stored artifacts. Caught by the existing `pr-gate.test.ts` fixture, fixed, and now covered directly.

---

## Outstanding

1. **Jackson, one step — activate P3.** An agent must never handle this login.
   ```
   npx playwright codegen --save-storage=amazon-state.json https://affiliate-program.amazon.com/home/reports
   gh secret set AMAZON_STORAGE_STATE < amazon-state.json && rm amazon-state.json
   npm run amazon:pull:dry     # watch the first run
   ```
   The selector layer is the one part that could not be exercised without the secret.

2. **Calibrate the P1 threshold.** After ~a week of real nightly diffs, decide whether 2% holds, then add `visual-regression` to `BLOCKING_CLASSES` in `pr-gate.ts` — deliberately, since a test asserts that set.

3. **Branch is unmerged.** Nothing here is on `main` yet.

4. **Untouched by this build:** the kill-list prose/code contradiction (still needs Jackson's decision), B11 Leap Plus spec sweep, B5 Gesture CTR, A2/A5–A8/A13.
