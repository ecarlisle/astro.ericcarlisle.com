/**
 * Shared fixture helpers for site-intelligence-mcp tests.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { SiteInventory } from '../src/graph/schema.js';

export const VALID_INVENTORY: SiteInventory = {
  pages: [
    {
      route: '/',
      file: 'index.html',
      size: 1000,
      built: true,
      inSitemap: true,
      sitemapLastmod: null,
      title: 'Home',
      description: null,
      canonical: 'https://ericcarlisle.com/',
      robots: null,
      h1Count: 1,
      h1Texts: ['Home'],
      redirectTarget: null,
      inboundCount: 3,
      warnings: [],
      classification: 'normal',
    },
    {
      route: '/about/',
      file: 'about/index.html',
      size: 800,
      built: true,
      inSitemap: true,
      sitemapLastmod: null,
      title: 'About',
      description: null,
      canonical: 'https://ericcarlisle.com/about/',
      robots: null,
      h1Count: 1,
      h1Texts: ['About'],
      redirectTarget: null,
      inboundCount: 1,
      warnings: [{ code: 'MISSING_DESCRIPTION', message: 'No meta description found.' }],
      classification: 'normal',
    },
    {
      route: '/lab/context/',
      file: 'lab/context/index.html',
      size: 500,
      built: true,
      inSitemap: false,
      sitemapLastmod: null,
      title: 'Context',
      description: null,
      canonical: 'https://ericcarlisle.com/lab/context/',
      robots: 'noindex',
      h1Count: 1,
      h1Texts: ['Context'],
      redirectTarget: null,
      inboundCount: 0,
      warnings: [],
      classification: 'lab',
    },
  ],
  summary: {
    totalUrls: 3,
    builtPages: 3,
    sitemapUrls: 2,
    orphanedPages: 0,
    pagesWithWarnings: 1,
    totalWarnings: 1,
  },
  provenance: { commitSha: 'abc123' },
};

/** Create a temp dir with a site-inventory.json fixture; returns cleanup. */
export function createFixtureDir(contents: string): {
  dir: string;
  filePath: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'si-mcp-'));
  const filePath = join(dir, 'site-inventory.json');
  writeFileSync(filePath, contents, 'utf-8');
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  return { dir, filePath, cleanup };
}
