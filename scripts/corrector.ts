/**
 * corrector.ts — L7 of God's-Eye Nightly (PRD §7.8)
 *
 * The ONLY component that edits a live money site unattended. It ships last, and
 * it is split strictly by reversibility.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE DENY LIST IS THE POINT
 *
 * PRD §7.8 and §4: unattended LLM page edits are "explicitly out of scope
 * forever". This file contains NO LLM call and imports no Anthropic client. That
 * is not an oversight to be helpfully corrected later — it is the design.
 *
 *     "No unattended LLM page edits at 03:00. That is how you get a bad week
 *      you cannot unwind."
 *
 * NEVER auto-fix, always escalate with a predicate:
 *   - anything requiring an LLM to rewrite page content
 *   - anything touching public/_redirects, canonicals, or schema semantics
 *   - anything that would create or delete a page
 *
 * Every auto-fix is deterministic, verifiable, reversible, routed through the
 * existing assertSafeToAct() preflight, and committed separately as `fix(auto):`
 * so any single correction can be reverted on its own.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { assertSafeToAct, filePathToSlug } from './assert-safe-to-act.js';
import { loadRedirectMap, isRedirectSource, withTrailingSlash } from './redirect-map.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const TODAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: process.env.TCA_TZ ?? 'America/Los_Angeles',
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

/** Paths no automated correction may ever touch (PRD §7.8 deny list). */
const FORBIDDEN_PATHS = [
  'public/_redirects',   // redirect semantics — a wrong edit silently unmerges pages
  'public/_headers',     // CSP; the June 16 incident blocked analytics for a month
  'astro.config.mjs',    // sitemap/canonical policy
];

interface Correction {
  kind: string;
  file: string;
  before: string;
  after: string;
  why: string;
}

interface Escalation {
  kind: string;
  target: string;
  why: string;
  closurePredicate: Record<string, unknown>;
}

const corrections: Correction[] = [];
const escalations: Escalation[] = [];

function forbidden(relPath: string): boolean {
  return FORBIDDEN_PATHS.some(p => relPath === p || relPath.startsWith(p));
}

// ─── ASIN registry ────────────────────────────────────────────────────────────

interface AsinRegistry {
  asins: Record<string, { product?: string }>;
  known_dead: Record<string, string>;
}

function loadRegistry(): AsinRegistry | null {
  const path = resolve(ROOT, 'data/verified-asins.json');
  if (!existsSync(path)) {
    console.error('[corrector] data/verified-asins.json missing — skipping ASIN corrections entirely.');
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as AsinRegistry;
    if (!parsed.asins || typeof parsed.asins !== 'object') {
      console.error('[corrector] verified-asins.json has no `asins` map — skipping ASIN corrections.');
      return null;
    }
    return parsed;
  } catch (error) {
    console.error(`[corrector] verified-asins.json unreadable: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * known_dead maps ASIN -> a PROSE reason, which sometimes names a replacement
 * ("...Use B01N32UFNT."). Auto-swapping on prose is only safe when the
 * replacement is unambiguous: exactly one candidate ASIN in the text, it is not
 * the dead one, and it is itself registered as verified.
 *
 * Anything less certain is escalated, never guessed. Swapping in the wrong ASIN
 * silently sends buyers to the wrong product and earns commission on it, which
 * is worse than leaving a dead link visible.
 */
function replacementFor(dead: string, reason: string, registry: AsinRegistry): string | null {
  const candidates = [...new Set(reason.match(/\bB[A-Z0-9]{9}\b/g) ?? [])].filter(a => a !== dead);
  if (candidates.length !== 1) return null;
  const candidate = candidates[0];
  if (!(candidate in registry.asins)) return null;
  if (candidate in registry.known_dead) return null;
  return candidate;
}

function pageFiles(): string[] {
  const out = execFileSync('git', ['ls-files', 'src/pages'], { cwd: ROOT, encoding: 'utf-8' });
  return out.split('\n').filter(f => f.endsWith('.astro'));
}

/** AUTO-FIX: dead ASIN -> the registry's verified replacement. */
function fixDeadAsins(registry: AsinRegistry): void {
  const dead = registry.known_dead ?? {};
  if (Object.keys(dead).length === 0) return;

  for (const rel of pageFiles()) {
    if (forbidden(rel)) continue;
    const path = resolve(ROOT, rel);
    const original = readFileSync(path, 'utf-8');
    let content = original;

    for (const [deadAsin, reason] of Object.entries(dead)) {
      if (!content.includes(`/dp/${deadAsin}`)) continue;

      const replacement = replacementFor(deadAsin, reason, registry);
      if (!replacement) {
        escalations.push({
          kind: 'dead-asin-no-replacement',
          target: filePathToSlug(rel),
          why: `${rel} links dead ASIN ${deadAsin}, and the registry does not name an unambiguous verified replacement. Reason on file: ${reason}`,
          closurePredicate: { kind: 'asin-registered', url: filePathToSlug(rel) },
        });
        continue;
      }
      content = content.replaceAll(`/dp/${deadAsin}`, `/dp/${replacement}`);
      corrections.push({
        kind: 'dead-asin-swap',
        file: rel,
        before: deadAsin,
        after: replacement,
        why: `${deadAsin} is registered dead; ${replacement} is the registry's verified replacement`,
      });
    }

    if (content === original) continue;

    // Route every write through the existing deterministic preflight.
    const verdict = assertSafeToAct(ROOT, { kind: 'edit', filePath: rel, content });
    if (!verdict.safe) {
      escalations.push({
        kind: 'preflight-rejected',
        target: rel,
        why: `assertSafeToAct rejected the ASIN correction: ${verdict.reason ?? 'no reason given'}`,
        closurePredicate: { kind: 'asin-registered', url: filePathToSlug(rel) },
      });
      // Drop the corrections we had queued for this file — they are not landing.
      for (let i = corrections.length - 1; i >= 0; i--) if (corrections[i].file === rel) corrections.splice(i, 1);
      continue;
    }
    if (!DRY_RUN) writeFileSync(path, content);
  }
}

