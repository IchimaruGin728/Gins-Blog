import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { posts } from '../../../db/schema';
import { inArray, isNotNull, and } from 'drizzle-orm';
import { querySimilarPosts } from '../../lib/vectorize';

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
        // 1. Semantic Search via Vectorize (using shared helper)
        const vectorMatches = await querySimilarPosts(env.AI, env.VECTOR_INDEX, q, 20);

        const matchIds = vectorMatches.map(m => m.id);

        if (matchIds.length === 0) {
             return new Response(JSON.stringify([]), {
                 headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Verify against D1 Database (The Source of Truth)
        // This automatically filters out:
        // - Deleted posts (won't exist in D1)
        // - Unpublished posts (publishedAt is null)
        // @ts-ignore
        const db = getDb(env);
        
        // @ts-ignore
        const validPosts = await db.select({
            id: posts.id,
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

        // 3. Combine Results (Attach scores from Vectorize)
        const results = validPosts.map((post: any) => {
            const vectorMatch = vectorMatches.find(m => m.id === post.id);
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
        return new Response(JSON.stringify({ 
            error: 'AI Search failed',
            details: e.message || String(e)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
