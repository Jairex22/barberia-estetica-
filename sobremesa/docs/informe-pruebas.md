# Informe de pruebas

**Entorno real de ejecución**: contenedor Linux (Ubuntu 24.04, 4 vCPU, 16 GB RAM), Node 22.23, pnpm 10.28, PostgreSQL 16.15 local, Chromium 1243 (Playwright 1.64). Fecha: 2 de noviembre de 2026. No se probó en dispositivos físicos, emuladores Android/iOS, Safari/WebKit ni Firefox. No se compiló la app móvil (sin SDK de Android, Xcode ni cuenta Expo). No se realizaron pruebas contra proveedores de pago reales ni contra la API de Anthropic (sin credenciales); los proveedores se simularon con clientes falsos y **firmas reales** de webhook.

## 1. Unitarias (paquete compartido) — `pnpm --filter @sobremesa/shared test`

9 pruebas: regla de inicio (mujer‑hombre, mismo género, combinaciones mixtas con ambas políticas), cálculo de edad y mayoría de edad, redondeo de coordenadas y rangos de distancia, preferencias de género. **Resultado: 9/9.**

## 2. Integración del API contra PostgreSQL — `pnpm --filter @sobremesa/api test`

14 pruebas (BD `citas_test`, migraciones reales, correos capturados en memoria). **Resultado: 14/14.** Cobertura de los criterios de aceptación:

| Criterio | Prueba | Resultado |
|---|---|---|
| Dos cuentas reales: registro, verificación, perfiles, likes mutuos y conversación sincronizada REST + WebSocket, sin duplicados | `flows.test.ts` › Recorrido completo | ✅ |
| Menores bloqueados en el registro | idem | ✅ |
| El actor no autorizado no puede iniciar ni llamando directamente a la API; Premium no lo cambia; tras el primer mensaje de ella, él responde; mujer‑mujer cualquiera inicia | `flows.test.ts` › Regla de inicio | ✅ |
| Bloqueo y denuncia persisten tras cerrar sesión y reconectar; ocultan en Descubrir; impiden likes | `flows.test.ts` › Bloqueo | ✅ |
| Aislamiento: nadie lee/modifica conversaciones, mensajes, fotos ni matches ajenos; URL de foto sin firma válida → 403; sin sesión → 401; moderador sin acceso a pagos/correos | `flows.test.ts` › Aislamiento | ✅ |
| Cuenta eliminada (flujo con confirmación por correo), suspendida o pausada deja de aparecer en Descubrir y en conexiones; suspendida no opera | `flows.test.ts` › Cuentas eliminadas | ✅ |
| Compra, fallo, renovación, cancelación, reembolso, vencimiento; webhooks repetidos y desordenados; firma inválida; redirección de éxito no activa Premium; doble cobro bloqueado; ingresos conciliados | `billing.test.ts` › Stripe | ✅ |
| Tiendas vía RevenueCat: autorización, compra, renovación, duplicado, billing issue, expiración, reembolso, restauración honesta, bloqueo de checkout web con suscripción de tienda | `billing.test.ts` › RevenueCat | ✅ |
| Mercado Pago: validación de firma HMAC; webhook sin credenciales no activa nada | `billing.test.ts` › Mercado Pago | ✅ |
| Asistente reconoce falta de información; modo degradado honesto; resiste intento de obtener datos de otra cuenta; límite diario; costo contabilizado | `assistant.test.ts` | ✅ |

## 3. Extremo a extremo (web real + API real) — `pnpm --filter @sobremesa/web test:e2e`

Playwright contra `next start` (compilación de producción) y el API en modo desarrollo con `DEMO_MODE=true`, `DEV_MAILBOX=true`. 4 pruebas × 4 anchos (360, 390, 768, 1440 px) = 16. **Resultado final: 16/16** (ver `docs/pruebas/e2e-final.log`). Recorridos:

