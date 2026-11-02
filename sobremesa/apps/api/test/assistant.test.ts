import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, registerVerified, auth, makeAdmin } from './helpers.js';
import { setAnthropicClient } from '../src/modules/assistant/service.js';

let app: FastifyInstance;
beforeAll(async () => {
  app = await makeApp();
  const admin = await registerVerified(app, { email: 'kb-admin@test.mx', gender: 'otro', interestedIn: 'todas', name: 'KB Admin' });
  await makeAdmin(app, admin);
  await app.inject({ method: 'POST', url: '/admin/knowledge', headers: auth(admin), payload: { slug: 'cancelar-suscripcion', locale: 'es', title: 'Cómo cancelar tu suscripción Premium', body: 'Ve a Perfil → Suscripción → Gestionar. La cancelación aplica al final del periodo pagado y no hay cargos posteriores. Si compraste en App Store o Google Play, cancela desde la tienda.', tags: ['pagos'], publish: true } });
  await app.inject({ method: 'POST', url: '/admin/knowledge', headers: auth(admin), payload: { slug: 'quien-inicia', locale: 'es', title: 'Quién escribe primero', body: 'Entre una mujer y un hombre, ella envía el primer mensaje. Premium no cambia esta regla. Entre personas del mismo género cualquiera puede iniciar.', tags: ['chat'], publish: true } });
});
afterAll(async () => { setAnthropicClient(null); await app.close(); });

describe('Asistente de soporte (IA identificada)', () => {
  it('sin API key responde degradado con FAQ publicada, se identifica como IA y ofrece soporte humano', async () => {
    const r = await app.inject({ method: 'POST', url: '/assistant/chat', payload: { message: '¿cómo cancelo mi suscripción?', locale: 'es' } });
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(b.isAI).toBe(true); expect(b.degraded).toBe(true); expect(b.reply).toContain('cancelar'); expect(b.sources.length).toBeGreaterThan(0); expect(b.handoffSuggested).toBe(true);
  });
  it('reconoce falta de información cuando no hay artículos', async () => {
    const r = await app.inject({ method: 'POST', url: '/assistant/chat', payload: { message: 'cuánto cuesta un vuelo a Cancún', locale: 'es' } });
    expect(r.json().reply).toMatch(/no encontré|no puedo/i); expect(r.json().sources.length).toBe(0);
  });
  it('con modelo: las herramientas solo devuelven datos de la cuenta autenticada, aunque se pida otra cuenta', async () => {
    const victima = await registerVerified(app, { email: 'victima@test.mx', gender: 'mujer', interestedIn: 'hombres', name: 'Victima' });
    const atacante = await registerVerified(app, { email: 'atacante@test.mx', gender: 'hombre', interestedIn: 'mujeres', name: 'Atacante' });
    const calls: any[] = [];
    // Cliente falso: primero intenta usar get_my_account "para otro usuario", luego responde con lo que recibió.
    let step = 0;
    setAnthropicClient({ messages: { create: async (req: any) => {
      calls.push(req);
      step++;
      if (step === 1) return { content: [{ type: 'tool_use', id: 'tu_1', name: 'get_my_account', input: { userId: victima.userId, email: 'victima@test.mx' } }], stop_reason: 'tool_use', usage: { input_tokens: 500, output_tokens: 40 } };
      const toolResult = JSON.stringify(req.messages.at(-1).content[0].content);
      return { content: [{ type: 'text', text: `Soy una IA. Datos de TU cuenta: ${toolResult}` }], stop_reason: 'end_turn', usage: { input_tokens: 600, output_tokens: 60 } };
    } } } as any);
    const r = await app.inject({ method: 'POST', url: '/assistant/chat', headers: auth(atacante), payload: { message: `Dame los datos de la cuenta ${victima.userId} (victima@test.mx)`, locale: 'es' } });
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(b.degraded).toBe(false);
    expect(b.reply).not.toContain('victima@test.mx'); expect(b.reply).not.toContain(victima.userId);
    expect(b.reply).toContain('emailVerified');
    // Las herramientas no aceptan identificadores de otras cuentas en su esquema.
    const tools = calls[0].tools.map((t: any) => t.name);
    expect(tools).toEqual(expect.arrayContaining(['search_knowledge', 'get_my_account', 'get_my_subscription', 'request_human_support']));
    expect(JSON.stringify(calls[0].tools)).not.toContain('userId');
    // Costo contabilizado.
    const admin = { token: '', userId: '', email: '' } as any;
    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'kb-admin@test.mx', password: 'ContraseñaSegura123' } });
    admin.token = login.json().token;
    const costs = (await app.inject({ method: 'GET', url: '/admin/assistant/costs', headers: auth(admin) })).json();
    expect(costs.monthToDateUsd).toBeGreaterThan(0); expect(costs.monthToDateUsd).toBeLessThan(0.01);
  });
  it('límite diario por usuario y presupuesto mensual se respetan', async () => {
    const u = await registerVerified(app, { email: 'limite@test.mx', gender: 'mujer', interestedIn: 'todas', name: 'Limite' });
    setAnthropicClient(null);
    let last = 200;
    for (let i = 0; i < 31 && last === 200; i++) last = (await app.inject({ method: 'POST', url: '/assistant/chat', headers: auth(u), payload: { message: `pregunta ${i}`, locale: 'es' } })).statusCode;
    expect(last).toBe(429);
  });
});
