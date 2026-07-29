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
 *   --source=URL   Public page that contains a link to the target (required)
 *   --target=URL   Canonical target URL (defaults to primary article)
 *   --send         Submit a real Webmention POST
 *   --withdraw     Withdraw an existing mention (source must NOT link to target)
 *   --check        Only check whether a matching mention exists (no POST)
 *   --help         Print this help
 *
 * Examples:
 *   Validate source links to target:
 *     node scripts/test-webmention-production.mjs --source=URL
 *
 *   Check if a previous test mention was received:
 *     node scripts/test-webmention-production.mjs --source=URL --check
 *
 *   Submit a real Webmention:
 *     node scripts/test-webmention-production.mjs --source=URL --send
 *
 *   Withdraw a mention (after removing the link from the source):
 *     node scripts/test-webmention-production.mjs --source=URL --withdraw
 *
 * Withdrawal workflow:
 *   1. Remove the link from the source page (or replace the page content)
 *   2. Deploy the updated source
 *   3. Run: node scripts/test-webmention-production.mjs --source=URL --withdraw
 *   4. Script verifies the link is absent, POSTs to Webmention.io
 *   5. Polls until the mention is no longer in the JF2 feed
 */

const ENDPOINT = 'https://webmention.io/ericcarlisle.com/webmention';
const DEFAULT_TARGET = 'https://ericcarlisle.com/blog/250mm-trading-card-box/';

function help() {
  console.log(`Webmention Production Integration Test
${'='.repeat(50)}
Tests end-to-end Webmention delivery: POST to Webmention.io, then poll the
JF2 API to confirm receipt.

Requires a PUBLIC source page that (for --send) links to the target, or
(for --withdraw) does NOT link to the target.

The target must match the canonical article URL exactly (trailing slash).

Modes:
  --send          Submit a Webmention (source must link to target)
  --withdraw      Withdraw a mention (source must NOT link to target)
  --check         Only check for an existing matching mention
  (no flag)       Validate URLs and source page only

Options:
  --source=URL   Public page that links (or linked) to the target (required)
  --target=URL   Canonical article URL (default: ${DEFAULT_TARGET})
  --help         Print this message

Examples:
  Validate source links:
    node scripts/test-webmention-production.mjs --source=https://example.com/page

  Check for existing mention:
    node scripts/test-webmention-production.mjs --source=https://example.com/page --check

  Submit a real Webmention:
    node scripts/test-webmention-production.mjs --source=https://example.com/page --send

  Withdraw a mention:
    node scripts/test-webmention-production.mjs --source=https://example.com/page --withdraw
`);
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
    if (arg === '--withdraw') {
      args.withdraw = true;
      continue;
    }
    const m = arg.match(/^--([^=]+)=(.*)/);
    if (m) args[m[1]] = m[2];
  }
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
 */
