import { and, eq, sql, isNull, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { profiles, users, swipes, matches, conversations, blocks } from '../../db/schema.js';
import { LIMITS, wantsGender, ageFromBirthdate, type PublicProfile } from '@sobremesa/shared';
import { errors } from '../../services/errors.js';
import { getPublicProfile } from '../profiles/service.js';
import { config } from '../../config.js';
import type { RealtimeBus } from '../../services/realtime.js';
import { sendTemplate } from '../notifications/service.js';
import { audit } from '../../services/audit.js';

type Plan = 'free' | 'premium';

/**
 * Candidatos para `me`. Reglas duras (todas en SQL):
 *  - activos, correo verificado, perfil completo, no demo fuera de modo demo, no yo;
 *  - sin swipe previo mío (salvo deshecho), sin bloqueo en cualquier dirección, sin match activo;
 *  - preferencia de género MUTUA, edad dentro de las preferencias de AMBOS;
 *  - distancia dentro de MI preferencia cuando ambos tienen ubicación aproximada;
 *  - perfiles en modo privado (incógnito) solo se muestran a quien ellos ya dieron like.
 * Orden: intereses compartidos, misma intención, actividad reciente. Explicable, no "compatibilidad científica".
 */
export async function discover(db: Db, me: { id: string; plan: Plan }, filters: { limit: number; intent?: string; interest?: string; verifiedOnly?: boolean }) {
  const [mine] = await db.select({ p: profiles, u: users }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(eq(profiles.userId, me.id)).limit(1);
  if (!mine) throw errors.notFound('Perfil no encontrado');
  if (!mine.u.emailVerifiedAt) throw errors.forbidden('Verifica tu correo para descubrir personas');
  if (!mine.p.completedAt) throw errors.forbidden('Completa tu perfil (bio, intención, 2 intereses y una foto) para descubrir personas');
  const usesExtended = Boolean(filters.intent || filters.interest || filters.verifiedOnly);
  if (usesExtended && me.plan !== 'premium') throw errors.forbidden('Los filtros adicionales son parte de Premium');

  const myAge = ageFromBirthdate(mine.u.birthdate);
  const genderClause =
    mine.p.interestedIn === 'todas' ? sql`true` : mine.p.interestedIn === 'mujeres' ? sql`p.gender = 'mujer'` : sql`p.gender = 'hombre'`;
  const theirWantMe = sql`(p.interested_in = 'todas' OR (p.interested_in = 'mujeres' AND ${mine.p.gender} = 'mujer') OR (p.interested_in = 'hombres' AND ${mine.p.gender} = 'hombre'))`;
  const hasGeo = mine.p.latCoarse != null && mine.p.lngCoarse != null;
  const distanceClause = hasGeo
    ? sql`(p.lat_coarse IS NULL OR p.lng_coarse IS NULL OR (
        6371 * 2 * asin(sqrt(power(sin(radians(p.lat_coarse - ${mine.p.latCoarse}) / 2), 2)
        + cos(radians(${mine.p.latCoarse})) * cos(radians(p.lat_coarse)) * power(sin(radians(p.lng_coarse - ${mine.p.lngCoarse}) / 2), 2)))
        <= ${mine.p.prefMaxDistanceKm}))`
    : sql`true`;
  const demoClause = config.DEMO_MODE ? sql`true` : sql`u.is_demo = false`;
  const intentClause = filters.intent ? sql`p.intent = ${filters.intent}` : sql`true`;
  const interestClause = filters.interest ? sql`${filters.interest} = ANY(p.interests)` : sql`true`;
  const verifiedClause = filters.verifiedOnly ? sql`p.verified_at IS NOT NULL` : sql`true`;

  const rows = await db.execute(sql`
    SELECT u.id,
      cardinality(ARRAY(SELECT unnest(p.interests) INTERSECT SELECT unnest(${'{' + mine.p.interests.join(',') + '}'}::text[]))) AS shared,
      (p.intent = ${mine.p.intent ?? ''}) AS same_intent
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE u.id <> ${me.id}
      AND u.status = 'active' AND u.email_verified_at IS NOT NULL AND p.completed_at IS NOT NULL
      AND ${demoClause}
      AND ${genderClause} AND ${theirWantMe}
      AND date_part('year', age(u.birthdate)) BETWEEN ${mine.p.prefAgeMin} AND ${mine.p.prefAgeMax}
      AND ${myAge} BETWEEN p.pref_age_min AND p.pref_age_max
      AND ${distanceClause} AND ${intentClause} AND ${interestClause} AND ${verifiedClause}
      AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.actor_id = ${me.id} AND s.target_id = u.id AND s.undone_at IS NULL)
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ${me.id} AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ${me.id}))
      AND NOT EXISTS (SELECT 1 FROM matches m WHERE m.ended_at IS NULL AND ((m.user_a = ${me.id} AND m.user_b = u.id) OR (m.user_a = u.id AND m.user_b = ${me.id})))
      AND (p.incognito = false OR EXISTS (SELECT 1 FROM swipes s2 WHERE s2.actor_id = u.id AND s2.target_id = ${me.id} AND s2.action = 'like' AND s2.undone_at IS NULL))
      AND EXISTS (SELECT 1 FROM photos ph WHERE ph.user_id = u.id AND ph.status = 'approved')
    ORDER BY shared DESC, same_intent DESC, u.last_active_at DESC NULLS LAST, random()
    LIMIT ${filters.limit}
  `);
  const out: PublicProfile[] = [];
  for (const r of rows as unknown as Array<{ id: string }>) {
    try { out.push(await getPublicProfile(db, me.id, r.id, { requireNotBlocked: false })); } catch { /* perfil cambió entre consultas */ }
  }
  return out;
}

export async function likesUsedToday(db: Db, userId: string) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(swipes)
    .where(and(eq(swipes.actorId, userId), eq(swipes.action, 'like'), isNull(swipes.undoneAt), sql`${swipes.createdAt} > now() - interval '1 day'`));
  return n;
}

export async function swipe(db: Db, bus: RealtimeBus | null, me: { id: string; plan: Plan; email: string; locale: string }, targetId: string, action: 'like' | 'pass') {
  if (targetId === me.id) throw errors.badRequest('self', 'No puedes interactuar contigo');
  const limits = LIMITS[me.plan];
  let remaining: number | null = null;
  if (action === 'like') {
    const used = await likesUsedToday(db, me.id);
    if (used >= limits.likesPerDay) throw new (errors.tooMany().constructor as any)(429, 'like_limit', `Llegaste al límite diario de ${limits.likesPerDay} likes. Mañana se renueva.`);
    remaining = limits.likesPerDay - used - 1;
  }
  // Target válido y visible (mismas reglas duras).
  const [t] = await db.select({ u: users, p: profiles }).from(users).innerJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, targetId)).limit(1);
  if (!t || t.u.status !== 'active' || (!config.DEMO_MODE && t.u.isDemo)) throw errors.notFound('Perfil no disponible');
  const blocked = await db.select().from(blocks).where(sql`(${blocks.blockerId} = ${me.id} AND ${blocks.blockedId} = ${targetId}) OR (${blocks.blockerId} = ${targetId} AND ${blocks.blockedId} = ${me.id})`).limit(1);
  if (blocked.length) throw errors.notFound('Perfil no disponible');

  await db.insert(swipes).values({ actorId: me.id, targetId, action })
    .onConflictDoUpdate({ target: [swipes.actorId, swipes.targetId], set: { action, createdAt: new Date().toISOString(), undoneAt: null } });

  if (action === 'pass') return { matched: false, matchId: null, conversationId: null, remainingLikes: remaining };

  const [reciprocal] = await db.select().from(swipes).where(and(eq(swipes.actorId, targetId), eq(swipes.targetId, me.id), eq(swipes.action, 'like'), isNull(swipes.undoneAt))).limit(1);
  if (!reciprocal) return { matched: false, matchId: null, conversationId: null, remainingLikes: remaining };

  const [a, b] = [me.id, targetId].sort() as [string, string];
  const created = await db.transaction(async (tx) => {
    const [m] = await tx.insert(matches).values({ userA: a, userB: b }).onConflictDoNothing().returning();
    if (!m) {
      const [existing] = await tx.select().from(matches).where(and(eq(matches.userA, a), eq(matches.userB, b))).limit(1);
      if (existing && existing.endedAt) {
        await tx.update(matches).set({ endedAt: null, endedBy: null, endedReason: null, createdAt: new Date().toISOString() }).where(eq(matches.id, existing.id));
      }
      const [c] = await tx.select().from(conversations).where(eq(conversations.matchId, existing!.id)).limit(1);
      return { match: existing!, conversation: c!, isNew: false };
    }
    const [c] = await tx.insert(conversations).values({ matchId: m.id }).returning();
    return { match: m, conversation: c!, isNew: true };
  });
  if (created.isNew || true) {
    await bus?.publish([me.id, targetId], { type: 'match.new', matchId: created.match.id, conversationId: created.conversation.id });
    await sendTemplate(db, { userId: targetId, to: t.u.email, template: 'new_match', locale: t.u.locale, vars: {} });
    await audit(db, { actorId: me.id, action: 'match.created', targetType: 'match', targetId: created.match.id });
  }
  return { matched: true, matchId: created.match.id, conversationId: created.conversation.id, remainingLikes: remaining };
}

