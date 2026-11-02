# Publicación en App Store y Google Play

## Requisitos de reglas (verificado en `research/pagos_tiendas.md` y `research/legal_seguridad_costos.md`)

**Apple**: compras digitales obligatoriamente con compras dentro de la app (3.1.1); las excepciones de enlaces externos (EE. UU./UE) **no** aplican a México, por lo que la app no muestra ni enlaza el checkout web para comprar. Clasificación de edad **18+** (nuevo cuestionario 2025–2026). Apps con contenido de usuarios deben tener filtrado, denuncia, bloqueo y contacto (1.2) → implementado. Borrado de cuenta dentro de la app (5.1.1 v) → implementado (solicitud en la app, confirmación por correo). Categoría de citas saturada (4.3 b): la revisión exige propuesta diferenciada; apóyate en `docs/producto.md`.

**Google Play**: Play Billing para suscripciones; México sin facturación alternativa. Apps de citas deben activar "Restrict Minor Access", cumplir los Child Safety Standards y declarar contacto de seguridad infantil. Clasificación de contenido para adultos. Formulario de seguridad de datos coherente con `docs/seguridad.md`.

## Qué incluye el código

- `apps/mobile/app.json`: identificadores `mx.sobremesa.app`, permisos mínimos (cámara, ubicación aproximada; se bloquea ubicación precisa), textos de permisos en español, esquema `sobremesa://`.
- `eas.json`: perfiles `preview` (APK interno) y `production`.
- Compras: `src/lib/purchases.ts` con RevenueCat; si faltan claves muestra "no disponible" sin fingir.

## Compilación Android (no ejecutada en esta sesión: sin SDK de Android ni cuenta Expo)

1. `npm i -g eas-cli` y `eas login` (cuenta Expo gratuita; 15 compilaciones Android/mes en el plan gratuito, ver precios actuales).
2. `cd apps/mobile && eas init` (crea `projectId` y reemplaza `PENDIENTE_CREAR_CON_eas_init`).
3. `eas build --platform android --profile preview` → APK para pruebas internas.
4. Para la tienda: `eas build --platform android --profile production` (AAB) y `eas submit -p android` (requiere cuenta Google Play Console, USD 25 únicos, y 12 probadores durante 14 días para cuentas nuevas).
5. Alternativa local: Android Studio + `pnpm --filter @sobremesa/mobile android`.

## iOS (requisitos de firma y cuenta)

- Apple Developer Program: USD 99/año, verificación de identidad (persona física) o D‑U‑N‑S (empresa).
- macOS con Xcode para compilación local o EAS Build en la nube (sin Mac). Certificado de distribución y perfil de aprovisionamiento gestionados por EAS (`eas credentials`).
- `eas build --platform ios --profile production` y `eas submit -p ios` → App Store Connect → TestFlight → revisión.
- Capacidades: compras dentro de la app, notificaciones push (APNs key).
- **El código fuente no es una app publicada**: hasta completar estos pasos no existe un binario iOS.

## RevenueCat

1. Crear proyecto, apps iOS/Android, producto `premium_monthly` en App Store Connect y Play Console (suscripción mensual, precio local ≈ USD 9.99; sugerido MX$189–199).
2. Entitlement `premium`, offering `default` con paquete mensual.
3. Claves públicas → `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `..._ANDROID_KEY`; webhook → `https://api.<dominio>/billing/webhooks/revenuecat` con cabecera Authorization = `REVENUECAT_WEBHOOK_SECRET`; clave secreta de API → `REVENUECAT_SECRET_API_KEY` (restaurar compras verificadas).
4. Probar con sandbox de Apple / cuentas de prueba de Play y comprobar que `billing_events` registra los eventos.

## Verificación de edad en tiendas

Hoy: fecha de nacimiento obligatoria con bloqueo en servidor + clasificación 18+ + verificación opcional por selfie (no verifica edad legalmente). Apple bloquea apps 18+ a cuentas no adultas en AU/BR/SG (desde feb-2026; México aún no) y ofrece la Declared Age Range API; Google exige "Restrict Minor Access". El decreto mexicano de entornos digitales seguros (DOF 14-oct-2026) exige evaluar verificación de edad no autodeclarada: **requiere revisión legal**. Proveedores y costos en `docs/seguridad.md`.
