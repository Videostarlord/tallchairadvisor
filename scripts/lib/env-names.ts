/**
 * env-names.ts — one canonical spelling per credential, and a loud complaint
 * when something is configured under the other one (A8).
 *
 * THE PROBLEM, EXACTLY
 * Two credentials have two names each. The repo created `SERP_API_KEY` and
 * `DATAFORSEO_USERNAME` years ago; the vendors' own docs say `SERPAPI_KEY` and
 * `DATAFORSEO_LOGIN`. `collectors/quotas.ts` resolves each with `firstEnv(...)`
 * over BOTH spellings, so either one works — and that is the whole trouble.
 * Accepting both silently means the drift can never be observed: a machine
 * configured entirely with vendor spellings looks identical to one configured
 * correctly, right up until it runs something that reads only the canonical
 * name (`keyword-discovery.ts`, `keyword-gap-discovery.ts`,
 * `competitor-intelligence.ts` — none of which accept an alias) and aborts
 * saying a variable is unset while a populated variable holding that exact
 * credential sits next to it in the environment.
 *
 * The fix is not to drop the aliases. CI, `.env` files and Jackson's shell all
 * exist already, and a rename that breaks a night of collection to win a naming
 * argument is a bad trade. The fix is that compatibility must be VISIBLE:
 * accept the alias, and say so every single time, by name, with the rename.
 *
 * WHICH SPELLING IS CANONICAL, AND WHY IT IS THE REPO'S AND NOT THE VENDOR'S
 * Determined by what CI actually sets, not by preference — every workflow that
 * passes these credentials passes the repo spellings:
 *
 *   .github/workflows/nightly.yml          SERP_API_KEY, DATAFORSEO_USERNAME/PASSWORD
 *   .github/workflows/monday.yml           DATAFORSEO_USERNAME/PASSWORD
 *   .github/workflows/keywords-monthly.yml DATAFORSEO_USERNAME/PASSWORD
 *
 * No workflow sets `SERPAPI_KEY` or `DATAFORSEO_LOGIN`. Making the vendor
 * spelling canonical would mean renaming three GitHub secrets — and a secret
 * rename fails silently in Actions, which substitutes an empty string for a
 * name that does not exist. That failure mode is the one this repo has already
 * been bitten by (wiki/log.md, 2026-08-06: two secrets misnamed in nightly.yml,
 * the quota check "quietly blind"). The names the secrets already have win.
 *
 * NO VALUES ARE EVER PRINTED. Drift is reported by name, and where two
 * spellings disagree that fact is reported without either value.
 */

export interface EnvNameSpec {
  /** The spelling everything should use. What CI sets. */
  canonical: string;
  /** Historical / vendor-doc spellings still accepted, in resolution order. */
  aliases: string[];
  /** Where the alias is tolerated. Everywhere else reads `canonical` only. */
  acceptedBy: string;
  /**
   * Scripts that read the canonical name and DO NOT accept the alias, so an
   * alias-only setup breaks them. Empty when `acceptedBy` is the sole consumer —
   * and the difference matters, because claiming a script will break when it
   * does not is how a warning earns the right to be ignored.
   */
  brokenByAliasOnly: string[];
  /** Why the alias exists at all. */
  note: string;
}

export const ENV_NAMES: EnvNameSpec[] = [
  {
    canonical: 'SERP_API_KEY',
    aliases: ['SERPAPI_KEY'],
    acceptedBy: 'scripts/collectors/quotas.ts',
    // Verified by grep 2026-08-09: quotas.ts is the only reader in scripts/.
    // competitor-intelligence.ts moved to DataForSEO for SERP and no longer
    // reads a SerpAPI key at all, despite what some wiki pages still say.
    brokenByAliasOnly: [],
    note: "SERPAPI_KEY is SerpAPI's own documented name; SERP_API_KEY is the GitHub secret that exists.",
  },
  {
    canonical: 'DATAFORSEO_USERNAME',
    aliases: ['DATAFORSEO_LOGIN'],
    acceptedBy: 'scripts/collectors/quotas.ts',
    brokenByAliasOnly: [
      'scripts/keyword-discovery.ts',
      'scripts/keyword-gap-discovery.ts',
      'scripts/competitor-intelligence.ts',
    ],
    note: "DATAFORSEO_LOGIN is DataForSEO's own documented name; DATAFORSEO_USERNAME is the GitHub secret that exists.",
  },
];

export type DriftKind =
  /** Only the alias is set. Works in quotas.ts, fails everywhere else. */
  | 'alias-only'
  /** Both set, same value. Harmless, but one of them is dead weight. */
  | 'redundant'
  /** Both set, DIFFERENT values. Which one wins depends on which script reads it. */
  | 'conflict';

