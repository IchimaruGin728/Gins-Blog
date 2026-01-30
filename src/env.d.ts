/// <reference path="../.astro/types.d.ts" />

declare namespace App {
	interface Locals {
		runtime: {
			env: Env;
			cf: import('@cloudflare/workers-types').CfProperties;
			ctx: import('@cloudflare/workers-types').ExecutionContext;
		};
		user: import('../db/schema').User | null;
		session: import('../db/schema').Session | null;
	}
}

interface Env {
	DB: import('@cloudflare/workers-types').D1Database;
	GIN_KV: import('@cloudflare/workers-types').KVNamespace;
	GINS_CACHE: import('@cloudflare/workers-types').KVNamespace;
	BUCKET: import('@cloudflare/workers-types').R2Bucket;
	MY_QUEUE: import('@cloudflare/workers-types').Queue;
	VECTOR_INDEX: import('@cloudflare/workers-types').VectorizeIndex;
	AI: import('@cloudflare/workers-types').Ai;
	
	// Secrets
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	GITHUB_REDIRECT_URI: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_REDIRECT_URI: string;
	DISCORD_CLIENT_ID: string;
	DISCORD_CLIENT_SECRET: string;
	DISCORD_REDIRECT_URI: string;
}
