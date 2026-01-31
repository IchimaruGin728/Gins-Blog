import { defineMiddleware } from "astro/middleware";
import { getDb } from "./lib/db";
import { validateSessionToken } from "./lib/session";
import { getZeroTrustUser } from "./lib/zerotrust";

export const onRequest = defineMiddleware(async (context, next) => {
	const token = context.cookies.get("session")?.value ?? null;

	// Initialize locals
	context.locals.user = null;
	context.locals.session = null;

	// Access env from locals.runtime (populated by Adapter)
	const env = context.locals.runtime.env;
	const db = getDb(env);

	// HTML Caching for Public GET Routes
	// Skip if logged in (token present), or if admin/api/login
	const isPublicGet =
		context.request.method === "GET" &&
		!token &&
		!context.url.pathname.startsWith("/IchimaruGin728") &&
		!context.url.pathname.startsWith("/api") &&
		!context.url.pathname.startsWith("/login");

	if (isPublicGet) {
		// Cache Key: Full URL
		const cacheKey = context.url.href;
		const cachedHtml = await env.GIN_KV.get(cacheKey);

		if (cachedHtml) {
			return new Response(cachedHtml, {
				headers: {
					"Content-Type": "text/html;charset=UTF-8",
					"X-Cache": "HIT",
				},
			});
		}
	}

	// Zero Trust Check for Admin Routes (Page + API)
	if (
		context.url.pathname.startsWith("/IchimaruGin728/admin") ||
		context.url.pathname.startsWith("/api/admin")
	) {
		const ztUser = getZeroTrustUser(context.request);
		if (!ztUser) {
			return new Response("Unauthorized - Zero Trust Access Required", {
				status: 401,
			});
		}
		// Allow pass through if ZT User exists
	}

	// Public Route Caching logic (unchanged)
	// ...

	// Restore Session Logic ONLY for API/Login/Other protected routes if any
	// Actually, if we use ZT for Admin, we can keep using Session for ... what?
	// Maybe we keep using Session for the API if accessed from Client?
	// But the Admin Dashboard calls the API.
	// If Admin Dashboard calls API from client (browser), the browser sends cookies?
	// Cloudflare Access sets its own cookies (CF_Authorization).
	// Our API handles session cookies currently.
	// If we want the API to work with ZT, we need to adapt API to accept ZT header or Cookie too.

	// For now, let's keep session logic for potential future public auth (e.g. comments).
	// But restrict Admin to ZT.

	if (token === null) {
		return next();
	}

	const { user, session } = await validateSessionToken(
		token,
		db,
		env,
		context.request,
	);
	// ... existing session refresh logic ...

	context.locals.session = session;
	context.locals.user = user;

	return next();
});
