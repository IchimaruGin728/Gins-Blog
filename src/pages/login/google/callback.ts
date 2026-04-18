import { env as workerEnv } from "cloudflare:workers";
import type { OAuth2Tokens } from "arctic";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { users } from "../../../../db/schema";
import { getGoogle } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { sanitizeRedirectTarget } from "../../../lib/redirect";
import {
	createSession,
	generateSessionToken,
	validateSessionToken,
} from "../../../lib/session";

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
	const env = workerEnv as Env;
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies.get("google_oauth_state")?.value ?? null;
	const codeVerifier = cookies.get("google_code_verifier")?.value ?? null;

	if (
		!code ||
		!state ||
		!storedState ||
		!codeVerifier ||
		state !== storedState
	) {
		return new Response(null, {
			status: 400,
		});
	}

	try {
		console.log("Validating Google code...");
		const tokens: OAuth2Tokens = await getGoogle(env).validateAuthorizationCode(
			code,
			codeVerifier,
		);
		const accessToken = tokens.accessToken();
		console.log("Tokens received:", accessToken ? "Present" : "Missing");

		let googleUser: GoogleUser;
		try {
			console.log("Fetching Google user...");
			const googleUserResponse = await fetch(
				"https://openidconnect.googleapis.com/v1/userinfo",
				{
					headers: {
						Authorization: `Bearer ${accessToken.trim()}`,
					},
				},
			);
			if (!googleUserResponse.ok) {
				const errorText = await googleUserResponse.text();
				throw new Error(
					`Google API returned ${googleUserResponse.status}: ${errorText.slice(0, 200)}`,
				);
			}
			googleUser = await googleUserResponse.json();
			console.log("Google User fetched:", googleUser.name);
		} catch (fetchError: any) {
			throw new Error(`Failed to fetch Google user: ${fetchError.message}`);
		}

		const db = getDb(env);

		// Check if user is already logged in (linking a new provider)
		const existingSessionToken = cookies.get("session")?.value;
		let currentUserId: string | null = null;

		if (existingSessionToken) {
			const sessionResult = await validateSessionToken(
				existingSessionToken,
				db,
				env,
			);
			if (sessionResult.session && sessionResult.user) {
				currentUserId = sessionResult.user.id;
				console.log(
					"User is already logged in, linking Google account to user:",
					currentUserId,
				);
			}
		}

		// Check if this Google account is already linked to a user
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.googleId, googleUser.sub))
			.get();

		let userId = "";

		if (currentUserId) {
			// User is logged in - link Google to their current account
			if (existingUser && existingUser.id !== currentUserId) {
				throw new Error(
					"This Google account is already linked to another user account.",
				);
			}

			// Update current user with Google ID and provider info
			await db
				.update(users)
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
				createdAt: Date.now(),
				googleUsername: googleUser.name,
				googleAvatar: googleUser.picture,
			});
			console.log("Created new user with Google:", userId);
		}

		console.log("Creating session, userId:", userId);
		const token = generateSessionToken();
		const session = await createSession(token, userId, db, env, request);

		console.log("Setting session cookie...");
		cookies.set("session", token, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: import.meta.env.PROD,
			expires: new Date(session.expiresAt),
		});

		const redirectUrl = sanitizeRedirectTarget(
			cookies.get("login_redirect")?.value,
		);
		cookies.delete("google_oauth_state", { path: "/" });
		cookies.delete("google_code_verifier", { path: "/" });
		cookies.delete("login_redirect", { path: "/" });

		return redirect(redirectUrl);
	} catch (e: any) {
		console.error(e);
		cookies.delete("google_oauth_state", { path: "/" });
		cookies.delete("google_code_verifier", { path: "/" });
		cookies.delete("login_redirect", { path: "/" });
		return new Response("Login failed", { status: 500 });
	}
};

interface GoogleUser {
	sub: string;
	name: string;
	picture: string;
	email: string;
}
