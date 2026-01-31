import type { APIRoute } from "astro";
import { posts } from "../../../../db/schema";
import { getDb } from "../../../lib/db";

// import { eq } from "drizzle-orm";

function slugify(text: string) {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "")
		.replace(/--+/g, "-");
}

function parseFrontmatter(content: string) {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {}, body: content };
	}

	const frontmatterBlock = match[1];
	const body = content.replace(match[0], "").trim();
	const frontmatter: Record<string, string> = {};

	frontmatterBlock.split("\n").forEach((line) => {
		const [key, ...valueParts] = line.split(":");
		if (key && valueParts.length) {
			frontmatter[key.trim()] = valueParts
				.join(":")
				.trim()
				.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
		}
	});

	return { frontmatter, body };
}

function parseRTF(content: string) {
	// Very basic RTF text extraction (strips formatting)
	// This is not a full RTF parser, just a fallback to get legible text
	return content
		.replace(/\\par[d]?/g, "\n")
		.replace(/\{.*?\}/g, "")
		.replace(/\\[a-z]+-?[0-9]* ?/g, "")
		.trim();
}

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return new Response(JSON.stringify({ error: "No file provided" }), {
				status: 400,
			});
		}

		const text = await file.text();
		const filename = file.name;
		const extension = filename.split(".").pop()?.toLowerCase();

		let title = filename.replace(/\.(md|markdown|rtf|txt)$/i, "");
		let slug = slugify(title);
		let content = text;
		let publishedAt = Date.now();

		if (extension === "md" || extension === "markdown") {
			const parsed = parseFrontmatter(text);
			content = parsed.body;
			if (parsed.frontmatter.title) title = parsed.frontmatter.title;
			if (parsed.frontmatter.slug) slug = parsed.frontmatter.slug;
			if (parsed.frontmatter.date)
				publishedAt = new Date(parsed.frontmatter.date).getTime();
		} else if (extension === "rtf") {
			content = parseRTF(text);
		}

		// Ensure slug uniqueness (simple append timestamp if exists - basic check)
		// For a robust system, we'd query DB. SQLite UNIQUE constraint will throw if dup.
		// Let's rely on try/catch for duplicate slug.

		const { env } = locals.runtime;
		const db = getDb(env);

		const postData = {
			id: crypto.randomUUID(),
			title,
			slug,
			content,
			publishedAt,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await db.insert(posts).values(postData);

		// Invalidate Cache if exists (Optional but good practice)
		// We don't have direct access to delete strict keys easily without the wrapper,
		// but the cache utility writes with TTL. We can just let it expire or try to delete.
		// Accessing KV directly:
		try {
			if (env.GINS_CACHE) {
				await env.GINS_CACHE.delete("home_recent_posts_en");
				await env.GINS_CACHE.delete("home_recent_posts_zh");
			}
		} catch (e) {
			console.warn("Failed to clear cache", e);
		}

		return new Response(
			JSON.stringify({ success: true, slug, post: postData }),
			{ status: 200 },
		);
	} catch (e: any) {
		console.error("Upload Error:", e);

		if (e.message.includes("UNIQUE constraint failed")) {
			return new Response(
				JSON.stringify({
					error: "Slug already exists. Change title or slug in frontmatter.",
				}),
				{ status: 409 },
			);
		}

		return new Response(
			JSON.stringify({ error: e.message || "Server Error" }),
			{ status: 500 },
		);
	}
};
