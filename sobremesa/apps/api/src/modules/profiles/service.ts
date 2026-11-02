import { and, eq, asc, inArray } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { profiles, photos, users, blocks } from '../../db/schema.js';
import { coarsenCoordinate, ageFromBirthdate, approxDistanceKm, distanceBucket, sharedSignals, type ProfileUpdateInput, type PublicProfile } from '@sobremesa/shared';
import { errors } from '../../services/errors.js';
import { getStorage } from '../../services/storage.js';
import { processProfilePhoto, signMediaUrl } from '../../services/media.js';
import { randomToken } from '../../services/crypto.js';
import { moderateImage } from '../../services/moderation.js';

export async function getOwnProfile(db: Db, userId: string) {
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!p) throw errors.notFound('Perfil no encontrado');
  const ph = await db.select().from(photos).where(eq(photos.userId, userId)).orderBy(asc(photos.position));
  const [u] = await db.select({ birthdate: users.birthdate }).from(users).where(eq(users.id, userId)).limit(1);
  const { latCoarse, lngCoarse, ...rest } = p;
  return {
    ...rest,
    hasLocation: latCoarse != null && lngCoarse != null,
    age: u ? ageFromBirthdate(u.birthdate) : null,
    photos: ph.map((x) => ({ id: x.id, url: signMediaUrl(x.storageKey, userId), position: x.position, status: x.status, moderationNotes: x.moderationNotes })),
  };
}

export async function updateProfile(db: Db, userId: string, input: ProfileUpdateInput) {
  const { location, ...fields } = input;
  const patch: Partial<typeof profiles.$inferInsert> = { ...fields, updatedAt: new Date().toISOString() };
  if (location) { patch.latCoarse = coarsenCoordinate(location.lat); patch.lngCoarse = coarsenCoordinate(location.lng); }
  if (input.prefAgeMin && input.prefAgeMax && input.prefAgeMin > input.prefAgeMax) throw errors.badRequest('validation', 'El rango de edad es inválido');
  await db.update(profiles).set(patch).where(eq(profiles.userId, userId));
  await recomputeCompleteness(db, userId);
  return getOwnProfile(db, userId);
}

/** Perfil completo = nombre, bio ≥ 20 caracteres, intención, ≥ 2 intereses y ≥ 1 foto aprobada o pendiente. */
export async function recomputeCompleteness(db: Db, userId: string) {
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!p) return;
  const ph = await db.select({ id: photos.id }).from(photos).where(and(eq(photos.userId, userId), inArray(photos.status, ['approved', 'pending'])));
  const complete = p.displayName.length >= 2 && p.bio.length >= 20 && !!p.intent && p.interests.length >= 2 && ph.length >= 1;
  await db.update(profiles).set({ completedAt: complete ? (p.completedAt ?? new Date().toISOString()) : null }).where(eq(profiles.userId, userId));
}

export async function addPhoto(db: Db, userId: string, file: Buffer) {
  const count = await db.select({ id: photos.id }).from(photos).where(eq(photos.userId, userId));
  if (count.length >= 6) throw errors.badRequest('too_many_photos', 'Máximo 6 fotos');
  const processed = await processProfilePhoto(file); // elimina EXIF/GPS
  const key = `photos/${userId}/${randomToken(12)}.webp`;
  await getStorage().put(key, processed.data, 'image/webp');
  const verdict = await moderateImage(processed.data);
  const [row] = await db.insert(photos).values({
    userId, storageKey: key, position: count.length, width: processed.width, height: processed.height,
    status: verdict.decision === 'reject' ? 'rejected' : 'pending', moderationNotes: verdict.notes ?? null,
  }).returning();
  await recomputeCompleteness(db, userId);
  return { id: row!.id, url: signMediaUrl(key, userId), position: row!.position, status: row!.status };
}

export async function deletePhoto(db: Db, userId: string, photoId: string) {
  const [ph] = await db.select().from(photos).where(and(eq(photos.id, photoId), eq(photos.userId, userId))).limit(1);
  if (!ph) throw errors.notFound('Foto no encontrada');
  await getStorage().delete(ph.storageKey);
  await db.delete(photos).where(eq(photos.id, ph.id));
  await recomputeCompleteness(db, userId);
}

export async function reorderPhotos(db: Db, userId: string, ids: string[]) {
  const mine = await db.select({ id: photos.id }).from(photos).where(eq(photos.userId, userId));
  const set = new Set(mine.map((m) => m.id));
  if (ids.length !== set.size || !ids.every((id) => set.has(id))) throw errors.badRequest('validation', 'Lista de fotos inválida');
  for (let i = 0; i < ids.length; i++) await db.update(photos).set({ position: i }).where(eq(photos.id, ids[i]!));
}

/** Vista pública de un perfil para `viewerId`, con señales explicables y distancia solo por rango. */
export async function getPublicProfile(db: Db, viewerId: string, targetId: string, opts: { requireNotBlocked?: boolean } = {}): Promise<PublicProfile> {
  const [row] = await db.select({ p: profiles, u: users }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(eq(profiles.userId, targetId)).limit(1);
  if (!row || row.u.status === 'deleted' || row.u.status === 'suspended') throw errors.notFound('Perfil no disponible');
  if (opts.requireNotBlocked !== false) {
    const b = await db.select().from(blocks).where(and(inArray(blocks.blockerId, [viewerId, targetId]), inArray(blocks.blockedId, [viewerId, targetId]))).limit(1);
    if (b.length) throw errors.notFound('Perfil no disponible');
  }
  const [me] = await db.select().from(profiles).where(eq(profiles.userId, viewerId)).limit(1);
  const ph = await db.select().from(photos).where(and(eq(photos.userId, targetId), eq(photos.status, 'approved'))).orderBy(asc(photos.position));
  let bucket: PublicProfile['distanceBucket'] = null;
  if (row.p.showDistance && me?.latCoarse != null && me.lngCoarse != null && row.p.latCoarse != null && row.p.lngCoarse != null) {
    bucket = distanceBucket(approxDistanceKm(me.latCoarse, me.lngCoarse, row.p.latCoarse, row.p.lngCoarse));
  }
  return {
    id: row.u.id, displayName: row.p.displayName, age: row.p.showAge ? ageFromBirthdate(row.u.birthdate) : null, bio: row.p.bio,
    gender: row.p.gender, intent: (row.p.intent as any) ?? null, interests: row.p.interests, planTypes: row.p.planTypes, idealPlan: row.p.idealPlan,
    occupation: row.p.occupation, city: row.p.city, distanceBucket: bucket,
    photos: ph.map((x) => ({ id: x.id, url: signMediaUrl(x.storageKey, viewerId), position: x.position, status: x.status })),
    verified: Boolean(row.p.verifiedAt), isDemo: row.u.isDemo,
    signals: me ? sharedSignals({ interests: me.interests, intent: me.intent ?? '', planTypes: me.planTypes }, { interests: row.p.interests, intent: row.p.intent ?? '', planTypes: row.p.planTypes }) : undefined,
  };
}

export async function setIncognito(db: Db, userId: string, enabled: boolean) {
  await db.update(profiles).set({ incognito: enabled, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, userId));
}
