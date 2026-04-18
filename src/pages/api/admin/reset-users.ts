import { env as workerEnv } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { sessions, users } from "../../../../db/schema";
import { getDb } from "../../../lib/db";

export const POST: APIRoute = async () => {
	// Protected by Zero Trust middleware at /api/admin level (see src/middleware.ts)
	const db = getDb(workerEnv as Env);

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
