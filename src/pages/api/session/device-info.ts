import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { sessions } from "../../../../db/schema";
import { getDb } from "../../../lib/db";

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		if (!locals.user || !locals.session) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const env = locals.runtime.env;
		const db = getDb(env);
		const currentSession = locals.session;

		// 2. Parse Body
		const body = (await request.json()) as {
			screenResolution?: string;
			deviceMemory?: string;
			cpuCores?: string;
			connectionType?: string;
			os?: string;
		};
		const { screenResolution, deviceMemory, cpuCores, connectionType, os } =
			body;

		// 3. Update Session in DB
		await db
			.update(sessions)
			.set({
				screenResolution: screenResolution || null,
				deviceMemory: deviceMemory ? parseInt(deviceMemory, 10) : null,
				cpuCores: cpuCores ? parseInt(cpuCores, 10) : null,
				connectionType: connectionType || null,
				osVerified: os || null,
			})
			.where(eq(sessions.id, currentSession.id));

		// 4. Update KV Cache (important to keep consistent)
		// We need to re-fetch or patch the session object
		const updatedSession = {
			...currentSession,
			screenResolution: screenResolution || null,
			deviceMemory: deviceMemory ? parseInt(deviceMemory, 10) : null,
			cpuCores: cpuCores ? parseInt(cpuCores, 10) : null,
			connectionType: connectionType || null,
			osVerified: os || null,
		};

		await env.GIN_KV.put(
			`session:${currentSession.id}`,
			JSON.stringify(updatedSession),
			{
				expiration: Math.floor(currentSession.expiresAt / 1000),
			},
		);

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (e) {
		console.error("Failed to update device info:", e);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};
