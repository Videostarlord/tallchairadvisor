/**
 * probes/cli.ts — argument parsing, kept out of run.ts so it can be unit-tested
 * without importing a module whose top level launches a browser.
 */

import { PRODUCTION_ORIGIN, normalizePath } from './inventory.js';

export interface CliArgs {
  urls: string[];
  limit: number | null;
  base: string;
  concurrency: number;
  out: string | null;
  ledger: boolean;
  ledgerPath: string | null;
  maxNew: number;
  navTimeoutMs: number;
  tagWaitMs: number;
  csp: string | null;
  block: string[];
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    urls: [],
    limit: null,
    base: PRODUCTION_ORIGIN,
    concurrency: 4,
    out: null,
    ledger: true,
    ledgerPath: null,
    maxNew: 200,
    navTimeoutMs: 45_000,
    tagWaitMs: 12_000,
    csp: null,
    block: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} requires a value`);
      return v;
    };
    switch (a) {
      case '--url': args.urls.push(normalizePath(next())); break;
      case '--limit': args.limit = Number.parseInt(next(), 10); break;
      case '--base': args.base = next().replace(/\/$/, ''); break;
      case '--concurrency': args.concurrency = Math.max(1, Math.min(8, Number.parseInt(next(), 10))); break;
      case '--out': args.out = next(); break;
      case '--no-ledger': args.ledger = false; break;
      case '--ledger-path': args.ledgerPath = next(); break;
      case '--max-new-findings': args.maxNew = Number.parseInt(next(), 10); break;
      case '--timeout': args.navTimeoutMs = Number.parseInt(next(), 10); break;
      case '--tag-wait': args.tagWaitMs = Number.parseInt(next(), 10); break;
      case '--csp': args.csp = next(); break;
      case '--block': args.block.push(next()); break;
      default:
        if (a.startsWith('--')) throw new Error(`unknown flag ${a}`);
    }
  }
  if (args.limit !== null && !Number.isFinite(args.limit)) throw new Error('--limit must be a number');
  return args;
}

/**
 * A run is SYNTHETIC when its observations are not truth about production: a preview
 * base, an injected CSP, or blocked requests. Synthetic runs never write the nightly
 * file the predicate evaluator reads (its filename would not match the evaluator's
 * `YYYY-MM-DD.json` pattern) and never file findings — otherwise an acceptance test
 * would open or close real claims about the live site.
 */
export function isSynthetic(args: CliArgs): boolean {
  return args.base !== PRODUCTION_ORIGIN || args.csp !== null || args.block.length > 0;
}

/**
 * A run restricted by --url or --limit covers a subset of the site. Its observations
 * are true, but the FILE is not tonight's coverage: writing it to the nightly path
 * would silently shrink what the evaluator believes was looked at, from 49 pages to
 * however many you happened to debug. Subset runs get their own filename.
 */
export function isPartialRun(args: CliArgs): boolean {
  return args.urls.length > 0 || args.limit !== null;
}

export function defaultOutPath(args: CliArgs, date: string): string {
  if (args.out !== null) return args.out;
  if (isSynthetic(args)) return `data/probes/synthetic-${date}.json`;
  if (isPartialRun(args)) return `data/probes/partial-${date}.json`;
  return `data/probes/${date}.json`;
}
