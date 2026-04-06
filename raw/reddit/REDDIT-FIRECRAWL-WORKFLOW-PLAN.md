# Reddit + Firecrawl Workflow Plan for TallChairAdvisor

## Recommendation

### Short answer
Yes, this is value-added for TallChairAdvisor, but only if you use it as a **research and evidence pipeline**, not as an automated content-writing pipeline.

### Why it fits this site
- TallChairAdvisor already competes on **spec accuracy** and **tall-person fit analysis**.
- Official chair websites are the best source for **fresh specs, warranty details, feature updates, and product page changes**.
- Reddit is useful for **real owner pain points, durability issues, fit anecdotes, and objection mining** that brand sites and generic review sites usually miss.
- Your existing positioning is already dimension-first and methodology-first, so this workflow strengthens the moat instead of changing the brand.

### Where the value is highest
- **High value:** official site scraping for product specs, dimensions, warranty, materials, pricing snapshots, return policy, and feature updates.
- **Medium value:** Reddit scraping for recurring complaints, tall-user fit anecdotes, FAQ ideas, and comparison language.
- **Low value / risky:** turning scraped Reddit text directly into page copy, auto-publishing summaries, or treating Reddit claims as facts without verification.

## Go / No-Go Decision

### Go, with these rules
1. Official-site data is the **source of record** for factual product claims.
2. Reddit data is a **secondary signal layer** used for themes, objections, and owner-reported issues.
3. Published pages still need **your own fit analysis and editorial judgment**.
4. Every Reddit-derived claim should be phrased as community feedback, not as verified fact.

### No-go conditions
- If the goal is to mass-produce review pages from scraped text.
- If you will not manually review extracted claims before publishing.
- If the workflow does not preserve TallChairAdvisor's first-hand testing angle.

## Workflow

### 1. Maintain a chair source of truth
Create one master list for every model the site covers.

Suggested fields:
- `chair_id`
- `brand`
- `model`
- `review_url`
- `official_domains`
- `official_product_urls`
- `priority`
- `status`
- `reddit_keywords`
- `reddit_subreddits`

Suggested file:
- `data/chairs.json`

### 2. Use Firecrawl for official website coverage
Use Firecrawl to discover and extract only the pages that matter for each chair.

Recommended Firecrawl flow:
1. `map` the brand domain or product subdirectory to find likely URLs.
2. Filter down to product, specs, warranty, returns, and support pages.
3. `batch-scrape` the selected URLs.
4. Use `extract` to normalize fields into a chair schema.
5. Use `crawl` only when a brand site is large and the relevant URLs are not predictable.

Fields to extract from official pages:
- product name
- price
- seat height min/max
- seat depth min/max
- seat width
- back height
- weight capacity
- armrest adjustability
- lumbar details
- upholstery/material options
- warranty length
- return policy
- shipping or trial language
- canonical product URL
- last seen timestamp

Output:
- `data/official/{chair_id}.json`

### 3. Use Apify Reddit actors for community evidence
Use Apify for two separate jobs:

1. **Posts run**
- Search model names and comparison phrases.
- Examples: `steelcase gesture`, `gesture tall`, `aeron size c tall`, `gesture vs aeron`, `leap plus long legs`

2. **Comments run**
- Pull comments for the highest-relevance posts.
- Focus on threads with real ownership signals, fit details, or long-term usage reports.

Recommended subreddit seeds:
- `r/OfficeChairs`
- `r/tall`
- `r/hermanmiller`
- `r/steelcase`
- broader productivity / WFH subreddits only if relevant

Recommended filters:
- exclude deleted/removed content
- exclude very low-score posts
- prefer posts with comments and ownership language
- set a recency window, but allow older evergreen owner threads for premium chairs

Output:
- `data/reddit/raw-posts/{chair_id}.json`
- `data/reddit/raw-comments/{chair_id}.json`

### 4. Normalize and score the Reddit data
Do not send raw Reddit output into publishing.

Create a normalization step that:
- deduplicates near-identical posts
- maps aliases to one chair ID
- scores relevance
- tags fit signals such as `seat_too_low`, `good_for_6_4`, `poor_lumbar`, `armrests_wobble`, `mesh_runs_hot/cool`, `durability_issue`
- separates first-hand ownership comments from speculation
- stores permalink, subreddit, score, author name, created date, and a short excerpt

Suggested output:
- `data/reddit/processed/{chair_id}.json`

### 5. Add a human QA gate
This is the part that makes the workflow actually valuable.

