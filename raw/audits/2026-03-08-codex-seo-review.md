# CODEX SEO REVIEW - 2026-03-08 20:48:07 PDT

## Site
- Domain audited: `https://tallchairadvisor.com`
- Audit run date: March 8, 2026 (PDT)
- Crawl scope: sitemap-driven live crawl + technical checks + template Lighthouse runs

## Method
1. Pulled and parsed sitemap files (`sitemap-index.xml` and `sitemap-0.xml`).
2. Crawled all listed URLs and inspected:
- status codes
- canonicals
- title/meta description
- robots directives
- H1 usage
- JSON-LD schema presence
- internal linking/basic broken link checks
3. Verified host behavior for `http/https` + `www/non-www`.
4. Ran Lighthouse on key templates:
- `/`
- `/best-office-chairs/`
- `/review/leap-plus/`

## Executive Summary
- Core on-page SEO implementation is strong (no missing titles/descriptions, no duplicate title/description groups, canonicals present).
- Primary technical SEO risks are configuration-level, not content-level.
- Highest-impact fixes: broken default social image, `www` host handling, and sitemap/noindex mismatch.

## Findings

### Critical
1. Broken default OG image on most pages
- Finding: `https://tallchairadvisor.com/images/og-default.jpg` returns `404`.
- Impacted pages: 29 pages use this default `og:image`.
- Why this matters: broken social preview images reduce CTR on shared links and weaken social appearance quality.

2. `www` host serves 200 instead of 301 to apex
- Finding: `https://www.tallchairadvisor.com/` responds `200` (not redirect), while canonical points to apex.
- Why this matters: creates duplicate-host crawl paths and can split authority/signals over time.

3. `noindex` URLs are still present in sitemap
- Finding: 3 URLs in sitemap are `noindex, follow`:
  - `/affiliate-disclosure/`
  - `/contact/`
  - `/privacy-policy/`
- Why this matters: conflicting crawl/index signals and unnecessary crawl budget usage.

### High Priority
4. Title length optimization gaps
- Finding: 15 titles are longer than 60 characters; 1 is shorter than 30.
- Why this matters: long titles are more likely to be truncated in SERPs; very short titles usually underperform on CTR/context.

5. Meta description length optimization gaps
- Finding: 15 descriptions exceed 160 chars; 2 are shorter than 120.
- Why this matters: overlong descriptions get truncated; very short descriptions often miss persuasive detail.

6. Performance inconsistency by template
- Lighthouse (mobile/lab):
  - Home: Performance 84, LCP 3.7s
  - Best Office Chairs: Performance 98, LCP 2.0s
  - Review (Leap Plus): Performance 77, LCP 5.4s
- Why this matters: slower templates can suppress rankings and CTR retention from search.

### Medium Priority
7. Schema absent on 3 utility/legal pages
- Finding: no JSON-LD on `contact`, `privacy-policy`, `affiliate-disclosure`.
- Why this matters: low impact for ranking directly on these pages, but consistency can help maintain structured-data hygiene.

8. Weak internal-link depth for some pages
- Finding: several commercial/support pages have only ~2 internal inlinks.
- Why this matters: low internal prominence can reduce discovery/crawl priority and dilute topical hierarchy.

9. One crawled internal endpoint returns 404
- Finding: `/cdn-cgi/l/email-protection` appears as broken target in automated crawl.
- Why this matters: likely Cloudflare obfuscation artifact; low SEO risk, but worth validating contact-link implementation.

## What Is Already Strong
- All sitemap URLs returned 200 in crawl.
- No missing title tags.
- No missing meta descriptions.
- No duplicate title or description groups detected.
- Canonicals are present and self-referencing on crawled URLs.
- H1 usage looked clean across crawled URLs (no missing or multiple H1 cases in the audit set).
- Sitemap and robots are available and readable.

## Recommended Action Plan (Ordered)
1. Fix default OG image path immediately.
- Action: add a valid image at `/images/og-default.jpg` or update default OG image reference to an existing asset.
- Why first: fast win with direct social CTR impact across most pages.

2. Enforce single-host redirect policy.
- Action: 301 redirect all `www` requests to `https://tallchairadvisor.com`.
- Why second: prevents host-level duplication and consolidates link equity.

3. Remove `noindex` URLs from sitemap generation.
- Action: exclude legal/utility pages marked `noindex` from sitemap output.
- Why third: aligns crawl/index signals and cleans technical SEO hygiene.

4. Rewrite metadata lengths on priority pages.
- Action: trim overlong titles/descriptions and expand short ones with intent-driven messaging.
- Why: improves SERP presentation and potential CTR without major dev effort.

5. Improve LCP on slower templates (starting with review pages).
- Action: prioritize hero image optimization + reduce unused JS payload.
- Why: closes performance gap where rankings/engagement are most at risk.

6. Increase internal links to under-linked money pages.
- Action: add contextual links from hub pages and relevant guides/reviews.
- Why: boosts crawl priority and topical authority flow.

## Suggested 7-Day Execution Sprint
1. Day 1: OG image fix + deploy.
2. Day 2: `www -> apex` 301 rule + verify with header checks.
3. Day 3: sitemap cleanup for noindex pages + resubmit sitemap in GSC.
4. Day 4-5: metadata rewrite pass for top pages by impressions.
5. Day 6-7: review-template performance pass and internal-link reinforcement.

## Validation Checklist After Changes
- `curl -I https://www.tallchairadvisor.com/` shows `301` to apex.
- `https://tallchairadvisor.com/images/og-default.jpg` returns `200`.
- No `noindex` URLs appear in sitemap.
- Updated titles/descriptions are visible in rendered HTML.
- Lighthouse rerun on `/review/leap-plus/` shows improved LCP/performance.

## Notes for Claude Ingestion
- This report is based on live responses from `tallchairadvisor.com` at audit time.
- Prior claim that the site had zero meta descriptions is not supported by this crawl; descriptions were present across crawled URLs.
