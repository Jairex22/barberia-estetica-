import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { reportSchema, blockSchema } from '@sobremesa/shared';
import { parse } from '../../plugins/validation.js';
import { requireUser } from '../../plugins/context.js';
import * as svc from './service.js';
import { errors } from '../../services/errors.js';

export async function safetyRoutes(app: FastifyInstance) {
  const bus = () => (app as any).bus ?? null;
  app.post('/block', async (req) => { const u = requireUser(req); const { targetUserId } = parse(blockSchema, req.body); await svc.block(app.db, bus(), u.id, targetUserId); return { ok: true }; });
  app.delete('/block/:id', async (req) => { const u = requireUser(req); const { id } = parse(z.object({ id: z.uuid() }), req.params); await svc.unblock(app.db, u.id, id); return { ok: true }; });
  app.get('/blocks', async (req) => { const u = requireUser(req); return { blocks: await svc.listBlocks(app.db, u.id) }; });
  app.post('/report', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, async (req) => {
    const u = requireUser(req);
    const input = parse(reportSchema.extend({ alsoBlock: z.boolean().optional() }), req.body);
    const r = await svc.report(app.db, bus(), u.id, input);
    return { ok: true, reportId: r.id, message: 'Gracias. Revisaremos el reporte; no le avisaremos a la otra persona quién lo envió.' };
  });
  app.post('/appeals', { config: { rateLimit: { max: 3, timeWindow: '1 day' } } }, async (req) => {
    if (!req.user) throw errors.unauthorized();
    const { subject, body } = parse(z.object({ subject: z.string().trim().min(3).max(120), body: z.string().trim().min(10).max(2000) }), req.body);
    const a = await svc.appeal(app.db, req.user.id, subject, body);
    return { ok: true, appealId: a.id };
  });
  app.get('/verification', async (req) => { const u = requireUser(req); return { requests: await svc.myVerification(app.db, u.id), pose: svc.newPoseCode(), note: 'La insignia indica que una persona revisó que tu selfie coincide con tus fotos. No garantiza que alguien sea seguro.' }; });
  app.post('/verification/selfie', { config: { rateLimit: { max: 5, timeWindow: '1 day' } } }, async (req) => {
    const u = requireUser(req);
    const file = await req.file();
    if (!file) throw errors.badRequest('no_file', 'Adjunta la selfie');
    const pose = (file.fields as any)?.pose?.value as string | undefined;
    if (!pose) throw errors.badRequest('no_pose', 'Falta la pose solicitada');
    const row = await svc.submitSelfieVerification(app.db, u.id, pose, await file.toBuffer());
    return { ok: true, requestId: row.id, status: row.status };
  });
}
