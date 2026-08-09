/**
 * asin-check.ts — A10 / P4. Do the affiliate links still resolve?
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE GAP THIS CLOSES
 *
 * Three layers touch affiliate links and none of them answer "is this link alive
 * today":
 *   - lint:content validates ASINs against an allowlist — static, build-time.
 *   - the probe injects a SYNTHETIC Amazon link (B0PROBE000) to test the click
 *     handler, and deliberately never touches the real ones.
 *   - verify-deploy.ts checks presence, not liveness.
 *
 * So when Amazon delists an ASIN the page keeps rendering the link, keeps
 * sending clicks, and earns nothing — silently, indefinitely. `affiliate-missing`
 * is already alwaysInScope; a DEAD link is the same lost revenue and had no
 * detector at all.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY FIRECRAWL AND NOT THE PLAYWRIGHT PROBE
 *
 * Amazon hard-blocks datacenter IPs, so this cannot run from Actions with
 * Playwright — it would collect bot walls, not listings. Firecrawl is the right
 * tool. ~20 ASINs a month is under 4% of the 500-page free tier, and every call
 * is metered through meterExternal so it shows up in `cost:rollup` rather than
 * quietly eating quota another agent was relying on.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * A FAILED FETCH IS NOT A DEAD PRODUCT
 *
 * See lib/asin-liveness.ts. `dead` needs a positive unavailability signal;
 * timeouts, bot walls and HTTP errors are `unknown` and file nothing. A detector
 * that reported dead links on a bad night would get a working, earning affiliate
 * link deleted — costing exactly the revenue it exists to protect.
 *
 * Usage:
 *   npx tsx scripts/asin-check.ts [--limit 25] [--dry-run] [--asin B016OIF2JU]
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { classifyListing, extractAsins, type Liveness } from './lib/asin-liveness.js';
import { meterExternal } from './lib/metered-client.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES_DIR = resolve(ROOT, 'src/pages');
const REGISTRY_PATH = resolve(ROOT, 'data/verified-asins.json');
const OUT_PATH = resolve(ROOT, 'data/collectors/asin-liveness.json');

/** Free tier is 500 pages/month; this cap keeps one run well inside it. */
const DEFAULT_LIMIT = 25;
const today = () => new Date().toISOString().slice(0, 10);

interface Args { limit: number; dryRun: boolean; only: string[] }

