import { z } from 'zod';
import { isoDate } from './common.js';
import { GENDERS, INTERESTED_IN } from '../constants.js';

export const password = z.string().min(10, 'Mínimo 10 caracteres').max(128);

export const registerSchema = z.object({
  email: z.email().max(254).transform((e) => e.trim().toLowerCase()),
  password,
  birthdate: isoDate,
  gender: z.enum(GENDERS),
  interestedIn: z.enum(INTERESTED_IN),
  displayName: z.string().trim().min(2).max(30),
  acceptTerms: z.literal(true, { error: 'Debes aceptar los términos' }),
  acceptPrivacy: z.literal(true, { error: 'Debes aceptar el aviso de privacidad' }),
  confirmAdult: z.literal(true, { error: 'Debes confirmar que eres mayor de 18 años' }),
  marketingOptIn: z.boolean().default(false),
  locale: z.enum(['es', 'en']).default('es'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1).max(128),
  device: z.string().max(120).optional(),
});
export const verifyEmailSchema = z.object({ token: z.string().min(10).max(200) });
export const forgotPasswordSchema = z.object({ email: z.email().transform((e) => e.trim().toLowerCase()) });
export const resetPasswordSchema = z.object({ token: z.string().min(10).max(200), password });

export const sessionUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  emailVerifiedAt: z.string().nullable(),
  role: z.enum(['user', 'moderator', 'admin']),
  status: z.enum(['active', 'paused', 'suspended', 'deleted']),
  plan: z.enum(['free', 'premium']),
  premiumUntil: z.string().nullable(),
  locale: z.enum(['es', 'en']),
  profileComplete: z.boolean(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
