import {
  pgTable, uuid, text, timestamp, boolean, integer, bigint, jsonb, date, doublePrecision, index, uniqueIndex, primaryKey, bigserial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  emailVerifiedAt: ts('email_verified_at'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['user', 'moderator', 'admin'] }).notNull().default('user'),
  status: text('status', { enum: ['active', 'paused', 'suspended', 'deleted'] }).notNull().default('active'),
  locale: text('locale').notNull().default('es'),
  birthdate: date('birthdate', { mode: 'string' }).notNull(),
  marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
  isDemo: boolean('is_demo').notNull().default(false),
  lastActiveAt: ts('last_active_at'),
  pausedAt: ts('paused_at'),
  suspendedReason: text('suspended_reason'),
  deletedAt: ts('deleted_at'),
  purgeAfter: ts('purge_after'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('users_email_unique').on(t.email), index('users_status_idx').on(t.status)]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  device: text('device'),
  ip: text('ip'),
  createdAt: ts('created_at').notNull().defaultNow(),
  lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
  expiresAt: ts('expires_at').notNull(),
  revokedAt: ts('revoked_at'),
}, (t) => [uniqueIndex('sessions_token_hash_unique').on(t.tokenHash), index('sessions_user_idx').on(t.userId)]);

export const emailTokens = pgTable('email_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['verify', 'reset', 'delete_confirm'] }).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('email_tokens_hash_unique').on(t.tokenHash)]);

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio: text('bio').notNull().default(''),
  gender: text('gender', { enum: ['mujer', 'hombre', 'no_binario', 'otro'] }).notNull(),
  interestedIn: text('interested_in', { enum: ['mujeres', 'hombres', 'todas'] }).notNull(),
  intent: text('intent'),
  interests: text('interests').array().notNull().default(sql`'{}'::text[]`),
  planTypes: text('plan_types').array().notNull().default(sql`'{}'::text[]`),
  idealPlan: text('ideal_plan'),
  heightCm: integer('height_cm'),
  occupation: text('occupation'),
  showAge: boolean('show_age').notNull().default(true),
  showDistance: boolean('show_distance').notNull().default(true),
  city: text('city'),
  /** Coordenadas SIEMPRE redondeadas (~1 km). Nunca se exponen al cliente. */
  latCoarse: doublePrecision('lat_coarse'),
  lngCoarse: doublePrecision('lng_coarse'),
  prefAgeMin: integer('pref_age_min').notNull().default(18),
  prefAgeMax: integer('pref_age_max').notNull().default(45),
  prefMaxDistanceKm: integer('pref_max_distance_km').notNull().default(40),
  incognito: boolean('incognito').notNull().default(false),
  verifiedAt: ts('verified_at'),
  completedAt: ts('completed_at'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('profiles_geo_idx').on(t.latCoarse, t.lngCoarse), index('profiles_gender_idx').on(t.gender)]);

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull(),
  position: integer('position').notNull().default(0),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  moderationNotes: text('moderation_notes'),
  width: integer('width'),
  height: integer('height'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [index('photos_user_idx').on(t.userId), index('photos_status_idx').on(t.status)]);

export const swipes = pgTable('swipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action', { enum: ['like', 'pass'] }).notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  undoneAt: ts('undone_at'),
}, (t) => [uniqueIndex('swipes_actor_target_unique').on(t.actorId, t.targetId), index('swipes_target_idx').on(t.targetId, t.action)]);

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userA: uuid('user_a').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userB: uuid('user_b').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: ts('created_at').notNull().defaultNow(),
  endedAt: ts('ended_at'),
  endedBy: uuid('ended_by'),
  endedReason: text('ended_reason'),
}, (t) => [uniqueIndex('matches_pair_unique').on(t.userA, t.userB), index('matches_user_b_idx').on(t.userB)]);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  firstMessageAt: ts('first_message_at'),
  lastMessageAt: ts('last_message_at'),
  lastSeq: integer('last_seq').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('conversations_match_unique').on(t.matchId)]);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  kind: text('kind', { enum: ['user', 'system'] }).notNull().default('user'),
  clientId: text('client_id'),
  seq: integer('seq').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('messages_idempotency_unique').on(t.conversationId, t.senderId, t.clientId),
  uniqueIndex('messages_conv_seq_unique').on(t.conversationId, t.seq),
]);

export const conversationReads = pgTable('conversation_reads', {
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastReadSeq: integer('last_read_seq').notNull().default(0),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.conversationId, t.userId] })]);

export const blocks = pgTable('blocks', {
  blockerId: uuid('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: uuid('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] }), index('blocks_blocked_idx').on(t.blockedId)]);

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  details: text('details'),
  conversationId: uuid('conversation_id'),
  status: text('status', { enum: ['open', 'reviewing', 'resolved', 'dismissed'] }).notNull().default('open'),
  resolution: text('resolution'),
  handledBy: uuid('handled_by'),
  createdAt: ts('created_at').notNull().defaultNow(),
  resolvedAt: ts('resolved_at'),
}, (t) => [index('reports_status_idx').on(t.status), index('reports_target_idx').on(t.targetId)]);

