import { sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';

export type KbHit = { id: string; slug: string; title: string; body: string; version: number; locale: string; rank: number };

/**
 * Búsqueda sobre la base de conocimiento PUBLICADA (última versión por slug/idioma).
 * Texto completo (tsvector) + similitud trigram como respaldo para errores de tecleo.
 * Pendiente (documentado): embeddings para búsqueda semántica cuando exista proveedor de embeddings.
 */
export async function searchKnowledge(db: Db, query: string, locale: 'es' | 'en', limit = 4): Promise<KbHit[]> {
  const dict = locale === 'en' ? 'english' : 'spanish';
  const q = query.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().slice(0, 200);
  if (!q) return [];
  const rows = await db.execute(sql`
    WITH latest AS (
      SELECT DISTINCT ON (slug, locale) * FROM knowledge_articles
      WHERE status = 'published' AND locale = ${locale}
      ORDER BY slug, locale, version DESC
    )
    SELECT id, slug, title, body, version, locale,
      ts_rank(to_tsvector(${sql.raw(`'${dict}'`)}, title || ' ' || body), websearch_to_tsquery(${sql.raw(`'${dict}'`)}, ${q})) * 2
      + similarity(title, ${q}) + similarity(left(body, 500), ${q}) * 0.5 AS rank
    FROM latest
    WHERE to_tsvector(${sql.raw(`'${dict}'`)}, title || ' ' || body) @@ websearch_to_tsquery(${sql.raw(`'${dict}'`)}, ${q})
       OR similarity(title, ${q}) > 0.2 OR (title || ' ' || body) % ${q}
    ORDER BY rank DESC LIMIT ${limit}`);
  return rows as unknown as KbHit[];
}
