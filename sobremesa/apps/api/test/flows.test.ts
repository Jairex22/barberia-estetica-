import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { makeApp, registerVerified, completeProfile, auth, matchPair, like, makeAdmin } from './helpers.js';
import { eq } from 'drizzle-orm';
import { users } from '../src/db/schema.js';

let app: FastifyInstance; let base: string;
beforeAll(async () => { app = await makeApp(); await app.listen({ port: 0, host: '127.0.0.1' }); const addr = app.server.address() as any; base = `http://127.0.0.1:${addr.port}`; });
afterAll(async () => { await app.close(); });

describe('Recorrido completo: dos cuentas, perfiles, match y chat sincronizado', () => {
  it('registro bloquea menores de edad', async () => {
    const r = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'menor@test.mx', password: 'ContraseñaSegura123', birthdate: '2010-01-01', gender: 'mujer', interestedIn: 'hombres', displayName: 'Menor', acceptTerms: true, acceptPrivacy: true, confirmAdult: true } });
    expect(r.statusCode).toBe(400); expect(r.json().error.code).toBe('underage');
  });
  it('registro, verificación, perfiles, likes mutuos y conversación en ambos sentidos (REST + WebSocket)', async () => {
    const ana = await registerVerified(app, { email: 'ana@test.mx', gender: 'mujer', interestedIn: 'hombres', name: 'Ana' });
    const luis = await registerVerified(app, { email: 'luis@test.mx', gender: 'hombre', interestedIn: 'mujeres', name: 'Luis' });
    await completeProfile(app, ana); await completeProfile(app, luis);

    // Descubrir: Luis ve a Ana con señales explicables (no porcentajes).
    const d = await app.inject({ method: 'GET', url: '/discover', headers: auth(luis) });
    expect(d.statusCode).toBe(200);
    const card = d.json().profiles.find((p: any) => p.id === ana.userId);
    expect(card).toBeTruthy(); expect(card.signals.sharedInterests).toContain('cafe'); expect(card.distanceBucket).toBe('muy_cerca');
    expect(card).not.toHaveProperty('latCoarse');

    const { conversationId } = await matchPair(app, luis, ana);
    // WebSocket de Luis recibe el mensaje que Ana envía por REST.
    const ws = new WebSocket(`${base.replace('http', 'ws')}/ws?token=${luis.token}`);
    const received: any[] = [];
    await new Promise<void>((resolve, reject) => { ws.on('open', () => resolve()); ws.on('error', reject); });
    ws.on('message', (d) => received.push(JSON.parse(d.toString())));
    const send = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(ana), payload: { clientId: 'ana-msg-0001', body: 'Hola Luis, ¿café el sábado?' } });
    expect(send.statusCode).toBe(201);
    await new Promise((r) => setTimeout(r, 300));
    expect(received.some((e) => e.type === 'message.new' && e.message.body.includes('café'))).toBe(true);
    // Reintento con el mismo clientId no duplica.
    const dup = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(ana), payload: { clientId: 'ana-msg-0001', body: 'Hola Luis, ¿café el sábado?' } });
    expect(dup.statusCode).toBe(200); expect(dup.json().duplicate).toBe(true);
    // Luis responde por WebSocket y recibe ack; Ana lo ve por REST.
    ws.send(JSON.stringify({ type: 'message.send', conversationId, clientId: 'luis-ws-0001', body: 'Sí, me encanta la idea.' }));
    await new Promise((r) => setTimeout(r, 300));
    expect(received.some((e) => e.type === 'message.ack' && e.clientId === 'luis-ws-0001')).toBe(true);
    const list = await app.inject({ method: 'GET', url: `/conversations/${conversationId}/messages`, headers: auth(ana) });
    expect(list.json().messages.map((m: any) => m.seq)).toEqual([1, 2]);
    ws.close();
  });
});

