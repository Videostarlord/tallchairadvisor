/**
 * gsc-sitemap.ts — P2. Submit the sitemap through the Search Console API and
 * READ BACK the result.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SET EXPECTATIONS FIRST: THIS WILL NOT MOVE TRAFFIC
 *
 * The sitemap is already submitted and Google refetches it on its own schedule.
 * Submitting again changes nothing unless the file structurally changed. This
 * exists because it is cheap and closes a loop — the deploy that changes the
 * sitemap is now the thing that tells Google — not because it will do anything
 * for rankings. Anyone reading a traffic change into this run is reading noise.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * READ BACK, OR IT IS AN UNVERIFIED WRITE
 *
 * `sitemaps.submit` returns 204 No Content. It tells you the request was
 * accepted, NOT that Google recorded a submission, and certainly not that the
 * sitemap parsed. A script that exits 0 on that 204 would report success for a
 * sitemap Google rejected — a green check over an unverified claim, which is the
 * failure this codebase keeps finding in its own history.
 *
 * So every run submits and then calls `sitemaps.get`, asserting:
 *   - the sitemap is registered at all;
 *   - `lastSubmitted` actually advanced past when we started;
 *   - `errors` and `warnings` are zero.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * PERMISSION: `siteFullUser` IS ENOUGH. MEASURED, NOT ASSUMED.
 *
 * The service account holds `siteFullUser` on https://tallchairadvisor.com/, and
 * the common reading of Google's docs is that `sitemaps.submit` needs
 * `siteOwner`. That reading is wrong, or at least not enforced: a real submit
 * ran successfully on 2026-08-09 under `siteFullUser` and `lastSubmitted`
 * advanced from 2026-08-06T09:49:58Z to 2026-08-09T06:42:02Z with zero errors
 * and zero warnings.
 *
 * Recorded here because the opposite was predicted an hour earlier and would
 * have become a permanent "blocked on Jackson granting Owner" note for a thing
 * that already works. No permission change is required.
 *
 * The 403 branch below is kept anyway — permission levels can change, and when
 * that happens the operator deserves an instruction rather than a stack trace.
 *
 * Usage:
 *   npx tsx scripts/gsc-sitemap.ts [--sitemap sitemap-index.xml] [--dry-run]
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CREDENTIALS_PATH = resolve(ROOT, 'credentials/gsc-service-account.json');
const SITE_URL = 'https://tallchairadvisor.com/';

/**
 * Read-WRITE scope. gsc-pull.ts requests `webmasters.readonly`, which is correct
 * for it and insufficient here — submitting under a readonly scope fails with a
 * 403 that looks exactly like a missing-permission error and wastes a debugging
 * session. Requested per-client, so this widening does not touch the pull path.
 */
const SCOPE_READWRITE = 'https://www.googleapis.com/auth/webmasters';

interface Args { sitemap: string; dryRun: boolean }

function parseArgs(argv: string[]): Args {
  const a: Args = { sitemap: 'sitemap-index.xml', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--sitemap') {
      const v = argv[++i];
      if (v === undefined) throw new Error('--sitemap requires a value');
      a.sitemap = v;
    } else if (flag === '--dry-run') {
      a.dryRun = true;
    } else if (flag.startsWith('--')) {
      throw new Error(`unknown flag ${flag}`);
    }
  }
  return a;
}

function credentials(): Record<string, unknown> {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `no service-account key at ${CREDENTIALS_PATH}. In CI it is written from the ` +
      'GSC_SERVICE_ACCOUNT_JSON secret; locally, place the key file there.',
    );
  }
  // lint-architecture-allow R4 -- a malformed credential must throw and stop the run, never be worked around
  return JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8')) as Record<string, unknown>;
}

