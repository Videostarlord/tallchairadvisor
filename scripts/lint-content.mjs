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