async function checkSourceLinks(sourceUrl, targetUrl) {
  let res;
  try {
    res = await fetch(sourceUrl, { redirect: 'follow' });
  } catch (err) {
    return { ok: false, reason: `Could not fetch source: ${err.message}` };
  }
  if (!res.ok) return { ok: false, reason: `Source returned HTTP ${res.status}` };
  const html = await res.text();
  const targetStr = targetUrl.toString();
  if (html.includes(targetStr)) return { ok: true, reason: null };
  const withoutProtocol = targetStr.replace(/^https?:\/\//, '');
  if (html.includes(withoutProtocol)) return { ok: true, reason: null };
  return { ok: false, reason: `Source HTML does not contain a link to "${targetStr}".` };
}

/**
 * Fetch a URL and verify it does NOT contain a link to the target.
 * For withdrawal — the link must have been removed.
 */
async function checkSourceNotLinked(sourceUrl, targetUrl) {
  let res;
  try {
    res = await fetch(sourceUrl, { redirect: 'follow' });
  } catch (err) {
    return { ok: false, reason: `Could not fetch source: ${err.message}` };
  }
  if (!res.ok) return { ok: false, reason: `Source returned HTTP ${res.status}` };
  const html = await res.text();
  const targetStr = targetUrl.toString();
  if (html.includes(targetStr))
    return { ok: false, reason: `Source still links to "${targetStr}". Remove the link first.` };
  const withoutProtocol = targetStr.replace(/^https?:\/\//, '');
  if (html.includes(withoutProtocol))
    return { ok: false, reason: `Source still links to "${targetStr}". Remove the link first.` };
  return { ok: true, reason: null };
}

/**
 * Fetch the JF2 feed and find a matching mention.
 */
async function checkFeed(targetUrl, sourceUrl) {
  const feedUrl = `https://webmention.io/api/mentions.jf2?target=${encodeURIComponent(targetUrl)}&per-page=50`;
  let res;
  try {
    res = await fetch(feedUrl);
  } catch (err) {
    return { found: false, reason: `Feed fetch failed: ${err.message}`, mention: null };
  }
  if (!res.ok) return { found: false, reason: `Feed returned HTTP ${res.status}`, mention: null };
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

  // Validate mutually exclusive modes
  const modeCount = [args.send, args.check, args.withdraw].filter(Boolean).length;
  if (modeCount > 1) {
    console.log('  ✗ Only one of --send, --check, or --withdraw may be specified.\n');
    help();
    process.exit(1);
  }

  const source = args.source || '';
  const target = args.target || DEFAULT_TARGET;
  const send = !!args.send;
  const check = !!args.check;
  const withdraw = !!args.withdraw;

  // Validate URLs
  const sourceErr = validateUrl('Source', source);
  const targetErr = validateUrl('Target', target);
  if (sourceErr) {
    console.log(`  ✗ ${sourceErr}\n`);
    help();
    process.exit(1);
  }
  if (targetErr) {
    console.log(`  ✗ ${targetErr}\n`);
    process.exit(1);
  }

  // Determine mode label
  let modeLabel = 'VALIDATE';
  if (send) modeLabel = 'SEND';
  else if (check) modeLabel = 'CHECK';
  else if (withdraw) modeLabel = 'WITHDRAW';

  console.log(`Webmention Production Integration Test
${'='.repeat(50)}
Mode:     ${modeLabel}
Endpoint: ${ENDPOINT}
Source:   ${source}
Target:   ${target}
`);

  if (withdraw) {
    await runWithdraw(source, target);
    return;
  }

  // Verify source links to target (for send and validate modes)
  console.log('Checking source page for target link...');
  const linkCheck = await checkSourceLinks(source, target);
  if (!linkCheck.ok) {
    console.log(`  ✗ ${linkCheck.reason}`);
    if (send || !check) {
      console.log('\nThe source page must contain a link to the target URL.');
      console.log('Publish a test page first, then re-run this script.\n');
    }
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
  if (!send) {
    console.log('Dry-run mode. Pass --send to submit a real Webmention.');
    return;
  }

  // --send mode: POST and poll
  await runSend(source, target);
}

/**
 * Send a Webmention and poll for receipt.
 */
async function runSend(source, target) {
  console.log('Sending Webmention...');
  const { status, location, body: responseBody } = await postWebmention(source, target);

  console.log(`  HTTP ${status}`);
  if (location) console.log(`  Location: ${location}`);

  if (status >= 400) {
    console.log(`  ✗ POST rejected.`);
    if (responseBody) {
      const sanitized = sanitizeResponse(responseBody, source, target);
      console.log(`  Response: ${sanitized}`);
    }
    process.exit(1);
  }

  if (status === 200 || status === 201 || status === 202) {
    console.log('  ✓ Accepted.\n');
  } else {
    console.log(`  ⚠️  Unexpected status ${status}. Continuing to poll...\n`);
  }

  // Poll for receipt
  await pollForMention(target, source);
}

/**
 * Withdraw a mention: verify link is gone, POST, poll for absence.
 */
async function runWithdraw(source, target) {
  console.log('Checking source page does NOT link to target...');
  const linkCheck = await checkSourceNotLinked(source, target);
  if (!linkCheck.ok) {
    console.log(`  ✗ ${linkCheck.reason}`);
    console.log('\nRemove the link from the source page, deploy, then retry.\n');
    process.exit(1);
  }
  console.log('  ✓ Source no longer links to the target.\n');

  // Check if mention exists before attempting withdrawal
  console.log('Checking Webmention.io for existing mention...');
  const preFeed = await checkFeed(target, source);
  if (!preFeed.found) {
    console.log(`  - ${preFeed.reason}`);
    console.log('  Nothing to withdraw.\n');
    return;
  }
  console.log(`  ✓ Found mention ID ${preFeed.mention['wm-id']}.\n`);

  console.log('Sending withdrawal Webmention...');
  const { status, location, body: responseBody } = await postWebmention(source, target);

  console.log(`  HTTP ${status}`);
  if (location) console.log(`  Location: ${location}`);

  if (status >= 400) {
    console.log(`  ✗ POST rejected.`);
    if (responseBody) {
      const sanitized = sanitizeResponse(responseBody, source, target);
      console.log(`  Response: ${sanitized}`);
    }
    process.exit(1);
  }

  if (status === 200 || status === 201 || status === 202) {
    console.log('  ✓ Withdrawal accepted.\n');
  } else {
    console.log(`  ⚠️  Unexpected status ${status}. Continuing to poll...\n`);
  }

  // Poll for absence
  await pollForMentionAbsence(target, source);
}

/**
 * POST source+target to the Webmention endpoint.
 * Returns { status, location, body }.
 */
async function postWebmention(source, target) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ source, target }),
    redirect: 'manual',
  });
  const status = res.status;
  const location = res.headers.get('location');
  let body = '';
  try {
    body = await res.text();
  } catch {
    /* ignore read errors */
  }
  return { status, location, body };
}

