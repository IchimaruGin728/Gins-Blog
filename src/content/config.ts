import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		tags: z.array(z.string()).optional(),
	}),
});

const docs = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		order: z.number().optional(), // For sorting sidebar items
	}),
});

const docsZh = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs-zh" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		order: z.number().optional(), // For sorting sidebar items
	}),
});

export const collections = { blog, docs, docsZh };
