import type { APIRoute } from "astro";

interface CloudflareImageUploadResponse {
	success: boolean;
	errors: { message?: string }[];
	result: {
		id: string;
		variants: string[];
	};
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Unknown error";
}

export const POST: APIRoute = async ({ request, locals }) => {
	// Admin Authorization check
	if (!locals.user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { env } = locals.runtime;
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = env.CLOUDFLARE_MEDIA_API_TOKEN || env.CLOUDFLARE_API_TOKEN;

	if (!accountId || !apiToken) {
		return new Response(
			JSON.stringify({
				error: "Missing Cloudflare media credentials in environment.",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return new Response(JSON.stringify({ error: "No file provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Forward the file to Cloudflare Images API
		const cfFormData = new FormData();
		cfFormData.append("file", file);

		const cfResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiToken}`,
				},
				body: cfFormData,
			},
		);

		const cfData = (await cfResponse.json()) as CloudflareImageUploadResponse;

		if (!cfData.success) {
			return new Response(
				JSON.stringify({
					error: "Cloudflare Upload Failed",
					details: cfData.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				imageId: cfData.result.id,
				variants: cfData.result.variants,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: unknown) {
		console.error("Image upload error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal Server Error",
				message: getErrorMessage(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
