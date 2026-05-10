# Website & SEO Architecture Audit
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## Current Site Performance (90-day, as of May 4, 2026)

| Metric | Value | Assessment |
|--------|-------|-----------|
| Total impressions | 12,209 | Solid for 135-day-old domain |
| Total clicks | 29 | Catastrophically low (0.24% CTR) |
| Avg position | 11.5 | Just outside page 1 — close |
| Revenue | $18 (one commission) | Proof of concept, not proof of scale |
| Pages indexed | ~46 | All indexed ✅ |

---

## Page Hierarchy vs. Intended Architecture

The audit checked all 46 pages against the 6-layer funnel (L0–L5).

### Missing Hub (L0): No true brand/navigation hub
The homepage (index.astro) serves as a brand hub, but there is no high-authority topical hub page that consolidates all chair content for tall people. `/office-chairs-for-tall-people/` should be L0 but is at pos 24.9 — it's not functioning as a hub. This is a structural gap.

### L1 (Problem Capture) — GOOD
`/back-pain-spine-height/`, `/knee-pain-seat-depth/`, `/leg-pain-circulation/`, `/shoulder-pain-tall-people/` all exist and cover the main pain points. `/knee-pain-seat-depth/` is proving to be the conversion entry point (first commission). This pillar is architecturally sound.

### L2 (Education) — GOOD
`/correct-chair-dimensions/`, `/how-to-adjust-chair/`, `/why-standard-chairs-dont-fit/`, `/standing-desk-height-tall-people/` cover educational intent. `/correct-chair-dimensions/` is the breakout page at 1,422 impressions, pos 16.7.

### L3 (Shortlist) — WEAK
`/office-chairs-for-tall-people/` (pos 24.9, buried), `/office-chairs-for-6-foot-{3-7}/` (indexed but low impressions), `/best-office-chairs/`, `/best-office-chairs-under-500/`. The height-specific pages are a genuinely defensible format but haven't gained traction yet. `/office-chairs-for-tall-people/` being at pos 24.9 means TCA doesn't own the top of the funnel for its primary head term.

### L4 (Comparisons) — DECENT
`/aeron-vs-gesture/` (pos 7.59 confirmed in wiki, high impressions), `/aeron-vs-leap-plus/` (2.15% CTR — highest on site), `/gesture-vs-leap-plus/`. Comparison pages are working. The `/aeron-vs-leap-plus/` CTR signal is the best performing page by CTR. These pages should receive more internal link equity.

### L5 (Reviews) — MIXED
`/review/gesture/` — Strong, 1,895 impr, pos 8.4. First-person authority. Still converting (drove Gesture sales).
`/review/leap-plus/` — Decent impressions (632), pos 9.3, but 0% CTR. Research voice with no narrative hook.
`/review/aeron-size-c/` — 548 impr, pos 7.0. No clicks. Wrong query alignment.
`/review/sihoo-doro-s300/` — New, still indexing. Rising in AI citations.

---

## Top CTR Opportunities Identified (from analysis.json)

| Page | Query | Impressions | Position | CTR | Issue |
|------|-------|-------------|----------|-----|-------|
| /review/gesture/ | steelcase knee brace review | 91 | 7.3 | 0% | Title/meta mismatch for this specific query |
| /chairs/steelcase-gesture/seat-depth/ | steelcase gesture seat depth range inches | 23 | 4.2 | 0% | AIO SUSPECT — meta fix won't help |
| /knee-pain-seat-depth/ | cornell ergonomics chair seat depth two fingers behind knee | 55 | 8.0 | 0% | Cornell rule not in title/meta |
| /review/aeron-size-c/ | herman miller aeron size c reviews | 15 | 8.8 | 0% | Low volume but buyer intent |

**Key finding:** The "steelcase knee brace review" query ranking on /review/gesture/ at pos 7.3 with 91 impressions and 0 CTR is a title/meta mismatch — the Gesture review doesn't mention "knee brace" which is the specific product searchers want. This is traffic the page can't capture without a content addition. The Cornell cluster on /knee-pain-seat-depth/ is a different case — solvable with a title change.

---

## Internal Linking Assessment

**Hub-and-spoke confirmed working:** Chair sub-pages (/chairs/steelcase-gesture/seat-depth/, etc.) rank independently without cannibalizing the review pages. This is confirmed by the fact that both /review/gesture/ AND /chairs/steelcase-gesture/seat-depth/ rank simultaneously for different queries.

