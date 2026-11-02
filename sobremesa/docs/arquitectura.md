# Arquitectura y decisiones técnicas

## Resumen

Monolito modular en TypeScript, pensado para una persona o equipo pequeño:

| Capa | Elección | Versión verificada en npm (2 nov 2026) | Por qué |
|---|---|---|---|
| Lenguaje | TypeScript 5.9 | 5.9.3 | Contratos compartidos entre API, web y móvil |
| API | Fastify 5 + @fastify/websocket | 5.12.7 / 11.3.6 | Rápido, maduro, WebSocket integrado, rate limit y multipart oficiales |
| Base de datos | PostgreSQL 16 + Drizzle ORM | drizzle-orm 0.45.4, postgres.js 3.4.7 | SQL explícito, migraciones generadas, LISTEN/NOTIFY para tiempo real multi-instancia |
| Web | Next.js 16 (App Router, Turbopack) + Tailwind 4 | 16.4.3 / 4.3.3 | SSR para páginas públicas, proxy `/api/*` al API para cookies httpOnly |
| Móvil | Expo SDK 58 + expo-router + react-native-purchases | 58.0.22 / 58.0.29 / 11.0.0 | Android e iOS desde un código; compras en tienda vía RevenueCat |
| Pagos web | Stripe (Checkout + Billing + webhooks) | stripe 23.1.0 | Checkout alojado (sin datos de tarjeta en nuestro servidor). Mercado Pago diseñado como segundo proveedor |
| IA | Anthropic SDK (claude-haiku-5-5 por defecto) | @anthropic-ai/sdk 1.3.0 | Costo bajo (0.10/0.50 USD por millón de tokens), herramientas con permisos mínimos |
| Pruebas | Vitest 5, Playwright 1.64, axe-core | — | Integración real contra PostgreSQL; E2E en 4 anchos; accesibilidad automatizada |

**Descartado:** Supabase/Firebase administrado (atan la lógica al proveedor y no se podían probar aquí sin cuenta; la arquitectura permite migrar a Postgres administrado como Neon/Supabase sin cambios de código: solo `DATABASE_URL`). Microservicios: innecesarios a esta escala. PWA: la web ya es responsive; los entregables nativos son la app Expo (no un WebView).

## Módulos del API (`apps/api/src/modules`)

`auth` (registro, verificación de correo, sesiones, recuperación, ticket WS), `account` (contraseña, pausa, eliminación con confirmación por correo, exportación ARCO), `profiles` (perfil, fotos privadas con URL firmada, incógnito), `discovery` (candidatos, likes/descartes, match, deshacer, likes recibidos), `matches`, `chat` (REST + WebSocket, idempotencia, regla de inicio, rompehielos), `safety` (bloqueo, denuncia, apelación, verificación por selfie), `billing` (proveedores, webhooks, conciliación, derechos), `notifications` (correo con categorías y preferencias), `assistant` (IA de soporte con base de conocimiento), `admin` (panel), `jobs` (tareas programadas).

Servicios transversales: `crypto` (argon2id, tokens, HMAC), `email` (console/Resend), `storage` (local/S3‑R2), `media` (re‑codificación que elimina EXIF/GPS, URLs firmadas), `moderation` (proveedor opcional + heurísticas de texto), `audit`, `settings`, `realtime` (bus local + NOTIFY).

## Modelo de datos (28 tablas)

Usuarios y sesiones (hash SHA‑256 del token; cookie httpOnly firmada en web, Bearer en móvil), tokens de correo, perfiles (coordenadas **siempre redondeadas** a ~1 km), fotos (estado de moderación), swipes (único por par, `undone_at` para deshacer), matches (par ordenado único), conversaciones (`last_seq` para orden total), mensajes (único por `conversation_id + sender_id + client_id` → idempotencia), lecturas, bloqueos, reportes, apelaciones, verificaciones, suscripciones (único por `channel + provider_subscription_id`), `billing_events` (único por `channel + provider_event_id` → cada webhook se aplica una vez), `payment_records` (ingresos conciliados), preferencias de notificación, tokens push, mensajes salientes (bitácora), base de conocimiento versionada, conversaciones/mensajes del asistente con costo en microdólares, auditoría, ajustes, ejecuciones de jobs, exportaciones, lista de espera.

## Autorización

Cada operación verifica pertenencia en SQL (p. ej., una conversación solo se carga si el usuario es parte del match activo). Roles: `user`, `moderator` (reportes, fotos, verificaciones, apelaciones; sin correos ni pagos), `admin`. Toda acción administrativa y sensible queda en `audit_log` sin secretos.

## Tiempo real y sincronización

`/ws` autenticado por ticket HMAC de 60 s (web) o Bearer (móvil); comprobación de `Origin`. El envío pasa por **el mismo servicio** que REST (`sendMessage`), que hace cumplir reglas y asigna `seq` dentro de una transacción. Los clientes sincronizan con `GET /messages?after=seq`, reintentan con el mismo `clientId` (sin duplicados) y encolan en modo sin conexión. Varias instancias del API se coordinan por `NOTIFY sobremesa_events`.

## Premium y pagos

El derecho Premium se **calcula en la BD** a partir de suscripciones `active/past_due` con periodo vigente; nunca por redirecciones, datos del cliente ni pantallas locales. Webhooks: firma obligatoria, registro idempotente, estado vivo del proveedor preferido ante eventos desordenados, reembolso/contracargo revocan de inmediato. Un usuario con suscripción vigente en un canal no puede abrir otro checkout (evita doble cobro).

## Rendimiento medido

Prueba de carga local (ver `docs/informe-pruebas.md`): 200 usuarios concurrentes, 60 s, 17,210 solicitudes, 0 % errores, p95 de Descubrir 504 ms (la consulta más pesada), p95 de ack WebSocket 259 ms, API en ~1 núcleo y 290 MB. Siguiente optimización si crece: materializar candidatos de descubrimiento por usuario y cachear perfiles públicos.
