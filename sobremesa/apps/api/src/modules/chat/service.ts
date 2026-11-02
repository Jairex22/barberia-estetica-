import { and, eq, or, isNull, gt, asc, desc, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { conversations, matches, messages, conversationReads, profiles, blocks, users } from '../../db/schema.js';
import { canInitiateConversation, LIMITS, type Message, type ConversationSummary, type Gender } from '@sobremesa/shared';
import { errors, AppError } from '../../services/errors.js';
import { config } from '../../config.js';
import type { RealtimeBus } from '../../services/realtime.js';
import { otherSummary, otherOf } from '../matches/service.js';
import { textRiskSignals } from '../../services/moderation.js';
import { audit } from '../../services/audit.js';

type Participant = { id: string; plan: 'free' | 'premium' };

async function loadConversationFor(db: Db, conversationId: string, userId: string) {
  const [row] = await db.select({ c: conversations, m: matches }).from(conversations).innerJoin(matches, eq(matches.id, conversations.matchId))
    .where(and(eq(conversations.id, conversationId), isNull(matches.endedAt), or(eq(matches.userA, userId), eq(matches.userB, userId)))).limit(1);
  if (!row) throw errors.notFound('Conversación no disponible');
  return row;
}

/** Estado de inicio para `userId`: quién puede mandar el primer mensaje. Se calcula con géneros DECLARADOS. */
export async function initiationState(db: Db, c: { firstMessageAt: string | null }, m: { userA: string; userB: string }, userId: string): Promise<ConversationSummary['initiation']> {
  if (c.firstMessageAt) return 'started';
  const otherId = otherOf(m, userId);
  const gs = await db.select({ userId: profiles.userId, gender: profiles.gender }).from(profiles).where(or(eq(profiles.userId, userId), eq(profiles.userId, otherId)));
  const mine = gs.find((g) => g.userId === userId)?.gender as Gender | undefined;
  const theirs = gs.find((g) => g.userId === otherId)?.gender as Gender | undefined;
  if (!mine || !theirs) return 'anyone';
  const meV = canInitiateConversation(mine, theirs, config.INITIATION_POLICY_MIXED);
  const themV = canInitiateConversation(theirs, mine, config.INITIATION_POLICY_MIXED);
  if (meV.allowed && themV.allowed) return 'anyone';
  return meV.allowed ? 'you' : 'them';
}

export async function listConversations(db: Db, userId: string): Promise<ConversationSummary[]> {
  const rows = await db.select({ c: conversations, m: matches }).from(conversations).innerJoin(matches, eq(matches.id, conversations.matchId))
    .where(and(isNull(matches.endedAt), or(eq(matches.userA, userId), eq(matches.userB, userId))))
    .orderBy(desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`));
  const out: ConversationSummary[] = [];
  for (const r of rows) {
    const otherId = otherOf(r.m, userId);
    const other = await otherSummary(db, userId, otherId);
    if (other.status !== 'active' && other.status !== 'paused') continue;
    const [last] = await db.select().from(messages).where(eq(messages.conversationId, r.c.id)).orderBy(desc(messages.seq)).limit(1);
    const [read] = await db.select().from(conversationReads).where(and(eq(conversationReads.conversationId, r.c.id), eq(conversationReads.userId, userId))).limit(1);
    const [{ unread }] = await db.select({ unread: sql<number>`count(*)::int` }).from(messages)
      .where(and(eq(messages.conversationId, r.c.id), gt(messages.seq, read?.lastReadSeq ?? 0), sql`${messages.senderId} <> ${userId}`));
    out.push({
      id: r.c.id, matchId: r.m.id, other: { id: other.id, displayName: other.displayName, photoUrl: other.photoUrl, isDemo: other.isDemo },
      lastMessage: last ? toMessage(last) : null, unreadCount: unread, initiation: await initiationState(db, r.c, r.m, userId), createdAt: r.c.createdAt,
    });
  }
  return out;
}

export function toMessage(m: typeof messages.$inferSelect): Message {
  return { id: m.id, conversationId: m.conversationId, senderId: m.senderId, body: m.body, kind: m.kind, createdAt: m.createdAt, clientId: m.clientId, seq: m.seq };
}

export async function getConversation(db: Db, conversationId: string, userId: string) {
  const r = await loadConversationFor(db, conversationId, userId);
  const other = await otherSummary(db, userId, otherOf(r.m, userId));
  const [otherProfile] = await db.select({ interests: profiles.interests, planTypes: profiles.planTypes, idealPlan: profiles.idealPlan, intent: profiles.intent }).from(profiles).where(eq(profiles.userId, other.id)).limit(1);
  return { id: r.c.id, matchId: r.m.id, other, otherProfile, initiation: await initiationState(db, r.c, r.m, userId), createdAt: r.c.createdAt };
}

export async function listMessages(db: Db, conversationId: string, userId: string, afterSeq = 0, limit = 50) {
  await loadConversationFor(db, conversationId, userId);
  const rows = await db.select().from(messages).where(and(eq(messages.conversationId, conversationId), gt(messages.seq, afterSeq))).orderBy(asc(messages.seq)).limit(limit);
  return rows.map(toMessage);
}

export async function markRead(db: Db, conversationId: string, userId: string, seq: number) {
  await loadConversationFor(db, conversationId, userId);
  await db.insert(conversationReads).values({ conversationId, userId, lastReadSeq: seq })
    .onConflictDoUpdate({ target: [conversationReads.conversationId, conversationReads.userId], set: { lastReadSeq: sql`greatest(${conversationReads.lastReadSeq}, ${seq})`, updatedAt: new Date().toISOString() } });
}

/**
 * Envía un mensaje. Es la ÚNICA ruta de escritura (REST y WebSocket la usan). Hace cumplir en servidor:
 * participante del match activo, no bloqueado, regla de inicio (mujer primero en mujer-hombre; Premium no la salta),
 * límite por minuto e idempotencia por clientId.
 */
export async function sendMessage(db: Db, bus: RealtimeBus | null, me: Participant, conversationId: string, clientId: string, body: string) {
  const text = body.trim();
  if (!text || text.length > 2000) throw errors.badRequest('validation', 'Mensaje vacío o demasiado largo');
  const r = await loadConversationFor(db, conversationId, me.id);
  const otherId = otherOf(r.m, me.id);

  // Idempotencia: si ya existe, devolvemos el mismo mensaje sin duplicar.
  const [dup] = await db.select().from(messages).where(and(eq(messages.conversationId, conversationId), eq(messages.senderId, me.id), eq(messages.clientId, clientId))).limit(1);
  if (dup) return { message: toMessage(dup), duplicate: true };

  const [other] = await db.select({ status: users.status }).from(users).where(eq(users.id, otherId)).limit(1);
  if (!other || other.status === 'deleted' || other.status === 'suspended') throw errors.notFound('Conversación no disponible');
  const blocked = await db.select().from(blocks).where(or(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, otherId)), and(eq(blocks.blockerId, otherId), eq(blocks.blockedId, me.id)))).limit(1);
  if (blocked.length) throw errors.notFound('Conversación no disponible');

  if (!r.c.firstMessageAt) {
    const state = await initiationState(db, r.c, r.m, me.id);
    if (state === 'them') throw new AppError(403, 'initiation_not_allowed', 'En esta conexión, ella da el primer paso. Cuando escriba, podrás responder.');
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(messages).where(and(eq(messages.senderId, me.id), sql`${messages.createdAt} > now() - interval '1 minute'`));
  if (n >= LIMITS[me.plan].messagesPerMinute) throw errors.tooMany('Estás enviando mensajes muy rápido. Espera un momento.');
  if (!r.c.firstMessageAt) {
    const [{ started }] = await db.select({ started: sql<number>`count(*)::int` }).from(conversations).innerJoin(matches, eq(matches.id, conversations.matchId))
      .where(and(sql`${conversations.firstMessageAt} > now() - interval '1 day'`, or(eq(matches.userA, me.id), eq(matches.userB, me.id)),
        sql`EXISTS (SELECT 1 FROM messages fm WHERE fm.conversation_id = ${conversations.id} AND fm.sender_id = ${me.id} AND fm.seq = 1)`));
    if (started >= LIMITS[me.plan].newConversationsPerDay) throw errors.tooMany(`Límite de ${LIMITS[me.plan].newConversationsPerDay} conversaciones nuevas por día alcanzado.`);
  }

  const inserted = await db.transaction(async (tx) => {
    const [c] = await tx.update(conversations).set({ lastSeq: sql`${conversations.lastSeq} + 1`, lastMessageAt: new Date().toISOString(), firstMessageAt: sql`coalesce(${conversations.firstMessageAt}, now())` })
      .where(eq(conversations.id, conversationId)).returning({ seq: conversations.lastSeq });
    const [m] = await tx.insert(messages).values({ conversationId, senderId: me.id, body: text, clientId, seq: c!.seq }).onConflictDoNothing().returning();
    if (!m) {
      const [existing] = await tx.select().from(messages).where(and(eq(messages.conversationId, conversationId), eq(messages.senderId, me.id), eq(messages.clientId, clientId))).limit(1);
      return { row: existing!, duplicate: true };
    }
    return { row: m, duplicate: false };
  });
  const message = toMessage(inserted.row);
  if (!inserted.duplicate) {
    await markRead(db, conversationId, me.id, message.seq);
    await bus?.publish([me.id, otherId], { type: 'message.new', message });
    const risks = textRiskSignals(text);
    if (risks.length) await audit(db, { actorId: me.id, action: 'chat.risk_signal', targetType: 'message', targetId: message.id, metadata: { risks } });
  }
  return { message, duplicate: inserted.duplicate };
}

/** Rompehielos y propuestas de plan: plantillas deterministas a partir de intereses compartidos. Nunca se envían solas. */
export async function icebreakers(db: Db, conversationId: string, userId: string, locale: 'es' | 'en' = 'es') {
  const r = await loadConversationFor(db, conversationId, userId);
  const otherId = otherOf(r.m, userId);
  const ps = await db.select().from(profiles).where(or(eq(profiles.userId, userId), eq(profiles.userId, otherId)));
  const me = ps.find((p) => p.userId === userId)!; const other = ps.find((p) => p.userId === otherId)!;
  const shared = me.interests.filter((i) => other.interests.includes(i));
  const plans = me.planTypes.filter((p) => other.planTypes.includes(p));
  const label = (k: string) => k.replace(/_/g, ' ');
  const es = locale === 'es';
  const out: { text: string; kind: 'rompehielos' | 'plan'; source: 'plantilla' }[] = [];
  for (const s of shared.slice(0, 3)) out.push({ kind: 'rompehielos', source: 'plantilla', text: es ? `Vi que también te gusta ${label(s)}. ¿Qué es lo último que hiciste relacionado con eso?` : `I saw you're also into ${label(s)}. What's the last thing you did around that?` });
  if (other.idealPlan) out.push({ kind: 'rompehielos', source: 'plantilla', text: es ? `Tu plan ideal ("${other.idealPlan}") me llamó la atención. ¿Lo haces seguido?` : `Your ideal plan ("${other.idealPlan}") caught my eye. Do you do it often?` });
  for (const p of plans.slice(0, 2)) out.push({ kind: 'plan', source: 'plantilla', text: es ? `A los dos nos late un plan de ${label(p)}. ¿Te animas a uno esta semana? Tú propones lugar.` : `We both like a ${label(p)} plan. Up for one this week? You pick the place.` });
  if (!out.length) out.push({ kind: 'rompehielos', source: 'plantilla', text: es ? '¿Cuál es tu plan favorito para un domingo sin prisa?' : "What's your favorite plan for a slow Sunday?" });
  return out;
}
