import { getDiscord } from '../../../lib/auth';
import { createSession, generateSessionToken, validateSessionToken } from '../../../lib/session';
import { getDb } from '../../../lib/db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import type { OAuth2Tokens } from 'arctic';

export const GET: APIRoute = async ({ request, cookies, locals, redirect }) => {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('discord_oauth_state')?.value ?? null;
    const codeVerifier = cookies.get('discord_code_verifier')?.value ?? null;

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		return new Response(null, {
			status: 400
		});
	}

	try {
        console.log("Validating Discord code...");
		const tokens: OAuth2Tokens = await getDiscord(locals.runtime.env).validateAuthorizationCode(code, codeVerifier);
        const accessToken = tokens.accessToken();
        console.log("Tokens received:", accessToken ? "Present" : "Missing");

        let discordUser: DiscordUser;
        try {
            console.log("Fetching Discord user...");
            const discordUserResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${accessToken.trim()}`
                }
            });
            discordUser = await discordUserResponse.json();
            console.log("Discord User fetched:", discordUser.username);
        } catch (fetchError: any) {
             throw new Error(`Failed to fetch Discord user: ${fetchError.message}`);
        }

		const db = getDb(locals.runtime.env);

		// Check if user is already logged in (linking a new provider)
		const existingSessionToken = cookies.get('session')?.value;
		let currentUserId: string | null = null;
		
		if (existingSessionToken) {
			const sessionResult = await validateSessionToken(existingSessionToken, db, locals.runtime.env);
			if (sessionResult.session && sessionResult.user) {
				currentUserId = sessionResult.user.id;
				console.log("User is already logged in, linking Discord account to user:", currentUserId);
			}
		}

		// Check if this Discord account is already linked to a user
		const existingUser = await db.select().from(users).where(eq(users.discordId, discordUser.id)).get();

		let userId = "";

		if (currentUserId) {
			// User is logged in - link Discord to their current account
			if (existingUser && existingUser.id !== currentUserId) {
				throw new Error("This Discord account is already linked to another user account.");
			}
			
			// Update current user with Discord ID
			await db.update(users)
				.set({ 
					discordId: discordUser.id,
					username: discordUser.username,
					avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
				})
				.where(eq(users.id, currentUserId));
			
			userId = currentUserId;
			console.log("Discord account linked to existing user:", userId);
		} else if (existingUser) {
			// Not logged in, but Discord account exists - log in as that user
			userId = existingUser.id;
			console.log("Logging in as existing Discord user:", userId);
		} else {
			// Not logged in, no existing account - create new user
			userId = crypto.randomUUID();
			await db.insert(users).values({
				id: userId,
				discordId: discordUser.id,
				username: discordUser.username,
				avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
			});
			console.log("Created new user with Discord:", userId);
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

interface DiscordUser {
	id: string;
	username: string;
    avatar: string;
    email: string;
}
