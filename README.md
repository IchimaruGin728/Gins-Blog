# Gin's Blog

A bleeding-edge blog platform built with the **Pure Cloudflare Worker Architecture**.

## Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Astro 5.0 + Hono
- **UI**: Preact + UnoCSS ("Neo-Gin" Theme)
- **Database**: D1 + Drizzle ORM
- **Auth**: Arctic (GitHub/Google)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Secrets**:
   Create a `.dev.vars` file with your secrets:
   ```env
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

3. **Database Setup**:
   Update `wrangler.jsonc` with your D1 Database ID.
   ```bash
   npx wrangler d1 create gins-blog-db
   ```
   Paste the ID into `wrangler.jsonc`.

4. **Run Development**:
   ```bash
   npm run dev
   ```

5. **Deploy**:
   ```bash
   npm run deploy
   ```
