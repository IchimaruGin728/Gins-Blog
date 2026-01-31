import type { APIRoute } from "astro";

export const PUT: APIRoute = async ({ request, locals }) => {
	// Check Auth
	if (!locals.user) {
		return new Response("Unauthorized", { status: 401 });
	}

	const env = locals.runtime.env;
	const url = new URL(request.url);
	const filename = url.searchParams.get("filename");

	if (!filename) {
		return new Response("Missing filename", { status: 400 });
	}

	try {
		const uniqueFilename = `${Date.now()}-${filename}`;

		// Use R2 Binding to put the file
		// request.body is a ReadableStream which put() accepts directly
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
