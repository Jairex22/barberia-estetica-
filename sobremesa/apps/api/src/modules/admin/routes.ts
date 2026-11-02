import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, desc, sql, asc } from 'drizzle-orm';
import { parse } from '../../plugins/validation.js';
import { requireRole } from '../../plugins/context.js';
import { users, profiles, photos, reports, appeals, verificationRequests, subscriptions, paymentRecords, billingEvents, auditLog, settings, knowledgeArticles, matches, messages, assistantConversations, assistantMessages } from '../../db/schema.js';
import { signMediaUrl } from '../../services/media.js';
import { audit } from '../../services/audit.js';
import { errors } from '../../services/errors.js';
import { costSummary } from '../assistant/service.js';
import { reconcile } from '../billing/service.js';
import { setSetting, SETTING_DEFAULTS } from '../../services/settings.js';
import { endMatchesBetween } from '../matches/service.js';
import { recomputeCompleteness } from '../profiles/service.js';
import { runJob, JOB_NAMES } from '../../jobs/scheduler.js';

/**
 * Panel administrativo. Moderadores: reportes, fotos, verificaciones y apelaciones con la información mínima
 * (sin correo, sin pagos). Administradores: todo. Cada acción queda en audit_log.
 */
export async function adminRoutes(app: FastifyInstance) {
  const mod = (req: any) => requireRole(req, ['moderator', 'admin']);
  const admin = (req: any) => requireRole(req, ['admin']);
  const id = z.object({ id: z.uuid() });

  app.get('/metrics', async (req) => {
    admin(req);
    const [u] = await app.db.execute(sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE status='active')::int AS active, count(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
      count(*) FILTER (WHERE last_active_at > now() - interval '7 days')::int AS wau, count(*) FILTER (WHERE last_active_at > now() - interval '30 days')::int AS mau, count(*) FILTER (WHERE is_demo)::int AS demo FROM users WHERE status <> 'deleted'`) as any[];
    const [p] = await app.db.execute(sql`SELECT count(*) FILTER (WHERE completed_at IS NOT NULL)::int AS complete, count(*) FILTER (WHERE verified_at IS NOT NULL)::int AS verified FROM profiles`) as any[];
    const [m] = await app.db.execute(sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE ended_at IS NULL)::int AS active, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS last7 FROM matches`) as any[];
    const [c] = await app.db.execute(sql`SELECT count(*)::int AS conversations, count(*) FILTER (WHERE first_message_at IS NOT NULL)::int AS started,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM messages x WHERE x.conversation_id = conversations.id AND x.sender_id <> (SELECT sender_id FROM messages f WHERE f.conversation_id = conversations.id AND f.seq = 1)))::int AS reciprocal FROM conversations`) as any[];
    const subs = await app.db.execute(sql`SELECT channel, status, count(*)::int AS n FROM subscriptions GROUP BY 1,2 ORDER BY 1,2`);
    const revenue = await app.db.execute(sql`SELECT currency, sum(amount_minor) FILTER (WHERE kind='charge')::bigint AS charged_minor, sum(amount_minor) FILTER (WHERE kind='refund')::bigint AS refunded_minor,
      sum(amount_minor) FILTER (WHERE kind='chargeback')::bigint AS chargeback_minor, count(*) FILTER (WHERE kind='charge')::int AS charges FROM payment_records WHERE occurred_at > now() - interval '30 days' GROUP BY 1`);
    const [q] = await app.db.execute(sql`SELECT (SELECT count(*) FROM reports WHERE status IN ('open','reviewing'))::int AS open_reports, (SELECT count(*) FROM photos WHERE status='pending')::int AS pending_photos,
      (SELECT count(*) FROM verification_requests WHERE status='pending')::int AS pending_verifications, (SELECT count(*) FROM appeals WHERE status='open')::int AS open_appeals,
      (SELECT count(*) FROM assistant_conversations WHERE handoff_requested)::int AS handoffs, (SELECT count(*) FROM billing_events WHERE status='error')::int AS billing_errors`) as any[];
    const ai = await costSummary(app.db);
    return { users: u, profiles: p, matches: m, chat: c, subscriptions: subs, revenueLast30d: revenue, queues: q, ai: { monthToDateUsd: ai.monthToDateUsd, budgetUsd: ai.budgetUsd, configured: ai.configured } };
  });

  // ---- Moderación: reportes ----
  app.get('/reports', async (req) => {
    mod(req);
    const { status } = parse(z.object({ status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']).default('open') }), req.query);
    const rows = await app.db.select().from(reports).where(eq(reports.status, status)).orderBy(asc(reports.createdAt)).limit(100);
    return { reports: rows };
  });
  app.get('/reports/:id/context', async (req) => {
    const me = mod(req); const { id: rid } = parse(id, req.params);
    const [r] = await app.db.select().from(reports).where(eq(reports.id, rid)).limit(1);
    if (!r) throw errors.notFound();
    // Mínimo necesario: perfil público del reportado, sus fotos, y mensajes de la conversación reportada (si la hay).
    const [target] = await app.db.select({ displayName: profiles.displayName, bio: profiles.bio, status: users.status, createdAt: users.createdAt }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(eq(profiles.userId, r.targetId)).limit(1);
    const ph = await app.db.select().from(photos).where(eq(photos.userId, r.targetId));
    const msgs = r.conversationId ? await app.db.select({ senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt }).from(messages).where(eq(messages.conversationId, r.conversationId)).orderBy(asc(messages.seq)).limit(200) : [];
    const [{ priorReports }] = await app.db.select({ priorReports: sql<number>`count(*)::int` }).from(reports).where(eq(reports.targetId, r.targetId));
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.report_context_viewed', targetType: 'report', targetId: rid });
    return { report: r, target, photos: ph.map((x) => ({ id: x.id, url: signMediaUrl(x.storageKey, me.id), status: x.status })), messages: msgs, priorReports };
  });
  app.patch('/reports/:id', async (req) => {
    const me = mod(req); const { id: rid } = parse(id, req.params);
    const body = parse(z.object({ status: z.enum(['reviewing', 'resolved', 'dismissed']), resolution: z.string().max(1000).optional(), action: z.enum(['none', 'warn', 'suspend']).default('none') }), req.body);
    const [r] = await app.db.select().from(reports).where(eq(reports.id, rid)).limit(1);
    if (!r) throw errors.notFound();
    await app.db.update(reports).set({ status: body.status, resolution: body.resolution ?? null, handledBy: me.id, resolvedAt: body.status === 'reviewing' ? null : new Date().toISOString() }).where(eq(reports.id, rid));
    if (body.action === 'suspend') await suspendUser(app, me, r.targetId, `Reporte ${rid}: ${body.resolution ?? ''}`);
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.report_updated', targetType: 'report', targetId: rid, metadata: body });
    return { ok: true };
  });

  // ---- Moderación: fotos ----
  app.get('/photos/pending', async (req) => {
    const me = mod(req);
    const rows = await app.db.select().from(photos).where(eq(photos.status, 'pending')).orderBy(asc(photos.createdAt)).limit(100);
    return { photos: rows.map((x) => ({ id: x.id, userId: x.userId, url: signMediaUrl(x.storageKey, me.id), notes: x.moderationNotes, createdAt: x.createdAt })) };
  });
  app.patch('/photos/:id', async (req) => {
    const me = mod(req); const { id: pid } = parse(id, req.params);
    const { status, notes } = parse(z.object({ status: z.enum(['approved', 'rejected']), notes: z.string().max(300).optional() }), req.body);
    const [ph] = await app.db.update(photos).set({ status, moderationNotes: notes ?? null }).where(eq(photos.id, pid)).returning();
    if (!ph) throw errors.notFound();
    await recomputeCompleteness(app.db, ph.userId);
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.photo_moderated', targetType: 'photo', targetId: pid, metadata: { status } });
    return { ok: true };
  });

  // ---- Moderación: verificación por selfie ----
  app.get('/verifications/pending', async (req) => {
    const me = mod(req);
    const rows = await app.db.select().from(verificationRequests).where(eq(verificationRequests.status, 'pending')).orderBy(asc(verificationRequests.createdAt)).limit(50);
    const out = [];
    for (const v of rows) {
      const ph = await app.db.select().from(photos).where(and(eq(photos.userId, v.userId), eq(photos.status, 'approved'))).limit(3);
      out.push({ id: v.id, userId: v.userId, pose: v.poseCode, selfieUrl: v.storageKey ? signMediaUrl(v.storageKey, me.id) : null, profilePhotos: ph.map((x) => signMediaUrl(x.storageKey, me.id)), createdAt: v.createdAt });
    }
    return { verifications: out };
  });
  app.patch('/verifications/:id', async (req) => {
    const me = mod(req); const { id: vid } = parse(id, req.params);
    const { status, notes } = parse(z.object({ status: z.enum(['approved', 'rejected']), notes: z.string().max(300).optional() }), req.body);
    const [v] = await app.db.update(verificationRequests).set({ status, notes: notes ?? null, reviewerId: me.id, resolvedAt: new Date().toISOString() }).where(eq(verificationRequests.id, vid)).returning();
    if (!v) throw errors.notFound();
    await app.db.update(profiles).set({ verifiedAt: status === 'approved' ? new Date().toISOString() : null }).where(eq(profiles.userId, v.userId));
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.verification_reviewed', targetType: 'verification', targetId: vid, metadata: { status } });
    return { ok: true };
  });

  // ---- Apelaciones ----
  app.get('/appeals', async (req) => { mod(req); return { appeals: await app.db.select().from(appeals).where(eq(appeals.status, 'open')).orderBy(asc(appeals.createdAt)).limit(100) }; });
  app.patch('/appeals/:id', async (req) => {
    const me = mod(req); const { id: aid } = parse(id, req.params);
    const { status, decisionNotes } = parse(z.object({ status: z.enum(['accepted', 'rejected']), decisionNotes: z.string().max(1000).optional() }), req.body);
    const [a] = await app.db.update(appeals).set({ status, decisionNotes: decisionNotes ?? null, handledBy: me.id, resolvedAt: new Date().toISOString() }).where(eq(appeals.id, aid)).returning();
    if (!a) throw errors.notFound();
    if (status === 'accepted') await app.db.update(users).set({ status: 'active', suspendedReason: null }).where(and(eq(users.id, a.userId), eq(users.status, 'suspended')));
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.appeal_decided', targetType: 'appeal', targetId: aid, metadata: { status } });
    return { ok: true };
  });

  // ---- Usuarios (admin) ----
  app.get('/users', async (req) => {
    admin(req);
    const { q } = parse(z.object({ q: z.string().max(100).optional() }), req.query);
    const rows = q
      ? await app.db.select({ id: users.id, email: users.email, status: users.status, role: users.role, createdAt: users.createdAt, isDemo: users.isDemo }).from(users).where(sql`${users.email} ILIKE ${'%' + q + '%'} OR ${users.id}::text = ${q}`).limit(50)
      : await app.db.select({ id: users.id, email: users.email, status: users.status, role: users.role, createdAt: users.createdAt, isDemo: users.isDemo }).from(users).orderBy(desc(users.createdAt)).limit(50);
    return { users: rows };
  });
  app.get('/users/:id', async (req) => {
    const me = admin(req); const { id: uid } = parse(id, req.params);
    const [u] = await app.db.select().from(users).where(eq(users.id, uid)).limit(1);
    if (!u) throw errors.notFound();
    const [p] = await app.db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
    const subs = await app.db.select().from(subscriptions).where(eq(subscriptions.userId, uid));
    const pays = await app.db.select().from(paymentRecords).where(eq(paymentRecords.userId, uid)).orderBy(desc(paymentRecords.occurredAt)).limit(20);
    const reps = await app.db.select().from(reports).where(eq(reports.targetId, uid)).orderBy(desc(reports.createdAt)).limit(20);
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.user_viewed', targetType: 'user', targetId: uid });
    const { passwordHash, ...safeUser } = u;
    return { user: safeUser, profile: p ? { ...p, latCoarse: undefined, lngCoarse: undefined } : null, subscriptions: subs, payments: pays, reportsAgainst: reps };
  });
  app.post('/users/:id/suspend', async (req) => { const me = admin(req); const { id: uid } = parse(id, req.params); const { reason } = parse(z.object({ reason: z.string().min(3).max(500) }), req.body); await suspendUser(app, me, uid, reason); return { ok: true }; });
  app.post('/users/:id/reinstate', async (req) => {
    const me = admin(req); const { id: uid } = parse(id, req.params);
    await app.db.update(users).set({ status: 'active', suspendedReason: null }).where(and(eq(users.id, uid), eq(users.status, 'suspended')));
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.user_reinstated', targetType: 'user', targetId: uid });
    return { ok: true };
  });
  app.post('/users/:id/role', async (req) => {
    const me = admin(req); const { id: uid } = parse(id, req.params); const { role } = parse(z.object({ role: z.enum(['user', 'moderator', 'admin']) }), req.body);
    await app.db.update(users).set({ role }).where(eq(users.id, uid));
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.role_changed', targetType: 'user', targetId: uid, metadata: { role } });
    return { ok: true };
  });

  // ---- Facturación (admin) ----
  app.get('/subscriptions', async (req) => { admin(req); return { subscriptions: await app.db.select().from(subscriptions).orderBy(desc(subscriptions.updatedAt)).limit(200) }; });
  app.get('/payments', async (req) => { admin(req); return { payments: await app.db.select().from(paymentRecords).orderBy(desc(paymentRecords.occurredAt)).limit(200) }; });
  app.get('/billing-events', async (req) => {
    admin(req); const { status } = parse(z.object({ status: z.enum(['received', 'processed', 'ignored', 'error']).optional() }), req.query);
    const rows = status ? await app.db.select({ id: billingEvents.id, channel: billingEvents.channel, providerEventId: billingEvents.providerEventId, type: billingEvents.type, status: billingEvents.status, error: billingEvents.error, receivedAt: billingEvents.receivedAt }).from(billingEvents).where(eq(billingEvents.status, status)).orderBy(desc(billingEvents.receivedAt)).limit(200)
      : await app.db.select({ id: billingEvents.id, channel: billingEvents.channel, providerEventId: billingEvents.providerEventId, type: billingEvents.type, status: billingEvents.status, error: billingEvents.error, receivedAt: billingEvents.receivedAt }).from(billingEvents).orderBy(desc(billingEvents.receivedAt)).limit(200);
    return { events: rows };
  });
  app.post('/billing/reconcile', async (req) => { const me = admin(req); const r = await reconcile(app.db); await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.reconcile', metadata: r }); return r; });

  // ---- Asistente (admin) ----
  app.get('/assistant/costs', async (req) => { admin(req); return costSummary(app.db); });
  app.get('/assistant/handoffs', async (req) => {
    admin(req);
    const convs = await app.db.select().from(assistantConversations).where(eq(assistantConversations.handoffRequested, true)).orderBy(desc(assistantConversations.createdAt)).limit(50);
    const out = [];
    for (const c of convs) out.push({ ...c, messages: await app.db.select({ role: assistantMessages.role, content: assistantMessages.content, createdAt: assistantMessages.createdAt }).from(assistantMessages).where(eq(assistantMessages.conversationId, c.id)).orderBy(asc(assistantMessages.createdAt)).limit(40) });
    return { handoffs: out };
  });

  // ---- Base de conocimiento (admin): versionada, publicar crea versión nueva ----
  app.get('/knowledge', async (req) => { admin(req); return { articles: await app.db.select().from(knowledgeArticles).orderBy(asc(knowledgeArticles.slug), desc(knowledgeArticles.version)).limit(500) }; });
  app.post('/knowledge', async (req) => {
    const me = admin(req);
    const body = parse(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), locale: z.enum(['es', 'en']), title: z.string().min(3).max(200), body: z.string().min(10).max(20000), tags: z.array(z.string()).max(10).default([]), publish: z.boolean().default(false) }), req.body);
    const [{ v }] = await app.db.select({ v: sql<number>`coalesce(max(version),0)::int` }).from(knowledgeArticles).where(and(eq(knowledgeArticles.slug, body.slug), eq(knowledgeArticles.locale, body.locale)));
    const [row] = await app.db.insert(knowledgeArticles).values({ slug: body.slug, locale: body.locale, title: body.title, body: body.body, tags: body.tags, version: v + 1, status: body.publish ? 'published' : 'draft', updatedBy: me.id }).returning();
    await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.kb_saved', targetType: 'kb', targetId: row!.id, metadata: { slug: body.slug, version: v + 1, publish: body.publish } });
    return { article: row };
  });
  app.patch('/knowledge/:id', async (req) => {
    const me = admin(req); const { id: kid } = parse(id, req.params); const { status } = parse(z.object({ status: z.enum(['draft', 'published', 'archived']) }), req.body);
    await app.db.update(knowledgeArticles).set({ status, updatedBy: me.id, updatedAt: new Date().toISOString() }).where(eq(knowledgeArticles.id, kid));
    return { ok: true };
  });

  // ---- Auditoría y ajustes ----
  app.get('/audit', async (req) => {
    admin(req); const { action } = parse(z.object({ action: z.string().max(60).optional() }), req.query);
    const rows = action ? await app.db.select().from(auditLog).where(eq(auditLog.action, action)).orderBy(desc(auditLog.createdAt)).limit(200) : await app.db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200);
    return { entries: rows };
  });
  app.get('/settings', async (req) => { admin(req); const rows = await app.db.select().from(settings); return { settings: { ...SETTING_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) } }; });
  app.put('/settings/:key', async (req) => {
    const me = admin(req); const { key } = parse(z.object({ key: z.string().regex(/^[a-z_]+$/) }), req.params); const { value } = parse(z.object({ value: z.unknown() }), req.body);
    if (!(key in SETTING_DEFAULTS)) throw errors.badRequest('unknown_setting', 'Ajuste desconocido');
    await setSetting(app.db, key, value); await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.setting_changed', targetType: 'setting', targetId: key, metadata: { value } });
    return { ok: true };
  });
  app.post('/jobs/:name/run', async (req) => {
    const me = admin(req); const { name } = parse(z.object({ name: z.enum(JOB_NAMES) }), req.params);
    const r = await runJob(app, name); await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.job_run', metadata: { name, result: r } });
    return r;
  });
}

async function suspendUser(app: FastifyInstance, me: { id: string; role: string }, userId: string, reason: string) {
  await app.db.update(users).set({ status: 'suspended', suspendedReason: reason }).where(eq(users.id, userId));
  const ms = await app.db.select().from(matches).where(sql`(${matches.userA} = ${userId} OR ${matches.userB} = ${userId}) AND ${matches.endedAt} IS NULL`);
  for (const m of ms) await endMatchesBetween(app.db, (app as any).bus ?? null, m.userA === userId ? m.userB : m.userA, userId, 'suspended');
  await audit(app.db, { actorId: me.id, actorRole: me.role, action: 'admin.user_suspended', targetType: 'user', targetId: userId, metadata: { reason } });
}
