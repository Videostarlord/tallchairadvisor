/**
 * collectors/github-actions.ts — did Mon–Sat actually succeed, and what did
 * each of them write? (PRD §7.4)
 *
 * THE QUESTION THIS ANSWERS THAT A GREEN CHECKMARK DOES NOT
 * `reconcileInterventions` rewrote data/interventions.jsonl byte-identically
 * for months under a green check. "The job exited 0" and "the job changed
 * something" are different facts, and only the second one means the pipeline
 * is alive. So for every workflow we report BOTH: the run's own conclusion,
 * and whether any bot commit landed on the default branch inside that run's
 * window.
 *
 * The commit half is INFERENCE, and is labelled as such in the output
 * (`committedDuringRun`, `commitInferenceMethod`). GitHub does not expose
 * "what did this run push"; the honest approximation is "bot commits whose
 * timestamps fall inside the run's window". A collector that presented that
 * as certainty would be lying by omission, which §7.6's `unverified` rule
 * exists to prevent.
 *
 * HEALTH SEMANTICS — READ THIS BEFORE "FIXING" IT
 * A failed Monday does NOT make this collector unhealthy. "I could not see"
 * (gh missing, unauthenticated, API error) is unhealthy. "I saw clearly and
 * Monday failed" is healthy collection of a bad fact, surfaced in
 * `failing[]` / `stale[]` for the ledger and report to escalate. Conflating
 * the two would make a broken observer indistinguishable from a broken
 * pipeline — the exact ambiguity this build exists to remove.
 *
 * TRANSPORT: the `gh` CLI, per the PRD's collector table. In CI it reads
 * GH_TOKEN from nightly.yml; locally it uses the user's keyring login.
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { parseValidated, REPO_ROOT } from '../lib/read-validated.js';
import {
  describeError,
  guard,
  makeHealthy,
  makeUnhealthy,
  MS_PER_DAY,
  type CollectorResult,
} from './types.js';

const execFileAsync = promisify(execFile);
const GH_TIMEOUT_MS = 30_000;
/** Push happens at the end of a run; allow for the commit landing just after. */
const COMMIT_WINDOW_SLACK_MS = 15 * 60 * 1000;

const RepoSchema = z.object({
  nameWithOwner: z.string().min(1),
  defaultBranchRef: z.object({ name: z.string() }).nullable(),
});

const WorkflowsSchema = z.object({
  total_count: z.number(),
  workflows: z.array(
    z.object({ id: z.number(), name: z.string(), path: z.string(), state: z.string() }).passthrough()
  ),
});

const RunsSchema = z.object({
  total_count: z.number(),
  workflow_runs: z.array(
    z
      .object({
        id: z.number(),
        run_number: z.number(),
        status: z.string().nullable(),
        conclusion: z.string().nullable(),
        created_at: z.string(),
        updated_at: z.string(),
        html_url: z.string(),
        head_sha: z.string(),
        event: z.string(),
      })
      .passthrough()
  ),
});

const CommitsSchema = z.array(
  z
    .object({
      sha: z.string(),
      commit: z.object({
        message: z.string(),
        committer: z.object({ name: z.string(), date: z.string() }).passthrough(),
      }).passthrough(),
    })
    .passthrough()
);

export interface WorkflowStatus {
  name: string;
  path: string;
  state: string;
  cron: string | null;
  expectedCadenceDays: number | null;
  lastRun: {
    runNumber: number;
    status: string | null;
    conclusion: string | null;
    startedAt: string;
    finishedAt: string;
    daysAgo: number;
    url: string;
    headSha: string;
    event: string;
  } | null;
  /** Inferred, not authoritative. See header. */
  committedDuringRun: number | null;
  commitSubjects: string[];
  commitInferenceMethod: string;
  stale: boolean;
}

export interface GithubActionsCollected {
  repo: string;
  defaultBranch: string;
  ghVersion: string;
  authAccount: string | null;
  workflows: WorkflowStatus[];
  failing: string[];
  stale: string[];
  neverRan: string[];
  wroteNothing: string[];
}

// ─── Pure helpers (unit-tested) ───────────────────────────────────────────────

