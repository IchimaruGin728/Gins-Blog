import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../../lib/db';
import { posts, music } from '../../../db/schema';
import * as schema from '../../../db/schema';
import type { APIRoute } from 'astro';

// Initialize Hono
const app = new Hono().basePath('/api');

// RPC Route Definitions
const route = app.post(
  '/posts',
  zValidator(
    'form',
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      content: z.string().min(1),
      slug: z.string().min(1),
      publishedAt: z.string().optional(), // Receive as string from datetime-local
    })
  ),
  async (c) => {
    // Check for User ID (Session or ZT)
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id: existingId, title, content, slug, publishedAt } = c.req.valid('form');
    const env = c.env as Env;
    
    // @ts-ignore
    const db = getDb(env);
    
    // Use existing ID if provided (Edit Mode), or generate new
    const id = existingId || crypto.randomUUID();
    const timestamp = publishedAt ? new Date(publishedAt).getTime() : Date.now();

    // Upsert (Insert or Replce)
    // SQLite Drizzle: .onConflictDoUpdate
    // However, onConflict needs a target. `id` is PK.
    // If we provide ID, it might exist.
    
    // @ts-ignore
    await db.insert(posts).values({
        id,
        title,
        slug,
        content,
        createdAt: Date.now(), // Only valid for insert, but ignored on update if we don't set it
        updatedAt: Date.now(),
        publishedAt: timestamp
    }).onConflictDoUpdate({
        target: posts.id,
        set: {
            title,
            slug,
            content,
            updatedAt: Date.now(),
            publishedAt: timestamp
        }
    });
    
    try {
        const textToEmbed = `${title}\n${content.slice(0, 1000)}`;
        const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: [textToEmbed]
        }) as { data: number[][] };
        const embedding = embeddingResponse.data[0];

        // Vectorize upsert = insert with same ID
        await env.VECTOR_INDEX.upsert([
            {
                id: id,
                values: embedding,
                metadata: { title, slug }
            }
        ]);
    } catch (e) {
        console.error("AI Indexing failed", e);
    }
    
    return c.json({ success: true, id });
  }
);
  
app.post('/music', zValidator('form', z.object({
    title: z.string(),
    artist: z.string(),
    url: z.string(),
    cover: z.string().optional()
})), async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { title, artist, url, cover } = c.req.valid('form');
    // @ts-ignore
    const db = getDb(c.env);
    
    const id = crypto.randomUUID();
    // @ts-ignore
    await db.insert(schema.music).values({
        id,
        title,
        artist,
        url,
        cover,
        createdAt: Date.now()
    });
    
    return c.json({ success: true, id });
});

app.get('/music', async (c) => {
    // @ts-ignore
    const db = getDb(c.env);
    // @ts-ignore
     const tracks = await db.select().from(schema.music).orderBy(schema.music.createdAt, 'desc').all();
    return c.json(tracks);
});


export type AppType = typeof route;

import { getZeroTrustUser } from '../../lib/zerotrust';

export const ALL: APIRoute = async (context) => {
    const env = context.locals.runtime.env;
    const request = new Request(context.request);
    
    if (context.locals.user) {
        request.headers.set('X-User-Id', context.locals.user.id);
    } else {
        // Fallback: Check if request is from ZT Admin (e.g. Dashboard calls)
        // Since API is outside /IchimaruGin728/admin prefix, it might not be protected by Middleware ZT Check
        // BUT, if the dashboard calls it, the cookies/headers are passed?
        // ZT headers are passed if the zone is protected.
        // Assuming we are in a protected environment or local dev mock.
        const ztUser = getZeroTrustUser(context.request);
        if (ztUser) {
            request.headers.set('X-User-Id', ztUser.id);
        }
    }

    return app.fetch(request, env);
}
