---
type: concept
last_updated: 2026-04-06 (cadence policy added)
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-03-competitor-analysis.md, raw/strategy/2026-03-content-calendar.md]
tags: [content-gaps, opportunities, strategy]
---

# Content Gaps

## Unwritten Pages (confirmed opportunities)

### 1. /standing-desk-height-tall-people/ — HIGH PRIORITY
- **Signal:** "steelcase standing desk review 2026" at 4 impr, pos 9.75 — direct demand
- **Angle:** Jackson has a real standing desk setup. First-person + ME background.
- **Competition:** Zero. Flagged in every audit since March.
- **Status:** Still unwritten as of Apr 6.

### 2. Height-Bracket Verdict Table on /best-office-chairs/
- Not a new page, but a critical content addition to the money page
- Format: "At 6'X → min seat height ≥X, min seat depth ≥X → Passing chairs: [list]"
- Highest AI Overview citation probability on the site
- No competitor has this

## Content Format Gaps

| Format | Status |
|--------|--------|
| Citation capsules (40–60 word) | ❌ Not present on any page |
| Height-specific fit chart/visual | ❌ No competitor has this either — differentiator |
| Video embeds | ❌ No YouTube presence |
| Star rating display | ❌ Not implemented |

## Keyword Gaps (from competitor analysis)

Queries competitors rank for where TCA could win:

| Query | Competitor | TCA Status |
|-------|-----------|------------|
| best chair for 6'4" | Tall.Life | No dedicated page |
| best chair for long legs | Tall.Life | No page |
| desk height for tall people | StandingDeskTopper | Planned (Phase 3) |
| haworth fern review | ChairsFX, BTOD | Planned (Month 3) |
| secretlab titan xl review | Gaming sites | Planned (Month 3) |

## Pages Needing Depth Upgrades

| Page | Issue | Impact |
|------|-------|--------|
| /office-chairs-for-tall-people/ | Thin content, buried at pos 69–79 for core queries | HIGH — "best office chair for tall people" has 22 impr |
| /leg-pain-circulation/ | Score 59, needs full rewrite | LOW |
| Height guides (6-foot-5, 6-foot-6, 6-foot-7) | Scores 67–68 | MEDIUM |

## Edit Cadence Policy

Codified 2026-04-06 based on GPT analysis and thin GSC data volume (~4,100 total impressions). At low data volumes, re-editing the same page every week makes results uninterpretable. Rules:

### Fix Immediately (no cooldown)
Technical errors — always fix without waiting:
- Broken schema / JSON-LD parse error
- Wrong or missing canonical tag
- `noindex` set incorrectly
- 404 or broken internal link
- Voice violation (wrong testing voice for non-Gesture chair)
- Missing or incorrect affiliate tag

### 14-Day Cooldown Required
CTR and content quality changes — need enough data to measure:
- Title tag rewrites
- Meta description rewrites
- Body content edits
- Heading changes

### 28–42 Days Before Judging a New Page
New pages need indexing time. Don't optimize a page that was just published.

### Impression Thresholds
| Impressions | Action |
|-------------|--------|
| < 100 | Noise — do not optimize. Let it index. |
| 100–300 | Weak signal — technical fixes only |
| 300+ | Actionable — CTR/meta changes are worth trying |
| 400+ at pos ≤10, 0 clicks | CRITICAL — fix immediately, ignore cooldown |

**Implementation:** These rules are now enforced in two places:
1. `strategy.ts` — injected into Claude prompt so the weekly plan respects cadence
2. `execute-fixes.ts` — runtime cooldown guard skips non-technical fixes on recently edited files (14-day window)

## Links

- [[ai-citation-readiness]] — citation capsules and verdict tables
- [[competitor-landscape]] — keyword gaps from competitors
- [[best-office-chairs]] — money page needs verdict table
