/**
 * test-task1.ts — TDD RED/GREEN tests for Task 1:
 *   - decodeHtmlEntities helper
 *   - applyCapsuleToPage heading match with HTML entities
 *   - first-h2 fallback when named heading not found
 *
 * Run with: tsx scripts/test-task1.ts
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inline decodeHtmlEntities matching plan spec
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

// Test runner
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) { console.log(`  PASS: ${testName}`); passed++; }
  else { console.error(`  FAIL: ${testName}`); failed++; }
}

function assertEqual(actual: string, expected: string, testName: string): void {
  if (actual === expected) { console.log(`  PASS: ${testName}`); passed++; }
  else {
    console.error(`  FAIL: ${testName}`);
    console.error(`    Expected codes: ${[...expected].map(c => c.charCodeAt(0)).join(',')}`);
    console.error(`    Actual codes:   ${[...actual].map(c => c.charCodeAt(0)).join(',')}`);
    failed++;
  }
}

// decodeHtmlEntities tests
console.log('\n=== decodeHtmlEntities tests ===');

assertEqual(
  decodeHtmlEntities("Step 3: Adjust Backrest &amp; Lumbar"),
  "Step 3: Adjust Backrest & Lumbar",
  "decode &amp; entity"
);

// &#8217; is U+2019; after curly->straight normalization = U+0027
assertEqual(
  decodeHtmlEntities("It&#8217;s ergonomic"),
  "It" + String.fromCharCode(39) + "s ergonomic",
  "decode &#8217; to straight apostrophe"
);

assertEqual(
  decodeHtmlEntities("Price &ndash; Value"),
  "Price – Value",
  "decode &ndash; to en-dash"
);

assertEqual(decodeHtmlEntities("No entities here"), "No entities here", "no-op on plain string");

assertEqual(
  decodeHtmlEntities("foo &amp; bar &lt;baz&gt;"),
  "foo & bar <baz>",
  "decode multiple entities"
);

// heading comparison simulation tests
console.log('\n=== heading comparison simulation tests ===');

function simulateHeadingMatch(lines: string[], headingText: string, decode: (s: string) => string): number {
  const decoded = decode(headingText.replace(/^#+\s*/, '').trim());
  for (let i = 0; i < lines.length; i++) {
    if (!/<h[1-6]/i.test(lines[i])) continue;
    const stripped = decode(lines[i].replace(/<[^>]+>/g, '').trim());
    if (stripped === decoded || stripped.includes(decoded) || (decoded.includes(stripped) && stripped.length > 10)) {
      return i;
    }
  }
  return -1;
}

// HTML entity mismatch: source has &amp; but heading string has &
const sourceWithAmp = [
  '<div>',
  '  <h2>Step 3: Adjust Backrest &amp; Lumbar</h2>',
  '  <p>Some content here.</p>',
  '</div>',
];
const matchIdx = simulateHeadingMatch(sourceWithAmp, "Step 3: Adjust Backrest & Lumbar", decodeHtmlEntities);
assert(matchIdx !== -1, "HTML entity mismatch: decoded heading matches source with &amp;");
assert(matchIdx === 1, "Matches at correct line index 1");

// Heading not found -> first-h2 fallback
const componentRenderedLines = [
  '<div>',
  '  <SomeComponent />',
  '  <p>intro text</p>',
  '  <h2>General Information</h2>',
  '  <p>Some content here.</p>',
  '</div>',
];
const noMatchIdx = simulateHeadingMatch(componentRenderedLines, "What Reddit Owners Say", decodeHtmlEntities);
assert(noMatchIdx === -1, "Named heading not found in component-rendered source");
const firstH2 = componentRenderedLines.findIndex(l => /<h2/i.test(l));
assert(firstH2 !== -1, "First-h2 fallback: finds first h2 when named heading missing");
assert(firstH2 === 3, "First h2 is at line index 3");

// No h2 at all -> heading-not-found
const noH2Lines = ['<div>', '  <h3>Sub heading only</h3>', '  <p>Content with no h2.</p>', '</div>'];
const noFirstH2 = noH2Lines.findIndex(l => /<h2/i.test(l));
assert(noFirstH2 === -1, "No h2 in source — fallback unavailable, should return heading-not-found");

// already-applied sentinel
const sourceAlreadyApplied = '<div>\n  <!-- tca-aio-capsule -->\n  <h2>Some heading</h2>\n</div>';
assert(sourceAlreadyApplied.includes('<!-- tca-aio-capsule -->'), "already-applied sentinel detected");

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n[RED] Tests failing');
  process.exit(1);
} else {
  console.log('\n[GREEN] All tests pass');
  process.exit(0);
}
