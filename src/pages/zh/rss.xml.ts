import { env as workerEnv } from "cloudflare:workers";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { desc, lte } from "drizzle-orm";
import { posts } from "../../../db/schema";
import { getDb } from "../../lib/db";

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
		console.error("Failed to build ZH RSS feed:", error);
	}

	return rss({
		title: "Gin的博客",
		description: "全栈开发、技术探索与生活随笔。",
		site: context.site!,
		items: blogPosts.map((post) => ({
			title: post.title,
			pubDate: new Date(post.publishedAt || post.createdAt),
			description: post.content ? `${post.content.substring(0, 200)}...` : "",
			link: `/zh/blog/${post.slug}`,
		})),
		customData: `<language>zh</language>`,
	});
}