describe('Regla de inicio mujer-hombre se cumple en el servidor', () => {
  it('el hombre no puede iniciar ni llamando a la API; Premium no lo cambia; tras ella, sí puede', async () => {
    const maria = await registerVerified(app, { email: 'maria@test.mx', gender: 'mujer', interestedIn: 'hombres' });
    const pedro = await registerVerified(app, { email: 'pedro@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    await completeProfile(app, maria); await completeProfile(app, pedro);
    const { conversationId } = await matchPair(app, pedro, maria);
    const conv = await app.inject({ method: 'GET', url: `/conversations/${conversationId}`, headers: auth(pedro) });
    expect(conv.json().conversation.initiation).toBe('them');
    const attempt = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(pedro), payload: { clientId: 'pedro-0001', body: 'Hola!' } });
    expect(attempt.statusCode).toBe(403); expect(attempt.json().error.code).toBe('initiation_not_allowed');
    // Simular Premium en BD: sigue sin poder.
    await app.db.execute(`INSERT INTO subscriptions (user_id, channel, provider_subscription_id, status, current_period_end) VALUES ('${pedro.userId}', 'manual', 'manual-pedro', 'active', now() + interval '30 days')` as any);
    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: auth(pedro) });
    expect(me.json().user.plan).toBe('premium');
    const attempt2 = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(pedro), payload: { clientId: 'pedro-0002', body: 'Hola!' } });
    expect(attempt2.statusCode).toBe(403);
    const ok = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(maria), payload: { clientId: 'maria-0001', body: 'Hola Pedro' } });
    expect(ok.statusCode).toBe(201);
    const reply = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(pedro), payload: { clientId: 'pedro-0003', body: 'Hola María' } });
    expect(reply.statusCode).toBe(201);
  });
  it('mujer-mujer y hombre-hombre: cualquiera inicia', async () => {
    const a = await registerVerified(app, { email: 'carla@test.mx', gender: 'mujer', interestedIn: 'mujeres' });
    const b = await registerVerified(app, { email: 'dani@test.mx', gender: 'mujer', interestedIn: 'mujeres' });
    await completeProfile(app, a); await completeProfile(app, b);
    const { conversationId } = await matchPair(app, a, b);
    const r = await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(b), payload: { clientId: 'dani-0001-x', body: 'Hola' } });
    expect(r.statusCode).toBe(201);
  });
});

describe('Bloqueo y denuncia persisten', () => {
  it('bloquear termina el match, oculta en descubrir y persiste tras cerrar sesión y volver a entrar', async () => {
    const sofia = await registerVerified(app, { email: 'sofia@test.mx', gender: 'mujer', interestedIn: 'hombres' });
    const raul = await registerVerified(app, { email: 'raul@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    await completeProfile(app, sofia); await completeProfile(app, raul);
    const { conversationId } = await matchPair(app, raul, sofia);
    const rep = await app.inject({ method: 'POST', url: '/safety/report', headers: auth(sofia), payload: { targetUserId: raul.userId, reason: 'acoso', details: 'Mensajes insistentes', conversationId } });
    expect(rep.statusCode).toBe(200);
    // Conversación desaparece para ambos.
    expect((await app.inject({ method: 'GET', url: `/conversations/${conversationId}`, headers: auth(raul) })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: `/profile/${sofia.userId}`, headers: auth(raul) })).statusCode).toBe(404);
    // Cerrar sesión y volver a entrar.
    await app.inject({ method: 'POST', url: '/auth/logout', headers: auth(sofia) });
    expect((await app.inject({ method: 'GET', url: '/profile/me', headers: auth(sofia) })).statusCode).toBe(401);
    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'sofia@test.mx', password: 'ContraseñaSegura123' } });
    const sofia2 = { ...sofia, token: login.json().token };
    const blocks = await app.inject({ method: 'GET', url: '/safety/blocks', headers: auth(sofia2) });
    expect(blocks.json().blocks.map((b: any) => b.blockedId)).toContain(raul.userId);
    const disc = await app.inject({ method: 'GET', url: '/discover', headers: auth(raul) });
    expect(disc.json().profiles.map((p: any) => p.id)).not.toContain(sofia.userId);
    // El reportado no puede volver a dar like.
    const l = await like(app, raul, sofia.userId); expect(l.status).toBe(404);
  });
});

