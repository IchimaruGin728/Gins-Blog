import { generateState } from "arctic";
import type { APIRoute } from "astro";
import { getGithub } from "../../../lib/auth";

export const GET: APIRoute = async ({ cookies, redirect, locals, request }) => {
	const state = generateState();
	const url = getGithub(locals.runtime.env).createAuthorizationURL(state, []);

	const redirectTo =
		new URL(request.url).searchParams.get("redirect_to") ?? "/";

	cookies.set("github_oauth_state", state, {
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
