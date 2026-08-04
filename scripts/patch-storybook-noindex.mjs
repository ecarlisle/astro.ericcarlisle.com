#!/usr/bin/env node
/**
 * Inject robots="noindex, follow" into the built Storybook application.
 *
 * Storybook is a development lab, not an SEO surface, and GitHub Pages
 * cannot serve HTTP redirects, so noindex is the only way to keep it out of
 * search results. The patch targets the two static documents crawlers load:
 *
 *   - index.html   (Storybook manager)
 *   - iframe.html  (the actual preview document)
 *
 * The script is idempotent: if the tag is already present it is left alone.
 *
 * Usage: node scripts/patch-storybook-noindex.mjs [storybook-static-dir]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DEFAULT_SOURCE = join(ROOT, 'storybook-static');
const SOURCE = process.argv[2] ? join(process.cwd(), process.argv[2]) : DEFAULT_SOURCE;

const META = '<meta name="robots" content="noindex, follow" />';
const TARGETS = ['index.html', 'iframe.html'];

/** Inject the noindex meta right after <head> if it is missing. */
export function patchNoindex(html) {
  if (/<meta name="robots"[^>]*>/i.test(html)) return html;
  return html.replace('<head>', `<head>\n    ${META}`);
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`✗ Storybook build not found at ${SOURCE}. Run pnpm build:storybook first.`);
    process.exit(1);
  }

  let patched = 0;
  for (const file of TARGETS) {
    const path = join(SOURCE, file);
    if (!existsSync(path)) {
      console.warn(`  (skip) ${file} not present in ${SOURCE}`);
      continue;
    }
    const before = readFileSync(path, 'utf-8');
    const after = patchNoindex(before);
    if (after !== before) {
      writeFileSync(path, after);
      patched++;
      console.log(`  ✓ noindex added to ${file}`);
    } else {
      console.log(`  = ${file} already carries robots noindex`);
    }
  }

  if (patched === 0 && !TARGETS.every((f) => existsSync(join(SOURCE, f)))) {
    process.exit(1);
  }
  console.log(`✓ Storybook noindex patch complete (${patched} file(s) updated).`);
}

main();
