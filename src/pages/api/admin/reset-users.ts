import type { APIRoute } from "astro";
import { sessions, users } from "../../../../db/schema";
import { getDb } from "../../../lib/db";

export const POST: APIRoute = async ({ locals }) => {
	// Admin only
	const user = locals.user;
	if (!user || user.id !== "e948c115-a7cf-4571-9d2c-5ed43b96bb93") {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	const db = getDb(locals.runtime.env);

	try {
		// Delete all sessions first (foreign key constraint)
		await db.delete(sessions);

		// Delete all users
		await db.delete(users);

		return new Response(
			JSON.stringify({
				success: true,
				message: "All users and sessions deleted successfully",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: any) {
		console.error("Error deleting users:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to delete users",
				details: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
