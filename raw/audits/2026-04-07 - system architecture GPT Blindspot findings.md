# 2026-04-07 - system architecture GPT Blindspot findings

## Scope

Critical audit of:
- The website/system architecture and shipped content
- The agent workflow used to build, edit, deploy, and maintain the site

Repository inspected:
- `src/`
- `scripts/agents/`
- `.github/workflows/`
- `public/`
- `wiki/`
- `raw/`
- top-level operational docs

Build verification:
- `npm run build` completed successfully on 2026-04-07

---

## Top Findings

### 1. Critical — Saturday "Verify + deploy" is not a real production gate

**What the issue is**

The documentation frames Saturday verification as the deploy gate, but production deploys happen on every push to `main`. Thursday and Friday both push directly after agent-written changes.

**Evidence**

- `SESSION-SUMMARY.md` says Cloudflare Pages auto-deploys on every push to `main`
- `.github/workflows/thursday.yml` runs the fixes agent, builds, commits, then `git push`
- `.github/workflows/friday.yml` runs the content agent, conditionally builds, commits, then `git push`
- `.github/workflows/saturday.yml` runs later and only verifies what is already in the repo
- `AUTOMATION-SYSTEM.md` claims Saturday blocks deploy if checks fail

**Why this is a blind spot**

The docs describe a final gate that does not actually control release. That can create strong false confidence because the process reads like "changes are verified before deploy" when the real behavior is "changes are already deployed, then reviewed later."

**Real failure mode or consequence**

Bot-written changes can go live on Thursday or Friday even if Saturday would have rejected them.

**Recommended fix**

- Move agent-written changes to a staging branch or preview environment
- Gate promotion to `main` behind final verification
- Add a human approval step before promotion for production-bound content changes

**How to verify the fix**

- Trigger Thursday or Friday manually
- Confirm Cloudflare production does not change until the final promotion step runs

---

### 2. Critical — The Thursday fix agent is not receiving the actual fix instructions

**What the issue is**

The Wednesday planner emits fixes in the format:

`- [ ] FIX: [page path] | [what to change] | [why] | FILE: src/pages/[path].astro`

But the Thursday parser only captures the first field before the first pipe and sends that truncated text as the requested fix.

**Evidence**

- `scripts/agents/strategy.ts` defines the structured format
- `scripts/agents/execute-fixes.ts` uses:
  - `/- \[[ x]\] (?:FIX|REWRITE): (.+?) \| .+? \| FILE: (src\/pages\/.+\.astro)/`
  - This stores only the first field in `description`
- `scripts/agents/execute-fixes.ts` then sends `FIX REQUIRED: ${task.description}` to the model

**Why this is a blind spot**

The workflow looks structured and parseable, but the key field the execution agent actually needs is being discarded before execution.

**Real failure mode or consequence**

The fix agent can rewrite files without being given the intended change. Logs can still show success, which makes this a particularly dangerous false-positive path.

**Recommended fix**

- Parse the plan into explicit fields: target page, change request, rationale, file path
- Refuse to run if any line does not parse cleanly
- Log the exact fix instruction sent to the model

**How to verify the fix**

- Add a unit test around `parsePlan()`
- Run it against a sample weekly plan and confirm the exact `what to change` text survives into the model prompt

---

### 3. High — The verification layer gives false confidence

**What the issue is**

Several checks either run too narrowly or are effectively disabled by workflow ordering.

**Evidence**

- `scripts/agents/verify-deploy.ts` marks schema validation as passed if `dist/` does not exist
- `.github/workflows/saturday.yml` runs `verify-deploy.ts` before `npm run build`
- `checkSecrets()` scans only `src/**/*.astro`
- `checkVoice()` uses a small regex set that misses many real first-person claims on non-Gesture pages

**Why this is a blind spot**

The weekly summary can report "all checks passed" even when important classes of failures were never actually tested.

**Real failure mode or consequence**

- Broken JSON-LD can pass
- Secrets outside `src/` can pass
- Trust-breaking voice violations can pass

**Recommended fix**

- Build first, then run schema checks against built HTML
- Fail closed if `dist/` is missing
- Expand secret scanning beyond `src/`
- Replace narrow regex matching with a stronger allow/deny review step for non-Gesture pages

**How to verify the fix**

- Seed one invalid JSON-LD block
- Seed one fake secret in `scripts/`
- Seed one non-Gesture first-person testing claim
- Confirm CI fails all three

---

### 4. High — Core chair specs are already inconsistent and wrong on live pages

**What the issue is**

The repo contains conflicting statements about the Herman Miller Aeron Size C seat depth. Some pages say it is fixed at 18.5". Others say it has an adjustable 18.5–20.5" seat depth range.

**Evidence**

- `src/pages/knee-pain-seat-depth.astro` states the Aeron Size C has an adjustable 18.5–20.5" seat depth range
- `src/pages/office-chairs-for-tall-people.astro` repeats the same claim
- `src/pages/office-chairs-for-6-foot-4.astro`, `src/pages/office-chairs-for-6-foot-5.astro`, and `src/pages/office-chairs-for-6-foot-6.astro` describe the Aeron seat depth as fixed at 18.5"
- The contradiction is present in built HTML, not just source files
- GSC data shows `/knee-pain-seat-depth/` at 178 impressions and average position 8

**Why this is a blind spot**

Specs are duplicated inline across many pages and schema/FAQ blocks. That makes inconsistency likely and hard to spot until it is already live.

