import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { users } from "../../../db/schema";
import { getDb } from "../../lib/db";

export const POST: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	try {
		const body = (await request.json()) as any;
		const { username, bio, twitter, github, avatar_url } = body;

		const db = getDb(locals.runtime.env);

		const socialLinks = JSON.stringify({
			twitter: twitter || undefined,
			github: github || undefined,
		});

		await db
			.update(users)
			.set({
				username: username || undefined,
				bio: bio || undefined,
				avatar: avatar_url || undefined, // Only update if new url provided
				socialLinks: socialLinks,
			})
			.where(eq(users.id, user.id));

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};
