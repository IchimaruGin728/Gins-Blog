
import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { comments, users, likes, posts } from '../../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    
    // We need to resolve the post ID from slug if passed, or expect ID.
    // The component passes what it gets. Let's assume it passes the SLUG because that's what the front-end usually has more easily?
    // Or we pass the UUID if we query it in the Astro page.
    
    if (!postId) return new Response(JSON.stringify([]), { status: 200 });

    const db = getDb(locals.runtime.env);
    const currentUser = locals.user;

    // We need to get the internal UUID for the post if postId is a slug
    // But let's assume valid UUID is passed for now, or handle slug lookup.
    // Actually, passing slug is safer for frontend. 
    // Let's check if it looks like a slug (not uuid)
    let targetPostId = postId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    
    if (!isUuid) {
        const p = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, postId)).get();
        if (p) targetPostId = p.id;
        else return new Response(JSON.stringify([]), { status: 200 });
    }

    const allComments = await db.select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
            username: users.username,
            avatar: users.avatar
        },
        likesCount: sql<number>`count(${likes.userId})`,
        // We'd ideally check if *current user* liked it here too, but simple count first
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .leftJoin(likes, eq(comments.id, likes.commentId)) // Left join for likes
    .where(eq(comments.postId, targetPostId))
    .groupBy(comments.id)
    .orderBy(desc(comments.createdAt))
    .all();

    // To check if current user liked, we can do a separate query or smarter join.
    // For MVP/Speed, let's just map it if user is logged in.
    let enrichedComments = allComments.map(c => ({
        ...c,
        likes: Number(c.likesCount), // SQLite returns number/string
        likedByUser: false
    }));

    if (currentUser) {
        const userLikes = await db.select({ commentId: likes.commentId })
            .from(likes)
            .where(and(eq(likes.userId, currentUser.id), eq(likes.value, 1)))
            .all();
        
        const likedSet = new Set(userLikes.map(l => l.commentId));
        enrichedComments = enrichedComments.map(c => ({
            ...c,
            likedByUser: likedSet.has(c.id)
        }));
    }

    return new Response(JSON.stringify(enrichedComments), { status: 200 });
};

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    try {
        const body = await request.json() as any;
        const { postId, content } = body;
        // postId might be slug
        
        const db = getDb(locals.runtime.env);
        
        let targetPostId = postId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
        if (!isUuid) {
             const p = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, postId)).get();
             if (!p) return new Response(JSON.stringify({ error: 'Post not found '}), { status: 404 });
             targetPostId = p.id;
        }

        await db.insert(comments).values({
            id: crypto.randomUUID(),
            userId: user.id,
            postId: targetPostId,
            content,
            createdAt: Date.now()
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
}
