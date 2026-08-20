#!/usr/bin/env node
/**
 * Production check: Cloudflare Rocket Loader must not rewrite Astro modules.
 *
 * Rocket Loader is a Cloudflare zone setting (Dashboard → Speed → Settings →
 * Content Optimization). When enabled, it rewrites Astro's generated
 * `<script type="module">` tags (including the Expressive Code runtime under
 * `/_astro/`) into tokenized `<script type="<hex>-module">` scripts and injects
 * `rocket-loader.min.js` with a `data-cf-settings` attribute. Astro already
 * controls module loading and dependency ordering; when Cloudflare rewrites or
 * delays module execution the browser may not reuse a module preload because
 * the eventual request has different fetch semantics — Chrome reports this as
 * "preloaded resource was not used because the eventual request uses a
 * different credentials mode."
 *
 * This script fetches a live production page and fails only when genuine
 * Rocket Loader markers are found on real <script> elements. Prose, escaped
 * markup, or code examples that merely mention `rocket-loader.min.js` or
 * `data-cf-settings` never fail the check. Zaraz (`/cdn-cgi/zaraz/`) and
 * blocked analytics requests (e.g. a browser privacy blocker) are never
 * treated as failures.
 *
 * OPT-IN SCRIPT — NOT part of CI. The repository has no post-deployment
 * verification workflow; run this manually after a Cloudflare dashboard change
 * or cache purge.
 *
 * Exit codes:
 *   0  PASS — no Rocket Loader markers on any script element.
 *   1  FAIL — Rocket Loader markers detected (configuration regression).
 *   2  USAGE — invalid invocation (bad option, empty value, multiple URLs,
 *              or a non-http(s) target).
 *   3  NETWORK — could not verify: fetch failure or non-2xx response.
 *
 * Supported invocations:
 *   node scripts/verify-no-rocket-loader.mjs
 *   node scripts/verify-no-rocket-loader.mjs https://example.com/page/
 *   node scripts/verify-no-rocket-loader.mjs --url https://example.com/page/
 *   node scripts/verify-no-rocket-loader.mjs --url=https://example.com/page/
 *
 * Examples:
 *   pnpm verify:no-rocket-loader
 *   pnpm verify:no-rocket-loader https://ericcarlisle.com/blog/better-agent-results-start-with-better-context/
 */

import { pathToFileURL } from 'node:url';

export const DEFAULT_URL = 'https://ericcarlisle.com/';
export const FETCH_TIMEOUT_MS = 20000;

export const EXIT = {
  CLEAN: 0,
  REGRESSION: 1,
  USAGE: 2,
  NETWORK: 3,
};

// Rocket Loader markers. The Cloudflare token is a variable-length lowercase
// hex string (observed 24-32 chars), so the module-type check must not assume
// a fixed length.
const REWRITTEN_MODULE_TYPE = /^[a-f0-9]{24,32}-module$/i;
const REWRITTEN_CLASSIC_TYPE = /^[a-f0-9]{24,32}-text\/javascript$/i;

// ─── HTML script-element scanning ─────────────────────────────────────────

/** Strip HTML comments so commented-out script tags are never treated as real elements. */
export function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Parse a single `<script ...>` open tag into an attribute map.
 * Attribute names are lowercased; single-, double-quoted, and unquoted values
 * are supported. Quoted '>' characters inside a value do not terminate a tag.
 *
 * @param {string} tag The raw script open tag, e.g. `<script type="module">`.
 * @returns {Record<string, string>} Lowercased attribute name → value map.
 */
export function parseScriptTagAttributes(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const m of tag.matchAll(re)) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

/**
 * Extract every real `<script ...>` open tag from HTML, skipping comments.
 * Returns the raw open-tag strings, including the closing '>'.
 */
