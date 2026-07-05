import type { CollectionEntry } from 'astro:content';

export const PAGE_SIZE = 10;

export interface TagData {
  allTags: string[];
  tagCounts: Record<string, number>;
}

export function computeTagData(allPosts: CollectionEntry<'blog'>[]): TagData {
  const allTags = [...new Set(allPosts.flatMap((p) => p.data.tags ?? []))].sort();

  const tagCounts: Record<string, number> = {};

  allPosts.forEach((post) => {
    for (const tag of post.data.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  });

  return { allTags, tagCounts };
}

export async function getSortedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const { getCollection } = await import('astro:content');
  const allPosts = await getCollection('blog', ({ data }) => data.draft !== true);
  return allPosts.toSorted((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
