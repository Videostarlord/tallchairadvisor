/**
 * lib/amazon-session.ts — the honesty layer for the Associates scraper (P3).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE ONE FAILURE THIS FILE EXISTS TO PREVENT
 *
 * A scraper that reports $0 because it silently failed to log in is not a bug.
 * It is a lie, and it is the most damaging one this pipeline could tell: the
 * kill-list gate that decides whether the whole site continues is measured in
 * months of affiliate revenue above $100. A fabricated zero would read as a
 * failing month and could retire a site that was actually earning.
 *
 * So a stored session is assumed EXPIRED unless the page positively proves
 * otherwise. Not "we didn't see a login form, so we must be in" — that reads an
 * absence as evidence, which is the same mistake as `gtagFired: false` meaning
 * "we didn't look". Same doctrine as `unevaluable`, `healthy:false`, and P1's
 * `diffPct: null`: silence is never a measurement.
 *
 * These are pure functions over strings so they are testable without Amazon, a
 * browser, or a credential — which matters because the DOM layer around them
 * cannot be exercised in CI at all.
 */

/** What a page turned out to be. Only `report` permits reading numbers off it. */
export type SessionState =
  | { kind: 'report' }
  | { kind: 'signin'; reason: string }
  | { kind: 'unknown'; reason: string };

/** URL fragments that mean Amazon bounced us to authentication. */
const SIGNIN_URL_MARKERS = [
  '/ap/signin',
  '/ap/cvf',            // challenge / OTP
  '/ap/mfa',
  'signin.',
  '/gp/sign-in',
  'authportal',
];

/** Text that only appears on a sign-in or challenge page. */
const SIGNIN_BODY_MARKERS = [
  'sign in',
  'sign-in',
  'enter your password',
  'two-step verification',
  'authentication required',
  'we need to verify',
  'not a robot',
  'enter the characters you see',
];

/**
 * Markers that positively identify the Associates reporting UI.
 *
 * Presence of one of these is what makes a page trustworthy. Requiring positive
 * proof — rather than merely failing to spot a login form — is the entire point.
 */
const REPORT_MARKERS = [
  'associates central',
  'earnings report',
  'tracking id',
  'tracking-id',
  'ordered items',
  'shipped items',
  'link type report',
  'fee earnings',
];

/**
 * Decide what we are looking at.
 *
 * Order matters: a sign-in check runs FIRST and wins outright. Amazon's login
 * chrome sometimes retains navigation text from the destination page, so a
 * report marker can legitimately appear on a sign-in page — and treating that as
 * "logged in" is precisely how a scraper ends up parsing an empty table into $0.
 */
export function classifySession(url: string, bodyText: string): SessionState {
  const u = url.toLowerCase();
  const body = bodyText.toLowerCase();

  const urlHit = SIGNIN_URL_MARKERS.find((m) => u.includes(m));
  if (urlHit !== undefined) {
    return { kind: 'signin', reason: `URL contains '${urlHit}' — Amazon redirected to authentication` };
  }

  const bodyHit = SIGNIN_BODY_MARKERS.find((m) => body.includes(m));
  if (bodyHit !== undefined) {
    return { kind: 'signin', reason: `page text contains '${bodyHit}' — this is a sign-in or challenge page` };
  }

  const reportHit = REPORT_MARKERS.find((m) => body.includes(m));
  if (reportHit !== undefined) return { kind: 'report' };

  return {
    kind: 'unknown',
    reason:
      'page matched neither a sign-in page nor the Associates reporting UI — refusing to read numbers off ' +
      'a page that cannot be identified',
  };
}

/**
 * Is a downloaded CSV real data, or an artifact of a failed session?
 *
 * A header-only CSV is genuinely ambiguous: Top-Sellers is legitimately empty
 * most weeks (it populates only on direct-link purchases). So emptiness alone is
 * NOT treated as failure — but it is never treated as "$0 earned" either. The
 * caller records it as `empty` and the report says so in words.
 */
export type CsvVerdict =
  | { kind: 'data'; rows: number }
  | { kind: 'empty'; reason: string }
  | { kind: 'invalid'; reason: string };

export function classifyCsv(text: string, expectedHeaderFragment?: string): CsvVerdict {
  const trimmed = text.trim();
  if (trimmed === '') return { kind: 'invalid', reason: 'file is empty — not even a header row' };

  // An HTML document where a CSV should be means the download URL served a login
  // page or an error page. This is the single most likely expired-session symptom.
  if (/^\s*<(!doctype|html)/i.test(trimmed)) {
    return { kind: 'invalid', reason: 'file is HTML, not CSV — the download almost certainly served a sign-in or error page' };
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '');
  const header = lines[0] ?? '';

  if (expectedHeaderFragment !== undefined && !header.toLowerCase().includes(expectedHeaderFragment.toLowerCase())) {
    return {
      kind: 'invalid',
      reason: `header does not contain '${expectedHeaderFragment}' — got '${header.slice(0, 120)}'`,
    };
  }

  if (lines.length <= 1) {
    return { kind: 'empty', reason: 'header row only — legitimately possible (Top-Sellers is usually empty), but NOT evidence of $0' };
  }

  return { kind: 'data', rows: lines.length - 1 };
}

/**
 * The explicit date range of an export.
 *
 * A 2026-08-04 process note exists because month-to-date and rolling-30-day
 * exports are INDISTINGUISHABLE once they are CSVs on disk — the window type is
 * nowhere in the file. One export in this archive was already misread that way,
 * and the correction required reasoning backwards from a single large order.
 *
 * So the range is chosen by this script, recorded here, and written into the
 * report as a stated fact rather than inferred later by whoever reads it.
 */
export interface ExportWindow {
  start: string;
  end: string;
  /** How the window was chosen. Recorded verbatim in the report. */
  kind: 'rolling-30-day' | 'month-to-date' | 'explicit';
}

export function rollingWindow(days: number, now: Date = new Date()): ExportWindow {
  const end = new Date(now.getTime());
  const start = new Date(now.getTime() - (days - 1) * 86_400_000);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    kind: days === 30 ? 'rolling-30-day' : 'explicit',
  };
}

export function describeWindow(w: ExportWindow): string {
  return `${w.kind} (${w.start} -> ${w.end})`;
}
