import { pgTable, text, timestamp, integer, customType, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// Vector Custom Type for pgvector (1536 dimensions for text-embedding-3-small)
export const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value as number[];
  },
});

// TSVector Custom Type for BM25 Full-Text Search
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
  toDriver(value: string) {
    return value;
  },
  fromDriver(value: unknown) {
    return String(value);
  },
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  tier: text('tier', { enum: ['free', 'pro', 'enterprise'] }).default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'editor', 'viewer'] }).default('viewer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaceInvitations = pgTable('workspace_invitations', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  workspaceName: text('workspace_name').notNull(),
  inviterUserId: text('inviter_user_id').notNull().references(() => users.id),
  inviterName: text('inviter_name'),
  inviterEmail: text('inviter_email'),
  inviteeEmail: text('invitee_email').notNull(),
  role: text('role', { enum: ['owner', 'editor', 'viewer'] }).default('editor').notNull(),
  status: text('status', { enum: ['pending', 'accepted', 'declined'] }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  storageKey: text('storage_key').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'ready', 'failed'] }).default('pending').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  chunkCount: integer('chunk_count').default(0).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documentChunks = pgTable('document_chunks', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding'),
  ftsTokens: tsvector('fts_tokens'),
  metadata: jsonb('metadata').$type<{ pageNumber?: number; tokenCount: number; sectionHeading?: string }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  retrievedChunkIds: jsonb('retrieved_chunk_ids').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
