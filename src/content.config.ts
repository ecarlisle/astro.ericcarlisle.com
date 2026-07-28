import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string().max(165),
        heroPrompt: z.string().optional(),
        draft: z.boolean().optional(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.optional(image()),
        coverAlt: z.string().optional(),
        tags: z.array(z.string()).optional(),
        socialTitle: z.string().max(60).optional(),
        socialDescription: z.string().max(200).optional(),
        socialImage: z.optional(image()),
        twitterHandle: z.string().optional(),
        video: z
          .object({
            name: z.string(),
            description: z.string(),
            thumbnail: image(),
            uploadDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            duration: z.string().regex(/^PT(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+S)?$/),
            embedUrl: z.url(),
          })
          .optional(),
        model3d: z
          .object({
            name: z.string(),
            description: z.string(),
            contentUrl: z.url(),
            encodingFormat: z.literal('model/stl'),
          })
          .optional(),
        share: z
          .object({
            enabled: z.boolean().default(true),
            networks: z.array(z.enum(['twitter', 'facebook', 'linkedin', 'bluesky'])).optional(),
            scheduledFor: z.coerce.date().optional(),
          })
          .optional(),
      })
      .superRefine((data, ctx) => {
        if (data.heroImage && !data.coverAlt) {
          ctx.addIssue({
            code: 'custom',
            message: 'coverAlt is required when heroImage is provided',
            path: ['coverAlt'],
          });
        }
      }),
});

export const collections = { blog };
