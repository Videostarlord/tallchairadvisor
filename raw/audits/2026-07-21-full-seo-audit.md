# Full SEO Audit — tallchairadvisor.com — 2026-07-21

**Command:** `/seo audit tallchairadvisor.com`
**Business type detected:** Publisher / affiliate review site (single-author niche review, Astro SSG on Cloudflare Pages)
**Scope:** All 43 sitemap URLs, fetched via curl/urllib per the CLAUDE.md mandate (never WebFetch for `<head>` content). Six specialist agents run in parallel (technical, content, schema, sitemap, performance, visual) plus an independent orchestrator sweep of on-page and GEO.

**Verification note:** every Critical and High finding below was independently re-verified by the orchestrator against the live site or local source before being recorded. Two agent claims were found wrong and are corrected in-line — see "Agent claims corrected."

---

## SEO Health Score: 76 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 25% | 80 | 20.0 |
| Content Quality | 25% | 62 | 15.5 |
| On-Page SEO | 20% | 88 | 17.6 |
| Schema / Structured Data | 10% | 66 | 6.6 |
| Performance (CWV) | 10% | 88 | 8.8 |
| Images | 5% | 78 | 3.9 |
| AI Search Readiness | 5% | 70 | 3.5 |
| **TOTAL** | | | **75.9 → 76** |

**The headline:** technical execution is genuinely strong — near-perfect on-page hygiene, zero JSON-LD parse errors, zero images missing alt text, CLS measured at 0.0. The score is dragged down almost entirely by **content trust defects**, several of which are live in production and directly contradict the site's own disclosed testing constraint.

---

## CRITICAL

### C1 — Production deploy is stale; GA4 is still blocked

Independently confirmed twice (orchestrator + technical agent).

Commit `db75ffd` ("allow GA4 regional collection endpoints") was pushed 2026-07-18. Production still serves the pre-fix header.

| | `connect-src` |
|---|---|
| **Live** | `'self' https://www.google-analytics.com https://cloudflareinsights.com https://*.clarity.ms https://dc.services.visualstudio.com` |
| **Committed** | `'self' https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://stats.g.doubleclick.net ...` |

`git show 9085eca:public/_headers` matches the live value byte-for-byte — production is pinned to the commit *before* the fix.

**Root cause:** there is no CD workflow in `.github/workflows/`. Cloudflare Pages auto-deploys on push, and **all four commits since the fix carry `[skip cd]`** (`0552366`, `d8f2c3c`, `c134e7e`, `66d8ec9`). Two further commits (`27b556d`, `3505a12`) are unpushed entirely.

**Impact:** GA4 posts to `region1.google-analytics.com` and `stats.g.doubleclick.net`; neither matches the exact-host `www.google-analytics.com` allowance. **The analytics blackout that began ~Jun 16 is ongoing, not fixed.** The "first clean GA4 month in August" assumed in `raw/strategy/2026-07-21-profit-projections-monetization.md` will not happen without a deploy.

**Fix:** trigger a Cloudflare Pages rebuild, then verify: `curl -sI https://tallchairadvisor.com/ | grep -o "connect-src[^;]*;"` should contain `stats.g.doubleclick.net`.

### C2 — `/review/leap-plus/` is structurally destroyed in the repo (not yet live)

`src/pages/review/leap-plus.astro` — line 1 is raw LLM chat output, not the `---` fence:

```
Looking at the file, I need to identify the dead click. The Amazon ASIN `B00TYE4QXU` appears in both CTA buttons — but that ASIN is for the standard Steelcase Leap, not the Leap Plus...
The fix: update both Amazon href instances to use the correct Leap Plus ASIN...
```astro
---
import Layout from '../../layouts/Layout.astro';
```

Because the fence is not at byte 0, Astro never executes the frontmatter. **The build succeeds silently** — no error, 49 pages emitted. The resulting `dist/review/leap-plus/index.html` has **no `<title>`, no meta description, no canonical, and zero JSON-LD blocks**, and renders the chat text as body copy.

This is committed in `3505a12`, which is **unpushed**. Live production is currently clean (verified by curl — the live page has full schema). **The next deploy ships it.** Note the ASIN fix the leaked text describes was never actually applied; `B00TYE4QXU` is still in the file.

This page is the site's #1 click source (34 clicks/90d, 16.3% of all clicks). Shipping it would zero out that page's SEO and remove it from the AI citation pool entirely.

**Fix:** delete lines 1–5 and the trailing fence artifact. Then add a build assertion that every `dist/**/index.html` contains `<title>` and `rel="canonical"` — a silent build pass on a page with neither is the actual systemic failure.

### C3 — `/about/` publishes a fabricated testing protocol (LIVE)

Verified live via curl. `src/pages/about.astro` line 184, under the H3 **"3. Extended daily use — minimum 3 weeks"**:

> "I use every primary review chair as my main seat for at least three weeks of normal daily use before writing a final evaluation."

The **same page**, line 141, states:

> "Hands-on daily use: Steelcase Gesture (personal chair, 2+ years). All other chairs evaluated through manufacturer specifications... **not personal sit-testing**."

Also live on the page: a claim to measure every chair "using a digital caliper and tape measure" (L163–167), pain-tracking across all chairs (L191–192), and "reviews... grounded in physical measurements, extended real-world use" (L147–148).

This is the E-E-A-T authority page, linked sitewide. A quality rater reading top-to-bottom encounters the fabricated protocol (§155–194) before the honest disclaimer buried in a bullet at §141. It is the single highest-risk page on the site and it directly violates the project's own voice rules.

### C4 — Cross-page factual contradiction about the author's own body (LIVE)

Both pages verified live. Same author, same body, same chair, two irreconcilable sets of measurements:

| Page | Inseam | Knee clearance | Verdict |
|---|---|---|---|
| `/review/gesture/` | **32"** | **~3 finger-widths** | "not a borderline fit, a comfortable one" |
| `/office-chairs-for-6-foot-4/` | **34"** | **1.5–2 finger-widths** | "right at the lower threshold of comfort" |

The May 2026 fix corrected the Gesture review but never propagated. The stale figures survive in five places on the 6'4" page — **including inside FAQPage JSON-LD (line 49), which is served directly to Google and AI engines.**

Worse, `/review/gesture/` **contradicts itself**: its Direct Answer capsule still reads *"At 6'4", seat depth is a borderline fit"* while the body four times says the opposite. That capsule is precisely the block AI Overviews extract.

Same failure class: the retracted "break-in period" fabrication survives on `/shoulder-pain-tall-people/` (L273) and propagated as asserted fact to `review/leap-plus.astro` (L116 — in FAQ schema, L282, L322) and `gesture-vs-leap-plus.astro` (L277).

### C5 — `aggregateRating` with `reviewCount: 1` on all 7 rating-bearing pages

Orchestrator parsed the live JSON-LD directly:

| Page | Review rating | AggregateRating |
|---|---|---|
| `/review/aeron-size-c/` | 4.7 | 4.7, reviewCount 1 |
| `/review/leap-plus/` | 4.6 | 4.6, reviewCount 1 |
| `/review/sihoo-doro-s300/` | 3.8 | 3.8, reviewCount 1 |
| `/review/gesture/` | 4.5 | 4.5, reviewCount 1 |
| `/chairs/herman-miller-aeron/` | — | 4.3, reviewCount 1 |
| `/chairs/steelcase-leap-plus/` | — | 4.4, reviewCount 1 |
| `/chairs/steelcase-gesture/` | — | 4.5, reviewCount 1 |

An `AggregateRating` restating a single self-authored review is not an aggregation — it is the textbook review-snippet spam pattern and a known manual-action trigger. This hits `/review/gesture/` too, and it is the one **unambiguous** structured-data violation on the site.

**Fix:** remove `aggregateRating` from all 7. On `/review/gesture/` keep the single `Review` node — a lone genuine critic review is fully snippet-eligible without an aggregate wrapper.

---

## HIGH

### H1 — Five-page commercial orphan island

Confirmed three independent ways (local source grep, live crawl, sitemap agent). Zero inbound internal links sitewide:

- `/heavy-duty-ergonomic-chairs-tall-people/`
- `/monitor-arm-tall-people/`
- `/wide-seat-office-chairs-tall-people/`
- `/office-chair-return-policy/`
- `/best-big-and-tall-office-chairs/` — 1 inbound, from `/wide-seat-.../`, itself an orphan

All five are monetizable pages shipped 2026-07-04, all sitting at sitemap priority `0.3 / yearly`. **The GSC cost is measurable:**

| Page | 90d impressions | Clicks |
|---|---|---|
| `/heavy-duty-ergonomic-chairs-tall-people/` | **not in GSC at all** | — |
| `/wide-seat-office-chairs-tall-people/` | **not in GSC at all** | — |
| `/office-chair-return-policy/` | **not in GSC at all** | — |
| `/monitor-arm-tall-people/` | 13 | 0 |
| `/best-big-and-tall-office-chairs/` | 8 | 0 |
| *Contrast: `/office-chairs-for-6-foot-6/` (well-linked)* | *471* | *13* |

Three of five are invisible to Google entirely. This is the highest-value, lowest-effort fix in the audit.

### H2 — Author page is `noindex`, suppressing the site's strongest E-E-A-T signal

`/author/jackson-christopher/` returns 200 with `<meta name="robots" content="noindex, follow">`. Every `Article` and `Product` on the site carries an author reference (`@id` `.../author/jackson-christopher/#person`) pointing at a page Google is told not to index. `llms.txt` also directs AI crawlers there.

