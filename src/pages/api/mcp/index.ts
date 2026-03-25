import type { APIRoute } from "astro";
import { desc, like, sql } from "drizzle-orm";
import { comments, posts } from "../../../../db/schema";
import { getDb } from "../../../lib/db";

/**
 * Gins Blog MCP Server Endpoint
 *
 * Implements a simple HTTP-based Model Context Protocol server.
 * Clients (OpenClaw, Claude) send JSON-RPC 2.0 requests to execute tools.
 */

// Tool Definitions
const TOOLS = [
	{
		name: "search_posts",
		description: "Search for blog posts by title or content.",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string", description: "Search term" },
				limit: { type: "number", description: "Max results (default 5)" },
			},
			required: ["query"],
		},
	},
	{
		name: "draft_post",
		description: "Create a new draft blog post in the database.",
		inputSchema: {
			type: "object",
			properties: {
				title: { type: "string", description: "Post title" },
				content: { type: "string", description: "Markdown content" },
				slug: {
					type: "string",
					description: "URL slug (optional, auto-generated if missing)",
				},
			},
			required: ["title", "content"],
		},
	},
	{
		name: "analyze_comments",
		description: "Retrieve recent comments for analysis.",
		inputSchema: {
			type: "object",
			properties: {
				limit: {
					type: "number",
					description: "Number of comments to fetch (default 10)",
				},
			},
		},
	},
	{
		name: "check_analytics",
		description: "Get recent view counts and analytics summary.",
		inputSchema: {
			type: "object",
			properties: {},
		},
	},
	{
		name: "upload_image",
		description: "Upload an image to Cloudflare Images via URL.",
		inputSchema: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The public URL of the image to upload",
				},
				requireSignedURLs: {
					type: "boolean",
					description: "Whether to require signed URLs (default false)",
				},
			},
			required: ["url"],
		},
	},
	{
		name: "upload_video",
		description: "Upload a video to Cloudflare Stream via URL.",
		inputSchema: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The public URL of the video to upload",
				},
				title: { type: "string", description: "Title for the video" },
			},
			required: ["url"],
		},
	},
];

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
	method?: string;
	params?: {
		name?: string;
		arguments?: Record<string, unknown>;
	};
	id?: JsonRpcId;
}

type JsonRpcTextContent = {
	type: "text";
	text: string;
};

interface CloudflareMcpUploadResponse {
	success: boolean;
	errors: { message?: string }[];
	result: {
		id?: string;
		variants?: string[];
		uid?: string;
		thumbnail?: string;
	};
}

function getErrorString(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function getStringArg(value: unknown, fieldName: string) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`Invalid or missing "${fieldName}" argument.`);
	}

	return value;
}

function getOptionalStringArg(value: unknown) {
	if (typeof value !== "string" || value.trim() === "") {
		return undefined;
	}

	return value;
}

