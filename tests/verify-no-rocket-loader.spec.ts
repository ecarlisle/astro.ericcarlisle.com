/**
 * verify-no-rocket-loader unit + CLI tests.
 *
 * Exercises the real production functions in scripts/verify-no-rocket-loader.mjs
 * and spawns the actual CLI for exit-code behavior — no copied implementations.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { expect, test } from '@playwright/test';
import {
  DEFAULT_URL,
  EXIT,
  extractScriptTags,
  findRocketLoaderMarkers,
  parseArgs,
  parseScriptTagAttributes,
  stripHtmlComments,
  validateTarget,
} from '../scripts/verify-no-rocket-loader.mjs';

const SCRIPT_PATH = new URL('../scripts/verify-no-rocket-loader.mjs', import.meta.url).pathname;

const GENUINE_RL_HTML = `<!doctype html>
<html><head>
<script type="module" src="/_astro/ec.abc123.js"></script>
</head><body>
<script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="4ebf950a5dd8270dd32f9ef3-|49" defer></script>
<script type="4ebf950a5dd8270dd32f9ef3-module" src="/_astro/ec.0vx5m.js"></script>
<script type="4ebf950a5dd8270dd32f9ef3-text/javascript">var x = 1;</script>
</body></html>`;

// ─── Marker detection on real script elements ────────────────────────────

test('detects the genuine Rocket Loader loader script injection', () => {
  const findings = findRocketLoaderMarkers(GENUINE_RL_HTML);
  const loader = findings.filter((f) => f.id === 'rocket-loader-script');
  expect(loader).toHaveLength(1);
  expect(loader[0].tag).toContain('rocket-loader.min.js');
});

test('detects a genuine data-cf-settings attribute on a script element', () => {
  const findings = findRocketLoaderMarkers(GENUINE_RL_HTML);
  expect(findings.filter((f) => f.id === 'data-cf-settings')).toHaveLength(1);
  // A script carrying only the attribute (no loader src) still counts.
  const attrOnly = findRocketLoaderMarkers(
    '<script type="module" data-cf-settings="abc123def456abc123def456-|7">console.log(1)</script>',
  );
  expect(attrOnly.some((f) => f.id === 'data-cf-settings')).toBe(true);
});

test('detects rewritten module and classic script types', () => {
  const findings = findRocketLoaderMarkers(GENUINE_RL_HTML);
  expect(findings.some((f) => f.id === 'rewritten-module-type')).toBe(true);
  expect(findings.some((f) => f.id === 'rewritten-classic-type')).toBe(true);
});

test('ordinary Astro module scripts produce no findings', () => {
  const html = `<!doctype html>
<html><head><link rel="stylesheet" href="/_astro/ec.C1A0B.css"></head>
<body>
<script type="module" src="/_astro/ec.abc123.js"></script>
<script type="module">document.getElementById('theme-toggle')</script>
<script src="/_astro/legacy.C0FFEE.js" defer></script>
<script type="application/ld+json">{"name":"rocket-loader.min.js"}</script>
</body></html>`;
  expect(findRocketLoaderMarkers(html)).toEqual([]);
});

test('marker strings in page prose never fail the check', () => {
  const html = `<article>
  <p>Cloudflare Rocket Loader (rocket-loader.min.js) can rewrite scripts with a
  data-cf-settings attribute.</p>
  <code>rocket-loader.min.js</code> and <code>data-cf-settings</code> are markers.
  <p>The hex-module type looks like 4ebf950a5dd8270dd32f9ef3-module in prose.</p>
</article>`;
  expect(findRocketLoaderMarkers(html)).toEqual([]);
});

test('escaped code examples mentioning the markers never fail the check', () => {
  const html = `<pre><code>&lt;script src="/cdn-cgi/scripts/rocket-loader.min.js" data-cf-settings="abc"&gt;&lt;/script&gt;
&lt;script type="4ebf950a5dd8270dd32f9ef3-module"&gt;&lt;/script&gt;</code></pre>`;
  expect(findRocketLoaderMarkers(html)).toEqual([]);
});

test('commented-out script tags are ignored', () => {
  const html = `<!-- <script src="rocket-loader.min.js" data-cf-settings="x"></script> -->
<script type="module" src="/_astro/app.js"></script>`;
  expect(findRocketLoaderMarkers(html)).toEqual([]);
});

test('script open-tag scanning tolerates quoted ">" inside attributes', () => {
  const html = `<script type="module" data-foo="a > b" src="/_astro/x.js"></script>`;
  expect(findRocketLoaderMarkers(html)).toEqual([]);
  const tags = extractScriptTags(html);
  expect(tags).toHaveLength(1);
  expect(parseScriptTagAttributes(tags[0])['data-foo']).toBe('a > b');
});

test('stripHtmlComments removes comment regions', () => {
  expect(stripHtmlComments('a<!-- <script x> -->b<script>')).toBe('ab<script>');
});

// ─── CLI argument parsing ─────────────────────────────────────────────────

test('parseArgs accepts the four supported invocation forms', () => {
  expect(parseArgs([])).toEqual({ url: DEFAULT_URL, help: false });
  expect(parseArgs(['https://example.com/page/'])).toEqual({
    url: 'https://example.com/page/',
    help: false,
  });
  expect(parseArgs(['--url', 'https://example.com/page/'])).toEqual({
    url: 'https://example.com/page/',
    help: false,
  });
  expect(parseArgs(['--url=https://example.com/page/'])).toEqual({
    url: 'https://example.com/page/',
    help: false,
  });
  expect(parseArgs(['--help']).help).toBe(true);
  expect(parseArgs(['-h']).help).toBe(true);
});

test('parseArgs rejects an empty --url value', () => {
  expect(parseArgs(['--url=']).error).toContain('non-empty');
  expect(parseArgs(['--url']).error).toContain('requires a value');
  expect(parseArgs(['--url', '--other']).error).toContain('requires a value');
});

test('parseArgs rejects unknown options', () => {
  expect(parseArgs(['--bogus']).error).toContain('Unknown option');
  expect(parseArgs(['-x']).error).toContain('Unknown option');
  expect(parseArgs(['--url=https://a.example/', '--bogus']).error).toContain('Unknown option');
});

test('parseArgs rejects multiple URL arguments', () => {
  expect(parseArgs(['https://a.example/', 'https://b.example/']).error).toContain('Multiple');
  expect(parseArgs(['--url', 'https://a.example/', '--url', 'https://b.example/']).error).toContain(
    'Multiple',
  );
  expect(parseArgs(['--url=https://a.example/', 'https://b.example/']).error).toContain('Multiple');
  expect(parseArgs(['https://a.example/', '--url', 'https://b.example/']).error).toContain(
    'Multiple',
  );
});

test('validateTarget only accepts http(s) URLs', () => {
  expect(validateTarget('https://ericcarlisle.com/')).toBeNull();
  expect(validateTarget('http://localhost:4321/')).toBeNull();
  expect(validateTarget('not a url')).toContain('not a valid URL');
  expect(validateTarget('ftp://example.com/')).toContain('http or https');
  expect(validateTarget('file:///tmp/x.html')).toContain('http or https');
});

// ─── CLI exit-code behavior (spawned process) ─────────────────────────────

type CliResult = { code: number | null; stdout: string; stderr: string };

function runCli(args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('CLI: usage errors exit 2 for unknown options, empty values, multiple URLs', async () => {
  for (const args of [
    ['--bogus'],
    ['--url='],
    ['https://a.example/', 'https://b.example/'],
    ['ftp://example.com/'],
  ]) {
    const result = await runCli(args);
    expect(result.code, `args=${args.join(' ')}`).toBe(EXIT.USAGE);
    expect(result.stderr).toContain('✗');
  }
});

test('CLI: network failure exits 3 (not a regression)', async () => {
  const result = await runCli(['http://127.0.0.1:1/']);
  expect(result.code).toBe(EXIT.NETWORK);
  expect(result.stdout).toContain('network failure');
  expect(result.stdout).not.toContain('Rocket Loader markers detected');
});

test('CLI: clean delivery exits 0 when no script element is rewritten', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html><body><script type="module" src="/_astro/app.js"></script></body></html>');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Test server did not bind to a TCP port.');
  }
  const port = address.port;
  try {
    const result = await runCli([`http://127.0.0.1:${port}/`]);
    expect(result.code).toBe(EXIT.CLEAN);
    expect(result.stdout).toContain('No Rocket Loader markers found');
  } finally {
    server.close();
  }
});

test('CLI: genuine Rocket Loader injection exits 1 (regression)', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(GENUINE_RL_HTML);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Test server did not bind to a TCP port.');
  }
  const port = address.port;
  try {
    const result = await runCli([`http://127.0.0.1:${port}/`]);
    expect(result.code).toBe(EXIT.REGRESSION);
    expect(result.stdout).toContain('Rocket Loader markers detected');
    expect(result.stdout).toContain('rocket-loader-script');
    expect(result.stdout).toContain('data-cf-settings');
  } finally {
    server.close();
  }
});
