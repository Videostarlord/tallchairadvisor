/**
 * lint-content.mjs — CI content quality gate
 * Fails with exit code 1 if any draft placeholders or voice violations
 * are found in src/pages/**\/*.astro files.
 *
 * Run: node scripts/lint-content.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PAGES_DIR = join(ROOT, 'src', 'pages');

// Amazon ASIN allowlist. Any /dp/<ASIN> link in a page must appear in
// data/verified-asins.json, which only ever gains entries a human has
// loaded in a browser. LLM agents invent plausible 10-char ASINs; three
// separate incidents shipped dead affiliate links to live money pages
// before this gate existed. Deliberately offline — Amazon bot-blocks CI.
const ASIN_REGISTRY_PATH = join(ROOT, 'data', 'verified-asins.json');
const ASIN_LINK_PATTERN = /\/dp\/([A-Z0-9]{10})/g;

let VERIFIED_ASINS = new Set();
let KNOWN_DEAD = {};
try {
  const registry = JSON.parse(readFileSync(ASIN_REGISTRY_PATH, 'utf-8'));
  VERIFIED_ASINS = new Set(Object.keys(registry.asins || {}));
  KNOWN_DEAD = registry.known_dead || {};
} catch (err) {
  console.error(`\n❌ Cannot read ASIN registry at data/verified-asins.json — ${err.message}`);
  console.error('   This file gates every affiliate link. Restore it before shipping.\n');
  process.exit(1);
}

// Placeholder patterns that must not appear in shipped content
const PLACEHOLDER_PATTERNS = [
  { pattern: /\[IMAGE:/g,              label: '[IMAGE: placeholder]' },
  { pattern: /\[ORIGINAL DATA\]/g,     label: '[ORIGINAL DATA] placeholder' },
  { pattern: /\[PERSONAL EXPERIENCE\]/g, label: '[PERSONAL EXPERIENCE] placeholder' },
  { pattern: /\[INTERNAL-LINK:/g,      label: '[INTERNAL-LINK: placeholder]' },
];

// Voice violations on non-Gesture pages
// Matches "I've tested X", "I tested X", "I sat in X", "I tried X"
// where X is not the Gesture
const VOICE_PATTERN = /\b(I'?ve?|I have)\s+(tested|sat in|tried)\s+the\s+(?!Gesture|Steelcase Gesture)/gi;

function walkAstroFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkAstroFiles(fullPath));
    } else if (entry.endsWith('.astro')) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkFile(filePath) {
  const violations = [];
  const content = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(ROOT + '/', '');

  // Skip Gesture pages for voice checks
  const isGesturePage = relPath.includes('gesture');

  for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
    pattern.lastIndex = 0;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Skip HTML comments
      if (line.trim().startsWith('<!--')) return;
      if (pattern.test(line)) {
        violations.push(`  ${relPath}:${i + 1} — ${label}`);
      }
      pattern.lastIndex = 0;
    });
  }

  if (!isGesturePage) {
    VOICE_PATTERN.lastIndex = 0;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('<!--')) return;
      if (VOICE_PATTERN.test(line)) {
        violations.push(`  ${relPath}:${i + 1} — voice violation: "${line.trim().slice(0, 80)}"`);
      }
      VOICE_PATTERN.lastIndex = 0;
    });
  }

  // Unverified / known-dead Amazon ASINs
  content.split('\n').forEach((line, i) => {
    ASIN_LINK_PATTERN.lastIndex = 0;
    let match;
    while ((match = ASIN_LINK_PATTERN.exec(line)) !== null) {
      const asin = match[1];
      if (KNOWN_DEAD[asin]) {
        violations.push(
          `  ${relPath}:${i + 1} — DEAD ASIN ${asin}: ${KNOWN_DEAD[asin]}`
        );
      } else if (!VERIFIED_ASINS.has(asin)) {
        violations.push(
          `  ${relPath}:${i + 1} — UNVERIFIED ASIN ${asin}. Open https://www.amazon.com/dp/${asin} ` +
          `and confirm the listing loads and the title matches, then add it to data/verified-asins.json. ` +
          `Never register an ASIN you have not personally opened.`
        );
      }
    }
  });

  return violations;
}

const files = walkAstroFiles(PAGES_DIR);
const allViolations = [];

for (const file of files) {
  allViolations.push(...checkFile(file));
}

if (allViolations.length > 0) {
  console.error(`\n❌ Content lint failed — ${allViolations.length} violation(s):\n`);
  allViolations.forEach(v => console.error(v));
  console.error('\nFix these before committing.\n');
  process.exit(1);
} else {
  console.log(`✅ Content lint passed — ${files.length} pages checked, no violations.`);
}