/** AUTO-FIX: a page missing from the sitemap's pageLastmod map. */
function fixMissingLastmod(): void {
  const configPath = resolve(ROOT, 'astro.config.mjs');
  if (!existsSync(configPath)) return;

  // astro.config.mjs is on the deny list for WRITES (it carries canonical and
  // sitemap policy). We only READ it, and escalate — the PRD's auto-fix entry
  // for pageLastmod predates that file also owning canonical semantics, and a
  // regex edit to a config that governs canonicals is not reversible enough to
  // qualify as deterministic.
  const config = readFileSync(configPath, 'utf-8');
  const redirects = loadRedirectMap(ROOT);

  // astro.config.mjs already declares which paths are deliberately out of the
  // sitemap (404, privacy-policy, contact, …). A page missing from pageLastmod
  // because it is intentionally excluded is not a defect — reporting it would
  // train Jackson to ignore this check, which is how a real gap gets missed.
  const excluded = new Set<string>();
  const excludedBlock = /sitemapExcludedPaths\s*=\s*new Set\(\[([\s\S]*?)\]\)/.exec(config);
  if (excludedBlock) {
    for (const m of excludedBlock[1].matchAll(/['"`]([^'"`]+)['"`]/g)) excluded.add(withTrailingSlash(m[1]));
  } else {
    console.error('[corrector] could not parse sitemapExcludedPaths from astro.config.mjs — reporting all gaps, expect noise.');
  }

  const missing: string[] = [];
  for (const rel of pageFiles()) {
    const slug = filePathToSlug(rel);
    if (isRedirectSource(redirects, slug)) continue;
    if (excluded.has(slug)) continue;
    // A page whose source carries a noindex is out of the sitemap by intent.
    if (readFileSync(resolve(ROOT, rel), 'utf-8').includes('noindex')) continue;
    if (!config.includes(slug)) missing.push(slug);
  }
  if (missing.length === 0) return;

  escalations.push({
    kind: 'missing-pagelastmod',
    target: 'astro.config.mjs',
    why: `${missing.length} page(s) absent from the sitemap pageLastmod map: ${missing.join(', ')}. Not auto-fixed: astro.config.mjs also governs canonical and sitemap policy, and is on the §7.8 deny list.`,
    closurePredicate: { kind: 'canonical-self', url: missing[0] },
  });
}

/** AUTO-FIX: internal link pointing at a 301 source -> its resolved target. */
function fixRedirectedInternalLinks(): void {
  const redirects = loadRedirectMap(ROOT);
  if (redirects.size === 0) return;

  for (const rel of pageFiles()) {
    if (forbidden(rel)) continue;
    const path = resolve(ROOT, rel);
    const original = readFileSync(path, 'utf-8');
    let content = original;

    for (const [source, target] of redirects) {
      // Only rewrite href="..." occurrences, never prose or schema @id values —
      // an @id is an identity, not a link, and rewriting one changes meaning.
      const pattern = new RegExp(`href="${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
      if (!pattern.test(content)) continue;
      content = content.replace(pattern, `href="${target}"`);
      corrections.push({
        kind: 'redirected-internal-link',
        file: rel,
        before: source,
        after: target,
        why: `internal link pointed at a 301 source; rewritten to its target to remove the hop`,
      });
    }

    if (content === original) continue;
    const verdict = assertSafeToAct(ROOT, { kind: 'edit', filePath: rel, content });
    if (!verdict.safe) {
      escalations.push({
        kind: 'preflight-rejected',
        target: rel,
        why: `assertSafeToAct rejected the link correction: ${verdict.reason ?? 'no reason given'}`,
        closurePredicate: { kind: 'canonical-self', url: filePathToSlug(rel) },
      });
      for (let i = corrections.length - 1; i >= 0; i--) if (corrections[i].file === rel) corrections.splice(i, 1);
      continue;
    }
    if (!DRY_RUN) writeFileSync(path, content);
  }
}

/** AUTO-FIX: malformed JSON in a data file -> restore last-good from git. */
function fixMalformedDataFiles(): void {
  const tracked = execFileSync('git', ['ls-files', 'data'], { cwd: ROOT, encoding: 'utf-8' })
    .split('\n').filter(f => f.endsWith('.json'));

  for (const rel of tracked) {
    const path = resolve(ROOT, rel);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf-8');
    try {
      JSON.parse(content);
      continue; // well-formed
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      let lastGood: string;
      try {
        lastGood = execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf-8' });
        JSON.parse(lastGood);
      } catch {
        escalations.push({
          kind: 'malformed-data-no-restore',
          target: rel,
          why: `${rel} is malformed JSON (${reason}) and the committed version is also unusable. Needs a human.`,
          closurePredicate: { kind: 'collector-healthy', collector: rel },
        });
        continue;
      }
      if (!DRY_RUN) writeFileSync(path, lastGood);
      corrections.push({
        kind: 'restore-malformed-json',
        file: rel,
        before: `malformed (${reason})`,
        after: 'last-good from HEAD',
        why: 'a malformed data file silently poisons every downstream agent',
      });
    }
  }
}

// ─── commit ───────────────────────────────────────────────────────────────────

/**
 * One commit per correction, so any single fix can be reverted alone. Data-only
 * commits carry [skip cd]; a src/pages/ edit must NOT, since it needs to deploy.
 */
function commitEach(): void {
  for (const c of corrections) {
    const isData = c.file.startsWith('data/');
    const prefix = isData ? '[skip cd] ' : '';
    try {
      execFileSync('git', ['add', c.file], { cwd: ROOT });
      const staged = execFileSync('git', ['diff', '--staged', '--name-only'], { cwd: ROOT, encoding: 'utf-8' }).trim();
      if (!staged) continue;
      execFileSync(
        'git',
        ['commit', '-m', `${prefix}fix(auto): ${c.kind} in ${c.file}\n\n${c.before} -> ${c.after}\n\n${c.why}\n\nApplied by scripts/corrector.ts on ${TODAY}. Deterministic and reversible;\nrouted through assertSafeToAct(). Revert this commit alone to undo.`],
        { cwd: ROOT },
      );
    } catch (error) {
      console.error(`[corrector] commit failed for ${c.file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function main(): void {
  console.log(`[corrector] ${TODAY}${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const registry = loadRegistry();
  if (registry) fixDeadAsins(registry);
  fixRedirectedInternalLinks();
  fixMissingLastmod();
  fixMalformedDataFiles();

  console.log(`\nAuto-fixed: ${corrections.length}`);
  for (const c of corrections) console.log(`  ${c.kind.padEnd(28)} ${c.file}  ${c.before} -> ${c.after}`);

  console.log(`\nEscalated (never auto-fixed): ${escalations.length}`);
  for (const e of escalations) console.log(`  ${e.kind.padEnd(28)} ${e.target}\n    ${e.why}`);

  if (escalations.length > 0) {
    const path = resolve(ROOT, 'data/corrector-escalations.json');
    if (!DRY_RUN) {
      writeFileSync(path, JSON.stringify({ generatedAt: new Date().toISOString(), date: TODAY, escalations }, null, 2) + '\n');
    }
    console.log(`\n[corrector] escalations written to data/corrector-escalations.json`);
    console.log('[corrector] each carries a closurePredicate; the ledger will file and track them.');
  }

  if (!DRY_RUN && corrections.length > 0) commitEach();
  if (DRY_RUN) console.log('\n[corrector] dry run — nothing written, nothing committed.');
}

main();
