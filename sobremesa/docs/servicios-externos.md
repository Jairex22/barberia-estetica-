# Servicios externos: para qué, costo y cómo configurarlos

Ninguno fue contratado ni configurado en esta sesión. Costos según `research/legal_seguridad_costos.md` y `research/pagos_tiendas.md` (verificar al contratar).

| Servicio | Para qué | Costo orientativo | Credenciales / variable | Sin él… |
|---|---|---|---|---|
| PostgreSQL administrado (Neon/Supabase/Fly) | Base de datos | 0–25 USD/mes | `DATABASE_URL` | Obligatorio |
| Hosting API (Fly/Render/Railway) | Servidor | 5–15 USD/mes | — | Obligatorio |
| Vercel u otro | Web | 0–20 USD/mes | `API_INTERNAL_URL`, `NEXT_PUBLIC_API_URL` | Obligatorio |
| Cloudflare R2 (o S3) | Fotos privadas | 0.015 USD/GB | `STORAGE_PROVIDER=s3`, `S3_*` | Disco local (no apto para varias instancias) |
| Resend | Correo transaccional | 0–20 USD/mes | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` | Correos solo en consola: nadie puede verificar su cuenta |
| Stripe | Pagos web | 3.6 % + MX$3 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM_MXN` | Pago web "no disponible" (honesto) |
| Mercado Pago | Pagos web alternativos | 3.49 % + MX$4 | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | No disponible; requiere pruebas sandbox antes |
| RevenueCat | Compras iOS/Android | 0 hasta 2,500 USD MTR | `REVENUECAT_WEBHOOK_SECRET`, `REVENUECAT_SECRET_API_KEY`, claves públicas en móvil | Compra en tienda "no disponible" |
| Apple Developer | Publicar iOS, APNs | 99 USD/año | Cuenta | Sin app iOS |
| Google Play Console | Publicar Android | 25 USD únicos | Cuenta | Sin app en Play |
| Expo EAS | Compilar/firmar apps | 0 (15 builds/mes) o 19+ USD/mes | `eas login` | Compilar localmente con Android Studio/Xcode |
| Anthropic API | Asistente de IA | ~0.001 USD por respuesta con Haiku 5.5; presupuesto mensual configurable | `ANTHROPIC_API_KEY` | Modo FAQ honesto |
| Sightengine (opcional) | Pre‑moderación de fotos | ~29 USD/mes | `IMAGE_MODERATION_PROVIDER=sightengine`, `SIGHTENGINE_*` | Revisión 100 % humana (predeterminado) |
| Proveedor de identidad (opcional) | Verificación INE | 0.80–1.90 USD/verificación + mínimos | Por integrar | Verificación por selfie manual |
| Sentry (opcional) | Errores | 0 | Por integrar | Logs del proveedor |
| Dominio | sobremesa.mx/.app | 15–60 USD/año | — | Obligatorio para producción |
