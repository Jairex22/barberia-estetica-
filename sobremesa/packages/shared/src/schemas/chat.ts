import { z } from 'zod';
import { REPORT_REASONS } from '../constants.js';

export const sendMessageSchema = z.object({
  /** Id generado por el cliente para idempotencia (reintentos sin duplicados). */
  clientId: z.string().min(8).max(64),
  body: z.string().trim().min(1).max(2000),
});
export const messageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  senderId: z.uuid(),
  body: z.string(),
  kind: z.enum(['user', 'system']),
  createdAt: z.string(),
  clientId: z.string().nullable(),
  seq: z.number().int(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSummarySchema = z.object({
  id: z.uuid(),
  matchId: z.uuid(),
  other: z.object({ id: z.uuid(), displayName: z.string(), photoUrl: z.string().nullable(), isDemo: z.boolean() }),
  lastMessage: messageSchema.nullable(),
  unreadCount: z.number().int(),
  /** Quién puede iniciar: 'you' | 'them' | 'anyone'. Calculado en servidor. */
  initiation: z.enum(['you', 'them', 'anyone', 'started']),
  createdAt: z.string(),
});
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export const reportSchema = z.object({
  targetUserId: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
  conversationId: z.uuid().optional(),
});
export const blockSchema = z.object({ targetUserId: z.uuid() });

/** Eventos WebSocket (servidor -> cliente). */
export const wsServerEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message.new'), message: messageSchema }),
  z.object({ type: z.literal('message.ack'), clientId: z.string(), messageId: z.uuid(), seq: z.number() }),
  z.object({ type: z.literal('match.new'), matchId: z.uuid(), conversationId: z.uuid() }),
  z.object({ type: z.literal('conversation.removed'), conversationId: z.uuid() }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
  z.object({ type: z.literal('pong') }),
]);
export type WsServerEvent = z.infer<typeof wsServerEventSchema>;

export const wsClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('message.send'), conversationId: z.uuid(), clientId: z.string(), body: z.string() }),
  z.object({ type: z.literal('ping') }),
]);
