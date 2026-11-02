import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { createDb } from './db/client.js';
import contextPlugin from './plugins/context.js';
import { AppError } from './services/errors.js';
import { authRoutes } from './modules/auth/routes.js';
import { accountRoutes } from './modules/account/routes.js';
import { profileRoutes } from './modules/profiles/routes.js';
import { discoveryRoutes } from './modules/discovery/routes.js';
import { matchRoutes } from './modules/matches/routes.js';
import { chatRoutes } from './modules/chat/routes.js';
import { safetyRoutes } from './modules/safety/routes.js';
import { billingRoutes } from './modules/billing/routes.js';
import { notificationRoutes } from './modules/notifications/routes.js';
import { assistantRoutes } from './modules/assistant/routes.js';
import { adminRoutes } from './modules/admin/routes.js';
import { mediaRoutes } from './modules/profiles/media-routes.js';
import { startJobs } from './jobs/scheduler.js';

export async function buildApp(opts: { databaseUrl?: string; logger?: boolean; jobs?: boolean } = {}) {
  const app = Fastify({
    logger: opts.logger ?? (config.NODE_ENV !== 'test' ? { level: config.LOG_LEVEL, redact: ['req.headers.authorization', 'req.headers.cookie'] } : false),
    trustProxy: config.TRUST_PROXY,
    bodyLimit: 1024 * 1024,
  });
  const { db, sql } = createDb(opts.databaseUrl);
  app.decorate('db', db);
  app.decorate('sql', sql);

  // Webhooks necesitan el cuerpo crudo para verificar firmas.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    (req as any).rawBody = body as Buffer;
    if ((body as Buffer).length === 0) return done(null, {});
    try { done(null, JSON.parse((body as Buffer).toString('utf8'))); } catch (e) { done(e as Error, undefined); }
  });

  await app.register(cookie, { secret: config.COOKIE_SECRET });
  await app.register(cors, { origin: [config.APP_ORIGIN], credentials: true });
  await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute', allowList: config.NODE_ENV === 'test' ? ['127.0.0.1'] : [] });
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
  await app.register(websocket);
  await app.register(contextPlugin);

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({ error: { code: err.code, message: err.message, details: err.details ?? null } });
    }
    const anyErr = err as any;
    if (anyErr.statusCode === 429) return reply.status(429).send({ error: { code: 'rate_limited', message: 'Demasiadas solicitudes. Espera un momento.' } });
    if (anyErr.statusCode && anyErr.statusCode < 500) return reply.status(anyErr.statusCode).send({ error: { code: anyErr.code ?? 'bad_request', message: anyErr.message } });
    req.log.error(err);
    return reply.status(500).send({ error: { code: 'internal', message: 'Error interno. Inténtalo de nuevo.' } });
  });

  app.get('/health', async () => {
    await sql`select 1`;
    return { ok: true, env: config.NODE_ENV, demoMode: config.DEMO_MODE, time: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(accountRoutes, { prefix: '/account' });
  await app.register(profileRoutes, { prefix: '/profile' });
  await app.register(mediaRoutes);
  await app.register(discoveryRoutes, { prefix: '/discover' });
  await app.register(matchRoutes, { prefix: '/matches' });
  await app.register(chatRoutes);
  await app.register(safetyRoutes, { prefix: '/safety' });
  await app.register(billingRoutes, { prefix: '/billing' });
  await app.register(notificationRoutes, { prefix: '/notifications' });
  await app.register(assistantRoutes, { prefix: '/assistant' });
  await app.register(adminRoutes, { prefix: '/admin' });

  if (opts.jobs ?? (config.JOBS_ENABLED && config.NODE_ENV !== 'test')) {
    const stop = startJobs(app);
    app.addHook('onClose', async () => stop());
  }
  app.addHook('onClose', async () => { await ((app as any).bus?.stop?.() ?? Promise.resolve()); await sql.end({ timeout: 5 }); });
  return app;
}
