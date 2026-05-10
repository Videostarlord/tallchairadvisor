# Blind Spots
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## Strategic Blind Spots

**1. No link acquisition strategy.**
The system has zero mechanism for earning, tracking, or building backlinks. For a 135-day-old domain at avg pos 11.5, backlinks are the primary lever to move from page 2 to page 1. The content strategy, the automation, the wiki — none of this addresses link acquisition. At some point, content quality alone won't close the gap. This is the largest strategic blind spot in the system.

**2. No mechanism to detect competitor new content.**
If a competitor publishes a dedicated "office chairs for 6-foot-4 people" page tomorrow, TCA will not know until the next Monday's competitor-monitor runs — and even then, it won't detect it unless that URL was already in the config.json watchlist. New competitor pages on TCA's target keywords are completely invisible.

**3. No user behavior data.**
Clicks are counted. What happens after the click is invisible. No heatmaps, no scroll depth, no time-on-page, no conversion tracking beyond Amazon referral counts. TCA doesn't know if visitors read to the bottom of /review/gesture/ or bounce after 5 seconds.

**4. Revenue attribution is manual and lagged.**
The $18 commission was traced to /knee-pain-seat-depth/ post-hoc by analysis. There's no real-time or automated revenue attribution. TCA doesn't know which pages drive the most affiliate revenue, which CTAs get clicked, or which traffic sources convert.

---

## SEO Blind Spots

**5. Featured snippet and rich result tracking.**
TCA likely has FAQ rich results on pages with FAQPage schema. TCA likely has Featured Snippets on some spec queries. Neither is programmatically tracked. The system can't detect when a rich result appears, disappears, or changes format.

**6. Seasonal intent is not tracked.**
"Office chairs for tall people" probably has seasonal search demand (new year office setup, back-to-school, work-from-home surges). The daily trend data exists in latest.json but no module looks for seasonality.

**7. Branded vs. non-branded query split.**
Queries containing "tall chair advisor" or "tallchairadvisor.com" vs. purely topical queries are not distinguished. If brand search is growing (a positive signal), the system doesn't detect it.

**8. International traffic is invisible.**
Country dimension is not pulled from the GSC API. If 20% of TCA's traffic is from the UK (where Herman Miller and Steelcase are sold, tall-person ergonomics is relevant, and the writing is in English), TCA doesn't know. Content could be localized (metric units, UK retailer links) for international traffic — but without the data, the opportunity is invisible.

---

## Affiliate Monetization Blind Spots

**9. No click-through rate on CTAs.**
The system tracks SERP CTR (impressions → clicks to TCA). It has zero visibility on affiliate CTR (TCA page views → Amazon clicks). The two-button CTA grid is theoretically placed correctly — but TCA doesn't know if visitors ever click it.

**10. No product diversification strategy.**
All affiliate links go to Amazon for Steelcase Gesture, Herman Miller Aeron, and Steelcase Leap Plus. No desk accessories, no seat cushions, no keyboard trays, no monitor arms — all products a tall person buys alongside their chair. These are lower-AOV but much higher CTR. The system ignores the accessory upsell opportunity entirely.

**11. No comparison of commission rates across affiliate programs.**
Amazon Associates pays 4-8% on furniture. Steelcase direct affiliate (if available) may pay more. Herman Miller may have an affiliate program. TCA doesn't know its commission rates per product or how to optimize for commission yield vs. conversion probability.

---

## Agent Logic Blind Spots

**12. The strategy agent cannot distinguish "bad plan" from "good plan with no good moves."**
If there are genuinely no high-ROI moves this week (all pages recently edited, no confirmed content gaps, stable rankings), the strategy agent will fill the plan with lower-quality items rather than generating a "no action needed" plan. The agent is optimized to produce a plan, not to produce an honest "do nothing" output.

**13. The content quality gate is structural, not semantic.**
An agent-written page scores 100/100 by having a verdict box div, the keyword in H1, FAQPage schema with 4 questions, 2 Amazon links with affiliate tag, and 3 internal links — regardless of factual accuracy, E-E-A-T authenticity, or whether the content is actually good. The Haiku scorer cannot detect whether the "ME background" framing sounds real or whether a "tall person perspective" was actually incorporated.

**14. The index-monitor auto-fix runs before audit or strategy.**
Monday's index-monitor writes directly to src/ (for thin-content expansions, soft-404 fixes). These commits go to main on Monday morning. They're not reviewed by the audit agent (Tuesday), strategy agent (Wednesday), or fix agent (Thursday). The Monday auto-fix is outside the normal quality cycle.

---

## Automation Blind Spots

**15. No cost tracking.**
The system makes approximately 20-40 Claude API calls per week (strategy, audit, fixes, content, verify, competitor). At Sonnet 4.6 pricing, this costs ~$5-15/week. Over a year, that's $250-750 in API costs. No budget tracking exists. The system doesn't know its own operating cost.

**16. No GitHub Actions failure alerting.**
If any workflow fails (API error, build error, network timeout), it fails silently. GitHub sends an email notification by default, but there's no active alerting to Slack, SMS, or any other channel. Jackson may not see a failed Monday workflow until Wednesday when the strategy agent tries to read a missing analysis.json.

**17. No partial failure recovery.**
If Monday's GSC pull succeeds but the GSC analysis fails (e.g., API rate limit), the workflow exits with error. The entire Monday pipeline must be manually re-triggered. There's no step that says "if gsc-analyze.ts fails, continue with the previous week's analysis.json."

---

## Content Quality Blind Spots

**18. No editorial review of agent-written content.**
Content created by execute-content.ts ships on Friday and deploys on Saturday. Jackson never reviews it before it goes live. The structural gates (valid Astro, no AMAZON_URL placeholder, 80+ score from Haiku) are necessary but not sufficient for quality.

**19. The "research-based voice" is applied uniformly but without actual research.**
For non-Gesture chairs, the system prompt says "use research-based voice: based on manufacturer specs, tall users in r/ergonomics report..." But execute-content.ts doesn't inject the actual Reddit data for these chairs into the Claude context. The "research" voice is a stylistic instruction, not a reference to actual research. Claude generates credible-sounding "research voice" content from training data, not from the actual Reddit summaries in data/reddit/published/.

**20. No A/B testing or content variant tracking.**
When a meta description is rewritten by execute-fixes.ts, the old version is not tracked. If CTR improves, TCA can't confirm it was the meta change (vs. position improvement, SERP feature change, or seasonal effect). There's no control group and no way to attribute outcomes to specific changes.

---

## Overengineered Areas

**21. Phase-2 analytics modules at current scale.**
Query entropy, impression gravity, informational→commercial intent transitions — these are genuinely sophisticated analytics. They're also computing on noise. At 29 clicks / 12,209 impressions / 90 days, the statistical confidence in any of these signals is too low to act on. The system is ready for 10x the current traffic. At current scale, simpler heuristics would produce the same decisions with less code.

**22. The 16-week history retention system.**
The history system correctly retains 16 weekly snapshots. But with only 1 snapshot, this is pure infrastructure overhead. Useful in 4 months. Irrelevant now.

---

## Underengineered Areas

**23. Content entity extraction.**
TCA mentions specific measurements constantly (seat height range, weight limit, seat depth range). These specs could be extracted, stored in a structured data layer, and served as Featured Snippet candidates. No entity extraction pipeline exists.

**24. Internal linking automation.**
The wiki tracks internal linking as a concept page, but no agent checks for missing internal links from high-value pages or automatically suggests/adds them. Internal link recommendations come from strategy.ts (vague) not from a systematic graph analysis.
