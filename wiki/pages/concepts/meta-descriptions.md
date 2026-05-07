---
type: concept
last_updated: 2026-05-07
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md]
tags: [meta, seo, on-page]
---

# Meta Descriptions

## Site Constraints

- **Target length:** 130–155 chars (per CLAUDE.md)
- **Title length:** 50–60 chars
- **Regex bug:** Standard regex breaks on apostrophes in `6'4"`. Use: `r'<meta\s+name=["\']description["\']\s+content="(.*?)"'`

## Current Status (Apr 3)

| Page | Length | Status |
|------|--------|--------|
| /review/gesture/ | 146 | ✅ |
| /chairs/steelcase-leap-plus/seat-height/ | 133 | ✅ |
| /chairs/steelcase-gesture/seat-depth/ | 156 | ⚠️ Borderline |
| /aeron-vs-gesture/ | 154 | ⚠️ Borderline |
| /correct-chair-dimensions/ | ~153 | ⚠️ Borderline |
| /chairs/herman-miller-aeron/tall-people/ | 149 | ✅ length, ❌ content (no verdict) |

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

## Links

- [[ctr-optimization]] — meta rewrites as CTR fix