Before anything reaches a published page:
- verify specs against the official source and your own measurements when available
- confirm that Reddit themes are truly recurring, not one-off complaints
- keep a permalink for every community citation
- avoid quoting long passages; summarize themes instead
- label community-derived material clearly, for example: `Common owner-reported complaints`

### 6. Publish the data into the Astro site
Use the scraped data to support existing page types rather than replacing them.

Best uses on TallChairAdvisor:
- review pages: `Common owner feedback`, `What tall Reddit users report`, `Known complaints`
- comparison pages: `Most mentioned tradeoffs`
- micro-pages: FAQ generation, objection handling, fit warnings
- money pages: confidence checks and recurring buyer concerns

Suggested repo targets:
- `src/data/chairs/`
- `src/content/research/`
- `scripts/import-firecrawl.ts`
- `scripts/import-reddit.ts`
- `scripts/build-chair-research.ts`

### 7. Automate the runs
Use Apify's native orchestration features for Reddit collection:
- create one reusable task template per actor
- create one task per chair or per chair family
- run on schedules
- trigger your ingestion endpoint or script with webhooks when runs complete
- store results in named datasets

Suggested cadence:
- official site scrape: weekly for active review targets, monthly for lower-priority models
- Reddit scrape: weekly for priority chairs, monthly for stable evergreen chairs
- manual review: before any page update goes live

### 8. Measure whether it is actually worth continuing
Track whether this workflow changes output quality and business results.

KPIs:
- number of unique recurring owner themes per chair
- time saved updating spec sections
- number of new FAQ or comparison angles discovered
- ranking changes on review and comparison pages
- affiliate CTR from updated pages
- percentage of scraped claims rejected during QA

## Recommended MVP

### Phase 1: prove value on 3 chairs
Run the workflow only for:
- Steelcase Gesture
- Herman Miller Aeron Size C
- Steelcase Leap Plus

Goal:
- prove that the pipeline produces better sections and better update velocity on the pages already driving strategy

### Phase 2: build a reusable schema
Once the first three chairs work, standardize:
- chair ID naming
- official spec fields
- Reddit theme taxonomy
- QA checklist

### Phase 3: expand to new reviews
Use the workflow to support future pages such as:
- Haworth Fern
- Secretlab Titan XL
- height-specific money pages

## Risks to manage
- Reddit overfitting: loud complaints can distort reality.
- Source drift: official brand pages change structure and naming.
- Content quality risk: scraped material can make the site sound generic if it leaks directly into prose.
- Compliance risk: user comments should be summarized carefully and not reproduced excessively.
- Brand conflict: the site should not imply Reddit consensus is equivalent to product testing.

## Questions That Will Tighten The Plan
1. Which Apify Reddit actors do you already use or pay for?
2. Do you want this workflow to end at a research dataset, or should it also generate draft sections for Astro pages?
3. Where do you want the data pipeline to live: inside the `tall-chair-advisor` repo, or in a separate ingestion repo/service?
4. Do you want pricing tracked over time, or only dimensions/specs/community feedback?
5. Do you want Reddit evidence shown publicly on-page, or used only internally for editorial decisions?

## Suggested default if you want me to proceed without waiting
- Keep the pipeline in the Astro repo for now.
- Store normalized JSON under `data/`.
- Use Firecrawl for official pages and Apify for Reddit.
- Treat Reddit as editorial research only.
- Start with the three existing review chairs.

## Source links
- Apify Actor tasks: https://docs.apify.com/platform/actors/running/tasks
- Apify Schedules: https://docs.apify.com/platform/schedules
- Apify Datasets: https://docs.apify.com/platform/storage/dataset
- Apify Webhooks: https://docs.apify.com/platform/integrations/webhooks
- Example Reddit actors: https://apify.com/api-empire/reddit-scraper
- Example Reddit posts actor: https://apify.com/api-empire/reddit-posts-scraper
- Example Reddit comments actor: https://apify.com/api-empire/reddit-comment-scraper
- Firecrawl Map: https://docs.firecrawl.dev/api-reference/endpoint/map
- Firecrawl Scrape: https://docs.firecrawl.dev/api-reference/endpoint/scrape
- Firecrawl Batch Scrape: https://docs.firecrawl.dev/api-reference/endpoint/batch-scrape
- Firecrawl Extract: https://docs.firecrawl.dev/api-reference/endpoint/extract
- Firecrawl Crawl: https://docs.firecrawl.dev/api-reference/endpoint/crawl-post
