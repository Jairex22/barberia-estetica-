import { and, eq, or, sql, desc } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { subscriptions, billingEvents, paymentRecords, users } from '../../db/schema.js';
import type { PaymentProvider, NormalizedSubscription, NormalizedPayment, WebhookOutcome } from './providers/types.js';
import { stripeProvider } from './providers/stripe.js';
import { mercadoPagoProvider } from './providers/mercadopago.js';
import { parseRevenueCatWebhook, fetchRevenueCatSubscriber } from './providers/revenuecat.js';
import { computeEntitlement } from '../../plugins/context.js';
import { errors } from '../../services/errors.js';
import { config } from '../../config.js';
import { sendTemplate } from '../notifications/service.js';
import { audit } from '../../services/audit.js';
import type { PriceDisplay, Entitlement } from '@sobremesa/shared';
import { getSetting } from '../../services/settings.js';

export const providers: Record<'stripe' | 'mercadopago', PaymentProvider> = { stripe: stripeProvider, mercadopago: mercadoPagoProvider };

/** Precios que ve el usuario ANTES de pagar: moneda, importe final, periodicidad, renovación y cómo cancelar. */
export async function getPrices(db: Db, locale: 'es' | 'en'): Promise<PriceDisplay[]> {
  const mxn = await getSetting<number>(db, 'premium_price_mxn_minor');
  const usd = await getSetting<number>(db, 'premium_price_usd_minor');
  const out: PriceDisplay[] = [];
  for (const p of [stripeProvider, mercadoPagoProvider]) {
    out.push({ currency: 'MXN', amountMinor: mxn, interval: 'month', taxIncluded: true, renewsAutomatically: true, cancelInstructions: p.cancelInstructions(locale), channel: p.channel, available: p.configured(), unavailableReason: p.unavailableReason() });
  }
  out.push({ currency: 'USD', amountMinor: usd, interval: 'month', taxIncluded: false, renewsAutomatically: true, cancelInstructions: stripeProvider.cancelInstructions(locale), channel: 'stripe', available: stripeProvider.configured() && Boolean(config.STRIPE_PRICE_PREMIUM_USD), unavailableReason: stripeProvider.configured() && config.STRIPE_PRICE_PREMIUM_USD ? null : 'Precio en USD no configurado' });
  return out;
}

export async function getEntitlement(db: Db, userId: string): Promise<Entitlement> {
  const ent = await computeEntitlement(db, userId);
  let [sub] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due'), eq(subscriptions.status, 'pending')))).orderBy(desc(subscriptions.updatedAt)).limit(1);
  if (!sub) [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.updatedAt)).limit(1);
  let manageUrl: string | null = null;
  if (sub && (sub.channel === 'stripe' || sub.channel === 'mercadopago')) { try { manageUrl = await providers[sub.channel].manageUrl({ id: userId }, sub.providerCustomerId); } catch { manageUrl = null; } }
  if (sub?.channel === 'apple') manageUrl = 'https://apps.apple.com/account/subscriptions';
  if (sub?.channel === 'google') manageUrl = 'https://play.google.com/store/account/subscriptions';
  return { plan: ent.plan, premiumUntil: ent.premiumUntil, channel: sub?.channel ?? null, status: sub?.status ?? null, cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false, manageUrl };
}

/** Evita suscripciones duplicadas entre canales: si ya hay una vigente, no se abre otro checkout. */
export async function createCheckout(db: Db, user: { id: string; email: string; locale: string }, channel: 'stripe' | 'mercadopago', currency: 'MXN' | 'USD') {
  const provider = providers[channel];
  if (!provider.configured()) throw errors.unavailable(`${channel}_not_configured`, provider.unavailableReason() ?? 'Proveedor no disponible');
  const existing = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, user.id), or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due'), eq(subscriptions.status, 'pending')), sql`coalesce(${subscriptions.currentPeriodEnd}, now() + interval '1 day') > now()`)).limit(1);
  if (existing.length) throw errors.conflict('already_subscribed', `Ya tienes una suscripción ${existing[0]!.status === 'pending' ? 'pendiente de confirmación' : 'activa'} (${existing[0]!.channel}). Gestiónala desde Perfil → Suscripción para evitar un doble cobro.`);
  const res = await provider.createCheckout(user, currency);
  await audit(db, { actorId: user.id, action: 'billing.checkout_created', metadata: { channel, currency, ref: res.providerRef } });
  return res;
}

