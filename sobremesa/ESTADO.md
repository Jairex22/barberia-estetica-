# ESTADO.md — punto de continuación

Última actualización: 2 de noviembre de 2026 (sesión inicial). Si el contexto se agota, continuar desde aquí.

## Decisiones tomadas

| Decisión | Elección | Motivo / evidencia |
|---|---|---|
| Nombre provisional | **Sobremesa** (alternativa: Lumbre; descartados Velada y Brasa por conflictos evidentes) | `docs/marca.md`, `research/legal_seguridad_costos.md` §8 |
| Nicho e hipótesis | Intención seria + planes concretos + seguridad‑primero, 25–40, ZMG | `docs/investigacion-nichos.md` (2.º en la matriz, 3.90; el 1.º "planes compartidos" 4.00 es casi el mismo producto; ganador estable en 4 ponderaciones) |
| Ciudad inicial / alternativa | Guadalajara / Monterrey (CDMX si prima densidad) | `research/demografia_nichos.md` |
| Regla de inicio | Mujer‑hombre: ella; mismo género: cualquiera; mixto: `INITIATION_POLICY_MIXED=either` | Enforzada en `chat/service.ts`; probada |
| Expiración de matches | No | Sin evidencia de beneficio; presión artificial |
| Stack | TS, Fastify 5, Drizzle + PG 16, Next 16, Expo 58, Stripe, RevenueCat, Anthropic Haiku 5.5 | `docs/arquitectura.md` |
| Pasarela web principal / secundaria | Stripe (requiere aprobación del giro) / Mercado Pago (diseñado, sin sandbox) | `docs/pagos.md` |
| Precio | USD 10 referencia; web MX$199 IVA incl. (configurable); tiendas precio local | `docs/modelo-economico.md` |
| Moderación de fotos | Humana por defecto (Sightengine opcional) | `services/moderation.ts` |
| Verificación | Selfie con pose revisada por persona; proveedor INE a evaluar | `docs/seguridad.md` |
| Demo | `DEMO_MODE` + `users.is_demo`; excluido por SQL en producción | `scripts/seed-demo.ts` |

## Hechos verificados en esta sesión

- Node 22.23, pnpm 10.28, PostgreSQL 16.15 locales; sin Docker; sin SDK Android/Xcode; sin cuentas Expo/Apple/Google/Stripe/Anthropic.
- Versiones npm al 2‑nov‑2026: next 16.4.3, react 19.3.1, expo 58.0.22, react-native 0.88.1, fastify 5.12.7, drizzle-orm 0.45.4, stripe 23.1.0, @anthropic-ai/sdk 1.3.0, react-native-purchases 11.0.0, zod 4.6.7, vitest 5.0.5, @playwright/test 1.64.1.
- Precios Anthropic (2‑nov‑2026): Haiku 5.5 0.10/0.50 USD por MTok; Sonnet 5.5 2/10; Opus 5.5 4/20; Fable 5.1 10/50. Claude Max incluye créditos de API mensuales limitados; el bot se presupuesta como consumo medido.
- FIX Banxico 18.7962 MXN/USD (30‑oct‑2026, fuente secundaria).

## Avances por hito

- **A** Investigación, nicho, marca, economía: ✅ (`research/`, `docs/investigacion-nichos.md`, `docs/marca.md`, `docs/modelo-economico.xlsx|.md`).
- **B** Monorepo, shared, API base, auth, sistema visual: ✅.
- **C** Web y móvil con perfiles, descubrir, matches, chat, bloqueo, reportes: ✅ web probada E2E; móvil escrita y con typecheck, **no compilada ni ejecutada en dispositivo**.
- **D** Suscripciones, pagos sandbox, asistente: ✅ lógica probada con simuladores y firmas reales; **sin credenciales reales** (ver Bloqueado).
- **E** Panel, pruebas, documentación, ZIP: ✅ panel; 39 pruebas automatizadas (9 unitarias + 14 integración + 16 E2E) en verde; carga 200 usuarios; restauración verificada; documentación completa; ZIP generado.

## Comandos ejecutados (reproducibles)

