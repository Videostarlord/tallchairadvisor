---
type: concept
last_updated: 2026-05-11
sources: [raw/audits/2026-05-10-full-seo-audit.md]
tags: [compliance, ftc, affiliate, legal]
---

# Affiliate Compliance (FTC)

**CRITICAL — legal requirement, not just SEO.** FTC requires affiliate disclosures to be "clear and conspicuous" — a footer link alone does not satisfy this standard. The disclosure must appear near the top of the page, before affiliate links are encountered.

## Corrected Status (2026-05-11 codebase audit)

The May 10 SEO audit flagged 6 pages as missing body disclosures. A direct source-file audit on 2026-05-11 found that the 4 highest-priority pages already have inline disclosures in their page body:

| Page | Source File Check | Status |
|------|-------------------|--------|
| /review/gesture/ | Line 184: `<strong>Disclosure:</strong> We may earn a commission...` | ✅ Has body disclosure |
| /aeron-vs-gesture/ | Line 110: `<strong>Disclosure:</strong> We may earn a commission...` | ✅ Has body disclosure |
| /best-office-chairs/ | Line 124: `<strong>Disclosure:</strong> We may earn a commission...` | ✅ Has body disclosure |
| /review/leap-plus/ | Line 170: `<strong>Disclosure:</strong> We may earn a commission...` | ✅ Has body disclosure |

The remaining pages from the May 10 audit were NOT individually verified in the 2026-05-11 source audit. They may or may not have body disclosures:

| Page | Affiliate Links Present? | Status |
|------|--------------------------|--------|
| / (Homepage) | Unknown | ⚠️ Unverified — check source |
| /knee-pain-seat-depth/ | Yes (Leap Plus + Gesture CTAs) | ⚠️ Unverified — check source |
| /shoulder-pain-tall-people/ | Yes | ⚠️ Unverified — check source |
| /correct-chair-dimensions/ | Unknown | ⚠️ Unverified — check source |
| /office-chairs-for-tall-people/ (Pillar) | Unknown | ⚠️ Unverified — check source |
| /standing-desk-height-tall-people/ | Unknown | ⚠️ Unverified — check source |

**Summary:** The May 10 audit's finding of "6 pages missing FTC disclosure" was too broad. At minimum 4 of the named pages already have compliant disclosures. The actual gap may be smaller than originally documented.

## Revenue Leaks (separate from compliance)

These are CTA placement issues that cost clicks, not compliance violations:

| Page | Issue |
|------|-------|
| /aeron-vs-gesture/ | 0 affiliate links in first 84% of page — both CTAs at 85–86% |
| /review/gesture/ | Single affiliate link at 85% — needs CTA after DIRECT ANSWER box |
| /best-office-chairs/ | Quick Picks section links to internal review pages, not Amazon |

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
