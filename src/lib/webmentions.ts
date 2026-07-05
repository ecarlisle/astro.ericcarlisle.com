export interface WebmentionAuthor {
  name?: string;
  photo?: string;
  url?: string;
}

export interface WebmentionContent {
  text?: string;
  html?: string;
}

export interface Webmention {
  type: string;
  author?: WebmentionAuthor;
  url?: string;
  published?: string;
  'wm-received'?: string;
  'wm-id': number;
  'wm-source': string;
  'wm-target': string;
  'wm-property': 'in-reply-to' | 'like-of' | 'repost-of' | 'mention-of' | 'bookmark-of';
  'wm-private'?: boolean;
  content?: WebmentionContent;
  name?: string;
}

interface WebmentionFeed {
  type: string;
  name: string;
  children: Webmention[];
}

const WEBMENTION_IO_DOMAIN = 'ericcarlisle.com';

function buildMentionsApiUrl(token: string, targetUrl: string): string {
  const url = new URL('https://webmention.io/api/mentions.jf2');
  url.searchParams.set('domain', WEBMENTION_IO_DOMAIN);
  url.searchParams.set('token', token);
  url.searchParams.set('target', targetUrl);
  url.searchParams.set('per-page', '50');
  url.searchParams.set('sort-by', 'published');
  return url.toString();
}

async function fetchFromWebmentionIo(apiUrl: string, targetUrl: string): Promise<Webmention[]> {
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.warn(`webmention.io returned ${res.status} for ${targetUrl}`);
      return [];
    }
    const feed: WebmentionFeed = await res.json();
    return feed.children ?? [];
  } catch (e) {
    console.warn(`Failed to fetch webmentions for ${targetUrl}:`, e);
    return [];
  }
}

function handleMissingToken(): Webmention[] {
  if (import.meta.env.DEV) {
    console.warn('WEBMENTION_IO_TOKEN is not set — returning mock mentions for local dev');
    return getMockWebmentions();
  }
  console.warn('WEBMENTION_IO_TOKEN is not set — skipping webmention fetch');
  return [];
}

export async function fetchWebmentions(targetUrl: string): Promise<Webmention[]> {
  const token = import.meta.env.WEBMENTION_IO_TOKEN;
  if (!token) {
    return handleMissingToken();
  }

  const apiUrl = buildMentionsApiUrl(token, targetUrl);
  return fetchFromWebmentionIo(apiUrl, targetUrl);
}

const MOCK_WEBMENTIONS: Webmention[] = [
  {
    type: 'entry',
    author: {
      name: 'Sarah Chen',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      url: 'https://example.com/sarah',
    },
    url: 'https://example.com/sarah#reply-1',
    'wm-id': 1001,
    'wm-source': 'https://example.com/sarah',
    'wm-target': 'https://ericcarlisle.com/blog/test/',
    'wm-property': 'in-reply-to',
    published: new Date(Date.now() - 3600000).toISOString(),
    content: {
      html: "<p>Great breakdown of the approach. I especially liked the section on build-time data fetching — that's exactly the pattern I was looking for.</p>",
    },
  },
  {
    type: 'entry',
    author: {
      name: 'Marcus Rivera',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      url: 'https://example.com/marcus',
    },
    url: 'https://example.com/marcus#reply-2',
    'wm-id': 1002,
    'wm-source': 'https://example.com/marcus',
    'wm-target': 'https://ericcarlisle.com/blog/test/',
    'wm-property': 'in-reply-to',
    published: new Date(Date.now() - 7200000).toISOString(),
    content: {
      html: "<p>Have you considered using a cron job to rebuild automatically when new mentions come in? That's what I do on my static site.</p>",
    },
  },
  {
    type: 'entry',
    author: {
      name: 'Aiko Tanaka',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aiko',
      url: 'https://example.com/aiko',
    },
    url: 'https://example.com/aiko',
    'wm-id': 1003,
    'wm-source': 'https://example.com/aiko',
    'wm-target': 'https://ericcarlisle.com/blog/test/',
    'wm-property': 'like-of',
    published: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    type: 'entry',
    author: {
      name: 'Jamie Patel',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jamie',
      url: 'https://example.com/jamie',
    },
    url: 'https://example.com/jamie',
    'wm-id': 1004,
    'wm-source': 'https://example.com/jamie',
    'wm-target': 'https://ericcarlisle.com/blog/test/',
    'wm-property': 'like-of',
    published: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    type: 'entry',
    author: {
      name: "Liam O'Brien",
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liam',
      url: 'https://example.com/liam',
    },
    url: 'https://example.com/liam',
    'wm-id': 1005,
    'wm-source': 'https://example.com/liam',
    'wm-target': 'https://ericcarlisle.com/blog/test/',
    'wm-property': 'repost-of',
    published: new Date(Date.now() - 259200000).toISOString(),
  },
];

function getMockWebmentions(): Webmention[] {
  return MOCK_WEBMENTIONS;
}
