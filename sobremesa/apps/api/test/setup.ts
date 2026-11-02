import { beforeAll } from 'vitest';
import { runMigrations } from '../src/db/migrate.js';
import postgres from 'postgres';

beforeAll(async () => {
  const url = process.env.DATABASE_URL!;
  await runMigrations(url);
  const sql = postgres(url, { max: 1 });
  await sql`TRUNCATE users, billing_events, payment_records, knowledge_articles, assistant_conversations, audit_log, settings, job_runs, waitlist RESTART IDENTITY CASCADE`;
  await sql.end();
});
