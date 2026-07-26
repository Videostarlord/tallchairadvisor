---
type: concept
last_updated: 2026-07-21
sources: [raw/audits/2026-05-10-full-seo-audit.md, raw/audits/2026-07-21-full-seo-audit.md]
tags: [compliance, ftc, affiliate, legal]
---

# Affiliate Compliance (FTC)

**CRITICAL — legal requirement, not just SEO.** FTC requires affiliate disclosures to be "clear and conspicuous" — a footer link alone does not satisfy this standard. The disclosure must appear near the top of the page, before affiliate links are encountered.


## 🔴 2026-07-21 audit — FTC disclosure gaps on 15 monetized pages

Full audit: `raw/audits/2026-07-21-full-seo-audit.md`.

**Nine pages with ZERO body disclosure** (footer link only — the long-standing open issue, still open):

`office-chairs-for-6-foot-5` (3 affiliate links) · `office-chair-return-policy` · `how-to-adjust-chair` · `leg-pain-circulation` · `office-chair-lower-back-pain-tall-people` · `why-standard-chairs-dont-fit` · `back-pain-spine-height` · `shoulder-pain-tall-people` · `aeron-size-c-vs-leap-plus`

`office-chairs-for-6-foot-5` is a straight template miss — its four siblings (6-3, 6-4, 6-6, 6-7) all carry one. The pain-cluster pages monetize health-adjacent YMYL content with no disclosure at all, which is the worst combination for a quality rater.

**Six pages with bottom-only disclosure**, ~1,800–1,950 words *after* the first CTA: `office-chairs-for-6-foot-3/4/6/7`, `heavy-duty-ergonomic-chairs-tall-people`. FTC guidance requires disclosure **before** the endorsement.

**Compliance-grade case (visual capture):** on `/office-chairs-for-6-foot-6/` the disclosure sits at **87.1% scroll depth**, 14px, low-contrast gray (`rgb(103,111,126)`), as a plain `<p>` — *below* the affiliate link it qualifies. Every other monetized page uses a bordered amber callout at 3.5–6.8% depth. Against observed scroll depth of 40–70%, effectively no one sees it.

**Fix:** port the standard amber callout above the first CTA on all 15 pages.

**Minor:** disclosure copy alternates between "We may earn a commission" (~25 pages) and "I earn a commission" (`refurbished-steelcase-leap-tall-people.astro:98`). On a single-author site, "we" weakens the transparency signal — standardize on first person.

## Verified Status (2026-05-27 — full source audit)

All affiliate-link pages verified against source files:

| Page | Affiliate Links | Disclosure | Status |
|------|----------------|-----------|--------|
| /review/gesture/ | Yes | Line 190 | ✅ Compliant |
| /aeron-vs-gesture/ | Yes | Line 109 | ✅ Compliant |
| /best-office-chairs/ | Yes | Line 124 | ✅ Compliant |
| /review/leap-plus/ | Yes | Line 170 | ✅ Compliant |
| /knee-pain-seat-depth/ | Yes | Added 2026-05-27 | ✅ Compliant |
| /correct-chair-dimensions/ | Yes (1 link) | Added 2026-05-27 | ✅ Compliant |
| /office-chairs-for-tall-people/ | Yes | Added 2026-05-27 | ✅ Compliant |
| / (Homepage) | None | N/A | ✅ Not required |

**All 7 affiliate-link pages are now FTC compliant.**

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