On a site whose entire differentiation is a 6'4" engineer who owns the chair, this hides the credential page. Correctly noindexed and to be left alone: `/contact/`, `/privacy-policy/`, `/affiliate-disclosure/`.

### H3 — FTC affiliate disclosure gaps on 15 monetized pages

**Nine pages with zero body disclosure** (footer link only): `office-chairs-for-6-foot-5` (3 affiliate links), `office-chair-return-policy`, `how-to-adjust-chair`, `leg-pain-circulation`, `office-chair-lower-back-pain-tall-people`, `why-standard-chairs-dont-fit`, `back-pain-spine-height`, `shoulder-pain-tall-people`, `aeron-size-c-vs-leap-plus`.

`office-chairs-for-6-foot-5` is a straight template miss — its four siblings all carry one. The pain-cluster pages monetize health-adjacent YMYL content with no disclosure at all, the worst combination for a rater.

**Six pages with bottom-only disclosure**, ~1,800–1,950 words *after* the first CTA — FTC guidance requires disclosure *before* the endorsement.

Visual agent confirmed the compliance-grade case: on `/office-chairs-for-6-foot-6/` the disclosure sits at **87.1% scroll depth**, 14px, low-contrast gray, as a plain `<p>` — below the affiliate link it qualifies.

### H4 — `/office-chairs-for-6-foot-6/` is effectively unmonetized

Your **best-converting page format** (2.76% CTR, 13 clicks from 471 impressions — 55x `/knee-pain-seat-depth/`) has exactly **one** Amazon link, at **86.8% scroll depth**, rendered as a 242x17px inline text link rather than a button. Against observed scroll depth of 40–70%, essentially no visitor reaches it.

Compare `/review/gesture/`: 4 CTAs, first at 4.2% depth, 288x50px button.

This is a pure revenue leak on the single format with proven conversion.

### H5 — Unpushed duplicate page will re-fragment the consolidated cluster

`src/pages/aeron-size-c-vs-leap-plus.astro` (created 2026-07-20, unpushed, currently 404) duplicates the live `/aeron-vs-leap-plus/`: same two chairs, same audience, same intent, overlapping H2 outline. The live page holds 42 inbound links.

Shipping it re-splits the exact cluster the 2026-07-04 consolidation just merged, and it enters the sitemap with no `lastmod` and priority 0.3. **Merge into the existing URL; do not ship as a separate page.**

### H6 — `http://www.` inbound links take a 3-hop redirect chain

```
http://www.tallchairadvisor.com/review/gesture
  → https://www.tallchairadvisor.com/review/gesture   (HTTPS upgrade)
  → https://tallchairadvisor.com/review/gesture       (www strip)
  → https://tallchairadvisor.com/review/gesture/      (trailing slash)
```

The `_redirects` www rule only matches the https origin. Canonical URLs are all 0-hop, so this affects only legacy backlinks — which are exactly the ones carrying link equity.

### H7 — Merchant-only `Offer` properties on an affiliate site

All 4 review pages declare `hasMerchantReturnPolicy` (30-day, free returns) and `shippingDetails` (free shipping) as though TCA were the seller. It does not fulfil, ship, or accept returns. Remove, or nest under an `Offer` with an explicit `seller`.

