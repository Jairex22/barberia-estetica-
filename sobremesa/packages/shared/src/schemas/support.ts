import { z } from 'zod';
export const assistantMessageSchema = z.object({
  conversationId: z.string().max(64).optional(),
  message: z.string().trim().min(1).max(1500),
  locale: z.enum(['es', 'en']).default('es'),
});
export const assistantReplySchema = z.object({
  conversationId: z.string(),
  reply: z.string(),
  isAI: z.literal(true),
  sources: z.array(z.object({ id: z.string(), title: z.string(), version: z.number() })),
  handoffSuggested: z.boolean(),
  degraded: z.boolean(), // true cuando se respondió con FAQ sin modelo
});
