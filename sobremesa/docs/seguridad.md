# Seguridad, privacidad y cumplimiento

## Controles implementados

| Área | Implementación |
|---|---|
| Edad | Fecha de nacimiento obligatoria; cálculo en servidor; <18 rechazado (`underage`). Marcar una casilla **no** verifica edad ni identidad y así se documenta. Verificación por selfie con pose revisada por una persona (insignia ≠ garantía de seguridad). Proveedor de identidad (INE) opcional a futuro: Incode/MetaMap, Veriff (0.80–1.89 USD/verificación), Sumsub, Persona; retener el mínimo (resultado y fecha, no el documento). |
| Contraseñas y sesiones | argon2id; sesiones opacas con hash SHA‑256 en BD, expiración 30 días, revocación individual y total; cookie httpOnly/SameSite=Lax/firmada (Secure en producción); Bearer en móvil guardado en SecureStore. Verificación de contraseña en tiempo constante aunque el correo no exista. |
| Rate limiting | Global 300/min por IP; login/registro 10 por 15 min; subida de fotos 20/h; reportes 20/h; asistente 20/10 min + límite diario; mensajes 20/min; likes diarios; conversaciones nuevas por día. |
| Autorización | Comprobada en SQL por operación; roles user/moderator/admin; moderadores sin acceso a correos ni pagos; auditoría de accesos a contexto de reportes y fichas de usuario. |
| Ubicación | Solo coordenadas redondeadas a ~1 km; cliente recibe únicamente rangos (muy cerca/cerca/misma zona/lejos); sin mapa ni ordenación por distancia visible; filtro máximo de distancia aplicado en servidor. Protección contra triangulación: rangos anchos + redondeo + límites de consultas. |
| Fotos | Re‑codificación con sharp (elimina EXIF/GPS), tamaño limitado, almacenamiento privado, URLs firmadas HMAC con caducidad y atadas al espectador, `X-Robots-Tag: noindex`, revisión humana previa (o proveedor). |
| Inferencias | Ninguna inferencia de género, orientación, salud u otros atributos sensibles por IA. Solo datos declarados. |
| Bloqueo y denuncia | Bloqueo termina matches, oculta en descubrir en ambas direcciones, retira likes del bloqueado; persistente. Denuncias con contexto mínimo necesario, anonimato del denunciante, cola de moderación, apelaciones. Heurísticas de estafa/spam en texto (enlaces, teléfonos, cripto, solicitudes de dinero) registradas en auditoría. |
| Secretos | Nunca en el cliente; `.env` ignorado por git; en producción se rechazan secretos "dev-only". Logs con cabeceras de autorización y cookies redactadas; auditoría sin tokens. |
| Webhooks | Firma Stripe, HMAC Mercado Pago, secreto RevenueCat; idempotencia por evento; cuerpo crudo preservado. |
| WebSocket | Ticket HMAC de 60 s (web) / Bearer (móvil); comprobación de Origin. |
| Cifrado | TLS en tránsito (lo da el proveedor de hosting); cifrado en reposo del proveedor de BD/objetos. **No hay cifrado de extremo a extremo** y no se anuncia. |
| Indexación | `robots.txt` y cabeceras noindex en app, perfiles, mensajes y panel. |
| Backups | Procedimiento y prueba de restauración en `docs/operacion.md`. |

## Riesgos conocidos de México (de la investigación)

Extorsiones y secuestros exprés iniciados en apps de citas (CDMX, Jalisco/Puerto Vallarta; alertas del Consulado de EE. UU. 2025–2026), patrones contra hombres LGBTIQ+. Medidas: consejos de primera cita en la base de conocimiento y en la app, verificación por selfie, reporte rápido, sin ubicación exacta, 911 visible. Pendiente a evaluar: botón de "compartir cita" con contacto de confianza y check‑in.

## Datos personales (México)

Marco: nueva **LFPDPPP** (DOF 20‑mar‑2025; autoridad: Secretaría Anticorrupción y Buen Gobierno), consentimiento expreso para datos sensibles (género declarado y preferencia se tratan como sensibles), derechos ARCO (exportación y eliminación en la app), aviso de privacidad (`/legal/privacidad`, borrador operativo). **Requiere revisión profesional**: responsable y domicilio, listado final de encargados/transferencias, plazos ARCO, medidas de seguridad documentadas, aviso corto en formularios, decreto de entornos digitales seguros (DOF 14‑oct‑2026) y reforma LFPC sobre renovaciones automáticas (DOF 12‑dic‑2025: aviso ≥5 días antes de renovar; el job `reconcile_billing` deberá enviar ese aviso cuando se active cobro real).

## Retención y eliminación

- Eliminación: anonimización inmediata, revocación de sesiones, fin de matches, borrado de fotos del almacenamiento, cancelación de suscripción web; purga definitiva de filas a los 30 días (`purge_deleted_accounts`). Reportes se conservan sin datos identificables para seguridad.
- Suscripciones de tienda: no se pueden cancelar desde el servidor; la app y el correo de eliminación lo explican con enlaces a la tienda.
- Exportaciones: enlaces de 1 h, archivos borrados a los 7 días.
- Backups: ciclo de rotación ≤30 días para que la purga alcance también los respaldos.
- Servicios externos: Stripe/Mercado Pago/RevenueCat conservan datos de pago según sus políticas (obligación legal); Resend conserva metadatos de envío; el proveedor de IA no entrena con los datos (API comercial) y no recibe datos de otras cuentas.

## Términos, privacidad y comunidad

Borradores en `apps/web/src/app/legal/*`, adaptados a México con los puntos marcados para abogado. No publicarlos como definitivos sin esa revisión.
