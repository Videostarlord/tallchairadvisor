---
type: concept
last_updated: 2026-05-11
sources: [raw/audits/2026-05-11-index-monitor.md]
tags: [indexing, gsc, coverage, technical-seo]
---

# Indexing Health

Last checked: **2026-05-11**

## Current Status

| Metric | Value |
|--------|-------|
| Total pages | 45 |
| Indexed | 33 |
| Issues | 12 |

## Pages With Issues

- **https://tallchairadvisor.com/404/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/affiliate-disclosure/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/contact/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/leg-pain-circulation/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/privacy-policy/** — noindex — Page has a noindex directive (meta robots or x-robots-tag). If unintentional, remove it from the source file. Coverage state: "Excluded by ‘noindex’ t
- **https://tallchairadvisor.com/author/jackson-christopher/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/** — wait — Non-critical or unknown issue. Coverage: "Crawled - currently not indexed", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "SUCCESSFUL".
- **https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/** — wait — Non-critical or unknown issue. Coverage: "Crawled - currently not indexed", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "SUCCESSFUL".
- **https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/** — wait — Non-critical or unknown issue. Coverage: "Crawled - currently not indexed", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "SUCCESSFUL".
- **https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC

## Not Yet Indexed (waiting)

- https://tallchairadvisor.com/404/ — URL is unknown to Google
- https://tallchairadvisor.com/affiliate-disclosure/ — URL is unknown to Google
- https://tallchairadvisor.com/contact/ — URL is unknown to Google
- https://tallchairadvisor.com/leg-pain-circulation/ — URL is unknown to Google
- https://tallchairadvisor.com/author/jackson-christopher/ — URL is unknown to Google
- https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/ — Crawled - currently not indexed
- https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ — URL is unknown to Google
- https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/ — Crawled - currently not indexed
- https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/ — Crawled - currently not indexed
- https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/ — URL is unknown to Google
- https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/ — URL is unknown to Google

## Known Gap — No Automatic URL Submission on Deploy

`verify-deploy.ts` does not submit new URLs to Google after a Cloudflare Pages deploy. New pages are discovered passively via sitemap crawl, which can take days to weeks. This is the likely cause of the 11 "URL is unknown to Google" entries above — pages that have been live but never actively submitted.

**What needs to be added:** After a successful deploy in `verify-deploy.ts`, call the GSC Indexing API (or URL Inspection API's `runInspection` endpoint) to submit each newly created page URL. Newly written pages from `execute-content.ts` are the primary target — they should be submitted immediately after Saturday's deploy.

**Priority:** Medium. Not blocking, but slows the feedback loop between publishing and getting GSC data back.

## Fix History

| Date | Page | Fix Type | Result |
|------|------|----------|--------|
| 2026-05-11 | — | — | No fixes needed |