### H8 — `/office-chair-return-policy/` has no `BreadcrumbList`, killing its visible nav

Verified by orchestrator census: it is the only content page (besides `/`) lacking `BreadcrumbList`. Because `Layout.astro` L39 derives the **visible** breadcrumb nav from the schema, the page renders with no breadcrumbs at all. It is also an orphan (H1) — compounding.

---

## MEDIUM

- **M1 — Mobile tables clip their verdict column.** `/office-chairs-for-6-foot-6/`: 488px table in a 358px wrapper — 130px hidden, and the hidden column is `Fit at 6'6"`, the verdict. At 4.4% depth, the first content most visitors see. `overflow-x: auto` works but has no scrollbar or fade affordance, so it reads as broken. Money hub has the same pattern (387px in 358px, `Fails At` cut mid-word).
- **M2 — Calculator has zero affiliate links at peak intent.** `/knee-pain-seat-depth/`'s calculator names Leap Plus, Gesture and Aeron with fit verdicts — the highest-intent moment on the site — and contains no Amazon link. The page's only two CTAs sit at 66.6% / 67.2% depth.
- **M3 — 4 pages carry deprecated `HowTo` schema** (retired Sept 2023, renders nothing): `/correct-chair-dimensions/`, `/how-to-adjust-chair/`, `/monitor-arm-tall-people/`, `/standing-desk-height-tall-people/`.
- **M4 — `FAQPage` on 42/43 pages is no longer rich-result eligible** (restricted to government/healthcare since Aug 2023). Not an error; treat as dead payload, not an asset. Keep the visible Q&A content — it is what AI crawlers extract.
- **M5 — Duplicate/conflicting `Cache-Control` on all static assets.** `public, max-age=31536000, immutable, public, max-age=300, must-revalidate` — Cloudflare is concatenating the `/_astro/*` rule and the `/*` catch-all. `must-revalidate` leaks onto content-hashed immutable assets.
- **M6 — Topic cannibalization.** `back-pain-spine-height` ↔ `office-chair-lower-back-pain-tall-people` (both lumbar-by-height). The big/wide/heavy trio all recommend Leap Plus → Aeron C → Gesture in the same order. Body text is not duplicated (no pair above 20% sentence overlap) — this is intent cannibalization.
- **M7 — Breadcrumb `name` conflicts from the consolidation.** `/office-chairs-for-tall-people/` is labeled "Best Office Chairs" on 20 pages and "Office Chairs for Tall People" on 8. The July sweep repointed `item` URLs but left `name` strings.
- **M8 — Sitemap `lastmod` gaps.** Two URLs ship with no `<lastmod>` (`/chairs/herman-miller-aeron/size-guide/`, `/office-chair-return-policy/`); five pages revised 2026-07-20 have no bump, drifting up to 4.5 months. Root cause: `pageLastmod` is a hand-maintained literal map with no build enforcement. Derive from `git log -1 --format=%cI -- <file>` instead.
- **M9 — Thin content on 3 pages:** `/review/aeron-size-c/` (981w vs 1,500 floor, and lowest burstiness on the site at sd 7.3), `/leg-pain-circulation/` (908w), `/refurbished-steelcase-leap-tall-people/` (1,041w).
- **M10 — 8 titles exceed ~60 chars, 10 meta descriptions exceed 160.** Worst: `/heavy-duty-ergonomic-chairs-tall-people/` at 79 chars (loses its entire value prop after the pipe); `/office-chair-return-policy/` meta at 187 chars.
- **M11 — Tenure claims strain plausibility.** "Research tenure: 6+ years" and "started systematically researching chairs in 2019" from a current undergraduate senior. Also "2+ years" Gesture ownership on `/about/` vs "close to a year" on `/review/gesture/`. Recommend dropping the tenure number entirely.

---

## What is genuinely excellent

Worth stating plainly, because the score understates the engineering quality:

- **On-page hygiene is near-perfect.** Across all 43 URLs: zero missing titles, meta descriptions, canonicals, `og:title/description/image`, or `twitter:card`. **All 43 canonicals self-referencing and exactly matching the sitemap URL.** Zero duplicate titles, zero duplicate descriptions, zero missing or multiple H1s.
- **Zero JSON-LD parse errors across all 43 pages.** The April 2026 duplicate-`@type` fix has not regressed.
- **Zero images missing alt text** (11/11), all with explicit `width`/`height`, all `.webp`, hero images with `fetchpriority="high"`.
- **CLS measured at 0.0** across 10 real Playwright captures with zero layout-shift entries.
- **`Person` `@id` is stable and identical across all 43 pages** — the best-executed entity work on the site.
- **Sitemap is clean:** 43/43 return 200, zero redirect hops, all four July consolidation URLs correctly absent and 301'ing single-hop. The no-slash variant `/best-office-chairs` resolves in **one** hop straight to the final target.
- **Zero internal links point at a redirected URL**, and zero omit the trailing slash.
- **AI crawler posture is deliberate:** robots.txt explicitly allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, anthropic-ai. `llms.txt` exists and is high quality — and notably honest about the single-chair testing constraint.
- **Content is genuinely not AI-slop.** 8 benign AI-phrase hits across 49 files; zero instances of *delve, tapestry, seamless, game-changer, in conclusion*. Burstiness median sd 13.1 (healthy human range). Verifiable specificity like *"Across 34 Reddit posts from r/OfficeChairs... 25 confirmed"*.
- **The Gesture review's lived detail is unfakeable** — the "woah out loud" first sit, falling asleep during finals week, the armrest-padding gripe.
- **JS rendering: 24,414 characters of body text in raw HTML** on `/review/gesture/`. Full content to every crawler on first fetch, no render pass needed.
- **The interactive calculator works** — driven end-to-end on mobile touch emulation, zero console errors.

---

## Agent claims corrected

Two specialist findings were wrong and are **not** actioned:

1. **"Remove `*.clarity.ms` from CSP — dead allowance."** False. Microsoft Clarity **is** loaded, inline rather than via a `src` tag, which is why the agent's script-tag scan missed it. Verified: `clarity.ms/tag/` present on `/review/gesture/`. Acting on this would have killed the only currently-working analytics source (GA4 being blocked per C1).