```
pnpm install                         # raíz
pnpm --filter @sobremesa/api db:generate && pnpm db:migrate
pnpm --filter @sobremesa/api db:seed:kb ; DEMO_MODE=true pnpm --filter @sobremesa/api db:seed:demo
pnpm test                            # shared 9/9, api 14/14
pnpm --filter @sobremesa/web build && pnpm --filter @sobremesa/web start
DEMO_MODE=true DEV_MAILBOX=true RATE_LIMIT_ALLOWLIST=127.0.0.1,::1,::ffff:127.0.0.1 pnpm --filter @sobremesa/api dev
PW_EXECUTABLE=/opt/pw-browsers/chromium pnpm --filter @sobremesa/web exec playwright test   # 16/16
pnpm --filter @sobremesa/api build && NODE_ENV=production PORT=4001 node apps/api/dist/server.js
LOAD_API=http://127.0.0.1:4001 LOAD_USERS=200 LOAD_DURATION_S=60 LOAD_API_PID=<pid> pnpm --filter @sobremesa/api load:test
pg_dump -Fc citas | pg_restore -d citas_restore   # ver docs/pruebas/restauracion.txt
pnpm --filter @sobremesa/mobile typecheck
```

## Pendiente (no bloqueado; siguiente sesión)

1. Job de aviso previo de renovación (≥5 días, LFPC) antes de activar cobros reales.
2. Envío real de push (Expo Push) usando `push_tokens`; hoy solo se registran.
3. Embeddings semánticos del asistente (Voyage u otro) — opcional; FTS+trigram funciona.
4. Función "compartir cita" con contacto de confianza (seguridad).
5. Materializar candidatos de Descubrir y caché si se superan ~500 usuarios activos simultáneos.
6. SMTP genérico como proveedor de correo alternativo.
7. Pruebas en Safari/WebKit, lector de pantalla y dispositivos físicos.
8. Dockerfile probado; CI (GitHub Actions) con `pnpm test`.
9. `LICENSE` del proyecto.

## Bloqueado: requiere tu intervención (credenciales, cuentas, dinero o decisiones)

| Qué | Para qué | Cómo |
|---|---|---|
| Cuenta Stripe MX + aprobación del giro "dating" + producto/precio + webhook | Cobrar en web | `docs/pagos.md` checklist; pasar claves de **test** primero |
| Cuenta Mercado Pago (opcional) | Segunda pasarela | Credenciales de prueba + ejecutar lista sandbox en `docs/pagos.md` |
| Apple Developer (USD 99/año) y Google Play Console (USD 25) | Publicar apps, IAP | `docs/tiendas.md` |
| RevenueCat (proyecto, productos, webhook, claves) | Premium en tiendas | `docs/tiendas.md` |
| Cuenta Expo + `eas init` | Compilar Android/iOS | `apps/mobile`: reemplazar `PENDIENTE_CREAR_CON_eas_init` |
| Clave API de Anthropic | Asistente con modelo (sin ella: modo FAQ) | `ANTHROPIC_API_KEY`; presupuesto `ASSISTANT_MONTHLY_BUDGET_USD` |
| Dominio + Resend (DNS SPF/DKIM) | Correos reales de verificación | `docs/despliegue.md`, `docs/servicios-externos.md` |
| Hosting (API, Postgres, web, R2) | Producción | `docs/despliegue.md` |
| Revisión legal (LFPDPPP, LFPC, decreto edad) y contador (SAT, IVA, CFDI) | Publicar textos legales y cobrar | `docs/seguridad.md`, `docs/pagos.md` |
| Búsqueda de marca IMPI y dominios | Confirmar "Sobremesa" | `docs/marca.md` |
| Autorización para experimentos con personas (lista de espera, entrevistas, evento) | Validar nicho | `docs/lanzamiento-30-60-90.md` |

## Cómo continuar sin rehacer

1. Leer este archivo y `docs/informe-pruebas.md`.
2. `pnpm install && pnpm db:migrate && pnpm test` para confirmar que el entorno funciona.
3. Tomar un pendiente de la lista o desbloquear un ítem con credenciales (copiar a `.env`, nunca al repositorio).