export function extractScriptTags(html) {
  const source = stripHtmlComments(html);
  const tags = [];
  for (const m of source.matchAll(/<script\b/gi)) {
    let i = m.index + m[0].length;
    let quote = null;
    while (i < source.length) {
      const ch = source[i];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        break;
      }
      i++;
    }
    tags.push(source.slice(m.index, Math.min(i + 1, source.length)));
  }
  return tags;
}

/**
 * Detect genuine Cloudflare Rocket Loader markers on real <script> elements.
 * Prose, escaped markup, or code examples that merely mention marker strings
 * never match. Returns a list of { id, tag } findings.
 */
export function findRocketLoaderMarkers(html) {
  const findings = [];
  for (const tag of extractScriptTags(html)) {
    const attrs = parseScriptTagAttributes(tag);
    const src = (attrs.src || '').trim();
    const type = (attrs.type || '').trim();
    if (src.includes('rocket-loader.min.js')) {
      findings.push({ id: 'rocket-loader-script', tag });
    }
    if ('data-cf-settings' in attrs) {
      findings.push({ id: 'data-cf-settings', tag });
    }
    if (REWRITTEN_MODULE_TYPE.test(type)) {
      findings.push({ id: 'rewritten-module-type', tag });
    }
    if (REWRITTEN_CLASSIC_TYPE.test(type)) {
      findings.push({ id: 'rewritten-classic-type', tag });
    }
  }
  return findings;
}

/** Collect rewritten /_astro/ module srcs for the failure report. */
function rewrittenAstroModules(html) {
  const srcs = new Set();
  for (const tag of extractScriptTags(html)) {
    const attrs = parseScriptTagAttributes(tag);
    if (REWRITTEN_MODULE_TYPE.test((attrs.type || '').trim()) && attrs.src) {
      srcs.add(attrs.src);
    }
  }
  return [...srcs].slice(0, 5);
}

// ─── CLI parsing ──────────────────────────────────────────────────────────

/**
 * Parse process argv (excluding node + script path) into a URL choice.
 *
 * Supported forms:
 *   []                              → DEFAULT_URL
 *   [url]                           → url
 *   ['--url', url]                  → url
 *   ['--url=' + url]                → url
 *
 * Returns { url } on success, or { error, usageHint } for invalid invocations.
 */
export function parseArgs(argv) {
  const positionals = [];
  let url = null;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if (arg === '--url') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        return { error: '--url requires a value.' };
      }
      if (url !== null) {
        return { error: 'Multiple URL arguments were given.' };
      }
      url = value;
      i++;
      continue;
    }
    if (arg.startsWith('--url=')) {
      const value = arg.slice('--url='.length);
      if (value === '') {
        return { error: '--url requires a non-empty value.' };
      }
      if (url !== null) {
        return { error: 'Multiple URL arguments were given.' };
      }
      url = value;
      continue;
    }
    if (arg.startsWith('-')) {
      return { error: `Unknown option: ${arg}` };
    }
    positionals.push(arg);
  }
  if (positionals.length > 1) {
    return { error: 'Multiple URL arguments were given.' };
  }
  if (positionals.length === 1 && url !== null) {
    return { error: 'Multiple URL arguments were given.' };
  }
  if (positionals.length === 1) url = positionals[0];
  return { url: url ?? DEFAULT_URL, help };
}

/** Validate that the target is an HTTP(S) URL. Returns null or an error string. */
export function validateTarget(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return `"${url}" is not a valid URL.`;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return `"${url}" must use http or https.`;
  }
  return null;
}

// ─── CLI output ───────────────────────────────────────────────────────────

