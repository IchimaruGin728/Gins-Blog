---
title: "Architecture"
description: "System design and edge-native infrastructure"
order: 2
---

# Edge-Native Architecture

Gins-Blog isn't merely hosted; it exists simultaneously across hundreds of data centers globally. By leveraging the Cloudflare ecosystem, the application achieves extremely fast TTFB (Time To First Byte).

## The Astro/Hono Symbiosis

I utilize a unique hybrid approach:
- **Astro** handles the core of Server-Side Rendering (SSR). It compiles components to extremely lightweight HTML/CSS, perfectly suited for V8 Isolates.
- **Hono** is mounted within Astro's server execution context to handle raw API routes, RPC (Remote Procedure Calls), and strict data validation using Zod.

### D1 Database & Drizzle

Relational data is stored in **Cloudflare D1** (Serverless SQLite).

```typescript
// Example: Post Schema Definition
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  publishedAt: integer("published_at"),
});
```

Because D1 operates via HTTP APIs rather than traditional TCP sockets, connection limits are no longer a bottleneck. Drizzle ORM provides absolute type-safety from the database schema up to the frontend UI components.

> [!TIP]
> For heavy read operations on the homepage, the API utilizes a dual-layer caching strategy: memory cache (`Map`) fallback to Cloudflare KV.

## AI & Semantic Search

The platform integrates directly with Cloudflare Vectorize. Every time a post is published, its contents are chunked, embedded using an edge-hosted LLM model (`@cf/baai/bge-small-en-v1.5`), and stored in a vector database.

This enables:
- **Semantic Text Search:** Searching for "how to deploy" will surface articles about "infrastructure and hosting" without requiring exact keyword matches.
- **Automated Tags:** The system can intelligently infer relationships between posts.
