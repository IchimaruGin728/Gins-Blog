
import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { likes } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    try {
        const body = await request.json() as any;
        const { commentId, value } = body; // value: 1 = like, 0 = remove

        const db = getDb(locals.runtime.env);

        if (value === 0) {
            // Remove like
            await db.delete(likes).where(
                and(
                    eq(likes.userId, user.id),
                    eq(likes.commentId, commentId)
                )
            );
        } else {
            // Add like (upsert if supported or check exist)
            // SQLite Drizzle upsert: .onConflictDoNothing()
            await db.insert(likes).values({
                userId: user.id,
                commentId,
                value: 1
            }).onConflictDoNothing();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
}
