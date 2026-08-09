---
type: concept
last_updated: 2026-08-09
sources: [raw/strategy/2026-08-09-autonomous-data-layer-plan.md]
tags: [automation, playwright, api, visual-regression, architecture]
---

# Autonomous Data & Verification Layer

**Full build spec: `raw/strategy/2026-08-09-autonomous-data-layer-plan.md`.** This page is the durable summary; the spec is the executable detail.

**Status: not started** as of 2026-08-09.

## The question

Jackson asked for a system that autonomously controls his dashboards (GSC, GA4, Clarity, Cloudflare, GitHub) and visits the live site to confirm it works and looks right.

## The correction that shapes the design

**Claude in Chrome cannot run autonomously.** It requires an open browser and a live model session, so it cannot fire at 03:00 unattended — which is the entire requirement. It is also the most expensive option per action, since every screenshot costs image tokens.

| Tier | Tool | Cost | Unattended? | Use for |
|---|---|---|---|---|
| 1 | Vendor REST APIs | ~$0 | ✅ | Anything with an endpoint |
| 2 | Scripted Playwright in CI | ~$0 | ✅ | No-API surfaces, visual regression |
| 3 | Firecrawl | free tier | ✅ | Hosts that block datacenter IPs |
| 4 | Claude in Chrome | expensive | ❌ | One-off changes, exploration, re-auth |

Tier 4 is never scheduled and never on the critical path.

## Already covered — do not rebuild

GSC search analytics and URL inspection, GA4, Cloudflare analytics **and config writes**, Clarity behavioral metrics, GitHub, the Playwright probe, and A9 preview gating.

**Scroll attention is already collected.** `clarity-pull.ts` pulls `scrollDepthAvg` per URL and flags anything under 40% as `low-scroll-depth`, flowing into `data/clarity/latest.json` and `strategy.ts`. A heatmap scraper for this would rebuild something that exists.

The real limit there is sample size: 1–2 sessions per page as of 2026-08-07, so the numbers (7% on `/chair-headrest-tall-people/`, 8% on `/shoulder-pain-tall-people/`) are noise. That is a **traffic** problem, not a measurement one. Heatmap capture becomes worth it only at 50+ sessions per page.

## Build order

**A1 → P1 → P3 → P2 → P4.**

- **P1 — visual regression in the existing probe.** Highest value: the system is completely blind to layout breakage today. The probe already loads all 49 pages nightly at 1366×900; **mobile 375×812 has zero coverage and is where wide spec tables are likeliest to break.** Advisory until the diff threshold is calibrated on a week of real diffs, then added to `BLOCKING_CLASSES`. Aesthetic review stays threshold-triggered, never nightly — a vision model over 49 pages a night would cost more than the rest of the pipeline to mostly say "still fine".
- **P3 — Amazon Associates** via Playwright + a stored `storageState` secret. The only revenue surface with no API and the last real manual load. Must file `amazon-session-expired` rather than report `$0` when login fails.
- **P2 — sitemap submission** via the Search Console API. Needs the read-write `webmasters` scope; `gsc-pull.ts` currently requests `webmasters.readonly`. Cheap, largely ceremonial.
- **P4 — A10 dead ASINs** via Firecrawl. Playwright cannot do it: Amazon hard-blocks datacenter IPs.

## Rejected, with reasons

- **GSC "Request Indexing" automation.** No API (the Indexing API is restricted to `JobPosting`/`BroadcastEvent`), ~10/day quota, Google states it does not reliably accelerate indexing, and automating clicks in Google's own UI is a gray area under their automated-access policy — with Jackson's account as the thing at risk. Only 2 URLs affected, both ordinary crawl-priority cases. Treat as a content-authority signal, not a submission problem.
- **Clarity heatmap scraping.** Data already collected; sample size too small to interpret.
- **Claude in Chrome on a schedule.** Structurally impossible.

## The dependency that outranks all of it

**A1 — the cooldown gate applies zero fixes** (29 findings → 0 applied across a full-week stress test). Every item here adds *observation* to a pipeline that ships nothing it finds. More instrumentation without A1 produces better-documented stagnation.

## Related

[[godseye-nightly]] · [[open-issues-status]] · [[decisions-log]] · [[thesis]]