/**
 * Expected cadence in days from a 5-field cron expression.
 *
 * Step syntax is handled explicitly: `0 10 * / 2 * *` (clarity-history) runs every
 * other day, and reading its pinned day-of-month field as "monthly" would give
 * it a 47-day staleness budget — 23x too generous to ever catch it dying.
 */
export function expectedCadenceDays(cron: string | null): number | null {
  if (cron === null) return null;
  const fields = cron.trim().split(/\s+/);
  if (fields.length < 5) return null;
  const [, , dom, , dow] = fields;

  const step = (field: string): number | null => {
    const match = /^\*\/(\d+)$/.exec(field);
    return match === null ? null : Number.parseInt(match[1], 10);
  };

  const domStep = step(dom);
  if (domStep !== null) return domStep;
  if (dom !== '*' && dom !== '?') return 31;

  const dowStep = step(dow);
  if (dowStep !== null) return dowStep;
  if (dow !== '*' && dow !== '?') return 7;

  return 1;
}

/** A run is stale when it has not happened in 1.5 cadences + a day of slack. */
export function isStale(cadenceDays: number | null, daysAgo: number | null): boolean {
  if (cadenceDays === null || daysAgo === null) return false;
  return daysAgo > cadenceDays * 1.5 + 1;
}

/** First `cron:` value in a workflow file, or null for dispatch-only workflows. */
export function extractCron(source: string): string | null {
  const match = /-\s*cron:\s*['"]([^'"]+)['"]/.exec(source);
  return match === null ? null : match[1];
}

/** First line of a commit message. */
export function subjectOf(message: string): string {
  return message.split('\n')[0].trim();
}

/** Bot-authored commits are the ones a workflow could have pushed. */
export function isBotCommitter(name: string): boolean {
  return /tca-bot|github-actions|\[bot\]/i.test(name);
}

// ─── gh plumbing ──────────────────────────────────────────────────────────────

async function gh(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gh', args, {
    timeout: GH_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
    cwd: REPO_ROOT,
  });
  return stdout;
}

/** `gh auth status` — exit code is the signal; the text is the reason. */
async function authStatus(): Promise<{ ok: boolean; detail: string; account: string | null }> {
  try {
    const { stdout, stderr } = await execFileAsync('gh', ['auth', 'status'], {
      timeout: GH_TIMEOUT_MS,
      cwd: REPO_ROOT,
    });
    const text = `${stdout}\n${stderr}`;
    const account = /Logged in to \S+ (?:account|as) (\S+)/.exec(text);
    return { ok: true, detail: text.trim(), account: account === null ? null : account[1] };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const detail = `${err.stdout === undefined ? '' : err.stdout}${err.stderr === undefined ? '' : err.stderr}`.trim();
    return { ok: false, detail: detail === '' ? describeError(error) : detail, account: null };
  }
}

