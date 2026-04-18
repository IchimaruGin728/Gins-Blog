import { env as workerEnv } from "cloudflare:workers";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { desc, lte } from "drizzle-orm";
import { posts } from "../../db/schema";
import { getDb } from "../lib/db";

export async function GET(context: APIContext) {
	const db = getDb(workerEnv as Env);

	let blogPosts: (typeof posts.$inferSelect)[] = [];
	try {
		blogPosts = await db
			.select()
			.from(posts)
			.where(lte(posts.publishedAt, Date.now()))
			.orderBy(desc(posts.publishedAt))
			.all();
	} catch (error) {
		console.error("Failed to build RSS feed:", error);
	}

	return rss({
		title: "Gin's Blog",
		description:
			"Full Stack Development, Tech, and Life observations from Ichimaru Gin.",
		site: context.site!,
		items: blogPosts.map((post) => ({
			title: post.title,
			pubDate: new Date(post.publishedAt || post.createdAt),
			description: post.content ? `${post.content.substring(0, 200)}...` : "",
			link: `/blog/${post.slug}`,
		})),
		customData: `<language>en-SG</language>`,
	});
}
