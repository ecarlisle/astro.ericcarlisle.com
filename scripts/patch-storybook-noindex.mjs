#!/usr/bin/env node
/**
 * Patch the built Storybook application for the KISS Design System.
 *
 * Two static patches are applied to the Storybook build so it is treated as
 * the site's development lab and branded consistently:
 *
 *   1. Inject robots="noindex, follow" into the two static documents crawlers
 *      load — index.html (manager) and iframe.html (preview). Storybook is a
 *      development lab, not an SEO surface, and GitHub Pages cannot serve
 *      HTTP redirects, so noindex is the only reliable way to keep it out of
 *      search results.
 *   2. Set the manager browser title to "KISS Design System — Storybook" so
 *      the lab identifies the design system it documents (Storybook itself is
 *      not renamed).
 *
 * Both patches are idempotent: existing values are left alone.
 *
 * Usage: node scripts/patch-storybook-noindex.mjs [storybook-static-dir]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DEFAULT_SOURCE = join(ROOT, 'storybook-static');
const arg = process.argv[2];
const SOURCE = arg ? (isAbsolute(arg) ? arg : join(process.cwd(), arg)) : DEFAULT_SOURCE;

const META = '<meta name="robots" content="noindex, follow" />';
const MANAGER_TITLE = 'KISS Design System — Storybook';
const TARGETS = ['index.html', 'iframe.html'];

/** Inject the noindex meta right after <head>, or leave an existing tag alone. */
export function patchNoindex(html) {
  if (/<meta name="robots"[^>]*>/i.test(html)) return html;
  return html.replace('<head>', `<head>\n    ${META}`);
}

/** Replace the document <title> with the KISS Design System manager title. */
export function patchManagerTitle(html) {
  const match = html.match(/<title>[\s\S]*?<\/title>/i);
  if (!match) return html;
  return html.replace(match[0], `<title>${MANAGER_TITLE}</title>`);
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`✗ Storybook build not found at ${SOURCE}. Run pnpm build:storybook first.`);
    process.exit(1);
  }

  let changed = 0;
  for (const file of TARGETS) {
    const path = join(SOURCE, file);
    if (!existsSync(path)) {
      console.warn(`  (skip) ${file} not present in ${SOURCE}`);
      continue;
    }
    let html = readFileSync(path, 'utf-8');
    const before = html;
    const patched = patchNoindex(html);
    if (patched !== html) {
      html = patched;
      console.log(`  ✓ noindex added to ${file}`);
    } else {
      console.log(`  = ${file} already carries robots noindex`);
    }
    if (file === 'index.html') {
      const titled = patchManagerTitle(html);
      if (titled !== html) {
        html = titled;
        console.log(`  ✓ manager title set to "${MANAGER_TITLE}"`);
      }
    }
    if (html !== before) {
      writeFileSync(path, html);
      changed++;
    }
  }

  if (changed === 0 && !TARGETS.every((f) => existsSync(join(SOURCE, f)))) {
    process.exit(1);
  }
  console.log(`✓ Storybook patch complete (${changed} file(s) updated).`);
}

main();
