import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from '../../plugins/validation.js';
import { requireUser, SESSION_COOKIE } from '../../plugins/context.js';
import * as svc from './service.js';
import { password } from '@sobremesa/shared';
import { signMediaUrl } from '../../services/media.js';
import { cancelWebSubscriptionForUser } from '../billing/service.js';
import { sessions, users } from '../../db/schema.js';
import { and, eq, isNull } from 'drizzle-orm';

export async function accountRoutes(app: FastifyInstance) {
  app.post('/change-password', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (req) => {
    const u = requireUser(req);
    const { current, next } = parse(z.object({ current: z.string().min(1), next: password }), req.body);
    await svc.changePassword(app.db, u.id, current, next, req.sessionId);
    return { ok: true };
  });
  app.post('/pause', async (req) => { const u = requireUser(req); await svc.setPaused(app.db, u.id, true); return { ok: true, status: 'paused' }; });
  app.post('/resume', async (req) => { const u = requireUser(req); await svc.setPaused(app.db, u.id, false); return { ok: true, status: 'active' }; });
  app.post('/delete/request', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (req) => {
    const u = requireUser(req);
    const info = await svc.requestDeletion(app.db, u.id);
    return { ok: true, ...info, message: 'Te enviamos un correo para confirmar. Si tienes una suscripción de App Store o Google Play, cancélala también en la tienda.' };
  });
  app.post('/delete/confirm', async (req, reply) => {
    const { token } = parse(z.object({ token: z.string().min(10) }), req.body);
    await svc.confirmDeletion(app.db, token, (userId) => cancelWebSubscriptionForUser(app.db, userId));
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });
  app.post('/export', { config: { rateLimit: { max: 3, timeWindow: '1 day' } } }, async (req) => {
    const u = requireUser(req);
    const row = await svc.buildExport(app.db, u.id);
    return { export: { id: row.id, url: signMediaUrl(row.storageKey!, u.id, 3600), expiresAt: row.expiresAt } };
  });
  app.get('/sessions', async (req) => {
    const u = requireUser(req);
    const rows = await app.db.select({ id: sessions.id, device: sessions.device, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt }).from(sessions).where(and(eq(sessions.userId, u.id), isNull(sessions.revokedAt)));
    return { sessions: rows.map((s) => ({ ...s, current: s.id === req.sessionId })) };
  });
  app.patch('/locale', async (req) => {
    const u = requireUser(req);
    const { locale } = parse(z.object({ locale: z.enum(['es', 'en']) }), req.body);
    await app.db.update(users).set({ locale }).where(eq(users.id, u.id));
    return { ok: true };
  });
}
