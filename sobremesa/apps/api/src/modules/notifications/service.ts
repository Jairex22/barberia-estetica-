import { eq, and, gte, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { notificationPrefs, outboundMessages, users } from '../../db/schema.js';
import { getEmailProvider } from '../../services/email.js';
import { BRAND } from '@sobremesa/shared';
import { config } from '../../config.js';

type Template = 'verify_email' | 'reset_password' | 'delete_confirm' | 'welcome' | 'new_match' | 'new_message_digest' | 'subscription_active' | 'payment_failed' | 'subscription_canceled' | 'subscription_pending' | 'account_deleted' | 'promo_event';

const CATEGORY: Record<Template, 'transactional' | 'product' | 'promotional'> = {
  verify_email: 'transactional', reset_password: 'transactional', delete_confirm: 'transactional', welcome: 'transactional',
  subscription_active: 'transactional', payment_failed: 'transactional', subscription_canceled: 'transactional', subscription_pending: 'transactional', account_deleted: 'transactional',
  new_match: 'product', new_message_digest: 'product', promo_event: 'promotional',
};

/** Todos los correos se identifican como mensajes automáticos del sistema de Sobremesa; nunca simulan ser una persona. */
function render(template: Template, locale: string, vars: Record<string, string>, unsubscribeLink: string | null) {
  const es = locale !== 'en';
  const footer = es
    ? `\n\n—\nEste es un mensaje automático del sistema de ${BRAND.name}. Nadie te está escribiendo personalmente desde esta dirección.${unsubscribeLink ? `\nGestionar o cancelar comunicaciones: ${unsubscribeLink}` : ''}`
    : `\n\n—\nThis is an automated system message from ${BRAND.name}. No person is writing to you from this address.${unsubscribeLink ? `\nManage or stop communications: ${unsubscribeLink}` : ''}`;
  const t: Record<Template, { subject: string; text: string }> = {
    verify_email: { subject: es ? `Confirma tu correo en ${BRAND.name}` : `Confirm your email at ${BRAND.name}`, text: es ? `Hola. Para activar tu cuenta confirma tu correo aquí (válido 24 h):\n${vars.link}` : `Hi. Confirm your email here (valid 24h):\n${vars.link}` },
    reset_password: { subject: es ? 'Restablecer contraseña' : 'Reset your password', text: es ? `Recibimos una solicitud para restablecer tu contraseña. Enlace válido 30 minutos:\n${vars.link}\nSi no fuiste tú, ignora este mensaje.` : `We received a request to reset your password. Link valid 30 minutes:\n${vars.link}\nIf this wasn't you, ignore this message.` },
    delete_confirm: { subject: es ? 'Confirma la eliminación de tu cuenta' : 'Confirm account deletion', text: es ? `Para confirmar la eliminación de tu cuenta entra aquí (30 min):\n${vars.link}` : `Confirm account deletion here (30 min):\n${vars.link}` },
    welcome: { subject: es ? `Bienvenida/o a ${BRAND.name}` : `Welcome to ${BRAND.name}`, text: es ? `Tu correo quedó verificado. Completa tu perfil con fotos reales y el plan que te gustaría hacer; así te mostramos personas afines cerca de ti. Recuerda: en ${BRAND.name} no hay perfiles inventados.` : `Your email is verified. Complete your profile with real photos and the plan you'd like to do.` },
    new_match: { subject: es ? 'Tienes una nueva conexión' : 'You have a new connection', text: es ? `Alguien y tú se gustaron mutuamente. Entra a la app para ver quién es.` : `You and someone liked each other. Open the app to see who.` },
    new_message_digest: { subject: es ? 'Tienes mensajes sin leer' : 'You have unread messages', text: es ? `Tienes ${vars.count} mensajes sin leer en ${BRAND.name}.` : `You have ${vars.count} unread messages at ${BRAND.name}.` },
    subscription_active: { subject: es ? 'Tu Premium está activo' : 'Your Premium is active', text: es ? `Tu suscripción Premium está activa hasta ${vars.until}. Se renueva automáticamente salvo que la canceles desde Perfil → Suscripción (${vars.manage}).` : `Your Premium subscription is active until ${vars.until}. It renews automatically unless you cancel from Profile → Subscription (${vars.manage}).` },
    subscription_pending: { subject: es ? 'Pago pendiente de confirmación' : 'Payment pending', text: es ? `Recibimos tu intento de pago; Premium se activará cuando el proveedor lo confirme. Si no se confirma, no se te cobrará.` : `We received your payment attempt; Premium will activate when the provider confirms it.` },
    payment_failed: { subject: es ? 'No pudimos procesar tu pago' : 'We could not process your payment', text: es ? `El cobro de tu Premium falló. Puedes actualizar tu método de pago aquí: ${vars.manage}. Si no se resuelve, Premium terminará al final del periodo pagado.` : `Your Premium charge failed. Update your payment method here: ${vars.manage}.` },
    subscription_canceled: { subject: es ? 'Tu Premium no se renovará' : 'Your Premium will not renew', text: es ? `Tu suscripción quedó cancelada. Conservas Premium hasta ${vars.until}; después tu cuenta pasa a Gratis sin perder tus conexiones ni mensajes.` : `Your subscription is canceled. You keep Premium until ${vars.until}.` },
    account_deleted: { subject: es ? 'Tu cuenta fue eliminada' : 'Your account was deleted', text: es ? `Tu cuenta de ${BRAND.name} fue eliminada. Los datos se borran definitivamente en ${config.DELETED_ACCOUNT_RETENTION_DAYS} días (incluidos respaldos en su ciclo). Si tienes una suscripción comprada en App Store o Google Play, cancélala también en la tienda: nosotros no podemos hacerlo por ti.` : `Your ${BRAND.name} account was deleted. Data is purged in ${config.DELETED_ACCOUNT_RETENTION_DAYS} days. If you subscribed via App Store or Google Play, cancel it in the store too.` },
    promo_event: { subject: vars.subject ?? 'Novedades', text: vars.body ?? '' },
  };
  const r = t[template];
  return { subject: r.subject, text: r.text + footer };
}

/**
 * Envío con reglas: transaccional siempre; producto respeta preferencias y horas tranquilas;
 * promocional requiere opt-in explícito, frecuencia máxima y enlace de baja.
 */
export async function sendTemplate(db: Db, p: { userId: string | null; to: string; template: Template; locale: string; vars: Record<string, string> }) {
  const category = CATEGORY[p.template];
  let prefs = p.userId ? (await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, p.userId)).limit(1))[0] : undefined;
  const unsubscribeLink = prefs ? `${config.APP_ORIGIN}/comunicaciones?token=${prefs.unsubscribeToken}` : null;

  if (category !== 'transactional' && p.userId) {
    if (!prefs) return skip(db, p, category, 'sin preferencias');
    const hour = new Date().getUTCHours() - 6; // CDMX/GDL (UTC-6, sin horario de verano desde 2022)
    const h = (hour + 24) % 24;
    const quiet = prefs.quietStartHour > prefs.quietEndHour ? (h >= prefs.quietStartHour || h < prefs.quietEndHour) : (h >= prefs.quietStartHour && h < prefs.quietEndHour);
    if (category === 'product' && !prefs.emailProduct) return skip(db, p, category, 'opt-out producto');
    if (category === 'promotional') {
      if (!prefs.emailMarketing) return skip(db, p, category, 'sin opt-in promocional');
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(outboundMessages)
        .where(and(eq(outboundMessages.userId, p.userId), eq(outboundMessages.category, 'promotional'), eq(outboundMessages.status, 'sent'), gte(outboundMessages.createdAt, weekAgo)));
      if (n >= prefs.maxPromoPerWeek) return skip(db, p, category, 'frecuencia máxima semanal');
    }
    if (quiet) return skip(db, p, category, 'horas tranquilas');
  }
  const msg = render(p.template, p.locale, p.vars, category === 'transactional' ? null : unsubscribeLink);
  const res = await getEmailProvider().send({ to: p.to, subject: msg.subject, text: msg.text, category });
  await db.insert(outboundMessages).values({ userId: p.userId, channel: 'email', template: p.template, category, status: res.ok ? 'sent' : 'failed', detail: res.ok ? res.id ?? null : res.error ?? null });
  return res.ok;
}
async function skip(db: Db, p: { userId: string | null; template: Template }, category: 'product' | 'promotional', reason: string) {
  await db.insert(outboundMessages).values({ userId: p.userId, channel: 'email', template: p.template, category, status: 'skipped', detail: reason });
  return false;
}

export async function getPrefs(db: Db, userId: string) {
  const [p] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).limit(1);
  return p ?? null;
}
export async function updatePrefs(db: Db, userId: string, patch: Partial<typeof notificationPrefs.$inferInsert>) {
  await db.update(notificationPrefs).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(notificationPrefs.userId, userId));
  return getPrefs(db, userId);
}
export async function unsubscribeByToken(db: Db, token: string) {
  const [p] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.unsubscribeToken, token)).limit(1);
  if (!p) return false;
  await db.update(notificationPrefs).set({ emailMarketing: false, updatedAt: new Date().toISOString() }).where(eq(notificationPrefs.userId, p.userId));
  await db.update(users).set({ marketingOptIn: false }).where(eq(users.id, p.userId));
  return true;
}
