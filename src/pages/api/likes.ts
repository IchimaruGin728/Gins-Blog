import { env as workerEnv } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";
import { likes } from "../../../db/schema";
import { getDb } from "../../lib/db";

export const POST: APIRoute = async ({ request, locals }) => {
	const env = workerEnv as Env;
	const user = locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		const body = (await request.json()) as any;
		const { commentId, value } = body; // value: 1 = like, 0 = remove

		if (!commentId || (value !== 0 && value !== 1)) {
			return new Response(
				JSON.stringify({ error: "commentId and value (0 or 1) are required" }),
				{ status: 400 },
			);
		}

		const db = getDb(env);

		if (value === 0) {
			// Remove like
			await db
				.delete(likes)
				.where(and(eq(likes.userId, user.id), eq(likes.commentId, commentId)));
		} else {
			// Add like (upsert if supported or check exist)
			// SQLite Drizzle upsert: .onConflictDoNothing()
			await db
				.insert(likes)
				.values({
					userId: user.id,
					commentId,
					value: 1,
				})
				.onConflictDoNothing();
		}

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Server Error" }), {
			status: 500,
		});
	}
};
