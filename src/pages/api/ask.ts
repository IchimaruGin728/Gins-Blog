import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, locals }) => {
	const url = new URL(request.url);
	const q = url.searchParams.get("q");

	if (!q) {
		return new Response("Query required", { status: 400 });
	}

	const env = locals.runtime.env;

	try {
		// 1. Generate Embedding
		const embeddingResponse = (await env.AI.run("@cf/baai/bge-base-en-v1.5", {
			text: [q],
		})) as { data: number[][] };
		const queryVector = embeddingResponse.data[0];

		// 2. Retrieve Context
		const matches = await env.VECTOR_INDEX.query(queryVector, {
			topK: 5,
			returnMetadata: true,
		});

		// 3. Format Context
		const context = matches.matches
			.map(
				(match: any) =>
					`Title: ${match.metadata.title}\nContent Snippet: ...\nSource: /blog/${match.metadata.slug}`,
			)
			.join("\n\n");

		if (!context) {
			return new Response(
				"I couldn't find any relevant posts to answer your question.",
				{
					headers: { "Content-Type": "text/plain" },
				},
			);
		}

		// 4. Generate Answer with Streaming
		const systemPrompt = `You are Ichimaru Gin's AI Assistant. You answer questions based ONLY on the provided context from his blog.
        
        Rules:
        - Use a helpful, slightly technical, and cyber-aesthetic tone.
        - Answer concisely.
        - ALWAYS cite the source blog post title when you state a fact.
        - If the answer is not in the context, say "I don't have that information in my memory banks."
        
        Context:
        ${context}`;

		const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: q },
			],
			stream: true,
		});

		return new Response(response as any, {
			headers: { "Content-Type": "text/event-stream" },
		});
	} catch (e) {
		console.error(e);
		return new Response("Neural Link Failure", { status: 500 });
	}
};