export async function parseWebhook(channel: 'stripe' | 'mercadopago' | 'revenuecat', rawBody: Buffer, headers: Record<string, string | string[] | undefined>, query?: Record<string, unknown>): Promise<WebhookOutcome> {
  if (channel === 'revenuecat') return parseRevenueCatWebhook(rawBody, headers);
  return providers[channel].parseWebhook(rawBody, headers, query);
}

/**
 * Procesa un webhook ya verificado de forma IDEMPOTENTE: el par (canal, id de evento) es único; un reenvío
 * devuelve 'duplicate' sin volver a aplicar nada. Eventos más antiguos que el último aplicado se ignoran.
 */
export async function processWebhook(db: Db, channelLabel: string, outcome: WebhookOutcome): Promise<'processed' | 'duplicate' | 'ignored' | 'error'> {
  const [inserted] = await db.insert(billingEvents).values({ channel: channelLabel, providerEventId: outcome.providerEventId, type: outcome.type, payload: outcome.payload as any, eventTime: outcome.eventTime }).onConflictDoNothing().returning({ id: billingEvents.id });
  if (!inserted) return 'duplicate';
  try {
    let did = false;
    if (outcome.subscription) { did = (await applySubscription(db, outcome.subscription)) || did; }
    if (outcome.payment) { did = (await recordPayment(db, outcome.payment)) || did; }
    const status = did ? 'processed' : 'ignored';
    await db.update(billingEvents).set({ status, processedAt: new Date().toISOString(), error: outcome.ignored ?? null }).where(eq(billingEvents.id, inserted.id));
    return status;
  } catch (e: any) {
    await db.update(billingEvents).set({ status: 'error', error: String(e?.message ?? e).slice(0, 500) }).where(eq(billingEvents.id, inserted.id));
    return 'error';
  }
}

export async function applySubscription(db: Db, n: NormalizedSubscription): Promise<boolean> {
  const [existing] = await db.select().from(subscriptions).where(and(eq(subscriptions.channel, n.channel), eq(subscriptions.providerSubscriptionId, n.providerSubscriptionId))).limit(1);
  // Evento desordenado: ya aplicamos uno más reciente.
  if (existing?.lastEventAt && new Date(n.eventTime).getTime() < new Date(existing.lastEventAt).getTime()) return false;
  const userId = n.userId ?? existing?.userId ?? null;
  if (!userId) return false;
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return false;
  const now = new Date().toISOString();
  const values = { userId, channel: n.channel, providerCustomerId: n.providerCustomerId ?? existing?.providerCustomerId ?? null, providerSubscriptionId: n.providerSubscriptionId, status: n.status, currentPeriodEnd: n.currentPeriodEnd ?? existing?.currentPeriodEnd ?? null, cancelAtPeriodEnd: n.cancelAtPeriodEnd, priceCurrency: n.priceCurrency ?? existing?.priceCurrency ?? null, priceAmountMinor: n.priceAmountMinor ?? existing?.priceAmountMinor ?? null, lastEventAt: n.eventTime, raw: n.raw as any, updatedAt: now };
  if (existing) await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
  else await db.insert(subscriptions).values(values);

  const prev = existing?.status; const prevCancel = existing?.cancelAtPeriodEnd ?? false;
  const manage = `${config.APP_ORIGIN}/perfil/suscripcion`;
  const until = n.currentPeriodEnd ? new Date(n.currentPeriodEnd).toLocaleDateString(u.locale === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'long' }) : '—';
  if (n.status === 'active' && prev !== 'active' && !(n.cancelAtPeriodEnd && prevCancel)) await sendTemplate(db, { userId, to: u.email, template: 'subscription_active', locale: u.locale, vars: { until, manage } });
  else if (n.status === 'active' && n.cancelAtPeriodEnd && !prevCancel) await sendTemplate(db, { userId, to: u.email, template: 'subscription_canceled', locale: u.locale, vars: { until } });
  else if (n.status === 'past_due' && prev !== 'past_due') await sendTemplate(db, { userId, to: u.email, template: 'payment_failed', locale: u.locale, vars: { manage } });
  else if (n.status === 'pending' && prev !== 'pending') await sendTemplate(db, { userId, to: u.email, template: 'subscription_pending', locale: u.locale, vars: {} });
  else if ((n.status === 'canceled' || n.status === 'expired' || n.status === 'refunded' || n.status === 'revoked') && prev !== n.status && prev === 'active') await sendTemplate(db, { userId, to: u.email, template: 'subscription_canceled', locale: u.locale, vars: { until } });
  await audit(db, { actorId: null, actorRole: 'system', action: 'billing.subscription_applied', targetType: 'user', targetId: userId, metadata: { channel: n.channel, status: n.status, until: n.currentPeriodEnd } });
  return true;
}

