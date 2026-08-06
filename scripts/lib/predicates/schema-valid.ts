/**
 * schema-valid — a JSON-LD block of the named @type is present AND parses.
 *
 * Both halves matter. A block that is present but malformed is worse than absent:
 * Google drops it silently, so the page looks marked-up in source and carries no
 * structured data in the index. A parse failure here is a FAIL, not a crash — the
 * page is live and wrong, which is a finding, not an outage.
 */

import { z } from 'zod';
import { extractJsonLdBlocks, isVerdict, jsonLdNodes, nodeTypes, pageHtml, probeFor } from './http.js';
import { fail, pass, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';
import { parseJsonLd } from './http.js';

export const schema = z.object({
  kind: z.literal('schema-valid'),
  url: z.string().min(1),
  type: z.string().min(1),
});

function typesFromProbe(record: Record<string, unknown>): string[] | null {
  const head = record.head;
  const containers: Array<Record<string, unknown>> = [record];
  if (head !== null && typeof head === 'object') containers.push(head as Record<string, unknown>);
  for (const container of containers) {
    for (const key of ['jsonLdTypes', 'schemaTypes', 'jsonld_types']) {
      const value = container[key];
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value as string[];
    }
    // scripts/probes/types.ts ProbeHead.jsonLd: [{ type: 'Review+Product', valid }].
    // Only blocks that parsed AND carried a usable @type count — an unparseable
    // block is exactly what this predicate is meant to catch.
    const blocks = container.jsonLd;
    if (Array.isArray(blocks)) {
      const types: string[] = [];
      for (const item of blocks) {
        if (item === null || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        if (row.valid !== true || typeof row.type !== 'string') continue;
        types.push(...row.type.split('+').map((t) => t.trim()));
      }
      return types;
    }
  }
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'schema-valid' }>;
  const wanted = p.type.toLowerCase();

  const probe = probeFor(p.url, ctx);
  if (probe !== null) {
    const types = typesFromProbe(probe);
    if (types !== null) {
      const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
      const evidence = {
        source: ctx.probeSource ?? 'probe',
        observedAt,
        detail: { url: p.url, wantedType: p.type, typesFound: types },
      };
      return types.some((t) => t.toLowerCase() === wanted)
        ? pass(`JSON-LD @type ${p.type} present`, evidence)
        : fail(`no JSON-LD @type ${p.type}; found [${types.join(', ')}]`, evidence);
    }
  }

  const loaded = await pageHtml(p.url, ctx);
  if (isVerdict(loaded)) return loaded;

  const blocks = extractJsonLdBlocks(loaded.html);
  const typesFound: string[] = [];
  const malformed: number[] = [];

  blocks.forEach((block, index) => {
    const parsed = parseJsonLd(block, `${loaded.page.url} ld+json[${index}]`);
    if (parsed === null) {
      malformed.push(index);
      return;
    }
    for (const node of jsonLdNodes(parsed)) typesFound.push(...nodeTypes(node));
  });

  const evidence = {
    source: `fetch:${loaded.page.url}`,
    observedAt: loaded.page.fetchedAt,
    detail: { url: loaded.page.url, wantedType: p.type, blocks: blocks.length, malformedBlocks: malformed, typesFound },
  };

  if (blocks.length === 0) return fail('no <script type="application/ld+json"> blocks on the page', evidence);
  if (malformed.length > 0) {
    return fail(`${malformed.length} of ${blocks.length} JSON-LD block(s) do not parse (index ${malformed.join(', ')})`, evidence);
  }
  if (!typesFound.some((t) => t.toLowerCase() === wanted)) {
    return fail(`no JSON-LD @type ${p.type}; found [${[...new Set(typesFound)].join(', ')}]`, evidence);
  }
  return pass(`JSON-LD @type ${p.type} present and every block parses`, evidence);
}
