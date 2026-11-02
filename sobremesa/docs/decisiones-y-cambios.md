# Registro de decisiones y cambios

## 2026-11-02 — Sesión inicial

- Verificación de capacidades del entorno (Node, pnpm, PostgreSQL local, Playwright; sin Docker, sin SDK móvil, sin cuentas externas).
- Investigación con 4 informes (`research/`): competidores, demografía/nichos, pagos/tiendas, legal/seguridad/costos. Limitación: varios dominios oficiales bloqueados; datos marcados con confianza.
- Cambio de nombre provisional de "Velada" a "Sobremesa" por conflicto con una app existente.
- Corrección de precios de la API de Anthropic en la configuración (Haiku 5.5: 0.10/0.50 USD por MTok) tras verificar la fuente.
- Creación del monorepo (shared, api, web, mobile), 28 tablas, migración inicial `0000_esquema_inicial`.
- Decisión: compilar `packages/shared` a `dist` (Turbopack no resuelve imports `.js` → `.ts` en paquetes del workspace).
- Decisión: ticket HMAC de 60 s para el WebSocket en web (evita exponer la cookie httpOnly y problemas de dominio).
- Corrección de contraste: acento `#c8563f` (3.95:1) → `#a8432f` (5.5:1); salvia y dorado también ajustados. Detectado por axe en E2E.
- Decisión de prueba: ante eventos de webhook desordenados se prefiere el estado vivo del proveedor; si no responde, se compara la marca de tiempo y se ignora el evento antiguo.
- Pruebas: 9 unitarias, 14 integración, 16 E2E (4 anchos), carga 200 usuarios/60 s sin errores, restauración de respaldo verificada.
- Documentación completa y ZIP del proyecto.
