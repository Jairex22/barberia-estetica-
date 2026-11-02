import { z } from 'zod';
import { GENDERS, INTERESTED_IN, INTERESTS, PLAN_TYPES, RELATIONSHIP_INTENTS } from '../constants.js';

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(30).optional(),
  bio: z.string().trim().max(500).optional(),
  gender: z.enum(GENDERS).optional(),
  interestedIn: z.enum(INTERESTED_IN).optional(),
  intent: z.enum(RELATIONSHIP_INTENTS).optional(),
  interests: z.array(z.enum(INTERESTS)).max(12).optional(),
  planTypes: z.array(z.enum(PLAN_TYPES)).max(5).optional(),
  idealPlan: z.string().trim().max(160).optional(),
  heightCm: z.number().int().min(120).max(230).nullable().optional(),
  occupation: z.string().trim().max(60).optional(),
  showAge: z.boolean().optional(),
  showDistance: z.boolean().optional(),
  city: z.string().trim().max(80).optional(),
  /** Coordenadas enviadas por el cliente; el servidor SIEMPRE las redondea antes de guardar. */
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  prefAgeMin: z.number().int().min(18).max(99).optional(),
  prefAgeMax: z.number().int().min(18).max(99).optional(),
  prefMaxDistanceKm: z.number().int().min(5).max(200).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const photoSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  position: z.number().int(),
  status: z.enum(['pending', 'approved', 'rejected']),
});

export const publicProfileSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  age: z.number().nullable(),
  bio: z.string(),
  gender: z.enum(GENDERS),
  intent: z.enum(RELATIONSHIP_INTENTS).nullable(),
  interests: z.array(z.string()),
  planTypes: z.array(z.string()),
  idealPlan: z.string().nullable(),
  occupation: z.string().nullable(),
  city: z.string().nullable(),
  distanceBucket: z.enum(['muy_cerca', 'cerca', 'misma_zona', 'lejos']).nullable(),
  photos: z.array(photoSchema),
  verified: z.boolean(),
  isDemo: z.boolean().default(false),
  signals: z
    .object({ sharedInterests: z.array(z.string()), sharedPlanTypes: z.array(z.string()), sameIntent: z.boolean() })
    .optional(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;
