---
type: site-page
url: /chair-specs/
last_updated: 2026-09-01 (created)
sources: [raw/strategy/2026-09-01-portfolio-inversion-aio-tracker-dataset.md, data/chair-specs.json]
tags: [dataset, citations, geo, link-building, schema]
---

# /chair-specs/ — The Open Dimension Dataset

**NEW 2026-09-01.** Not a money page and should never be scored as one. Its job is
to be cited and linked to.

| | |
|---|---|
| URL | `/chair-specs/` |
| Payload | `/chair-specs.json` — CC BY 4.0, permissive CORS |
| Source | rendered from `data/chair-specs.json` at build time |
| Schema | `Dataset` + `FAQPage` + `BreadcrumbList` |
| Sitemap | priority 0.6 (reference tier, not the 0.3 catch-all) |
| Affiliate links | **none, deliberately** |
| GSC data | none yet |

## Why it exists

[[ctr-optimization]] priced link building honestly and declined it: *"quality links
cost $100–400 each, need 10–20 = $1,000–8,000 minimum. 12–18 month play, not
2026."* That judgement stands. This is the version of the same spend that costs
nothing, because the asset already existed and was invisible.

`data/chair-specs.json` was built as a build-time input for `lint-content.mjs`
after a fabricated Leap Plus seat-height range shipped across 33 pages. Every
figure in it traces to a manufacturer specification PDF, with the edition and the
date a human opened it. That is the one artifact in this niche that other sites
have a reason to link to and that an LLM can quote exactly — retailers publish
specs without sources, review sites publish figures without editions.

## The `guarded` list is the differentiator

Exported deliberately, and the most valuable field on the page. It names the
figures that are **true but misleading alone** — the Leap Plus 22.5" seat height,
which requires the optional 5" cylinder that also raises the chair's floor to
17.5", so it is not a superset of the standard range.

That is the exact error this site published and corrected. It is also the error
every other source in the niche still carries. A consumer that copies the numbers
and drops the qualifiers reproduces the bug; one that reads this key does not.

## Coverage is 4 chairs, and the page says why

Leap Plus, Leap V2, Gesture, Aeron Size C. That is the set whose every figure has
been read from a primary source — **not** the set of chairs the site covers.

A chair is absent because nobody has opened its specification PDF yet, never
because it lacks dimensions. Padding the table with retailer figures would make it
look complete and would reintroduce exactly the failure the registry exists to
prevent. **Growing this page means opening PDFs, not writing copy.**

## Distribution

- `public/llms.txt` — listed under Key Pages with the `guarded` caveat spelled out
- `/correct-chair-dimensions/` — linked from Next Steps
- `astro.config.mjs` — `pageLastmod` + 0.6 priority tier

## A linter fired on this page, correctly

`lint-content.mjs` flagged the banned Leap Plus range three times in prose that was
**debunking** it. The gate was not weakened; the page was reworded so the two
endpoints never share a line. A rule that could be talked out of firing by
surrounding prose would not have caught the original error either — that one also
sat beside text explaining what it meant.

## What success looks like

Not clicks and not revenue. In order of what would count:

1. An external site links to `/chair-specs/` or the JSON as a source.
2. An AI Overview or assistant cites the dataset URL — watch via
   [[aio-citation-tracking]].
3. A correction arrives with a manufacturer document attached.

**Do not judge this page on GSC position or CTR**, and do not let a strategy pass
recommend adding affiliate CTAs to it. A citation target that sells things is a
citation target nobody cites.

Related: [[correct-chair-dimensions]] · [[ctr-optimization]] ·
[[ai-citation-readiness]] · [[steelcase-leap-plus]] · [[aio-citation-tracking]]
