import { z } from 'zod';
import { RELATIONSHIP_INTENTS, INTERESTS } from '../constants.js';

export const discoverQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  /** Filtros extendidos (Premium): intención, intereses, verificados. */
  intent: z.enum(RELATIONSHIP_INTENTS).optional(),
  interest: z.enum(INTERESTS).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
});
export const swipeSchema = z.object({
  targetId: z.uuid(),
  action: z.enum(['like', 'pass']),
});
export const swipeResultSchema = z.object({
  matched: z.boolean(),
  matchId: z.uuid().nullable(),
  conversationId: z.uuid().nullable(),
  remainingLikes: z.number().int().nullable(),
});
export type SwipeResult = z.infer<typeof swipeResultSchema>;
