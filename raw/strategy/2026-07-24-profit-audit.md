# Profit-Obsessed Contractor Audit — 2026-07-24

**Frame:** "If a contractor did nothing but obsess over making this the most profitable site ever, what would they say, what are the immediate next steps, and what must I absolutely stop doing?"

**Decision status:** ADOPTED as the routing logic for all future "next steps" queries as of 2026-07-24.

---

## One-sentence verdict

Jackson built a world-class traffic engine and bolted it to a broken cash register. Traffic is the thing that's working. Everything between "impression" and "dollar" is severed in two places, and effort has been going into the half that's already fixed.

## The brutal math (the whole story)

| What exists | What it should produce | What it produces |
|---|---|---|
| 95,251 impressions/mo (2026-07-23) | ~1,400 clicks (1.5% CTR at pos 8) | **206 clicks** |
| `/knee-pain-seat-depth/` — 38,990 impr @ pos 5.7 | ~2,000 clicks (pos 5 ≈ 5%) | **18 clicks (0.05% CTR)** |
| First profitable month ever (Jul 17) | — | **+$36.06** |

The single biggest page — 41% of total site impressions — converts at 0.05%. It ranks beautifully for an informational query ("knee pain seat depth") that Google answers in an AI Overview and whose searchers aren't holding a credit card. Won the wrong race, brilliantly.

The actual money pages are quietly working and starved of attention:
- `/review/leap-plus/` — 34 clicks, 0.28% CTR, pos 8.7
- `/review/aeron-size-c/` — 21 clicks, **0.44% CTR**, pos 10.9
- `/office-chairs-for-tall-people/` — 18 clicks, **0.55% CTR**, pos 8.1
- `/best-office-chairs-under-500/` — 11 clicks, **0.85% CTR**, pos 9.1
- `/chairs/herman-miller-aeron/tall-people/` — 13 clicks, **0.92% CTR**, pos 8.2

These CTRs are 10-17x the knee-pain page because they're buyer-intent queries on escapable SERPs.

## The two severed links

1. **Impression → click** is severed by SERP structure (AI Overviews on informational/spec queries, shopping carousels on money queries). 0.22% site CTR vs ~2-3% benchmark at pos 8. Capturing ~14% of a normal click rate.
2. **Click → dollar** is severed by monetization structure: Amazon 3% furniture needs ~167x current traffic for $100/mo; one $610 chair return wipes a month.

Both severed links point at the SAME conclusion: stop growing impressions, start converting the traffic already present.

## Immediate next steps (profit-only priority order)

1. **Freeze new content for ~30 days.** The traffic to make money is already on the site. Page #48 is malpractice while #1-47 leak 86% of clicks.
2. **Triage every page by `buyer-intent × escapable-SERP × position`.** Surfaces ~6 pages that deserve 100% of revenue effort. Knee-pain / correct-chair-dimensions / spec sub-pages are impression vanity — keep for topical authority, stop optimizing for clicks.
3. **Fix the cash register, not the CTR.** Execute the already-decided monetization pivot NOW instead of writing articles: apply to Humanscale / Crandall / FlexiSpot, ship per-page tracking IDs, add "Also available at [direct program]" CTAs on the 6 money pages. (Do NOT remove Amazon links.)
4. **Own the audience — email capture on the traffic that can't monetize.** Knee-pain page can't sell a chair, but 39k monthly readers at 62% scroll depth can join a list. Highest-ROI use of the worst-converting page. Thesis item #1, still unbuilt.
5. **Buy ranking lift where SERP is escapable.** `/review/leap-plus/` pos 8.7 → 5 beats any meta tweak on any AIO-suppressed page.

## What to ABSOLUTELY STOP

1. **Stop treating impression growth as success.** 12x impressions in 10 weeks, revenue flat. The only numbers that pay rent: clicks-to-buyer-pages and EPC.
2. **Stop farming AI-Overview-eaten informational queries** (knee pain, correct dimensions, spec pages). `what-failed.md` proves 3x you cannot meta-tweak into an AI Overview.
3. **Stop tweaking meta descriptions on suppressed pages.** Documented dead lever, wrong diagnosis.
4. **Stop being 100% dependent on Google CTR + Amazon 3%** — two structurally rigged things you don't control. Email + direct programs are the escape.
5. **Stop spreading effort across 47 pages.** Concentrate on the ~6 that convert.

## Why this is a good problem

Sites die from no traffic. TCA has the opposite: a proven demand engine and a monetization layer not yet switched on. The plan is not "work harder" — it's "stop admiring the impression graph and convert what's already there."
