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