**Real failure mode or consequence**

The site can give contradictory buying advice on one of its core "dimension-first" claims. That directly damages credibility and can propagate into FAQ snippets or AI summaries.

**Recommended fix**

- Centralize chair specs into one canonical typed data source
- Generate repeated spec blocks, tables, and FAQ answers from that source
- Audit every existing chair spec mention against the canonical source

**How to verify the fix**

- Add a consistency check that flags any Aeron seat-depth mention deviating from the canonical value
- Rebuild and grep built HTML for old contradictory ranges

---

### 5. High — Shipped content contradicts the repo's own "only Gesture was personally tested" rule

**What the issue is**

The docs say Jackson has only personally tested the Steelcase Gesture. Live content still makes broader first-person testing claims on non-Gesture pages.

**Evidence**

- `CLAUDE.md` states Jackson only personally tested the Gesture
- `src/pages/index.astro` says "I started systematically testing chairs in 2019" and "15+ chairs evaluated"
- `src/pages/office-chairs-for-6-foot-5.astro` says "the Leap Plus is the chair I return to after testing others"
- `src/pages/chairs/steelcase-leap-plus/index.astro` uses first-person setup measurements for the Leap Plus
- `src/pages/office-chairs-for-6-foot-6.astro` says "I'm 6'4" and test chairs professionally"

**Why this is a blind spot**

The rule exists in prompts and docs, but the workflow does not enforce it strongly enough to keep it out of production content.

**Real failure mode or consequence**

The site overstates first-hand experience on affiliate content. That is a trust and disclosure problem, not just a tone issue.

**Recommended fix**

- Rewrite non-Gesture pages to use honest research/spec framing only
- Add a dedicated content audit pass for implied first-hand claims, not just a few exact banned phrases
- Treat trust/disclosure violations as release-blocking issues

**How to verify the fix**

- Run a repo-wide first-person audit on all non-Gesture pages
- Manually review every hit before deployment

---

### 6. Medium — Unfinished editorial markers and pseudo-citations are being shipped to production HTML

**What the issue is**

Several pages contain visible draft markers, image placeholders, or citation placeholders that survive the build.

**Evidence**

- `src/pages/office-chairs-for-6-foot-4.astro` contains two visible `[IMAGE: ...]` placeholders
- `src/pages/office-chairs-for-6-foot-5.astro` contains visible `[ORIGINAL DATA]`
- `src/pages/office-chairs-for-6-foot-3.astro` contains `([PERSONAL EXPERIENCE]: ...)`
- `src/pages/office-chairs-for-6-foot-4.astro` contains multiple bracketed non-link citation placeholders
- These markers are present in built `dist/` HTML

**Why this is a blind spot**

`npm run build` proves syntax validity, not editorial completeness.

**Real failure mode or consequence**

Users and crawlers can see obvious draft residue on otherwise polished pages, which makes finished content look unreviewed.

**Recommended fix**

- Add a content-lint step that fails on known placeholder tokens
- Add a publishability scan against built HTML, not just source files

**How to verify the fix**

- Fail CI on `\[IMAGE:`, `\[ORIGINAL DATA\]`, `\[PERSONAL EXPERIENCE\]`, and bracket-only citation patterns

---

### 7. Medium — Desktop navigation is not keyboard-accessible

**What the issue is**

Desktop dropdown menus rely on hover state rather than proper keyboard-operable disclosure behavior.

**Evidence**

- `src/components/Header.astro` uses `group-hover:block` for desktop submenus
- Desktop submenu buttons expose `aria-expanded="false"` but are not wired to open on keyboard focus or click for desktop interaction

**Why this is a blind spot**

Mouse testing makes the header look complete. Keyboard and assistive-tech behavior is weaker than the visual UI suggests.

**Real failure mode or consequence**

Keyboard users cannot reliably reach important review and comparison pages through the primary nav.

**Recommended fix**

- Replace hover-only desktop menus with proper click/focus disclosure behavior
- Add focus management and escape handling

**How to verify the fix**

- Navigate the desktop header using only the keyboard
- Confirm every submenu can be opened, traversed, and closed accessibly

---

## Workflow Blind Spots

- The process documents `/blog-analyze` as a hard quality gate, but there is no corresponding script in `package.json`
- The repo has no `test` or `lint` script. A green week mostly means "Astro compiled"
- All scheduled workflows have `contents: write` and push directly to the main repo branch, which maximizes blast radius
- Saturday assumes `git push` equals "deployed" but does not check live Cloudflare status or run post-deploy smoke tests
- The system claims to be "fully automated" with minimal manual input, which encourages operators to trust automation more than the actual guardrails justify

---

## Missing Coverage

- Cloudflare Pages settings, preview/prod separation, environment variables, and branch protection could not be verified from the repo alone
- There is no real backend application here to audit for server auth/session bugs; the live app is effectively a static site
- Contact handling is a client-side `mailto:` pattern, not a form backend
- No external fact-check was performed against every vendor spec sheet; only contradictions provable from local code were flagged

---

## Recommended Next Reviews

1. Audit GitHub branch protection, Cloudflare deployment settings, and preview/prod separation
2. Add parser-level tests for all agent workflow scripts
3. Add content linting and built-HTML publishability checks
4. Centralize chair spec data and regenerate repeated content from one source
5. Run a trust/disclosure pass on every non-Gesture page before the next production release
