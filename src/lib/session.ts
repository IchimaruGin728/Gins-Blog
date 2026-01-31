import type { User, Session } from '../../db/schema';
import { users, sessions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

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
	userAgent?: string,
	ipAddress?: string,
    location?: { city?: string, country?: string }
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const now = Date.now();
	
	// Deduplication: Remove existing sessions from same device (same userAgent + ipAddress)
	if (userAgent && ipAddress) {
		const { and } = await import('drizzle-orm');
		const duplicateSessions = await db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					eq(sessions.userAgent, userAgent),
					eq(sessions.ipAddress, ipAddress)
				)
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
        country: location?.country || null,
        city: location?.city || null,
		createdAt: now,
		lastActive: now,
	};
	
    // Write-Through: Insert into DB
    await db.insert(sessions).values(session);
    
    // Write-Through: Cache in KV (TTL = Expiration)
    // We store the session object directly
    await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
        expiration: Math.floor(session.expiresAt / 1000)
    });
    
	return session;
}

export async function validateSessionToken(
	token: string,
	db: ReturnType<typeof getDb>,
	env: Env,
	request?: Request
): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    
    // 1. Check KV Cache (Fast Path)
    const cachedSessionStr = await env.GIN_KV.get(`session:${sessionId}`);
    if (cachedSessionStr) {
        const session = JSON.parse(cachedSessionStr) as Session;
        
        // Even if we hit cache, we might need to check freshness or user details if we want full strictness,
        // but for speed we trust KV until expiration.
        // However, we need the User object too.
        // We can cache the User with the Session or fetch User separately.
        // Let's modify the cache structure to include User ID or fetch User from KV too?
        // For simplicity and speed: Cache the *Validation Result* or just fetch User from D1?
        // Fetching User from D1 is fast enough if Session is valid? No, we want NO D1 hits if possible.
        // Let's stick to: KV check Session -> D1 check User (Primary Key lookup is fast).
        
        // Check Expiration
        if (Date.now() >= session.expiresAt) {
             await env.GIN_KV.delete(`session:${sessionId}`);
             await db.delete(sessions).where(eq(sessions.id, session.id));
             return { session: null, user: null };
        }
        
        // Legacy session check: if missing userAgent or ipAddress, try to update or invalidate
        if ((!session.userAgent || !session.ipAddress) && request) {
            const userAgent = request.headers.get('user-agent');
            const ipAddress = request.headers.get('cf-connecting-ip');
            
            if (userAgent && ipAddress) {
                // Update legacy session with current device info
                session.userAgent = userAgent;
                session.ipAddress = ipAddress;
                session.lastActive = Date.now();
                
                await db
                    .update(sessions)
                    .set({ 
                        userAgent: session.userAgent,
                        ipAddress: session.ipAddress,
                        lastActive: session.lastActive 
                    })
                    .where(eq(sessions.id, session.id));
                    
                await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
                    expiration: Math.floor(session.expiresAt / 1000)
                });
            } else {
                // Cannot update, invalidate this legacy session
                await env.GIN_KV.delete(`session:${sessionId}`);
                await db.delete(sessions).where(eq(sessions.id, session.id));
                return { session: null, user: null };
            }
        }
        
        // Refresh Logic (Slide Expiration) - Update KV and DB if needed
        if (Date.now() >= session.expiresAt - 1000 * 60 * 60 * 24 * 15) {
            session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
            session.lastActive = Date.now();
             // Update KV
            await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
                expiration: Math.floor(session.expiresAt / 1000)
            });
            // Async Update DB (Fire and forget? or await)
            await db
                .update(sessions)
                .set({ expiresAt: session.expiresAt, lastActive: session.lastActive })
                .where(eq(sessions.id, session.id));
        } else {
            // Just update lastActive without sliding expiration
            const now = Date.now();
            const lastActive = session.lastActive || 0;
            if (now - lastActive > 60000) { // Update if > 1 minute since last update
                session.lastActive = now;
                await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
                    expiration: Math.floor(session.expiresAt / 1000)
                });
                await db
                    .update(sessions)
                    .set({ lastActive: session.lastActive })
                    .where(eq(sessions.id, session.id));
            }
        }
        
        // Fetch User (Fast PK lookup)
        const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
        if(!user) return { session: null, user: null };
        
        return { session, user };
    }

    // 2. Cache Miss - Check DB
	const result = await db
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
        .get();

	if (!result) {
		return { session: null, user: null };
	}
	const { user, session } = result;
	if (Date.now() >= session.expiresAt) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}
	
	// Legacy session check for DB path too
	if ((!session.userAgent || !session.ipAddress) && request) {
		const userAgent = request.headers.get('user-agent');
		const ipAddress = request.headers.get('cf-connecting-ip');
		
		if (userAgent && ipAddress) {
			session.userAgent = userAgent;
			session.ipAddress = ipAddress;
			session.lastActive = Date.now();
			
			await db
				.update(sessions)
				.set({ 
					userAgent: session.userAgent,
					ipAddress: session.ipAddress,
					lastActive: session.lastActive 
				})
				.where(eq(sessions.id, session.id));
		} else {
			// Cannot update, invalidate this legacy session
			await db.delete(sessions).where(eq(sessions.id, session.id));
			return { session: null, user: null };
		}
	}
	
	if (Date.now() >= session.expiresAt - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
		session.lastActive = Date.now();
		await db
			.update(sessions)
			.set({
				expiresAt: session.expiresAt,
				lastActive: session.lastActive
			})
			.where(eq(sessions.id, session.id));
	} else {
		const now = Date.now();
		const lastActive = session.lastActive || 0;
		if (now - lastActive > 60000) {
			session.lastActive = now;
			 await db
				.update(sessions)
				.set({ lastActive: session.lastActive })
				.where(eq(sessions.id, session.id));
		}
	}
    
    // Hydrate KV Cache
    await env.GIN_KV.put(`session:${sessionId}`, JSON.stringify(session), {
        expiration: Math.floor(session.expiresAt / 1000)
    });
    
	return { session, user };
}

export async function invalidateSession(sessionId: string, db: ReturnType<typeof getDb>, env: Env): Promise<void> {
    await env.GIN_KV.delete(`session:${sessionId}`);
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };
