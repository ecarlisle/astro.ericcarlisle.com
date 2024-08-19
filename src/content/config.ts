import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		images: z.array(
			z.object({
				slug: z.string(),
				alt: z.string(),
			}),
		),
		tags: z.array(z.string()),
		draft: z.coerce.boolean(),
		ogimage: z.object({
	    alt: z.string(),
    	height: z.number(),
	    width: z.number(),
	    type: z.string(),
	    url: z.string(),
  	}),
	}),
});

export const collections = { posts };
