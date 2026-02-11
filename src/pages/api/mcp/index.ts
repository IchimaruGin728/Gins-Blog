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
];

export const POST: APIRoute = async ({ request, locals }) => {
	const env = locals.runtime.env;

	try {
		const body = (await request.json()) as any;

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
			const toolName = params.name;
			const args = params.arguments || {};
			const db = getDb(env);
			let resultContent = [];

			switch (toolName) {
				case "search_posts": {
					const query = args.query;
					const limit = args.limit || 5;
					const results = await db
						.select({
							title: posts.title,
							slug: posts.slug,
							views: posts.views,
							publishedAt: posts.publishedAt,
						})
						.from(posts)
						.where(like(posts.title, `%${query}%`))
						.limit(limit);

					resultContent = [
						{ type: "text", text: JSON.stringify(results, null, 2) },
					];
					break;
				}

				case "draft_post": {
					const { title, content } = args;
					const slug =
						args.slug ||
						title
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
						title,
						slug,
						content,
						createdAt: now,
						updatedAt: now,
						publishedAt: null, // Draft
						views: 0,
					});

					resultContent = [
						{
							type: "text",
							text: `Draft created successfully! ID: ${newId}, Slug: ${slug}`,
						},
					];
					break;
				}

				case "analyze_comments": {
					const limit = args.limit || 10;
					const recentComments = await db
						.select({
							content: comments.content,
							createdAt: comments.createdAt,
							postId: comments.postId,
						})
						.from(comments)
						.orderBy(desc(comments.createdAt))
						.limit(limit);

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
	} catch (error: any) {
		return new Response(
			JSON.stringify({
				jsonrpc: "2.0",
				id: null,
				error: {
					code: -32603,
					message: "Internal error",
					data: error.toString(),
				},
			}),
			{ status: 500 },
		);
	}
};
