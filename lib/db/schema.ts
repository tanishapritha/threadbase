import { pgTable, uuid, text, varchar, timestamp, jsonb, boolean, pgEnum, serial, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['owner', 'member'] as const);
export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'posted', 'failed'] as const);
export const platformEnum = pgEnum('platform', ['twitter', 'linkedin'] as const);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clerkId: text('clerk_id').unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Workspaces table
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Workspace members table
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: roleEnum('role').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Preferences table
export const preferences = pgTable('preferences', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  bio: text('bio'),
  niche: text('niche'),
  defaultTone: text('default_tone'),
  twitterFormat: text('twitter_format'),
  linkedinFormat: text('linkedin_format'),
  addHashtags: boolean('add_hashtags').default(true),
  topics: text('topics').array(),
  avoidTopics: text('avoid_topics').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Connected accounts table
export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  platform: platformEnum('platform').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  platformUserId: text('platform_user_id').notNull(),
  platformUsername: text('platform_username'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  rawIdea: text('raw_idea').notNull(),
  formattedContent: jsonb('formatted_content').$type<{ twitter?: string; linkedin?: string }>(),
  postType: varchar('post_type', { length: 50 }),
  tone: text('tone'),
  hashtags: text('hashtags').array(),
  mediaUrl: text('media_url'),
  status: postStatusEnum('status').default('draft').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  postedAt: timestamp('posted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Post platforms table
export const postPlatforms = pgTable('post_platforms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid('post_id').notNull().references(() => posts.id),
  platform: platformEnum('platform').notNull(),
  content: text('content').notNull(),
  characterCount: integer('character_count'),
  status: postStatusEnum('status').default('draft').notNull(),
  postedAt: timestamp('posted_at'),
  externalId: text('external_id'),
});

// Schedules table
export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  platform: platformEnum('platform').notNull(),
  dayOfWeek: integer('day_of_week'), // 0-6 (Sunday=0)
  timeSlot: varchar('time_slot', { length: 5 }).notNull(), // HH:MM
  timezone: varchar('timezone', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ideas table
export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  rawText: text('raw_text').notNull(),
  ideaType: varchar('idea_type', { length: 50 }),
  isUsed: boolean('is_used').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dbSchema = {
  users,
  workspaces,
  workspaceMembers,
  preferences,
  connectedAccounts,
  posts,
  postPlatforms,
  schedules,
  ideas,
};
