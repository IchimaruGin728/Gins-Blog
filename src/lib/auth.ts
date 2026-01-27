import { GitHub, Google, Discord } from 'arctic';

// ⚠️ Environment variables should be set in .dev.vars or Cloudflare Dashboard
// Do not hardcode secrets

export const github = new GitHub(
  import.meta.env.GITHUB_CLIENT_ID ?? '',
  import.meta.env.GITHUB_CLIENT_SECRET ?? '',
  null
);

export const google = new Google(
  import.meta.env.GOOGLE_CLIENT_ID ?? '',
  import.meta.env.GOOGLE_CLIENT_SECRET ?? '',
  import.meta.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4321/login/google/callback'
);

export const discord = new Discord(
  import.meta.env.DISCORD_CLIENT_ID ?? '',
  import.meta.env.DISCORD_CLIENT_SECRET ?? '',
  import.meta.env.DISCORD_REDIRECT_URI ?? 'http://localhost:4321/login/discord/callback'
);
