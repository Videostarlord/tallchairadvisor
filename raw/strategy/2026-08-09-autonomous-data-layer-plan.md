# Autonomous Data & Verification Layer — Build Plan

**Created:** 2026-08-09
**Author:** Claude (session 01Q9JpxHU3vNpa3DMb37wi2R), at Jackson's request
**Status:** Not started. Written to be executed in a fresh session.
**Prerequisite reading:** `wiki/pages/concepts/open-issues-status.md`, `wiki/pages/concepts/godseye-nightly.md`

---

## The question this answers

> "I want something that can run autonomously that can control my actual dashboards in GSC, GA4, Cloudflare, Clarity, GitHub — cheap, reliable, valuable. And visit my own website to make sure things work and look good."

## The correction that shapes everything below

**Claude in Chrome cannot run autonomously.** It needs Chrome open and a live model session, so it structurally cannot fire at 03:00 unattended — which is the entire point. It is also the most expensive option per action, because every screenshot costs image tokens.

The right split:

| Tier | Tool | Cost | Runs unattended? | Use for |
|---|---|---|---|---|
| 1 | Vendor REST APIs | ~$0 | ✅ | Anything with an endpoint |
| 2 | Scripted Playwright in CI | ~$0 (Actions minutes) | ✅ | No-API surfaces, visual regression |
| 3 | Firecrawl | free tier | ✅ | Third-party pages that block datacenter IPs |
| 4 | Claude in Chrome | expensive | ❌ | One-off changes, exploration, re-auth capture |

**Tier 4 is never on the critical path and never on a schedule.**

---

## What is ALREADY covered (verified 2026-08-09 — do not rebuild)

| Surface | Mechanism | Evidence |
|---|---|---|
| GSC search analytics | Search Console API | `scripts/gsc-pull.ts` |
| GSC URL inspection | URL Inspection API | nightly, 49/49 URLs |
| GA4 | Data API | `scripts/ga4-pull.ts` |
| Cloudflare analytics + Pages config | REST API | `scripts/collectors/cloudflare.ts`; config **written** via API 2026-08-09 |
| Clarity behavioral metrics | Data Export API | `scripts/agents/clarity-pull.ts` |
| GitHub | `gh` / REST | throughout |
| Live-site truth (tags, head, CWV, GEO) | Playwright probe | `scripts/probes/` |
| Preview-build gating | A9 | `.github/workflows/pr-probe.yml` |

### Scroll attention is already collected — do not build a heatmap scraper for it

`clarity-pull.ts:42` pulls `scrollDepthAvg` per URL; `:27` flags `<40%` as `low-scroll-depth`; it flows to `data/clarity/latest.json`, `history.jsonl`, and `strategy.ts`.

Sample from 2026-08-07: `/chair-headrest-tall-people/` 7%, `/shoulder-pain-tall-people/` 8%, `/office-chairs-for-6-foot-7/` 9%.

**But every one of those is a 1–2 session sample.** That is noise. The binding problem is traffic volume, not measurement. A heatmap of one session tells you less, more expensively. Revisit heatmap capture only when pages sustain 50+ sessions.

---

## P1 — Visual regression in the probe *(highest value; start here)*

**Why first:** it catches a class the system is completely blind to today (layout breakage, overflow, missing images, mobile collapse), it reuses infrastructure that already runs nightly, and it plugs straight into the A9 PR gate so breakage is caught *before* merge.

**Why cheap:** Playwright is already `devDependencies: playwright ^1.62.1`. The probe already loads all 49 pages nightly at `viewport: { width: 1366, height: 900 }` (`probe-page.ts:404`). Capturing a screenshot in a page context that is already open is nearly free. **Zero model tokens.**

### Build

1. **Capture** — in `probe-page.ts`, after assertions, `page.screenshot({ fullPage: false })` at two viewports:
   - desktop `1366×900` (existing)
   - mobile `375×812` — **currently zero coverage, and the likeliest place to break**, since tall-user content is full of wide spec tables.
2. **Store** baselines in `raw/visual/baseline/<viewport>/<slug>.png`. Baselines belong in `raw/` — they are immutable reference artifacts. Current captures go to a temp dir, never committed.
3. **Compare** with `pixelmatch` + `pngjs` (small, no browser deps), emitting a `visual-regression` finding at >2% changed pixels. Tune the threshold against one week of real diffs before enforcing.
4. **Finding class** `visual-regression`, closure predicate `{ kind: 'visual-diff', url, viewport, maxPct }`. Register in `scripts/lib/predicates/` alongside the others.
5. **Gate** — add `visual-regression` to `BLOCKING_CLASSES` in `scripts/probes/pr-gate.ts` **only after** the threshold has been calibrated. Until then it is advisory. There is a test asserting the blocking set is exactly A9's four; update it deliberately, and that test exists precisely so widening the gate is a visible diff.

### Non-obvious traps

- **Anti-flake:** disable animations (`prefers-reduced-motion`), mask timestamps/rotating content, and wait on `networkidle` before capture. An unstable baseline destroys trust in the gate faster than no gate at all.
- **`deriveFindings` returns NOTHING for `healthy:false` or `skipped` records.** A page that failed to load produces no visual finding. The `unevaluable` guard in `pr-gate.ts` is what stops that reading as a pass — see the 2026-08-09 incident below. Any new detector must preserve that property.
- **Baseline churn:** every intentional design change rewrites baselines. Require the baseline commit to be separate from the code commit so a reviewer can see what visually changed.

