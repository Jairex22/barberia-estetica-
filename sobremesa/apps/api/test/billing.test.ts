import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { makeApp, registerVerified, auth } from './helpers.js';
import { setStripeClient } from '../src/modules/billing/providers/stripe.js';

let app: FastifyInstance;
const SECRET = 'whsec_test_secret_for_vitest';
/** Estado "vivo" simulado en Stripe: lo que devuelve subscriptions.retrieve (fuente de verdad ante eventos desordenados). */
const liveSubs = new Map<string, any>();
const fakeStripe = {
  subscriptions: { retrieve: async (id: string) => { const s = liveSubs.get(id); if (!s) throw new Error('No such subscription'); return s; }, update: async (id: string, p: any) => { const s = liveSubs.get(id); s.cancel_at_period_end = p.cancel_at_period_end; return s; } },
  checkout: { sessions: { create: async (p: any) => ({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1', client_reference_id: p.client_reference_id }) } },
  billingPortal: { sessions: { create: async () => ({ url: 'https://billing.stripe.com/p/session/test' }) } },
};
function sub(id: string, userId: string, status: string, periodEndSec: number, extra: any = {}) {
  return { id, object: 'subscription', status, customer: 'cus_test_1', cancel_at_period_end: false, metadata: { userId }, items: { data: [{ current_period_end: periodEndSec, price: { currency: 'mxn', unit_amount: 19900 } }] }, ...extra };
}
function signed(event: any) {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return { payload, headers: { 'stripe-signature': header, 'content-type': 'application/json' } };
}
async function post(path: string, event: any, headers?: Record<string, string>) {
  const s = signed(event);
  return app.inject({ method: 'POST', url: path, headers: headers ?? s.headers, payload: s.payload });
}
const now = Math.floor(Date.now() / 1000);
let evCounter = 0;
const ev = (type: string, object: any, created = now) => ({ id: `evt_${++evCounter}`, object: 'event', type, created, data: { object }, api_version: '2026-10-29' });

beforeAll(async () => { app = await makeApp(); setStripeClient(fakeStripe as any); });
afterAll(async () => { setStripeClient(null); await app.close(); });

describe('Stripe: compra, renovación, fallo, cancelación, reembolso, eventos repetidos y desordenados', () => {
  it('ciclo completo con firma verificada e idempotencia', async () => {
    const u = await registerVerified(app, { email: 'pago@test.mx', gender: 'mujer', interestedIn: 'hombres', name: 'Paga' });
    // Precios visibles antes de pagar: moneda, importe, renovación, cómo cancelar.
    const prices = (await app.inject({ method: 'GET', url: '/billing/prices', headers: auth(u) })).json();
    const mxn = prices.prices.find((p: any) => p.channel === 'stripe' && p.currency === 'MXN');
    expect(mxn.available).toBe(true); expect(mxn.renewsAutomatically).toBe(true); expect(mxn.cancelInstructions.length).toBeGreaterThan(10);
    expect(prices.prices.find((p: any) => p.channel === 'mercadopago').available).toBe(false);
    // Checkout crea sesión alojada (sin datos de tarjeta en nuestro servidor).
    const co = await app.inject({ method: 'POST', url: '/billing/checkout', headers: auth(u), payload: { channel: 'stripe', currency: 'MXN' } });
    expect(co.statusCode).toBe(200); expect(co.json().url).toContain('checkout.stripe.com');
    // La redirección de éxito NO activa Premium.
    expect((await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user.plan).toBe('free');

    // Firma inválida → 400 y nada cambia.
    const bad = await post('/billing/webhooks/stripe', ev('checkout.session.completed', {}), { 'stripe-signature': 't=1,v1=deadbeef', 'content-type': 'application/json' });
    expect(bad.statusCode).toBe(400);

    // checkout.session.completed → consultamos estado vivo → active.
    liveSubs.set('sub_1', sub('sub_1', u.userId, 'active', now + 30 * 86400));
    const completedEvent = ev('checkout.session.completed', { id: 'cs_test_1', mode: 'subscription', subscription: 'sub_1', client_reference_id: u.userId });
    const completed = await post('/billing/webhooks/stripe', completedEvent);
    expect(completed.statusCode).toBe(200); expect(completed.json().status).toBe('processed');
    let me = (await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user;
    expect(me.plan).toBe('premium');

    // Mismo evento reenviado → duplicate, sin efectos.
    const again = await post('/billing/webhooks/stripe', completedEvent);
    expect(again.json().status).toBe('duplicate');

    // Protección de doble cobro: segundo checkout rechazado.
    const co2 = await app.inject({ method: 'POST', url: '/billing/checkout', headers: auth(u), payload: { channel: 'stripe', currency: 'MXN' } });
    expect(co2.statusCode).toBe(409); expect(co2.json().error.code).toBe('already_subscribed');

    // invoice.paid registra ingreso conciliado.
    const paid = await post('/billing/webhooks/stripe', ev('invoice.paid', { id: 'in_1', object: 'invoice', amount_paid: 19900, currency: 'mxn', payment_intent: 'pi_1', parent: { subscription_details: { subscription: 'sub_1' } } }));
    expect(paid.json().status).toBe('processed');

    // Fallo de pago en renovación → past_due (sigue con acceso en gracia hasta fin de periodo).
    liveSubs.set('sub_1', sub('sub_1', u.userId, 'past_due', now + 30 * 86400));
    await post('/billing/webhooks/stripe', ev('invoice.payment_failed', { id: 'in_2', object: 'invoice', parent: { subscription_details: { subscription: 'sub_1' } } }, now + 10));
    let ent = (await app.inject({ method: 'GET', url: '/billing/entitlement', headers: auth(u) })).json().entitlement;
    expect(ent.status).toBe('past_due'); expect(ent.plan).toBe('premium');

    // Evento viejo (desordenado) llega después. Caso 1: el proveedor responde → se aplica el estado VIVO (sigue past_due).
    const staleLive = await post('/billing/webhooks/stripe', ev('customer.subscription.updated', sub('sub_1', u.userId, 'active', now + 30 * 86400), now - 3600));
    expect(staleLive.json().status).toBe('processed');
    // Caso 2: el proveedor no responde → se usa el payload, pero su marca de tiempo es anterior al último aplicado → ignorado.
    const saved = liveSubs.get('sub_1'); liveSubs.delete('sub_1');
    const stale = await post('/billing/webhooks/stripe', ev('customer.subscription.updated', sub('sub_1', u.userId, 'active', now + 30 * 86400), now - 3600));
    expect(stale.json().status).toBe('ignored');
    liveSubs.set('sub_1', saved);
    ent = (await app.inject({ method: 'GET', url: '/billing/entitlement', headers: auth(u) })).json().entitlement;
    expect(ent.status).toBe('past_due');

    // Cancelación al final del periodo desde la app (sin obstáculos): conserva Premium hasta la fecha.
    liveSubs.set('sub_1', sub('sub_1', u.userId, 'active', now + 30 * 86400));
    await post('/billing/webhooks/stripe', ev('customer.subscription.updated', sub('sub_1', u.userId, 'active', now + 30 * 86400), now + 20));
    const cancel = await app.inject({ method: 'POST', url: '/billing/cancel', headers: auth(u) });
    expect(cancel.statusCode).toBe(200);
    ent = (await app.inject({ method: 'GET', url: '/billing/entitlement', headers: auth(u) })).json().entitlement;
    expect(ent.cancelAtPeriodEnd).toBe(true); expect(ent.plan).toBe('premium'); expect(ent.manageUrl).toContain('billing.stripe.com');

    // Reembolso → acceso revocado de inmediato.
    const refund = await post('/billing/webhooks/stripe', ev('charge.refunded', { id: 'ch_1', object: 'charge', amount_refunded: 19900, currency: 'mxn', payment_intent: 'pi_1' }, now + 30));
    expect(refund.json().status).toBe('processed');
    me = (await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user;
    expect(me.plan).toBe('free');
    ent = (await app.inject({ method: 'GET', url: '/billing/entitlement', headers: auth(u) })).json().entitlement;
    expect(ent.status).toBe('refunded');

    // Vencimiento: suscripción eliminada en Stripe.
    liveSubs.set('sub_1', sub('sub_1', u.userId, 'canceled', now - 10));
    await post('/billing/webhooks/stripe', ev('customer.subscription.deleted', sub('sub_1', u.userId, 'canceled', now - 10), now + 40));
    me = (await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user;
    expect(me.plan).toBe('free');
  });
});

describe('RevenueCat (App Store / Google Play): webhooks verificados y restauración', () => {
  const rc = (event: any) => ({ api_version: '1.0', event: { id: `rc_${++evCounter}`, event_timestamp_ms: Date.now(), app_user_id: event.app_user_id, store: 'APP_STORE', product_id: 'premium_monthly', original_transaction_id: 'otx_1', transaction_id: `tx_${evCounter}`, price: 9.99, price_in_purchased_currency: 199, currency: 'MXN', expiration_at_ms: Date.now() + 30 * 86400_000, ...event } });
  it('rechaza sin autorización; compra inicial activa; renovación mantiene; billing issue; expiración desactiva; reembolso revoca', async () => {
    const u = await registerVerified(app, { email: 'ios@test.mx', gender: 'hombre', interestedIn: 'mujeres', name: 'Iosu' });
    const unauth = await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: { authorization: 'Bearer malo' }, payload: rc({ type: 'INITIAL_PURCHASE', app_user_id: u.userId }) });
    expect(unauth.statusCode).toBe(400);
    const H = { authorization: 'Bearer rc_test_secret' };
    const first = await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: rc({ type: 'INITIAL_PURCHASE', app_user_id: u.userId }) });
    expect(first.json().status).toBe('processed');
    expect((await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user.plan).toBe('premium');
    let ent = (await app.inject({ method: 'GET', url: '/billing/entitlement', headers: auth(u) })).json().entitlement;
    expect(ent.channel).toBe('apple'); expect(ent.manageUrl).toContain('apple.com');
    // Cancelar desde la web no aplica a compras de tienda: se explica.
    const c = await app.inject({ method: 'POST', url: '/billing/cancel', headers: auth(u) });
    expect(c.statusCode).toBe(400); expect(c.json().error.code).toBe('store_managed');
    // Duplicado por id de evento.
    const dupPayload = rc({ type: 'RENEWAL', app_user_id: u.userId }); 
    expect((await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: dupPayload })).json().status).toBe('processed');
    expect((await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: dupPayload })).json().status).toBe('duplicate');
    // Checkout web bloqueado mientras hay suscripción de tienda (sin dobles cobros entre canales).
    const co = await app.inject({ method: 'POST', url: '/billing/checkout', headers: auth(u), payload: { channel: 'stripe', currency: 'MXN' } });
    expect(co.statusCode).toBe(409);
    await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: rc({ type: 'BILLING_ISSUE', app_user_id: u.userId }) });
    ent = (await app.inject({ method: 'GET', url: '/billing/entitlement', headers: auth(u) })).json().entitlement;
    expect(ent.status).toBe('past_due');
    await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: rc({ type: 'EXPIRATION', app_user_id: u.userId, expiration_at_ms: Date.now() - 1000 }) });
    expect((await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user.plan).toBe('free');
    // Nueva compra y luego reembolso vía soporte de Apple.
    await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: rc({ type: 'INITIAL_PURCHASE', app_user_id: u.userId, original_transaction_id: 'otx_2' }) });
    expect((await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user.plan).toBe('premium');
    await app.inject({ method: 'POST', url: '/billing/webhooks/revenuecat', headers: H, payload: rc({ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: u.userId, original_transaction_id: 'otx_2' }) });
    expect((await app.inject({ method: 'GET', url: '/auth/me', headers: auth(u) })).json().user.plan).toBe('free');
    // Restaurar compras sin API key del servidor: respuesta honesta.
    const restore = await app.inject({ method: 'POST', url: '/billing/restore', headers: auth(u) });
    expect(restore.json().available).toBe(false);
    // El panel ve ingresos conciliados por canal.
    const adminU = await registerVerified(app, { email: 'admin-billing@test.mx', gender: 'otro', interestedIn: 'todas', name: 'Admin' });
    const { makeAdmin } = await import('./helpers.js'); await makeAdmin(app, adminU);
    const m = (await app.inject({ method: 'GET', url: '/admin/metrics', headers: auth(adminU) })).json();
    expect(m.revenueLast30d.find((r: any) => r.currency === 'MXN').charges).toBeGreaterThanOrEqual(2);
    const events = (await app.inject({ method: 'GET', url: '/admin/billing-events?status=error', headers: auth(adminU) })).json();
    expect(events.events.length).toBe(0);
  });
});

describe('Mercado Pago: firma x-signature', () => {
  it('valida HMAC según manifiesto documentado', async () => {
    const { verifyMercadoPagoSignature } = await import('../src/modules/billing/providers/mercadopago.js');
    const { createHmac } = await import('node:crypto');
    const ts = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac('sha256', 'secreto').update(`id:123;request-id:req-1;ts:${ts};`).digest('hex');
    expect(verifyMercadoPagoSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: 'req-1', dataId: '123', secret: 'secreto', toleranceSec: 600 })).toBe(true);
    expect(verifyMercadoPagoSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: 'req-2', dataId: '123', secret: 'secreto' })).toBe(false);
    // Sin credenciales, el webhook de MP responde error controlado (no activa nada).
    const r = await app.inject({ method: 'POST', url: '/billing/webhooks/mercadopago', payload: { type: 'payment', data: { id: '1' } } });
    expect([400, 503]).toContain(r.statusCode);
  });
});
