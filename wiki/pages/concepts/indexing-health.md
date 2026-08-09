---
type: concept
last_updated: 2026-08-09
sources: [raw/audits/2026-08-06-index-monitor.md]
tags: [indexing, gsc, coverage, technical-seo]
---

# Indexing Health

Last checked: **2026-08-06**

## Current Status

| Metric | Value |
|--------|-------|
| Astro pages | 54 |
| Redirect sources checked | 10 |
| Indexed | 45 |
| Page issues | 9 |
| Redirect issues | 10 |

## Page Issues

- **https://tallchairadvisor.com/404/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/affiliate-disclosure/** — noindex — Page has a noindex directive (meta robots or x-robots-tag). If unintentional, remove it from the source file. Coverage state: "Excluded by ‘noindex’ t
- **https://tallchairadvisor.com/contact/** — noindex — Page has a noindex directive (meta robots or x-robots-tag). If unintentional, remove it from the source file. Coverage state: "Excluded by ‘noindex’ t
- **https://tallchairadvisor.com/lumbar-support-tall-people/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/office-chair-return-policy/** — wait — Page is queued for indexing but hasn't been crawled yet. Sitemap resubmission will help. Coverage: "Discovered - currently not indexed".
- **https://tallchairadvisor.com/privacy-policy/** — noindex — Page has a noindex directive (meta robots or x-robots-tag). If unintentional, remove it from the source file. Coverage state: "Excluded by ‘noindex’ t
- **https://tallchairadvisor.com/standing-desk-height-tall-people/** — wait — Non-critical or unknown issue. Coverage: "Crawled - currently not indexed", IndexingState: "INDEXING_ALLOWED", FetchState: "SUCCESSFUL".
- **https://tallchairadvisor.com/author/jackson-christopher/** — wait — Non-critical or unknown issue. Coverage: "URL is unknown to Google", IndexingState: "INDEXING_STATE_UNSPECIFIED", FetchState: "PAGE_FETCH_STATE_UNSPEC
- **https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/** — wait — Page is queued for indexing but hasn't been crawled yet. Sitemap resubmission will help. Coverage: "Discovered - currently not indexed".

## Redirect Source Issues

- **https://tallchairadvisor.com/author/marcus-reid** — Redirect source: URL is unknown to Google. Destination may not be indexed yet. Coverage: "URL is unknown to Google".
- **https://tallchairadvisor.com/author/marcus-reid/** — Redirect error on this source URL. Check public/_redirects — the chain may be broken or loop. Coverage: "Redirect error", FetchState: "REDIRECT_ERROR"
- **https://tallchairadvisor.com/best-office-chairs/** — Redirect source: Page with redirect. Destination may not be indexed yet. Coverage: "Page with redirect".
- **https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/** — Redirect source: Crawled - currently not indexed. Destination may not be indexed yet. Coverage: "Crawled - currently not indexed".
- **https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/** — Redirect source: Crawled - currently not indexed. Destination may not be indexed yet. Coverage: "Crawled - currently not indexed".
- **https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/** — Redirect source: Crawled - currently not indexed. Destination may not be indexed yet. Coverage: "Crawled - currently not indexed".
- **https://tallchairadvisor.com/best-office-chairs** — Redirect source: Crawled - currently not indexed. Destination may not be indexed yet. Coverage: "Crawled - currently not indexed".
- **https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height** — Redirect source: URL is unknown to Google. Destination may not be indexed yet. Coverage: "URL is unknown to Google".
- **https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height** — Redirect source: URL is unknown to Google. Destination may not be indexed yet. Coverage: "URL is unknown to Google".
- **https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people** — Redirect source: URL is unknown to Google. Destination may not be indexed yet. Coverage: "URL is unknown to Google".

## Not Yet Indexed (waiting)

- https://tallchairadvisor.com/404/ — URL is unknown to Google
- https://tallchairadvisor.com/lumbar-support-tall-people/ — URL is unknown to Google
- https://tallchairadvisor.com/office-chair-return-policy/ — Discovered - currently not indexed
- https://tallchairadvisor.com/standing-desk-height-tall-people/ — Crawled - currently not indexed
- https://tallchairadvisor.com/author/jackson-christopher/ — URL is unknown to Google
- https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ — Discovered - currently not indexed

## Fix History

| Date | Page | Fix Type | Result |
|------|------|----------|--------|
| 2026-08-06 | — | — | No fixes needed |

## Sitemap submission is now automated — P2, 2026-08-09

Two entries above say "Sitemap resubmission will help". That is now a step in Saturday's deploy rather than a manual action: `scripts/gsc-sitemap.ts` (`npm run gsc:sitemap`) submits `sitemap-index.xml` and then reads back `sitemaps.get` to assert `lastSubmitted` advanced and that errors and warnings are zero — `sitemaps.submit` returns 204, which proves only that a request was accepted, not that Google recorded anything.

It runs from the deploy, not the nightly: resubmitting is only meaningful after a deploy changes the sitemap, and the nightly changes no pages.

**`siteFullUser` is sufficient — verified, not assumed.** The service account holds `siteFullUser`, and the common reading of Google's docs is that `sitemaps.submit` requires `siteOwner`. A real submit on 2026-08-09 succeeded, advancing `lastSubmitted` from `2026-08-06T09:49:58Z` to `2026-08-09T06:42:02Z` with zero errors. No permission change is needed; recorded here so it does not become a phantom blocker.

**Set expectations: this will not fix the two "Discovered - currently not indexed" URLs.** The sitemap was already submitted and Google refetches on its own schedule. Those are crawl-priority cases — a content-authority problem, not a submission problem. Automating "Request Indexing" was considered and rejected: no public API (the Indexing API is restricted to `JobPosting`/`BroadcastEvent`), and automating clicks in Google's own UI sits in a gray area under their automated-access policy, with Jackson's account as the thing at risk.

Also observed on 2026-08-09: two legacy sitemaps are still registered on the property — `sitemap.xml` (submitted 2026-03-12) and `sitemap-0.xml` (2026-03-02). Both report zero errors and neither is referenced by the current build. Not acted on; `sitemap-index.xml` is the live one.
