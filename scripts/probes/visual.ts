/**
 * probes/visual.ts — P1. Screenshot capture and baseline comparison.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * The probe measures tags, canonicals, schema, console errors and CWV. Every one
 * of those can be green while the page is visually broken: a spec table
 * overflowing its container, a hero image 404ing to blank space, a nav collapsing
 * on top of itself at 375px. Nothing in the system looks at the page.
 *
 * MOBILE IS THE POINT. The probe has always run at 1366x900 and has NEVER
 * rendered this site at a phone width, which is both where most traffic is and
 * where a site full of wide spec tables is likeliest to break.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY IT IS NEARLY FREE
 *
 * The page is already open and already measured. A screenshot of a loaded page
 * costs no model tokens and no extra navigation. Mobile is captured by resizing
 * the existing viewport rather than reloading: CSS media queries re-evaluate on
 * resize, which is exactly the layout class we are hunting.
 *
 * The honest limits of that shortcut, stated rather than hidden: `srcset` images
 * do not re-fetch at the new width, and JS that measured the viewport on load
 * does not re-run. So this catches CSS layout breakage, which is the common case,
 * and would miss a JS-driven mobile layout. Worth knowing before trusting a green.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * AESTHETIC JUDGEMENT IS DELIBERATELY NOT HERE
 *
 * "Does it look good" needs a vision model, and running one over 49 pages nightly
 * would cost more than the rest of the pipeline combined to mostly say "still
 * fine". The cost is inverted instead: Playwright captures free every night, and
 * a model is pointed at a page only when a diff crosses the threshold. Rare,
 * targeted, and justified by evidence that something moved.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { Page } from 'playwright';
import { VISUAL_DIFF_THRESHOLD_PCT } from './assertions.js';

/** The two viewports. Desktop matches what the probe has always measured at. */
export const VIEWPORTS = {
  desktop: { width: 1366, height: 900 },
  mobile: { width: 375, height: 812 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

/**
 * Re-exported from assertions.ts, which owns it. The threshold is a VERDICT rule,
 * so it belongs with the other verdict rules in the module that has no I/O — this
 * file only decides when to save a diff artifact for a human to look at.
 */
export { VISUAL_DIFF_THRESHOLD_PCT as DIFF_THRESHOLD_PCT } from './assertions.js';

/** Per-pixel colour tolerance handed to pixelmatch. Anti-aliasing noise lives below this. */
const PIXEL_TOLERANCE = 0.15;

export interface ViewportComparison {
  /** Percentage of pixels differing from the baseline. null = no comparison happened. */
  diffPct: number | null;
  /** Why `diffPct` is null, or why a comparison is not trustworthy. null when clean. */
  note: string | null;
  /** This run created the baseline — there was nothing to compare against yet. */
  baselineCreated: boolean;
}

export interface VisualResult {
  desktop: ViewportComparison;
  mobile: ViewportComparison;
}

function notCompared(note: string): ViewportComparison {
  return { diffPct: null, note, baselineCreated: false };
}

/** `/review/gesture/` -> `review-gesture`; `/` -> `index`. */
export function slugForPath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  if (trimmed === '') return 'index';
  return trimmed.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function baselinePath(root: string, viewport: ViewportName, path: string): string {
  return resolve(root, 'raw/visual/baseline', viewport, `${slugForPath(path)}.png`);
}

/**
 * ─── WHERE THE BASELINE WAS CAPTURED IS PART OF THE BASELINE ─────────────────
 *
 * Found 2026-08-13, and it had disabled the mobile gate site-wide while looking
 * like five isolated regressions.
 *
 * The 98 baselines were captured on a MacBook Air (commit 05703fa, authored from
 * `Jacksons-MacBook-Air.local`) and every comparison since has run on a GitHub
 * Actions ubuntu runner. macOS and Linux rasterise fonts differently, so EVERY
 * page picked up a small, constant, text-proportional diff:
 *
 *   49/49 mobile pages non-zero, min 1.309%, median 1.554%, max 3.678%
 *   49/49 desktop pages non-zero, median 0.660%
 *   IDENTICAL to three decimals on 08-09, 08-10, 08-11 and 08-12
 *
 * Four days of byte-identical numbers is not drift and not a design change — it
 * is a constant offset. Five pages crossed the 2% line only because they are the
 * most text-dense on mobile; the other 44 sit just under it having already spent
 * most of their budget on font rendering. A real regression on those pages would
 * have had to be enormous to trip, and the dashboard would have stayed green.
 *
 * Re-baselining only the five loudest pages would have made the visible symptom
 * go away and left the disabled gate exactly as it was.
 *
 * So provenance is recorded next to the images, and a mismatch is REPORTED
 * rather than silently absorbed into every diff percentage.
 */
export const PROVENANCE_PATH = 'raw/visual/baseline/provenance.json';

export interface BaselineProvenance {
  /** ISO timestamp of the capture run. */
  capturedAt: string;
  /** `process.platform` — 'darwin', 'linux', 'win32'. The load-bearing field. */
  platform: string;
  arch: string;
  /** 'ci' when GITHUB_ACTIONS is set, else 'local'. */
  runner: 'ci' | 'local';
  /** How this record came to exist. Never a guess presented as a measurement. */
  source: 'captured' | 'git-archaeology';
  note: string;
}

export function currentProvenance(at: Date = new Date()): BaselineProvenance {
  const ci = typeof process.env.GITHUB_ACTIONS === 'string' && process.env.GITHUB_ACTIONS !== '';
  return {
    capturedAt: at.toISOString(),
    platform: process.platform,
    arch: process.arch,
    runner: ci ? 'ci' : 'local',
    source: 'captured',
    note: 'Written by a deliberate --rebaseline run.',
  };
}

export function readProvenance(root: string): BaselineProvenance | null {
  const file = resolve(root, PROVENANCE_PATH);
  if (!existsSync(file)) return null;
  try {
    // lint-architecture-allow R4 -- shape is checked on the next two lines and any failure returns null; routing this through readValidated() would make an unreadable provenance file THROW inside the probe, and a nightly that dies over a metadata file is a worse outcome than the warning this function exists to print
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf-8'));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const p = parsed as Partial<BaselineProvenance>;
    if (typeof p.platform !== 'string' || typeof p.capturedAt !== 'string') return null;
    return parsed as BaselineProvenance;
  } catch {
    // A provenance file that cannot be read is reported as ABSENT, never as
    // matching. Absent produces a warning; "matching" would produce silence,
    // and silence is the failure mode this whole block exists to end.
    return null;
  }
}

export function writeProvenance(root: string, provenance: BaselineProvenance): void {
  const file = resolve(root, PROVENANCE_PATH);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(provenance, null, 2)}\n`);
}

/**
 * A sentence naming the platform gap, or null when there is nothing to say.
 *
 * Returned as a NOTE, not a failure. The diff percentage it accompanies is real
 * — those pixels genuinely differ — and suppressing the number would trade a
 * misleading measurement for no measurement. What was missing was the cause.
 */
export function describePlatformMismatch(
  baseline: BaselineProvenance | null,
  now: BaselineProvenance
): string | null {
  if (baseline === null) {
    return (
      `baseline provenance is missing (${PROVENANCE_PATH}) — the platform these images were ` +
      `captured on is unknown, so any constant site-wide diff cannot be distinguished from a ` +
      `real change. Re-baseline in the environment that runs the comparison.`
    );
  }
  if (baseline.platform === now.platform) return null;
  return (
    `BASELINE PLATFORM MISMATCH: images captured on ${baseline.platform}/${baseline.arch} ` +
    `(${baseline.runner}, ${baseline.capturedAt.slice(0, 10)}), compared on ${now.platform}/${now.arch} ` +
    `(${now.runner}). Font rasterisation differs between platforms, which adds a constant ` +
    `text-proportional diff to EVERY page and is largest on mobile. Treat this percentage as ` +
    `offset until the baseline is recaptured where the comparison runs.`
  );
}

/**
 * CSS injected immediately before every capture.
 *
 * An unstable baseline destroys trust in a visual gate faster than having no gate
 * at all — one flapping page and everyone starts ignoring the whole class. So:
 * freeze animations and transitions, stop carets blinking, and blank anything
 * explicitly marked as volatile. `[data-visual-mask]` is the escape hatch for
 * content that legitimately changes between runs.
 */
const STABILISE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
  [data-visual-mask] { visibility: hidden !important; }
`;

export interface CaptureOptions {
  root: string;
  path: string;
  /**
   * Whether this run may WRITE a baseline.
   *
   * False for synthetic/preview runs. A preview build writing baselines would
   * quietly redefine "correct" as "whatever this unmerged branch renders", which
   * is the precise opposite of a regression test. See isSynthetic() in cli.ts.
   */
  allowBaselineWrite: boolean;
  /**
   * OVERWRITE existing baselines with this run's captures.
   *
   * Separate from `allowBaselineWrite`, which only permits FILLING IN a page
   * that has none. Redefining "correct" is a deliberate act and needs its own
   * flag, so no ordinary run can ever do it by accident — a nightly that
   * silently re-baselined would report every regression as fixed the night
   * after it appeared.
   */
  rebaseline?: boolean;
  /** Overrides DIFF_THRESHOLD_PCT when calibrating. */
  thresholdPct?: number;
  /** Where to write current captures when they differ, for human inspection. */
  artifactDir?: string | null;
}

/**
 * Capture both viewports and compare each against its baseline.
 *
 * MUST be called after every measurement is already read off the page. Resizing
 * the viewport provokes layout shifts, and a CLS observer still running would
 * record this function's own resize as page instability — measuring the probe
 * instead of the site.
 */
export async function captureAndCompare(page: Page, opts: CaptureOptions): Promise<VisualResult> {
  const { root, path, allowBaselineWrite } = opts;
  const threshold = opts.thresholdPct ?? VISUAL_DIFF_THRESHOLD_PCT;
  const artifactDir = opts.artifactDir ?? null;

  const result: VisualResult = {
    desktop: notCompared('not captured'),
    mobile: notCompared('not captured'),
  };

  let styleHandle: string | null = null;
  try {
    styleHandle = await page.evaluate((css: string) => {
      const el = document.createElement('style');
      el.id = '__tca_visual_stabilise';
      el.textContent = css;
      document.head.appendChild(el);
      return el.id;
    }, STABILISE_CSS);
  } catch (error) {
    // Without the stabiliser the capture would flap. Say so and take no screenshot,
    // rather than seeding a baseline that will disagree with itself tomorrow.
    const note = `could not inject the stabiliser stylesheet — ${(error as Error).message}`;
    return { desktop: notCompared(note), mobile: notCompared(note) };
  }

  const rebaseline = opts.rebaseline === true;
  // Read once per page, not once per comparison: the note is a property of the
  // baseline SET, and repeating a filesystem read for an unchanging fact is how
  // a cheap check becomes an expensive one at 49 pages x 2 viewports.
  const mismatch = rebaseline ? null : describePlatformMismatch(readProvenance(root), currentProvenance());

  for (const viewport of ['desktop', 'mobile'] as const) {
    result[viewport] = await captureOne(page, viewport, {
      root, path, allowBaselineWrite, threshold, artifactDir, rebaseline,
    });
    if (mismatch !== null && result[viewport].diffPct !== null) {
      const existing = result[viewport].note;
      result[viewport] = {
        ...result[viewport],
        note: existing === null ? mismatch : `${mismatch} | ${existing}`,
      };
    }
  }

  // Leave the page as it was found; a later consumer may still read from it.
  if (styleHandle !== null) {
    await page.evaluate((id: string) => document.getElementById(id)?.remove(), styleHandle)
      .catch(() => { /* the page is about to be closed; a leftover <style> harms nothing */ });
  }
  await page.setViewportSize(VIEWPORTS.desktop).catch(() => { /* ditto */ });

  return result;
}

async function captureOne(
  page: Page,
  viewport: ViewportName,
  opts: { root: string; path: string; allowBaselineWrite: boolean; threshold: number; artifactDir: string | null; rebaseline: boolean },
): Promise<ViewportComparison> {
  const { root, path, allowBaselineWrite, threshold, artifactDir, rebaseline } = opts;

  let current: Buffer;
  try {
    await page.setViewportSize(VIEWPORTS[viewport]);
    // Media queries re-evaluate synchronously, but lazy images and reflow do not.
    // networkidle bounded by a short timeout: if the page never idles we still
    // capture rather than abandoning the viewport entirely.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => { /* capture anyway; noted below only if it also fails */ });
    await page.waitForTimeout(250);
    // fullPage:false deliberately. A full-page shot makes every diff proportional
    // to page length, so adding one paragraph near the top reports as a whole-page
    // regression. Above-the-fold is where layout breakage is both most visible and
    // most stable to compare.
    current = await page.screenshot({ fullPage: false, animations: 'disabled', caret: 'hide' });
  } catch (error) {
    return notCompared(`screenshot failed at ${viewport} — ${(error as Error).message}`);
  }

  const base = baselinePath(root, viewport, path);

  if (rebaseline) {
    // Deliberate redefinition of "correct". Guarded twice: the caller must pass
    // --rebaseline AND the run must be allowed to write baselines at all, so a
    // synthetic/preview build can never redefine production's baseline.
    if (!allowBaselineWrite) {
      return notCompared(`${viewport} re-baseline refused — this run may not write baselines (synthetic)`);
    }
    mkdirSync(dirname(base), { recursive: true });
    writeFileSync(base, current);
    return {
      diffPct: null,
      note: `${viewport} baseline REPLACED by an explicit --rebaseline run on ${process.platform}`,
      baselineCreated: true,
    };
  }

  if (!existsSync(base)) {
    if (!allowBaselineWrite) {
      // The honest answer on a preview run for a page production has never seen.
      return notCompared(`no ${viewport} baseline, and this run may not write one (synthetic)`);
    }
    mkdirSync(dirname(base), { recursive: true });
    writeFileSync(base, current);
    return { diffPct: null, note: `${viewport} baseline created — nothing to compare against yet`, baselineCreated: true };
  }

  let baselinePng: PNG;
  let currentPng: PNG;
  try {
    baselinePng = PNG.sync.read(readFileSync(base));
    currentPng = PNG.sync.read(current);
  } catch (error) {
    return notCompared(`could not decode ${viewport} PNG — ${(error as Error).message}`);
  }

  if (baselinePng.width !== currentPng.width || baselinePng.height !== currentPng.height) {
    // Dimensions differing IS a regression signal, but pixelmatch cannot express
    // it as a percentage. Report it as a note rather than inventing a number.
    return notCompared(
      `${viewport} size changed: baseline ${baselinePng.width}x${baselinePng.height}, ` +
      `current ${currentPng.width}x${currentPng.height} — re-baseline if this was intended`,
    );
  }

  const diff = new PNG({ width: baselinePng.width, height: baselinePng.height });
  const changed = pixelmatch(
    baselinePng.data, currentPng.data, diff.data,
    baselinePng.width, baselinePng.height,
    { threshold: PIXEL_TOLERANCE, includeAA: false },
  );

  const total = baselinePng.width * baselinePng.height;
  const diffPct = total === 0 ? 0 : (changed / total) * 100;

  // The measurement is already complete and correct at this point. Saving the
  // inspection PNGs is a convenience for whoever reads the finding, so a failure
  // here is reported alongside the number rather than allowed to discard it.
  let artifactNote: string | null = null;
  if (artifactDir !== null && diffPct >= threshold) {
    try {
      const stem = resolve(artifactDir, viewport, slugForPath(path));
      mkdirSync(dirname(stem), { recursive: true });
      writeFileSync(`${stem}.current.png`, current);
      writeFileSync(`${stem}.diff.png`, PNG.sync.write(diff));
    } catch (error) {
      artifactNote = `diff measured but the inspection PNGs could not be written — ${(error as Error).message}`;
    }
  }

  return { diffPct: Number(diffPct.toFixed(3)), note: artifactNote, baselineCreated: false };
}
