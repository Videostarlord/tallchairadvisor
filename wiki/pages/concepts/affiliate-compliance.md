---
type: concept
last_updated: 2026-08-31
sources: [raw/audits/2026-05-10-full-seo-audit.md, raw/strategy/2026-07-25-affiliate-program-research.md]
tags: [compliance, ftc, affiliate, legal]
---

# Affiliate Compliance (FTC)

**CRITICAL — legal requirement, not just SEO.** FTC requires affiliate disclosures to be "clear and conspicuous" — a footer link alone does not satisfy this standard. The disclosure must appear near the top of the page, before affiliate links are encountered.

## Full Compliance Sweep (2026-07-25 — approval-gate prep for direct programs)

**Trigger:** Profit Audit Step B — network affiliate applications (Humanscale/Crandall) reject sites with undisclosed affiliate pages, so a full sweep was run before applying. The prior "all 7 compliant" note (2026-05-27) was scoped to only the 7 money pages; the site actually has **38 pages with `tag=tallchairadvi` affiliate links**.

**Sweep result:** 29 pages already had a disclosure; **9 pages had affiliate links with NO disclosure**. All 9 fixed 2026-07-25.

**Fix applied:** created reusable `src/components/Disclosure.astro` (amber callout → `/affiliate-disclosure/`). Inserted near top of content (after `<Byline />`, above first CTA) on all 9:
`office-chair-return-policy`, `aeron-size-c-vs-leap-plus`, `office-chair-lower-back-pain-tall-people`, `leg-pain-circulation`, `back-pain-spine-height`, `how-to-adjust-chair`, `shoulder-pain-tall-people`, `why-standard-chairs-dont-fit`, `office-chairs-for-6-foot-5`. Build green (49 pages); render verified in `dist/`.

~~**Known nuance (not yet fixed):** the 6-foot-3/4/6/7 and heavy-duty pages carry their disclosure LOW on the page (line ~340+), after CTAs — FTC prefers it above the first affiliate link. Low urgency; flag for a placement pass.~~ **FIXED 2026-08-31 — and it was worse than this note recorded.** See below.

## ✅ Disclosure-above-CTA enforced site-wide, and MEASURED (2026-08-31)

The 2026-07-25 sweep asked "does this page have a disclosure?" — a text check. That is the wrong question. The FTC standard is *clear and conspicuous*, which is a question about **order and position**, and a page can pass the text check while placing its disclosure 5,000px below the first buy button.

A rendered check (Chromium, real pixel offsets, all 45 pages carrying affiliate links) found **5 pages where the disclosure sat BELOW the first affiliate CTA**:

| page | disclosure | first CTA | gap |
|---|---:|---:|---|
| `/heavy-duty-ergonomic-chairs-tall-people/` | 8203px | 2997px | 5206px below |
| `/office-chairs-for-6-foot-7/` | 9310px | 5302px | 4008px below |
| `/office-chairs-for-6-foot-3/` | 7565px | 5537px | 2028px below |
| `/refurbished-steelcase-leap-tall-people/` | 4398px | 2488px | 1910px below |
| `/review/gesture/` | 869px | 795px | 74px below — blocks simply swapped |

**And one page the 2026-07-25 sweep missed entirely:** `/office-chairs-for-6-foot-4/` carried **three affiliate links and no disclosure of any kind**. The note above lists 6-foot-4 among pages whose disclosure was merely *low*; it had none.

All six fixed. `<Disclosure />` inserted above the first CTA on five; the disclosure and CTA blocks simply swapped on `/review/gesture/`. **Re-verified by rendered position: 45/45 pages now place the disclosure above the first affiliate link.**

**The durable lesson, and it is the repo's usual one:** a text scan for a component's presence cannot answer a question about position. The 2026-07-25 sweep reported "all fixed" and was correct about what it measured. Measure the thing the rule is actually about.

**Going forward:** new affiliate pages must use `<Disclosure />` near the top. This is the 3rd recurrence of disclosure drift — the component now makes it a one-line include.

## Revenue Leaks (separate from compliance)

| Page | Issue | Status |
|------|-------|--------|
| /aeron-vs-gesture/ | Both CTAs were at 85%+ scroll | ✅ Fixed 2026-05-27 — CTA block added after Quick Answer box |
| /review/gesture/ | Single CTA at 85% | ✅ Fixed May 25 (top CTA added). ✅ Further fixed 2026-07-04 — added CTAs after TL;DR Verdict Box (post-verdict-box) and after Verdict section (post-verdict-section). Now 4 CTAs total at ~15%, ~22%, ~75%, ~90% scroll. |
| /best-office-chairs/ | Quick Picks links to internal pages, not Amazon | ✅ Fixed (verified 2026-06-14 — Quick Picks now direct Amazon affiliate links) |

## Required Fix Pattern

Add a short inline disclosure sentence near the top of each page body (before first affiliate link). Example:
> "This page contains affiliate links. If you buy through them, I earn a commission at no extra cost to you."

Place it: after the lede paragraph, before the first product mention or CTA.

## Amazon Tag

All Amazon links must use: `tag=tallchairadvi-20`

## Links

- [[review-gesture]] — CTA placement + disclosure
- [[best-office-chairs]] — Quick Picks CTA fix + disclosure
- [[aeron-vs-gesture]] — CTA placement
- [[correct-chair-dimensions]] — disclosure needed

## Link liveness — A10/P4, built 2026-08-09

Compliance covers *disclosure*; this covers whether the disclosed link still works. `scripts/asin-check.ts` runs monthly (`.github/workflows/asin-monthly.yml`) via Firecrawl, checking every `/dp/<ASIN>` actually linked from a page — 24 as of 2026-08-09.

Firecrawl rather than the Playwright probe because Amazon hard-blocks datacenter IPs; a probe run from Actions collects bot walls, not listings.

**This does not replace `data/verified-asins.json`.** That allowlist is deliberately offline (`_NOT_AN_HTTP_CHECK`) and catches *invented* ASINs at build time. This catches ones that were real and later died. Different failure, different tool.

**Findings are advisory and a human confirms before any link is removed**, because the first live run produced a false positive: it read "Currently unavailable" from a **"Newer Version Available" cross-sell block** and reported the Hbada E3 Pro (`B0CQ4K1KXT`, on `/best-office-chairs-under-500/`) as dead. The product itself showed Add to Cart and In Stock. Acting on it would have stripped a working affiliate link off a money page.

Fixed by splitting the markers: hard-dead signals (404, "couldn't find that page") describe the whole document and are trusted alone; soft signals ("currently unavailable", "no longer available", "discontinued") count **only when the page also offers no way to buy anything**. A failed fetch, bot wall or timeout is `unknown` and files nothing.

Known-dead ASINs stay in the `known_dead` block of `data/verified-asins.json` and are excluded from checks — no quota spent rediscovering known facts.