/**
 * Poll the JF2 feed until a matching mention appears.
 * Exits with 0 on success, 1 on timeout.
 */
async function pollForMention(target, source) {
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

/**
 * Poll the JF2 feed until a matching mention disappears.
 * Exits with 0 on success, 1 on timeout.
 */
async function pollForMentionAbsence(target, source) {
  console.log('Polling Webmention.io for withdrawal confirmation...');
  const POLL_ATTEMPTS = 6;
  const POLL_DELAY_MS = 10000;
  const TIMEOUT_MS = 65000;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
    const elapsed = Date.now() - startTime;
    if (elapsed > TIMEOUT_MS) {
      console.log('  ✗ Timed out waiting for withdrawal.');
      process.exit(1);
    }

    console.log(`  Attempt ${attempt}/${POLL_ATTEMPTS}...`);
    const feed = await checkFeed(target, source);
    if (!feed.found) {
      console.log(`  ✓ Mention withdrawn!`);
      console.log(`  ${feed.reason}`);
      console.log(`\nThe mention has been removed from Webmention.io.
Next step: rebuild and redeploy the site. The reply will no
longer appear on the target article.\n`);
      return;
    }
    console.log(`  - Mention still present (ID ${feed.mention['wm-id']}).`);

    if (attempt < POLL_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    }
  }

  console.log(`  ✗ Mention not withdrawn after ${POLL_ATTEMPTS} attempts.`);
  process.exit(1);
}

/**
 * Strip sensitive or noisy content from a response body for safe printing.
 * Removes secrets, truncates long bodies, replaces the token pattern.
 */
function sanitizeResponse(body, _source, _target) {
  if (!body) return '(empty)';
  // Redact any token-like patterns
  let sanitized = body.replace(/[A-Za-z0-9_-]{20,}/g, '***');
  // Truncate if very long
  if (sanitized.length > 200) sanitized = `${sanitized.substring(0, 200)}...`;
  return sanitized;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
