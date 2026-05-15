# Workflow Evaluation — 2026-05-11

Manual evaluation of the full Mon–Sat automated agentic pipeline. All scripts reviewed: monday.yml through saturday.yml, strategy.ts, execute-fixes.ts, execute-content.ts, verify-deploy.ts, audit.ts.

**Overall: 7.5/10 — Production-ready foundation with a few meaningful gaps**

---

## What's Working Well

**Layered defense system** — 4 independent safety nets: `enforcePlanConstraints()` drops bad tasks before execution, `execute-fixes.ts` has cooldowns + targeted edit path + 85% word-count guard, `execute-content.ts` has a 2-attempt validation loop + Haiku quality gate, and `verify-deploy.ts` runs 7 parallel checks before any deploy.

**Targeted edit path for meta/title** — Extracting just the prop value and applying it via regex (instead of full-file regeneration) eliminates most LLM failure modes: truncation, schema corruption, Unicode bleeding into frontmatter.

**Intelligence compounding** — GSC → `analysis.json` → `intelligence.json` → `strategy.ts` data flow. Wiki-as-persistent-memory (thesis, what-works, what-failed read by strategy.ts) prevents re-proposing failed fixes.

**Per-file rollback on build failure** — Thursday extracts the specific failing .astro file from build output, rolls it back individually, retries.

---

## Issues by Severity

### High — fix these

**H1: No API retry logic.**
Every agent uses a single `client.messages.create()` call with zero retry. If the Anthropic API returns a transient 529/5xx on Saturday, `verify-deploy.ts` fails, deploy is blocked. The data checks (secrets, voice, schema) don't need Claude — only the summary generation is at risk. Fix: 3-attempt loop with exponential backoff on the Claude call in verify-deploy.ts.

**H2: `execute-content.ts` creates wiki entity pages for failed tasks.**
At line 384, the wiki-entity-creation loop runs over all tasks regardless of whether `writeNewPage()` succeeded. Failed pages (quality gate rejected, validation failed) get wiki entity pages claiming they were created. Fix: add `if (result.success)` guard before the entity creation loop.

**H3: No human review gate before execution.**
Wednesday generates the plan, Thursday executes it, Saturday deploys — all without a human seeing the plan. A bad rewrite direction executes and deploys autonomously. Proposed fix: Thursday checks for a `reports/weekly-plan.approved` marker file. If missing, logs "awaiting approval" and exits 0. You push the file to approve. ~2 min effort per week, prevents bad autonomy.

### Medium — worth addressing

**M1: No prompt caching.**
`strategy.ts` sends full wiki context (thesis, what-works, what-failed, decisions-log, concept pages) + long system prompt every Wednesday. Static content that never changes run-to-run. Adding `anthropic-beta: prompt-caching-2024-07-31` header with `cache_control: {"type": "ephemeral"}` on static portions would cut Wednesday's cost ~70-80%.

**M2: Thursday/Friday force-push risk.**
If Thursday fails mid-run and leaves staging broken, Friday checks out that broken staging and force-pushes new content on top. No warning until Saturday. Thursday should verify build passes before force-pushing.

**M3: No failure notifications.**
If Monday's GSC pull fails, Tuesday runs on stale data silently. If Saturday deploy is blocked, you find out when you check email. A `curl` POST to a webhook at the end of each workflow failure path would surface failures immediately.

**M4: `execute-content.ts` wiki index update is fragile.**
`indexContent.replace('## Concept Pages', ...)` silently fails if that heading is renamed or table format changes. New page entries also get inserted above Concept Pages (wrong section).

### Low — minor polish

**L1: SerpAPI budget at scale.** 250 credits/month, ~23/run = ~10 full runs. If more pages added to analysis set or manual runs increase, limit is hit. Track credits in weekly summary or add `--dry-run` mode.

**L2: `checkVoice()` pattern list needs maintenance.** Only scans for named chairs `(aeron|leap|sihoo|doro)`. New chair pages with different naming could slip through. Update the pattern list when new chairs are added.

---

## Quick Wins (30 min each)

1. Fix wiki entity creation bug (H2): add `if (result.success)` guard in entity creation loop in execute-content.ts:384
2. Add API retry to verify-deploy.ts (H1): wrap Claude summary call in 3-attempt loop with `await new Promise(r => setTimeout(r, attempt * 2000))`
3. Prompt caching on strategy.ts (M1): add beta header + cache_control blocks on wiki context sections
