import type { Db } from '../db/client.js';
import { auditLog } from '../db/schema.js';

/** Bitácora de acciones sensibles. Nunca guardar secretos, tokens ni contraseñas aquí. */
export async function audit(db: Db, entry: { actorId?: string | null; actorRole?: string | null; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown>; ip?: string | null }) {
  await db.insert(auditLog).values({
    actorId: entry.actorId ?? null, actorRole: entry.actorRole ?? null, action: entry.action,
    targetType: entry.targetType ?? null, targetId: entry.targetId ?? null, metadata: entry.metadata ?? null, ip: entry.ip ?? null,
  });
}
