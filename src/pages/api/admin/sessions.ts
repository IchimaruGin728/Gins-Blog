
import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { sessions } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { getZeroTrustUser } from "../../../lib/zerotrust";

// Disable prerendering and CSRF for this admin API
export const prerender = false;

export const DELETE: APIRoute = async ({ locals, request }) => {
  // Verify Zero Trust authentication
  const ztUser = getZeroTrustUser(request);
  if (!ztUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const env = locals.runtime.env;
  const db = getDb(env);

  try {
    // 1. Delete all sessions from D1
    // We use .delete(sessions) without where clause to delete all rows
    await db.delete(sessions);

    // 2. Clear KV Sessions
    // Since we can't easily iterate and delete all 'session:*' keys in KV without listing them first,
    // and listing is eventually consistent, a "best effort" approach here is acceptable.
    // However, for a true "Logout All", we rely on the D1 check.
    // Since our session validation logic CHECKS D1 if KV is missing (or fails validation),
    // removing them from D1 is the source of truth.
    // But wait, our `validateSessionToken` optimizes by trusting KV first.
    // Implementation Plan says: "KV check Session -> D1 check User".
    // If KV is valid, we might assume session is valid.
    // So we MUST Invalidate KV.
    
    // To invalidate all KV sessions, we would need to list and delete.
    // For now, let's implement listing and deleting.
    
    let cursor: string | undefined = undefined;
    let listComplete = false;
    
    while (!listComplete) {
        const list: { keys: { name: string }[], list_complete: boolean, cursor?: string } = await env.GIN_KV.list({ prefix: "session:", cursor });
        
        // Delete in batches (parallel promises)
        if (list.keys.length > 0) {
            await Promise.all(list.keys.map((key) => env.GIN_KV.delete(key.name)));
        }
        
        listComplete = list.list_complete;
        cursor = list.cursor;
    }

    return new Response(JSON.stringify({ success: true, message: "All sessions terminated." }), {
      status: 200,
    });
  } catch (e: any) {
    console.error("Failed to terminate sessions:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
