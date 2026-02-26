import { zValidator } from "@hono/zod-validator";
import type { APIRoute } from "astro";
import { and, desc, eq, isNotNull, like, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import * as schema from "../../../db/schema";
import { posts } from "../../../db/schema";
import { getDb } from "../../lib/db";
import { deletePostVector, insertPostVector } from "../../lib/vectorize";

const app = new Hono().basePath("/api");

app.post(
	"/posts",
	zValidator(
		"form",
		z.object({
			id: z.string().optional(),
			title: z.string().min(1),
			content: z.string().min(1),
			slug: z.string().min(1),
			publishedAt: z.string().optional(), // Receive as string from datetime-local
			updatedAt: z.string().optional(), // Receive as string from datetime-local
		}),
	),
	async (c) => {
		const userId = c.req.header("X-User-Id");
		if (!userId) return c.json({ error: "Unauthorized" }, 401);

		const {
			id: existingId,
			title,
			content,
			slug,
			publishedAt,
			updatedAt,
		} = c.req.valid("form");
		const env = c.env as Env;

		const db = getDb(env);

		const id = existingId || crypto.randomUUID();
		const timestamp = publishedAt
			? new Date(publishedAt).getTime()
			: Date.now();
		const updateTimestamp = updatedAt
			? new Date(updatedAt).getTime()
			: Date.now();

		await db
			.insert(posts)
			.values({
				id,
				title,
				slug,
				content,
				createdAt: Date.now(), // Only valid for insert, but ignored on update if we don't set it
				updatedAt: updateTimestamp,
				publishedAt: timestamp,
			})
			.onConflictDoUpdate({
				target: posts.id,
				set: {
					title,
					slug,
					content,
					updatedAt: updateTimestamp,
					publishedAt: timestamp,
				},
			});

		try {
			const CACHE_KEY = `post:${slug}`;
			const postData = {
				id,
				title,
				slug,
				content,
				createdAt: Date.now(),
				updatedAt: updateTimestamp,
				publishedAt: timestamp,
			};
			await env.GINS_CACHE.put(CACHE_KEY, JSON.stringify(postData), {
				expirationTtl: 60 * 60 * 24 * 7, // 7 Days Cache
			});
		} catch (e) {
			console.error("KV Cache Update failed", e);
		}

		try {
			await insertPostVector(env.AI, env.VECTOR_INDEX, {
				id,
				title,
				content,
			});
		} catch (e) {
			console.error("AI Indexing failed", e);
		}

		return c.json({ success: true, id });
	},
);

app.get("/posts/:slug", async (c) => {
	const db = getDb(c.env as Env);
	const slug = c.req.param("slug");
	const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();

	if (!post) return c.json({ error: "Post not found" }, 404);
	return c.json(post);
});

app.get("/posts", async (c) => {
	const db = getDb(c.env as Env);
	const limitParam = c.req.query("limit");

	let query = db
		.select({
			id: posts.id,
			title: posts.title,
			slug: posts.slug,
			publishedAt: posts.publishedAt,
			updatedAt: posts.updatedAt,
		})
		.from(posts)
		.orderBy(desc(posts.publishedAt));

	if (limitParam !== "all") {
		query = (query as any).limit(limitParam ? parseInt(limitParam, 10) : 20);
	}

	const allPosts = await query.all();
	return c.json(allPosts);
});

app.get("/search", async (c) => {
	const db = getDb(c.env as Env);
	const query = c.req.query("q");

	if (!query) return c.json([]);

	const qLower = query.toLowerCase();
	const wildcardQuery = `%${qLower}%`;

	const matches = await db
		.select({
			title: posts.title,
			slug: posts.slug,
		})
		.from(posts)
		.where(
			and(
				isNotNull(posts.publishedAt),
				or(
					like(posts.title, wildcardQuery),
					like(posts.content, wildcardQuery),
				),
			),
		)
		.limit(5);

	const formattedMatches = matches.map((p) => ({
		metadata: { title: p.title, slug: p.slug },
		score: p.title.toLowerCase().includes(qLower) ? 1.0 : 0.5,
	}));

	return c.json(formattedMatches);
});

app.patch(
	"/posts/:slug/status",
	zValidator(
		"json",
		z.object({
			action: z.enum(["publish", "unpublish"]),
		}),
	),
	async (c) => {
		const db = getDb(c.env as Env);
		const slug = c.req.param("slug");
		const { action } = c.req.valid("json");

		try {
			await db
				.update(posts)
				.set({ publishedAt: action === "publish" ? Date.now() : null })
				.where(eq(posts.slug, slug));

			const env = c.env as Env;
			await env.GINS_CACHE.delete(`post:${slug}`);

			return c.json({ success: true, status: action });
		} catch (_e) {
			return c.json({ error: "Failed to update status" }, 500);
		}
	},
);

app.delete("/posts/:slug", async (c) => {
	const db = getDb(c.env as Env);
	const slug = c.req.param("slug");
	const env = c.env as Env;

	try {
		const post = await db
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.slug, slug))
			.get();
		const id = post?.id;

		await db.delete(posts).where(eq(posts.slug, slug));

		await env.GINS_CACHE.delete(`post:${slug}`);

		if (id) {
			try {
				await deletePostVector(env.VECTOR_INDEX, id);
			} catch (e) {
				console.error("Vector cleanup failed", e);
			}
		}

		return c.json({ success: true });
	} catch (_e) {
		return c.json({ error: "Failed to delete post" }, 500);
	}
});

app.post(
	"/music",
	zValidator(
		"form",
		z.object({
			title: z.string(),
			artist: z.string(),
			url: z.string(),
			cover: z.string().optional(),
		}),
	),
	async (c) => {
		const userId = c.req.header("X-User-Id");
		if (!userId) return c.json({ error: "Unauthorized" }, 401);

		const { title, artist, url, cover } = c.req.valid("form");
		const db = getDb(c.env as Env);

		const id = crypto.randomUUID();
		await db.insert(schema.music).values({
			id,
			title,
			artist,
			url,
			cover,
			createdAt: Date.now(),
		});

		return c.json({ success: true, id });
	},
);

app.get("/music", async (c) => {
	const db = getDb(c.env as Env);
	const tracks = await db
		.select()
		.from(schema.music)
		.orderBy(desc(schema.music.createdAt))
		.all();
	return c.json(tracks);
});

export type AppType = typeof app;

import { getZeroTrustUser } from "../../lib/zerotrust";

export const ALL: APIRoute = async (context) => {
	const env = context.locals.runtime.env;
	const request = new Request(context.request);

	if (context.locals.user) {
		request.headers.set("X-User-Id", context.locals.user.id);
	} else {
		const ztUser = getZeroTrustUser(context.request);
		if (ztUser) {
			request.headers.set("X-User-Id", ztUser.id);
		}
	}

	return app.fetch(request, env);
};