export const appeals = pgTable('appeals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: ['open', 'accepted', 'rejected'] }).notNull().default('open'),
  decisionNotes: text('decision_notes'),
  handledBy: uuid('handled_by'),
  createdAt: ts('created_at').notNull().defaultNow(),
  resolvedAt: ts('resolved_at'),
});

export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['selfie_pose', 'id_provider'] }).notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  storageKey: text('storage_key'),
  poseCode: text('pose_code'),
  providerRef: text('provider_ref'),
  reviewerId: uuid('reviewer_id'),
  notes: text('notes'),
  createdAt: ts('created_at').notNull().defaultNow(),
  resolvedAt: ts('resolved_at'),
}, (t) => [index('verification_status_idx').on(t.status)]);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['stripe', 'mercadopago', 'apple', 'google', 'manual'] }).notNull(),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id'),
  status: text('status', { enum: ['incomplete', 'pending', 'active', 'past_due', 'canceled', 'expired', 'refunded', 'revoked'] }).notNull(),
  currentPeriodEnd: ts('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  priceCurrency: text('price_currency'),
  priceAmountMinor: integer('price_amount_minor'),
  lastEventAt: ts('last_event_at'),
  raw: jsonb('raw'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('subscriptions_provider_unique').on(t.channel, t.providerSubscriptionId),
  index('subscriptions_user_idx').on(t.userId),
]);

/** Registro de TODOS los webhooks recibidos; la unicidad por evento del proveedor garantiza idempotencia. */
export const billingEvents = pgTable('billing_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  channel: text('channel').notNull(),
  providerEventId: text('provider_event_id').notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  eventTime: ts('event_time'),
  receivedAt: ts('received_at').notNull().defaultNow(),
  processedAt: ts('processed_at'),
  status: text('status', { enum: ['received', 'processed', 'ignored', 'error'] }).notNull().default('received'),
  error: text('error'),
}, (t) => [uniqueIndex('billing_events_provider_unique').on(t.channel, t.providerEventId)]);

/** Dinero realmente cobrado/devuelto, para ingresos conciliados en el panel. */
export const paymentRecords = pgTable('payment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  channel: text('channel').notNull(),
  providerPaymentId: text('provider_payment_id').notNull(),
  kind: text('kind', { enum: ['charge', 'refund', 'chargeback'] }).notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull(),
  feeMinor: integer('fee_minor'),
  occurredAt: ts('occurred_at').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('payment_records_provider_unique').on(t.channel, t.providerPaymentId, t.kind)]);

export const notificationPrefs = pgTable('notification_prefs', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  pushMatches: boolean('push_matches').notNull().default(true),
  pushMessages: boolean('push_messages').notNull().default(true),
  emailProduct: boolean('email_product').notNull().default(true),
  emailMarketing: boolean('email_marketing').notNull().default(false),
  quietStartHour: integer('quiet_start_hour').notNull().default(22),
  quietEndHour: integer('quiet_end_hour').notNull().default(8),
  maxPromoPerWeek: integer('max_promo_per_week').notNull().default(1),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  platform: text('platform', { enum: ['ios', 'android', 'web'] }).notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('push_tokens_token_unique').on(t.token)]);

export const outboundMessages = pgTable('outbound_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['email', 'push', 'in_app'] }).notNull(),
  template: text('template').notNull(),
  category: text('category', { enum: ['transactional', 'product', 'promotional'] }).notNull(),
  status: text('status', { enum: ['queued', 'sent', 'failed', 'skipped'] }).notNull(),
  detail: text('detail'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [index('outbound_user_idx').on(t.userId, t.createdAt)]);

export const knowledgeArticles = pgTable('knowledge_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  version: integer('version').notNull().default(1),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
  updatedBy: uuid('updated_by'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('kb_slug_locale_version_unique').on(t.slug, t.locale, t.version)]);

export const assistantConversations = pgTable('assistant_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  locale: text('locale').notNull().default('es'),
  handoffRequested: boolean('handoff_requested').notNull().default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const assistantMessages = pgTable('assistant_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => assistantConversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  model: text('model'),
  tokensIn: integer('tokens_in').notNull().default(0),
  tokensOut: integer('tokens_out').notNull().default(0),
  costUsdMicro: bigint('cost_usd_micro', { mode: 'number' }).notNull().default(0),
  toolsUsed: jsonb('tools_used'),
  degraded: boolean('degraded').notNull().default(false),
  latencyMs: integer('latency_ms'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [index('assistant_msgs_conv_idx').on(t.conversationId)]);

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorId: uuid('actor_id'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: jsonb('metadata'),
  ip: text('ip'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [index('audit_action_idx').on(t.action, t.createdAt)]);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const jobRuns = pgTable('job_runs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  startedAt: ts('started_at').notNull().defaultNow(),
  finishedAt: ts('finished_at'),
  ok: boolean('ok'),
  detail: text('detail'),
});

export const dataExports = pgTable('data_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'ready', 'expired'] }).notNull().default('pending'),
  storageKey: text('storage_key'),
  createdAt: ts('created_at').notNull().defaultNow(),
  expiresAt: ts('expires_at'),
});

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  city: text('city'),
  gender: text('gender'),
  source: text('source'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('waitlist_email_unique').on(t.email)]);
