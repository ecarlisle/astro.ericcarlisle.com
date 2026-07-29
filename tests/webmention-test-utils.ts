/**
 * Webmention test utilities — extracted for deterministic unit testing.
 */
export function validateUrl(label, value, requireHttps = true) {
  if (!value) return `${label} is missing.`;
  let parsed = null;
  try {
    parsed = new URL(value);
  } catch {
    return `${label} "${value}" is not a valid URL.`;
  }
  if (requireHttps && parsed.protocol !== 'https:') return `${label} must use HTTPS.`;
  return null;
}

export function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
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
    const m = arg.match(/^--([^=]+)=(.*)/);
    if (m) args[m[1]] = m[2];
  }
  if (!args.source && process.env.SOURCE_URL) args.source = process.env.SOURCE_URL;
  return args;
}

export async function checkSourceLinks(sourceUrl, targetUrl, fetcher = fetch) {
  let res = null;
  try {
    res = await fetcher(sourceUrl, { redirect: 'follow' });
  } catch (err) {
    return { ok: false, reason: `Could not fetch source: ${err.message}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `Source returned HTTP ${res.status}` };
  }
  const html = await res.text();
  const targetStr = targetUrl.toString();
  if (html.includes(targetStr)) {
    return { ok: true, reason: null };
  }
  const withoutProtocol = targetStr.replace(/^https?:\/\//, '');
  if (html.includes(withoutProtocol)) {
    return { ok: true, reason: null };
  }
  return { ok: false, reason: `Source HTML does not contain a link to "${targetStr}".` };
}

export async function checkFeed(targetUrl, sourceUrl, fetcher = fetch) {
  const feedUrl = `https://webmention.io/api/mentions.jf2?target=${encodeURIComponent(targetUrl)}&per-page=50`;
  let res = null;
  try {
    res = await fetcher(feedUrl);
  } catch (err) {
    return { found: false, reason: `Feed fetch failed: ${err.message}`, mention: null };
  }
  if (!res.ok) {
    return { found: false, reason: `Feed returned HTTP ${res.status}`, mention: null };
  }
  let body = null;
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

/** Build a mock fetch response. */
export function mockResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map(Object.entries(headers)),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    json: () => Promise.resolve(typeof body === 'string' ? JSON.parse(body) : body),
  };
}

/** Build a mock fetch that returns a given sequence of responses. */
export function mockFetchSequence(responses) {
  let i = 0;
  return () => Promise.resolve(responses[i++]);
}
