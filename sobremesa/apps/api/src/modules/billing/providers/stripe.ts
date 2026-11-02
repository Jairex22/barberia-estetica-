import Stripe from 'stripe';
import { config } from '../../../config.js';
import type { PaymentProvider, NormalizedSubscription, WebhookOutcome } from './types.js';
import { errors } from '../../../services/errors.js';

let client: Stripe | null = null;
/** Permite inyectar un cliente falso en pruebas. */
export function setStripeClient(c: Stripe | null) { client = c; }
function stripe(): Stripe {
  if (client) return client;
  if (!config.STRIPE_SECRET_KEY) throw errors.unavailable('stripe_not_configured', 'Stripe no está configurado');
  client = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2026-10-29.clover' as any, timeout: 15_000, maxNetworkRetries: 2 });
  return client;
}

function mapStatus(s: Stripe.Subscription.Status): NormalizedSubscription['status'] {
  switch (s) {
    case 'active': case 'trialing': return 'active';
    case 'past_due': case 'unpaid': return 'past_due';
    case 'canceled': return 'canceled';
    case 'incomplete': return 'incomplete';
    case 'incomplete_expired': return 'expired';
    case 'paused': return 'canceled';
    default: return 'incomplete';
  }
}
function periodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as any;
  const ts: number | undefined = item?.current_period_end ?? (sub as any).current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}
export function normalizeStripeSubscription(sub: Stripe.Subscription, eventTime: string): NormalizedSubscription {
  const item = sub.items?.data?.[0];
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
  return {
    channel: 'stripe', providerSubscriptionId: sub.id, providerCustomerId: customer,
    userId: (sub.metadata?.userId as string | undefined) ?? null,
    status: mapStatus(sub.status), currentPeriodEnd: periodEnd(sub), cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at),
    priceCurrency: item?.price?.currency?.toUpperCase() ?? null, priceAmountMinor: item?.price?.unit_amount ?? null, eventTime, raw: { id: sub.id, status: sub.status },
  };
}