2. **"`Review` schema asserts first-hand testing on untested chairs" framed as Critical.** Overstated. The orchestrator pulled the actual `reviewBody` text — it is careful spec analysis (*"The Aeron Size C delivers exceptional breathability... the fixed 18.5" seat depth is the primary limitation"*) with no sitting claims. Editorial/critic reviews of third-party products are legitimate. The defect is **type-level, not text-level**, and the genuine violation is the `aggregateRating` (C5), not the `Review` node. Do not strip working markup on this basis.

---

## Prioritized action plan

### Critical — before any deploy
1. **Delete lines 1–5 of `src/pages/review/leap-plus.astro`** and verify `dist/review/leap-plus/index.html` has a `<title>`, canonical, and ≥1 `ld+json` block. Add a build assertion for both. *(C2 — blocks the next deploy of your top click page.)*
2. **Do not ship `src/pages/aeron-size-c-vs-leap-plus.astro`** — merge into `/aeron-vs-leap-plus/`. *(H5)*
3. **Trigger a Cloudflare Pages rebuild** to land the CSP fix, then verify `stats.g.doubleclick.net` in the live header. *(C1)*

### Critical — trust (live in production)
4. **Rewrite `about.astro` §"How I Evaluate Chairs" (L155–212)** into two labeled tracks: "Hands-on: Steelcase Gesture" and "Spec + community analysis: everything else." Delete the "minimum 3 weeks" H3 and the caliper claim, or scope both to the Gesture by name. *(C3)*
5. **Reconcile the 6'4" measurements** — `/office-chairs-for-6-foot-4/` lines 49 (JSON-LD, highest priority), 211, 214, 228, 326: 34"→32", 1.5–2→~3 finger-widths. Fix L416's "first-hand fit notes." *(C4)*
6. **Update `review/gesture.astro:181`** Direct Answer capsule to match the corrected finding — it currently contradicts its own page in the block AI Overviews extract. *(C4)*
7. **Delete the break-in fabrication** at `shoulder-pain-tall-people.astro:273`, `review/leap-plus.astro:116/282/322`, `gesture-vs-leap-plus.astro:277`. *(C4)*
8. **Remove `aggregateRating` from all 7 pages.** *(C5)*

### High — this week
9. **Link the 5-page orphan island.** `/wide-seat-.../` + `/heavy-duty-.../` + `/best-big-and-tall-.../` from the body of `/office-chairs-for-tall-people/`; `/monitor-arm-.../` from `/standing-desk-height-.../`; `/office-chair-return-policy/` from all 4 review pages' buying sections. *(H1 — three of these are invisible to Google today.)*
10. **Add a button CTA near the `/office-chairs-for-6-foot-6/` TL;DR (~12% depth)** and convert the 17px inline link to a button. *(H4 — revenue leak on the best-converting format.)*
11. **Port the standard amber disclosure callout above the first CTA** on the 9 zero-disclosure and 6 bottom-only pages. *(H3)*
12. **Flip `/author/jackson-christopher/` to `index, follow`**, add to sitemap, link from every Byline. *(H2)*
13. **Remove `hasMerchantReturnPolicy` + `shippingDetails`** from all 4 `Offer` nodes. *(H7)*
14. **Add `BreadcrumbList` to `/office-chair-return-policy/`** as a top-level array member. *(H8)*

### Medium — this month
15. Inject an affiliate button into the calculator result card. *(M2)*
16. Fix mobile table clipping — stack the verdict column on mobile or add a scroll-shadow affordance. *(M1)*
17. Add manufacturer spec-sheet citations to commercial pages — cheapest available lift on the weakest E-E-A-T factor (Authoritativeness 13/25; only 17 of 49 pages carry any external citation, and **all money pages have zero**).
18. Remove the 4 deprecated `HowTo` blocks. *(M3)*
19. De-duplicate `Cache-Control` in `public/_headers`. *(M5)*
20. Rewrite the 8 long titles and 10 long metas; add the 2 missing `pageLastmod` entries and bump the 5 stale ones. *(M8, M10)*
21. Replace `pageLastmod` with git-derived dates; delete the `priority`/`changefreq` block (Google ignores both, and its fallback tier is mis-ranking the newest commercial pages at 0.3). *(M8)*

### Backlog
22. Add images — **35 of 43 pages have zero.** Only 11 images exist sitewide. This caps Google Images traffic and weakens visual credibility. Original spec/measurement diagrams would fit the research-based voice constraint without implying testing.
23. Refresh the 12 pages stuck at March 2026 `dateModified`, starting with `shoulder-pain-tall-people` and `best-office-chairs-under-500`.
24. Expand `/review/aeron-size-c/` (981w, lowest burstiness on site).

---

## Category detail

**Technical — 80.** Crawlability 95, indexability 88, security 72, URL structure 85, mobile 100, JS rendering 100. Deductions: C1 stale deploy, H1 orphans, H2 author noindex, H6 redirect chain, M5 cache header.

**Content — 62.** E-E-A-T weighted 59/100: Experience 11/20 (the honest pages are excellent; the fabricated ones are net-negative), Expertise 19/25 (genuinely strong ME framing), Authoritativeness 13/25 (weakest — all money pages carry zero external citations), Trustworthiness 16/30. AI-content signals are clean; the risk is factual drift, not style.

**On-Page — 88.** Effectively perfect coverage and uniqueness; deductions only for title/meta length.

**Schema — 66.** Zero parse errors and excellent `@id` entity work, offset by C5 aggregateRating across 7 pages, H7 merchant properties, H8 missing breadcrumb, M3 deprecated HowTo.

**Performance — 88.** CLS 0.0 measured across 10 captures. Brotli (65KB → 17.4KB on `/review/gesture/`), TTFB 0.04–0.27s from edge, total JS = gtag + a 1.6KB module. All images carry explicit dimensions. Field CWV (LCP/INP) not measurable without CrUX access — reported as source-level signals, not fabricated numbers. Watch item: the single render-blocking stylesheet is a shared chunk, so every page pays for every page's CSS; fine at 6.9KB brotli, scales poorly.

**Images — 78.** Perfect execution (100% alt text, dimensions, webp, fetchpriority) on the 11 images that exist — but 35 of 43 pages have none.

**AI Search Readiness — 70.** Strong crawler posture and a high-quality `llms.txt`, and AI referrals are already 17% of sessions. Deductions: **`llms.txt` lists 4 dead URLs** (all 301'd in the July consolidation, including `/best-office-chairs/` as the *first* key page — the consolidation updated nav, breadcrumbs, internal links and sitemap but missed this file); AIO capsules on only 12 of 49 pages; and the C4 contradictions risk the site self-contradicting inside a single AI Overview.
