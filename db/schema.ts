import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  githubId: integer('github_id').unique(),
  googleId: text('google_id').unique(),
  discordId: text('discord_id').unique(),
  username: text('username').notNull(),
  avatar: text('avatar'), // URL to R2 or external
  bio: text('bio'),
  socialLinks: text('social_links', { mode: 'json' }), // JSON string for { twitter, github, etc }
  
  // Provider-specific info (stored when linking accounts)
  githubUsername: text('github_username'),
  githubAvatar: text('github_avatar'),
  googleUsername: text('google_username'),
  googleAvatar: text('google_avatar'),
  discordUsername: text('discord_username'),
  discordAvatar: text('discord_avatar'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  country: text('country'),
  city: text('city'),
  createdAt: integer('created_at'),
  lastActive: integer('last_active'),
  
  // Network & ISP Information
  asn: integer('asn'),
  asOrganization: text('as_organization'),
  colo: text('colo'),
  continent: text('continent'),
  timezone: text('timezone'),
  
  // Enhanced Geolocation
  latitude: text('latitude'),
  longitude: text('longitude'),
  postalCode: text('postal_code'),
  region: text('region'),
  regionCode: text('region_code'),
  
  // Connection Details
  httpProtocol: text('http_protocol'),
  tlsVersion: text('tls_version'),
  tlsCipher: text('tls_cipher'),
  clientTcpRtt: integer('client_tcp_rtt'),
  
  // Security & Trust
  clientTrustScore: integer('client_trust_score'),
  isEUCountry: integer('is_eu_country'),
  
  // Device Information (client-collected)
  screenResolution: text('screen_resolution'), // e.g., "1920x1080"
  deviceMemory: integer('device_memory'), // GB
  cpuCores: integer('cpu_cores'), // logical cores
  connectionType: text('connection_type'), // e.g., "4g", "wifi", "slow-2g"
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  publishedAt: integer('published_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  views: integer('views').notNull().default(0),
});

export const comments = sqliteTable('comments', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    postId: text('post_id').notNull().references(() => posts.id), // Link to posts table if we want foreign key constraint, or just store slug/id
    content: text('content').notNull(),
    parentId: text('parent_id'), // For nested comments
    createdAt: integer('created_at', { mode: 'number' }).notNull()
});

export const likes = sqliteTable('likes', {
    userId: text('user_id').notNull().references(() => users.id),
    commentId: text('comment_id').references(() => comments.id),
    postId: text('post_id').references(() => posts.id), // Optional: likes on posts
    value: integer('value').notNull() // 1 for like, -1 for dislike
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.commentId, t.postId] }) // Composite PK
}));

export const music = sqliteTable('music', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	artist: text('artist').notNull(),
    url: text('url').notNull(),
    cover: text('cover'),
	createdAt: integer('created_at', { mode: 'number' }).notNull()
});

export const tableNames = {
    users: 'users',
    sessions: 'sessions',
    posts: 'posts',
    music: 'music',
    comments: 'comments',
    likes: 'likes'
}
