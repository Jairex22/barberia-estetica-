import type { FastifyInstance } from 'fastify';
import { discoverQuerySchema, swipeSchema, LIMITS } from '@sobremesa/shared';
import { parse } from '../../plugins/validation.js';
import { requireUser } from '../../plugins/context.js';
import * as svc from './service.js';
import { getSetting } from '../../services/settings.js';
import { errors } from '../../services/errors.js';

export async function discoveryRoutes(app: FastifyInstance) {
  app.get('/', async (req) => {
    const u = requireUser(req);
    if (!(await getSetting<boolean>(app.db, 'discovery_enabled'))) throw errors.unavailable('discovery_disabled', 'Descubrir está en pausa temporalmente');
    const q = parse(discoverQuerySchema, req.query);
    const profiles = await svc.discover(app.db, { id: u.id, plan: u.plan }, q);
    const used = await svc.likesUsedToday(app.db, u.id);
    return { profiles, likesRemaining: Math.max(0, LIMITS[u.plan].likesPerDay - used), empty: profiles.length === 0 };
  });
  app.post('/swipe', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async (req) => {
    const u = requireUser(req);
    if (!u.emailVerifiedAt) throw errors.forbidden('Verifica tu correo para dar like');
    const { targetId, action } = parse(swipeSchema, req.body);
    return svc.swipe(app.db, (app as any).bus ?? null, { id: u.id, plan: u.plan, email: u.email, locale: u.locale }, targetId, action);
  });
  app.post('/rewind', async (req) => { const u = requireUser(req); return svc.rewind(app.db, { id: u.id, plan: u.plan }); });
  app.get('/likes', async (req) => { const u = requireUser(req); return svc.likesReceived(app.db, { id: u.id, plan: u.plan }); });
}
