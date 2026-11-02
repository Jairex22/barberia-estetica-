# Sobremesa — app de citas para México (web + iOS/Android)

> **Estado honesto (2 de noviembre de 2026):** proyecto funcional en entorno local con pruebas automatizadas. **No está publicado**, no cobra dinero real y no tiene credenciales de proveedores externos. Lo que está implementado, probado, pendiente y bloqueado se detalla en [`ESTADO.md`](./ESTADO.md) y en [`docs/informe-pruebas.md`](./docs/informe-pruebas.md).

Sobremesa es una app de citas para mayores de 18 años, pensada para conocer personas con intención real a partir de planes concretos. Web responsive (Next.js), app móvil Android/iOS (Expo / React Native) y un API (Fastify + PostgreSQL) compartido: misma cuenta, perfil, conexiones, conversaciones y suscripción en todos los canales.

Reglas que el producto hace cumplir **en el servidor**: solo mayores de 18; entre una mujer y un hombre, ella envía el primer mensaje (Premium no lo cambia); sin perfiles falsos, likes inventados ni bots románticos; toda IA visible se identifica como IA; datos de demostración marcados y aislados de producción.

---

## 1. Estructura del repositorio

```
sobremesa/
├── apps/api/        API Fastify 5 + Drizzle ORM + PostgreSQL 16 (auth, perfiles, descubrir, chat WebSocket, pagos, asistente IA, admin, jobs)
├── apps/web/        Web Next.js 16 (App Router) + Tailwind 4: app de usuario, Premium, Ayuda y panel /admin
├── apps/mobile/     App Expo SDK 58 (React Native 0.88, expo-router): Android e iOS
├── packages/shared/ Contratos zod, reglas de negocio (quién inicia, edad, distancia), textos es/en
├── docs/            Producto, arquitectura, pagos, tiendas, seguridad, operación, lanzamiento, pruebas, modelo económico
├── research/        Informes de investigación con fuentes (competidores, demografía, pagos, legal/costos)
├── .env.example     Todas las variables, sin secretos
└── ESTADO.md        Decisiones, avances, comandos ejecutados y pendientes para continuar
```

## 2. Requisitos (Windows 10/11)

| Herramienta | Versión | Cómo instalarla |
|---|---|---|
| Node.js | 22.12 o superior (LTS) | https://nodejs.org → instalador Windows (.msi). Verifica con `node -v`. |
| pnpm | 10.x | En PowerShell: `corepack enable` y luego `corepack prepare pnpm@10.28.0 --activate` (o `npm i -g pnpm@10`). |
| PostgreSQL | 16 | https://www.postgresql.org/download/windows/ (instalador EDB). Anota la contraseña del usuario `postgres`. Alternativa: Docker Desktop con `docker run --name sobremesa-pg -e POSTGRES_PASSWORD=citas -e POSTGRES_USER=citas -e POSTGRES_DB=citas -p 5432:5432 -d postgres:16`. |
| Git | reciente | https://git-scm.com/download/win |
| Visual Studio Code | reciente | https://code.visualstudio.com. Extensiones recomendadas: ESLint, Tailwind CSS IntelliSense, Prisma/Drizzle no requerido. |
| (Móvil) Expo Go o Android Studio | — | Para probar en tu teléfono instala **Expo Go**; para emulador instala Android Studio y un dispositivo virtual. iOS requiere macOS + Xcode (ver `docs/tiendas.md`). |

## 3. Abrir el proyecto en Visual Studio Code

1. Descomprime el ZIP (o clona el repositorio) en una ruta corta sin espacios, p. ej. `C:\dev\sobremesa`.
2. Abre VS Code → **Archivo → Abrir carpeta…** → selecciona `C:\dev\sobremesa`.
3. Abre la terminal integrada (**Ctrl+ñ** o **Terminal → Nueva terminal**). Usa PowerShell.
4. Si PowerShell bloquea scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## 4. Instalación (una vez)

```powershell
pnpm install
```

Crea la base de datos (si instalaste PostgreSQL con el instalador; con Docker ya existe):

```powershell
psql -U postgres -c "CREATE ROLE citas WITH LOGIN PASSWORD 'citas';"
psql -U postgres -c "CREATE DATABASE citas OWNER citas;"
psql -U postgres -c "CREATE DATABASE citas_test OWNER citas;"
```

Variables de entorno: copia `.env.example` a `apps\api\.env` (sección API) y a `apps\web\.env.local` (sección Web). Para desarrollo basta con los valores por defecto; **cambia `COOKIE_SECRET` y `MEDIA_SIGNING_SECRET`** por cadenas aleatorias largas.

```powershell
Copy-Item .env.example apps\api\.env
Copy-Item .env.example apps\web\.env.local
```

Aplica migraciones y carga la base de conocimiento del asistente:

