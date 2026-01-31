import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { type Session, sessions } from "../../../db/schema";
import { getDb } from "../../lib/db";

export const GET: APIRoute = async ({ locals, request, cookies }) => {
	const { user } = locals;
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const db = getDb(locals.runtime.env);

	// Get all sessions for this user
	const userSessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.userId, user.id))
		.all();

	// Get current session ID from cookie
	const sessionCookie = cookies.get("session");
	const currentSessionId = sessionCookie?.value
		? import("@oslojs/encoding").then((m) =>
				import("@oslojs/crypto/sha2").then((c) =>
					m.encodeHexLowerCase(
						c.sha256(new TextEncoder().encode(sessionCookie.value)),
					),
				),
			)
		: null;

	const currentId = await currentSessionId;

	// Parse user agents for display
	const sessionsWithInfo = userSessions.map((session: Session) => {
		const ua = session.userAgent || "";
		let browser = "Unknown";
		let os = "Unknown";

		// Simple UA parsing
		if (ua.includes("Chrome")) browser = "Chrome";
		else if (ua.includes("Safari") && !ua.includes("Chrome"))
			browser = "Safari";
		else if (ua.includes("Firefox")) browser = "Firefox";
		else if (ua.includes("Edge")) browser = "Edge";

		if (ua.includes("Windows")) os = "Windows";
		else if (ua.includes("Mac")) os = "macOS";
		else if (ua.includes("Linux")) os = "Linux";
		else if (ua.includes("Android")) os = "Android";
		else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
			os = "iOS";

		return {
			id: session.id,
			browser,
			os,
			createdAt: session.createdAt,
			lastActive: session.lastActive,
			isCurrent: session.id === currentId,
			// Only include sensitive data for admin
			...(request.url.includes("/admin")
				? {
						ipAddress: session.ipAddress,
						userAgent: session.userAgent,
					}
				: {}),
		};
	});

	return new Response(JSON.stringify(sessionsWithInfo), {
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE: APIRoute = async ({ locals, request, cookies }) => {
	const { user } = locals;
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const url = new URL(request.url);
	const sessionId = url.searchParams.get("id");

	if (!sessionId) {
		return new Response(JSON.stringify({ error: "Session ID required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const db = getDb(locals.runtime.env);

	// Verify this session belongs to the user
	const session = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId))
		.get();

	if (!session || session.userId !== user.id) {
		return new Response(JSON.stringify({ error: "Session not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Don't allow deleting current session
	const sessionCookie = cookies.get("session");
	if (sessionCookie?.value) {
		const { encodeHexLowerCase } = await import("@oslojs/encoding");
		const { sha256 } = await import("@oslojs/crypto/sha2");
		const currentSessionId = encodeHexLowerCase(
			sha256(new TextEncoder().encode(sessionCookie.value)),
		);

		if (sessionId === currentSessionId) {
			return new Response(
				JSON.stringify({ error: "Cannot revoke current session" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}

	// Delete session from DB and KV
	await db.delete(sessions).where(eq(sessions.id, sessionId));
	await locals.runtime.env.GIN_KV.delete(`session:${sessionId}`);

	return new Response(JSON.stringify({ success: true }), {
		headers: { "Content-Type": "application/json" },
	});
};
