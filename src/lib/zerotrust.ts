// Basic implementation for checking Cloudflare Access JWT
// In production, you should verify the signature with public keys.
// For now, we trust the header/cookie assuming the worker is only accessible via Cloudflare.

export function getZeroTrustUser(request: Request) {
	// Cloudflare Zero Trust sets these headers (for SSR/initial requests)
	const token = request.headers.get("Cf-Access-Jwt-Assertion");
	const email = request.headers.get("Cf-Access-Authenticated-User-Email");

	// For browser-side fetch requests, check the cookie instead
	const cookieHeader = request.headers.get("Cookie");
	const hasCFAuthCookie = cookieHeader?.includes("CF_Authorization=");

	if (!token && !email && !hasCFAuthCookie) {
		// Fallback for local dev if needed, or strictly return null
		// If PROD, strict. If DEV, maybe allow?
		if (import.meta.env.DEV) {
			return { email: "dev@local", id: "dev" };
		}
		return null;
	}

	// In a real verification, we would:
	// 1. Fetch public keys from https://<team-domain>.cloudflareaccess.com/cdn-cgi/access/certs
	// 2. Verify JWT signature

	// For this scaffold, we rely on the trust that this worker is deployed on Cloudflare
	// and protected by Access which strips untrusted headers/cookies from outside.
	return {
		email: email || "cf-access-user",
		id: "cf-access-user",
	};
}