export async function recordPayment(db: Db, p: NormalizedPayment): Promise<boolean> {
  let userId = p.userId; let subscriptionId: string | null = null;
  if (p.providerSubscriptionId) {
    const [s] = await db.select().from(subscriptions).where(and(eq(subscriptions.channel, p.channel), eq(subscriptions.providerSubscriptionId, p.providerSubscriptionId))).limit(1);
    if (s) { subscriptionId = s.id; userId = userId ?? s.userId; }
  }
  if (!userId && (p.kind === 'refund' || p.kind === 'chargeback')) {
    const [orig] = await db.select().from(paymentRecords).where(and(eq(paymentRecords.channel, p.channel), eq(paymentRecords.providerPaymentId, p.providerPaymentId), eq(paymentRecords.kind, 'charge'))).limit(1);
    if (orig) { userId = orig.userId; subscriptionId = orig.subscriptionId; }
  }
  const [row] = await db.insert(paymentRecords).values({ userId, subscriptionId, channel: p.channel, providerPaymentId: p.providerPaymentId, kind: p.kind, amountMinor: p.amountMinor, currency: p.currency, feeMinor: p.feeMinor ?? null, occurredAt: p.occurredAt }).onConflictDoNothing().returning();
  if (row && (p.kind === 'refund' || p.kind === 'chargeback') && subscriptionId) {
    // Reembolso o contracargo: se revoca el acceso de inmediato.
    await db.update(subscriptions).set({ status: p.kind === 'refund' ? 'refunded' : 'revoked', currentPeriodEnd: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(subscriptions.id, subscriptionId));
  }
  return Boolean(row);
}

export async function cancelAtPeriodEnd(db: Db, userId: string) {
  const [sub] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due')))).limit(1);
  if (!sub) throw errors.notFound('No tienes una suscripción activa');
  if (sub.channel === 'apple' || sub.channel === 'google') throw errors.badRequest('store_managed', `Esta suscripción se compró en ${sub.channel === 'apple' ? 'App Store' : 'Google Play'}; cancélala desde los ajustes de suscripciones de la tienda. Te mostramos el enlace en Perfil → Suscripción.`);
  await providers[sub.channel as 'stripe' | 'mercadopago'].cancelAtPeriodEnd(sub.providerSubscriptionId!);
  await db.update(subscriptions).set({ cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() }).where(eq(subscriptions.id, sub.id));
  await audit(db, { actorId: userId, action: 'billing.cancel_requested', metadata: { channel: sub.channel } });
  return { premiumUntil: sub.currentPeriodEnd };
}

export async function cancelWebSubscriptionForUser(db: Db, userId: string) {
  const subs = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due'), eq(subscriptions.status, 'pending'))));
  for (const s of subs) {
    if (s.channel === 'stripe' || s.channel === 'mercadopago') {
      if (providers[s.channel].configured() && s.providerSubscriptionId) await providers[s.channel].cancelAtPeriodEnd(s.providerSubscriptionId);
      await db.update(subscriptions).set({ cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() }).where(eq(subscriptions.id, s.id));
    }
  }
}

/** Restaurar compras: consulta RevenueCat (si hay API key) y aplica el estado real. Nunca confía en el cliente. */
export async function restoreStorePurchases(db: Db, userId: string) {
  const subs = await fetchRevenueCatSubscriber(userId);
  if (subs === null) return { restored: 0, available: false, reason: 'RevenueCat no configurado en el servidor' };
  let n = 0;
  for (const s of subs) if (await applySubscription(db, s)) n++;
  return { restored: n, available: true, reason: null };
}

/** Conciliación periódica: expira periodos vencidos y refresca con el proveedor las suscripciones web. */
export async function reconcile(db: Db) {
  const now = new Date().toISOString();
  const expired = await db.update(subscriptions).set({ status: 'expired', updatedAt: now })
    .where(and(or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due')), sql`${subscriptions.currentPeriodEnd} < now() - interval '3 days'`)).returning({ id: subscriptions.id });
  let refreshed = 0;
  for (const ch of ['stripe', 'mercadopago'] as const) {
    if (!providers[ch].configured()) continue;
    const rows = await db.select().from(subscriptions).where(and(eq(subscriptions.channel, ch), or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'past_due'), eq(subscriptions.status, 'pending')))).limit(200);
    for (const r of rows) {
      const live = r.providerSubscriptionId ? await providers[ch].fetchSubscription(r.providerSubscriptionId) : null;
      if (live && (await applySubscription(db, { ...live, userId: live.userId ?? r.userId }))) refreshed++;
    }
  }
  return { expired: expired.length, refreshed };
}
