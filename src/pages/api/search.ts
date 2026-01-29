import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { posts } from '../../../db/schema';
import { inArray, isNotNull, and } from 'drizzle-orm';

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

        // 2. Query Vectorize Index (Get mostly IDs)
        // We request top 20 to allow for some being filtered out (deleted/unpublished)
        const vectorMatches = await env.VECTOR_INDEX.query(queryVector, {
            topK: 20,
            returnMetadata: true
        });

        const matchIds = vectorMatches.matches.map(m => m.id);

        if (matchIds.length === 0) {
             return new Response(JSON.stringify([]), {
                 headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Verify against D1 Database (The Source of Truth)
        // This automatically filters out:
        // - Deleted posts (won't exist in D1)
        // - Unpublished posts (publishedAt is null)
        // @ts-ignore
        const db = getDb(env);
        
        // @ts-ignore
        const validPosts = await db.select({
            title: posts.title,
            slug: posts.slug,
            publishedAt: posts.publishedAt
        })
        .from(posts)
        .where(and(
            inArray(posts.id, matchIds),
            isNotNull(posts.publishedAt)
        ))
        .all();

        // 4. Combine Results (Attach scores from Vectorize)
        const results = validPosts.map((post: any) => {
            const vectorMatch = vectorMatches.matches.find(m => m.id === post.id || m.id === post.slug); // Handle potentially different ID schemes if any
            // Note: We used ID in upsert, so it should match posts.id within vector index
            // But verify: upsert used 'id: id'
            
            // Fallback score if id mismatch (shouldn't happen in robust setup)
            const score = vectorMatch ? vectorMatch.score : 0;
            
            return {
                metadata: {
                    title: post.title,
                    slug: post.slug
                },
                score: score
            };
        }).sort((a: any, b: any) => b.score - a.score).slice(0, 5); // Return top 5 valid ones

        return new Response(JSON.stringify(results), {
             headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (e: any) {
        console.error("AI Hybrid Search failed", e);
        // Fallback to basic DB search if AI fails? 
        // For now return error or empty to notify admin
        return new Response(JSON.stringify({ 
            error: 'AI Search failed',
            details: e.message || String(e)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