/** Deshacer el último descarte (Premium). Solo 'pass' recientes, límite diario. */
export async function rewind(db: Db, me: { id: string; plan: Plan }) {
  const limits = LIMITS[me.plan];
  if (limits.rewindsPerDay === 0) throw errors.forbidden('Deshacer descartes es parte de Premium');
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(swipes).where(and(eq(swipes.actorId, me.id), sql`${swipes.undoneAt} > now() - interval '1 day'`));
  if (n >= limits.rewindsPerDay) throw errors.tooMany(`Límite diario de ${limits.rewindsPerDay} deshacer alcanzado`);
  const [last] = await db.select().from(swipes).where(and(eq(swipes.actorId, me.id), eq(swipes.action, 'pass'), isNull(swipes.undoneAt), sql`${swipes.createdAt} > now() - interval '1 day'`)).orderBy(sql`${swipes.createdAt} desc`).limit(1);
  if (!last) throw errors.notFound('No hay descartes recientes que deshacer');
  await db.update(swipes).set({ undoneAt: new Date().toISOString() }).where(eq(swipes.id, last.id));
  return { restoredTargetId: last.targetId };
}

/** Likes recibidos REALES (sin match aún). Gratis: solo el número verdadero. Premium: quiénes. */
export async function likesReceived(db: Db, me: { id: string; plan: Plan }) {
  const rows = await db.execute(sql`
    SELECT s.actor_id AS id, s.created_at
    FROM swipes s JOIN users u ON u.id = s.actor_id JOIN profiles p ON p.user_id = u.id
    WHERE s.target_id = ${me.id} AND s.action = 'like' AND s.undone_at IS NULL AND u.status = 'active'
      AND ${config.DEMO_MODE ? sql`true` : sql`u.is_demo = false`}
      AND NOT EXISTS (SELECT 1 FROM swipes mine WHERE mine.actor_id = ${me.id} AND mine.target_id = s.actor_id AND mine.undone_at IS NULL)
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ${me.id} AND b.blocked_id = s.actor_id) OR (b.blocker_id = s.actor_id AND b.blocked_id = ${me.id}))
    ORDER BY s.created_at DESC LIMIT 100`);
  const list = rows as unknown as Array<{ id: string }>;
  if (me.plan !== 'premium') return { count: list.length, profiles: null as PublicProfile[] | null, premiumRequired: true };
  const profilesOut: PublicProfile[] = [];
  for (const r of list) { try { profilesOut.push(await getPublicProfile(db, me.id, r.id)); } catch { /* no disponible */ } }
  return { count: list.length, profiles: profilesOut, premiumRequired: false };
}
