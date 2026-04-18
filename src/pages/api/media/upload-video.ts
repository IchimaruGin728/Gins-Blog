import { env as workerEnv } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { validateVideoFile } from "../../../lib/uploads";
import { getZeroTrustUser } from "../../../lib/zerotrust";

interface CloudflareStreamUploadResponse {
	success: boolean;
	errors: { message?: string }[];
	result: {
		uid: string;
		preview: string;
		readyToStream: boolean;
	};
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Unknown error";
}

export const POST: APIRoute = async ({ request }) => {
	if (!getZeroTrustUser(request)) {
		return new Response(JSON.stringify({ error: "Forbidden" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	const env = workerEnv as Env;
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

		const validationError = validateVideoFile(file);
		if (validationError) {
			return new Response(JSON.stringify({ error: validationError }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Direct Creator Upload for videos < 200MB
		const cfFormData = new FormData();
		cfFormData.append("file", file);

		const cfResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiToken}`,
				},
				body: cfFormData,
			},
		);

		const cfData = (await cfResponse.json()) as CloudflareStreamUploadResponse;

		if (!cfData.success) {
			return new Response(
				JSON.stringify({
					error: "Cloudflare Stream Upload Failed",
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
				videoId: cfData.result.uid,
				preview: cfData.result.preview,
				readyToStream: cfData.result.readyToStream,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: unknown) {
		console.error("Video upload error:", error);
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
