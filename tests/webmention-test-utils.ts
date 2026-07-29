/**
 * Webmention test utilities — extracted for deterministic unit testing.
 */

export interface AppArgs {
  help?: boolean;
  send?: boolean;
  check?: boolean;
  fixture?: boolean;
  withdraw?: boolean;
  source?: string;
  target?: string;
  [key: string]: string | boolean | undefined;
}

export interface SourceCheckResult {
  ok: boolean;
  reason: string | null;
}

export interface FeedEntry {
  'wm-source': string;
  'wm-target': string;
  'wm-property': string;
  'wm-id': number;
  [key: string]: unknown;
}

export interface FeedResponse {
  children?: FeedEntry[];
  name?: string;
}

export interface FeedCheckResult {
  found: boolean;
  reason: string | null;
  mention: FeedEntry | null;
}

export interface MockResponse {
  ok: boolean;
  status: number;
  headers: Map<string, unknown>;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export type Fetcher = (url: string | URL, init?: RequestInit) => Promise<Response | MockResponse>;

/**
 * Validate a URL string. Returns null for valid or an error message.
 */
export function validateUrl(label: string, value: string, requireHttps = true): string | null {
  if (!value) return `${label} is missing.`;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return `${label} "${value}" is not a valid URL.`;
  }
  if (requireHttps && parsed.protocol !== 'https:') {
    return `${label} must use HTTPS.`;
  }
  return null;
}

/**
 * Parse command-line arguments. Supports --key=value, --flag, and --help.
 */
export function parseArgs(argv: string[]): AppArgs {
  const args: AppArgs = {};
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
    if (arg === '--withdraw') {
      args.withdraw = true;
      continue;
    }
    if (arg === '--fixture') {
      args.fixture = true;
      continue;
    }
    const m = arg.match(/^--([^=]+)=(.*)/);
    if (m) args[m[1]] = m[2];
  }
  if (!args.source && process.env.SOURCE_URL) {
    args.source = process.env.SOURCE_URL;
  }
  return args;
}

/**
 * Fetch a source page and verify it contains a link to the target URL.
 */
export async function checkSourceLinks(
  sourceUrl: string,
  targetUrl: string | URL,
  fetcher: Fetcher = fetch,
): Promise<SourceCheckResult> {
  let res: Response | MockResponse;
  try {
    res = await fetcher(sourceUrl, { redirect: 'follow' } as RequestInit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Could not fetch source: ${msg}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `Source returned HTTP ${res.status}` };
  }
  const html = await res.text();
  const targetStr = typeof targetUrl === 'string' ? targetUrl : targetUrl.toString();
  if (html.includes(targetStr)) {
    return { ok: true, reason: null };
  }
  const withoutProtocol = targetStr.replace(/^https?:\/\//, '');
  if (html.includes(withoutProtocol)) {
    return { ok: true, reason: null };
  }
  return { ok: false, reason: `Source HTML does not contain a link to "${targetStr}".` };
}

/**
 * Check that a source page does NOT contain a link to the target URL.
 * Returns { ok, reason } where ok=true means the link is absent.
 */
export async function checkSourceNotLinked(
  sourceUrl: string,
  targetUrl: string | URL,
  fetcher: Fetcher = fetch,
): Promise<SourceCheckResult> {
  let res: Response | MockResponse;
  try {
    res = await fetcher(sourceUrl, { redirect: 'follow' } as RequestInit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Could not fetch source: ${msg}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `Source returned HTTP ${res.status}` };
  }
  const html = await res.text();
  const targetStr = typeof targetUrl === 'string' ? targetUrl : targetUrl.toString();
  if (html.includes(targetStr)) {
    return { ok: false, reason: `Source still links to "${targetStr}".` };
  }
  const withoutProtocol = targetStr.replace(/^https?:\/\//, '');
  if (html.includes(withoutProtocol)) {
    return { ok: false, reason: `Source still links to "${targetStr}".` };
  }
  return { ok: true, reason: null };
}

/**
 * Poll the Webmention.io JF2 feed and look for a matching mention.
 */
export async function checkFeed(
  targetUrl: string,
  sourceUrl: string,
  fetcher: Fetcher = fetch,
): Promise<FeedCheckResult> {
  const feedUrl = `https://webmention.io/api/mentions.jf2?target=${encodeURIComponent(targetUrl)}&per-page=50`;
  let res: Response | MockResponse;
  try {
    res = await fetcher(feedUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { found: false, reason: `Feed fetch failed: ${msg}`, mention: null };
  }
  if (!res.ok) {
    return { found: false, reason: `Feed returned HTTP ${res.status}`, mention: null };
  }
  let body: FeedResponse | null = null;
  try {
    body = (await res.json()) as FeedResponse;
  } catch {
    return { found: false, reason: 'Feed returned non-JSON response.', mention: null };
  }
  const children = body?.children ?? [];
  const match: FeedEntry | undefined = children.find(
    (entry: FeedEntry) => entry['wm-source'] === sourceUrl,
  );
  if (match) return { found: true, reason: null, mention: match };
  return {
    found: false,
    reason: `No mention with source "${sourceUrl}" in ${children.length} entries.`,
    mention: null,
  };
}

/**
 * Build a mock fetch response object.
 */
export function mockResponse(
  status: number,
  body: string | Record<string, unknown>,
  headers: Record<string, unknown> = {},
): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map(Object.entries(headers)),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    json: () => Promise.resolve(typeof body === 'string' ? JSON.parse(body) : body),
  };
}

/**
 * Build a mock fetch function that returns a sequence of responses.
 */
export function mockFetchSequence(responses: MockResponse[]): Fetcher {
  let i = 0;
  return () => Promise.resolve(responses[i++]);
}
