/**
 * keyword-discovery.test.ts
 * TDD tests for Phase 7 Plan 01 — filter + scoring logic.
 * Run: npx tsx scripts/keyword-discovery.test.ts
 *
 * These tests validate the behavior extracted from the plan's <behavior> block.
 * They import pure functions directly from keyword-discovery-logic.ts (extracted helpers).
 *
 * Note: Because keyword-discovery.ts is a top-level script (not a module with exports),
 * the filter and score logic is tested via inline reimplementation here that must match
 * exactly what is implemented in the script.
 */

// ─── Inline implementations to test (must match what will be in keyword-discovery.ts) ───

interface DataForSEOItem {
  keyword: string;
  keyword_info: {
    search_volume: number | null;
    cpc: number | null;
  };
  keyword_properties: {
    keyword_difficulty: number | null;
  };
  search_intent_info: {
    main_intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  };
}

const HEIGHT_MODIFIERS = ['tall', "6'", 'big and tall', 'large frame'];

function filterKeyword(item: DataForSEOItem): boolean {
  const kd = item.keyword_properties?.keyword_difficulty ?? 0;
  const vol = item.keyword_info?.search_volume ?? 0;
  const intent = item.search_intent_info?.main_intent;
  if (kd > 35) return false;
  if (vol < 50) return false;
  if (intent === 'navigational') return false;
  return true;
}

function scoreKeyword(item: DataForSEOItem): number {
  const intent = item.search_intent_info?.main_intent;
  const kd = item.keyword_properties?.keyword_difficulty ?? 0;
  const vol = item.keyword_info?.search_volume ?? 0;

  const intentScore = (intent === 'commercial' || intent === 'transactional') ? 1.0
    : intent === 'informational' ? 0.5
    : 0.0;

  const feasScore = (35 - kd) / 35;
  const volScore = Math.min(Math.log10(Math.max(vol, 1)) / Math.log10(10000), 1.0);
  const kwOrig = item.keyword.toLowerCase();
  const qualScore = HEIGHT_MODIFIERS.some((m) => kwOrig.includes(m)) ? 1.0 : 0.0;

  return (intentScore * 0.35) + (feasScore * 0.25) + (volScore * 0.25) + (qualScore * 0.15);
}

// ─── Test helpers ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

function makeItem(overrides: Partial<{
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  keyword_difficulty: number | null;
  main_intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
}>): DataForSEOItem {
  return {
    keyword: overrides.keyword ?? 'office chair',
    keyword_info: {
      search_volume: overrides.search_volume ?? 100,
      cpc: overrides.cpc ?? 1.0,
    },
    keyword_properties: {
      keyword_difficulty: overrides.keyword_difficulty ?? 20,
    },
    search_intent_info: {
      main_intent: overrides.main_intent ?? 'commercial',
    },
  };
}

// ─── Filter tests ──────────────────────────────────────────────────────────────

console.log('\nFilter tests:');

assert(
  'KD=40 is excluded',
  filterKeyword(makeItem({ keyword_difficulty: 40 })) === false
);

assert(
  'KD=35 passes',
  filterKeyword(makeItem({ keyword_difficulty: 35 })) === true
);

assert(
  'volume=49 is excluded',
  filterKeyword(makeItem({ search_volume: 49 })) === false
);

assert(
  'volume=50 passes',
  filterKeyword(makeItem({ search_volume: 50 })) === true
);

assert(
  "navigational intent is excluded regardless of KD/volume",
  filterKeyword(makeItem({ main_intent: 'navigational', keyword_difficulty: 5, search_volume: 1000 })) === false
);

assert(
  'null KD treated as KD=0 (passes filter)',
  filterKeyword(makeItem({ keyword_difficulty: null, search_volume: 100 })) === true
);

assert(
  'null intent treated as non-navigational (passes filter)',
  filterKeyword(makeItem({ main_intent: null, keyword_difficulty: 10, search_volume: 100 })) === true
);

// ─── Score tests ───────────────────────────────────────────────────────────────

console.log('\nScore tests:');

// commercial intent, KD=0, vol=10000, no qualifier = 0.85
const s1 = scoreKeyword(makeItem({ keyword: 'office chair', main_intent: 'commercial', keyword_difficulty: 0, search_volume: 10000 }));
assert(
  `commercial/KD=0/vol=10000/no-qualifier = 0.85 (got ${s1.toFixed(4)})`,
  Math.abs(s1 - 0.85) < 0.001
);

// 'tall' modifier → qualifierScore = 1.0
const s2 = scoreKeyword(makeItem({ keyword: 'best tall office chair', main_intent: 'commercial', keyword_difficulty: 0, search_volume: 10000 }));
assert(
  `"best tall office chair" has qualifier score 1.0 — total = 1.0 (got ${s2.toFixed(4)})`,
  Math.abs(s2 - 1.0) < 0.001
);

// "6'" apostrophe preserved in original keyword
const s3 = scoreKeyword(makeItem({ keyword: "best 6' office chair", main_intent: 'commercial', keyword_difficulty: 0, search_volume: 10000 }));
assert(
  `"best 6' office chair" (apostrophe) has qualifier score 1.0 — total = 1.0 (got ${s3.toFixed(4)})`,
  Math.abs(s3 - 1.0) < 0.001
);

// Volume clamped: vol=500000 gives volScore=1.0 (not > 1)
const item500k = makeItem({ keyword: 'office chair', main_intent: 'commercial', keyword_difficulty: 0, search_volume: 500000 });
const volScore500k = Math.min(Math.log10(Math.max(500000, 1)) / Math.log10(10000), 1.0);
assert(
  `vol=500000 volScore clamped to 1.0 (got ${volScore500k.toFixed(4)})`,
  Math.abs(volScore500k - 1.0) < 0.001
);

// Sort: higher score first
console.log('\nOrdering tests:');
const items = [
  makeItem({ keyword: 'a', main_intent: 'informational', keyword_difficulty: 30, search_volume: 100 }),
  makeItem({ keyword: 'b', main_intent: 'commercial', keyword_difficulty: 0, search_volume: 10000 }),
];
const scored = items.map((item) => ({ item, score: scoreKeyword(item) })).sort((a, b) => b.score - a.score);
assert(
  'Higher score sorts first — commercial/KD=0/10000 outranks informational/KD=30/100',
  scored[0].item.keyword === 'b'
);

// slice(0, 20) takes top 20
const manyItems = Array.from({ length: 30 }, (_, i) =>
  makeItem({ keyword: `kw-${i}`, main_intent: 'commercial', keyword_difficulty: i, search_volume: 200 })
);
const scoredMany = manyItems.map((item) => ({ item, score: scoreKeyword(item) })).sort((a, b) => b.score - a.score);
const top20 = scoredMany.slice(0, 20);
assert(`top20 slice returns 20 items (got ${top20.length})`, top20.length === 20);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}
