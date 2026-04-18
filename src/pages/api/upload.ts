import type { APIRoute } from "astro";
import { sanitizeFilename, validateGenericUpload } from "../../lib/uploads";
import { getZeroTrustUser } from "../../lib/zerotrust";

export const PUT: APIRoute = async ({ request, locals }) => {
	if (!getZeroTrustUser(request)) {
		return new Response("Forbidden", { status: 403 });
	}

	const env = locals.runtime.env;
	const url = new URL(request.url);
	const filename = url.searchParams.get("filename");

	if (!filename) {
		return new Response("Missing filename", { status: 400 });
	}

	const validationError = validateGenericUpload(
		filename,
		request.headers.get("Content-Type"),
		request.headers.get("Content-Length"),
	);
	if (validationError) {
		return new Response(validationError, { status: 400 });
	}

	try {
		const safeFilename = sanitizeFilename(filename);
		if (!safeFilename) {
			return new Response("Invalid filename", { status: 400 });
		}

		const uniqueFilename = `${Date.now()}-${safeFilename}`;

		// Use R2 Binding to put the file
		// request.body is a ReadableStream which put() accepts directly
		if (!request.body) {
			return new Response("Missing request body", { status: 400 });
		}

		await env.BUCKET.put(uniqueFilename, request.body as any);

		// Assuming pure worker with assets, we might need a custom domain or worker route to serve these.
		// For this scaffold, let's assume there is a linked public access or we serve via another endpoint.
		// Or simpler: We return the Success and let the user configure R2 public domain.
		// Let's assume standard R2 public bucket for now or a worker proxy.
		// Return the key so the UI can construct the URL.

		return new Response(
			JSON.stringify({
				success: true,
				key: uniqueFilename,
				// Should be replaced with actual R2 Public URL or Worker route
				url: `/cdn/${uniqueFilename}`,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (e) {
		console.error(e);
		return new Response("Upload failed", { status: 500 });
	}
};
