import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { sessions } from "../../../../db/schema";
import { getDb } from "../../../lib/db";
import { validateSessionToken } from "../../../lib/session";

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const env = locals.runtime.env;
		const db = getDb(env);

		// 1. Validate Session
		const cookieHeader = request.headers.get("Cookie");
		const sessionId = parseCookie(cookieHeader, "auth_session");

		if (!sessionId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const validation = await validateSessionToken(sessionId, db, env);
		if (!validation.session) {
			return new Response(JSON.stringify({ error: "Invalid session" }), {
				status: 401,
			});
		}

		// 2. Parse Body
		const body = (await request.json()) as {
			screenResolution?: string;
			deviceMemory?: string;
			cpuCores?: string;
			connectionType?: string;
		};
		const { screenResolution, deviceMemory, cpuCores, connectionType } = body;

		// 3. Update Session in DB
		await db
			.update(sessions)
			.set({
				screenResolution: screenResolution || null,
				deviceMemory: deviceMemory ? parseInt(deviceMemory, 10) : null,
				cpuCores: cpuCores ? parseInt(cpuCores, 10) : null,
				connectionType: connectionType || null,
			})
			.where(eq(sessions.id, validation.session.id));

		// 4. Update KV Cache (important to keep consistent)
		// We need to re-fetch or patch the session object
		const updatedSession = {
			...validation.session,
			screenResolution: screenResolution || null,
			deviceMemory: deviceMemory ? parseInt(deviceMemory, 10) : null,
			cpuCores: cpuCores ? parseInt(cpuCores, 10) : null,
			connectionType: connectionType || null,
		};

		await env.GIN_KV.put(
			`session:${validation.session.id}`,
			JSON.stringify(updatedSession),
			{
				expiration: Math.floor(validation.session.expiresAt / 1000),
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

function parseCookie(header: string | null, name: string): string | null {
	if (!header) return null;
	const parts = header.split(";");
	for (const part of parts) {
		const [key, value] = part.trim().split("=");
		if (key === name) return value;
	}
	return null;
}