export async function collect(): Promise<CollectorResult<GithubActionsCollected>> {
  return guard('github-actions', async () => {
    // 1 ─ is gh even here?
    let ghVersion: string;
    try {
      ghVersion = (await gh(['--version'])).split('\n')[0].trim();
    } catch (error) {
      return makeUnhealthy<GithubActionsCollected>(
        `gh CLI unusable — ${describeError(error)}. The GitHub Actions collector shells out to \`gh\`; install it ` +
          `(brew install gh) or ensure the nightly job has it on PATH.`
      );
    }

    // 2 ─ is it authenticated?
    const auth = await authStatus();
    if (!auth.ok) {
      return makeUnhealthy<GithubActionsCollected>(
        `gh is installed (${ghVersion}) but not authenticated — ${auth.detail.replace(/\s+/g, ' ').slice(0, 300)}. ` +
          `Run \`gh auth login\` locally, or set GH_TOKEN (nightly.yml already passes secrets.GITHUB_TOKEN).`
      );
    }

    // 3 ─ which repo?
    let repo: z.infer<typeof RepoSchema>;
    try {
      repo = parseValidated(
        await gh(['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef']),
        RepoSchema,
        'gh repo view'
      );
    } catch (error) {
      return makeUnhealthy<GithubActionsCollected>(`gh repo view failed — ${describeError(error)}`);
    }
    const nameWithOwner = repo.nameWithOwner;
    const defaultBranch = repo.defaultBranchRef === null ? 'main' : repo.defaultBranchRef.name;

    // 4 ─ workflows
    let workflowList: z.infer<typeof WorkflowsSchema>;
    try {
      workflowList = parseValidated(
        await gh(['api', `repos/${nameWithOwner}/actions/workflows?per_page=100`]),
        WorkflowsSchema,
        'gh api actions/workflows'
      );
    } catch (error) {
      return makeUnhealthy<GithubActionsCollected>(
        `could not list workflows for ${nameWithOwner} — ${describeError(error)}. ` +
          `The token needs \`actions: read\` on this repository.`
      );
    }

    const problems: string[] = [];
    const statuses: WorkflowStatus[] = [];

    for (const workflow of workflowList.workflows) {
      const filePath = resolve(REPO_ROOT, workflow.path);
      const cron = existsSync(filePath) ? extractCron(readFileSync(filePath, 'utf-8')) : null;
      const cadence = expectedCadenceDays(cron);

      let lastRun: WorkflowStatus['lastRun'] = null;
      let committedDuringRun: number | null = null;
      let commitSubjects: string[] = [];
      let method = 'not attempted';

      try {
        // MUST be the per-workflow runs endpoint. `/actions/runs?workflow_id=N`
        // silently ignores the parameter and returns the repo's latest run for
        // EVERY workflow — the first live run of this collector reported all
        // eight workflows as "succeeded 0d ago, wrote the Clarity commit",
        // which is exactly the plausible-but-wrong output the PRD forbids.
        const runs = parseValidated(
          await gh(['api', `repos/${nameWithOwner}/actions/workflows/${workflow.id}/runs?per_page=1`]),
          RunsSchema,
          `gh api runs (${workflow.name})`
        );
        const run = runs.workflow_runs[0];
        if (run !== undefined) {
          const daysAgo = Math.floor((Date.now() - Date.parse(run.updated_at)) / MS_PER_DAY);
          lastRun = {
            runNumber: run.run_number,
            status: run.status,
            conclusion: run.conclusion,
            startedAt: run.created_at,
            finishedAt: run.updated_at,
            daysAgo,
            url: run.html_url,
            headSha: run.head_sha,
            event: run.event,
          };

          // What did it write? Bot commits inside the run's window.
          const since = run.created_at;
          const until = new Date(Date.parse(run.updated_at) + COMMIT_WINDOW_SLACK_MS).toISOString();
          method = `bot commits on ${defaultBranch} between run start (${since}) and run end + 15min (${until}) — inferred, not authoritative`;
          const commits = parseValidated(
            await gh([
              'api',
              `repos/${nameWithOwner}/commits?sha=${defaultBranch}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=30`,
            ]),
            CommitsSchema,
            `gh api commits (${workflow.name})`
          );
          const botCommits = commits.filter((c) => isBotCommitter(c.commit.committer.name));
          committedDuringRun = botCommits.length;
          commitSubjects = botCommits.map((c) => subjectOf(c.commit.message)).slice(0, 5);
        }
      } catch (error) {
        problems.push(`${workflow.name}: ${describeError(error)}`);
      }

      statuses.push({
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        cron,
        expectedCadenceDays: cadence,
        lastRun,
        committedDuringRun,
        commitSubjects,
        commitInferenceMethod: method,
        stale: isStale(cadence, lastRun === null ? null : lastRun.daysAgo),
      });
    }

    const data: GithubActionsCollected = {
      repo: nameWithOwner,
      defaultBranch,
      ghVersion,
      authAccount: auth.account,
      workflows: statuses,
      failing: statuses.filter((w) => w.lastRun !== null && w.lastRun.conclusion === 'failure').map((w) => w.name),
      stale: statuses.filter((w) => w.stale).map((w) => w.name),
      neverRan: statuses.filter((w) => w.lastRun === null).map((w) => w.name),
      wroteNothing: statuses
        .filter((w) => w.lastRun !== null && w.lastRun.conclusion === 'success' && w.committedDuringRun === 0)
        .map((w) => w.name),
    };

    if (problems.length > 0) {
      return makeUnhealthy<GithubActionsCollected>(
        `could not fully inspect ${problems.length} workflow(s) — ${problems.join(' | ')}`,
        data,
        statuses.length
      );
    }
    return makeHealthy(data, statuses.length);
  });
}
