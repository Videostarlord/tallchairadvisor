/**
 * site.ts — which site is this run about?
 *
 * THE PROBLEM THIS EXISTS FOR
 * Every alarm this pipeline raises is site-blind. `nightly-report.ts` pushed
 * `God's-Eye 2026-08-13 (88% coverage)` to the phone and hardcoded
 * `tallchairadvisor.com` into the model prompt. With one site that is fine,
 * because there is nothing to confuse it with. With two, the lock screen shows
 * two notifications that are byte-for-byte indistinguishable except for a
 * percentage — which is the same as no notification, because the one question
 * being asked ("is MY site broken, and which one") is the one the alert cannot
 * answer. That is the A13 shape again: a detector that fires and tells you
 * nothing actionable is not better than one that does not fire.
 *
 * WHY THIS IS ONE ENV VAR AND NOT A CONFIG FRAMEWORK
 * ~56 files in `scripts/` mention tallchairadvisor.com. Extracting a general
 * `site.config.ts` from ONE example would be inventing an abstraction against a
 * sample size of one, and the second site is what tells you which of those
 * couplings actually hurt. So this deliberately does the smallest correct thing:
 * name the site, in the two places whose output a human reads, from one
 * overridable source. Everything else keeps its literal until a second site
 * proves what needs to move.
 *
 * WHY IT IS CHEAP NOW AND NOT LATER
 * Same reason `agent` belongs on a ledger record: an alert that went out without
 * saying which site it was about cannot be re-attributed afterwards. The
 * notification is gone. There is no backfill for a push.
 *
 * NO VALIDATION, DELIBERATELY. A domain typo produces a wrong-looking label in a
 * report title, which is visible and harmless. A regex that rejects a legitimate
 * domain would abort the nightly and suppress the heartbeat — trading a cosmetic
 * failure for the dead-man's switch. Never worth it.
 */

/** The site this repo deploys. Overridable so a fork does not have to patch code. */
export const DEFAULT_SITE_DOMAIN = 'tallchairadvisor.com';

/** Trimmed value, or null when unset or blank — same convention as env-names.ts. */
function value(env: NodeJS.ProcessEnv, name: string): string | null {
  const raw = env[name];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Full domain, e.g. `tallchairadvisor.com`. Used where there is room to be
 * unambiguous: the model prompt, report bodies, log lines.
 */
export function siteDomain(env: NodeJS.ProcessEnv = process.env): string {
  return value(env, 'SITE_DOMAIN') ?? DEFAULT_SITE_DOMAIN;
}

/**
 * Short name for places with a character budget — the ntfy title above all.
 *
 * Defaults to the first DNS label (`tallchairadvisor.com` → `tallchairadvisor`)
 * because that is the part that differs between two sites in the same fleet,
 * and `.com` costs four characters of a lock-screen preview to say nothing.
 *
 * `SITE_LABEL` overrides it, and that override is not decoration: two sites on
 * the same TLD-adjacent name (`tallchair.com` vs `tallchair.io`) collapse to the
 * same first label, which would rebuild the exact ambiguity this file removes.
 */
export function siteLabel(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = value(env, 'SITE_LABEL');
  if (explicit !== null) return explicit;
  const domain = siteDomain(env);
  const first = domain.split('.')[0];
  return first !== undefined && first !== '' ? first : domain;
}