function getNumberArg(value: unknown, fallback: number) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export const POST: APIRoute = async ({ request, locals }) => {
	const env = locals.runtime.env;

	try {
		const body = (await request.json()) as JsonRpcRequest;

		// JSON-RPC 2.0 Request Handling
		const { method, params, id } = body;

		// 1. Initialize / List Tools
		if (method === "initialize" || method === "tools/list") {
			return new Response(
				JSON.stringify({
					jsonrpc: "2.0",
					id,
					result: {
						tools: TOOLS,
					},
				}),
				{ headers: { "Content-Type": "application/json" } },
			);
		}

		// 2. Execute Tool
		if (method === "tools/call") {
			const toolName = params?.name;
			const args = params?.arguments || {};
			const db = getDb(env);
			let resultContent: JsonRpcTextContent[] = [];

			switch (toolName) {
				case "search_posts": {
					const searchQuery = getStringArg(args.query, "query");
					const resultLimit = getNumberArg(args.limit, 5);
					const results = await db
						.select({
							title: posts.title,
							slug: posts.slug,
							views: posts.views,
							publishedAt: posts.publishedAt,
						})
						.from(posts)
						.where(like(posts.title, `%${searchQuery}%`))
						.limit(resultLimit);

					resultContent = [
						{ type: "text", text: JSON.stringify(results, null, 2) },
					];
					break;
				}

				case "draft_post": {
					const draftTitle = getStringArg(args.title, "title");
					const draftContent = getStringArg(args.content, "content");
					const draftSlug =
						getOptionalStringArg(args.slug) ||
						draftTitle
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/^-|-$/g, "") +
							"-" +
							Date.now().toString().slice(-4);
					const now = Date.now();

					// Using a random ID since we use text ID in schema
					const newId = crypto.randomUUID();

					await db.insert(posts).values({
						id: newId,
						title: draftTitle,
						slug: draftSlug,
						content: draftContent,
						createdAt: now,
						updatedAt: now,
						publishedAt: null, // Draft
						views: 0,
					});

					resultContent = [
						{
							type: "text",
							text: `Draft created successfully! ID: ${newId}, Slug: ${draftSlug}`,
						},
					];
					break;
				}

				case "analyze_comments": {
					const resultLimit = getNumberArg(args.limit, 10);
					const recentComments = await db
						.select({
							content: comments.content,
							createdAt: comments.createdAt,
							postId: comments.postId,
						})
						.from(comments)
						.orderBy(desc(comments.createdAt))
						.limit(resultLimit);

					resultContent = [
						{ type: "text", text: JSON.stringify(recentComments, null, 2) },
					];
					break;
				}

				case "check_analytics": {
					// Simple aggregation of views
					const totalViews = await db
						.select({
							count: sql<number>`sum(${posts.views})`,
						})
						.from(posts);

					const topPosts = await db
						.select({
							title: posts.title,
							views: posts.views,
						})
						.from(posts)
						.orderBy(desc(posts.views))
						.limit(5);

					const summary = {
						total_views: totalViews[0]?.count || 0,
						top_posts: topPosts,
					};

					resultContent = [
						{ type: "text", text: JSON.stringify(summary, null, 2) },
					];
					break;
				}

				case "upload_image": {
					const imageUrl = getStringArg(args.url, "url");
					const accountId =
						env.CLOUDFLARE_ACCOUNT_ID || "cd4ce461acea5097153abf9e2deb26ec";
					const apiToken =
						env.CLOUDFLARE_MEDIA_API_TOKEN ||
						env.CF_API_TOKEN ||
						env.CLOUDFLARE_API_TOKEN;

					if (!apiToken) {
						throw new Error(
							"CLOUDFLARE_MEDIA_API_TOKEN environment variable is not set.",
						);
					}

					const formData = new FormData();
					formData.append("url", imageUrl);
					if (args.requireSignedURLs === true) {
						formData.append("requireSignedURLs", "true");
					}

					const response = await fetch(
						`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${apiToken}`,
							},
							body: formData,
						},
					);

					const data = (await response.json()) as CloudflareMcpUploadResponse;

					if (!data.success) {
						throw new Error(
							`Image upload failed: ${data.errors[0]?.message || "Unknown error"}`,
						);
					}

					// Return a markdown snippet for the user/agent
					const imageId = data.result.id;
					const variants = data.result.variants ?? [];
					const publicUrl = variants.find((v: string) => v.endsWith("/public"));

					resultContent = [
						{
							type: "text",
							text: `Image uploaded successfully!\n\nID: ${imageId}\n\nMarkdown Snippet:\n\`\`\`astro\n<CFImage src="${imageId}" alt="Uploaded Image" />\n\`\`\`\n\nDirect URL: ${publicUrl || variants[0]}`,
						},
					];
					break;
				}

				case "upload_video": {
					const videoUrl = getStringArg(args.url, "url");
					const videoTitle = getOptionalStringArg(args.title);
					const accountId =
						env.CLOUDFLARE_ACCOUNT_ID || "cd4ce461acea5097153abf9e2deb26ec";
					const apiToken =
						env.CLOUDFLARE_MEDIA_API_TOKEN ||
						env.CF_API_TOKEN ||
						env.CLOUDFLARE_API_TOKEN;

					if (!apiToken) {
						throw new Error(
							"CLOUDFLARE_MEDIA_API_TOKEN environment variable is not set.",
						);
					}

					const body: {
						url: string;
						meta?: { name: string };
					} = {
						url: videoUrl,
					};
					if (videoTitle) body.meta = { name: videoTitle };

					const response = await fetch(
						`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${apiToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(body),
						},
					);

					const data = (await response.json()) as CloudflareMcpUploadResponse;

					if (!data.success) {
						throw new Error(
							`Video upload failed: ${data.errors[0]?.message || "Unknown error"}`,
						);
					}

					const videoId = data.result.uid;
					const thumbnail = data.result.thumbnail;

					resultContent = [
						{
							type: "text",
							text: `Video upload started! (Async)\n\nID: ${videoId}\n\nMarkdown Snippet:\n\`\`\`astro\n<StreamPlayer videoId="${videoId}" title="${videoTitle || "Video"}" />\n\`\`\`\n\nThumbnail: ${thumbnail}`,
						},
					];
					break;
				}

				default:
					return new Response(
						JSON.stringify({
							jsonrpc: "2.0",
							id,
							error: { code: -32601, message: "Method not found" },
						}),
						{ status: 404 },
					);
			}

			return new Response(
				JSON.stringify({
					jsonrpc: "2.0",
					id,
					result: {
						content: resultContent,
					},
				}),
				{ headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({
				jsonrpc: "2.0",
				id,
				error: { code: -32600, message: "Invalid request" },
			}),
			{ status: 400 },
		);
	} catch (error: unknown) {
		return new Response(
			JSON.stringify({
				jsonrpc: "2.0",
				id: null,
				error: {
					code: -32603,
					message: "Internal error",
					data: getErrorString(error),
				},
			}),
			{ status: 500 },
		);
	}
};
