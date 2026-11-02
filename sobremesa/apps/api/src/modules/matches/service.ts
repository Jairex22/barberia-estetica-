import { and, eq, or, isNull, desc, asc } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { matches, conversations, profiles, photos, users, messages } from '../../db/schema.js';
import { errors } from '../../services/errors.js';
import { signMediaUrl } from '../../services/media.js';
import type { RealtimeBus } from '../../services/realtime.js';
import { audit } from '../../services/audit.js';

export async function getActiveMatch(db: Db, matchId: string, userId: string) {
  const [m] = await db.select().from(matches).where(and(eq(matches.id, matchId), isNull(matches.endedAt), or(eq(matches.userA, userId), eq(matches.userB, userId)))).limit(1);
  if (!m) throw errors.notFound('Conexión no disponible');
  return m;
}
export function otherOf(m: { userA: string; userB: string }, userId: string) { return m.userA === userId ? m.userB : m.userA; }

export async function otherSummary(db: Db, viewerId: string, otherId: string) {
  const [row] = await db.select({ p: profiles, u: users }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(eq(profiles.userId, otherId)).limit(1);
  const [ph] = await db.select().from(photos).where(and(eq(photos.userId, otherId), eq(photos.status, 'approved'))).orderBy(asc(photos.position)).limit(1);
  return {
    id: otherId, displayName: row?.u.status === 'deleted' ? 'Cuenta eliminada' : (row?.p.displayName ?? 'Perfil'), gender: row?.p.gender ?? null,
    photoUrl: ph && row?.u.status !== 'deleted' ? signMediaUrl(ph.storageKey, viewerId) : null, isDemo: row?.u.isDemo ?? false,
    status: row?.u.status ?? 'deleted',
  };
}

export async function listMatches(db: Db, userId: string) {
  const rows = await db.select({ m: matches, c: conversations }).from(matches).innerJoin(conversations, eq(conversations.matchId, matches.id))
    .where(and(isNull(matches.endedAt), or(eq(matches.userA, userId), eq(matches.userB, userId)))).orderBy(desc(matches.createdAt));
  const out = [];
  for (const r of rows) {
    const other = await otherSummary(db, userId, otherOf(r.m, userId));
    if (other.status === 'suspended' || other.status === 'deleted') continue;
    out.push({ id: r.m.id, conversationId: r.c.id, createdAt: r.m.createdAt, other, hasMessages: Boolean(r.c.firstMessageAt) });
  }
  return out;
}

export async function unmatch(db: Db, bus: RealtimeBus | null, userId: string, matchId: string, reason = 'unmatched') {
  const m = await getActiveMatch(db, matchId, userId);
  await db.update(matches).set({ endedAt: new Date().toISOString(), endedBy: userId, endedReason: reason }).where(eq(matches.id, m.id));
  const [c] = await db.select().from(conversations).where(eq(conversations.matchId, m.id)).limit(1);
  if (c) await bus?.publish([m.userA, m.userB], { type: 'conversation.removed', conversationId: c.id });
  await audit(db, { actorId: userId, action: 'match.ended', targetType: 'match', targetId: m.id, metadata: { reason } });
}

export async function endMatchesBetween(db: Db, bus: RealtimeBus | null, a: string, b: string, reason: string) {
  const rows = await db.select({ m: matches, c: conversations }).from(matches).leftJoin(conversations, eq(conversations.matchId, matches.id))
    .where(and(isNull(matches.endedAt), or(and(eq(matches.userA, a), eq(matches.userB, b)), and(eq(matches.userA, b), eq(matches.userB, a)))));
  for (const r of rows) {
    await db.update(matches).set({ endedAt: new Date().toISOString(), endedBy: a, endedReason: reason }).where(eq(matches.id, r.m.id));
    if (r.c) await bus?.publish([a, b], { type: 'conversation.removed', conversationId: r.c.id });
  }
}