**Gaps identified:**
1. The comparison pages (/aeron-vs-leap-plus/ at 2.15% CTR) don't appear to receive heavy internal linking from the review pages. They should — they're the best-converting format by CTR.
2. /office-chairs-for-tall-people/ should receive internal links from EVERY review and comparison page as the cornerstone. Unknown if this is currently the case.
3. Pain pages link to chair CTAs but it's unclear if they link to each other or to the height-specific guides.

**Cannibalization detected in analysis.json:** None flagged as high-risk. The query clustering shows minimal same-query competition between pages.

---

## Schema & Technical SEO

**Schema in use (from source files):**
- BlogPosting on all review/editorial pages
- FAQPage on all new content pages (generate-content template)
- BreadcrumbList auto-generated from Layout.astro
- Product schema: Not confirmed present on review pages
- AggregateRating: Not confirmed (would require external reviews)

**Issues identified:**
1. wiki/index.md notes "JSON-LD parse error on money page" — this was a known issue as of the wiki's last update. Status unclear.
2. Product schema absent from review pages. For affiliate sites, Product schema with price/availability signals helps with rich results. Could improve CTR.
3. FAQPage schema requires visible FAQ content to match. The execute-content.ts template enforces this — but existing pages (pre-template) may have schema/content mismatches.

---

## Sitemap & Crawl

**Sitemap config in astro.config.mjs** — well-structured with priority tiers:
- Review pages and comparisons: priority 0.8
- Height-specific guides: priority 0.8 (upgraded from 0.3 per wiki)
- Sub-pages: priority 0.6

**No crawl budget issues detected.** 46 pages is trivial for Googlebot. All pages confirmed indexed per index-monitor.ts output.

**Robots.txt:** Public, standard. No AI bot blocking (llms.txt allows PerplexityBot and GPTBot).

---

## Affiliate Placement Assessment

**Current pattern:** 2-button CTA grid (primary + secondary chair). Amazon links with `tag=tallchairadvi-20`. Verified by verify-deploy.ts on every Saturday deploy.

**What works:** Pain pages with embedded CTAs convert. First commission from /knee-pain-seat-depth/ confirms.

**Missing affiliate coverage:**
- Not all pain/ergonomics pages have CTA blocks (needs verification by page)
- Educational pages (/correct-chair-dimensions/, /how-to-adjust-chair/) may not have CTAs
- /office-chairs-for-tall-people/ at pos 24.9 has buyer intent impressions but TCA can't capture them at current position

**Affiliate urgency by page (from analysis.json affiliate opportunities):**
- Verify which pages have "high" affiliate urgency (200+ buyer-intent impressions) and ensure they have CTA blocks

---

## Mobile / Device Split

**analysis.json shows deviceIntelligence: null** — device split data is currently inactive. Cannot confirm mobile vs. desktop CTR divergence from the current analysis run.

**What is known from wiki:** The site uses Tailwind CSS responsive design. No mobile usability issues flagged in any audit. But without device-split CTR data, mobile underperforming pages can't be identified.

**Recommendation:** Fix the deviceIntelligence null issue (see DATA_PIPELINE_AUDIT) and check the mobile underperforming pages list once it's active.

---

## Pages That Need Action (Priority Order)

| Priority | Page | Issue | Type |
|----------|------|-------|------|
| 1 | /knee-pain-seat-depth/ | Cornell rule not in title/meta | Title change |
| 2 | /office-chairs-for-tall-people/ | pos 24.9, page 2, #1 head term | Content depth rewrite |
| 3 | /review/leap-plus/ | 0% CTR, no narrative hook | Narrative reframe |
| 4 | /review/gesture/ | Needs depth to lock in position | First-person expansion (Jackson) |
| 5 | /aeron-vs-gesture/ | pos 5, 0 clicks (noted in CLAUDE.md) | Meta + title fix |
| 6 | All pain pages | Verify CTA blocks present | Affiliate add |

## Pages NOT Needing Action

- /review/aeron-size-c/ — correctly ranking, low volume, monitor
- /aeron-vs-leap-plus/ — 2.15% CTR, best CTR on site, don't touch
- /chairs/steelcase-gesture/* — ranking well for spec queries, stable
- /standing-desk-height-tall-people/ — new page, needs indexing time
