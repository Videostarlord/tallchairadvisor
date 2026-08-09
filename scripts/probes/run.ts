/**
 * probes/run.ts — `npm run probe`. Step 6 of the God's-Eye PRD (§7.5).
 *
 * Runs unattended in CI at 03:00 (.github/workflows/nightly.yml). Its contract with
 * that workflow: a failing assertion is a SUCCESSFUL run — the observation system did
 * its job. The process exits non-zero only when the harness itself could not run at
 * all (no browser, no inventory), because an exit code that means "the site has a
 * problem" trains everyone to ignore red.
 *
 * One bad page never aborts the run: every URL is probed inside its own try/catch and
 * an unrecoverable page becomes a `healthy:false` record with a stated reason. A
 * missing record and a record that says "I could not see" are very different things,
 * and only the second one is honest.
 *
 * Usage:
 *   npm run probe                                  # every indexable URL, live site
 *   npm run probe -- --url /review/gesture/        # one page (repeatable)
 *   npm run probe -- --limit 5                     # first N of the inventory
 *   npm run probe -- --base https://preview.pages.dev
 *   npm run probe -- --csp "<policy>"              # acceptance: enforce a CSP override
 *   npm run probe -- --block google-analytics.com  # acceptance: abort matching requests
 *   npm run probe -- --out /tmp/probe.json --no-ledger
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { chromium, type Browser } from 'playwright';
import { isRedirectSource, loadRedirectMap } from '../redirect-map.js';
import { buildInventory, parseSitemapExcludedPaths } from './inventory.js';
import { defaultOutPath, isSynthetic, parseArgs } from './cli.js';
import { emptyResult, probeUrl, unhealthyResult, checkStatus, type ProbeOptions } from './probe-page.js';
import { deriveFindings, summarise, VISUAL_DIFF_THRESHOLD_PCT, type ProbeFinding } from './assertions.js';
import { fileFindings } from './ledger-bridge.js';
import type { ProbeFile } from './types.js';

/** REPO_ROOT comes from the contracts module (§7.2) so every component agrees on it. */
async function repoRoot(): Promise<string> {
  const mod = (await import('../lib/read-validated.js')) as { REPO_ROOT?: string };
  if (typeof mod.REPO_ROOT === 'string') return mod.REPO_ROOT;
  throw new Error('scripts/lib/read-validated.ts exports no REPO_ROOT');
}

