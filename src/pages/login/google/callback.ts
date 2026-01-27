import { google } from '../../../lib/auth';
import { createSession, generateSessionToken } from '../../../lib/session';
import { getDb } from '../../../lib/db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import type { OAuth2Tokens } from 'arctic';

export const GET: APIRoute = async ({ request, cookies, locals, redirect }) => {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state')?.value ?? null;
	const codeVerifier = cookies.get('google_code_verifier')?.value ?? null;

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens: OAuth2Tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const googleUser: GoogleUser = await googleUserResponse.json();

		const db = getDb(locals.runtime.env);

		const existingUser = await db.select().from(users).where(eq(users.googleId, googleUser.sub)).get();

		let userId = "";

		if (existingUser) {
			userId = existingUser.id;
		} else {
            // Create user
            userId = crypto.randomUUID();
            await db.insert(users).values({
                id: userId,
                googleId: googleUser.sub,
                username: googleUser.name,
                avatar: googleUser.picture,
                // We handle potential username collisions next time or just append random
            });
		}

		const token = generateSessionToken();
		const session = await createSession(token, userId, db, locals.runtime.env);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: import.meta.env.PROD,
			expires: new Date(session.expiresAt)
		});

		return redirect('/');
	} catch (e) {
        console.error(e);
		return new Response(null, {
			status: 500
		});
	}
};

interface GoogleUser {
	sub: string;
	name: string;
    picture: string;
    email: string;
}
