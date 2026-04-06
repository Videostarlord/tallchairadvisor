# Next Session Handoff: Reddit + Firecrawl Workflow

## Goal
Build a workflow for TallChairAdvisor that:
- scrapes Reddit discussions about reviewed chairs using Apify Reddit actors
- scrapes official chair websites using Firecrawl
- turns both into structured research that improves review, comparison, and FAQ content

## Decision Reached
This is worth doing, with an important constraint:
- **Official-site scraping is high value** and should be the factual source of record.
- **Reddit scraping is medium value** and should be used as an editorial research layer, not as raw page copy.
- The workflow should support TallChairAdvisor's existing moat: spec accuracy, tall-person fit analysis, and first-hand testing.

## Why This Fits TallChairAdvisor
Relevant local context already reviewed:
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/SEO-STRATEGY.md`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/SESSION-CONTEXT.md`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/index.astro`
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/src/pages/author/jackson-christopher/index.astro`

Key fit:
- the site already competes on dimension-first analysis
- official brand pages help keep specs, warranty, and return details fresh
- Reddit helps surface recurring owner complaints, tall-user anecdotes, and comparison angles competitors miss

## Main Plan File Created
Reference this first next session:
- `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/Codex Reddit:Apify Results/REDDIT-FIRECRAWL-WORKFLOW-PLAN.md`

That file includes:
- go / no-go recommendation
- Firecrawl workflow
- Apify Reddit workflow
- normalization and QA design
- Astro integration points
- automation and KPI ideas
- MVP scope

## Recommended MVP
Start with the 3 existing review targets:
- Steelcase Gesture
- Herman Miller Aeron Size C
- Steelcase Leap Plus

Recommended default assumptions if no new preference is given:
- keep the pipeline inside the `tall-chair-advisor` repo
- store normalized data as JSON under `data/`
- use Firecrawl for official pages and Apify for Reddit
- treat Reddit as editorial research, not source-of-truth content

## Proposed Implementation Shape
Likely repo: `/Users/jacksonchristopher/Downloads/Claude TCA Workspace/tall-chair-advisor/`

Likely files to add next:
- `data/chairs.json`
- `data/official/*.json`
- `data/reddit/raw-posts/*.json`
- `data/reddit/raw-comments/*.json`
- `data/reddit/processed/*.json`
- `scripts/import-firecrawl.ts`
- `scripts/import-reddit.ts`
- `scripts/build-chair-research.ts`

## Best Next Steps
1. Confirm the Apify Reddit actor(s) you already use.
2. Decide whether the workflow should stop at research JSON or also generate draft page sections.
3. Decide whether Reddit findings should appear publicly on pages or stay internal.
4. Scaffold the chair registry and import scripts in the Astro repo.
5. Run the pipeline on Gesture, Aeron Size C, and Leap Plus first.

## Open Questions To Answer Next Session
1. Which Apify Reddit actor(s) do you already use or pay for?
2. Should the pipeline end at a research dataset, or also generate draft sections for Astro pages?
3. Should Reddit findings appear publicly on-page, or be used only internally?
4. Do you want price tracking over time, or only specs plus community feedback?
5. Should this live in the Astro repo or a separate ingestion repo/service?

## Docs Already Verified
- Apify Actor tasks: https://docs.apify.com/platform/actors/running/tasks
- Apify Schedules: https://docs.apify.com/platform/schedules
- Apify Datasets: https://docs.apify.com/platform/storage/dataset
- Apify Webhooks: https://docs.apify.com/platform/integrations/webhooks
- Firecrawl Map: https://docs.firecrawl.dev/api-reference/endpoint/map
- Firecrawl Scrape: https://docs.firecrawl.dev/api-reference/endpoint/scrape
- Firecrawl Batch Scrape: https://docs.firecrawl.dev/api-reference/endpoint/batch-scrape
- Firecrawl Extract: https://docs.firecrawl.dev/api-reference/endpoint/extract
- Firecrawl Crawl: https://docs.firecrawl.dev/api-reference/endpoint/crawl-post

## Resume Prompt
Use this next time:

`Continue the Reddit + Firecrawl workflow work for TallChairAdvisor. Start by reading NEXT-SESSION-HANDOFF.md and REDDIT-FIRECRAWL-WORKFLOW-PLAN.md, then implement the MVP in the Astro repo.`
