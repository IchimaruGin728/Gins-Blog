import { getGoogle } from '../../../lib/auth';
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
        const accessToken = tokens.accessToken();
        console.log("Tokens received:", accessToken ? "Present" : "Missing");

        let googleUser: GoogleUser;
        try {
            console.log("Fetching Google user...");
            const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken.trim()}`
                }
            });
            googleUser = await googleUserResponse.json();
            console.log("Google User fetched:", googleUser.name);
        } catch (fetchError: any) {
             throw new Error(`Failed to fetch Google user: ${fetchError.message}`);
        }

		const db = getDb(locals.runtime.env);

		// Check if user is already logged in (linking a new provider)
		const existingSessionToken = cookies.get('session')?.value;
		let currentUserId: string | null = null;
		
		if (existingSessionToken) {
			const sessionResult = await validateSessionToken(existingSessionToken, db, locals.runtime.env);
			if (sessionResult.session && sessionResult.user) {
				currentUserId = sessionResult.user.id;
				console.log("User is already logged in, linking Google account to user:", currentUserId);
			}
		}

		// Check if this Google account is already linked to a user
		const existingUser = await db.select().from(users).where(eq(users.googleId, googleUser.sub)).get();

		let userId = "";

		if (currentUserId) {
			// User is logged in - link Google to their current account
			if (existingUser && existingUser.id !== currentUserId) {
				throw new Error("This Google account is already linked to another user account.");
			}
			
			// Update current user with Google ID and provider info
			await db.update(users)
				.set({ 
					googleId: googleUser.sub,
					googleUsername: googleUser.name,
					googleAvatar: googleUser.picture,
				})
				.where(eq(users.id, currentUserId));
			
			userId = currentUserId;
			console.log("Google account linked to existing user:", userId);
		} else if (existingUser) {
			// Not logged in, but Google account exists - log in as that user
			userId = existingUser.id;
			console.log("Logging in as existing Google user:", userId);
		} else {
			// Not logged in, no existing account - create new user
			userId = crypto.randomUUID();
			await db.insert(users).values({
				id: userId,
				googleId: googleUser.sub,
				username: googleUser.name,
				avatar: googleUser.picture,
				googleUsername: googleUser.name,
				googleAvatar: googleUser.picture,
			});
			console.log("Created new user with Google:", userId);
		}

		console.log("Creating session, userId:", userId);
		const token = generateSessionToken();
		const session = await createSession(
			token,
			userId,
			db,
			locals.runtime.env,
			request.headers.get('user-agent') || undefined,
			request.headers.get('cf-connecting-ip') || undefined
		);
		
        console.log("Setting session cookie...");
        cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: import.meta.env.PROD,
			expires: new Date(session.expiresAt)
		});

        // Retrieve redirect URL from cookie or default to home
        const redirectUrl = cookies.get('login_redirect')?.value ?? '/';
        // Clean up the cookie
        cookies.delete('login_redirect', { path: '/' });

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login Successful</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <meta http-equiv="refresh" content="2;url=${redirectUrl}">
        </head>
        <body class="bg-[#0a0a0a] text-white flex items-center justify-center min-h-screen">
            <div class="text-center space-y-4 p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl max-w-sm w-full mx-4 shadow-2xl">
                <div class="relative w-16 h-16 mx-auto mb-4">
                    <div class="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                    <div class="relative bg-green-500/10 rounded-full w-16 h-16 flex items-center justify-center border border-green-500/20">
                        <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Welcome Back!</h2>
                <p class="text-gray-400 text-sm">Successfully logged into Google.</p>
                <p class="text-gray-500 text-xs mt-2">Redirecting you in a moment...</p>
                <div class="w-full bg-white/5 rounded-full h-1 mt-6 overflow-hidden">
                    <div class="bg-green-500 h-full w-full origin-left animate-[progress_2s_ease-in-out_infinite]"></div>
                </div>
            </div>
            <script>
                setTimeout(() => {
                    window.location.href = "${redirectUrl}";
                }, 1500);
            </script>
            <style>
                @keyframes progress {
                    0% { transform: scaleX(0); }
                    100% { transform: scaleX(1); }
                }
            </style>
        </body>
        </html>
        `;

		return new Response(html, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
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
