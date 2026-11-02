import type { BillingChannel, SubscriptionStatus } from '@sobremesa/shared';

/** Estado normalizado de una suscripción, independiente del proveedor. */
export type NormalizedSubscription = {
  channel: BillingChannel;
  providerSubscriptionId: string;
  providerCustomerId?: string | null;
  userId: string | null;               // null si el proveedor no envió referencia a nuestro usuario
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;     // ISO
  cancelAtPeriodEnd: boolean;
  priceCurrency?: string | null;
  priceAmountMinor?: number | null;
  eventTime: string;                   // ISO del evento (para descartar eventos viejos)
  raw?: unknown;
};
export type NormalizedPayment = {
  channel: BillingChannel; providerPaymentId: string; providerSubscriptionId: string | null; userId: string | null;
  kind: 'charge' | 'refund' | 'chargeback'; amountMinor: number; currency: string; feeMinor?: number | null; occurredAt: string;
};
export type WebhookOutcome = {
  providerEventId: string; type: string; eventTime: string | null; payload: unknown;
  subscription?: NormalizedSubscription | null; payment?: NormalizedPayment | null; ignored?: string;
};
export type CheckoutResult = { url: string; providerRef: string };

export interface PaymentProvider {
  channel: BillingChannel;
  configured(): boolean;
  unavailableReason(): string | null;
  /** Texto exacto de cancelación que se muestra ANTES de pagar. */
  cancelInstructions(locale: 'es' | 'en'): string;
  createCheckout(user: { id: string; email: string; locale: string }, currency: 'MXN' | 'USD'): Promise<CheckoutResult>;
  /** Verifica firma y normaliza. Lanza si la firma es inválida. */
  parseWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>, query?: Record<string, unknown>): Promise<WebhookOutcome>;
  cancelAtPeriodEnd(providerSubscriptionId: string): Promise<void>;
  manageUrl(user: { id: string }, providerCustomerId: string | null): Promise<string | null>;
  /** Consulta el estado actual al proveedor (conciliación / eventos desordenados). null si no se puede. */
  fetchSubscription(providerSubscriptionId: string): Promise<NormalizedSubscription | null>;
}
