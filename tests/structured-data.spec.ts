import { expect, type Page, test } from '@playwright/test';

const ARTICLE = '/blog/250mm-trading-card-box/';
const UNRELATED_ARTICLE = '/blog/why-do-i-need-all-this-usb-and-sd-media-holder/';
const SPEAKING = '/speaking/';
const PORTFOLIO = '/portfolio/';
const SITE = 'https://ericcarlisle.com';

type JsonLdNode = Record<string, unknown> & {
  '@type': string;
  '@id': string;
};

type JsonLdGraph = {
  '@context': string;
  '@graph': JsonLdNode[];
};

async function readJsonLd(page: Page): Promise<JsonLdGraph> {
  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts).toHaveCount(1);
  const text = await scripts.textContent();
  expect(text).not.toBeNull();
  return JSON.parse(text ?? '') as JsonLdGraph;
}

function nodesOfType(graph: JsonLdGraph, type: string): JsonLdNode[] {
  return graph['@graph'].filter((node) => node['@type'] === type);
}

test('article JSON-LD preserves the existing graph and adds connected media nodes', async ({
  page,
}) => {
  await page.goto(ARTICLE);
  const graph = await readJsonLd(page);

  expect(graph['@context']).toBe('https://schema.org');
  expect(Object.keys(graph).filter((key) => key === '@context')).toHaveLength(1);

  for (const type of ['Person', 'WebSite', 'Blog', 'WebPage', 'BlogPosting', 'BreadcrumbList']) {
    expect(nodesOfType(graph, type)).toHaveLength(1);
  }

  const [person] = nodesOfType(graph, 'Person');
  const [webPage] = nodesOfType(graph, 'WebPage');
  const [blogPosting] = nodesOfType(graph, 'BlogPosting');
  const [video] = nodesOfType(graph, 'VideoObject');
  const [model] = nodesOfType(graph, '3DModel');

  expect(person['@id']).toBe(`${SITE}/#person`);
  expect(webPage['@id']).toBe(`${SITE}${ARTICLE}#webpage`);
  expect(blogPosting['@id']).toBe(`${SITE}${ARTICLE}#article`);
  expect((blogPosting.image as JsonLdNode)['@id']).toBe(`${SITE}${ARTICLE}#primaryimage`);
  expect((webPage.mainEntity as JsonLdNode)['@id']).toBe(blogPosting['@id']);
  expect((blogPosting.mainEntityOfPage as JsonLdNode)['@id']).toBe(webPage['@id']);
  expect((blogPosting.author as JsonLdNode)['@id']).toBe(person['@id']);
  expect((blogPosting.publisher as JsonLdNode)['@id']).toBe(person['@id']);
  expect((blogPosting.isPartOf as JsonLdNode)['@id']).toBe(`${SITE}/#blog`);
  expect((webPage.isPartOf as JsonLdNode)['@id']).toBe(`${SITE}/#website`);

  expect(nodesOfType(graph, 'VideoObject')).toHaveLength(1);
  expect(video).toMatchObject({
    '@id': `${SITE}${ARTICLE}#timelapse`,
    name: '250mm Trading Card Box Octolapse Timelapse',
    description: 'Octolapse timelapse of the 250mm trading card box being printed.',
    uploadDate: '2022-09-24',
    duration: 'PT18S',
    embedUrl: 'https://www.youtube-nocookie.com/embed/_tiRKn5gV28',
  });
  expect(video).not.toHaveProperty('contentUrl');
  expect(video.thumbnailUrl).toMatch(
    /^https:\/\/ericcarlisle\.com\/(?:_astro\/250mm-trading-card-box-timelapse\..+\.(?:jpg|webp)|@fs\/.+\/250mm-trading-card-box-timelapse\.jpg\?.+)$/,
  );
  expect(video.thumbnailUrl).not.toMatch(/youtube|ytimg\.com/);

  expect(nodesOfType(graph, '3DModel')).toHaveLength(1);
  expect(model).toMatchObject({
    '@id': `${SITE}${ARTICLE}#3d-model`,
    name: '250mm Trading Card Box 3D Model',
    description: 'Printable STL model of a 250mm trading card storage box.',
    contentUrl: `${SITE}/models/250mm-trading-card-box.stl`,
    encodingFormat: 'model/stl',
    creator: { '@id': `${SITE}/#person` },
  });

  expect((blogPosting.video as JsonLdNode)['@id']).toBe(video['@id']);
  expect(blogPosting.hasPart).toContainEqual({ '@id': model['@id'] });
});

test('page-specific media nodes are absent from unrelated article JSON-LD', async ({ page }) => {
  await page.goto(UNRELATED_ARTICLE);
  const graph = await readJsonLd(page);

  expect(nodesOfType(graph, 'VideoObject')).toHaveLength(0);
  expect(nodesOfType(graph, '3DModel')).toHaveLength(0);
  const [blogPosting] = nodesOfType(graph, 'BlogPosting');
  expect(blogPosting).not.toHaveProperty('video');
  expect(blogPosting).not.toHaveProperty('hasPart');
});

test('speaking JSON-LD connects its CollectionPage, ItemList, and four videos', async ({
  page,
}) => {
  await page.goto(SPEAKING);
  const graph = await readJsonLd(page);

  const [collectionPage] = nodesOfType(graph, 'CollectionPage');
  const [itemList] = nodesOfType(graph, 'ItemList');
  const videos = nodesOfType(graph, 'VideoObject');
  const events = nodesOfType(graph, 'Event');

  expect(collectionPage['@id']).toBe(`${SITE}${SPEAKING}#webpage`);
  expect((collectionPage.mainEntity as JsonLdNode)['@id']).toBe(`${SITE}${SPEAKING}#talks`);
  expect(itemList['@id']).toBe(`${SITE}${SPEAKING}#talks`);
  expect(itemList.numberOfItems).toBe(4);
  expect(itemList.itemListElement).toEqual([
    {
      '@type': 'ListItem',
      position: 1,
      item: { '@id': `${SITE}${SPEAKING}#video-cW4-WJq8WbE` },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: { '@id': `${SITE}${SPEAKING}#video-VAclokb-vsE` },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: { '@id': `${SITE}${SPEAKING}#video-qqBVjr0dabM` },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: { '@id': `${SITE}${SPEAKING}#video-WEB3UMzbIt0` },
    },
  ]);

  expect(videos).toHaveLength(4);
  for (const video of videos) {
    expect(video['@id']).toMatch(new RegExp(`^${SITE}${SPEAKING}#video-`));
    expect(video.thumbnailUrl).toMatch(
      /^https:\/\/ericcarlisle\.com\/(?:_astro\/talk-.+\.(?:jpg|webp)|@fs\/.+\/talk-.+\.jpg\?.+)$/,
    );
    expect(video.thumbnailUrl).not.toMatch(/youtube|ytimg\.com/);
    expect(video.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\//);
    expect(video.creator).toEqual({ '@id': `${SITE}/#person` });
    expect(video).not.toHaveProperty('contentUrl');
  }

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    name: 'CFE.dev Meetup 2024',
    startDate: '2024-09-10',
    url: 'https://cfe.dev/events/choose-your-adventure-astro/',
  });
});

test('portfolio JSON-LD does not duplicate speaking VideoObjects', async ({ page }) => {
  await page.goto(PORTFOLIO);
  const graph = await readJsonLd(page);

  expect(nodesOfType(graph, 'VideoObject')).toHaveLength(0);
  expect(nodesOfType(graph, 'ItemList')).toHaveLength(0);
});
