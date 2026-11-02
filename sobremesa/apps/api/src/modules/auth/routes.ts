import type { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '@sobremesa/shared';
import { parse } from '../../plugins/validation.js';
import * as svc from './service.js';
import { SESSION_COOKIE, cookieOptions, requireUser } from '../../plugins/context.js';
import { z } from 'zod';
import { waitlist } from '../../db/schema.js';
import { hmacSign, safeEqual } from '../../services/crypto.js';
import { config } from '../../config.js';

export async function authRoutes(app: FastifyInstance) {
  const strict = { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } };

  app.post('/register', strict, async (req, reply) => {
    const input = parse(registerSchema, req.body);
    const user = await svc.register(app.db, input, req.ip);
    const s = await svc.createSession(app.db, user.id, (req.body as any)?.device, req.ip);
    reply.setCookie(SESSION_COOKIE, s.token, cookieOptions());
    return reply.status(201).send({ userId: user.id, token: s.token, expiresAt: s.expiresAt, emailVerificationRequired: true });
  });

  app.post('/login', strict, async (req, reply) => {
    const input = parse(loginSchema, req.body);
    const { user, token, expiresAt } = await svc.login(app.db, input.email, input.password, input.device, req.ip);
    reply.setCookie(SESSION_COOKIE, token, cookieOptions());
    return { userId: user.id, token, expiresAt };
  });

  app.post('/logout', async (req, reply) => {
    if (req.sessionId) await svc.revokeSession(app.db, req.sessionId);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.post('/logout-all', async (req) => {
    const u = requireUser(req);
    await svc.revokeAllSessions(app.db, u.id, req.sessionId ?? undefined);
    return { ok: true };
  });

  app.post('/verify-email', strict, async (req) => {
    const { token } = parse(verifyEmailSchema, req.body);
    const userId = await svc.verifyEmail(app.db, token);
    return { ok: true, userId };
  });

  app.post('/resend-verification', strict, async (req) => {
    const u = requireUser(req);
    await svc.resendVerification(app.db, u.id);
    return { ok: true };
  });

  app.post('/forgot-password', strict, async (req) => {
    const { email } = parse(forgotPasswordSchema, req.body);
    await svc.forgotPassword(app.db, email);
    return { ok: true, message: 'Si existe una cuenta con ese correo, enviamos un enlace para restablecer la contraseña.' };
  });

  app.post('/reset-password', strict, async (req) => {
    const { token, password } = parse(resetPasswordSchema, req.body);
    await svc.resetPassword(app.db, token, password);
    return { ok: true };
  });

  app.get('/me', async (req) => {
    return { user: req.user };
  });

  /** Ticket de corta duración (60 s) para abrir el WebSocket desde el navegador sin exponer la cookie httpOnly. */
  app.post('/ws-ticket', async (req) => {
    requireUser(req);
    return { ticket: makeWsTicket(req.sessionId!), expiresIn: 60 };
  });

  app.post('/waitlist', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (req) => {
    const { email, city, gender, source } = parse(z.object({ email: z.email().transform((e) => e.trim().toLowerCase()), city: z.string().trim().max(80).optional(), gender: z.string().max(20).optional(), source: z.string().max(40).optional() }), req.body);
    await app.db.insert(waitlist).values({ email, city: city ?? null, gender: gender ?? null, source: source ?? null }).onConflictDoNothing();
    return { ok: true };
  });
}

export function makeWsTicket(sessionId: string): string {
  const exp = Math.floor(Date.now() / 1000) + 60;
  const payload = `${sessionId}.${exp}`;
  return `${payload}.${hmacSign(config.COOKIE_SECRET, payload)}`;
}
export function verifyWsTicket(ticket: string): string | null {
  const parts = ticket.split('.');
  if (parts.length !== 3) return null;
  const [sessionId, expStr, sig] = parts as [string, string, string];
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  if (!safeEqual(hmacSign(config.COOKIE_SECRET, `${sessionId}.${expStr}`), sig)) return null;
  return sessionId;
}
