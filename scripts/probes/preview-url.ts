/**
 * probes/preview-url.ts — A9. Resolves the Cloudflare Pages preview URL for a commit.
 *
 * WHY THIS EXISTS RATHER THAN A `deployment_status` TRIGGER
 * The obvious design is a workflow on `deployment_status`, reading `environment_url`.
 * That does not work here: Cloudflare Pages is not creating GitHub deployments on this
 * repo. Verified 2026-08-08 — `GET /repos/:owner/:repo/deployments` returns exactly one
 * record, from `railway-app[bot]` in March. There is no deployment event to hook, so
 * the URL has to come from Cloudflare's own API.
 *
 * WHY IT MATCHES ON COMMIT SHA AND NOT ON BRANCH
 * A branch alias (`https://<branch>.<project>.pages.dev`) is stable and predictable,
 * which is exactly the problem: it keeps serving the PREVIOUS build until the new one
 * finishes. A gate that probes the previous build and reports green is worse than no
 * gate. Matching `deployment_trigger.metadata.commit_hash` against the head SHA means
 * the probe either sees this commit or the job fails.
 *
 * Prints the deployment URL on stdout. Everything else goes to stderr so the caller
 * can do `URL=$(tsx scripts/probes/preview-url.ts --sha "$SHA")`.
 *
 * Usage:
 *   tsx scripts/probes/preview-url.ts --sha <commit> [--timeout-sec 600] [--interval-sec 15]
 */

import 'dotenv/config';
import { z } from 'zod';

const API = 'https://api.cloudflare.com/client/v4';
const SITE_DOMAIN = 'tallchairadvisor.com';

const ApiError = z.array(z.object({ code: z.number().optional(), message: z.string() }).passthrough());

const ProjectsSchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z
    .array(z.object({ name: z.string(), domains: z.array(z.string()).optional() }).passthrough())
    .nullable(),
});

const DeploymentsSchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z
    .array(
      z
        .object({
          id: z.string(),
          url: z.string().optional(),
          environment: z.string().optional(),
          latest_stage: z.object({ name: z.string(), status: z.string() }).nullable().optional(),
          deployment_trigger: z
            .object({ metadata: z.object({ commit_hash: z.string().optional() }).passthrough().optional() })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    )
    .nullable(),
});

function env(name: string): string | null {
  const v = process.env[name];
  return v === undefined || v.trim() === '' ? null : v.trim();
}

async function cfGet<T>(path: string, token: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Cloudflare API ${path} returned HTTP ${res.status}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(
      `Cloudflare API ${path} returned an unexpected shape — ${parsed.error.issues[0].message} at '${parsed.error.issues[0].path.join('.')}'`,
    );
  }
  return parsed.data;
}

async function resolveProject(accountId: string, token: string): Promise<string> {
  const configured = env('CLOUDFLARE_PAGES_PROJECT');
  if (configured !== null) return configured;
  const projects = await cfGet(`/accounts/${accountId}/pages/projects`, token, ProjectsSchema);
  // `result: null` means the API answered without a project list. That is not the same
  // as "you have no projects", and collapsing the two with `?? []` would report the
  // wrong cause — the R1 class this repo baselines against.
  if (projects.result === null) throw new Error('Cloudflare returned a null project list — cannot resolve the Pages project');
  const list = projects.result;
  const matched =
    list.find((p) => (p.domains === undefined ? [] : p.domains).some((d) => d.endsWith(SITE_DOMAIN))) ??
    (list.length === 1 ? list[0] : undefined);
  if (matched === undefined) {
    throw new Error(
      `no Pages project serves ${SITE_DOMAIN} (saw: ${list.map((p) => p.name).join(', ') || 'none'}). ` +
        'Set CLOUDFLARE_PAGES_PROJECT.',
    );
  }
  return matched.name;
}

export interface Attempt {
  url: string | null;
  /** Why we are still waiting, or why we gave up. Never null when url is null. */
  reason: string | null;
}

/** One poll. Split out so the retry loop stays trivial and this stays testable. */
export function pick(
  deployments: z.infer<typeof DeploymentsSchema>['result'],
  sha: string,
): Attempt {
  // null is "Cloudflare answered with no list", empty is "no deployments exist". Both
  // mean keep waiting, but they are different states and the reason text says which.
  if (deployments === null) {
    return { url: null, reason: 'Cloudflare returned a null deployment list — nothing to match against yet' };
  }
  const mine = deployments.filter((d) => d.deployment_trigger?.metadata?.commit_hash === sha);
  if (mine.length === 0) {
    return { url: null, reason: `no Pages deployment yet for commit ${sha.slice(0, 8)}` };
  }
  const ready = mine.find((d) => d.latest_stage?.name === 'deploy' && d.latest_stage.status === 'success');
  if (ready === undefined) {
    const stage = mine[0].latest_stage;
    const failed = mine.find((d) => d.latest_stage?.status === 'failure');
    if (failed !== undefined) {
      return { url: null, reason: `Cloudflare Pages build FAILED for ${sha.slice(0, 8)} (stage ${failed.latest_stage?.name})` };
    }
    return { url: null, reason: `deployment for ${sha.slice(0, 8)} is at stage ${stage?.name ?? '?'}/${stage?.status ?? '?'}` };
  }
  if (ready.url === undefined || ready.url === '') {
    return { url: null, reason: `deployment ${ready.id} succeeded but carries no url` };
  }
  return { url: ready.url.replace(/\/$/, ''), reason: null };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const read = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : (argv[i + 1] ?? fallback);
  };
  const sha = read('--sha', '');
  if (sha === '') throw new Error('--sha is required');
  const timeoutSec = Number.parseInt(read('--timeout-sec', '600'), 10);
  const intervalSec = Number.parseInt(read('--interval-sec', '15'), 10);

  const token = env('CLOUDFLARE_API_TOKEN');
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (token === null) throw new Error('CLOUDFLARE_API_TOKEN not set — the gate cannot find the preview build');
  if (accountId === null) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID not set — the token carries zone scopes but cannot list accounts');
  }

  const project = await resolveProject(accountId, token);
  console.error(`[preview-url] project ${project}, waiting for commit ${sha.slice(0, 8)}`);

  const deadline = Date.now() + timeoutSec * 1000;
  let last = 'no attempt made';
  while (Date.now() < deadline) {
    const deployments = await cfGet(
      `/accounts/${accountId}/pages/projects/${encodeURIComponent(project)}/deployments?per_page=25`,
      token,
      DeploymentsSchema,
    );
    const attempt = pick(deployments.result, sha);
    if (attempt.url !== null) {
      console.error(`[preview-url] ready: ${attempt.url}`);
      console.log(attempt.url);
      return;
    }
    last = attempt.reason ?? 'unknown';
    if (last.includes('FAILED')) throw new Error(last);
    console.error(`[preview-url] ${last} — retrying in ${intervalSec}s`);
    await new Promise((r) => setTimeout(r, intervalSec * 1000));
  }
  throw new Error(`timed out after ${timeoutSec}s waiting for a preview deployment. Last state: ${last}`);
}

const invokedDirectly = process.argv[1] !== undefined && /preview-url\.ts$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(`[preview-url] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