function parseArgs(argv: string[]): Args {
  const a: Args = { limit: DEFAULT_LIMIT, dryRun: false, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${flag} requires a value`);
      return v;
    };
    switch (flag) {
      case '--limit': a.limit = Number.parseInt(next(), 10); break;
      case '--dry-run': a.dryRun = true; break;
      case '--asin': a.only.push(next().toUpperCase()); break;
      default: if (flag.startsWith('--')) throw new Error(`unknown flag ${flag}`);
    }
  }
  if (!Number.isFinite(a.limit) || a.limit < 1) throw new Error('--limit must be a positive number');
  return a;
}

/** Every ASIN actually linked from a live page, with the pages that link it. */
function asinsInUse(): Map<string, string[]> {
  const uses = new Map<string, string[]>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith('.astro')) continue;
      const rel = full.slice(ROOT.length + 1);
      for (const asin of extractAsins(readFileSync(full, 'utf-8'))) {
        // Explicit rather than `?? []` (R1): this is a first-sight accumulator on
        // a map this function owns, not a default over external input.
        const existing = uses.get(asin);
        if (existing === undefined) uses.set(asin, [rel]);
        else existing.push(rel);
      }
    }
  };
  walk(PAGES_DIR);
  return uses;
}

interface RegistryFile {
  asins: Record<string, { product?: string }>;
  known_dead?: Record<string, string>;
}

function readRegistry(): RegistryFile {
  // lint-architecture-allow R4 -- the registry is a committed source-of-truth file; a malformed one must stop the run, since continuing would mean checking against an unknown allowlist
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as RegistryFile;
}

async function scrape(asin: string, apiKey: string): Promise<Liveness> {
  const url = `https://www.amazon.com/dp/${asin}`;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 60_000 }),
      signal: AbortSignal.timeout(70_000),
    });

    // Metered on every attempt, including failures — Firecrawl bills the attempt,
    // so counting only successes would under-report the quota actually consumed.
    meterExternal({ agent: 'asin-check', run: today(), purpose: 'asin-liveness', service: 'firecrawl', unit: 'pages', amount: 1 });

    if (!res.ok) {
      return classifyListing('', { httpOk: false, status: res.status });
    }
    const data = (await res.json()) as { success?: boolean; error?: string; data?: { markdown?: string } };
    if (data.success !== true) {
      return { kind: 'unknown', reason: `firecrawl reported failure: ${data.error ?? 'success:false'}` };
    }
    return classifyListing(data.data?.markdown ?? '', { httpOk: true });
  } catch (error) {
    return { kind: 'unknown', reason: `scrape threw: ${(error as Error).message}` };
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    console.error('[asin-check] FIRECRAWL_API_KEY is not set — get one at firecrawl.dev.');
    process.exitCode = 1;
    return;
  }

  const registry = readRegistry();
  // Not `?? {}` (R2): an absent known_dead is a real possibility, but silently
  // defaulting it would mean a registry that lost the key gets re-checked against
  // ASINs already proven dead — spending quota to rediscover known facts. Say
  // which case it is instead.
  const knownDeadRecord = registry.known_dead;
  if (knownDeadRecord === undefined) {
    console.log('[asin-check] note: data/verified-asins.json has no `known_dead` block — nothing is excluded as already-dead.');
  }
  const knownDead = new Set(knownDeadRecord === undefined ? [] : Object.keys(knownDeadRecord));
  const uses = asinsInUse();

  // Only ASINs actually linked from a page are worth quota: a registry entry no
  // page uses earns nothing whether it resolves or not.
  let targets = [...uses.keys()].filter((a) => !knownDead.has(a)).sort();
  if (args.only.length > 0) targets = targets.filter((a) => args.only.includes(a));
  const skipped = targets.length > args.limit ? targets.length - args.limit : 0;
  targets = targets.slice(0, args.limit);

  console.log(`[asin-check] ${uses.size} ASIN(s) linked from pages; ${knownDead.size} already known dead; checking ${targets.length}${skipped > 0 ? ` (${skipped} deferred by --limit ${args.limit})` : ''}`);

  if (args.dryRun) {
    for (const asin of targets) console.log(`  would check ${asin} — used on ${uses.get(asin)?.join(', ')}`);
    console.log('[asin-check] --dry-run: no quota spent, nothing written.');
    return;
  }

  const results: { asin: string; verdict: Liveness; pages: string[]; product: string | null }[] = [];
  for (const asin of targets) {
    // Not `?? []` (R1): `targets` is derived from `uses.keys()`, so a miss here
    // would mean the map mutated mid-run. Defaulting to an empty array would
    // report the ASIN as linked from nowhere and quietly drop the finding's
    // evidence — the reconciler bug. Throw instead; it cannot happen.
    const pages = uses.get(asin);
    if (pages === undefined) throw new Error(`internal: ${asin} is in targets but not in the usage map`);
    results.push({ asin, verdict: await scrape(asin, apiKey), pages, product: registry.asins[asin]?.product ?? null });
    const verdict = results[results.length - 1].verdict;
    // The registry's product name, not a guess scraped off the page — see the
    // title() note in lib/asin-liveness.ts.
    const detail = verdict.kind === 'alive'
      ? (registry.asins[asin]?.product ?? 'resolves (not in the registry)')
      : verdict.reason;
    console.log(`[asin-check] ${asin}  ${verdict.kind.toUpperCase().padEnd(7)} ${detail.slice(0, 90)}`);
  }

  const dead = results.filter((r) => r.verdict.kind === 'dead');
  const unknown = results.filter((r) => r.verdict.kind === 'unknown');
  const alive = results.filter((r) => r.verdict.kind === 'alive');

  const findings = dead.map((r) => ({
    page: `/${r.pages[0]?.replace(/^src\/pages\//, '').replace(/\.astro$/, '')}/`,
    issueClass: 'affiliate-link-dead',
    severity: 'high',
    summary:
      `ASIN ${r.asin}${r.product === null ? '' : ` (${r.product})`} no longer resolves: ` +
      `${r.verdict.kind === 'dead' ? r.verdict.reason : ''}. Linked from ${r.pages.length} page(s): ${r.pages.join(', ')}. ` +
      'The page still renders the link and still sends clicks, and earns nothing on them. ' +
      'Replace the ASIN and move this one to `known_dead` in data/verified-asins.json.',
    closurePredicate: { kind: 'asin-registered', url: `/${r.pages[0]?.replace(/^src\/pages\//, '').replace(/\.astro$/, '')}/` },
  }));

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify({
    meta: {
      collector: 'asin-liveness',
      observedAt: new Date().toISOString(),
      // healthy describes THE CHECK, not the links. A run that could not see is
      // unhealthy even when it found no dead links, so "0 dead" can never be
      // mistaken for "0 dead, verified".
      healthy: unknown.length < results.length,
      checked: results.length,
      alive: alive.length,
      dead: dead.length,
      unknown: unknown.length,
      deferred: skipped,
      note:
        unknown.length === results.length && results.length > 0
          ? 'every check was inconclusive — Amazon likely blocked the scraper. This run proves nothing about link health.'
          : `${unknown.length} inconclusive check(s) are NOT counted as alive or dead.`,
    },
    results: results.map((r) => ({ asin: r.asin, kind: r.verdict.kind, detail: r.verdict.kind === 'alive' ? r.verdict.title : r.verdict.reason, pages: r.pages })),
    findings,
  }, null, 2)}\n`);

  console.log(`[asin-check] ${alive.length} alive · ${dead.length} DEAD · ${unknown.length} inconclusive -> ${OUT_PATH.slice(ROOT.length + 1)}`);
  if (unknown.length === results.length && results.length > 0) {
    console.log('[asin-check] every check was inconclusive — treat this run as "did not look", not "all fine".');
  }
  for (const f of findings) console.log(`[asin-check] FINDING: ${f.summary.slice(0, 140)}`);
}

main().catch((error: unknown) => {
  console.error(`[asin-check] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
