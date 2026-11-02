import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from '../../plugins/validation.js';
import { requireUser } from '../../plugins/context.js';
import * as svc from './service.js';

export async function matchRoutes(app: FastifyInstance) {
  app.get('/', async (req) => { const u = requireUser(req); return { matches: await svc.listMatches(app.db, u.id) }; });
  app.delete('/:id', async (req) => {
    const u = requireUser(req);
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    await svc.unmatch(app.db, (app as any).bus ?? null, u.id, id);
    return { ok: true };
  });
}
