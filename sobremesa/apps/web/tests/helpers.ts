import { request as pwRequest, type APIRequestContext, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import sharp from 'sharp';
export const API = process.env.E2E_API_URL ?? 'http://localhost:4000';
export const PASSWORD = 'ContraseñaSegura123';
const DB = process.env.E2E_DATABASE_URL ?? 'postgres://citas:citas@127.0.0.1:5432/citas';
export const uniq = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@e2e.test`;

export async function apiCtx() { return pwRequest.newContext({ baseURL: API }); }
export async function tokenFromOutbox(ctx: APIRequestContext, to: string, path: string) {
  for (let i = 0; i < 20; i++) {
    const r = await (await ctx.get(`/dev/outbox?to=${encodeURIComponent(to)}`)).json();
    const m = [...r.emails].reverse().find((e: any) => e.text.includes(path));
    if (m) return m.text.match(/token=([A-Za-z0-9_-]+)/)![1];
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error(`sin correo ${path} para ${to}`);
}
/** Crea usuario verificado con perfil completo y foto aprobada, directamente contra el API (para preparar escenarios). */
export async function seedUser(ctx: APIRequestContext, p: { gender: string; interestedIn: string; name: string }) {
  const email = uniq(p.name.toLowerCase());
  const reg = await (await ctx.post('/auth/register', { data: { email, password: PASSWORD, birthdate: '1993-04-04', gender: p.gender, interestedIn: p.interestedIn, displayName: p.name, acceptTerms: true, acceptPrivacy: true, confirmAdult: true } })).json();
  const token = await tokenFromOutbox(ctx, email, 'verificar-correo');
  await ctx.post('/auth/verify-email', { data: { token } });
  const H = { Authorization: `Bearer ${reg.token}` };
  await ctx.patch('/profile/me', { headers: H, data: { bio: 'Perfil de prueba E2E con una presentación suficientemente larga.', intent: 'relacion_seria', interests: ['cafe', 'cine', 'senderismo'], planTypes: ['cafe'], idealPlan: 'Café y caminar', city: 'Guadalajara', location: { lat: 20.67, lng: -103.35 } } });
  const img = await sharp({ create: { width: 600, height: 800, channels: 3, background: { r: 120, g: 60, b: 80 } } }).jpeg().toBuffer();
  await ctx.post('/profile/me/photos', { headers: H, multipart: { file: { name: 'a.jpg', mimeType: 'image/jpeg', buffer: img } } });
  execSync(`psql "${DB}" -c "UPDATE photos SET status='approved' WHERE user_id='${reg.userId}'"`, { stdio: 'ignore' });
  return { email, token: reg.token as string, userId: reg.userId as string, H };
}
export async function loginUI(page: Page, email: string) {
  await page.goto('/entrar');
  await page.getByLabel('Correo', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/descubrir|perfil/);
}
export function makeAdmin(userId: string) { execSync(`psql "${DB}" -c "UPDATE users SET role='admin' WHERE id='${userId}'"`, { stdio: 'ignore' }); }