export const stripeProvider: PaymentProvider = {
  channel: 'stripe',
  configured: () => Boolean(client || (config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET && (config.STRIPE_PRICE_PREMIUM_MXN || config.STRIPE_PRICE_PREMIUM_USD))),
  unavailableReason: () => (stripeProvider.configured() ? null : 'Pago con tarjeta (Stripe) aún no configurado en este entorno'),
  cancelInstructions: (l) => (l === 'es' ? 'Cancela cuando quieras desde Perfil → Suscripción → Gestionar. Conservas Premium hasta el fin del periodo pagado; no hay cargos posteriores.' : 'Cancel anytime from Profile → Subscription → Manage. You keep Premium until the end of the paid period; no further charges.'),
  async createCheckout(user, currency) {
    const price = currency === 'MXN' ? config.STRIPE_PRICE_PREMIUM_MXN : config.STRIPE_PRICE_PREMIUM_USD;
    if (!price) throw errors.unavailable('price_missing', `No hay precio configurado en ${currency}`);
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription', line_items: [{ price, quantity: 1 }], customer_email: user.email, client_reference_id: user.id,
      metadata: { userId: user.id }, subscription_data: { metadata: { userId: user.id } },
      success_url: `${config.APP_ORIGIN}/premium/resultado?estado=pendiente&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.APP_ORIGIN}/premium?cancelado=1`,
      locale: user.locale === 'en' ? 'en' : 'es-419', allow_promotion_codes: false,
      automatic_tax: { enabled: false },
    }, { idempotencyKey: `checkout:${user.id}:${currency}:${Math.floor(Date.now() / 60_000)}` });
    if (!session.url) throw errors.unavailable('checkout_failed', 'No se pudo crear la sesión de pago');
    return { url: session.url, providerRef: session.id };
  },
  async parseWebhook(rawBody, headers): Promise<WebhookOutcome> {
    const sig = headers['stripe-signature'];
    if (!sig || Array.isArray(sig)) throw errors.badRequest('bad_signature', 'Falta la firma');
    if (!config.STRIPE_WEBHOOK_SECRET) throw errors.unavailable('stripe_not_configured', 'Falta STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    try { event = Stripe.webhooks.constructEvent(rawBody, sig, config.STRIPE_WEBHOOK_SECRET); }
    catch (e: any) { throw errors.badRequest('bad_signature', `Firma inválida: ${e.message}`); }
    const eventTime = new Date(event.created * 1000).toISOString();
    const base = { providerEventId: event.id, type: event.type, eventTime, payload: event };
    const obj = event.data.object as any;
    switch (event.type) {
      case 'checkout.session.completed': case 'checkout.session.async_payment_succeeded': {
        if (obj.mode !== 'subscription' || !obj.subscription) return { ...base, ignored: 'no es suscripción' };
        const subId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription.id;
        const live = await stripeProvider.fetchSubscription(subId);
        return { ...base, subscription: live ? { ...live, userId: live.userId ?? obj.client_reference_id ?? null } : null };
      }
      case 'customer.subscription.created': case 'customer.subscription.updated': case 'customer.subscription.deleted':
      case 'customer.subscription.paused': case 'customer.subscription.resumed': {
        // Eventos pueden llegar desordenados: preferimos el estado vivo del proveedor; si no, el del evento.
        const live = await stripeProvider.fetchSubscription(obj.id);
        return { ...base, subscription: live ?? normalizeStripeSubscription(obj as Stripe.Subscription, eventTime) };
      }
      case 'invoice.paid': case 'invoice.payment_succeeded': {
        const subId = extractInvoiceSub(obj);
        const live = subId ? await stripeProvider.fetchSubscription(subId) : null;
        const paymentId: string | undefined = obj.payment_intent ? (typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent.id) : obj.id;
        return { ...base, subscription: live, payment: obj.amount_paid > 0 && paymentId ? { channel: 'stripe', providerPaymentId: paymentId, providerSubscriptionId: subId, userId: live?.userId ?? null, kind: 'charge', amountMinor: obj.amount_paid, currency: String(obj.currency).toUpperCase(), occurredAt: eventTime } : null };
      }
      case 'invoice.payment_failed': {
        const subId = extractInvoiceSub(obj);
        const live = subId ? await stripeProvider.fetchSubscription(subId) : null;
        return { ...base, subscription: live ?? (subId ? { channel: 'stripe', providerSubscriptionId: subId, userId: null, status: 'past_due', currentPeriodEnd: null, cancelAtPeriodEnd: false, eventTime } : null) };
      }
      case 'charge.refunded': {
        const amount = obj.amount_refunded ?? 0;
        return { ...base, payment: amount > 0 ? { channel: 'stripe', providerPaymentId: obj.payment_intent ?? obj.id, providerSubscriptionId: null, userId: null, kind: 'refund', amountMinor: amount, currency: String(obj.currency).toUpperCase(), occurredAt: eventTime } : null };
      }
      case 'charge.dispute.created': {
        return { ...base, payment: { channel: 'stripe', providerPaymentId: obj.payment_intent ?? obj.charge ?? obj.id, providerSubscriptionId: null, userId: null, kind: 'chargeback', amountMinor: obj.amount, currency: String(obj.currency).toUpperCase(), occurredAt: eventTime } };
      }
      default: return { ...base, ignored: 'tipo no manejado' };
    }
  },
  async cancelAtPeriodEnd(id) { await stripe().subscriptions.update(id, { cancel_at_period_end: true }); },
  async manageUrl(_user, customerId) {
    if (!customerId) return null;
    const session = await stripe().billingPortal.sessions.create({ customer: customerId, return_url: `${config.APP_ORIGIN}/perfil/suscripcion` });
    return session.url;
  },
  async fetchSubscription(id) {
    try { const sub = await stripe().subscriptions.retrieve(id); return normalizeStripeSubscription(sub, new Date().toISOString()); }
    catch { return null; }
  },
};
function extractInvoiceSub(inv: any): string | null {
  const s = inv.subscription ?? inv.parent?.subscription_details?.subscription ?? inv.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ?? null;
  return typeof s === 'string' ? s : s?.id ?? null;
}
