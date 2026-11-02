import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { outbox } from '../src/services/email.js';
import { users, photos } from '../src/db/schema.js';

export async function makeApp() {
  const app = await buildApp({ logger: false, jobs: false });
  await app.ready();
  return app;
}
export type Client = { token: string; userId: string; email: string };

export function lastEmailLink(to: string, pathPart: string): string {
  const mail = [...outbox].reverse().find((m) => m.to === to && m.text.includes(pathPart));
  if (!mail) throw new Error(`No hay correo para ${to} con ${pathPart}`);
  const m = mail.text.match(/token=([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('Sin token en correo');
  return m[1]!;
}

export async function registerVerified(app: FastifyInstance, p: { email: string; gender: 'mujer' | 'hombre' | 'no_binario' | 'otro'; interestedIn: 'mujeres' | 'hombres' | 'todas'; name?: string; birthdate?: string }): Promise<Client> {
  const res = await app.inject({ method: 'POST', url: '/auth/register', payload: {
    email: p.email, password: 'ContraseñaSegura123', birthdate: p.birthdate ?? '1994-05-10', gender: p.gender, interestedIn: p.interestedIn,
    displayName: p.name ?? p.email.split('@')[0], acceptTerms: true, acceptPrivacy: true, confirmAdult: true,
  } });
  if (res.statusCode !== 201) throw new Error(`registro falló: ${res.body}`);
  const body = res.json();
  const token = lastEmailLink(p.email, 'verificar-correo');
  const v = await app.inject({ method: 'POST', url: '/auth/verify-email', payload: { token } });
  if (v.statusCode !== 200) throw new Error(`verificación falló: ${v.body}`);
  return { token: body.token, userId: body.userId, email: p.email };
}

export async function completeProfile(app: FastifyInstance, c: Client, extra: Record<string, unknown> = {}) {
  const r = await app.inject({ method: 'PATCH', url: '/profile/me', headers: auth(c), payload: {
    bio: 'Me gusta el café de especialidad, caminar por Chapultepec y los planes sin prisa.', intent: 'relacion_seria',
    interests: ['cafe', 'senderismo', 'cine'], planTypes: ['cafe', 'caminata'], idealPlan: 'Café y caminata un sábado por la mañana',
    city: 'Guadalajara', location: { lat: 20.6736, lng: -103.344 }, prefAgeMin: 22, prefAgeMax: 45, ...extra,
  } });
  if (r.statusCode !== 200) throw new Error(`perfil falló: ${r.body}`);
  // Foto: se sube y se aprueba directamente en BD (simula al moderador).
  const img = await sharp({ create: { width: 600, height: 800, channels: 3, background: { r: 200, g: 120, b: 90 } } }).jpeg().toBuffer();
  const boundary = '----vitestboundary';
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`), img, Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const up = await app.inject({ method: 'POST', url: '/profile/me/photos', headers: { ...auth(c), 'content-type': `multipart/form-data; boundary=${boundary}` }, payload });
  if (up.statusCode !== 201) throw new Error(`foto falló: ${up.body}`);
  await app.db.update(photos).set({ status: 'approved' }).where(eq(photos.userId, c.userId));
  return up.json().photo;
}

export function auth(c: Client) { return { authorization: `Bearer ${c.token}` }; }

export async function makeAdmin(app: FastifyInstance, c: Client, role: 'admin' | 'moderator' = 'admin') {
  await app.db.update(users).set({ role }).where(eq(users.id, c.userId));
}
export async function like(app: FastifyInstance, from: Client, toId: string) {
  const r = await app.inject({ method: 'POST', url: '/discover/swipe', headers: auth(from), payload: { targetId: toId, action: 'like' } });
  return { status: r.statusCode, body: r.json() };
}
export async function matchPair(app: FastifyInstance, a: Client, b: Client) {
  await like(app, a, b.userId);
  const r = await like(app, b, a.userId);
  if (!r.body.matched) throw new Error('no hubo match: ' + JSON.stringify(r.body));
  return { matchId: r.body.matchId as string, conversationId: r.body.conversationId as string };
}
