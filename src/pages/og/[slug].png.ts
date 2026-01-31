import { Resvg } from "@resvg/resvg-wasm";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import satori from "satori";
import { posts } from "../../../db/schema";
import { getDb } from "../../lib/db";

// We need to initialize the WASM
// In generic Node/Cloudflare workers, dynamic imports might be needed or just init once.
// For Astro Cloudflare adapter, usually it just works or we pass the wasm module.
// However, @resvg/resvg-wasm might need manual init if mostly used in Node.
// Let's try standard import first.

export const GET: APIRoute = async ({ params, locals }) => {
	const { slug } = params;
	if (!slug) return new Response("Not found", { status: 404 });

	const db = getDb(locals.runtime.env);
	const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();

	if (!post) return new Response("Not found", { status: 404 });

	// Load Fonts (Inter Bold and Regular)
	// Caching these would be good in production
	const fontData = await fetch(
		"https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff",
	).then((res) => res.arrayBuffer());
	const fontDataRegular = await fetch(
		"https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff",
	).then((res) => res.arrayBuffer());

	// Calculate Reading Time
	const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
	const readTime = Math.ceil(wordCount / 200);

	const svg = await satori(
		{
			type: "div",
			props: {
				style: {
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					backgroundColor: "#050505",
					backgroundImage:
						"radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)",
					backgroundSize: "100px 100px",
					fontFamily: "Inter",
					color: "white",
					padding: "80px",
					position: "relative",
					overflow: "hidden",
				},
				children: [
					// Background Glows
					{
						type: "div",
						props: {
							style: {
								position: "absolute",
								top: "-20%",
								right: "-10%",
								width: "600px",
								height: "600px",
								background: "rgba(139, 92, 246, 0.15)", // brand-primary
								filter: "blur(100px)",
								borderRadius: "50%",
							},
						},
					},
					{
						type: "div",
						props: {
							style: {
								position: "absolute",
								bottom: "-20%",
								left: "-10%",
								width: "500px",
								height: "500px",
								background: "rgba(236, 72, 153, 0.15)", // brand-accent
								filter: "blur(100px)",
								borderRadius: "50%",
							},
						},
					},

					// Main Content Container
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								flexDirection: "column",
								height: "100%",
								justifyContent: "space-between",
								zIndex: 10,
							},
							children: [
								// Header: Blog Name
								{
									type: "div",
									props: {
										style: {
											fontSize: "32px",
											fontWeight: 700,
											color: "#d8b4fe", // light purple
											display: "flex",
											alignItems: "center",
											gap: "12px",
										},
										children: [
											{
												type: "div",
												props: {
													style: {
														width: "40px",
														height: "40px",
														borderRadius: "50%",
														background:
															"linear-gradient(135deg, #a855f7, #ec4899)",
													},
												},
											},
											"Gin's Blog",
										],
									},
								},

								// Title
								{
									type: "div",
									props: {
										style: {
											display: "flex",
											flexDirection: "column",
											gap: "16px",
										},
										children: [
											{
												type: "div",
												props: {
													style: {
														fontSize: "72px",
														fontWeight: 700,
														lineHeight: 1.1,
														background:
															"linear-gradient(to right, #e9d5ff, #fbcfe8)", // light text gradient
														backgroundClip: "text",
														color: "transparent",
														textShadow: "0 4px 20px rgba(0,0,0,0.5)",
													},
													children:
														post.title.length > 50
															? post.title.substring(0, 50) + "..."
															: post.title,
												},
											},
											// Description / Excerpt (optional, using date for now)
										],
									},
								},

								// Footer: Metadata
								{
									type: "div",
									props: {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "40px",
											fontSize: "24px",
											color: "#9ca3af",
											fontFamily: "Inter",
										},
										children: [
											// Author
											{
												type: "div",
												props: {
													style: {
														display: "flex",
														alignItems: "center",
														gap: "12px",
													},
													children: [
														{
															type: "img",
															props: {
																src: "https://ui-avatars.com/api/?name=Ichimaru+Gin&background=random&color=fff",
																style: {
																	width: "48px",
																	height: "48px",
																	borderRadius: "50%",
																	border: "2px solid rgba(255,255,255,0.1)",
																},
															},
														},
														"Ichimaru Gin",
													],
												},
											},
											// Divider
											{
												type: "div",
												props: {
													style: {
														width: "4px",
														height: "4px",
														borderRadius: "50%",
														background: "#6b7280",
													},
												},
											},
											// Date
											{
												type: "div",
												props: {
													children: new Date(
														post.publishedAt || post.createdAt,
													).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
													}),
												},
											},
											// Divider
											{
												type: "div",
												props: {
													style: {
														width: "4px",
														height: "4px",
														borderRadius: "50%",
														background: "#6b7280",
													},
												},
											},
											// Read Time
											{
												type: "div",
												props: { children: `${readTime} min read` },
											},
										],
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "Inter",
					data: fontData,
					weight: 700,
					style: "normal",
				},
				{
					name: "Inter",
					data: fontDataRegular,
					weight: 400,
					style: "normal",
				},
			],
		},
	);

	// Render SVG to PNG
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: 1200 },
	});

	// Cloudflare Workers usually need the WASM initialized, but @resvg/resvg-wasm auto-inits in some envs.
	// If it fails, we catch.
	try {
		const pngData = resvg.render();
		const pngBuffer = pngData.asPng();

		return new Response(pngBuffer as any, {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=604800, immutable",
			},
		});
	} catch (e) {
		// Fallback or retry init
		try {
			// Need to import wasm manually?
			// import wasm from '@resvg/resvg-wasm/index_bg.wasm';
			// await initWasm(wasm);
			// Retry render...
			// For now just error log
			console.error("Resvg render error", e);
			throw e;
		} catch (e2) {
			return new Response("Image Generation Failed", { status: 500 });
		}
	}
};
