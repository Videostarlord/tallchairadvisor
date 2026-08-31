/**
 * deadmans-switch.ts — L6 of God's-Eye Nightly (PRD §7.7)
 *
 * ALERTS ON ABSENCE. Every other component in this system reports what it found.
 * This one reports that nothing reported.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHERE THIS MUST RUN — the entire point, and easy to get wrong
 *
 * This script must be scheduled from a SECOND GITHUB REPOSITORY, not from
 * tallchairadvisor. PRD §7.7:
 *
 *     "a watcher inside the repo it watches cannot report its own death.
 *      Without this, the build has only moved silent failure up one level."
 *
 * If Actions is disabled on the main repo, if billing lapses, if a bad workflow
 * edit breaks the schedule, if the repo is renamed — a watcher living inside it
 * dies silently alongside the thing it was watching, and the green checkmarks go
 * away without anyone noticing they went away.
 *
 * See scripts/deadmans-switch.README.md for the second-repo setup. Running it
 * from this repo is supported ONLY for local testing and prints a warning.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * It checks two independent signals so a single failure mode cannot fake life:
 *   1. the heartbeat file data/nightly-heartbeat.json (written last, on success)
 *   2. the presence of wiki/nightly/<today>.md or wiki/nightly/<yesterday>.md
 * Either being stale past the deadline fires the alarm. See checkReportFile()
 * for why the report window is two days wide and why that is not a loosening.
 */

import 'dotenv/config';

const OWNER = process.env.TCA_REPO_OWNER ?? 'Videostarlord';
const REPO = process.env.TCA_REPO_NAME ?? 'tallchairadvisor';
const BRANCH = process.env.TCA_REPO_BRANCH ?? 'main';
const NTFY_TOPIC = process.env.NTFY_TOPIC ?? '';
const GH_TOKEN = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? '';

/** PRD §7.7: "If no nightly report lands by 08:00, the absence itself alerts." */
const DEADLINE_HOUR_LOCAL = Number(process.env.DEADLINE_HOUR ?? 8);
const TZ = process.env.TCA_TZ ?? 'America/Los_Angeles';

/** Hours after which a heartbeat is considered dead. The nightly runs at 17:00
 *  local (00:00 UTC) and the deadline is 08:00 local the next morning, so a
 *  healthy beat is ~15h old at check time and anything past ~29h has missed a
 *  full cycle plus the grace window. Moved from 03:00 on 2026-08-13; the number
 *  still holds because 29h covers the wider of the two spacings. */
const MAX_HEARTBEAT_AGE_HOURS = Number(process.env.MAX_HEARTBEAT_AGE_HOURS ?? 29);

interface Signal {
  name: string;
  alive: boolean;
  detail: string;
}

function localDateString(d: Date = new Date()): string {
  // en-CA gives ISO-ordered YYYY-MM-DD, which is what the report filenames use.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function localHour(d: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hour12: false }).format(d));
}

async function ghRaw(path: string): Promise<{ ok: boolean; status: number; text: string }> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw+json',
    'User-Agent': 'tca-deadmans-switch',
  };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;

  const res = await fetch(url, { headers });
  return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
}