/** Turns googleapis' error shapes into one sentence that says what to do. */
function explain(error: unknown, sitemapUrl: string): string {
  const err = error as { code?: number; message?: string; errors?: { message?: string }[] };
  const code = err.code;
  const detail = err.errors?.[0]?.message ?? err.message ?? String(error);

  if (code === 403) {
    return (
      `403 from the Search Console API: ${detail}\n` +
      '\n' +
      'This worked under `siteFullUser` on 2026-08-09, so a 403 now means the\n' +
      "account's permission on the property was reduced, or the key was rotated.\n" +
      '\n' +
      'Fix (Jackson, in the UI — an API cannot grant its own access):\n' +
      '  Search Console -> Settings -> Users and permissions\n' +
      '  -> find the service-account email -> restore Full or Owner\n' +
      '\n' +
      'Nothing is broken by leaving this unfixed: Google refetches the sitemap on\n' +
      'its own schedule regardless, exactly as it did before P2 existed.'
    );
  }
  if (code === 404) {
    return (
      `404: ${sitemapUrl} is not registered on ${SITE_URL} and could not be read back.\n` +
      'Check the path, or submit it once by hand in the Search Console UI.'
    );
  }
  return `Search Console API error${code === undefined ? '' : ` (${code})`}: ${detail}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const sitemapUrl = new URL(args.sitemap, SITE_URL).toString();

  const auth = new google.auth.GoogleAuth({ credentials: credentials(), scopes: [SCOPE_READWRITE] });
  const webmasters = google.webmasters({ version: 'v3', auth });

  // Captured BEFORE the submit so "did lastSubmitted advance" is answerable.
  // Comparing against the value the same call returns afterwards would prove
  // nothing at all.
  let before: string | null = null;
  try {
    const existing = await webmasters.sitemaps.get({ siteUrl: SITE_URL, feedpath: sitemapUrl });
    before = existing.data.lastSubmitted ?? null;
    console.log(`[gsc-sitemap] current: lastSubmitted=${before ?? '(never)'} errors=${existing.data.errors ?? 0} warnings=${existing.data.warnings ?? 0}`);
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 404) console.log(`[gsc-sitemap] ${sitemapUrl} is not yet registered — this run would register it.`);
    else throw new Error(explain(error, sitemapUrl));
  }

  if (args.dryRun) {
    console.log('[gsc-sitemap] --dry-run: read the current state, submitted nothing.');
    return;
  }

  const submittedAt = new Date();
  try {
    await webmasters.sitemaps.submit({ siteUrl: SITE_URL, feedpath: sitemapUrl });
  } catch (error) {
    console.error(`[gsc-sitemap] submit failed.\n\n${explain(error, sitemapUrl)}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[gsc-sitemap] submitted ${sitemapUrl} (HTTP 204 — accepted, NOT yet verified)`);

  // ── The read-back. Everything above is only a request. ──────────────────────
  let after;
  try {
    after = await webmasters.sitemaps.get({ siteUrl: SITE_URL, feedpath: sitemapUrl });
  } catch (error) {
    console.error(`[gsc-sitemap] submitted, but the read-back FAILED — the write is unverified.\n\n${explain(error, sitemapUrl)}`);
    process.exitCode = 1;
    return;
  }

  const lastSubmitted = after.data.lastSubmitted ?? null;
  const errors = Number(after.data.errors ?? 0);
  const warnings = Number(after.data.warnings ?? 0);
  const isPending = after.data.isPending === true;

  console.log(`[gsc-sitemap] read back: lastSubmitted=${lastSubmitted ?? '(none)'} errors=${errors} warnings=${warnings} pending=${isPending}`);

  const problems: string[] = [];
  if (lastSubmitted === null) {
    problems.push('lastSubmitted is absent after a successful submit — Google did not record it');
  } else {
    const advanced = new Date(lastSubmitted).getTime() >= submittedAt.getTime() - 60_000;
    if (!advanced) {
      problems.push(
        `lastSubmitted (${lastSubmitted}) did not advance past this run (${submittedAt.toISOString()})` +
        `${before === null ? '' : `; it is unchanged from before the submit (${before})`} — the submission was not recorded`,
      );
    }
  }
  if (errors > 0) problems.push(`${errors} error(s) reported against the sitemap`);
  if (warnings > 0) problems.push(`${warnings} warning(s) reported against the sitemap`);

  if (problems.length > 0) {
    console.error('[gsc-sitemap] VERIFICATION FAILED:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }

  console.log('[gsc-sitemap] verified: submission recorded, zero errors, zero warnings.');
}

main().catch((error: unknown) => {
  console.error(`[gsc-sitemap] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
