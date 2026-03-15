import type { CfProperties } from "@cloudflare/workers-types";
import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { and, eq } from "drizzle-orm";
import type { Session, User } from "../../db/schema";
import { sessions, users } from "../../db/schema";
import type { getDb } from "./db";

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(
	token: string,
	userId: string,
	db: ReturnType<typeof getDb>,
	env: Env,
	request: Request,
	deviceInfo?: {
		screenResolution?: string;
		deviceMemory?: number;
		cpuCores?: number;
		connectionType?: string;
	},
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const now = Date.now();

	// Extract comprehensive metadata
	const userAgent = request.headers.get("User-Agent") || undefined;
	const ipAddress = request.headers.get("CF-Connecting-IP") || undefined;
	const cf = (request as Request & { cf?: CfProperties }).cf;
	const getCfString = (value: unknown): string | null =>
		typeof value === "string" ? value : null;
	const getCfNumber = (value: unknown): number | null =>
		typeof value === "number" ? value : null;

	// Deduplication: Remove existing sessions from same device (same userAgent + ipAddress)
	if (userAgent && ipAddress) {
		const duplicateSessions = await db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					eq(sessions.userAgent, userAgent),
					eq(sessions.ipAddress, ipAddress),
				),
			)
			.all();

		// Delete duplicate sessions from DB and KV
		for (const dup of duplicateSessions) {
			await db.delete(sessions).where(eq(sessions.id, dup.id));
			await env.GIN_KV.delete(`session:${dup.id}`);
		}
	}

	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: now + 1000 * 60 * 60 * 24 * 30,
		userAgent: userAgent || null,
		ipAddress: ipAddress || null,

		// Basic Geo
		country: getCfString(cf?.country),
		city: getCfString(cf?.city),

		// Network & ISP
		asn: getCfNumber(cf?.asn),
		asOrganization: getCfString(cf?.asOrganization),
		colo: getCfString(cf?.colo),
		continent: getCfString(cf?.continent),
		timezone: getCfString(cf?.timezone),

		// Enhanced Geolocation
		latitude: getCfString(cf?.latitude),
		longitude: getCfString(cf?.longitude),
		postalCode: getCfString(cf?.postalCode),
		region: getCfString(cf?.region),
		regionCode: getCfString(cf?.regionCode),

		// Connection Details
		httpProtocol: getCfString(cf?.httpProtocol),
		tlsVersion: getCfString(cf?.tlsVersion),
		tlsCipher: getCfString(cf?.tlsCipher),
		clientTcpRtt: getCfNumber(cf?.clientTcpRtt),

		// Security & Trust
		clientTrustScore: null,
		isEUCountry: cf?.isEUCountry === true ? 1 : 0,

		// Device Information (client-collected)
		screenResolution: deviceInfo?.screenResolution || null,
		deviceMemory: deviceInfo?.deviceMemory || null,
		cpuCores: deviceInfo?.cpuCores || null,
		connectionType: deviceInfo?.connectionType || null,
		osVerified: null,

		createdAt: now,
		lastActive: now,
	};

	// Write-Through: Insert into DB
	await db.insert(sessions).values(session);

	// Write-Through: Cache in KV (TTL = Expiration)
	// We store the session object directly
	await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
		expiration: Math.floor(session.expiresAt / 1000),
	});

	return session;
}

// Backfill missing userAgent/ipAddress from legacy sessions, returns false if session should be invalidated
async function hydrateLegacySession(
	session: Session,
	sessionId: string,
	request: Request,
	db: ReturnType<typeof getDb>,
	env: Env,
): Promise<boolean> {
	const userAgent = request.headers.get("user-agent");
	const ipAddress = request.headers.get("cf-connecting-ip");

	if (!userAgent || !ipAddress) return false;

	session.userAgent = userAgent;
	session.ipAddress = ipAddress;
	session.lastActive = Date.now();

	await db
		.update(sessions)
		.set({ userAgent, ipAddress, lastActive: session.lastActive })
		.where(eq(sessions.id, session.id));
	await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
		expiration: Math.floor(session.expiresAt / 1000),
	});
	return true;
}

// Slide session expiration or bump lastActive, then sync to KV + DB
async function refreshSession(
	session: Session,
	sessionId: string,
	db: ReturnType<typeof getDb>,
	env: Env,
): Promise<void> {
	const now = Date.now();

	if (now >= session.expiresAt - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = now + 1000 * 60 * 60 * 24 * 30;
		session.lastActive = now;
		await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
			expiration: Math.floor(session.expiresAt / 1000),
		});
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt, lastActive: session.lastActive })
			.where(eq(sessions.id, session.id));
	} else if (now - (session.lastActive || 0) > 60000) {
		session.lastActive = now;
		await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
			expiration: Math.floor(session.expiresAt / 1000),
		});
		await db
			.update(sessions)
			.set({ lastActive: session.lastActive })
			.where(eq(sessions.id, session.id));
	}
}

export async function validateSessionToken(
	token: string,
	db: ReturnType<typeof getDb>,
	env: Env,
	request?: Request,
): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	// 1. Check KV Cache (Fast Path) — KV check Session -> D1 check User
	const cachedSessionStr = await env.GIN_KV.get(`session:${sessionId}`);
	if (cachedSessionStr) {
		const session = JSON.parse(cachedSessionStr) as Session;

		if (Date.now() >= session.expiresAt) {
			await env.GIN_KV.delete(`session:${sessionId}`);
			await db.delete(sessions).where(eq(sessions.id, session.id));
			return { session: null, user: null };
		}

		if ((!session.userAgent || !session.ipAddress) && request) {
			const ok = await hydrateLegacySession(session, sessionId, request, db, env);
			if (!ok) {
				await env.GIN_KV.delete(`session:${sessionId}`);
				await db.delete(sessions).where(eq(sessions.id, session.id));
				return { session: null, user: null };
			}
		}

		await refreshSession(session, sessionId, db, env);

		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId))
			.get();
		if (!user) return { session: null, user: null };

		return { session, user };
	}

	// 2. Cache Miss - Check DB
	const result = await db
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.get();

	if (!result) return { session: null, user: null };

	const { user, session } = result;

	if (Date.now() >= session.expiresAt) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	if ((!session.userAgent || !session.ipAddress) && request) {
		const ok = await hydrateLegacySession(session, sessionId, request, db, env);
		if (!ok) {
			await db.delete(sessions).where(eq(sessions.id, session.id));
			return { session: null, user: null };
		}
	}

	await refreshSession(session, sessionId, db, env);

	// Hydrate KV Cache on DB hit
	await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
		expiration: Math.floor(session.expiresAt / 1000),
	});

	return { session, user };
}

export async function invalidateSession(
	sessionId: string,
	db: ReturnType<typeof getDb>,
	env: Env,
): Promise<void> {
	await env.GIN_KV.delete(`session:${sessionId}`);
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };
