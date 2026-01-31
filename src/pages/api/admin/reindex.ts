import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { posts } from '../../../../db/schema';
// import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ locals }) => {
    const env = locals.runtime.env;
    const db = getDb(env);

    // 1. Fetch all posts
    const allPosts = await db.select().from(posts).all();
    
    let indexedCount = 0;
    let errors: any[] = [];

    // 2. Iterate and Embed
    // Note: In a real large-scale app, we'd use a queue/workflow. For 50 posts, this is fine.
    for (const post of allPosts) {
        try {
            const textToEmbed = `Title: ${post.title}\n\nContent: ${post.content.slice(0, 1500)}`; // Truncate to fit context window if needed
            
            const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
                text: [textToEmbed]
            }) as { data: number[][] };
            
            const embedding = embeddingResponse.data[0];

            await env.VECTOR_INDEX.upsert([
                {
                    id: post.id,
                    values: embedding,
                    metadata: { 
                        title: post.title, 
                        slug: post.slug,
                        publishedAt: post.publishedAt?.toString() || ""
                    }
                }
            ]);
            indexedCount++;
        } catch (e: any) {
            console.error(`Failed to index post ${post.slug}`, e);
            errors.push({ 
                slug: post.slug, 
                error: e.message || String(e),
                stack: e.stack
            });
        }
    }

    return new Response(JSON.stringify({ 
        success: true, 
        indexed: indexedCount, 
        total: allPosts.length,
        errors 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
