---
type: concept
last_updated: 2026-05-15
sources: [raw/misc/2026-05-15-dataforseo-v3-reference.md, scripts/keyword-discovery.ts, package.json]
tags: [dataforseo, keyword-research, serp, ai-search, docs]
---

# DataForSEO Reference

Canonical wiki page for any TCA work that touches DataForSEO. Read this before modifying `scripts/keyword-discovery.ts` or adding new DataForSEO integrations.

## Current TCA Usage

| Area | Current state |
|------|---------------|
| Script | `npm run keyword:discovery` → `scripts/keyword-discovery.ts` |
| Auth in repo | `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD`, optional `DATAFORSEO_SANDBOX=false` |
| Official auth model | API login + API password from the DataForSEO dashboard, sent via HTTP Basic Auth |
| Default mode | **Sandbox by default**; production only when `DATAFORSEO_SANDBOX=false` |
| Current endpoint | `dataforseo_labs/google/keyword_overview/live` |
| Seed sources | `data/gsc/latest.json` + `data/competitors/intelligence.json` |
| Current outputs | `data/keywords/raw/*.json`, `data/keywords/opportunities.json`, `wiki/pages/concepts/keyword-opportunities.md`, `wiki/log.md` |

## Read First

Use these official pages before any implementation work:

| Purpose | Official doc |
|---------|--------------|
| Product entry point | `Introduction` — https://docs.dataforseo.com/v3.md |
| Authentication | `Authentication` — https://docs.dataforseo.com/v3/auth.md |
| Safe testing | `Sandbox` — https://docs.dataforseo.com/v3/appendix/sandbox.md |
| Error handling | `Errors` — https://docs.dataforseo.com/v3/appendix/errors.md |
| Account / quota checks | `User Data` — https://docs.dataforseo.com/v3/appendix/user_data.md |
| LLM-friendly responses | `AI-optimized API response` — https://docs.dataforseo.com/v3/appendix/ai_optimized_response.md |

## TCA-Priority APIs

These are the DataForSEO products future agents should prefer for TCA.

| Priority | Product | What to use it for | Official docs |
|----------|---------|--------------------|---------------|
| 1 | DataForSEO Labs | Monthly keyword discovery, competitor keyword gaps, ranking/traffic research | `overview`, `filters`, `locations_and_languages`, `google/keywords_for_site`, `related_keywords`, `keyword_suggestions`, `keyword_ideas`, `bulk_keyword_difficulty`, `search_intent`, `keyword_overview`, `ranked_keywords`, `competitors_domain`, `relevant_pages`, `historical_serps`, `bulk_traffic_estimation` |
| 2 | SERP API | Live Google SERP snapshots, AI Mode checks, screenshots, AI summary, autocomplete | `serp/overview`, `serp/screenshot`, `serp/ai_summary`, `serp/google/organic/live/advanced`, `serp/google/organic/live/html`, `serp/google/ai_mode/live/advanced`, `serp/google/ai_mode/live/html`, `serp/google/autocomplete/live/advanced` |
| 3 | Keywords Data API | Search volume and CPC validation on shortlisted topics | `keywords_data/overview`, `google_ads/search_volume/live`, `google_ads/keywords_for_site/live`, `google_ads/keywords_for_keywords/live`, `google_trends/explore/live`, `clickstream_data/*` |
| 4 | AI Optimization API | AI-search demand, LLM mentions, GEO monitoring, benchmarking model outputs | `ai_optimization/overview`, `ai_keyword_data/keywords_search_volume/live`, `llm_mentions/*`, `chat_gpt/llm_scraper/live/advanced`, `claude/llm_responses/live`, `gemini/llm_scraper/live/advanced`, `perplexity/llm_responses/live` |
| 5 | OnPage API | Site-wide crawl checks, structured data validation, page parsing, Lighthouse | `on_page/overview`, `task_post`, `summary`, `pages`, `links`, `microdata`, `content_parsing/live`, `page_screenshot`, `lighthouse/live/json` |

## Default Use Rules

1. **Prefer Live endpoints** for TCA unless there is a strong reason to use task POST / tasks ready / task GET.
2. **Use Google + United States + English by default.** TCA is US-focused and the existing script already assumes that.
3. **Use sandbox for structural testing.** Switch to production only for approved runs with a cost estimate.
4. **Save raw responses before scoring or filtering.** Do not reduce DataForSEO to a top-20 list without preserving the source payload.
5. **Keep credentials in env vars only.** Do not paste login/password or Basic Auth strings into prompts, docs, or committed files.
6. **Do not enable IP allowlisting by default.** It is unnecessary for local dev and can break automation unexpectedly.

## Official Auth Notes

- DataForSEO does **not** use a separate API key. It uses API login + API password from the dashboard.
- The API password is **not** the same as the normal account password.
- The repo currently maps those credentials to `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD`.
- Any future agent adding a new script should keep the same env-var convention unless there is a coordinated migration.

## Endpoint Selection Guide

Use this when deciding what to call:

| Need | Best endpoint family |
|------|----------------------|
| Expand TCA's current topic universe | DataForSEO Labs Google `keyword_ideas`, `keyword_suggestions`, `related_keywords` |
| Find what a competitor ranks for | DataForSEO Labs Google `ranked_keywords`, `keywords_for_site`, `relevant_pages` |
| Score a shortlist for feasibility | DataForSEO Labs Google `bulk_keyword_difficulty`, `search_intent`, `keyword_overview` |
| Verify raw volume / CPC | Keywords Data Google Ads `search_volume` |
| See the actual live SERP layout | SERP Google Organic Live Advanced / HTML |
| Check AI Overview / AI Mode behavior | SERP Google AI Mode Live, SERP AI Summary, AI Optimization `llm_mentions` |
| Audit a page or site technically | OnPage `summary`, `pages`, `links`, `microdata`, `content_parsing`, Lighthouse |

## Lower-Priority / Usually Ignore

These products are valid but should not be pulled into TCA work unless explicitly requested:

- Merchant API
- App Data API
- Business Data API
- Non-Google SERP engines
- Finance, Maps, Local Finder, News, Events, Images, Search By Image, Jobs, Dataset endpoints

## Related Files

- `scripts/keyword-discovery.ts` — current DataForSEO integration
- `data/keywords/opportunities.json` — scored shortlist
- `data/keywords/raw/` — raw response payloads saved by the current script
- `wiki/pages/concepts/keyword-opportunities.md` — current monthly output
- `wiki/pages/concepts/systems-architecture-audit-2026-05-13.md` — strategic reason DataForSEO was added

## Related Pages

- [[keyword-opportunities]]
- [[systems-architecture-audit-2026-05-13]]
- [[workflow-system-reference]]
- [[content-gap-engine]]
