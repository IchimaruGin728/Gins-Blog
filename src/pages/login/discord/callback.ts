import { getDiscord } from '../../../lib/auth';
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
	const storedState = cookies.get('discord_oauth_state')?.value ?? null;
    const codeVerifier = cookies.get('discord_code_verifier')?.value ?? null;

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens: OAuth2Tokens = await getDiscord(locals.runtime.env).validateAuthorizationCode(code, codeVerifier);
		const discordUserResponse = await fetch('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const discordUser: DiscordUser = await discordUserResponse.json();

		const db = getDb(locals.runtime.env);

		const existingUser = await db.select().from(users).where(eq(users.discordId, discordUser.id)).get();

		let userId = "";

		if (existingUser) {
			userId = existingUser.id;
		} else {
            // Create user
            userId = crypto.randomUUID();
            await db.insert(users).values({
                id: userId,
                discordId: discordUser.id,
                username: discordUser.username,
                avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
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

interface DiscordUser {
	id: string;
	username: string;
    avatar: string;
    email: string;
}
