---
type: concept
last_updated: 2026-07-21
sources: [raw/audits/2026-07-21-full-seo-audit.md]
tags: [performance, cwv, lcp, inp, cls, fonts, third-party]
---

# Core Web Vitals & Performance

Baseline established by the 2026-07-21 full SEO audit. Lighthouse 13.4.1 (mobile, 4x CPU, Slow-4G) across 8 pages, plus CDP Event Timing instrumentation and curl across all 43 URLs.

## Lab baseline — all three CWV pass on every page sampled

| Page | Score | LCP | TBT | CLS |
|---|---|---|---|---|
| `/review/gesture/` | 99 | 1,725 ms | 37 | 0.003 |
| `/review/leap-plus/` | 99 | 1,742 ms | 74 | 0.002 |
| `/office-chairs-for-tall-people/` | 98 | 1,900 ms | 105 | 0.003 |
| `/knee-pain-seat-depth/` | 98 | 1,980 ms | 46 | 0.037 |
| `/` | 98 | 1,982 ms | 112 | 0.049 |
| `/review/aeron-size-c/` | 98 | 1,756 ms | 130 | 0.003 |
| `/office-chairs-for-6-foot-6/` | 97 | 1,722 ms | 88 | **0.075** |
| `/chairs/steelcase-gesture/seat-depth/` | 97 | 1,731 ms | 147 | 0.003 |

**Interaction latency** (CDP Event Timing, headful, 82 events across the full calculator sweep): **88 ms at 4x CPU, 104 ms at 6x**. The calculator's JS is cheap — the `innerHTML` rebuild of 5 chair cards costs single-digit ms.

**All 43 URLs:** 200, brotli, 8.4–17.0 KB, **TTFB 50–79 ms, `cf-cache-status: HIT`**. Server response is not a problem anywhere.

## ⚠️ No field data exists

No Google API key in the repo (`.env` has Apify/Anthropic/SerpAPI/Firecrawl/DataForSEO/Clarity only); anonymous PageSpeed quota returns `429`. **Everything above is lab-measured. There is zero real-user 75th-percentile data**, so whether the site passes CWV in Search Console is unknown.

**Getting a CrUX API key is the single highest-value unblock for performance work.**

## RULES for measuring this site

- **Never measure INP in headless Chrome.** The audit's first runs produced a constant ~560 ms presentation delay that did not scale with CPU throttling (identical at 1x and 6x) — a headless artifact. Headful gave 88 ms for the same interactions.
- **Never trust a single Lighthouse run.** Variance is ±700 ms on LCP; the homepage produced 87/98/98 across three runs (LCP 3,786/1,752/1,982). Take a median of 3.
- **Use INP, never FID.** FID was removed from all Chrome tooling 2024-09-09.

## 🔴 CRITICAL — body font-family is invalid CSS; the site renders in Times

`tailwind.config.mjs:9` declares `sans: ["Source Sans 3", "system-ui", "sans-serif"]`. Tailwind emits it **unquoted**:

```css
body{...;font-family:Source Sans 3,system-ui,sans-serif;...}
```

An unquoted `<family-name>` must be a sequence of `<custom-ident>`. The bare `3` is a number token, so the value is a parse error and **Chrome discards the entire declaration**. Verified in real Chromium on live `/review/gesture/`:

```
bodyComputedFontFamily:  Times
unquotedParsesTo:        ""                                      ← rejected
quotedParsesTo:          "Source Sans 3", system-ui, sans-serif  ← valid
bodyRuleHasFontFamily:   False
fontsLoaded:             ['Playfair Display 500','Playfair Display 600']  ← 2 of 26 faces
```

**Every visitor reads body copy in Times.** Headings render correctly in Playfair Display, so the site reads as deliberately serif rather than obviously broken — which is why it went unnoticed. Source Sans 3 never downloads; `dist/_astro/` ships 28 unused Source Sans font files.

**Fix:** `sans: ['"Source Sans 3"', "system-ui", "sans-serif"]`, then verify the minified output keeps the quotes.

**RULE: ship this together with the Playfair preload below.** Fixing it adds two font downloads and will likely *increase* CLS — shipping it alone trades a rendering fix for a CWV regression.

## Open performance issues

**HIGH — third-party is 63–73% of page weight.** `gtag/js` 164.5 KB transfer (**64 KiB unused**), Clarity 25.2 KB + sync pixels, **Cloudflare Insights 11.6 KB — a third analytics tool alongside GA4 and Clarity**. On `/knee-pain-seat-depth/`: 74 KB first-party vs 204.6 KB third-party. Only `googletagmanager.com` has a preconnect; Clarity is an un-preconnected two-hop chain. Removing Cloudflare Insights and deferring Clarity returns ~37 KB and 20–36 ms main thread per page.

**HIGH — heroes 3.5–4.5x oversized, zero `srcset` sitewide.** Against a 380 CSS px slot: `aeron-size-c-hero.webp` 1600×1600 (159 KB wasted), `leap-plus-hero.webp` 1920×1080 (148 KB wasted). Lighthouse estimates 203 KiB / 232 KiB savings on the two review pages. These live in `public/` and bypass Astro's image pipeline — move to `astro:assets` `<Picture>` for automatic srcset + AVIF.

**HIGH — aspect-ratio mismatch on every content image (latent CLS).** All images carry `width`/`height` but the ratios don't match the files; Tailwind preflight's `img{height:auto}` means the attributes only set the placeholder ratio. `/review/aeron-size-c/` jumps **+127 px** on load. *Caveat: not reproducible as measured CLS today* (0.0001–0.0004) because heroes are preloaded and land before first paint. Latent, not firing. Fix the attributes to true intrinsic ratios.

**MEDIUM — 100% of measured CLS is Playfair font swap.** Worst is `/office-chairs-for-6-foot-6/` at **0.075**, 75% of the way to the threshold. The two woff2 files are not preloaded, discovered at ~113–150 ms after CSS parse. Fix: `<link rel="preload" as="font" type="font/woff2" crossorigin>` in `Layout.astro`.

**MEDIUM — `preloadImage` targets the wrong element.** Lighthouse LCP attribution: **the LCP element is text on all 8 pages measured — never an image.** `/` preloads a 128×128 author avatar at `fetchpriority="high"` starting at 63 ms, *ahead of the stylesheet at 66 ms*. Since LCP is text, the real lever is CSS + font delivery. Drop `preloadImage` from `index.astro:88`.

**MEDIUM — render-blocking CSS discovered late.** The stylesheet (6.9 KB brotli) is emitted after gtag, inline configs, JSON-LD and the Clarity loader. Lighthouse estimates 150–320 ms from a free reorder to the top of `<head>`. Test `inlineStylesheets: 'always'`.

**MEDIUM — duplicated `Cache-Control`** (see [[deploy-pipeline-integrity]]).

## Confirmed non-issues

- **The calculator does not cause CLS.** 0.035 idle vs 0.203 including post-click; the 0.168 delta is entirely `hadRecentInput: true`, excluded from CLS by definition. No change needed. *(Latent risk only if a future reveal moves behind an async boundary >500 ms after click.)*
- **DOM size 292–504 elements** vs a 1,500 threshold.
- **HTTP/2 confirmed.** Brotli on. HTML edge TTL 300 s, fine given 50–79 ms TTFB.

## Links

- [[deploy-pipeline-integrity]] — the `Cache-Control` defect and deploy verification rules
- [[ga4-performance]] — gtag is the single largest third-party cost
