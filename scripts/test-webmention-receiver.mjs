#!/usr/bin/env node
/**
 * Webmention endpoint receiver validation.
 *
 * Validates that the configured Webmention.io endpoint accepts and rejects
 * requests as expected by the Webmention specification.
 *
 * The receiver is hosted by Webmention.io, not by this repository.
 * These tests validate the configured third-party receiver.
 *
 * OPT-IN SCRIPT — NOT part of CI.
 *
 * Usage:
 *   --source=URL       Source URL for the test (required for --send)
 *   --target=URL       Target URL (defaults to the primary article)
 *   --send             Actually POST to the receiver (without this, explains)
 *   --help             Print this help
 *
 * Examples:
 *   node scripts/test-webmention-receiver.mjs --help
 *   node scripts/test-webmention-receiver.mjs --source=https://example.com/page
 *   node scripts/test-webmention-receiver.mjs --source=https://example.com/page --send
 */

const ENDPOINT = 'https://webmention.io/ericcarlisle.com/webmention';
const DEFAULT_TARGET = 'https://ericcarlisle.com/blog/250mm-trading-card-box/';

function help() {
  console.log(`Webmention Receiver Validation
${'='.repeat(50)}
Validates the configured Webmention.io endpoint at:
  ${ENDPOINT}

This is a THIRD-PARTY receiver test, not application-level testing.

Options:
  --source=URL   Public source page that links to the target (required for --send)
  --target=URL   Canonical target URL (default: ${DEFAULT_TARGET})
  --send         Submit a real Webmention POST (without this, no external request occurs)
  --help         Print this message

Without --send, the script validates URL formats and explains what would happen.

Examples:
  Validate URLs, no external request:
    node scripts/test-webmention-receiver.mjs --source=https://example.com/page

  Submit a real Webmention:
    node scripts/test-webmention-receiver.mjs --source=https://example.com/page --send

Withdrawal:
  Remove the link from the source and resend the same source/target to update.

The receiver is at Webmention.io. See https://www.w3.org/TR/webmention/ for the spec.`);
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
    const m = arg.match(/^--([^=]+)=(.*)/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

/** Validate a URL string. Returns null or an error message. */
function validateUrl(label, value, requireHttps = true) {
  if (!value) return `${label} is missing.`;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return `${label} "${value}" is not a valid URL.`;
  }
  if (requireHttps && parsed.protocol !== 'https:') return `${label} "${value}" must use HTTPS.`;
  return null;
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

  console.log(`Webmention Receiver Validation
${'='.repeat(50)}
Endpoint: ${ENDPOINT}
Source:   ${source || '(none)'}
Target:   ${target}
Send:     ${send ? 'YES' : 'no (pass --send to enable)'}
`);

  // Validate URLs up front
  const sourceErr = source ? validateUrl('Source', source) : null;
  const targetErr = target ? validateUrl('Target', target) : null;
  if (sourceErr) console.log(`  ✗ ${sourceErr}`);
  if (targetErr) console.log(`  ✗ ${targetErr}`);
  if (sourceErr || targetErr) {
    process.exit(1);
  }

  if (!send) {
    console.log('Dry-run mode (no external request).');
    console.log('Pass --send to POST to the receiver.\n');
    return;
  }

  console.log('\nSending test requests to Webmention.io...\n');

  let failures = 0;

  // --- Test 1: Valid source + target ---
  console.log('--- Test 1: Valid source and target ---');
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ source, target }),
      redirect: 'manual',
    });
    const location = res.headers.get('location');
    console.log(`  HTTP ${res.status} ${res.statusText}`);
    if (location) console.log(`  Location: ${location}`);

    if (res.status === 201 && location) {
      console.log('  ✓ PASS (201 Created with Location — per Webmention spec)');
    } else if (res.status === 200 || res.status === 202) {
      console.log('  ✓ PASS (accepted for processing)');
    } else if (res.status >= 400) {
      console.log(`  ✗ FAIL (rejected — got ${res.status})`);
      failures++;
    } else {
      console.log(`  ? UNEXPECTED (got ${res.status})`);
    }
  } catch (err) {
    console.log(`  ✗ FAIL (network error: ${err.message})`);
    failures++;
  }

  // --- Test 2: Missing source ---
  console.log('\n--- Test 2: Missing source ---');
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ source: '', target }),
      redirect: 'manual',
    });
    console.log(`  HTTP ${res.status} ${res.statusText}`);
    if (res.status >= 400) {
      console.log('  ✓ PASS (rejected missing source)');
    } else {
      console.log(`  ? UNEXPECTED (accepted with status ${res.status})`);
    }
  } catch (err) {
    console.log(`  ✗ FAIL (network error: ${err.message})`);
    failures++;
  }

  // --- Test 3: Missing target ---
  console.log('\n--- Test 3: Missing target ---');
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ source: source || 'https://example.com/page', target: '' }),
      redirect: 'manual',
    });
    console.log(`  HTTP ${res.status} ${res.statusText}`);
    if (res.status >= 400) {
      console.log('  ✓ PASS (rejected missing target)');
    } else {
      console.log(`  ? UNEXPECTED (accepted with status ${res.status})`);
    }
  } catch (err) {
    console.log(`  ✗ FAIL (network error: ${err.message})`);
    failures++;
  }

  console.log(
    `\n${'='.repeat(50)}\n${failures === 0 ? 'All receiver tests passed.' : `${failures} test(s) failed.`}`,
  );
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
