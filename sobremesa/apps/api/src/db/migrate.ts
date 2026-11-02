import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb } from './client.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function runMigrations(url?: string) {
  const { db, sql } = createDb(url);
  const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');
  await migrate(db, { migrationsFolder: folder });
  // Índices de búsqueda de texto que drizzle-kit no modela directamente.
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  await sql`CREATE INDEX IF NOT EXISTS kb_fts_es_idx ON knowledge_articles USING gin (to_tsvector('spanish', title || ' ' || body))`;
  await sql`CREATE INDEX IF NOT EXISTS kb_fts_en_idx ON knowledge_articles USING gin (to_tsvector('english', title || ' ' || body))`;
  await sql.end();
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => { console.log('Migraciones aplicadas'); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}
