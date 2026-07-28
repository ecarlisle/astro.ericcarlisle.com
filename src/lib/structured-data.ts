import type { ImageMetadata } from 'astro';

export type ArticleVideoMetadata = {
  name: string;
  description: string;
  thumbnail: ImageMetadata;
  uploadDate: string;
  duration: string;
  embedUrl: string;
};

export type ArticleModelMetadata = {
  name: string;
  description: string;
  contentUrl: string;
  encodingFormat: 'model/stl';
};

export type ResolvedArticleVideoMetadata = Omit<ArticleVideoMetadata, 'thumbnail'> & {
  thumbnailUrl: string;
};
