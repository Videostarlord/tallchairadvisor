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
 *   2. the presence of wiki/nightly/<today>.md
 * Either being stale past the deadline fires the alarm.
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

/** Hours after which a heartbeat is considered dead. The nightly runs at 03:00
 *  local and the deadline is 08:00 local, so anything older than ~29h has
 *  missed a full cycle plus the grace window. */
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

/** Signal 2 — today's report file. Independent of the heartbeat's own write path. */
async function checkReportFile(): Promise<Signal> {
  const today = localDateString();
  try {
    const r = await ghRaw(`wiki/nightly/${today}.md`);
    if (r.ok) return { name: 'report', alive: true, detail: `wiki/nightly/${today}.md present (${r.text.length} bytes)` };
    if (r.status === 404) return { name: 'report', alive: false, detail: `wiki/nightly/${today}.md was never written` };
    return { name: 'report', alive: false, detail: `GitHub API returned HTTP ${r.status} for wiki/nightly/${today}.md` };
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

async function alert(signals: Signal[]): Promise<void> {
  const dead = signals.filter(s => !s.alive);
  const body = [
    `No God's-Eye nightly report for ${localDateString()} by ${DEADLINE_HOUR_LOCAL}:00 ${TZ}.`,
    ``,
    ...dead.map(s => `✗ ${s.name}: ${s.detail}`),
    ...signals.filter(s => s.alive).map(s => `✓ ${s.name}: ${s.detail}`),
    ``,
    `The pipeline may be running blind. Check:`,
    `https://github.com/${OWNER}/${REPO}/actions/workflows/nightly.yml`,
  ].join('\n');

  console.error(body);

  if (!NTFY_TOPIC) {
    console.error('\n[deadman] NTFY_TOPIC unset — ALARM COULD NOT BE DELIVERED. This defeats the switch.');
    return;
  }
  try {
    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: headerSafe(`TCA DEAD - no nightly report ${localDateString()}`),
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
