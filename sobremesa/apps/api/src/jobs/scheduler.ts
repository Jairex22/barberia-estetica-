import type { FastifyInstance } from 'fastify';
import { sql, eq, and, lt } from 'drizzle-orm';
import { jobRuns, sessions, emailTokens, dataExports, users, conversationReads, messages, conversations, matches } from '../db/schema.js';
import { reconcile } from '../modules/billing/service.js';
import { purgeDeletedUsers } from '../modules/account/service.js';
import { sendTemplate } from '../modules/notifications/service.js';
import { getStorage } from '../services/storage.js';

export const JOB_NAMES = ['expire_sessions_and_tokens', 'reconcile_billing', 'purge_deleted_accounts', 'unread_digest', 'cleanup_exports'] as const;
export type JobName = (typeof JOB_NAMES)[number];

const INTERVALS: Record<JobName, number> = {
  expire_sessions_and_tokens: 60 * 60_000, reconcile_billing: 60 * 60_000, purge_deleted_accounts: 24 * 60 * 60_000, unread_digest: 24 * 60 * 60_000, cleanup_exports: 24 * 60 * 60_000,
};

export async function runJob(app: FastifyInstance, name: JobName): Promise<{ ok: boolean; detail: string }> {
  const [run] = await app.db.insert(jobRuns).values({ name }).returning();
  try {
    let detail = '';
    switch (name) {
      case 'expire_sessions_and_tokens': {
        const s = await app.db.delete(sessions).where(sql`${sessions.expiresAt} < now() - interval '7 days' OR ${sessions.revokedAt} < now() - interval '7 days'`).returning({ id: sessions.id });
        const t = await app.db.delete(emailTokens).where(sql`${emailTokens.expiresAt} < now() - interval '1 day'`).returning({ id: emailTokens.id });
        detail = `sesiones=${s.length} tokens=${t.length}`; break;
      }
      case 'reconcile_billing': { const r = await reconcile(app.db); detail = JSON.stringify(r); break; }
      case 'purge_deleted_accounts': { const n = await purgeDeletedUsers(app.db); detail = `purgados=${n}`; break; }
      case 'unread_digest': {
        // Resumen diario de no leídos (categoría producto: respeta preferencias y horas tranquilas). Solo si hay mensajes REALES sin leer.
        const rows = await app.db.execute(sql`
          SELECT u.id, u.email, u.locale, count(m.id)::int AS unread
          FROM users u JOIN matches mt ON (mt.user_a = u.id OR mt.user_b = u.id) AND mt.ended_at IS NULL
          JOIN conversations c ON c.match_id = mt.id JOIN messages m ON m.conversation_id = c.id AND m.sender_id <> u.id AND m.created_at > now() - interval '1 day'
          LEFT JOIN conversation_reads r ON r.conversation_id = c.id AND r.user_id = u.id
          WHERE u.status = 'active' AND m.seq > coalesce(r.last_read_seq, 0) AND (u.last_active_at IS NULL OR u.last_active_at < now() - interval '12 hours')
          GROUP BY u.id`);
        let sent = 0;
        for (const r of rows as unknown as Array<{ id: string; email: string; locale: string; unread: number }>) if (await sendTemplate(app.db, { userId: r.id, to: r.email, template: 'new_message_digest', locale: r.locale, vars: { count: String(r.unread) } })) sent++;
        detail = `candidatos=${(rows as any[]).length} enviados=${sent}`; break;
      }
      case 'cleanup_exports': {
        const due = await app.db.select().from(dataExports).where(and(eq(dataExports.status, 'ready'), lt(dataExports.expiresAt, new Date().toISOString())));
        for (const d of due) { if (d.storageKey) await getStorage().delete(d.storageKey).catch(() => {}); await app.db.update(dataExports).set({ status: 'expired' }).where(eq(dataExports.id, d.id)); }
        detail = `expirados=${due.length}`; break;
      }
    }
    await app.db.update(jobRuns).set({ finishedAt: new Date().toISOString(), ok: true, detail }).where(eq(jobRuns.id, run!.id));
    return { ok: true, detail };
  } catch (e: any) {
    await app.db.update(jobRuns).set({ finishedAt: new Date().toISOString(), ok: false, detail: String(e?.message ?? e).slice(0, 500) }).where(eq(jobRuns.id, run!.id));
    app.log.error({ err: e, job: name }, 'job falló');
    return { ok: false, detail: String(e?.message ?? e) };
  }
}

/** Planificador en proceso (una instancia). Para varias instancias, ejecutar `pnpm jobs:run <nombre>` desde un cron externo. */
export function startJobs(app: FastifyInstance) {
  const timers = (Object.keys(INTERVALS) as JobName[]).map((name) => setInterval(() => { runJob(app, name).catch(() => {}); }, INTERVALS[name]));
  const kick = setTimeout(() => { runJob(app, 'expire_sessions_and_tokens').catch(() => {}); }, 30_000);
  return () => { timers.forEach(clearInterval); clearTimeout(kick); };
}
