import { getGoogle } from '../../../lib/auth';
import { generateState, generateCodeVerifier } from 'arctic';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect, locals }) => {
	const state = generateState();
    const codeVerifier = generateCodeVerifier();
	const url = getGoogle(locals.runtime.env).createAuthorizationURL(state, codeVerifier, ['profile', 'email']);

	cookies.set('google_oauth_state', state, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});
    cookies.set('google_code_verifier', codeVerifier, {
        path: '/',
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: 'lax'
    });

	return redirect(url.toString());
};