```powershell
pnpm db:migrate
pnpm --filter @sobremesa/api db:seed:kb
```

Opcional, **solo para demostración local** (perfiles marcados "Demostración", visibles únicamente con `DEMO_MODE=true`):

```powershell
$env:DEMO_MODE="true"; pnpm db:seed:demo
```

## 5. Desarrollo

```powershell
pnpm dev
```

- Web: http://localhost:3000 · API: http://localhost:4000 (salud en `/health`).
- Los correos (verificación, recuperación) se imprimen en la terminal del API (proveedor `console`). Con `DEV_MAILBOX=true` también puedes verlos en http://localhost:4000/dev/outbox.
- Para ver perfiles de demostración en Descubrir, arranca el API con `DEMO_MODE=true` (nunca en producción).
- Primer administrador: regístrate en la web y luego ejecuta en psql: `UPDATE users SET role='admin' WHERE email='tu@correo';`. El panel está en http://localhost:3000/admin.

App móvil (en otra terminal):

```powershell
Copy-Item .env.example apps\mobile\.env
pnpm dev:mobile
```

Escanea el QR con Expo Go. Ajusta `EXPO_PUBLIC_API_URL` en `apps\mobile\.env` a la IP de tu PC en la red local (p. ej. `http://192.168.1.20:4000`) para dispositivo físico, o `http://10.0.2.2:4000` para emulador Android. Nota: `react-native-purchases` requiere un *development build* (`pnpm --filter @sobremesa/mobile android`), no funciona en Expo Go; sin él la pantalla Premium muestra "compra no disponible" de forma honesta.

## 6. Pruebas

```powershell
pnpm test                     # unitarias (shared) + integración del API contra PostgreSQL (citas_test)
pnpm --filter @sobremesa/web build
pnpm --filter @sobremesa/web start      # en una terminal
pnpm --filter @sobremesa/web exec playwright install chromium   # una vez
pnpm test:e2e                 # recorridos E2E en 360/390/768/1440 px (requiere API con DEV_MAILBOX=true y RATE_LIMIT_ALLOWLIST=127.0.0.1,::1,::ffff:127.0.0.1)
pnpm load:test                # prueba de carga reproducible (200 usuarios, 60 s) contra el API local
```

Detalle de qué se probó y en qué entorno: `docs/informe-pruebas.md`.

## 7. Compilación

```powershell
pnpm build                                   # shared + API (dist/) + web (.next/)
pnpm --filter @sobremesa/mobile build:android:preview   # APK con EAS (requiere cuenta Expo y `eas login`; ver docs/tiendas.md)
```

## 8. Documentación

| Documento | Contenido |
|---|---|
| `ESTADO.md` | Decisiones, avances, comandos ejecutados, pendientes y punto de continuación |
| `docs/investigacion-nichos.md` | Mapa de 14 nichos, matriz ponderada, sensibilidad, elección provisional e hipótesis |
| `research/*.md` | Informes con fuentes (URL, fecha, región, método, confianza) |
| `docs/modelo-economico.xlsx` / `.md` | Modelo editable con fórmulas: neto por suscriptor, escenarios, sensibilidad, 12 meses |
| `docs/marca.md` | Nombres propuestos, selección provisional, identidad visual |
| `docs/producto.md` | Funciones, Free vs Premium, reglas, estados de interfaz, automatizaciones |
| `docs/arquitectura.md` | Decisiones técnicas, módulos, modelo de datos, tiempo real |
| `docs/pagos.md` | Stripe, Mercado Pago, RevenueCat, webhooks, idempotencia, requisitos de producción |
| `docs/tiendas.md` | App Store y Google Play: reglas, edad 18+, compilación, firma, publicación |
| `docs/asistente-ia.md` | Diseño del asistente, herramientas, límites, costos, defensas |
| `docs/seguridad.md` | Controles, privacidad, retención, borrado, avisos legales (qué requiere abogado) |
| `docs/operacion.md` | Panel, moderación, horas semanales, respaldos y restauración |
| `docs/despliegue.md` | Infraestructura, dominio, correo, variables, migraciones, respaldos |
| `docs/servicios-externos.md` | Cada servicio: para qué, costo, cómo obtener credenciales |
| `docs/lanzamiento-30-60-90.md` | Plan, experimentos, presupuesto, métricas y criterios de continuar/cambiar/parar |
| `docs/informe-pruebas.md` | Qué se probó, dónde, resultados, carga, problemas pendientes |

## 9. Licencias

Código propio bajo la licencia que elijas (sugerido: propietaria para el producto; ver `LICENSE` pendiente). Dependencias de terceros bajo sus licencias (MIT/Apache en su mayoría). Las imágenes de demostración son generadas por código (sin personas reales). No incluye fotografías de stock: para la landing final usa imágenes propias o con licencia (ver `docs/marca.md`).
