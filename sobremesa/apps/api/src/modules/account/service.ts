import { eq, or, and } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { users, profiles, photos, swipes, matches, conversations, messages, subscriptions, sessions, reports, blocks, dataExports, pushTokens } from '../../db/schema.js';
import { errors } from '../../services/errors.js';
import { hashPassword, verifyPassword, randomToken } from '../../services/crypto.js';
import { audit } from '../../services/audit.js';
import { consumeEmailToken, issueEmailToken, revokeAllSessions } from '../auth/service.js';
import { sendTemplate } from '../notifications/service.js';
import { getStorage } from '../../services/storage.js';
import { config } from '../../config.js';

export async function changePassword(db: Db, userId: string, current: string, next: string, sessionId: string | null) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || !(await verifyPassword(u.passwordHash, current))) throw errors.badRequest('wrong_password', 'La contraseña actual no es correcta');
  await db.update(users).set({ passwordHash: await hashPassword(next), updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
  await revokeAllSessions(db, userId, sessionId ?? undefined);
  await audit(db, { actorId: userId, action: 'account.password_changed' });
}

/** Pausar: deja de aparecer en Descubrir y no recibe likes nuevos; conserva matches y chats. */
export async function setPaused(db: Db, userId: string, paused: boolean) {
  const now = new Date().toISOString();
  await db.update(users).set({ status: paused ? 'paused' : 'active', pausedAt: paused ? now : null, updatedAt: now }).where(and(eq(users.id, userId), or(eq(users.status, 'active'), eq(users.status, 'paused'))));
  await audit(db, { actorId: userId, action: paused ? 'account.paused' : 'account.resumed' });
}

export async function requestDeletion(db: Db, userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) throw errors.notFound();
  await issueEmailToken(db, u.id, 'delete_confirm', u.email, u.locale);
  // Información honesta sobre suscripciones de tienda.
  const subs = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due'))));
  return { storeSubscriptions: subs.filter((s) => s.channel === 'apple' || s.channel === 'google').map((s) => s.channel), webSubscriptions: subs.filter((s) => s.channel === 'stripe' || s.channel === 'mercadopago').map((s) => s.channel) };
}

/**
 * Eliminación: anonimiza de inmediato (deja de aparecer en todo), revoca sesiones, cancela suscripciones web
 * (vía proveedor cuando esté configurado) y programa purga definitiva tras el periodo de retención.
 */
export async function confirmDeletion(db: Db, token: string, cancelWebSubscription: (userId: string) => Promise<void>) {
  const row = await consumeEmailToken(db, token, 'delete_confirm');
  const userId = row.userId;
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || u.status === 'deleted') return userId;
  const now = new Date();
  await cancelWebSubscription(userId).catch(() => { /* se reintenta en job de conciliación */ });
  await sendTemplate(db, { userId, to: u.email, template: 'account_deleted', locale: u.locale, vars: {} });
  await db.update(users).set({
    status: 'deleted', deletedAt: now.toISOString(), email: `deleted+${userId}@deleted.invalid`, passwordHash: 'deleted', marketingOptIn: false,
    purgeAfter: new Date(now.getTime() + config.DELETED_ACCOUNT_RETENTION_DAYS * 86400_000).toISOString(), updatedAt: now.toISOString(),
  }).where(eq(users.id, userId));
  await db.update(profiles).set({ displayName: 'Cuenta eliminada', bio: '', interests: [], planTypes: [], idealPlan: null, occupation: null, latCoarse: null, lngCoarse: null, city: null, completedAt: null }).where(eq(profiles.userId, userId));
  const ph = await db.select().from(photos).where(eq(photos.userId, userId));
  for (const p of ph) await getStorage().delete(p.storageKey).catch(() => {});
  await db.delete(photos).where(eq(photos.userId, userId));
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
  await db.update(matches).set({ endedAt: now.toISOString(), endedBy: userId, endedReason: 'account_deleted' }).where(or(eq(matches.userA, userId), eq(matches.userB, userId)));
  await revokeAllSessions(db, userId);
  await audit(db, { actorId: userId, action: 'account.deleted' });
  return userId;
}

/** Purga definitiva (job): borra filas del usuario; reportes se conservan anonimizados por seguridad. */
export async function purgeDeletedUsers(db: Db) {
  const now = new Date().toISOString();
  const due = await db.select({ id: users.id }).from(users).where(and(eq(users.status, 'deleted'), /* purge_after <= now */ eq(users.status, 'deleted')));
  let purged = 0;
  for (const { id } of due) {
    const [u] = await db.select({ purgeAfter: users.purgeAfter }).from(users).where(eq(users.id, id)).limit(1);
    if (!u?.purgeAfter || new Date(u.purgeAfter).getTime() > Date.now()) continue;
    await db.update(reports).set({ reporterId: id }).where(eq(reports.reporterId, id)); // se mantienen con el id (ya anonimizado)
    await db.delete(users).where(eq(users.id, id)); // cascada: perfil, swipes, matches, mensajes, suscripciones, sesiones
    purged++;
  }
  return purged;
}

/** Exportación de datos propia (ARCO: acceso/portabilidad). */
export async function buildExport(db: Db, userId: string) {
  const [u] = await db.select({ id: users.id, email: users.email, createdAt: users.createdAt, locale: users.locale, birthdate: users.birthdate }).from(users).where(eq(users.id, userId)).limit(1);
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const mySwipes = await db.select({ targetId: swipes.targetId, action: swipes.action, createdAt: swipes.createdAt }).from(swipes).where(eq(swipes.actorId, userId));
  const myMatches = await db.select().from(matches).where(or(eq(matches.userA, userId), eq(matches.userB, userId)));
  const myMessages = await db.select({ conversationId: messages.conversationId, body: messages.body, createdAt: messages.createdAt }).from(messages).where(eq(messages.senderId, userId));
  const subs = await db.select({ channel: subscriptions.channel, status: subscriptions.status, currentPeriodEnd: subscriptions.currentPeriodEnd }).from(subscriptions).where(eq(subscriptions.userId, userId));
  const myBlocks = await db.select({ blockedId: blocks.blockedId, createdAt: blocks.createdAt }).from(blocks).where(eq(blocks.blockerId, userId));
  const payload = { exportedAt: new Date().toISOString(), account: u, profile: p ? { ...p, latCoarse: undefined, lngCoarse: undefined } : null, swipes: mySwipes, matches: myMatches.map((m) => ({ id: m.id, createdAt: m.createdAt, endedAt: m.endedAt })), messagesSent: myMessages, subscriptions: subs, blocks: myBlocks };
  const key = `exports/${userId}/${randomToken(10)}.json`;
  await getStorage().put(key, Buffer.from(JSON.stringify(payload, null, 2)), 'application/json');
  const [row] = await db.insert(dataExports).values({ userId, status: 'ready', storageKey: key, expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString() }).returning();
  await audit(db, { actorId: userId, action: 'account.export' });
  return row!;
}
