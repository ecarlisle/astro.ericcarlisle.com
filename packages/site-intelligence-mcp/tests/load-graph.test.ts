/**
 * Tests for graph loading and validation.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  defaultInventoryPath,
  InventoryLoadError,
  loadSiteInventory,
} from '../src/graph/load-graph.js';
import { validateSiteInventory } from '../src/graph/schema.js';
import { createFixtureDir, VALID_INVENTORY } from './fixtures.js';

test('loads a valid fixture', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify(VALID_INVENTORY));
  try {
    const data = loadSiteInventory(filePath);
    assert.equal(data.summary.totalUrls, 3);
    assert.equal(data.pages.length, 3);
  } finally {
    cleanup();
  }
});

test('rejects malformed JSON', () => {
  const { filePath, cleanup } = createFixtureDir('{ not valid json');
  try {
    assert.throws(
      () => loadSiteInventory(filePath),
      (error: unknown) =>
        error instanceof InventoryLoadError && /not valid JSON/.test(error.message),
    );
  } finally {
    cleanup();
  }
});

test('rejects structurally invalid data (missing pages)', () => {
  const { filePath, cleanup } = createFixtureDir(JSON.stringify({ summary: {} }));
  try {
    assert.throws(
      () => loadSiteInventory(filePath),
      (error: unknown) =>
        error instanceof InventoryLoadError && /structurally invalid/.test(error.message),
    );
  } finally {
    cleanup();
  }
});

test('rejects structurally invalid data (bad summary number)', () => {
  const { filePath, cleanup } = createFixtureDir(
    JSON.stringify({
      pages: [{ route: '/' }],
      summary: { totalUrls: 'not-a-number' },
    }),
  );
  try {
    assert.throws(
      () => loadSiteInventory(filePath),
      (error: unknown) =>
        error instanceof InventoryLoadError && /summary\.totalUrls/.test(error.message),
    );
  } finally {
    cleanup();
  }
});

test('rejects a page without a route', () => {
  const { filePath, cleanup } = createFixtureDir(
    JSON.stringify({
      pages: [{ title: 'No route' }],
      summary: {
        totalUrls: 1,
        builtPages: 1,
        sitemapUrls: 1,
        orphanedPages: 0,
        pagesWithWarnings: 0,
        totalWarnings: 0,
      },
    }),
  );
  try {
    assert.throws(
      () => loadSiteInventory(filePath),
      (error: unknown) =>
        error instanceof InventoryLoadError && /pages\[0\]\.route/.test(error.message),
    );
  } finally {
    cleanup();
  }
});

test('fails clearly when the data file is missing', () => {
  const { dir, cleanup } = createFixtureDir('{}');
  try {
    const missing = `${dir}/does-not-exist.json`;
    assert.throws(
      () => loadSiteInventory(missing),
      (error: unknown) => error instanceof InventoryLoadError && /not found/.test(error.message),
    );
  } finally {
    cleanup();
  }
});

test('validateSiteInventory returns ok for valid data', () => {
  const result = validateSiteInventory(VALID_INVENTORY);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.pages.length, 3);
  }
});

test('validateSiteInventory rejects a non-object', () => {
  const result = validateSiteInventory('nope');
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /not an object/);
});

test('defaultInventoryPath honors the env override', () => {
  const { filePath, cleanup } = createFixtureDir('{}');
  try {
    const prev = process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
    process.env.SITE_INTELLIGENCE_INVENTORY_PATH = filePath;
    try {
      assert.equal(defaultInventoryPath(), filePath);
    } finally {
      if (prev === undefined) delete process.env.SITE_INTELLIGENCE_INVENTORY_PATH;
      else process.env.SITE_INTELLIGENCE_INVENTORY_PATH = prev;
    }
  } finally {
    cleanup();
  }
});