/** Signal 1 — the heartbeat the nightly writes last, only on success. */
async function checkHeartbeat(): Promise<Signal> {
  try {
    const r = await ghRaw('data/nightly-heartbeat.json');
    if (!r.ok) {
      return {
        name: 'heartbeat',
        alive: false,
        detail:
          r.status === 404
            ? 'data/nightly-heartbeat.json does not exist — the nightly has never completed successfully'
            : `GitHub API returned HTTP ${r.status} for data/nightly-heartbeat.json`,
      };
    }

    // Deliberately a raw parse: this script must run standalone in a second repo
    // with zero dependencies from this codebase. It validates the shape by hand.
    // lint-architecture-allow R4 -- this file must run standalone in a second repo with zero imports from this codebase; it hand-validates the shape below
    const beat = JSON.parse(r.text) as { lastRun?: string; date?: string; coveragePct?: number };
    if (typeof beat.lastRun !== 'string') {
      return { name: 'heartbeat', alive: false, detail: 'heartbeat file has no lastRun timestamp — malformed' };
    }

    const ageHours = (Date.now() - new Date(beat.lastRun).getTime()) / 3_600_000;
    if (Number.isNaN(ageHours)) {
      return { name: 'heartbeat', alive: false, detail: `heartbeat lastRun is unparseable: "${beat.lastRun}"` };
    }
    if (ageHours > MAX_HEARTBEAT_AGE_HOURS) {
      return {
        name: 'heartbeat',
        alive: false,
        detail: `last successful nightly was ${ageHours.toFixed(1)}h ago (limit ${MAX_HEARTBEAT_AGE_HOURS}h) — ran ${beat.date ?? 'unknown date'}`,
      };
    }
    return {
      name: 'heartbeat',
      alive: true,
      detail: `${ageHours.toFixed(1)}h old, ${beat.coveragePct ?? '?'}% coverage, run ${beat.date ?? '?'}`,
    };
  } catch (error) {
    return { name: 'heartbeat', alive: false, detail: `check failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Signal 2 — the most recent report file. Independent of the heartbeat's own write path.
 *
 * ACCEPTS TODAY *OR* YESTERDAY, and the second one is the whole fix.
 *
 * nightly-report.ts names its file with the LOCAL date at the moment it runs.
 * That used to agree with this check: the nightly ran at 03:00 local, so the
 * report written on day D was found by the 08:00 check on day D.
 *
 * On 2026-08-13 the schedule moved to 17:00 local (cron '0 0 * * *' is 00:00 UTC
 * = 17:00 PDT the PREVIOUS day). The run now lands in the evening of day D and
 * writes D.md — and this check, at 08:00 on D+1, went looking for (D+1).md. That
 * file cannot exist yet and never will, so the switch fired "TCA DEAD" every
 * single morning from 2026-08-13 onward while printing a healthy heartbeat right
 * underneath it. A watcher that cries wolf nightly is a watcher nobody reads,
 * which is the same silent-failure class this whole build exists to kill.
 *
 * Widening the window to two days does NOT weaken detection, because the two
 * candidates are computed from this machine's clock and not from the repo:
 *   - nightly ran on D  → at 08:00 on D+1, D.md is present            → alive
 *   - nightly missed D  → newest file is (D-1).md, neither candidate  → DEAD
 * That is still exactly one missed cycle, the same window MAX_HEARTBEAT_AGE_HOURS
 * enforces on the other signal. A manual run later in the morning writes (D+1).md
 * and is caught by the first candidate.
 */
async function checkReportFile(): Promise<Signal> {
  const today = localDateString();
  const yesterday = localDateString(new Date(Date.now() - 24 * 3_600_000));
  try {
    for (const date of [today, yesterday]) {
      const r = await ghRaw(`wiki/nightly/${date}.md`);
      if (r.ok) {
        const when = date === today ? 'today' : 'last night';
        return { name: 'report', alive: true, detail: `${when}'s report wiki/nightly/${date}.md is there (${r.text.length} bytes)` };
      }
      // Anything other than a clean 404 is a failure to LOOK, not proof of
      // absence. Say so instead of reporting the report as missing.
      if (r.status !== 404) {
        return { name: 'report', alive: false, detail: `could not reach GitHub — HTTP ${r.status} for wiki/nightly/${date}.md` };
      }
    }
    return {
      name: 'report',
      alive: false,
      detail: `no report for ${yesterday} or ${today} — the last two nights both wrote nothing`,
    };
  } catch (error) {
    return { name: 'report', alive: false, detail: `check failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * HTTP header values are ByteStrings — Latin-1 only. A single non-ASCII
 * character makes fetch() throw before the request is sent.
 *
 * This bit hard: the title read `TCA DEAD — no nightly report`, and the em-dash
 * meant the alarm detected death correctly and then threw while delivering it.
 * The one notification that must never fail was the only one guaranteed to.
 * Body text is unaffected (it is UTF-8), so only headers need this.
 */
function headerSafe(value: string): string {
  return value
    .replace(/[—–]/g, '-')       // em/en dash
    .replace(/[‘’]/g, "'")       // curly single quotes
    .replace(/[“”]/g, '"')       // curly double quotes
    .replace(/[…]/g, '...')           // ellipsis
    .replace(/[^\x20-\x7E]/g, '');         // anything else non-ASCII
}

/**
 * Plain-English name for each signal. This alarm is read half-awake on a lock
 * screen, where `report` and `heartbeat` are internal field names that mean
 * nothing and invite exactly the wrong guess about what died.
 */
const SIGNAL_LABEL: Record<string, string> = {
  report: "last night's write-up",
  heartbeat: 'proof the checker finished',
};

async function alert(signals: Signal[]): Promise<void> {
  const dead = signals.filter(s => !s.alive);
  const alive = signals.filter(s => s.alive);

  // The old body put a bare ✗ line directly above a bare ✓ line with nothing
  // joining them, so the alarm read "report missing / heartbeat healthy" and
  // left the reader to work out which half to believe at 8am. Lead with what it
  // MEANS, then show the evidence under headings that explain why a healthy
  // signal is sitting inside a death alarm at all.
  const lines = [
    `The nightly site check did not finish, so nobody looked at the site last night.`,
    ``,
    `What is broken:`,
    ...dead.map(s => `  - ${SIGNAL_LABEL[s.name] ?? s.name}: ${s.detail}`),
  ];
  if (alive.length > 0) {
    lines.push(
      ``,
      `What still worked (so this is a partial failure, not a dead pipeline):`,
      ...alive.map(s => `  - ${SIGNAL_LABEL[s.name] ?? s.name}: ${s.detail}`),
    );
  }
  lines.push(
    ``,
    `Open this to see why it stopped:`,
    `https://github.com/${OWNER}/${REPO}/actions/workflows/nightly.yml`,
  );
  const body = lines.join('\n');

  console.error(body);

  if (!NTFY_TOPIC) {
    console.error('\n[deadman] NTFY_TOPIC unset — ALARM COULD NOT BE DELIVERED. This defeats the switch.');
    return;
  }
  try {
    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        // A title is cut off around 30-40 characters, so it gets the verdict and
        // nothing else. The date used to be here and was actively harmful: it
        // printed TODAY's date next to a report that is always named for LAST
        // NIGHT, which is the same off-by-one that caused the false alarms.
        Title: headerSafe('TCA: last night check did not run'),
        Priority: 'urgent',
        Tags: 'skull,rotating_light',
      },
      body,
    });
    console.error(res.ok ? '[deadman] alarm pushed' : `[deadman] push failed: HTTP ${res.status}`);
  } catch (error) {
    console.error(`[deadman] push failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  const hour = localHour();
  console.log(`[deadman] ${localDateString()} ${String(hour).padStart(2, '0')}:00 ${TZ} — watching ${OWNER}/${REPO}@${BRANCH}`);

  if (hour < DEADLINE_HOUR_LOCAL && !process.argv.includes('--force')) {
    console.log(`[deadman] before the ${DEADLINE_HOUR_LOCAL}:00 deadline — nothing to judge yet.`);
    return;
  }

  const signals = await Promise.all([checkHeartbeat(), checkReportFile()]);
  for (const s of signals) console.log(`  ${s.alive ? '✓' : '✗'} ${s.name.padEnd(10)} ${s.detail}`);

  // Both signals must be alive. A heartbeat without a report (or the reverse)
  // means a partial failure, which is still a failure worth waking up for.
  if (signals.every(s => s.alive)) {
    console.log('[deadman] nightly is alive.');
    return;
  }

  await alert(signals);
  process.exit(1);
}

main().catch(error => {
  console.error('[deadman] FATAL:', error);
  process.exit(1);
});
