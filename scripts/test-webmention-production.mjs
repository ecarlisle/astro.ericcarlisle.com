#!/usr/bin/env node
/**
 * Webmention production integration test.
 *
 * End-to-end test that sends a Webmention and confirms receipt via the
 * Webmention.io JF2 API. Requires a publicly fetchable source page.
 *
 * OPT-IN SCRIPT — NOT part of CI.
 *
 * Usage:
 *   --source=URL   Public page that links to the target article (required)
 *   --target=URL   Canonical target URL (defaults to primary article)
 *   --send         Submit a real Webmention POST
 *   --check        Only check whether a matching mention already exists (no POST)
 *   --help         Print this help
 *
 * Examples:
 *   node scripts/test-webmention-production.mjs --source=URL --check
 *   node scripts/test-webmention-production.mjs --source=URL --send
 *   SOURCE_URL=URL node scripts/test-webmention-production.mjs --send
 */

const ENDPOINT = 'https://webmention.io/ericcarlisle.com/webmention';
const DEFAULT_TARGET = 'https://ericcarlisle.com/blog/250mm-trading-card-box/';

function help() {
  console.log(`Webmention Production Integration Test
${'='.repeat(50)}
Tests end-to-end Webmention delivery: POST to Webmention.io, then poll the
JF2 API to confirm receipt.

Requires a PUBLIC source page that links to the target.
The target must match the canonical article URL exactly (trailing slash).

Steps after a successful send:
  1. Confirm receipt in Webmention.io via --check or polling
  2. Rebuild the Astro site with WEBMENTION_IO_TOKEN set
  3. Inspect the built article for the rendered mention
  4. Deploy the new build (requires explicit approval)

Options:
  --source=URL   Public page that contains a link to the target (required)
  --target=URL   Canonical article URL (default: ${DEFAULT_TARGET})
  --send         Submit a real Webmention POST
  --check        Only check for an existing matching mention (no POST)
  --help         Print this message

Without --send or --check, validates URLs and the source page only.

Examples:
  Validate the source links to the target (no external POST):
    node scripts/test-webmention-production.mjs --source=https://example.com/page

  Check if a previous test mention was received:
    node scripts/test-webmention-production.mjs --source=https://example.com/page --check

  Submit a real Webmention:
    node scripts/test-webmention-production.mjs --source=https://example.com/page --send

Withdrawal:
  1. Remove the link from the source page (or delete the page)
  2. Re-send: node scripts/test-webmention-production.mjs --source=SOURCE --send
  3. Webmention.io re-fetches and sees the link is gone
  4. Rebuild and deploy to remove it from the site`);
}

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (arg === '--send') {
      args.send = true;
      continue;
    }
    if (arg === '--check') {
      args.check = true;
      continue;
    }
    if (arg === '--fixture') {
      args.fixture = true;
      continue;
    }
    const m = arg.match(/^--([^=]+)=(.*)/);
    if (m) args[m[1]] = m[2];
  }
  // Allow SOURCE_URL env var as fallback
  if (!args.source && process.env.SOURCE_URL) args.source = process.env.SOURCE_URL;
  return args;
}

function validateUrl(label, value, requireHttps = true) {
  if (!value) return `${label} is missing.`;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return `${label} "${value}" is not a valid URL.`;
  }
  if (requireHttps && parsed.protocol !== 'https:' && parsed.protocol !== 'http:')
    return `${label} must use HTTPS or HTTP.`;
  return null;
}

/**
 * Fetch a URL and check if its HTML contains a link resolving to the target.
 * Returns { ok, reason }.
 */
