---
type: concept
last_updated: 2026-05-27
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-05-10-full-seo-audit.md, raw/audits/2026-05-27-full-seo-audit.md]
tags: [meta, seo, on-page]
---

# Meta Descriptions

## Site Constraints

- **Target length:** 130–155 chars (per CLAUDE.md)
- **Title length:** 50–60 chars
- **Regex bug:** Standard regex breaks on apostrophes in `6'4"`. Always use: `re.search(r'<meta\s+name=["\']description["\']\s+content="(.*?)"', html, re.I)`

## Current Status (May 27 — from full SEO audit)

**9 of 10 audited pages are UNDER the 130-char floor.** Root cause: execute-fixes.ts likely over-trimmed metas that were previously flagged as over-limit in the May 10 audit. The problem has inverted — pages that were 166–170 chars are now 117–135 chars.

| Page | Length | Status |
|------|--------|--------|
| / (homepage) | 102 | ❌ Severely under — highest priority |
| /review/gesture/ | ~138 | ❌ Under floor (was 146 on May 10 — over-trimmed) |
| /review/leap-plus/ | ~135 | ⚠️ Borderline |
| /review/aeron-size-c/ | ~120 | ❌ Under (was 166 — over-trimmed) |
| /best-office-chairs/ | ~117 | ❌ Under |
| /aeron-vs-gesture/ | ~90 | ❌ Severely under — highest priority |
| /correct-chair-dimensions/ | ~117 | ❌ Under |
| /office-chairs-for-6-foot-4/ | ~122 | ❌ Under |
| /chairs/herman-miller-aeron/tall-people/ | ~120 | ❌ Under |
| /heavy-duty-ergonomic-chairs-tall-people/ | ~117 | ❌ Under |

## Open Issues (May 27)

1. **9/10 pages under 130-char floor** — systemic under-length problem. Homepage (102) and /aeron-vs-gesture/ (~90) are most urgent given their impression volume.
2. **Pattern for all fixes:** height-specific verdict → named spec with number → differentiated value claim, 130–155 chars total.
3. **Aeron vs Gesture H1/title mismatch** — still unresolved. Title: "Why I Chose the Gesture" (personal). H1: "Herman Miller Aeron Size C vs Steelcase Gesture" (generic). Direct cause of 0% CTR on 385 impressions.

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
