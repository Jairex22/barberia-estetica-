import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { profileUpdateSchema } from '@sobremesa/shared';
import { parse } from '../../plugins/validation.js';
import { requireUser } from '../../plugins/context.js';
import * as svc from './service.js';
import { errors } from '../../services/errors.js';

export async function profileRoutes(app: FastifyInstance) {
  app.get('/me', async (req) => { const u = requireUser(req); return { profile: await svc.getOwnProfile(app.db, u.id) }; });
  app.patch('/me', async (req) => {
    const u = requireUser(req);
    const input = parse(profileUpdateSchema, req.body);
    return { profile: await svc.updateProfile(app.db, u.id, input) };
  });
  app.post('/me/photos', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, async (req, reply) => {
    const u = requireUser(req);
    const file = await req.file();
    if (!file) throw errors.badRequest('no_file', 'Adjunta una imagen');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.mimetype)) throw errors.badRequest('bad_type', 'Formato no admitido (JPG, PNG, WebP)');
    const buf = await file.toBuffer();
    try {
      const photo = await svc.addPhoto(app.db, u.id, buf);
      return reply.status(201).send({ photo });
    } catch (e: any) {
      if (e?.statusCode) throw e;
      throw errors.badRequest('bad_image', e?.message ?? 'Imagen inválida');
    }
  });
  app.delete('/me/photos/:id', async (req) => {
    const u = requireUser(req);
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    await svc.deletePhoto(app.db, u.id, id);
    return { ok: true };
  });
  app.put('/me/photos/order', async (req) => {
    const u = requireUser(req);
    const { ids } = parse(z.object({ ids: z.array(z.uuid()).max(6) }), req.body);
    await svc.reorderPhotos(app.db, u.id, ids);
    return { ok: true };
  });
  /** Navegación privada (Premium): solo te ven las personas a las que diste like. */
  app.post('/me/incognito', async (req) => {
    const u = requireUser(req);
    const { enabled } = parse(z.object({ enabled: z.boolean() }), req.body);
    if (enabled && u.plan !== 'premium') throw errors.forbidden('La navegación privada es parte de Premium');
    await svc.setIncognito(app.db, u.id, enabled);
    return { ok: true, incognito: enabled };
  });
  app.get('/:id', async (req) => {
    const u = requireUser(req);
    const { id } = parse(z.object({ id: z.uuid() }), req.params);
    return { profile: await svc.getPublicProfile(app.db, u.id, id) };
  });
}
