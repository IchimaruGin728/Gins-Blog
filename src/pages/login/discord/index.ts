import { discord } from '../../../lib/auth';
import { generateState, generateCodeVerifier } from 'arctic';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
	const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = discord.createAuthorizationURL(state, codeVerifier, ['identify', 'email']);

	cookies.set('discord_oauth_state', state, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});
    cookies.set('discord_code_verifier', codeVerifier, {
        path: '/',
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: 'lax'
    });

	return redirect(url.toString());
};