async function checkSourceLinks(sourceUrl, targetUrl) {
  let res;
  try {
    res = await fetch(sourceUrl, { redirect: 'follow' });
  } catch (err) {
    return { ok: false, reason: `Could not fetch source: ${err.message}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `Source returned HTTP ${res.status}` };
  }
  const html = await res.text();
  // Check for both the target URL as-is and URL-encoded variants
  const targetStr = targetUrl.toString();
  // Check for the URL in href attributes, text content, etc.
  if (html.includes(targetStr)) {
    return { ok: true, reason: null };
  }
  // Also check without protocol for protocol-relative links or encoded forms
  const withoutProtocol = targetStr.replace(/^https?:\/\//, '');
  if (html.includes(withoutProtocol)) {
    return { ok: true, reason: null };
  }
  return { ok: false, reason: `Source HTML does not contain a link to "${targetStr}".` };
}

/** Fetch the JF2 feed and find a matching mention. */
async function checkFeed(targetUrl, sourceUrl) {
  const feedUrl = `https://webmention.io/api/mentions.jf2?target=${encodeURIComponent(targetUrl)}&per-page=50`;
  let res;
  try {
    res = await fetch(feedUrl);
  } catch (err) {
    return { found: false, reason: `Feed fetch failed: ${err.message}`, mention: null };
  }
  if (!res.ok) {
    return { found: false, reason: `Feed returned HTTP ${res.status}`, mention: null };
  }
  let body;
  try {
    body = await res.json();
  } catch {
    return { found: false, reason: 'Feed returned non-JSON response.', mention: null };
  }
  const children = body?.children || [];
  const match = children.find((m) => m['wm-source'] === sourceUrl);
  if (match) return { found: true, reason: null, mention: match };
  return {
    found: false,
    reason: `No mention with source "${sourceUrl}" in ${children.length} entries.`,
    mention: null,
  };
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    help();
    return;
  }

  const source = args.source || '';
  const target = args.target || DEFAULT_TARGET;
  const send = !!args.send;
  const check = !!args.check;

  const mode = send ? 'SEND' : check ? 'CHECK' : 'VALIDATE';
  console.log(`Webmention Production Integration Test
${'='.repeat(50)}
Mode:     ${mode}
Endpoint: ${ENDPOINT}
Source:   ${source || '(none)'}
Target:   ${target}
`);

  // Validate URLs
  const sourceErr = validateUrl('Source', source);
  const targetErr = target ? validateUrl('Target', target) : null;
  if (sourceErr) {
    console.log(`  ✗ ${sourceErr}\n`);
    help();
    process.exit(1);
  }
  if (targetErr) {
    console.log(`  ✗ ${targetErr}\n`);
    process.exit(1);
  }

  // Verify source links to target
  console.log('Checking source page for target link...');
  const linkCheck = await checkSourceLinks(source, target);
  if (!linkCheck.ok) {
    console.log(`  ✗ ${linkCheck.reason}`);
    console.log('\nThe source page must contain a link to the target URL.');
    console.log('Publish a test page first, then re-run this script.\n');
    printTemplate(target);
    process.exit(1);
  }
  console.log('  ✓ Source contains a link to the target.\n');

  // --check mode: only check feed
  if (check) {
    console.log('Checking Webmention.io for an existing mention...');
    const feed = await checkFeed(target, source);
    if (feed.found) {
      console.log('  ✓ Matching mention found!');
      console.log(`  ID:       ${feed.mention['wm-id']}`);
      console.log(`  Property: ${feed.mention['wm-property']}`);
      console.log(`  Source:   ${feed.mention['wm-source']}`);
      console.log(`  Target:   ${feed.mention['wm-target']}`);
    } else {
      console.log(`  - ${feed.reason}`);
    }
    return;
  }

  // Without --send, explain what would happen
  if (!send && !args.check) {
    console.log('Dry-run mode. Pass --send to submit a real Webmention.');
    console.log('  curl -X POST -d "source=SOURCE" -d "target=TARGET" ENDPOINT\n');
    return;
  }

  // --send mode: POST and poll
  console.log('Sending Webmention...');
  let submitStatus, submitLocation;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ source, target }),
      redirect: 'manual',
    });
    submitStatus = res.status;
    submitLocation = res.headers.get('location');
    console.log(`  HTTP ${submitStatus} ${res.statusText}`);
    if (submitLocation) console.log(`  Location: ${submitLocation}`);
    if (submitStatus === 201 || submitStatus === 200 || submitStatus === 202) {
      console.log('  ✓ Accepted.\n');
    } else {
      console.log(`  ⚠️  Unexpected status. Continuing to poll anyway...\n`);
    }
  } catch (err) {
    console.log(`  ✗ Network error: ${err.message}`);
    process.exit(1);
  }

  // Poll for receipt
  console.log('Polling Webmention.io for the mention...');
  const POLL_ATTEMPTS = 6;
  const POLL_DELAY_MS = 10000;
  const TIMEOUT_MS = 65000;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
    const elapsed = Date.now() - startTime;
    if (elapsed > TIMEOUT_MS) {
      console.log('  ✗ Timed out waiting for mention.');
      process.exit(1);
    }

    console.log(`  Attempt ${attempt}/${POLL_ATTEMPTS}...`);
    const feed = await checkFeed(target, source);
    if (feed.found) {
      console.log(`  ✓ Mention received!`);
      console.log(`  ID:       ${feed.mention['wm-id']}`);
      console.log(`  Property: ${feed.mention['wm-property']}`);
      console.log(`  Source:   ${feed.mention['wm-source']}`);
      console.log(`  Target:   ${feed.mention['wm-target']}`);
      console.log(`\nNext steps:
  1. Rebuild the site with WEBMENTION_IO_TOKEN set:
       WEBMENTION_IO_TOKEN=your-token pnpm build
  2. Check the built article for the mention
  3. Deploy (requires approval)\n`);
      return;
    }
    console.log(`  - ${feed.reason}`);

    if (attempt < POLL_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    }
  }

  console.log(`  ✗ Mention not found after ${POLL_ATTEMPTS} attempts.`);
  process.exit(1);
}

function printTemplate(target) {
  console.log('--- Test source HTML template ---');
  console.log(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex" />
  <title>Webmention Integration Test</title>
</head>
<body>
  <h1>Webmention Integration Test</h1>
  <p>This page is a controlled test source for
    <a href="${target}">Webmention integration test</a>.
  </p>
  <div class="h-entry">
    <p class="p-name">Webmention integration test</p>
    <p class="p-content">Testing Webmention delivery for ericcarlisle.com.</p>
    <a class="u-in-reply-to" href="${target}">Target article</a>
  </div>
  <hr />
  <p>After testing, remove this page or remove the link to the target.</p>
</body>
</html>`);
  console.log('---');
  console.log('\nTo withdraw: remove the link from the source and resend.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
