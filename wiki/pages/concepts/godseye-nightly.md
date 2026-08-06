# God's-Eye Nightly

**Type:** concept · **Status:** built, unpushed · **Created:** 2026-08-06
**Spec:** `raw/strategy/2026-08-05-godseye-PRD.md` · **Branch:** `feat/godseye-nightly`

The observation layer over the Mon–Sat pipeline. It does not replace that pipeline — it watches it, proves what it claims, and alarms when it goes quiet.

## Why it exists

TCA's failures were silent by construction. Three examples, all real:

| Failure | How long it hid | Why nothing caught it |
|---|---|---|
| `reconcileInterventions` reconciled nothing | months | `raw.pages ?? []` on a key that does not exist → empty Map → byte-identical rewrite → green checkmark |
| June 16 GA4 CSP incident | ~1 month | the `gtag.js` script tag still loaded 200; only the *hit* was blocked, and nothing asserted on the hit |
| Cost visibility | since 2026-05-15 | 8 token-log entries for 15 `messages.create` sites; no pricing logic anywhere |

The unifying shape: **a component returned a degraded-but-plausible value instead of failing loudly.** Every rule below exists to make that impossible.

## The invariant

> No component may return a degraded-but-plausible value. Every failure is loud, named, and lands in the ledger.

Concretely, and each of these is enforced rather than documented:

- A missing key **throws**, naming the file, the key, and the expectation — it never defaults to `[]`.
- A collector that returns nothing writes `healthy: false` **with a specific reason** — never an empty section.
- A finding cannot be filed without a **machine-evaluable closure predicate**. If an agent cannot say how a fix would be verified, it does not get to claim the problem exists.
- A value the system could not measure is `null` or `unevaluable` — **never `0`, never `NaN`, never `false`**.
- The report renders anything without a contract or predicate behind it as `unverified`, and states its own coverage percentage.

## Layers

| Layer | Lives in | Does |
|---|---|---|
| L0 contracts | `scripts/lib/read-validated.ts`, `scripts/schemas/` | every read validates; throws `ContractViolation` with a "did you mean" hint |
| L1 collectors | `scripts/collectors/` | GSC (incl. URL Inspection), GA4, Clarity, Cloudflare, GitHub Actions, quotas, Amazon |
| L2 probes | `scripts/probes/` | Playwright: tags actually firing, `<head>` truth, CWV, GEO markup |
| L3 ledger | `scripts/lib/ledger.ts`, `scripts/lib/predicates/` | append-only state per finding + nightly predicate re-evaluation |
| L4 cost | `scripts/lib/metered-client.ts`, `pricing.ts` | every LLM call priced at write time |
| L5 report | `scripts/nightly-report.ts` | one Sonnet call over the whole ledger → `wiki/nightly/` + phone |
| L6 dead-man | `scripts/deadmans-switch.ts` | alarms on **absence** — must run from a second repo |
| L7 corrector | `scripts/corrector.ts` | bounded, deterministic auto-fixes only; no LLM |

## The three rules that carry the most weight

1. **A finding needs a closure predicate to exist.** This is what turns "the audit said something" into "the system can prove whether it is still true". It is why findings auto-close with evidence and why `regressed` is detectable at all.

2. **`regressed` is the highest-value output.** A finding that passed its predicate and later fails is the case nothing previously caught. Because `findingId = sha1(page|issueClass)` is stable, a re-raised finding collides with the closed one by construction rather than appearing as new work.

3. **Blindness is not failure.** `unevaluable` never counts as pass or fail and never increments the escalation counter. Escalating because the system could not look would poison the ledger with its own gaps.

## Operating it

```bash
npm run collect:all      # L1 — writes data/collectors/
npm run probe            # L2 — writes data/probes/YYYY-MM-DD.json
npm run ledger:evaluate  # L3 — re-runs every open predicate, writes data/ledger-state.json
npm run cost:rollup      # L4 — writes data/cost-summary.json
npm run nightly          # L5 — writes wiki/nightly/YYYY-MM-DD.md + heartbeat
npm run godseye          # collect + evaluate + report
npm run lint:architecture   # ratchet; --strict once migration completes
npm run correct -- --dry-run
```

CI: `.github/workflows/nightly.yml` at 10:00 UTC (03:00 PT). Almost every step is `continue-on-error` and the report is `if: always()` — **an unhealthy collector is a successful run of the observation system.** A nightly that aborted on the first bad collector would recreate the silent-failure class it exists to kill.

## Open items

- **`CLOUDFLARE_API_TOKEN` is the only blocking credential** (PRD §10.1). Needs Account → Pages:Read, Zone → Analytics:Read, Zone → Firewall Services:Read. Finding `205a75e80e2a` auto-closes once set.
- **`NTFY_TOPIC` is unset**, so the phone push and the dead-man's alarm have no delivery channel. The switch says so loudly, but until it is set, absence alarms nowhere.
- **The dead-man's switch is not yet deployed to a second repo.** Until it is, the build has only moved silent failure up one level. See `scripts/deadmans-switch.README.md`.
- **Architecture lint baseline is 172.** New violations fail today; the backlog ratchets down as call sites migrate to `readValidated`. `--strict` is the end-state gate.
- **Probe files are ~470KB/night** (~14MB/month), 52% of it retained JSON-LD used as closure evidence. No retention policy set — a decision for Jackson.

## Related

[[gsc-performance]] · [[schema-markup]] · [[decisions-log]] · [[thesis]]
