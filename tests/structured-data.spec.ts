import { expect, type Page, test } from '@playwright/test';

const ARTICLE = '/blog/250mm-trading-card-box/';
const UNRELATED_ARTICLE = '/blog/why-do-i-need-all-this-usb-and-sd-media-holder/';
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
    /^https:\/\/ericcarlisle\.com\/_astro\/250mm-trading-card-box-timelapse\..+\.(?:jpg|webp)$/,
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
