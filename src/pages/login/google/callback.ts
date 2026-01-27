import { getGoogle } from '../../../lib/auth';
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
        console.log("Validating Google code...");
		const tokens: OAuth2Tokens = await getGoogle(locals.runtime.env).validateAuthorizationCode(code, codeVerifier);
        console.log("Tokens received:", tokens.accessToken ? "Present" : "Missing");

        let googleUser: GoogleUser;
        try {
            console.log("Fetching Google user...");
            const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`
                }
            });
            googleUser = await googleUserResponse.json();
            console.log("Google User fetched:", googleUser.name);
        } catch (fetchError: any) {
             throw new Error(`Failed to fetch Google user: ${fetchError.message}`);
        }

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
            });
		}

		console.log("Creating session, userId:", userId);
		const token = generateSessionToken();
		const session = await createSession(token, userId, db, locals.runtime.env);
		
        console.log("Setting session cookie...");
        cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: import.meta.env.PROD,
			expires: new Date(session.expiresAt)
		});

		return redirect('/');
	} catch (e: any) {
        console.error(e);
		return new Response(JSON.stringify({
            error: e.message,
            stack: e.stack
        }, null, 2), {
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
