import { createHmac } from 'node:crypto';
import { config } from '../../../config.js';
import type { PaymentProvider, WebhookOutcome, NormalizedSubscription } from './types.js';
import { errors } from '../../../services/errors.js';
import { safeEqual } from '../../../services/crypto.js';

/**
 * Mercado Pago (Suscripciones / preapproval). ESTADO: implementado según documentación pública,
 * NO probado en sandbox en este entorno (sin credenciales). Permanece deshabilitado hasta configurar
 * MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET y ejecutar las pruebas descritas en docs/pagos.md.
 * Nota: en MP las suscripciones recurrentes solo admiten tarjeta; OXXO/SPEI son pago único (prepago), no recurrente.
 */
const API = 'https://api.mercadopago.com';

/** Validación de firma x-signature (HMAC-SHA256 sobre "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"). */
export function verifyMercadoPagoSignature(params: { xSignature: string; xRequestId: string; dataId: string; secret: string; toleranceSec?: number }): boolean {
  const parts = Object.fromEntries(params.xSignature.split(',').map((kv) => kv.trim().split('=') as [string, string]));
  const ts = parts['ts']; const v1 = parts['v1'];
  if (!ts || !v1) return false;
  if (params.toleranceSec && Math.abs(Date.now() / 1000 - Number(ts)) > params.toleranceSec) return false;
  const manifest = `id:${params.dataId};request-id:${params.xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', params.secret).update(manifest).digest('hex');
  return safeEqual(expected, v1);
}

function mapStatus(s: string): NormalizedSubscription['status'] {
  switch (s) { case 'authorized': return 'active'; case 'pending': return 'pending'; case 'paused': return 'past_due'; case 'cancelled': return 'canceled'; default: return 'incomplete'; }
}

async function mpFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${config.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw errors.unavailable('mp_error', `Mercado Pago ${res.status}`);
  return res.json() as Promise<any>;
}

export const mercadoPagoProvider: PaymentProvider = {
  channel: 'mercadopago',
  configured: () => Boolean(config.MP_ACCESS_TOKEN && config.MP_WEBHOOK_SECRET),
  unavailableReason: () => (mercadoPagoProvider.configured() ? null : 'Mercado Pago diseñado pero no habilitado: faltan credenciales y pruebas en sandbox'),
  cancelInstructions: (l) => (l === 'es' ? 'Cancela desde Perfil → Suscripción o desde tu cuenta de Mercado Pago. Conservas Premium hasta el fin del periodo pagado.' : 'Cancel from Profile → Subscription or from your Mercado Pago account. You keep Premium until the end of the paid period.'),
  async createCheckout(user, currency) {
    if (currency !== 'MXN') throw errors.badRequest('currency', 'Mercado Pago México solo opera en MXN');
    const body = {
      reason: 'Sobremesa Premium (mensual)', external_reference: user.id, payer_email: user.email,
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: config.MP_PREMIUM_AMOUNT_MXN, currency_id: 'MXN' },
      back_url: `${config.APP_ORIGIN}/premium/resultado?estado=pendiente&canal=mercadopago`, status: 'pending',
    };
    const pre = await mpFetch('/preapproval', { method: 'POST', body: JSON.stringify(body), headers: { 'X-Idempotency-Key': `pre:${user.id}:${Math.floor(Date.now() / 60_000)}` } });
    return { url: pre.init_point, providerRef: pre.id };
  },
  async parseWebhook(rawBody, headers, query): Promise<WebhookOutcome> {
    const xSig = headers['x-signature']; const xReq = headers['x-request-id'];
    const body = JSON.parse(rawBody.toString('utf8') || '{}');
    const dataId = String((query as any)?.['data.id'] ?? body?.data?.id ?? '');
    if (!xSig || Array.isArray(xSig) || !xReq || Array.isArray(xReq) || !dataId) throw errors.badRequest('bad_signature', 'Faltan cabeceras de firma');
    if (!verifyMercadoPagoSignature({ xSignature: xSig, xRequestId: xReq, dataId, secret: config.MP_WEBHOOK_SECRET!, toleranceSec: 600 })) throw errors.badRequest('bad_signature', 'Firma inválida');
    const type = String(body.type ?? body.topic ?? 'unknown');
    const eventId = String(body.id ?? `${type}:${dataId}:${body.date_created ?? ''}`);
    const base = { providerEventId: eventId, type, eventTime: body.date_created ?? new Date().toISOString(), payload: body };
    if (type === 'subscription_preapproval') {
      const pre = await mpFetch(`/preapproval/${dataId}`);
      return { ...base, subscription: { channel: 'mercadopago', providerSubscriptionId: pre.id, providerCustomerId: pre.payer_id ? String(pre.payer_id) : null, userId: pre.external_reference ?? null, status: mapStatus(pre.status), currentPeriodEnd: pre.next_payment_date ?? null, cancelAtPeriodEnd: pre.status === 'cancelled', priceCurrency: 'MXN', priceAmountMinor: Math.round((pre.auto_recurring?.transaction_amount ?? 0) * 100), eventTime: base.eventTime } };
    }
    if (type === 'subscription_authorized_payment' || type === 'payment') {
      const pay = await mpFetch(`/v1/payments/${dataId}`).catch(() => null);
      if (!pay) return { ...base, ignored: 'pago no recuperable' };
      const kind = pay.status === 'refunded' ? 'refund' : pay.status === 'charged_back' ? 'chargeback' : pay.status === 'approved' ? 'charge' : null;
      if (!kind) return { ...base, ignored: `estado de pago ${pay.status}` };
      return { ...base, payment: { channel: 'mercadopago', providerPaymentId: String(pay.id), providerSubscriptionId: pay.metadata?.preapproval_id ?? null, userId: pay.external_reference ?? null, kind, amountMinor: Math.round((pay.transaction_amount ?? 0) * 100), currency: pay.currency_id ?? 'MXN', occurredAt: pay.date_approved ?? base.eventTime } };
    }
    return { ...base, ignored: 'tipo no manejado' };
  },
  async cancelAtPeriodEnd(id) { await mpFetch(`/preapproval/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) }); },
  async manageUrl() { return 'https://www.mercadopago.com.mx/subscriptions'; },
  async fetchSubscription(id) {
    try { const pre = await mpFetch(`/preapproval/${id}`); return { channel: 'mercadopago', providerSubscriptionId: pre.id, userId: pre.external_reference ?? null, status: mapStatus(pre.status), currentPeriodEnd: pre.next_payment_date ?? null, cancelAtPeriodEnd: pre.status === 'cancelled', eventTime: new Date().toISOString() }; } catch { return null; }
  },
};
