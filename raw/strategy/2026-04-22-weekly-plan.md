# Weekly Plan — 2026-04-21

## FIXES (Thursday agent)
<!-- Max 5 fixes. Each fix must specify the exact file path and what to change. -->

- [ ] FIX: /review/gesture/ | Confirm 301 redirect from `/review/gesture` → `/review/gesture/` is live in netlify.toml (carry-over from W15 plan — verify implementation, do not re-implement if already done); if missing, add: `[[redirects]] from = "/review/gesture" to = "/review/gesture/" status = 301 force = true` | Trailing-slash duplicate is still splitting ~121 impressions (pos 12.6) from the canonical (1108 impr, pos 9) — consolidating is the single fastest ranking lift available on the site | FILE: netlify.toml

- [ ] FIX: /knee-pain-seat-depth/ | Rewrite title tag to ≤60 chars with intent-aligned framing (current title is 70 chars, over limit, and "knee brace" query mismatch flagged since Apr 3 but still unfixed); proposed title: `Chair Seat Depth for Tall People with Knee Pain | TCA`; rewrite meta to ≤155 chars leading with the seated-posture verdict for tall frames | 445 impressions at pos 9.4 with 0 clicks — largest impression waste on the site; this page is on cooldown for content edits but title/meta is a technical SERP fix, not a content rewrite, so cooldown does not apply | FILE: src/pages/knee-pain-seat-depth.astro

- [ ] FIX: /review/aeron-size-c/ | Rewrite title tag from generic form to verdict-first tall-specific framing; proposed: `Herman Miller Aeron Size C Review for Tall People (6'2"+)` (55 chars); rewrite meta ≤155 chars with explicit sizing verdict in first 100 chars, e.g. "Size C fits frames up to 6'5" — here's what the seat depth and lumbar height actually mean for tall users." | 205 impressions at pos 7.5 with 0 clicks; page is on the recently-edited list but title/meta is a SERP-level technical fix — not a content cooldown violation; use research voice only (Jackson did not personally test the Aeron) | FILE: src/pages/review/aeron-size-c.astro

- [ ] FIX: /back-pain-spine-height/ | Rewrite title tag from current vague 42-char version to something specific and tall-targeted; proposed: `Back Pain & Spine Height: Why Tall People's Lumbar Needs Differ` (63 chars); rewrite meta ≤155 chars to lead with the actionable insight, not a content summary | 135 impressions at pos 9.5 with 0 clicks; title/meta SERP fix only — content cooldown does not block this; page is in recently-edited list so no content changes | FILE: src/pages/back-pain-spine-height.astro

- [ ] FIX: /chairs/steelcase-leap-plus/tall-people/ | Trim meta description to ≤155 chars (currently 156 chars, over limit) AND move the verdict for tall users into the first 100 chars; proposed opening: "The Leap Plus fits most frames up to 6'4" — here's what the seat depth and back height mean for tall users." | 154 impressions at pos 10.3 with 0 clicks; meta over-limit is a confirmed technical issue; page is on cooldown — meta character fix only, no content changes | FILE: src/pages/chairs/steelcase-leap-plus/tall-people.astro

---

## NEW CONTENT (Friday agent)
<!-- Only include if there's a clear content gap worth a new page. -->

- [ ] NEW: Steelcase Series 2 for Tall People | `steelcase series 2 review tall people` | `/chairs/steelcase-series-2/tall-people/` | Research-voice review covering seat height range, seat depth, back height, and lumbar adjustability with explicit verdicts for 6'0"–6'4" and 6'5"+ frames; include spec comparison table vs. Leap Plus; target AI Overview citation with answer-first lede ("The Steelcase Series 2 fits tall users up to approximately 6'3" without modification…"); Amazon affiliate link with tag=tallchairadvi-20; must score 80+ on /blog-analyze before publishing

- [ ] NEW: How to Tell If an Office Chair Is Too Small for You | `how to tell if office chair is too small` | `/fit-guides/chair-too-small/` | Informational guide targeting tall users who don't yet know the specific chair they want; answer-first format (lead with the 4 body-fit signals: knees above hips, back unsupported above mid-spine, armrests maxed out, seat pan too short); tie each signal to measurable specs; internally link to /correct-chair-dimensions/ and /fit-guides/; high AI Overview citation potential due to list-structured, answer-first format; no affiliate links needed — pure top-of-funnel trust content

---

## REWRITES (Thursday agent, lower priority)
<!-- Pages needing significant content overhaul, not just meta tweaks -->

*(No rewrites scheduled this week. All pages requiring content-level work are on the recently-edited cooldown list. The /office-chairs-for-tall-people/ rebuild and /correct-chair-dimensions/ tall-specific pivot flagged by competitor analysis remain high-priority but are blocked by the 14-day cooldown — schedule for W17 if off cooldown.)*

---

## STRATEGY NOTES

The site has nearly doubled impressions (4,100 → 7,096) but CTR has flatlined at ~0.27%, meaning visibility gains are being entirely wasted at the SERP level. This week's work is a disciplined meta/title sweep of the five highest-impression, zero-click pages that are not blocked by cooldown — every fix is a SERP-layer change, not a content change, so cooldown rules don't apply. The two new content pieces address a genuine gap (no Series 2 tall-specific review exists anywhere) and a top-of-funnel trust asset that feeds the fit-guides hub. The /review/gesture/ trailing-slash redirect remains the single highest-leverage technical fix on the site and must be confirmed live before anything else ships this week.