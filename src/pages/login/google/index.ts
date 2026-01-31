import { generateCodeVerifier, generateState } from "arctic";
import type { APIRoute } from "astro";
import { getGoogle } from "../../../lib/auth";

export const GET: APIRoute = async ({ cookies, redirect, locals, request }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = getGoogle(locals.runtime.env).createAuthorizationURL(
		state,
		codeVerifier,
		["profile", "email"],
	);

	const redirectTo =
		new URL(request.url).searchParams.get("redirect_to") ?? "/";

	cookies.set("google_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	cookies.set("google_code_verifier", codeVerifier, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	cookies.set("login_redirect", redirectTo, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});

	return redirect(url.toString());
};