### Aesthetic judgment — deliberately NOT nightly

"Does it look good" needs a vision model, and reviewing 49 pages nightly would cost more than the rest of the pipeline combined to mostly say "still fine." **Invert the cost:** Playwright captures free every night; a model looks only when a diff exceeds threshold or the page changed in that PR. Rare, targeted, justified.

---

## P2 — Sitemap submission via API *(trivial; not a browser job)*

`gsc-pull.ts:47` requests scope `webmasters.readonly`. The Search Console API exposes `sitemaps.submit` / `sitemaps.list` / `sitemaps.get`.

1. Add the read-write `https://www.googleapis.com/auth/webmasters` scope to the service account.
2. `scripts/gsc-sitemap.ts` — submit `sitemap-index.xml`, then read back `sitemaps.get` and assert `lastSubmitted` advanced and `errors`/`warnings` are zero. **Read back, or it is an unverified write.**
3. Call it from Saturday's deploy, not the nightly — it is only meaningful after a deploy changes the sitemap.

**Set expectations:** the sitemap is already submitted and Google refetches on its own. This changes nothing unless the file structurally changes. Build it because it is cheap and closes a loop, not because it will move traffic.

---

## P3 — Amazon Associates via Playwright + stored session

The only revenue-truth surface with **no API**, and the only remaining manual load in the pipeline (currently a nag every 7 days; export was due 2026-08-11).

1. **Once, locally, by Jackson:** `npx playwright codegen amazon.com` → log in → save `storageState` JSON. *Claude must never handle the Amazon login itself.*
2. Store that JSON as GitHub secret `AMAZON_STORAGE_STATE`.
3. Weekly workflow replays it headless, downloads the earnings report CSV, commits to `raw/affiliate/YYYY-MM-DD-amazon-associates-report.md`.
4. **The design detail that makes it trustworthy:** when the session expires it must file a finding — `amazon-session-expired`, "re-auth needed" — and **must not report $0**. A scraper that reports zero revenue because it silently failed to log in is exactly the class of lie `unevaluable` / `healthy:false` exists to prevent. Detect via a login-page redirect or an empty report table, never by trusting a parsed zero.
5. Record the export's date range explicitly — a 2026-08-04 process fix exists because month-to-date and rolling-30-day exports are indistinguishable in the CSV.

---

## P4 — A10: dead affiliate links via Firecrawl

Already specced in the open-issues list. **Playwright cannot do this** — Amazon hard-blocks datacenter IPs, so it cannot run from Actions. Firecrawl is the right tool; ~15–20 ASINs/month is <4% of the 500-page free tier. Meter through `meterExternal` so it appears in `cost:rollup`.

---

## Explicitly NOT building, and why

| Ask | Verdict |
|---|---|
| **GSC "Request Indexing" automation** | No API (the Indexing API is restricted to `JobPosting`/`BroadcastEvent`). Quota ~10/day, Google states it does not reliably accelerate indexing, and **automating clicks in Google's own UI sits in a gray area with their automated-access policy — the account at risk is Jackson's.** Only 2 URLs are affected and both are ordinary crawl-priority cases. This is a content-authority signal, not a submission problem. Revisit in a month if still unindexed. |
| **Clarity heatmap screenshot scraping** | The underlying number is already collected via API (see above). Heatmap images add *where* attention drops, which is only meaningful at 50+ sessions/page. Currently 1–2. |
| **Claude in Chrome on a schedule** | Structurally impossible — needs a live browser and model session. |

---

## Dependency that outranks all of this

**A1 — the cooldown gate applies zero fixes.** The full-week stress test ran 29 findings → 6 planned → 0 applied. Every item above adds *observation* to a pipeline that currently ships nothing it finds. Better instrumentation on a system that cannot act produces better-documented stagnation.

**Recommended order: A1 → P1 → P3 → P2 → P4.**

---

## Hard-won facts to carry into the build session

- `isSynthetic()` (`probes/cli.ts`) already prevents any non-production `--base` run from filing findings or overwriting the nightly coverage file. Preview runs are safe by construction.
- `run.ts` exits non-zero **only** when the harness could not run. Do not change this — the nightly depends on it. Gates read the artifact instead (`pr-gate.ts`).
- **2026-08-09 incident, and the reason the `unevaluable` guard exists:** the preview build lacked `PUBLIC_GA_MEASUREMENT_ID`, so `window.gtag` was undefined, so the probe could not evaluate the affiliate handler, so all 4 records came back `healthy:false`, so `deriveFindings` returned **nothing**. 4 pages probed, 0 findings. Without the guard the gate would have reported "0 blocking" and **passed green over pages it never saw.** Any new detector must fail closed the same way.
- Cloudflare token now carries **Pages:Edit** (verified by writing the preview env var 2026-08-09). Config is fully manageable via API — no dashboard needed.
- `preview_deployment_setting: "all"`, `preview_branch_includes: ["*"]` — previews build for every branch.
- Never use `git commit -a` in this repo while an unrelated refactor is dirty in the working tree. It swept 10 in-flight files into a throwaway branch on 2026-08-09; recovered from the dangling commit, but use explicit pathspecs.
