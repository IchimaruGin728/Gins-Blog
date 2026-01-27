import type { APIRoute } from 'astro';
import { getDb } from '../lib/db';
import { posts } from '../../db/schema';

export const GET: APIRoute = async ({ locals }) => {
	const db = getDb(locals.runtime.env);
	
	// Fetch all published posts
	const allPosts = await db.select({
		slug: posts.slug,
		updatedAt: posts.updatedAt
	}).from(posts).all();
	
	const baseUrl = 'https://blog.ichimarugin728.com';
	
	// Generate XML sitemap
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<!-- Homepage -->
	<url>
		<loc>${baseUrl}/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	
	<!-- About Page -->
	<url>
		<loc>${baseUrl}/about</loc>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>
	
	<!-- Blog Posts -->
	${allPosts.map((post: { slug: string; updatedAt: number }) => `<url>
		<loc>${baseUrl}/blog/${post.slug}</loc>
		<lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.9</priority>
	</url>`).join('\n\t')}
</urlset>`.trim();

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
