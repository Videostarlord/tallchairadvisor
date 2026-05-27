---
type: concept
last_updated: 2026-05-27
sources: [raw/audits/2026-05-10-full-seo-audit.md]
tags: [compliance, ftc, affiliate, legal]
---

# Affiliate Compliance (FTC)

**CRITICAL — legal requirement, not just SEO.** FTC requires affiliate disclosures to be "clear and conspicuous" — a footer link alone does not satisfy this standard. The disclosure must appear near the top of the page, before affiliate links are encountered.

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
| /review/gesture/ | Single CTA at 85% | ✅ Fixed in May 25 rewrite — CTA now after Direct Answer box at top |
| /best-office-chairs/ | Quick Picks links to internal pages, not Amazon | ❌ Still open — automation will surface this |

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