function helpText() {
  return `Rocket Loader Production Check
${'='.repeat(50)}
Fetches a live ericcarlisle.com page and fails if Cloudflare Rocket Loader
markers are present on real <script> elements (rocket-loader.min.js src,
data-cf-settings, or rewritten script types such as <hex>-module). Rocket
Loader rewrites or delays Astro's module scripts and can prevent the browser
from reusing a module preload; it must remain disabled.

Zaraz (/cdn-cgi/zaraz/) and privacy-blocked analytics are NOT failures.

Usage:
  node scripts/verify-no-rocket-loader.mjs
  node scripts/verify-no-rocket-loader.mjs https://example.com/page/
  node scripts/verify-no-rocket-loader.mjs --url https://example.com/page/
  node scripts/verify-no-rocket-loader.mjs --url=https://example.com/page/

Exit codes:
  0  PASS — no Rocket Loader markers on any script element.
  1  FAIL — Rocket Loader markers detected (configuration regression).
  2  USAGE — invalid invocation (unknown option, empty --url, multiple URLs,
             or a non-http(s) target).
  3  NETWORK — could not verify: fetch failure or non-2xx response.

Examples:
  pnpm verify:no-rocket-loader
  pnpm verify:no-rocket-loader https://ericcarlisle.com/blog/better-agent-results-start-with-better-context/
`;
}

function printUsageError(message) {
  console.error(`  ✗ ${message}`);
  console.error(`
  Usage: node scripts/verify-no-rocket-loader.mjs [--url=]<URL>`);
  console.error(`  See --help for supported forms and exit codes.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(helpText());
    return;
  }
  if (parsed.error) {
    printUsageError(parsed.error);
    process.exit(EXIT.USAGE);
  }

  const targetError = validateTarget(parsed.url);
  if (targetError) {
    printUsageError(targetError);
    process.exit(EXIT.USAGE);
  }

  const target = new URL(parsed.url);
  console.log(`Rocket Loader Production Check
${'='.repeat(50)}
URL:    ${target.href}
`);

  let res;
  try {
    res = await fetch(target, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const reason =
      err?.name === 'TimeoutError'
        ? `timed out after ${FETCH_TIMEOUT_MS} ms`
        : err?.message || String(err);
    console.log(`  ✗ Could not verify: network failure (${reason}).`);
    console.log(`  This is a delivery/network issue, not a Rocket Loader regression.`);
    console.log(`  Retry, or check DNS/availability for ${target.origin}.`);
    process.exit(EXIT.NETWORK);
  }

  if (!res.ok) {
    console.log(`  ✗ Could not verify: HTTP ${res.status} from ${target.href}.`);
    console.log(`  This is a delivery issue, not a Rocket Loader regression.`);
    process.exit(EXIT.NETWORK);
  }

  const html = await res.text();
  console.log(`Status: HTTP ${res.status} (${html.length.toLocaleString('en-US')} bytes)`);

  const findings = findRocketLoaderMarkers(html);
  if (findings.length === 0) {
    console.log(`  ✓ No Rocket Loader markers found. Astro module scripts are untouched.`);
    process.exit(EXIT.CLEAN);
  }

  const byId = new Map();
  for (const finding of findings) {
    const entry = byId.get(finding.id) ?? { id: finding.id, count: 0, example: null };
    entry.count++;
    if (!entry.example) entry.example = finding.tag.slice(0, 140);
    byId.set(finding.id, entry);
  }
  console.log(`  ✗ Rocket Loader markers detected (${byId.size} marker type(s)): `);
  for (const entry of byId.values()) {
    console.log(`    - ${entry.id}: ${entry.count} occurrence(s)`);
    if (entry.example) console.log(`      e.g. ${entry.example}`);
  }
  const astroModules = rewrittenAstroModules(html);
  if (astroModules.length > 0) {
    console.log(`    Rewritten /_astro/ module scripts: ${astroModules.join(', ')}`);
  }
  console.log(`
  Cloudflare Rocket Loader is rewriting Astro's generated module scripts, which
  can prevent the browser from reusing a module preload. Disable it in the
  Cloudflare Dashboard: Speed → Settings → Content Optimization → Rocket Loader
  = Off, for the ericcarlisle.com zone (covers www via redirect), then purge
  the cache and re-run this check.`);
  process.exit(EXIT.REGRESSION);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((err) => {
    console.error(`  ✗ Unexpected failure: ${err?.message || err}`);
    process.exit(EXIT.NETWORK);
  });
}