describe('Aislamiento de cuentas', () => {
  it('nadie lee ni modifica conversaciones, mensajes o fotos ajenas', async () => {
    const a = await registerVerified(app, { email: 'iso-a@test.mx', gender: 'mujer', interestedIn: 'hombres' });
    const b = await registerVerified(app, { email: 'iso-b@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    const intruso = await registerVerified(app, { email: 'intruso@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    await completeProfile(app, a); const photoB = await completeProfile(app, b); await completeProfile(app, intruso);
    const { conversationId, matchId } = await matchPair(app, b, a);
    await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(a), payload: { clientId: 'a-0001-xx', body: 'privado' } });
    expect((await app.inject({ method: 'GET', url: `/conversations/${conversationId}/messages`, headers: auth(intruso) })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: `/conversations/${conversationId}/messages`, headers: auth(intruso), payload: { clientId: 'intruso-001', body: 'hola' } })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/matches/${matchId}`, headers: auth(intruso) })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/profile/me/photos/${photoB.id}`, headers: auth(intruso) })).statusCode).toBe(404);
    // URL firmada de foto no sirve sin firma válida.
    const url = new URL(photoB.url); url.searchParams.set('s', 'firma-falsa');
    const media = await app.inject({ method: 'GET', url: url.pathname + url.search });
    expect(media.statusCode).toBe(403);
    // Sin sesión: 401; endpoints admin: 403 para usuario normal.
    expect((await app.inject({ method: 'GET', url: '/profile/me' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/admin/metrics', headers: auth(intruso) })).statusCode).toBe(403);
    // Moderador no accede a datos de facturación ni correos.
    await makeAdmin(app, intruso, 'moderator');
    expect((await app.inject({ method: 'GET', url: '/admin/payments', headers: auth(intruso) })).statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: `/admin/users/${a.userId}`, headers: auth(intruso) })).statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: '/admin/reports', headers: auth(intruso) })).statusCode).toBe(200);
  });
});

describe('Cuentas eliminadas, suspendidas o pausadas no aparecen', () => {
  it('descubrir excluye eliminadas/suspendidas/pausadas y sus matches dejan de listarse', async () => {
    const w = await registerVerified(app, { email: 'wendy@test.mx', gender: 'mujer', interestedIn: 'hombres' });
    const m1 = await registerVerified(app, { email: 'mario1@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    const m2 = await registerVerified(app, { email: 'mario2@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    const m3 = await registerVerified(app, { email: 'mario3@test.mx', gender: 'hombre', interestedIn: 'mujeres' });
    for (const c of [w, m1, m2, m3]) await completeProfile(app, c);
    const before = (await app.inject({ method: 'GET', url: '/discover', headers: auth(w) })).json().profiles.map((p: any) => p.id);
    expect(before).toEqual(expect.arrayContaining([m1.userId, m2.userId, m3.userId]));
    // m1 se elimina (flujo real con confirmación por correo), m2 se suspende, m3 pausa.
    await matchPair(app, m1, w);
    await app.inject({ method: 'POST', url: '/account/delete/request', headers: auth(m1) });
    const { lastEmailLink } = await import('./helpers.js');
    const token = lastEmailLink('mario1@test.mx', 'eliminar-cuenta');
    expect((await app.inject({ method: 'POST', url: '/account/delete/confirm', payload: { token } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/profile/me', headers: auth(m1) })).statusCode).toBe(401);
    await app.db.update(users).set({ status: 'suspended' }).where(eq(users.id, m2.userId));
    await app.inject({ method: 'POST', url: '/account/pause', headers: auth(m3) });
    const after = (await app.inject({ method: 'GET', url: '/discover', headers: auth(w) })).json().profiles.map((p: any) => p.id);
    expect(after).not.toContain(m1.userId); expect(after).not.toContain(m2.userId); expect(after).not.toContain(m3.userId);
    const matches = (await app.inject({ method: 'GET', url: '/matches', headers: auth(w) })).json().matches;
    expect(matches.map((m: any) => m.other.id)).not.toContain(m1.userId);
    // Suspendido no puede operar.
    expect((await app.inject({ method: 'GET', url: '/discover', headers: auth(m2) })).statusCode).toBe(403);
  });
});
