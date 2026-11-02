import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyMediaSignature } from '../../services/media.js';
import { getStorage } from '../../services/storage.js';
import { errors } from '../../services/errors.js';

/** Sirve archivos privados solo con URL firmada y vigente. Sin firma válida no hay acceso, aunque se conozca la ruta. */
export async function mediaRoutes(app: FastifyInstance) {
  app.get('/media/*', async (req, reply) => {
    const key = decodeURIComponent((req.params as any)['*'] as string);
    const q = z.object({ v: z.string(), e: z.coerce.number(), s: z.string() }).safeParse(req.query);
    if (!q.success || !verifyMediaSignature(key, q.data.v, q.data.e, q.data.s)) throw errors.forbidden('Enlace inválido o vencido');
    const obj = await getStorage().get(key);
    if (!obj) throw errors.notFound();
    reply.header('Cache-Control', 'private, max-age=600').header('X-Robots-Tag', 'noindex, noimageindex').type(obj.contentType);
    return reply.send(obj.data);
  });
}
