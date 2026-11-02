import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendMessageSchema, wsClientEventSchema } from '@sobremesa/shared';
import { parse } from '../../plugins/validation.js';
import { requireUser, loadSessionUser, SESSION_COOKIE } from '../../plugins/context.js';
import * as svc from './service.js';
import { RealtimeBus } from '../../services/realtime.js';
import { randomToken } from '../../services/crypto.js';
import { AppError } from '../../services/errors.js';

export async function chatRoutes(app: FastifyInstance) {
  const bus = new RealtimeBus(app.sql, randomToken(6));
  await bus.start();
  (app as any).bus = bus;

  app.get('/conversations', async (req) => { const u = requireUser(req); return { conversations: await svc.listConversations(app.db, u.id) }; });
  app.get('/conversations/:id', async (req) => {
    const u = requireUser(req); const { id } = parse(z.object({ id: z.uuid() }), req.params);
    return { conversation: await svc.getConversation(app.db, id, u.id) };
  });
  app.get('/conversations/:id/messages', async (req) => {
    const u = requireUser(req); const { id } = parse(z.object({ id: z.uuid() }), req.params);
    const { after, limit } = parse(z.object({ after: z.coerce.number().int().min(0).default(0), limit: z.coerce.number().int().min(1).max(100).default(50) }), req.query);
    return { messages: await svc.listMessages(app.db, id, u.id, after, limit) };
  });
  app.post('/conversations/:id/messages', async (req, reply) => {
    const u = requireUser(req); const { id } = parse(z.object({ id: z.uuid() }), req.params);
    const input = parse(sendMessageSchema, req.body);
    const res = await svc.sendMessage(app.db, bus, { id: u.id, plan: u.plan }, id, input.clientId, input.body);
    return reply.status(res.duplicate ? 200 : 201).send(res);
  });
  app.post('/conversations/:id/read', async (req) => {
    const u = requireUser(req); const { id } = parse(z.object({ id: z.uuid() }), req.params);
    const { seq } = parse(z.object({ seq: z.number().int().min(0) }), req.body);
    await svc.markRead(app.db, id, u.id, seq); return { ok: true };
  });
  app.get('/conversations/:id/icebreakers', async (req) => {
    const u = requireUser(req); const { id } = parse(z.object({ id: z.uuid() }), req.params);
    return { suggestions: await svc.icebreakers(app.db, id, u.id, u.locale), note: 'Sugerencias generadas por plantilla. Nada se envía hasta que pulses Enviar.' };
  });

  // WebSocket: autenticación por cookie de sesión o ?token=; mismo servicio de envío que REST.
  app.get('/ws', { websocket: true }, async (socket, req) => {
    let token: string | undefined = (req.query as any)?.token;
    if (!token) { const raw = req.cookies[SESSION_COOKIE]; if (raw) { const un = req.unsignCookie(raw); if (un.valid && un.value) token = un.value; } }
    const loaded = token ? await loadSessionUser(app.db, token) : null;
    if (!loaded || loaded.user.status === 'suspended') { socket.send(JSON.stringify({ type: 'error', code: 'unauthorized', message: 'Sesión inválida' })); socket.close(4001, 'unauthorized'); return; }
    const user = loaded.user;
    const unsubscribe = bus.subscribe(user.id, socket);
    socket.on('message', async (raw: Buffer) => {
      let parsed;
      try { parsed = wsClientEventSchema.safeParse(JSON.parse(raw.toString())); } catch { parsed = { success: false } as const; }
      if (!parsed.success) { socket.send(JSON.stringify({ type: 'error', code: 'bad_event', message: 'Evento inválido' })); return; }
      const ev = parsed.data;
      if (ev.type === 'ping') { socket.send(JSON.stringify({ type: 'pong' })); return; }
      try {
        const res = await svc.sendMessage(app.db, bus, { id: user.id, plan: user.plan }, ev.conversationId, ev.clientId, ev.body);
        socket.send(JSON.stringify({ type: 'message.ack', clientId: ev.clientId, messageId: res.message.id, seq: res.message.seq }));
      } catch (e) {
        const err = e instanceof AppError ? e : new AppError(500, 'internal', 'Error interno');
        socket.send(JSON.stringify({ type: 'error', code: err.code, message: err.message, clientId: ev.clientId }));
      }
    });
    socket.on('close', unsubscribe);
    socket.on('error', unsubscribe);
  });
}
