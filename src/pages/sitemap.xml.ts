import type { APIRoute } from "astro";
import { posts } from "../../db/schema";
import { getDb } from "../lib/db";

export const GET: APIRoute = async ({ locals }) => {
	const db = getDb(locals.runtime.env);

	// Fetch all published posts
	const allPosts = await db
		.select({
			slug: posts.slug,
			updatedAt: posts.updatedAt,
		})
		.from(posts)
		.all();

	const baseUrl = "https://blog.ichimarugin728.com";

	// Generate XML sitemap
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<!-- Homepage (EN) -->
	<url>
		<loc>${baseUrl}/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	<!-- Homepage (ZH) -->
	<url>
		<loc>${baseUrl}/zh/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	
	<!-- About Page (EN) -->
	<url>
		<loc>${baseUrl}/about</loc>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>
	<!-- About Page (ZH) -->
	<url>
		<loc>${baseUrl}/zh/about</loc>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>

    <!-- Blog Index (EN) -->
	<url>
		<loc>${baseUrl}/blog</loc>
		<changefreq>daily</changefreq>
		<priority>0.9</priority>
	</url>
    <!-- Blog Index (ZH) -->
	<url>
		<loc>${baseUrl}/zh/blog</loc>
		<changefreq>daily</changefreq>
		<priority>0.9</priority>
	</url>
	
	<!-- Blog Posts (EN & ZH) -->
	${allPosts
		.map((post: { slug: string; updatedAt: number }) => {
			const lastMod = new Date(post.updatedAt).toISOString();
			return `
    <url>
		<loc>${baseUrl}/blog/${post.slug}</loc>
		<lastmod>${lastMod}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.9</priority>
	</url>
    <url>
		<loc>${baseUrl}/zh/blog/${post.slug}</loc>
		<lastmod>${lastMod}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.9</priority>
	</url>`;
		})
		.join("\n")}
</urlset>`.trim();

	return new Response(sitemap, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
