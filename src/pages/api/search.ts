import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    
    if (!q) {
        return new Response(JSON.stringify([]), {
             headers: { 'Content-Type': 'application/json' }
        });
    }

    const env = locals.runtime.env;
    
    try {
        // 1. Generate Embedding for the query
        const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: [q]
        }) as { data: number[][] };
        const queryVector = embeddingResponse.data[0];

        // 2. Query Vectorize Index
        const matches = await env.VECTOR_INDEX.query(queryVector, {
            topK: 5,
            returnMetadata: true
        });

        // 3. Return results
        // matches.matches contains { id, score, metadata }
        return new Response(JSON.stringify(matches.matches), {
             headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (e: any) {
        console.error(e);
        return new Response(JSON.stringify({ 
            error: 'Search failed',
            details: e.message || String(e)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
