import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { eq, and, isNull, gt, sql as dsql } from 'drizzle-orm';
import type { Db, Sql } from '../db/client.js';
import { sessions, users, profiles, subscriptions } from '../db/schema.js';
import { sha256 } from '../services/crypto.js';
import { errors } from '../services/errors.js';
import type { SessionUser } from '@sobremesa/shared';
import { config } from '../config.js';

export const SESSION_COOKIE = 'sobremesa_sid';

declare module 'fastify' {
  interface FastifyInstance { db: Db; sql: Sql }
  interface FastifyRequest { user: SessionUser | null; sessionId: string | null; rawBody?: Buffer }
}

export async function loadSessionUser(db: Db, token: string, by: 'token' | 'sessionId' = 'token'): Promise<{ user: SessionUser; sessionId: string } | null> {
  const tokenHash = sha256(token);
  const now = new Date().toISOString();
  const rows = await db
    .select({ s: sessions, u: users, p: profiles })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(by === 'token' ? eq(sessions.tokenHash, tokenHash) : eq(sessions.id, token), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.u.status === 'deleted') return null;
  const ent = await computeEntitlement(db, row.u.id);
  // Actualiza last_seen con poca frecuencia para no castigar la BD.
  if (Date.now() - new Date(row.s.lastSeenAt).getTime() > 5 * 60_000) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.s.id));
    await db.update(users).set({ lastActiveAt: now }).where(eq(users.id, row.u.id));
  }
  return {
    sessionId: row.s.id,
    user: {
      id: row.u.id, email: row.u.email, emailVerifiedAt: row.u.emailVerifiedAt, role: row.u.role, status: row.u.status,
      plan: ent.plan, premiumUntil: ent.premiumUntil, locale: (row.u.locale === 'en' ? 'en' : 'es'),
      profileComplete: Boolean(row.p?.completedAt),
    },
  };
}

/** Premium = existe suscripción activa/past_due con periodo vigente. Se calcula SIEMPRE desde la BD, nunca del cliente. */
export async function computeEntitlement(db: Db, userId: string): Promise<{ plan: 'free' | 'premium'; premiumUntil: string | null }> {
  const now = new Date().toISOString();
  const rows = await db.select({ end: subscriptions.currentPeriodEnd, status: subscriptions.status }).from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), gt(subscriptions.currentPeriodEnd, now), dsql`${subscriptions.status} in ('active','past_due')`));
  if (!rows.length) return { plan: 'free', premiumUntil: null };
  const until = rows.map((r) => new Date(r.end!).getTime()).sort((a, b) => a - b).at(-1)!;
  return { plan: 'premium', premiumUntil: new Date(until).toISOString() };
}

export default fp(async function contextPlugin(app: FastifyInstance) {
  app.decorateRequest('user', null);
  app.decorateRequest('sessionId', null);
  app.addHook('preHandler', async (req) => {
    let token: string | undefined;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) token = auth.slice(7).trim();
    if (!token) {
      const raw = req.cookies[SESSION_COOKIE];
      if (raw) { const unsigned = req.unsignCookie(raw); if (unsigned.valid && unsigned.value) token = unsigned.value; }
    }
    if (!token) return;
    const loaded = await loadSessionUser(app.db, token);
    if (loaded) { req.user = loaded.user; req.sessionId = loaded.sessionId; }
  });
});

export function requireUser(req: { user: SessionUser | null }): SessionUser {
  if (!req.user) throw errors.unauthorized();
  if (req.user.status === 'suspended') throw errors.forbidden('Tu cuenta está suspendida. Puedes apelar desde Ayuda.');
  return req.user;
}
export function requireVerified(req: { user: SessionUser | null }): SessionUser {
  const u = requireUser(req);
  if (!u.emailVerifiedAt) throw new (errors.forbidden('Verifica tu correo para continuar').constructor as any)(403, 'email_not_verified', 'Verifica tu correo para continuar');
  return u;
}
export function requireRole(req: { user: SessionUser | null }, roles: Array<'moderator' | 'admin'>): SessionUser {
  const u = requireUser(req);
  if (!roles.includes(u.role as any)) throw errors.forbidden();
  return u;
}
export const cookieOptions = () => ({
  httpOnly: true, sameSite: 'lax' as const, secure: config.COOKIE_SECURE, path: '/', signed: true,
  maxAge: config.SESSION_TTL_DAYS * 86400,
});