export interface EnvNameDrift {
  kind: DriftKind;
  canonical: string;
  alias: string;
  spec: EnvNameSpec;
}

/** Trimmed value, or null when unset or blank — matches collectors/types.envValue. */
function value(env: NodeJS.ProcessEnv, name: string): string | null {
  const raw = env[name];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Every non-canonical spelling currently present in the environment.
 *
 * A credential that is simply unset is NOT drift. `.env.example` documents an
 * empty value as a tracked gap that the collectors already report as a finding,
 * and duplicating that here would bury the real signal under a list of things
 * nobody has configured yet.
 */
export function detectEnvNameDrift(env: NodeJS.ProcessEnv = process.env): EnvNameDrift[] {
  const drift: EnvNameDrift[] = [];
  for (const spec of ENV_NAMES) {
    const canonical = value(env, spec.canonical);
    for (const alias of spec.aliases) {
      const aliasValue = value(env, alias);
      if (aliasValue === null) continue;
      if (canonical === null) {
        drift.push({ kind: 'alias-only', canonical: spec.canonical, alias, spec });
      } else if (canonical === aliasValue) {
        drift.push({ kind: 'redundant', canonical: spec.canonical, alias, spec });
      } else {
        drift.push({ kind: 'conflict', canonical: spec.canonical, alias, spec });
      }
    }
  }
  return drift;
}

/** One line per drift. Never contains a credential value. */
export function describeEnvNameDrift(drift: EnvNameDrift): string {
  switch (drift.kind) {
    case 'alias-only': {
      const consequence =
        drift.spec.brokenByAliasOnly.length === 0
          ? `${drift.spec.acceptedBy} is the only reader, so nothing is broken today — but the ` +
            `GitHub secret is named ${drift.canonical}, and a second spelling is a second place ` +
            `to keep in sync.`
          : `${drift.spec.brokenByAliasOnly.join(', ')} read ${drift.canonical} only and will ` +
            `abort saying it is unset.`;
      return (
        `${drift.alias} is set but ${drift.canonical} is NOT. This works only because ` +
        `${drift.spec.acceptedBy} accepts both spellings. ${consequence} ` +
        `Rename it to ${drift.canonical}. ${drift.spec.note}`
      );
    }
    case 'conflict':
      return (
        `${drift.alias} and ${drift.canonical} are BOTH set and hold DIFFERENT values. ` +
        `Which one is used depends on which script is running — ${drift.spec.acceptedBy} ` +
        `prefers ${drift.canonical}, and nothing else looks at ${drift.alias} at all. ` +
        `Delete ${drift.alias} and keep ${drift.canonical}.`
      );
    case 'redundant':
      return (
        `${drift.alias} duplicates ${drift.canonical} (same value). Harmless today, but it is ` +
        `a second place to update and a silent failure the day the two stop matching. ` +
        `Delete ${drift.alias}.`
      );
  }
}

/**
 * Print every drift, loudly, on stderr. Returns what it found so a caller can
 * record it. Never throws and never exits: a machine that is configured under
 * the old names must keep working, or this becomes the outage it was written to
 * prevent. Visible, not fatal — that is the entire point of A8.
 */
export function warnOnEnvNameDrift(
  env: NodeJS.ProcessEnv = process.env,
  log: (message: string) => void = console.error
): EnvNameDrift[] {
  const drift = detectEnvNameDrift(env);
  if (drift.length === 0) return drift;

  log('');
  log('┌─ ENV NAME DRIFT ────────────────────────────────────────────────────────');
  log(`│ ${drift.length} credential(s) are configured under a non-canonical name.`);
  for (const item of drift) {
    log(`│`);
    log(`│ [${item.kind}] ${describeEnvNameDrift(item)}`);
  }
  log('│');
  log('│ Canonical names are listed in .env.example and are the names the GitHub');
  log('│ secrets actually have. This warning does not fail anything.');
  log('└─────────────────────────────────────────────────────────────────────────');
  log('');
  return drift;
}

/**
 * A sentence to append to a "VAR must be set" abort, when the operator has in
 * fact set the credential under an alias. Without this the message is actively
 * misleading: it names a variable as missing while the value sits in the
 * environment under its other name.
 */
export function aliasHint(canonical: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const spec = ENV_NAMES.find((entry) => entry.canonical === canonical);
  if (spec === undefined) return null;
  const found = spec.aliases.filter((alias) => value(env, alias) !== null);
  if (found.length === 0) return null;
  return (
    `${found.join(' / ')} IS set — this script reads ${canonical} only. ` +
    `Rename it: ${canonical} is the canonical name (see .env.example).`
  );
}
