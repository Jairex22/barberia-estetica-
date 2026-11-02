import { and, eq, isNull, gt } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { users, profiles, sessions, emailTokens, notificationPrefs } from '../../db/schema.js';
import { hashPassword, verifyPassword, randomToken, sha256 } from '../../services/crypto.js';
import { errors } from '../../services/errors.js';
import { isAdult, BRAND, type RegisterInput } from '@sobremesa/shared';
import { config } from '../../config.js';
import { sendTemplate } from '../notifications/service.js';
import { audit } from '../../services/audit.js';
import { getSetting } from '../../services/settings.js';

export async function register(db: Db, input: RegisterInput, ip?: string | null) {
  if (!(await getSetting<boolean>(db, 'registration_open'))) throw errors.unavailable('registration_closed', 'El registro está cerrado por ahora. Únete a la lista de espera.');
  if (!isAdult(input.birthdate, BRAND.minAge)) {
    // No revelamos detalles; registramos el intento sin datos personales.
    throw errors.badRequest('underage', 'Sobremesa es solo para mayores de 18 años.');
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing.length) throw errors.conflict('email_taken', 'Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión o recuperar el acceso?');
  const passwordHash = await hashPassword(input.password);
  const [user] = await db.insert(users).values({
    email: input.email, passwordHash, birthdate: input.birthdate, locale: input.locale, marketingOptIn: input.marketingOptIn,
    isDemo: config.DEMO_MODE,
  }).returning();
  await db.insert(profiles).values({ userId: user!.id, displayName: input.displayName, gender: input.gender, interestedIn: input.interestedIn });
  await db.insert(notificationPrefs).values({ userId: user!.id, unsubscribeToken: randomToken(24), emailMarketing: input.marketingOptIn });
  await issueEmailToken(db, user!.id, 'verify', input.email, input.locale);
  await audit(db, { actorId: user!.id, action: 'auth.register', ip, metadata: { consent: { terms: true, privacy: true, adult: true, marketing: input.marketingOptIn } } });
  return user!;
}

export async function issueEmailToken(db: Db, userId: string, kind: 'verify' | 'reset' | 'delete_confirm', email: string, locale: string) {
  const token = randomToken(32);
  const ttlMin = kind === 'verify' ? 60 * 24 : 30;
  await db.insert(emailTokens).values({ userId, kind, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMin * 60_000).toISOString() });
  const path = kind === 'verify' ? 'verificar-correo' : kind === 'reset' ? 'restablecer' : 'eliminar-cuenta';
  const link = `${config.APP_ORIGIN}/${path}?token=${token}`;
  await sendTemplate(db, { userId, to: email, template: kind === 'verify' ? 'verify_email' : kind === 'reset' ? 'reset_password' : 'delete_confirm', locale, vars: { link } });
  return token;
}

export async function consumeEmailToken(db: Db, token: string, kind: 'verify' | 'reset' | 'delete_confirm') {
  const now = new Date().toISOString();
  const [row] = await db.select().from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, sha256(token)), eq(emailTokens.kind, kind), isNull(emailTokens.usedAt), gt(emailTokens.expiresAt, now))).limit(1);
  if (!row) throw errors.badRequest('invalid_token', 'El enlace no es válido o ya expiró. Solicita uno nuevo.');
  await db.update(emailTokens).set({ usedAt: now }).where(eq(emailTokens.id, row.id));
  return row;
}

export async function verifyEmail(db: Db, token: string) {
  const row = await consumeEmailToken(db, token, 'verify');
  const now = new Date().toISOString();
  await db.update(users).set({ emailVerifiedAt: now, updatedAt: now }).where(eq(users.id, row.userId));
  const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (u) await sendTemplate(db, { userId: u.id, to: u.email, template: 'welcome', locale: u.locale, vars: {} });
  return row.userId;
}

export async function login(db: Db, email: string, password: string, device?: string, ip?: string | null) {
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Siempre verificamos un hash para no filtrar por tiempo si el correo existe.
  const ok = u ? await verifyPassword(u.passwordHash, password) : await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', password);
  if (!u || !ok || u.status === 'deleted') {
    await audit(db, { actorId: u?.id ?? null, action: 'auth.login_failed', ip });
    throw errors.unauthorized('Correo o contraseña incorrectos.');
  }
  const session = await createSession(db, u.id, device, ip);
  await audit(db, { actorId: u.id, action: 'auth.login', ip, metadata: { device } });
  return { user: u, ...session };
}

export async function createSession(db: Db, userId: string, device?: string, ip?: string | null) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 86400_000).toISOString();
  const [s] = await db.insert(sessions).values({ userId, tokenHash: sha256(token), device: device ?? null, ip: ip ?? null, expiresAt }).returning();
  return { token, sessionId: s!.id, expiresAt };
}

export async function revokeSession(db: Db, sessionId: string) {
  await db.update(sessions).set({ revokedAt: new Date().toISOString() }).where(eq(sessions.id, sessionId));
}
export async function revokeAllSessions(db: Db, userId: string, exceptSessionId?: string) {
  const now = new Date().toISOString();
  await db.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  if (exceptSessionId) await db.update(sessions).set({ revokedAt: null }).where(eq(sessions.id, exceptSessionId));
}

export async function forgotPassword(db: Db, email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Respuesta idéntica exista o no la cuenta.
  if (u && u.status !== 'deleted') await issueEmailToken(db, u.id, 'reset', u.email, u.locale);
}
export async function resetPassword(db: Db, token: string, password: string) {
  const row = await consumeEmailToken(db, token, 'reset');
  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, row.userId));
  await revokeAllSessions(db, row.userId);
  await audit(db, { actorId: row.userId, action: 'auth.password_reset' });
}
export async function resendVerification(db: Db, userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || u.emailVerifiedAt) return;
  await issueEmailToken(db, u.id, 'verify', u.email, u.locale);
}
