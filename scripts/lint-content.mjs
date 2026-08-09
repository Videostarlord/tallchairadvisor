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

// Chair spec registry. Some published figures are TRUE but MISLEADING ALONE,
// because they require an option the buyer selects at order time. The Leap
// Plus reaches 22.5" only with the optional 5" cylinder; the default chair
// stops at 19.5". That distinction was lost on 33 pages, and the height
// landing pages told 6'5"-6'7" buyers the default chair fit them. This gate
// does not ban the number — it requires the qualifier to travel with it.
const SPEC_REGISTRY_PATH = join(ROOT, 'data', 'chair-specs.json');

let GUARDED_SPECS = [];
try {
  // A standalone .mjs build gate cannot import readValidated (TypeScript, and this
  // runs before compilation). The file is a hand-maintained registry, not pipeline
  // state, so the freshness SLA does not apply. Same as verified-asins.json above.
  // lint-architecture-allow R4 -- standalone .mjs gate; hand-maintained registry, no freshness SLA
  const registry = JSON.parse(readFileSync(SPEC_REGISTRY_PATH, 'utf-8'));
  GUARDED_SPECS = registry.guarded || [];
} catch (err) {
  console.error(`\n❌ Cannot read chair spec registry at data/chair-specs.json — ${err.message}`);
  console.error('   This file gates every spec claim on the site. Restore it before shipping.\n');
  process.exit(1);
}

// Normalize the many ways a measurement gets written in .astro source:
// escaped quotes (22.5\"), the prime character (22.5″), and en/em dashes in
// ranges. Comparing on a normalized string keeps the rule from being defeated
// by punctuation that renders identically.
function normalizeMeasurements(text) {
  return text
    .replace(/[–—−]/g, '-')   // en dash, em dash, minus → hyphen
    .replace(/[″”“]/g, '"')   // double prime, curly quotes → "
    .replace(/\\"/g, '"')                     // JSX/JSON escaped quote
    .replace(/&#34;|&quot;/g, '"')            // HTML entities
    .replace(/\s*-\s*/g, '-')                 // tighten spaced ranges
    .toLowerCase();
}

// A bare table cell — <td>22.5"</td> — states a spec with no words around it.
// The dimension it describes is a row header and the chair is a column header,
// both many lines away, so a one-line window sees nothing and waves it through.
// That blind spot hid 28 real instances of the Leap Plus error inside
// comparison tables while the prose on the same pages was already fixed.
const TABLE_WINDOW = 30;

// A range may be written 15.5"-22.5", 15.5 – 22.5, or 15.5&ndash;22.5". Matching
// a literal string missed every table that put inch marks inside the range,
// which is exactly where the fabricated figure was hiding. Build a regex from
// the two endpoints instead, tolerant of quotes, entities and spacing.
function rangeRegex(value) {
  const [lo, hi] = value.split(/[-–—]/).map(s => s.trim().replace(/"/g, ''));
  const gap = '\\s*(?:"|&#34;|&quot;|in|inches)?\\s*(?:-|&ndash;|&mdash;)\\s*';
  const esc = s => s.replace(/\./g, '\\.');
  return new RegExp(esc(lo) + gap + esc(hi));
}

// A qualifier may sit on the neighbouring line when markup wraps a sentence,
// so each line is judged against a window rather than itself alone. Table cells
// get a much wider one, in both directions, because their context is structural.
function guardedSpecViolations(content, relPath) {
  const violations = [];
  const rawLines = content.split('\n');
  const normLines = rawLines.map(normalizeMeasurements);

  rawLines.forEach((rawLine, i) => {
    if (rawLine.trim().startsWith('<!--')) return;
    const line = normLines[i];
    const window = normLines
      .slice(Math.max(0, i - TABLE_WINDOW), i + TABLE_WINDOW + 1)
      .join(' ');

    for (const spec of GUARDED_SPECS) {
      const value = normalizeMeasurements(spec.value);
      const hit = spec.banned
        ? rangeRegex(spec.value).test(line)
        : line.includes(value);
      if (!hit) continue;

      if (spec.banned) {
        violations.push(
          `  ${relPath}:${i + 1} — BANNED SPEC "${spec.value}": ${spec.message}\n` +
          `      ${rawLine.trim().slice(0, 120)}`
        );
        continue;
      }

      // Some pages state 22.5" about a different chair or a different
      // dimension entirely — the Gesture's backrest, a seat WIDTH, a required
      // range. Those are not this rule's business and must not be "corrected".
      //
      // A comparison table usually has BOTH a "seat height" row and a "back
      // height" row, so asking whether the window mentions seat height would
      // match every cell in the table. What decides a cell is the nearest row
      // label ABOVE it: walk back until the first line that names a dimension,
      // and let that line — and only it — say which row this cell belongs to.
      const dimensionOf = (start) => {
        for (let j = start; j >= Math.max(0, start - TABLE_WINDOW); j--) {
          const l = normLines[j];
          if ((spec.excludeContext || []).some(x => l.includes(normalizeMeasurements(x)))) return 'excluded';
          if ((spec.context || []).some(c => l.includes(c.toLowerCase()))) return 'context';
        }
        return null;
      };

      // Resolved the same way for prose and for table cells. A prose line
      // naming the dimension resolves on its own first iteration; a bare cell
      // walks back to its row label. One rule, no dependence on markup shape —
      // the previous shape-sniffing version passed 26 real instances because
      // their markup did not match the cell pattern it expected.
      if (dimensionOf(i) !== 'context') continue;
      if (spec.requires && !spec.requires.some(r => window.includes(normalizeMeasurements(r)))) continue;

      const qualified = (spec.qualifiers || []).some(q =>
        window.includes(normalizeMeasurements(q))
      );
      if (!qualified) {
        violations.push(
          `  ${relPath}:${i + 1} — UNQUALIFIED SPEC "${spec.value}": ${spec.message}\n` +
          `      ${rawLine.trim().slice(0, 120)}`
        );
      }
    }
  });

  return violations;
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

  violations.push(...guardedSpecViolations(content, relPath));

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
