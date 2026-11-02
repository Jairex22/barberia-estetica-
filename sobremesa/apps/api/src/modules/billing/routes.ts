import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from '../../plugins/validation.js';
import { requireUser } from '../../plugins/context.js';
import * as svc from './service.js';
import { AppError } from '../../services/errors.js';

export async function billingRoutes(app: FastifyInstance) {
  app.get('/prices', async (req) => ({ prices: await svc.getPrices(app.db, req.user?.locale ?? 'es'), premiumBenefits: PREMIUM_BENEFITS }));
  app.get('/entitlement', async (req) => { const u = requireUser(req); return { entitlement: await svc.getEntitlement(app.db, u.id) }; });
  app.post('/checkout', { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } }, async (req) => {
    const u = requireUser(req);
    if (!u.emailVerifiedAt) throw new AppError(403, 'email_not_verified', 'Verifica tu correo antes de suscribirte');
    const { channel, currency } = parse(z.object({ channel: z.enum(['stripe', 'mercadopago']), currency: z.enum(['MXN', 'USD']).default('MXN') }), req.body);
    return svc.createCheckout(app.db, { id: u.id, email: u.email, locale: u.locale }, channel, currency);
  });
  app.post('/cancel', async (req) => { const u = requireUser(req); return svc.cancelAtPeriodEnd(app.db, u.id); });
  app.post('/restore', { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } }, async (req) => { const u = requireUser(req); return svc.restoreStorePurchases(app.db, u.id); });

  // Webhooks: firma obligatoria; respuesta 2xx solo cuando el evento quedó registrado.
  for (const ch of ['stripe', 'mercadopago', 'revenuecat'] as const) {
    app.post(`/webhooks/${ch}`, { config: { rateLimit: false } }, async (req, reply) => {
      const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
      const outcome = await svc.parseWebhook(ch, raw, req.headers as any, req.query as any);
      const status = await svc.processWebhook(app.db, ch === 'revenuecat' ? 'revenuecat' : ch, outcome);
      if (status === 'error') return reply.status(500).send({ received: true, status }); // el proveedor reintentará
      return { received: true, status };
    });
  }
}

export const PREMIUM_BENEFITS = [
  { key: 'likes', es: 'Ver quién te dio like (solo likes reales; si no hay, verás cero)', en: 'See who liked you (real likes only)' },
  { key: 'filters', es: 'Filtros adicionales: intención, intereses y perfiles verificados', en: 'Extra filters: intent, interests, verified profiles' },
  { key: 'rewind', es: 'Deshacer descartes (hasta 10 al día)', en: 'Undo passes (up to 10 per day)' },
  { key: 'incognito', es: 'Navegación privada: solo te ven las personas a las que diste like', en: 'Private browsing: only people you liked can see you' },
  { key: 'limits', es: 'Más likes diarios (100) y más conversaciones nuevas por día (25)', en: 'More daily likes (100) and new conversations per day (25)' },
  { key: 'never', es: 'Premium NO cambia la regla de quién inicia, no garantiza respuestas ni citas, y no desbloquea mensajes ocultos (no existen).', en: 'Premium does NOT change who starts, does not guarantee replies or dates, and unlocks no hidden messages (there are none).' },
];
