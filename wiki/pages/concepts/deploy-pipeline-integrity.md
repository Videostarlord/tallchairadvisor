---
type: concept
last_updated: 2026-07-22
sources: [raw/audits/2026-07-21-full-seo-audit.md]
tags: [deploy, cloudflare-pages, ci-cd, build-gates, infrastructure]
---

# Deploy Pipeline Integrity

How code actually reaches production, and the two ways it has silently failed. Established by the 2026-07-21 full SEO audit.

## How deployment works

There is **no CD workflow** in `.github/workflows/` (only the data/agent workflows: monday, tuesday, wednesday, thursday, friday, saturday, clarity-history, keywords-monthly). Deployment is Cloudflare Pages' native Git integration: **auto-deploy on push to `main`**, skipped for commits whose message contains `[skip cd]`.

`public/_headers` and `public/_redirects` are build artifacts copied to `dist/` — **they only take effect on a rebuild**, not on a config commit.

## 🔴 Failure mode 1 — fixes committed but never deployed

**Found 2026-07-21: the GA4 CSP fix had been live-broken for 3 days after being "fixed".**

Commit `db75ffd` (2026-07-18, "allow GA4 regional collection endpoints — hits silently blocked since ~Jun 16") was pushed to `origin/main`. Production still served the header from the *previous* commit `9085eca`:

| | `connect-src` |
|---|---|
| **Live** | `'self' https://www.google-analytics.com https://cloudflareinsights.com https://*.clarity.ms https://dc.services.visualstudio.com` |
| **Committed** | `'self' https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://stats.g.doubleclick.net ...` |

`git show 9085eca:public/_headers` matched the live value byte-for-byte.

**Cause:** every commit after the fix carried `[skip cd]` — `0552366`, `d8f2c3c`, `c134e7e`, `66d8ec9` (all agent/data commits). Two further commits (`27b556d`, `3505a12`) were unpushed entirely. Nothing triggered a rebuild, so the fix never shipped.

**Consequence:** GA4 posts to `region1.google-analytics.com` and `stats.g.doubleclick.net`; neither matches the exact-host `www.google-analytics.com` allowance. The analytics blackout starting ~Jun 16 was **still ongoing** at audit time. See [[ga4-performance]].

**RULE:** a fix to `public/_headers` or `public/_redirects` is not done when committed — it is done when a deployable (non-`[skip cd]`) commit lands and the live header is verified:

```bash
curl -sI https://tallchairadvisor.com/ | grep -o "connect-src[^;]*;"
```

**RULE:** when the weekly agents have only produced `[skip cd]` commits since a code fix, the fix has not shipped. Check before assuming any infrastructure change is live.

## ✅ Build gate added 2026-07-22 — failure mode 2 is now caught

`scripts/verify-build.mjs`, wired into `npm run build` (`astro build && npm run verify:build`). Fails the build on any emitted page that has:

1. raw source / LLM output leaked into the body (frontmatter fence not at byte 0)
2. a missing or empty `<title>`
3. a missing `rel="canonical"`
4. a missing meta description
5. zero JSON-LD blocks, or a JSON-LD block that does not parse
6. an `aggregateRating` with `reviewCount:1` (the C5 regression guard)

`npm run build:nocheck` remains as an escape hatch.

**The gate was tested against the real corruption pattern, not just assumed to work.** Feeding it the exact `leap-plus.astro` failure produced 5 findings and exit code 1; a synthetic `aggregateRating reviewCount:1` payload was also caught. Clean run reports `48 pages OK`.

## 🔴 Failure mode 2 — the build passes silently on a destroyed page

**Found 2026-07-21: `src/pages/review/leap-plus.astro` had raw LLM chat output committed at line 1**, ahead of the `---` frontmatter fence:

> "Looking at the file, I need to identify the dead click. The Amazon ASIN `B00TYE4QXU` appears in both CTA buttons..."

Because the fence was not at byte 0, Astro never executed the frontmatter. **`npx astro build` succeeded — 49 pages, zero errors.** The emitted `dist/review/leap-plus/index.html` had:

| Signal | Result |
|---|---|
| `<title>` | MISSING |
| meta description | MISSING |
| canonical | MISSING |
| JSON-LD blocks | **0** |
| `<html>`, `<footer>`, stylesheet, viewport, og:title | all absent |
| Page size | 25.9 KB vs 65.1 KB for `/review/gesture/` |

Committed in `3505a12` (unpushed at audit time). This page is the site's **#1 click source** — 34 clicks/90d, 16.3% of all site clicks.

**RULE — add a build gate.** A green build is not evidence a page rendered. Assert that every `dist/**/index.html` contains `<title>` and `rel="canonical"`, and that review pages contain at least one `application/ld+json` block. Fail the build otherwise.

**RULE — never commit agent/LLM output into a source file without reading the first 5 lines.** This is the second documented instance of generated text corrupting a page (see [[content-integrity]] for the fabricated-prose variant).

## Verified-healthy deployment behaviour

- Redirects work correctly: all four 2026-07-04 consolidation URLs 301 single-hop, including the no-slash variant `/best-office-chairs` resolving straight to the final target in **one** hop.
- Security headers ship correctly: HSTS `max-age=31536000; includeSubDomains; preload`, CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Brotli compression active (65KB → 17.4KB on `/review/gesture/`), TTFB 0.04–0.27s from edge.

**Known defect (Medium):** duplicate/conflicting `Cache-Control` on all static assets — `public, max-age=31536000, immutable, public, max-age=300, must-revalidate`. Cloudflare is concatenating the `/_astro/*` rule and the `/*` catch-all, leaking `must-revalidate` onto content-hashed immutable assets.

## Links

- [[ga4-performance]] — the analytics outage this pipeline failure sustains
- [[content-integrity]] — the content-side counterpart of the silent-failure class
- [[review-leap-plus]] — the affected page
