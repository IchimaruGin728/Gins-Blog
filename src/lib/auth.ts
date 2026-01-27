import { GitHub, Google, Discord } from 'arctic';

// Helper to check if we are in dev mode (for fallback)
// But preferably we trust the Env object passed in.

export const getGithub = (env: Env) => {
  // Fallback to import.meta.env for local dev if Env is missing secrets (unlikely if configured right) or if we want to support both.
  // Actually, in Cloudflare SSR, 'env' is the source of truth for runtime secrets.
  const clientId = env.GITHUB_CLIENT_ID ?? import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET ?? import.meta.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
  }

  return new GitHub(clientId, clientSecret, null);
};

export const getGoogle = (env: Env) => {
  const clientId = env.GOOGLE_CLIENT_ID ?? import.meta.env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET ?? import.meta.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI ?? import.meta.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4321/login/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  return new Google(clientId, clientSecret, redirectUri);
};

export const getDiscord = (env: Env) => {
  const clientId = env.DISCORD_CLIENT_ID ?? import.meta.env.DISCORD_CLIENT_ID;
  const clientSecret = env.DISCORD_CLIENT_SECRET ?? import.meta.env.DISCORD_CLIENT_SECRET;
  const redirectUri = env.DISCORD_REDIRECT_URI ?? import.meta.env.DISCORD_REDIRECT_URI ?? 'http://localhost:4321/login/discord/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET');
  }

  return new Discord(clientId, clientSecret, redirectUri);
};
