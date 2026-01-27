import { getGithub } from '../../../lib/auth';
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
	const storedState = cookies.get('github_oauth_state')?.value ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
        console.log("Validating GitHub code...");
		const tokens: OAuth2Tokens = await getGithub(locals.runtime.env).validateAuthorizationCode(code);
        const accessToken = tokens.accessToken();
        console.log("Tokens received:", accessToken ? "Present" : "Missing");

        let githubUser: GitHubUser;
        try {
            console.log("Fetching GitHub user...");
            const githubUserResponse = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken.trim()}`
                }
            });
            
            if (!githubUserResponse.ok) {
                const errorText = await githubUserResponse.text();
                console.error("GitHub API error:", githubUserResponse.status, errorText);
                throw new Error(`GitHub API returned ${githubUserResponse.status}: ${errorText.slice(0, 200)}`);
            }
            
            githubUser = await githubUserResponse.json();
            console.log("GitHub User fetched:", githubUser.login);
        } catch (fetchError: any) {
             throw new Error(`Failed to fetch GitHub user: ${fetchError.message}`);
        }

		const db = getDb(locals.runtime.env);

		const existingUser = await db.select().from(users).where(eq(users.githubId, githubUser.id)).get();

		let userId = "";

		if (existingUser) {
			userId = existingUser.id;
		} else {
            // Create user
            userId = crypto.randomUUID();
            await db.insert(users).values({
                id: userId,
                githubId: githubUser.id,
                username: githubUser.login
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

interface GitHubUser {
	id: number;
	login: string;
}
