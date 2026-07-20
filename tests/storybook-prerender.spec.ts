import { expect, test } from '@playwright/test';
// biome-ignore lint/style/useNodejsImportProtocol: astro check doesn't recognize node: protocol without @types/node
import { readFileSync } from 'fs';

test('every component story in index.json has prerendered HTML', () => {
  const indexPath = 'storybook-static/index.json';
  const prerenderPath = 'storybook-static/astro-prerendered-stories.json';

  const idx = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const prerendered = JSON.parse(readFileSync(prerenderPath, 'utf-8'));

  const entries = idx.entries || {};

  // Collect Astro component stories (those with .astro componentPath)
  // Foundation/documentation stories without a component are excluded.
  const astroStories: { id: string; title: string }[] = [];

  for (const [id, entry] of Object.entries(entries)) {
    const e = entry as { type?: string; componentPath?: string; title?: string };
    if (e.type === 'story' && e.componentPath?.endsWith('.astro')) {
      astroStories.push({ id, title: e.title || id });
    }
  }

  const missing: { id: string; title: string }[] = [];

  for (const story of astroStories) {
    if (!prerendered[story.id]) {
      missing.push(story);
    }
  }

  if (missing.length > 0) {
    console.log(`\n❌ ${missing.length} stories missing prerendered HTML:\n`);
    for (const m of missing) {
      console.log(`  - ${m.id} (${m.title})`);
    }
  } else {
    console.log(`\n✅ All ${astroStories.length} Astro component stories have prerendered HTML`);
  }

  expect(missing).toEqual([]);
});
