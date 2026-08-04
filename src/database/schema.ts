import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'Announcement', 'Rules'
  description: text('description'),
  color: text('color'),
  defaultImage: text('default_image'),
  defaultThumbnail: text('default_thumbnail'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  projectKey: text('project_key').notNull().unique(), // e.g., 'snowos'
  name: text('name').notNull(),
  description: text('description'),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  messageId: text('message_id').unique(), // Will be null if it's saved as draft or not yet sent
  channelId: text('channel_id'),
  authorId: text('author_id').notNull(),
  
  templateId: integer('template_id').references(() => templates.id),
  projectId: integer('project_id').references(() => projects.id),
  
  title: text('title'),
  description: text('description'),
  color: text('color'),
  thumbnail: text('thumbnail'),
  image: text('image'),
  footer: text('footer'),
  buttonUrl: text('button_url'),
  buttonLabel: text('button_label'),
  roleMention: text('role_mention'), // Role ID to mention
  
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const suggestions = pgTable('suggestions', {
  id: serial('id').primaryKey(),
  projectKey: text('project_key').notNull(),
  type: text('type').notNull(), // Feature Request, Improvement, etc.
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  authorId: text('author_id').notNull(),
  status: text('status').default('Pending').notNull(),
  messageId: text('message_id'),
  threadId: text('thread_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const suggestionVotes = pgTable('suggestion_votes', {
  suggestionId: integer('suggestion_id').references(() => suggestions.id).notNull(),
  userId: text('user_id').notNull(),
  isUpvote: boolean('is_upvote').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const suggestionHistory = pgTable('suggestion_history', {
  id: serial('id').primaryKey(),
  suggestionId: integer('suggestion_id').references(() => suggestions.id).notNull(),
  changedBy: text('changed_by').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

export const bugReports = pgTable('bug_reports', {
  id: serial('id').primaryKey(),
  projectKey: text('project_key').notNull(),
  version: text('version').notNull(),
  platform: text('platform').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  steps: text('steps').notNull(),
  expected: text('expected').notNull(),
  actual: text('actual').notNull(),
  attachmentUrl: text('attachment_url'),
  authorId: text('author_id').notNull(),
  status: text('status').default('Open').notNull(),
  messageId: text('message_id'),
  threadId: text('thread_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bugHistory = pgTable('bug_history', {
  id: serial('id').primaryKey(),
  bugId: integer('bug_id').references(() => bugReports.id).notNull(),
  changedBy: text('changed_by').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

export const threads = pgTable('threads', {
  id: text('id').primaryKey(), // Discord Thread ID
  channelId: text('channel_id').notNull(),
  linkedId: integer('linked_id').notNull(),
  type: text('type').notNull(), // 'suggestion' | 'bug'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
