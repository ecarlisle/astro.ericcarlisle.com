/**
 * Verifies that the production Astro site has no Storybook assets.
 *
 * Scans all JS and CSS files under dist/ (excluding dist/design-system/lab/)
 * and fails if any reference is found to:
 *   - /design-system/lab/ paths
 *   - storybook, sb-manager, sb-preview identifiers
 *   - @storybook package references
 *
 * HTML files are deliberately excluded — they may legitimately contain
 * the word "Storybook" in prose or link to /design-system/lab/ as content.
 * The risk is JS/CSS files accidentally importing Storybook runtime code.
 *
 * Usage: node scripts/verify-storybook-isolation.mjs
 * Exit code: 0 = clean, 1 = contamination detected
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const LAB = join(DIST, 'design-system', 'lab');

const STORYBOOK_PATTERNS = [
  /\/design-system\/lab\//,
  /\bstorybook\b/i,
  /\bsb-manager\b/,
  /\bsb-preview\b/,
  /\bsb-addons\b/,
  /@storybook\//,
];

function walk(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full === LAB) continue;
        results.push(...walk(full));
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
        results.push(full);
      }
    }
  } catch {
    // Skip if dir doesn't exist
  }
  return results;
}

const files = walk(DIST);
let contaminationCount = 0;
const matches = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  for (const pattern of STORYBOOK_PATTERNS) {
    if (pattern.test(content)) {
      const rel = relative(DIST, file);
      const match = content.match(pattern)[0];
      matches.push({ file: rel, pattern: pattern.toString(), match });
      contaminationCount++;
      break;
    }
  }
}

if (contaminationCount > 0) {
  console.log(`❌ Found ${contaminationCount} Storybook reference(s) in production JS/CSS:\n`);
  for (const m of matches) {
    console.log(`  ${m.file}`);
    console.log(`    pattern: ${m.pattern}`);
    console.log(`    match:   "${m.match}"\n`);
  }
  process.exit(1);
} else {
  console.log(`✅ No Storybook references in production JS/CSS (${files.length} files scanned)`);
  process.exit(0);
}
