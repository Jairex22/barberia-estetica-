import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { blocks, reports, appeals, users, verificationRequests, swipes } from '../../db/schema.js';
import { errors } from '../../services/errors.js';
import { endMatchesBetween } from '../matches/service.js';
import type { RealtimeBus } from '../../services/realtime.js';
import { audit } from '../../services/audit.js';
import { getStorage } from '../../services/storage.js';
import { processProfilePhoto } from '../../services/media.js';
import { randomToken } from '../../services/crypto.js';

/** Bloquear: termina matches, oculta en Descubrir en ambas direcciones y persiste hasta que se desbloquee. */
export async function block(db: Db, bus: RealtimeBus | null, me: string, target: string) {
  if (me === target) throw errors.badRequest('self', 'No puedes bloquearte');
  await db.insert(blocks).values({ blockerId: me, blockedId: target }).onConflictDoNothing();
  await endMatchesBetween(db, bus, me, target, 'blocked');
  await db.update(swipes).set({ undoneAt: new Date().toISOString() }).where(and(eq(swipes.actorId, target), eq(swipes.targetId, me)));
  await audit(db, { actorId: me, action: 'safety.block', targetType: 'user', targetId: target });
}
export async function unblock(db: Db, me: string, target: string) {
  await db.delete(blocks).where(and(eq(blocks.blockerId, me), eq(blocks.blockedId, target)));
  await audit(db, { actorId: me, action: 'safety.unblock', targetType: 'user', targetId: target });
}
export async function listBlocks(db: Db, me: string) {
  return db.select({ blockedId: blocks.blockedId, createdAt: blocks.createdAt }).from(blocks).where(eq(blocks.blockerId, me));
}
export async function report(db: Db, bus: RealtimeBus | null, me: string, input: { targetUserId: string; reason: string; details?: string; conversationId?: string; alsoBlock?: boolean }) {
  if (me === input.targetUserId) throw errors.badRequest('self', 'No puedes reportarte');
  const [t] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.targetUserId)).limit(1);
  if (!t) throw errors.notFound('Usuario no encontrado');
  const [r] = await db.insert(reports).values({ reporterId: me, targetId: input.targetUserId, reason: input.reason, details: input.details ?? null, conversationId: input.conversationId ?? null }).returning();
  if (input.alsoBlock !== false) await block(db, bus, me, input.targetUserId);
  await audit(db, { actorId: me, action: 'safety.report', targetType: 'user', targetId: input.targetUserId, metadata: { reason: input.reason, reportId: r!.id } });
  return r!;
}
export async function appeal(db: Db, me: string, subject: string, body: string) {
  const [a] = await db.insert(appeals).values({ userId: me, subject, body }).returning();
  return a!;
}
/** Verificación por selfie con pose: se pide una pose aleatoria; un moderador compara con las fotos del perfil. */
export function newPoseCode() { const poses = ['mano_en_la_barbilla', 'pulgar_arriba', 'dos_dedos', 'mano_en_el_hombro', 'saludo_con_la_mano']; return poses[Math.floor(Math.random() * poses.length)]!; }
export async function submitSelfieVerification(db: Db, me: string, poseCode: string, file: Buffer) {
  const pending = await db.select().from(verificationRequests).where(and(eq(verificationRequests.userId, me), eq(verificationRequests.status, 'pending'))).limit(1);
  if (pending.length) throw errors.conflict('pending', 'Ya tienes una verificación en revisión');
  const processed = await processProfilePhoto(file);
  const key = `verification/${me}/${randomToken(10)}.webp`;
  await getStorage().put(key, processed.data, 'image/webp');
  const [row] = await db.insert(verificationRequests).values({ userId: me, kind: 'selfie_pose', storageKey: key, poseCode }).returning();
  return row!;
}
export async function myVerification(db: Db, me: string) {
  const rows = await db.select({ id: verificationRequests.id, status: verificationRequests.status, kind: verificationRequests.kind, createdAt: verificationRequests.createdAt, notes: verificationRequests.notes }).from(verificationRequests).where(eq(verificationRequests.userId, me));
  return rows;
}
