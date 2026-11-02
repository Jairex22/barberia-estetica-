import { config } from '../../../config.js';
import type { WebhookOutcome, NormalizedSubscription } from './types.js';
import { errors } from '../../../services/errors.js';
import { safeEqual } from '../../../services/crypto.js';

/**
 * RevenueCat unifica App Store (StoreKit 2) y Google Play Billing. El app móvil compra con react-native-purchases
 * usando app_user_id = id de usuario de Sobremesa; RevenueCat valida el recibo con la tienda y nos manda webhooks.
 * Nunca activamos Premium por lo que diga el cliente: solo por este webhook (o por consulta a la API de RevenueCat).
 */
export function channelFromStore(store: string): 'apple' | 'google' | null {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'apple';
  if (store === 'PLAY_STORE') return 'google';
  return null;
}

export function normalizeRevenueCatEvent(ev: any): { subscription: NormalizedSubscription | null; payment: WebhookOutcome['payment']; ignored?: string } {
  const channel = channelFromStore(ev.store);
  if (!channel) return { subscription: null, payment: null, ignored: `store ${ev.store} no soportada` };
  const eventTime = new Date(ev.event_timestamp_ms ?? Date.now()).toISOString();
  const expires = ev.expiration_at_ms ? new Date(ev.expiration_at_ms).toISOString() : null;
  const subId = ev.original_transaction_id ?? ev.transaction_id ?? `${ev.app_user_id}:${ev.product_id}`;
  const userId = ev.app_user_id && !String(ev.app_user_id).startsWith('$RCAnonymousID') ? String(ev.app_user_id) : null;
  const base = { channel, providerSubscriptionId: String(subId), userId, currentPeriodEnd: expires, eventTime, priceCurrency: ev.currency ?? null, priceAmountMinor: ev.price_in_purchased_currency != null ? Math.round(ev.price_in_purchased_currency * 100) : null, raw: { type: ev.type, product: ev.product_id } };
  const payment = ev.price != null && ev.price > 0 && ['INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE'].includes(ev.type)
    ? { channel, providerPaymentId: String(ev.transaction_id ?? ev.id), providerSubscriptionId: String(subId), userId, kind: 'charge' as const, amountMinor: Math.round((ev.price_in_purchased_currency ?? ev.price) * 100), currency: ev.currency ?? 'USD', occurredAt: eventTime }
    : null;
  switch (ev.type) {
    case 'INITIAL_PURCHASE': case 'RENEWAL': case 'UNCANCELLATION': case 'PRODUCT_CHANGE':
      return { subscription: { ...base, status: 'active', cancelAtPeriodEnd: false }, payment };
    case 'CANCELLATION':
      // CANCELLATION con cancel_reason REFUND / CUSTOMER_SUPPORT = reembolso (acceso revocado); UNSUBSCRIBE = sigue activo hasta expirar.
      if (ev.cancel_reason === 'CUSTOMER_SUPPORT' || ev.cancel_reason === 'REFUND' || (ev.expiration_at_ms && ev.expiration_at_ms <= Date.now())) {
        return { subscription: { ...base, status: 'refunded', currentPeriodEnd: eventTime, cancelAtPeriodEnd: true }, payment: { channel, providerPaymentId: String(ev.transaction_id ?? ev.id), providerSubscriptionId: String(subId), userId, kind: 'refund', amountMinor: Math.round(Math.abs(ev.price_in_purchased_currency ?? ev.price ?? 0) * 100), currency: ev.currency ?? 'USD', occurredAt: eventTime } };
      }
      return { subscription: { ...base, status: 'active', cancelAtPeriodEnd: true }, payment: null };
    case 'BILLING_ISSUE':
      return { subscription: { ...base, status: 'past_due', cancelAtPeriodEnd: false }, payment: null };
    case 'EXPIRATION':
      return { subscription: { ...base, status: 'expired', currentPeriodEnd: expires ?? eventTime, cancelAtPeriodEnd: true }, payment: null };
    case 'SUBSCRIPTION_PAUSED':
      return { subscription: { ...base, status: 'canceled', cancelAtPeriodEnd: true }, payment: null };
    case 'TRANSFER': case 'SUBSCRIBER_ALIAS': case 'TEST': case 'TEMPORARY_ENTITLEMENT_GRANT': case 'INVOICE_ISSUANCE':
      return { subscription: null, payment: null, ignored: `evento ${ev.type}` };
    default:
      return { subscription: null, payment: null, ignored: `tipo ${ev.type} no manejado` };
  }
}

export async function parseRevenueCatWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<WebhookOutcome> {
  if (!config.REVENUECAT_WEBHOOK_SECRET) throw errors.unavailable('revenuecat_not_configured', 'Falta REVENUECAT_WEBHOOK_SECRET');
  const auth = headers['authorization'];
  if (!auth || Array.isArray(auth) || !safeEqual(auth.replace(/^Bearer\s+/i, ''), config.REVENUECAT_WEBHOOK_SECRET)) throw errors.badRequest('bad_signature', 'Autorización inválida');
  const body = JSON.parse(rawBody.toString('utf8'));
  const ev = body.event;
  if (!ev?.id) throw errors.badRequest('bad_event', 'Evento sin id');
  const n = normalizeRevenueCatEvent(ev);
  return { providerEventId: String(ev.id), type: String(ev.type), eventTime: new Date(ev.event_timestamp_ms ?? Date.now()).toISOString(), payload: body, subscription: n.subscription, payment: n.payment, ignored: n.ignored };
}

/** Verificación directa con RevenueCat (si hay API key): fuente de verdad para restaurar compras y conciliar. */
export async function fetchRevenueCatSubscriber(appUserId: string): Promise<NormalizedSubscription[] | null> {
  if (!config.REVENUECAT_SECRET_API_KEY) return null;
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, { headers: { Authorization: `Bearer ${config.REVENUECAT_SECRET_API_KEY}` }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const subs = data?.subscriber?.subscriptions ?? {};
  const out: NormalizedSubscription[] = [];
  for (const [productId, s] of Object.entries<any>(subs)) {
    const channel = channelFromStore(s.store?.toUpperCase?.() === 'APP_STORE' ? 'APP_STORE' : s.store === 'play_store' ? 'PLAY_STORE' : s.store === 'app_store' ? 'APP_STORE' : String(s.store).toUpperCase());
    if (!channel) continue;
    const expires = s.expires_date ? new Date(s.expires_date).toISOString() : null;
    const active = expires ? new Date(expires).getTime() > Date.now() : false;
    out.push({ channel, providerSubscriptionId: s.original_purchase_date ? `${appUserId}:${productId}` : `${appUserId}:${productId}`, userId: appUserId, status: s.refunded_at ? 'refunded' : active ? (s.billing_issues_detected_at ? 'past_due' : 'active') : 'expired', currentPeriodEnd: expires, cancelAtPeriodEnd: Boolean(s.unsubscribe_detected_at), eventTime: new Date().toISOString() });
  }
  return out;
}
