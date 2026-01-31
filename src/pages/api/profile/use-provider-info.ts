import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { users } from "../../../../db/schema";
import { getDb } from "../../../lib/db";

export const POST: APIRoute = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const db = getDb(locals.runtime.env);

	try {
		const body = await request.json();
		const { provider } = body as {
			provider: "github" | "google" | "discord" | "custom";
		};

		// Fetch current user data
		const currentUser = await db
			.select()
			.from(users)
			.where(eq(users.id, user.id))
			.get();

		if (!currentUser) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		let newUsername = currentUser.username;
		let newAvatar = currentUser.avatar;

		// Set username and avatar based on provider
		switch (provider) {
			case "github":
				if (!currentUser.githubUsername) {
					return new Response(
						JSON.stringify({ error: "GitHub account not linked" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
				newUsername = currentUser.githubUsername;
				newAvatar = currentUser.githubAvatar;
				break;

			case "google":
				if (!currentUser.googleUsername) {
					return new Response(
						JSON.stringify({ error: "Google account not linked" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
				newUsername = currentUser.googleUsername;
				newAvatar = currentUser.googleAvatar;
				break;

			case "discord":
				if (!currentUser.discordUsername) {
					return new Response(
						JSON.stringify({ error: "Discord account not linked" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
				newUsername = currentUser.discordUsername;
				newAvatar = currentUser.discordAvatar;
				break;

			case "custom":
				// Keep current username and avatar (user can edit manually)
				// Do nothing, just return success
				return new Response(
					JSON.stringify({
						success: true,
						message:
							"Switched to custom mode. You can now edit your profile manually.",
						username: newUsername,
						avatar: newAvatar,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
		}

		// Update user with selected provider info
		await db
			.update(users)
			.set({
				username: newUsername,
				avatar: newAvatar,
			})
			.where(eq(users.id, user.id));

		return new Response(
			JSON.stringify({
				success: true,
				username: newUsername,
				avatar: newAvatar,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: any) {
		console.error("Error switching provider info:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to switch provider info",
				details: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