1. Landing, navegación a legales y **auditoría axe‑core** (WCAG 2 A/AA + 2.2 AA): sin violaciones críticas ni serias (se corrigió un contraste 3.95:1 detectado por esta prueba).
2. Registro por interfaz → correo de verificación → verificación → completar perfil (presentación, intención, intereses) → menor de edad rechazado desde la UI.
3. Dos cuentas: Descubrir muestra la tarjeta con señales explicables; like mutuo → diálogo de conexión → chat: ella escribe primero (su campo habilitado, el de él deshabilitado), él recibe en tiempo real y responde; bloqueo desde el chat elimina la conversación para ambos y persiste tras recargar.
4. Premium muestra beneficios, lo que no incluye y el proveedor como "no disponible" (sin claves); Ayuda responde identificado como IA en modo FAQ; panel admin carga métricas e ingresos conciliados; axe sin críticas; el primer Tab enfoca "Saltar al contenido".

Capturas reales (no maquetas) en `docs/pruebas/capturas/`.

Revisado manualmente en las capturas: navegación inferior en móvil y lateral en escritorio, formularios con errores accesibles, teclado (campos con etiquetas), estados vacío/error. **No probado**: lector de pantalla real, Safari/iOS, Android físico, modo sin conexión en dispositivo (la lógica de cola se probó solo por código).

## 4. Carga — `pnpm --filter @sobremesa/api load:test`

API compilado (`node dist/server.js`, `NODE_ENV=production`, 1 proceso) en la misma máquina que el generador de carga (lo que **penaliza** las latencias medidas). 200 usuarios concurrentes durante 60 s; cada uno: `GET /discover`, `POST /discover/swipe`, `GET /conversations`, `GET /conversations/:id/messages` cada 3 s, y 100 parejas chateando por WebSocket (1 mensaje cada 3 s).

| Endpoint | n | p50 | p95 | p99 | máx | errores |
|---|---|---|---|---|---|---|
| GET /discover | 3,462 | 206 ms | 504 ms | 606 ms | 702 ms | 0 |
| POST /discover/swipe | 3,462 | 54 ms | 134 ms | 186 ms | 276 ms | 0 |
| GET /conversations | 3,462 | 82 ms | 209 ms | 244 ms | 391 ms | 0 |
| GET /conversations/:id/messages | 3,462 | 46 ms | 111 ms | 141 ms | 212 ms | 0 |
| WebSocket envío → ack | 3,362 | 108 ms | 259 ms | 319 ms | 488 ms | 0 |

Totales: 17,210 solicitudes HTTP (287/s), 3,362 mensajes WS enviados y 3,362 confirmados, 0 % errores. API: RSS 209–287 MB, CPU ≈1 núcleo saturado (105 % promedio). Datos crudos: `docs/pruebas/carga-200u-*.json`. **No extrapolar a miles de usuarios**: el cuello identificado es la consulta de Descubrir (subconsultas por candidato); antes de escalar, materializar candidatos y añadir caché. Ningún proveedor externo fue sometido a carga.

## 5. Restauración de respaldo

Ejecutado en esta sesión: `pg_dump -Fc` de la BD de desarrollo → `pg_restore` en BD nueva `citas_restore` → comparación de número de filas por tabla → API arrancado contra la BD restaurada → `GET /health` OK. Resultado en `docs/pruebas/restauracion.txt`.

## 6. Problemas pendientes y limitaciones conocidas

- Mercado Pago: implementado sin pruebas en sandbox; permanece deshabilitado.
- Push notifications: tokens registrados, envío real no implementado (requiere Expo Push/FCM/APNs).
- Embeddings semánticos para el asistente: pendiente (solo texto completo + trigram).
- Lector de pantalla, Safari/WebKit, dispositivos físicos: no probados.
- SMTP genérico: no implementado (solo consola y Resend).
- CFDI: no integrado; los recibos no son facturas.
- Aviso previo de renovación (LFPC, ≥5 días): job pendiente de implementar antes de cobrar en producción.
- Dockerfile no probado (sin Docker en el entorno).
