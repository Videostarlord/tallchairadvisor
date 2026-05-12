---
type: concept
last_updated: 2026-05-11
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-05-10-full-seo-audit.md]
tags: [meta, seo, on-page]
---

# Meta Descriptions

## Site Constraints

- **Target length:** 130–155 chars (per CLAUDE.md)
- **Title length:** 50–60 chars
- **Regex bug:** Standard regex breaks on apostrophes in `6'4"`. Always use: `re.search(r'<meta\s+name=["\']description["\']\s+content="(.*?)"', html, re.I)`

## Current Status (May 10 — from full SEO audit)

| Page | Length | Status |
|------|--------|--------|
| /review/gesture/ | 146 | ✅ |
| /chairs/steelcase-leap-plus/seat-height/ | 133 | ✅ |
| /knee-pain-seat-depth/ | ~144 | ✅ (rewritten May 7) |
| /review/aeron-size-c/ | 166 | ❌ Over limit — needs trim |
| /review/leap-plus/ | 170 | ❌ Over limit — needs trim |
| /gesture-vs-leap-plus/ | 165 | ❌ Over limit — needs trim |
| /standing-desk-height-tall-people/ | 161 | ❌ Over limit — needs trim |
| /aeron-vs-gesture/ | 154 | ⚠️ Borderline — **meta rewrite queued for Thursday W20** |
| /chairs/herman-miller-aeron/tall-people/ | 149 | ✅ length — **passage-anchor AIO fix queued Thursday W20** |

## Open Issues

1. **4 meta descriptions over 160 chars** (aeron-size-c, leap-plus, gesture-vs-leap-plus, standing-desk) — not yet scheduled for fixes. Add to a future weekly plan.
2. **Aeron vs Gesture H1/title mismatch** — title says "Why I Chose the Gesture" (personal), H1 says "Herman Miller Aeron Size C vs Steelcase Gesture" (generic). Searchers clicking the personal title see a generic header. Thursday plan addresses the meta; H1 should also be aligned.

## Pattern: Verdict-First for Tall Users

See [[ctr-optimization]] for full analysis. Key principle: lead with the answer to "does this chair fit me?"

## Fix History

| Date | Page | Change | Chars |
|------|------|--------|-------|
| 2026-03-30 | /review/gesture/ | Trimmed | 171→146 |
| 2026-03-30 | /leap-plus/seat-height/ | Trimmed | 166→133 |
| 2026-05-07 | /review/aeron-size-c/ | Verdict-first rewrite — removed "In-depth" filler, leads with fit verdict + specs | ~153 |
| 2026-05-07 | /chairs/steelcase-gesture/ | Verdict-first rewrite — removed table-of-contents framing, leads with height fit + key specs | ~155 |
| 2026-05-07 | /knee-pain-seat-depth/ | Title shortened 72→48 chars; meta rewritten to lead with fix/answer not the problem | ~144 |
| 2026-05-[Thu] | /aeron-vs-gesture/ | Verdict-first rewrite queued — Thursday W20 agent | TBD |

## Links

- [[ctr-optimization]] — meta rewrites as CTR fix
- [[aeron-vs-gesture]] — H1/title mismatch open issue
