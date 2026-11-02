import { z } from 'zod';

export const billingChannelSchema = z.enum(['stripe', 'mercadopago', 'apple', 'google', 'manual']);
export type BillingChannel = z.infer<typeof billingChannelSchema>;

export const subscriptionStatusSchema = z.enum([
  'incomplete', 'pending', 'active', 'past_due', 'canceled', 'expired', 'refunded', 'revoked',
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** Lo que el cliente muestra ANTES de confirmar un pago. */
export const priceDisplaySchema = z.object({
  currency: z.string(),           // 'MXN' | 'USD'
  amountMinor: z.number().int(),  // 19900 = $199.00
  interval: z.enum(['month']),
  taxIncluded: z.boolean(),
  renewsAutomatically: z.boolean(),
  cancelInstructions: z.string(),
  channel: billingChannelSchema,
  available: z.boolean(),         // false si el proveedor no está configurado
  unavailableReason: z.string().nullable(),
});
export type PriceDisplay = z.infer<typeof priceDisplaySchema>;

export const entitlementSchema = z.object({
  plan: z.enum(['free', 'premium']),
  premiumUntil: z.string().nullable(),
  channel: billingChannelSchema.nullable(),
  status: subscriptionStatusSchema.nullable(),
  cancelAtPeriodEnd: z.boolean(),
  manageUrl: z.string().nullable(),
});
export type Entitlement = z.infer<typeof entitlementSchema>;
