# Pagos y suscripciones

## Comparativa de proveedores para México (resumen de `research/pagos_tiendas.md`)

| Proveedor | Elegibilidad citas | Comisión (MXN) | Suscripciones | Métodos | Estado en el código |
|---|---|---|---|---|---|
| **Stripe** (principal web) | Giro **restringido**: requiere aprobación previa por escrito de Stripe antes de cobrar | 3.6 % + MX$3 por tarjeta (+0.5 % internacional, +2 % conversión); Stripe Tax 0.5 % opcional; disputa MX$150 | Sí (Billing). OXXO y SPEI **no** son recurrentes | Tarjetas; OXXO/SPEI solo pago único | **Implementado y probado** con cliente simulado y firmas reales de webhook (vitest). Falta cuenta/claves de test para prueba en sandbox real |
| **Mercado Pago** (secundario) | No prohíbe citas (sí pornografía) | 3.49 % + MX$4 (acreditación inmediata) | Sí, solo con tarjeta (preapproval) | Tarjeta, wallet; OXXO/SPEI solo pago único | **Diseñado e implementado sin probar en sandbox**. Deshabilitado hasta configurar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` y pasar la lista de pruebas de abajo. La UI lo muestra como "no disponible" |
| App Store (StoreKit 2) vía RevenueCat | Apps de citas permitidas con clasificación 18+ | 15 % (Small Business Program <1 M USD) | Sí | Tarjeta/saldo Apple | Webhook **implementado y probado**; app móvil integra `react-native-purchases` (sin claves) |
| Google Play Billing vía RevenueCat | Permitidas con "Restrict Minor Access" | 15 % en suscripciones | Sí | Métodos de Google Play | Igual que Apple |
| RevenueCat | — | Gratis hasta USD 2,500 MTR; después 1 % | Unifica derechos | — | Webhook con `Authorization` secreto; verificación opcional por API (`/billing/restore`) |

"Varios bancos" = cualquier tarjeta Visa/Mastercard/Amex que la pasarela acepte; no prometemos aceptar toda tarjeta ni hay integración directa con bancos.

## Flujo web (Stripe)

1. `GET /billing/prices` muestra moneda, importe final (MX$199 IVA incluido por defecto, configurable en el panel), periodicidad mensual, renovación automática y **cómo cancelar**, antes de pagar.
2. `POST /billing/checkout` crea una sesión de Stripe Checkout (`mode=subscription`, `metadata.userId`, idempotencia por minuto). Rechaza con 409 si ya hay suscripción vigente en cualquier canal.
3. La página de éxito **no activa nada**: consulta `GET /billing/entitlement`, que solo cambia cuando llega el webhook verificado.
4. `POST /billing/webhooks/stripe`: verifica firma (`stripe-signature`), registra el evento en `billing_events` (único por id → duplicados devuelven `duplicate`), consulta el estado vivo de la suscripción y lo aplica; registra cobros (`invoice.paid`), fallos (`past_due`, correo), cancelaciones, vencimientos, reembolsos y contracargos (revocan de inmediato).
5. Cancelación desde la app (`POST /billing/cancel`) = al final del periodo; portal de Stripe para método de pago y recibos.
6. Conciliación horaria (`reconcile_billing`): expira periodos vencidos y refresca estados con el proveedor.

## Móvil (RevenueCat)

La app compra con `react-native-purchases` usando `appUserID = id de Sobremesa`. El servidor activa Premium **solo** con el webhook de RevenueCat (eventos INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION, BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE; reembolsos vía CANCELLATION con motivo) o con `POST /billing/restore`, que consulta la API de RevenueCat si hay clave. Cancelar una compra de tienda solo se puede en la tienda: la app muestra el enlace y lo explica, incluso al eliminar la cuenta.

## Pruebas automatizadas (vitest, `apps/api/test/billing.test.ts`)

Firma inválida rechazada; compra → activo; evento duplicado ignorado; doble checkout bloqueado; cobro registrado; fallo de pago → `past_due` con acceso en gracia; evento desordenado (más antiguo) ignorado cuando el proveedor no responde, estado vivo preferido cuando sí; cancelación al final de periodo; reembolso → revocación inmediata; eliminación → `free`. RevenueCat: autorización, compra, renovación, duplicado, bloqueo de checkout web con suscripción de tienda, billing issue, expiración, reembolso por soporte, restauración honesta sin clave. Mercado Pago: validación HMAC del `x-signature`.

## Lista exacta de requisitos para producción

**Stripe**
- [ ] Cuenta Stripe México activada: RFC, CLABE, Constancia de Situación Fiscal, identificación del representante; persona física con actividad empresarial o persona moral.
- [ ] Solicitud de aprobación del giro "online dating" (restricted business) y respuesta por escrito.
- [ ] Producto "Sobremesa Premium" con precio mensual MXN (IVA incluido) y opcional USD; copiar `price_...` a `STRIPE_PRICE_PREMIUM_MXN`.
- [ ] Endpoint de webhook `https://api.<dominio>/billing/webhooks/stripe` con eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`; copiar `whsec_...`.
- [ ] Portal de facturación habilitado (cancelación y cambio de método).
- [ ] Decidir Stripe Tax (0.5 %) o declarar IVA manualmente con tu contador.
- [ ] Pruebas en modo test con tarjetas 4242… y `stripe listen` antes de activar claves live.

**Mercado Pago (si se activa)**
- [ ] Cuenta vendedor verificada; credenciales de producción y de prueba; `MP_WEBHOOK_SECRET` del panel de notificaciones.
- [ ] Ejecutar en sandbox: crear preapproval, autorizar con tarjeta de prueba, recibir `subscription_preapproval` y `subscription_authorized_payment`, cancelar, verificar firma; documentar resultados en `docs/informe-pruebas.md`.

**Tiendas**: ver `docs/tiendas.md` (productos de suscripción, RevenueCat, webhooks, App Store Server Notifications/RTDN).

**Fiscal (requiere contador)**: alta en SAT, régimen (RESICO o actividad empresarial), emisión de CFDI a quien lo solicite (no integrado), IVA 16 % sobre ventas web; en tiendas, Apple/Google como intermediarios según LIVA 18‑B/18‑J. Los recibos actuales no son CFDI y así se indica en la UI.
