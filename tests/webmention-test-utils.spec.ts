/**
 * Webmention test utility unit tests.
 *
 * These tests are deterministic and do not make external requests.
 */
import { expect, test } from '@playwright/test';
import {
  checkFeed,
  checkSourceLinks,
  mockResponse,
  parseArgs,
  validateUrl,
} from './webmention-test-utils';

// ─── validateUrl ────────────────────────────────────────────────────────────

test('validateUrl accepts valid HTTPS URL', () => {
  expect(validateUrl('Source', 'https://example.com/page')).toBeNull();
});

test('validateUrl rejects missing value', () => {
  expect(validateUrl('Source', '')).toContain('missing');
});

test('validateUrl rejects invalid URL', () => {
  expect(validateUrl('Source', 'not-a-url')).toContain('not a valid URL');
});

test('validateUrl rejects non-HTTPS URL by default', () => {
  expect(validateUrl('Source', 'http://example.com/page')).toContain('must use HTTPS');
});

test('validateUrl allows HTTP when requireHttps is false', () => {
  expect(validateUrl('Source', 'http://example.com/page', false)).toBeNull();
});

// ─── parseArgs ──────────────────────────────────────────────────────────────

test('parseArgs extracts --source', () => {
  const args = parseArgs(['--source=https://example.com/page']);
  expect(args.source).toBe('https://example.com/page');
});

test('parseArgs detects --send', () => {
  expect(parseArgs(['--send']).send).toBe(true);
});

test('parseArgs detects --check', () => {
  expect(parseArgs(['--check']).check).toBe(true);
});

test('parseArgs detects --help', () => {
  expect(parseArgs(['--help']).help).toBe(true);
});

test('parseArgs reads SOURCE_URL from env', () => {
  const prev = process.env.SOURCE_URL;
  process.env.SOURCE_URL = 'https://env.example.com/page';
  const args = parseArgs([]);
  expect(args.source).toBe('https://env.example.com/page');
  process.env.SOURCE_URL = prev;
});

test('parseArgs CLI --source overrides SOURCE_URL env', () => {
  const prev = process.env.SOURCE_URL;
  process.env.SOURCE_URL = 'https://env.example.com/page';
  const args = parseArgs(['--source=https://cli.example.com/page']);
  expect(args.source).toBe('https://cli.example.com/page');
  process.env.SOURCE_URL = prev;
});

// ─── checkSourceLinks ───────────────────────────────────────────────────────

test('checkSourceLinks passes when HTML contains the target URL', async () => {
  const fetcher = () =>
    Promise.resolve(
      mockResponse(200, '<html><a href="https://ericcarlisle.com/blog/test/">link</a></html>'),
    );
  const result = await checkSourceLinks(
    'https://example.com/page',
    'https://ericcarlisle.com/blog/test/',
    fetcher,
  );
  expect(result.ok).toBe(true);
});

test('checkSourceLinks fails when HTML lacks the target', async () => {
  const fetcher = () =>
    Promise.resolve(mockResponse(200, '<html><a href="https://other.com/page">link</a></html>'));
  const result = await checkSourceLinks(
    'https://example.com/page',
    'https://ericcarlisle.com/blog/test/',
    fetcher,
  );
  expect(result.ok).toBe(false);
  expect(result.reason).toContain('does not contain a link');
});

test('checkSourceLinks fails on HTTP error', async () => {
  const fetcher = () => Promise.resolve(mockResponse(404, 'Not found'));
  const result = await checkSourceLinks(
    'https://example.com/page',
    'https://ericcarlisle.com/blog/test/',
    fetcher,
  );
  expect(result.ok).toBe(false);
  expect(result.reason).toContain('HTTP 404');
});

test('checkSourceLinks fails on network error', async () => {
  const fetcher = () => Promise.reject(new Error('DNS failure'));
  const result = await checkSourceLinks(
    'https://example.com/page',
    'https://ericcarlisle.com/blog/test/',
    fetcher,
  );
  expect(result.ok).toBe(false);
  expect(result.reason).toContain('DNS failure');
});

// ─── checkFeed ──────────────────────────────────────────────────────────────

test('checkFeed finds a matching mention', async () => {
  const fetcher = () =>
    Promise.resolve(
      mockResponse(200, {
        children: [
          {
            'wm-id': 42,
            'wm-source': 'https://example.com/source',
            'wm-target': 'https://ericcarlisle.com/blog/test/',
            'wm-property': 'in-reply-to',
          },
        ],
      }),
    );
  const result = await checkFeed(
    'https://ericcarlisle.com/blog/test/',
    'https://example.com/source',
    fetcher,
  );
  expect(result.found).toBe(true);
  expect(result.mention).toBeTruthy();
  const m = result.mention as NonNullable<typeof result.mention>;
  expect(m['wm-id']).toBe(42);
  expect(m['wm-property']).toBe('in-reply-to');
});

test('checkFeed returns not found when no source matches', async () => {
  const fetcher = () =>
    Promise.resolve(
      mockResponse(200, {
        children: [
          {
            'wm-id': 1,
            'wm-source': 'https://other.com/page',
            'wm-target': 'https://ericcarlisle.com/blog/test/',
          },
        ],
      }),
    );
  const result = await checkFeed(
    'https://ericcarlisle.com/blog/test/',
    'https://example.com/source',
    fetcher,
  );
  expect(result.found).toBe(false);
});

test('checkFeed handles HTTP error', async () => {
  const fetcher = () => Promise.resolve(mockResponse(500, 'Server error'));
  const result = await checkFeed(
    'https://ericcarlisle.com/blog/test/',
    'https://example.com/source',
    fetcher,
  );
  expect(result.found).toBe(false);
  expect(result.reason).toContain('HTTP 500');
});

test('checkFeed handles non-JSON response', async () => {
  const fetcher = () => Promise.resolve(mockResponse(200, 'not json'));
  const result = await checkFeed(
    'https://ericcarlisle.com/blog/test/',
    'https://example.com/source',
    fetcher,
  );
  expect(result.found).toBe(false);
  expect(result.reason).toContain('non-JSON');
});

test('checkFeed handles empty children array', async () => {
  const fetcher = () => Promise.resolve(mockResponse(200, { children: [] }));
  const result = await checkFeed(
    'https://ericcarlisle.com/blog/test/',
    'https://example.com/source',
    fetcher,
  );
  expect(result.found).toBe(false);
});

test('checkFeed handles network failure', async () => {
  const fetcher = () => Promise.reject(new Error('Network error'));
  const result = await checkFeed(
    'https://ericcarlisle.com/blog/test/',
    'https://example.com/source',
    fetcher,
  );
  expect(result.found).toBe(false);
  expect(result.reason).toContain('Network error');
});
