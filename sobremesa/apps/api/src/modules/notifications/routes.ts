import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from '../../plugins/validation.js';
import { requireUser } from '../../plugins/context.js';
import * as svc from './service.js';
import { pushTokens } from '../../db/schema.js';
import { and, eq } from 'drizzle-orm';

const prefsSchema = z.object({
  pushMatches: z.boolean().optional(), pushMessages: z.boolean().optional(), emailProduct: z.boolean().optional(), emailMarketing: z.boolean().optional(),
  quietStartHour: z.number().int().min(0).max(23).optional(), quietEndHour: z.number().int().min(0).max(23).optional(), maxPromoPerWeek: z.number().int().min(0).max(3).optional(),
});

export async function notificationRoutes(app: FastifyInstance) {
  app.get('/prefs', async (req) => { const u = requireUser(req); return { prefs: await svc.getPrefs(app.db, u.id) }; });
  app.patch('/prefs', async (req) => { const u = requireUser(req); const patch = parse(prefsSchema, req.body); return { prefs: await svc.updatePrefs(app.db, u.id, patch) }; });
  app.post('/unsubscribe', async (req) => {
    const { token } = parse(z.object({ token: z.string().min(10).max(100) }), req.body);
    return { ok: await svc.unsubscribeByToken(app.db, token) };
  });
  app.post('/push-token', async (req) => {
    const u = requireUser(req);
    const { token, platform } = parse(z.object({ token: z.string().min(10).max(300), platform: z.enum(['ios', 'android', 'web']) }), req.body);
    await app.db.insert(pushTokens).values({ userId: u.id, token, platform }).onConflictDoUpdate({ target: pushTokens.token, set: { userId: u.id, platform } });
    return { ok: true };
  });
  app.delete('/push-token', async (req) => {
    const u = requireUser(req);
    const { token } = parse(z.object({ token: z.string() }), req.body);
    await app.db.delete(pushTokens).where(and(eq(pushTokens.userId, u.id), eq(pushTokens.token, token)));
    return { ok: true };
  });
}
