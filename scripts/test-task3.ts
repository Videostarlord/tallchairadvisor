/**
 * test-task3.ts — TDD RED/GREEN tests for Plan 04-02 Task 1:
 *   - detectContentGaps() behavior
 *
 * Run with: tsx scripts/test-task3.ts
 */

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { detectContentGaps } from './gsc-analyze.js';
import type { ContentGap } from './gsc-analyze.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Temp dir for fixture files
const TMP = resolve(__dirname, '../.tmp-test-task3');
mkdirSync(TMP, { recursive: true });

// Test runner
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) { console.log(`  PASS: ${testName}`); passed++; }
  else { console.error(`  FAIL: ${testName}`); failed++; }
}

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  if (actual === expected) { console.log(`  PASS: ${testName}`); passed++; }
  else {
    console.error(`  FAIL: ${testName}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// Helper: build a PageQueryRow fixture
function pqRow(query: string, page: string, position: number, impressions: number) {
  return { query, page, clicks: null, impressions, ctr: 0, position };
}

// ─── Test suite ──────────────────────────────────────────────────────────────

console.log('\n=== detectContentGaps — missing intelligence.json ===');
{
  const missingPath = resolve(TMP, 'does-not-exist.json');
  const result = detectContentGaps([], missingPath);
  assertEqual(result.length, 0, 'returns [] when intelligence.json does not exist');
}

console.log('\n=== detectContentGaps — intelligence.json with no competitorKeywords ===');
{
  const noKwPath = resolve(TMP, 'intel-no-kw.json');
  writeFileSync(noKwPath, JSON.stringify({ summary: 'no keywords here', competitorGaps: [] }));
  const result = detectContentGaps([], noKwPath);
  assertEqual(result.length, 0, 'returns [] when competitorKeywords field is absent');
}

console.log('\n=== detectContentGaps — malformed JSON ===');
{
  const badPath = resolve(TMP, 'intel-bad.json');
  writeFileSync(badPath, '{ invalid json !!!');
  const result = detectContentGaps([], badPath);
  assertEqual(result.length, 0, 'returns [] when intelligence.json is malformed JSON');
}

console.log('\n=== detectContentGaps — empty competitorKeywords array ===');
{
  const emptyKwPath = resolve(TMP, 'intel-empty-kw.json');
  writeFileSync(emptyKwPath, JSON.stringify({ competitorKeywords: [] }));
  const result = detectContentGaps([], emptyKwPath);
  assertEqual(result.length, 0, 'returns [] when competitorKeywords is empty array');
}

console.log('\n=== detectContentGaps — high severity (position >= 20) ===');
{
  const intelPath = resolve(TMP, 'intel-high.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'best tall chair', competitorDomain: 'example.com', competitorPosition: 2 }
    ]
  }));
  const rows = [pqRow('best tall chair', '/review/gesture/', 25, 50)];
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 1, 'produces one gap entry for matching query at position 25');
  assertEqual(result[0].gapSeverity, 'high', 'position=25 yields gapSeverity=high');
  assertEqual(result[0].query, 'best tall chair', 'gap query matches competitorKeyword query');
  assertEqual(result[0].tcaPage, '/review/gesture/', 'gap tcaPage matches GSC row page');
  assertEqual(result[0].competitorDomain, 'example.com', 'gap competitorDomain matches intel entry');
  assertEqual(result[0].competitorPosition, 2, 'gap competitorPosition matches intel entry');
  assertEqual(result[0].impressions, 50, 'gap impressions matches GSC row impressions');
}

console.log('\n=== detectContentGaps — medium severity (position 15-19) ===');
{
  const intelPath = resolve(TMP, 'intel-med.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'ergonomic chair tall', competitorDomain: 'rival.com', competitorPosition: 1 }
    ]
  }));
  const rows = [pqRow('ergonomic chair tall', '/best/', 15, 30)];
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 1, 'produces one gap entry for matching query at position 15');
  assertEqual(result[0].gapSeverity, 'medium', 'position=15 yields gapSeverity=medium');
}

console.log('\n=== detectContentGaps — low severity (position 10-14) ===');
{
  const intelPath = resolve(TMP, 'intel-low.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'chair for 6 foot person', competitorDomain: 'rival2.com', competitorPosition: 3 }
    ]
  }));
  const rows = [pqRow('chair for 6 foot person', '/chairs/', 12, 20)];
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 1, 'produces one gap entry for matching query at position 12');
  assertEqual(result[0].gapSeverity, 'low', 'position=12 yields gapSeverity=low');
}

console.log('\n=== detectContentGaps — excluded: impressions < 10 ===');
{
  const intelPath = resolve(TMP, 'intel-exc-impr.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'noisy query', competitorDomain: 'rival.com', competitorPosition: 1 }
    ]
  }));
  const rows = [pqRow('noisy query', '/page/', 25, 8)]; // impressions < 10
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 0, 'excludes GSC rows with impressions < 10');
}

console.log('\n=== detectContentGaps — excluded: position < 10 ===');
{
  const intelPath = resolve(TMP, 'intel-exc-pos-low.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'top-ranked query', competitorDomain: 'rival.com', competitorPosition: 1 }
    ]
  }));
  const rows = [pqRow('top-ranked query', '/page/', 7, 50)]; // already ranks well
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 0, 'excludes GSC rows with position < 10 (TCA already ranks well)');
}

console.log('\n=== detectContentGaps — excluded: position > 50 ===');
{
  const intelPath = resolve(TMP, 'intel-exc-pos-high.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'buried query', competitorDomain: 'rival.com', competitorPosition: 1 }
    ]
  }));
  const rows = [pqRow('buried query', '/page/', 55, 50)]; // too buried
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 0, 'excludes GSC rows with position > 50');
}

console.log('\n=== detectContentGaps — case-insensitive query matching ===');
{
  const intelPath = resolve(TMP, 'intel-case.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'Best Tall Chair', competitorDomain: 'rival.com', competitorPosition: 2 }
    ]
  }));
  const rows = [pqRow('best tall chair', '/review/', 20, 40)]; // lowercase in GSC
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 1, 'matches query case-insensitively (competitor uppercase vs GSC lowercase)');
}

console.log('\n=== detectContentGaps — sorted descending by impressions ===');
{
  const intelPath = resolve(TMP, 'intel-sort.json');
  writeFileSync(intelPath, JSON.stringify({
    competitorKeywords: [
      { query: 'query a', competitorDomain: 'rival.com', competitorPosition: 1 },
      { query: 'query b', competitorDomain: 'rival.com', competitorPosition: 1 },
    ]
  }));
  const rows = [
    pqRow('query a', '/page-a/', 20, 30),
    pqRow('query b', '/page-b/', 25, 80),
  ];
  const result = detectContentGaps(rows, intelPath);
  assertEqual(result.length, 2, 'returns both gap entries');
  assert(result[0].impressions >= result[1].impressions, 'sorted descending by impressions (query b first)');
  assertEqual(result[0].query, 'query b', 'highest impression gap is first');
}

// Cleanup temp files
rmSync(TMP, { recursive: true, force: true });

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n[RED] Tests failing (expected — implementation not yet written)');
  process.exit(1);
} else {
  console.log('\n[GREEN] All tests pass');
  process.exit(0);
}
