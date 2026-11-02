# Operación

## Panel administrativo (`/admin`)

Resumen (usuarios, perfiles completos, activos 7/30 días, matches, conversaciones iniciadas y recíprocas, ingresos conciliados por moneda con reembolsos y contracargos, suscripciones por canal/estado, colas, gasto de IA), Reportes (contexto mínimo, resolver/descartar/advertir/suspender), Fotos pendientes, Verificaciones por selfie, Apelaciones, Usuarios (búsqueda, ficha, suspender/reactivar, roles), Facturación (suscripciones, pagos, webhooks, conciliar ahora), Asistente IA (costos diarios, conversaciones que piden humano), Conocimiento (versionado y publicación), Auditoría, Ajustes (registro abierto, descubrir habilitado, precios mostrados, ciudades, ejecutar tareas).

Roles: moderadores ven solo reportes, fotos, verificaciones y apelaciones, sin correos ni pagos.

## Tareas programadas (en proceso o `pnpm --filter @sobremesa/api jobs:run <nombre>`)

`expire_sessions_and_tokens` (cada hora), `reconcile_billing` (cada hora), `purge_deleted_accounts` (diaria), `unread_digest` (diaria, respeta preferencias y horas tranquilas), `cleanup_exports` (diaria). Resultado en `job_runs` y en el panel.

## Horas humanas estimadas por semana (fase de lanzamiento, <2,000 usuarios)

| Tarea | Horas/semana | Quién |
|---|---|---|
| Moderación de fotos nuevas (≈1–2 min cada una; 100–300 fotos/sem) | 3–8 | Moderador/a |
| Verificaciones por selfie | 1–3 | Moderador/a |
| Reportes y apelaciones (incluye revisión de conversaciones reportadas) | 2–5 | Moderador/a con escalado a admin |
| Soporte humano (handoffs del asistente, correos, reembolsos) | 2–4 | Fundador/a |
| Conciliación de pagos, revisión de webhooks con error, contracargos | 1 | Fundador/a |
| Operación técnica (despliegues, respaldos, alertas) | 1–2 | Fundador/a |
| Comunidad y crecimiento (ver plan 30/60/90) | 5–10 | Fundador/a |
| **Total** | **15–33** | |

Tareas que necesitan a una persona sí o sí: moderación de fotos y verificaciones, decisiones de suspensión/apelación, reembolsos, respuesta a autoridades/ARCO, revisión legal/fiscal.

## Respaldos y restauración

- Base de datos: `pg_dump -Fc citas > sobremesa-$(date +%F).dump` diario (o snapshots del proveedor administrado), retención 30 días, copia cifrada fuera del servidor (R2/S3 con versionado).
- Archivos privados (fotos): si `STORAGE_PROVIDER=s3`, activar versionado del bucket y réplica; si `local`, incluir `apps/api/storage/private` en el respaldo.
- **Prueba de restauración (ejecutada en esta sesión, ver `docs/informe-pruebas.md`)**: `pg_dump` de la BD de desarrollo → `pg_restore` en una BD nueva → conteo de tablas y filas coincide → arranque del API contra la BD restaurada y `GET /health` OK. Repetir mensualmente.
- Secretos: gestor del proveedor (Fly/Render/Railway secrets); rotación de `COOKIE_SECRET` invalida sesiones (planificar), de `MEDIA_SIGNING_SECRET` invalida URLs firmadas (inofensivo).

## Incidentes

Runbook mínimo: 1) API caída → `GET /health`, logs del proveedor, reiniciar; 2) webhooks en error → panel → Facturación → revisar `error`, corregir, reenviar desde el panel del proveedor; 3) fuga sospechada → revocar sesiones (`UPDATE sessions SET revoked_at=now()`), rotar secretos, avisar conforme a la ley de datos; 4) usuario en riesgo → suspensión inmediata desde el panel y contacto con autoridades si procede.
