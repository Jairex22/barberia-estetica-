import type { FastifyInstance } from 'fastify';
import { assistantMessageSchema } from '@sobremesa/shared';
import { parse } from '../../plugins/validation.js';
import * as svc from './service.js';
import { searchKnowledge } from './knowledge.js';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

export async function assistantRoutes(app: FastifyInstance) {
  app.post('/chat', { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } }, async (req) => {
    const input = parse(assistantMessageSchema, req.body);
    const locale = req.user?.locale ?? input.locale;
    return svc.chat(app.db, { userId: req.user?.id ?? null, conversationId: input.conversationId, message: input.message, locale });
  });
  /** FAQ pública (sin IA): artículos publicados, para cuando el asistente no está disponible. */
  app.get('/faq', async (req) => {
    const { locale, q } = parse(z.object({ locale: z.enum(['es', 'en']).default('es'), q: z.string().max(200).optional() }), req.query);
    if (q) return { articles: await searchKnowledge(app.db, q, locale, 10) };
    const rows = await app.db.execute(sql`SELECT DISTINCT ON (slug) id, slug, title, body, version, tags FROM knowledge_articles WHERE status='published' AND locale=${locale} ORDER BY slug, version DESC`);
    return { articles: rows };
  });
}
