/**
 * seed-edit-log.ts — bootstrap data/edit-log.jsonl once, from evidence.
 *
 * The edit log is authoritative from the moment the agents start appending to
 * it, but on day one it is empty — and an empty log means "no page has ever been
 * substantively revised", which would let the first run rewrite a page the
 * pipeline genuinely rewrote last week.
 *
 * WHERE THE SEED COMES FROM, AND WHY ONLY HERE
 *
 * `data/interventions.jsonl` is the one existing record of edits the agents
 * actually applied, with the page and the date they were applied. It is written
 * by `appendIntervention` at the moment of the write — the same property that
 * makes the edit log trustworthy — so it is the only defensible seed available.
 *
 * `git log` is deliberately NOT used, even here. It is the signal this whole
 * change exists to stop trusting: it cannot tell a rewrite from a link sweep,
 * and seeding from it would import exactly the false lockouts that put 49 of 54
 * pages on cooldown. A seed that is honest but sparse beats one that is dense
 * and wrong; the sparse case self-corrects within one cycle as agents append.
 *
 * Idempotent: refuses to run if the log already exists, so it can never
 * double-seed. Delete the file deliberately to re-seed.
 *
 * Usage: npx tsx scripts/seed-edit-log.ts [--dry-run]
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { appendEdit, EDIT_LOG_PATH, type EditEntry } from './lib/edit-log.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Only the fields the seed needs; interventions.jsonl carries many more. */
const interventionSeedSchema = z.object({
  page: z.string().min(1),
  appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
});

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const logPath = resolve(ROOT, EDIT_LOG_PATH);

  if (existsSync(logPath) && !dryRun) {
    console.log(`[seed-edit-log] ${EDIT_LOG_PATH} already exists — refusing to double-seed.`);
    console.log('[seed-edit-log] Delete it deliberately if you intend to re-seed.');
    return;
  }

  const interventionsPath = resolve(ROOT, 'data/interventions.jsonl');
  if (!existsSync(interventionsPath)) {
    console.log('[seed-edit-log] no data/interventions.jsonl — starting from an empty log.');
    return;
  }

  const lines = readFileSync(interventionsPath, 'utf-8').split('\n').filter((l) => l.trim() !== '');

  // Keep only the most recent intervention per page — cooldown asks "how long
  // since the last one", so older entries for the same page change no answer.
  const latest = new Map<string, EditEntry>();
  let skipped = 0;

  for (const line of lines) {
    let candidate: unknown;
    try {
      // lint-architecture-allow R4 -- validated by interventionSeedSchema below; a malformed line is counted and skipped, never trusted
      candidate = JSON.parse(line);
    } catch {
      skipped += 1;
      continue;
    }
    const parsed = interventionSeedSchema.safeParse(candidate);
    if (!parsed.success) { skipped += 1; continue; }

    const { page, appliedDate, description } = parsed.data;
    const existing = latest.get(page);
    if (existing !== undefined && existing.appliedDate >= appliedDate) continue;

    latest.set(page, {
      page,
      // Every intervention record is a real content change the agents applied.
      editClass: 'substantive',
      appliedDate,
      agent: 'seed',
      description: `seeded from interventions.jsonl: ${description ?? page}`,
    });
  }

  const entries = [...latest.values()].sort((a, b) => a.appliedDate.localeCompare(b.appliedDate));

  console.log(`[seed-edit-log] ${lines.length} intervention line(s) -> ${entries.length} page(s)${skipped > 0 ? `, ${skipped} skipped as malformed` : ''}`);
  for (const e of entries) console.log(`  ${e.appliedDate}  ${e.page}`);

  if (dryRun) {
    console.log('[seed-edit-log] --dry-run: nothing written.');
    return;
  }

  for (const e of entries) appendEdit(ROOT, e);
  console.log(`[seed-edit-log] wrote ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to ${EDIT_LOG_PATH}`);
}

main();
