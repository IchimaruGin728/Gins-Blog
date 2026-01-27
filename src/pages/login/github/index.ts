import { generateState } from 'arctic';
import { github } from '../../../lib/auth';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
	const state = generateState();
	const url = github.createAuthorizationURL(state, []);

	cookies.set('github_oauth_state', state, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	return redirect(url.toString());
};
