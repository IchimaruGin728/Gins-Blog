export function sanitizeRedirectTarget(
	target: string | null | undefined,
	fallback = "/",
): string {
	if (!target) return fallback;

	try {
		// Only allow site-local absolute paths and reject protocol-relative URLs.
		if (!target.startsWith("/") || target.startsWith("//")) {
			return fallback;
		}

		const url = new URL(target, "https://blog.ichimarugin728.com");
		if (url.origin !== "https://blog.ichimarugin728.com") {
			return fallback;
		}

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
}
