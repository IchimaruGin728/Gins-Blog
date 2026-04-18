import { env as workerEnv } from "cloudflare:workers";
import type { OAuth2Tokens } from "arctic";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { users } from "../../../../db/schema";
import { getGithub } from "../../../lib/auth";
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
	const storedState = cookies.get("github_oauth_state")?.value ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400,
		});
	}

	try {
		console.log("Validating GitHub code...");
		const tokens: OAuth2Tokens =
			await getGithub(env).validateAuthorizationCode(code);
		const accessToken = tokens.accessToken();
		console.log("Tokens received:", accessToken ? "Present" : "Missing");

		let githubUser: GitHubUser;
		try {
			console.log("Fetching GitHub user...");
			const githubUserResponse = await fetch("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${accessToken.trim()}`,
					"User-Agent": "Gins-Blog-OAuth-App",
					Accept: "application/vnd.github+json",
				},
			});

			if (!githubUserResponse.ok) {
				const errorText = await githubUserResponse.text();
				console.error(
					"GitHub API error:",
					githubUserResponse.status,
					errorText,
				);
				throw new Error(
					`GitHub API returned ${githubUserResponse.status}: ${errorText.slice(0, 200)}`,
				);
			}

			githubUser = await githubUserResponse.json();
			console.log(
				"GitHub User fetched:",
				githubUser.login,
				"Avatar:",
				githubUser.avatar_url,
			);
		} catch (fetchError: any) {
			throw new Error(`Failed to fetch GitHub user: ${fetchError.message}`);
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
					"User is already logged in, linking GitHub account to user:",
					currentUserId,
				);
			}
		}

		// Check if this GitHub account is already linked to a user
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.githubId, githubUser.id))
			.get();

		let userId = "";

		if (currentUserId) {
			// User is logged in - link GitHub to their current account
			if (existingUser && existingUser.id !== currentUserId) {
				throw new Error(
					"This GitHub account is already linked to another user account.",
				);
			}

			// Update current user with GitHub ID and provider info
			await db
				.update(users)
				.set({
					githubId: githubUser.id,
					githubUsername: githubUser.login,
					githubAvatar: githubUser.avatar_url,
				})
				.where(eq(users.id, currentUserId));

			userId = currentUserId;
			console.log("GitHub account linked to existing user:", userId);
		} else if (existingUser) {
			// Not logged in, but GitHub account exists - log in as that user
			userId = existingUser.id;
			console.log("Logging in as existing GitHub user:", userId);
		} else {
			// Not logged in, no existing account - create new user
			userId = crypto.randomUUID();
			await db.insert(users).values({
				id: userId,
				githubId: githubUser.id,
				username: githubUser.login,
				createdAt: Date.now(),
				githubUsername: githubUser.login,
				githubAvatar: githubUser.avatar_url,
			});
			console.log("Created new user with GitHub:", userId);
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
		cookies.delete("github_oauth_state", { path: "/" });
		cookies.delete("login_redirect", { path: "/" });

		return redirect(redirectUrl);
	} catch (e: any) {
		console.error(e);
		cookies.delete("github_oauth_state", { path: "/" });
		cookies.delete("login_redirect", { path: "/" });
		return new Response("Login failed", { status: 500 });
	}
};

interface GitHubUser {
	id: number;
	login: string;
	avatar_url: string;
}