/** Bounded worker pool. Order of results is restored so output diffs stay readable. */
async function pool<T, R>(items: T[], size: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      out[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return out;
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const root = await repoRoot();
  const date = new Date().toISOString().slice(0, 10);
  const synthetic = isSynthetic(args);

  const redirectMap = loadRedirectMap(root);
  let sitemapExcluded = new Set<string>();
  try {
    sitemapExcluded = parseSitemapExcludedPaths(readFileSync(resolve(root, 'astro.config.mjs'), 'utf-8'));
    // lint-architecture-allow R3 -- recorded in `notes` below rather than treated as "nothing is excluded"
  } catch {
    // Recorded as a note below rather than silently treated as "nothing is excluded".
  }

  const notes: string[] = [];
  let paths: string[];
  if (args.urls.length > 0) {
    paths = args.urls;
  } else {
    const inventory = await buildInventory(root, args.base);
    paths = inventory.urls;
    notes.push(`inventory source: ${inventory.source} (${paths.length} URLs)`, ...inventory.notes);
  }
  if (sitemapExcluded.size === 0) notes.push('astro.config.mjs sitemapExcludedPaths not parsed — noindex detection relies on live <meta name="robots">');
  if (args.limit !== null) paths = paths.slice(0, args.limit);
  if (paths.length === 0) throw new Error('no URLs to probe — inventory was empty and no --url was given');

  const opts: ProbeOptions = {
    baseOrigin: args.base,
    navTimeoutMs: args.navTimeoutMs,
    tagWaitMs: args.tagWaitMs,
    cspOverride: args.csp,
    blockPatterns: args.block,
    // P1. `allowBaselineWrite: !synthetic` is the load-bearing line. A preview or
    // CSP-overridden run writing baselines would redefine "correct" as "whatever
    // this unmerged branch renders" — the exact inversion of a regression test.
    // isSynthetic() already governs findings and the output filename for the same
    // reason; baselines join that list.
    visual: args.visual
      ? {
          root,
          allowBaselineWrite: !synthetic,
          thresholdPct: VISUAL_DIFF_THRESHOLD_PCT,
          artifactDir: args.visualArtifacts,
        }
      : null,
  };

  console.log(`[probe] ${paths.length} URL(s) against ${args.base}${synthetic ? '  (SYNTHETIC RUN)' : ''}`);
  if (args.visual) {
    console.log(
      `[probe] visual capture ON — desktop 1366x900 + mobile 375x812, threshold ${VISUAL_DIFF_THRESHOLD_PCT}%` +
        (synthetic ? '; baselines READ-ONLY (synthetic run)' : '; missing baselines will be written'),
    );
  }
  if (args.csp !== null) console.log('[probe] CSP override active — the document policy is being replaced in-flight');
  if (args.block.length > 0) console.log(`[probe] blocking requests matching: ${args.block.join(', ')}`);

  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  } catch (error) {
    // The harness itself could not start. This IS a failure, unlike a failing assertion.
    console.error(`[probe] FATAL: chromium would not launch — ${(error as Error).message}`);
    console.error('[probe] run `npx playwright install chromium` first.');
    process.exit(1);
    return;
  }

  const results = await pool(paths, args.concurrency, async (path) => {
    try {
      // §7.5.1 — a 301 source is not a page. Never browsed, never meta-audited.
      if (isRedirectSource(redirectMap, path)) {
        const status = await checkStatus(`${args.base}${path}`, 15_000);
        const r = emptyResult(path);
        r.skipped = 'redirect-source';
        r.status = status.status;
        r.redirectedTo = status.location ?? redirectMap.get(path) ?? null;
        // Say it in the record, not just in the field name: nothing here was observed.
        // A consumer that reads `consoleErrors: []` off a skipped record as "zero
        // errors" would be closing a claim on a page that was never opened.
        r.errors.push(
          'not browsed: public/_redirects declares this path a 301 source, so it is not a page — every measurement field in this record is an unset placeholder, not an observation',
        );
        if (status.error !== null) r.errors.push(status.error);
        console.log(`[probe] skip  ${pad(path, 52)} redirect-source → ${r.redirectedTo ?? '?'} (${r.status})`);
        return r;
      }
      if (sitemapExcluded.has(path)) {
        const status = await checkStatus(`${args.base}${path}`, 15_000);
        const r = emptyResult(path);
        r.skipped = 'noindex';
        r.status = status.status;
        r.errors.push(
          'not browsed: excluded from the sitemap by astro.config.mjs sitemapExcludedPaths — every measurement field in this record is an unset placeholder, not an observation',
        );
        if (status.error !== null) r.errors.push(status.error);
        console.log(`[probe] skip  ${pad(path, 52)} sitemap-excluded (${r.status})`);
        return r;
      }

      const result = await probeUrl(browser, path, opts);
      const flag = !result.healthy ? 'UNHEALTHY' : result.errors.length > 0 ? 'partial' : 'ok';
      // `new` and `-` are distinguishable from a number on purpose: a baseline
      // that was just written and a comparison that did not happen must never
      // print as "0%", which would read as "verified identical".
      const vis = result.visual === null
        ? ''
        : ` vis=${(['desktop', 'mobile'] as const)
            .map((v) => {
              const r = result.visual![v];
              if (r.baselineCreated) return `${v[0]}:new`;
              return `${v[0]}:${r.diffPct === null ? '-' : `${r.diffPct}%`}`;
            })
            .join(' ')}`;
      console.log(
        `[probe] ${pad(flag, 10)}${pad(path, 52)} ${result.status} ` +
          `gtag=${result.network.gtagFired} clarity=${result.network.clarityLoaded} ` +
          `aff=${result.tags.affiliate ?? 'null'} err=${result.consoleErrors.length} ` +
          `lcp=${result.vitals.lcp ?? 'null'} cls=${result.vitals.cls ?? 'null'} inp=${result.vitals.inp ?? 'null'}${vis}`,
      );
      return result;
    } catch (error) {
      // Belt and braces: probeUrl already catches, so reaching here means something
      // outside it broke. Still a record, still a stated reason, still not an abort.
      console.log(`[probe] UNHEALTHY ${pad(path, 52)} ${(error as Error).message}`);
      return unhealthyResult(path, 0, `probe harness error: ${(error as Error).message}`);
    }
  });

  await browser.close().catch(() => { /* nothing left to protect */ });

  const file: ProbeFile = { generatedAt: new Date().toISOString(), siteUrl: args.base, results };
  const outPath = resolve(root, defaultOutPath(args, date));
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(file, null, 2)}\n`);

  const findings: ProbeFinding[] = results.flatMap(deriveFindings);
  const filing = await fileFindings(root, findings, {
    ledgerPath: args.ledgerPath ?? undefined,
    maxNew: args.maxNew,
    dryRun: synthetic || !args.ledger,
  });

  const summary = summarise(results);
  const lines: string[] = [];
  lines.push('', '─'.repeat(64), `PROBE SUMMARY  ${date}  ${args.base}${synthetic ? '  (SYNTHETIC — not truth about production)' : ''}`, '─'.repeat(64));
  for (const note of notes) lines.push(`note: ${note}`);
  lines.push('', '| metric | count |', '|---|---|');
  lines.push(`| probed | ${summary.probed} |`);
  lines.push(`| skipped: redirect-source | ${summary.skippedRedirectSource} |`);
  lines.push(`| skipped: noindex | ${summary.skippedNoindex} |`);
  lines.push(`| unhealthy (measured nothing) | ${summary.unhealthy} |`);
  lines.push(`| partial (some field unmeasured) | ${summary.partial} |`);
  lines.push('', '| failing assertion | pages |', '|---|---|');
  const failures = Object.entries(summary.failures).sort((a, b) => b[1] - a[1]);
  if (failures.length === 0) lines.push('| (none) | 0 |');
  for (const [issue, count] of failures) lines.push(`| ${issue} | ${count} |`);
  lines.push('');
  lines.push(`findings derived: ${findings.length}`);
  if (filing.available) {
    lines.push(`ledger: filed ${filing.filed} new, ${filing.existing} already open, ${filing.rejected.length} rejected, ${filing.suppressed} suppressed by --max-new-findings`);
    for (const r of filing.rejected.slice(0, 10)) lines.push(`  rejected: ${r.issue} — ${r.error}`);
  } else {
    lines.push(`ledger: NOT FILED — ${filing.reason}`);
  }
  lines.push(`written: ${outPath.replace(`${root}/`, '')}`);
  lines.push('─'.repeat(64));
  console.log(lines.join('\n'));
}

main().catch((error) => {
  console.error(`[probe] FATAL: ${(error as Error).stack ?? (error as Error).message}`);
  process.exit(1);
});
