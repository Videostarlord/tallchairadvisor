# Weekly Plan — 2026-08-05

> ## 🛑 BLOCKED 2026-08-05 — DO NOT EXECUTE THE ITEMS BELOW
>
> The NEW CONTENT and REWRITE items in this plan derive from audit finding **C-1
> ("canonical/duplicate crisis between /best-office-chairs/ and
> /office-chairs-for-tall-people/"), which is a FALSE POSITIVE.**
>
> `/best-office-chairs/` is not a page. It is a live 301 redirect to
> `/office-chairs-for-tall-people/` (`public/_redirects:7`, verified returning
> HTTP 301 on 2026-08-05). The audit tool followed the redirect and compared the
> destination page to itself, which is why the titles and canonicals "matched".
> This is the WebFetch-follows-redirects failure mode CLAUDE.md already warns about.
>
> **Executing these items would be actively destructive:** creating a page at
> `/best-office-chairs/` collides with the redirect rule and would UNDO the
> 2026-07-04 consolidation that merged that URL into the money hub — recreating
> the exact cannibalization the merge fixed. The paired REWRITE would strip the
> money hub's commercial angle in favor of differentiating from a page that
> does not exist.
>
> Both items are struck below. See [[decisions-log]] 2026-08-04 and
> [[office-chairs-for-tall-people]].


## FIXES (Thursday agent)
<!-- Max 5 fixes. FILE path MUST exactly match one of the EXISTING PAGES listed above — no invented paths. -->






---

## NEW CONTENT (Friday agent)
<!-- ONLY for slugs that do NOT appear in the EXISTING PAGES list above. -->

- [x] ~~BLOCKED (false positive, see banner)~~ NEW: Best Office Chairs for Tall People — Reviewed by Height Bracket (2026) | best office chairs for tall people | /best-office-chairs/ | Answer-first buyer's guide segmented by height bracket (6'0"–6'3", 6'4"–6'5", 6'6"+); each bracket names a primary pick with seat height max, seat depth, back height, and tall-user verdict in a scannable table; use-case badges (All-Day, Home Office, Budget); author byline block with Jackson's credentials and methodology note; JSON-LD ItemList + Review schema for Gesture; affiliate CTAs with tag=tallchairadvi-20

> ⚠ **Note to Friday agent:** Before publishing, verify `/best-office-chairs/` does not already exist as a live page at that exact slug. The existing pages list does not include this slug but the audit references it alongside `/office-chairs-for-tall-people/` — if the file exists, route to REWRITE instead and do not duplicate.

---

## REWRITES (Thursday agent, lower priority)

- [x] ~~BLOCKED (false positive, see banner)~~ REWRITE: /office-chairs-for-tall-people/ | Differentiate from /best-office-chairs/ post-fix: update title to a distinct framing (e.g., "Office Chairs for Tall People: What to Look For by Height") and write a unique meta description emphasizing the fit-guide/education angle rather than product ranking; ensure the page's primary angle is dimensional guidance and fit criteria, not a product list — push affiliate-heavy content to /best-office-chairs/ | C-1 canonical crisis requires both pages to have distinct signals; this page should own the informational/guidance intent while /best-office-chairs/ owns transactional/buyer intent; splitting cleanly will stop authority dilution | FILE: src/pages/office-chairs-for-tall-people.astro

---

## STRATEGY NOTES

This week's priority is the canonical crisis and the two highest-opportunity pages. The /best-office-chairs/ fix addresses the most acute structural SEO problem on the site (authority split on the highest-value buyer query), while the four FIXES on /knee-pain-seat-depth/, /correct-chair-dimensions/, /review/leap-plus/, and /review/gesture/ attack the pages with the highest opportunity scores using specifically attributed competitor gaps rather than generic rewrites. The constraint has moved to traffic (per the Aug 4 decision log), so every action this week is aimed at converting existing impression volume into clicks — no new content pillars, no experimental pages.

## DROPPED TASKS (enforcement log — not for execution)

- [bad FILE ref: src/pages/best-office-chairs.astro] - [ ] FIX: /best-office-chairs/ | Resolve canonical/duplicate crisis: differenti
- [cooldown: src/pages/review/leap-plus.astro edited within 14d] - [ ] FIX: /review/leap-plus/ | Expand "Compare With" section into a full 3-colu
- [cooldown: src/pages/review/gesture.astro edited within 14d] - [ ] FIX: /review/gesture/ | Insert a structured verdict callout block immediat
- [cooldown: src/pages/knee-pain-seat-depth.astro edited within 14d] - [ ] FIX: /knee-pain-seat-depth/ | Add a visible Cornell citation block (inline
- [cooldown: src/pages/correct-chair-dimensions.astro edited within 14d] - [ ] FIX: /correct-chair-dimensions/ | Add a "Budget Tier Note" callout (2–3 se
