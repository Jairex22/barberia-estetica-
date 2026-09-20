# ClickFlow Digital — Plantilla de sitio profesional para negocios locales

Sitio web profesional, reutilizable y personalizable para vender a negocios
locales, con panel de administración, base de datos persistente (SQLite) y
un asistente virtual conectado a una API real de inteligencia artificial
(Anthropic / Claude).

Este repositorio incluye una **instalación de demostración ficticia**
llamada **"NOVA Detailing"** (estética automotriz en Guadalajara). Todo el
contenido de demostración está marcado como tal y puede sustituirse por
completo desde `/admin`, sin tocar código.

---

## 1. Qué incluye este entregable (y qué no)

**Implementado y verificado en este entorno:**

- Sitio público de una página con exactamente 10 secciones ancladas
  (`#inicio`, `#nosotros`, `#servicios`, `#beneficios`, `#proceso`,
  `#galeria`, `#opiniones`, `#precios`, `#preguntas`, `#contacto`),
  navegación fija con resaltado de sección activa, menú "Más" en escritorio
  y menú móvil accesible.
- Panel `/admin` con autenticación real (correo + contraseña, sesiones
  HttpOnly, hash de contraseña con bcrypt, bloqueo tras intentos fallidos,
  CSRF, límite de tasa en login).
- Edición completa del contenido (negocio, tema/colores, tipografías, SEO,
  secciones visibles/orden, hero, nosotros, servicios, beneficios, proceso,
  galería, testimonios, paquetes/precios, preguntas frecuentes, textos del
  bot, aviso de privacidad), con **borrador privado** y **publicación**
  explícita. Los cambios persisten en SQLite y sobreviven a reinicios del
  servidor, sin necesidad de recompilar.
- Subida de imágenes (JPG/PNG/WebP, máx. 5 MB) desde el panel.
- Formulario de contacto/cotización funcional, con validación, límite de
  envíos y honeypot anti-spam, guardado en SQLite y visible en `/admin`.
- Asistente virtual (bot) conectado a la API de Anthropic (Claude) mediante
  el SDK oficial, con:
  - Recuperación de información (RAG) usando búsqueda de texto completo
    (SQLite FTS5) sobre el conocimiento **aprobado y publicado**
    (servicios, paquetes, preguntas frecuentes, datos del negocio,
    política de privacidad).
  - Memoria de conversación por sesión de visitante (aislada entre
    visitantes mediante cookie httpOnly anónima), sin mezclar sesiones.
  - Flujo de mejora controlada: preguntas sin respuesta y propuestas de
    conocimiento quedan pendientes hasta que el administrador las aprueba;
    solo entonces se usan en respuestas futuras (sin redeploy).
  - Límites de mensajes por sesión y por día, límite de caracteres de
    entrada, aviso de uso de IA antes del primer envío, detección simple de
    solicitudes de cita (quedan registradas como "pendiente de
    confirmación" en las solicitudes).
  - **Si falta la clave de API o el proveedor falla, el bot lo indica de
    forma honesta** y ofrece FAQ/contacto humano — nunca simula una
    respuesta.
- SEO editable (título, descripción, Open Graph), `robots.txt` (bloquea
  `/admin`), `sitemap.xml`, favicon.
- Aviso de privacidad base editable, con lista explícita de campos legales
  pendientes de completar por el negocio real.
- Diseño responsive verificado en 360, 390, 768, 1280 y 1440 px, con
  soporte de `prefers-reduced-motion`, foco visible y navegación por
  teclado.

**No incluido / pendiente antes de un lanzamiento real (ver sección 10):**

- Fotografías reales del negocio (se usan ilustraciones SVG generadas como
  marcador de posición, ver `LICENCIAS.md`).
- Redacción final revisada por el dueño del negocio (los textos de NOVA
  Detailing son de demostración).
- Clave real de `ANTHROPIC_API_KEY` (sin ella, el bot muestra un aviso
  honesto en vez de inventar respuestas).
- Dominio, certificado HTTPS y alojamiento con almacenamiento persistente
  reales (ver sección 8).
- Aviso de privacidad legal completo (quedan campos marcados como
  pendientes, ver panel `/admin` → Aviso de privacidad).
- Medición real de rendimiento en el hosting final (Lighthouse/Web Vitals):
  no se reportan cifras de rendimiento en producción porque no se han
  medido en un hosting real.

---

## 2. Arquitectura

```
/                     — raíz del monorepo (npm workspaces)
├── server/           — API en Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/   — auth, admin, public, chat
│   │   ├── lib/      — contenido, conocimiento (RAG/FTS5), IA (Anthropic)
│   │   ├── middleware/
│   │   ├── demoContent.ts   — datos de demostración NOVA Detailing
│   │   └── types.ts
│   ├── migrations/   — SQL versionado (se aplica automáticamente al iniciar)
│   ├── public-media/demo/   — ilustraciones SVG de demostración
│   ├── data/         — base de datos SQLite (persistente, no se sube a git)
│   └── uploads/      — imágenes subidas desde /admin (persistente)
└── web/              — frontend en React + TypeScript + Vite
    └── src/
        ├── components/   — secciones públicas del sitio
        ├── admin/        — panel de administración (SPA)
        ├── context/       — estado del contenido publicado
        └── styles/
```

- **Un solo origen**: en producción, Express sirve tanto la API (`/api/*`)
  como el build estático del frontend, evitando problemas de CORS/cookies.
- **Persistencia**: SQLite vía `better-sqlite3`, con modo WAL. Las
  migraciones en `server/migrations/*.sql` se aplican automáticamente al
  iniciar el servidor (`npm run migrate` para ejecutarlas manualmente).
- **Sesiones**: `express-session` con almacenamiento en SQLite
  (`connect-sqlite3`), cookies `HttpOnly`, `SameSite=Lax` y `Secure` en
  producción (`COOKIE_SECURE=true`).
- **Contenido**: se guarda como un documento estructurado con dos estados,
  `draft` (privado) y `published` (público). "Publicar" copia el borrador
  a la versión pública y reconstruye el índice de conocimiento del bot.

---

## 3. Requisitos

- Node.js 20 o superior (probado con Node 22).
- npm 10 o superior.
- Sistema de archivos persistente para `server/data/` y `server/uploads/`
  (ver sección 8; **no usar un filesystem efímero en producción**).

---

## 4. Instalación y ejecución (desarrollo)

```bash
# 1. Instalar dependencias de ambos workspaces
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env: define ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD,
# SESSION_SECRET (una cadena larga y aleatoria) y, si tienes una,
# ANTHROPIC_API_KEY.
# IMPORTANTE: si tu contraseña incluye "#", enciérrala entre comillas dobles.

# 3. Crear la base de datos, aplicar migraciones, cargar datos de
#    demostración y crear el primer administrador
npm run seed

# 4. Levantar backend y frontend en paralelo (dos terminales)
npm run dev:server   # http://localhost:4000 (API)
npm run dev:web      # http://localhost:5173 (sitio, con proxy a la API)
```

Abre `http://localhost:5173` para el sitio público y
`http://localhost:5173/admin` para el panel (usa el correo/contraseña que
configuraste en `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`).

### Generar una clave de sesión segura

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 5. Compilación y ejecución en producción

```bash
npm run build   # compila el frontend (web/dist) y el backend (server/dist)
npm run start   # sirve la API y el frontend compilado en un solo proceso
```

Variables recomendadas en producción (ver `.env.example`):

```
NODE_ENV=production
COOKIE_SECURE=true
SESSION_SECRET=<cadena larga y aleatoria, distinta a la de desarrollo>
DATABASE_PATH=/ruta/persistente/app.sqlite
UPLOADS_PATH=/ruta/persistente/uploads
PUBLIC_URL=https://tudominio.com
```

El servidor debe ejecutarse detrás de HTTPS (terminación TLS en el propio
proceso o en un proxy/balanceador delante de él) para que las cookies
`Secure` funcionen correctamente.

---

## 6. Manual breve: editar y publicar desde el navegador

1. Entra a `https://tudominio.com/admin` e inicia sesión.
2. En **"Contenido del sitio"**, edita cualquier sección (negocio, tema,
   textos, servicios, precios, galería, testimonios, preguntas frecuentes,
   bot, privacidad). Los cambios se guardan como **borrador privado** al
   presionar **"Guardar borrador"**.
3. Usa **"Vista previa privada"** para revisar el borrador dentro del
   propio panel (nunca se expone públicamente).
4. Cuando estés conforme, presiona **"Publicar cambios"**: el sitio público
   se actualiza de inmediato, sin recompilar ni reiniciar el servidor.
5. En **"Solicitudes"** puedes ver y marcar como "Nuevo / En seguimiento /
   Atendido" cada solicitud de cotización o contacto.
6. En **"Asistente virtual"** puedes:
   - Ver si el proveedor de IA está configurado.
   - Revisar preguntas que el bot no pudo responder y convertirlas en
     propuestas de respuesta.
   - Aprobar, editar o rechazar propuestas antes de que el bot las use.
   - Purgar conversaciones más antiguas que el periodo de retención
     configurado (`AI_CONVERSATION_RETENTION_DAYS`).
7. En **"Mi cuenta"** puedes cambiar tu contraseña.

---

## 7. Reutilizar este proyecto con otro cliente

Este proyecto está diseñado para clonarse una vez por cliente, reutilizando
el mismo código:

1. Crea una nueva instalación (nuevo servidor/contenedor, o una nueva
   carpeta de despliegue) a partir de este mismo código fuente.
2. Crea un `.env` propio para ese cliente: nuevo `SESSION_SECRET`, nuevas
   credenciales de administrador, su propia `DATABASE_PATH`/`UPLOADS_PATH`,
   y su propia `ANTHROPIC_API_KEY` (o compártela si así lo decides
   comercialmente, controlando límites de uso por instalación).
3. Ejecuta `npm run seed` para esa instalación: crea su base de datos y su
   primer administrador (seguirá mostrando el contenido de demostración
   NOVA Detailing hasta que el administrador lo reemplace).
4. Desde `/admin`, reemplaza: nombre, logo, colores, tipografías, textos,
   servicios, precios, galería, testimonios, preguntas frecuentes, textos
   del bot y aviso de privacidad — todo sin tocar código.
5. Cada instalación tiene su propia base de datos SQLite, sus propias
   imágenes subidas y sus propias conversaciones del bot: **no comparten
   datos entre sí**.

---

## 8. Alojamiento, HTTPS y almacenamiento persistente

- **SQLite requiere disco persistente.** No despliegues `server/data/` ni
  `server/uploads/` en un filesystem efímero (por ejemplo, contenedores
  que se reinician sin volumen montado): se perdería todo el contenido
  publicado, las solicitudes y las conversaciones del bot.
- Opciones razonables: una VPS con disco persistente, un contenedor con un
  volumen persistente montado en `server/data` y `server/uploads`, o un
  servicio de hosting que ofrezca almacenamiento en disco persistente.
- HTTPS es obligatorio en producción para que `COOKIE_SECURE=true` tenga
  efecto y las sesiones/cookies viajen protegidas.
- Este entregable **no incluye una prueba en el hosting definitivo**: se
  verificó exclusivamente en este entorno de desarrollo (ver sección 10).

---

## 9. Respaldo, restauración y recuperación de acceso

### Respaldo

La base de datos es un único archivo SQLite. Para respaldar en caliente sin
corromper datos (el servidor usa modo WAL):

```bash
sqlite3 server/data/app.sqlite ".backup 'respaldo-$(date +%Y%m%d).sqlite'"
```

Respalda también la carpeta `server/uploads/` (imágenes subidas por el
administrador).

### Restauración

1. Detén el servidor.
2. Sustituye `server/data/app.sqlite` (y los archivos `-wal`/`-shm` si
   existen, eliminándolos) por el archivo de respaldo.
3. Restaura la carpeta `server/uploads/`.
4. Vuelve a iniciar el servidor (`npm run start`).

### Recuperación de acceso de administrador

Si se pierde la contraseña del único administrador:

```bash
node -e "
const bcrypt = require('server/node_modules/bcryptjs');
const Database = require('server/node_modules/better-sqlite3');
const db = new Database('server/data/app.sqlite');
const hash = bcrypt.hashSync('NuevaContraseñaTemporal#2026', 12);
db.prepare('UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE email = ?')
  .run(hash, 'correo-del-admin@ejemplo.com');
console.log('Contraseña restablecida.');
"
```

Cambia esa contraseña temporal desde `/admin` → "Mi cuenta" en cuanto
inicies sesión.

---

## 10. Pruebas realizadas en este entorno

Verificado manualmente en este entorno de desarrollo (ver detalle de cada
punto en el historial de este proyecto):

- ✅ Navegación por las 10 secciones mediante anclas, menú móvil y menú
  "Más" en escritorio, con resaltado de sección activa.
- ✅ Diseño revisado visualmente en 360, 390, 768, 1280 y 1440 px sin
  desplazamiento horizontal.
- ✅ Flujo completo de edición → guardar borrador → publicar → verificado
  vía API que el cambio quedó público → **reinicio completo del proceso
  del servidor → el cambio publicado persiste** (SQLite).
- ✅ Bloqueo de operaciones administrativas sin sesión (401) y sin token
  CSRF (403), verificado con solicitudes HTTP directas.
- ✅ Formulario de contacto: guarda la solicitud en SQLite y aparece en el
  panel de "Solicitudes".
- ✅ Bot: sin `ANTHROPIC_API_KEY` configurada, responde con un aviso
  honesto (no simula una respuesta) y registra la pregunta como "sin
  responder".
- ✅ Botón de WhatsApp y widget de chat conviven sin superponerse, en
  escritorio y móvil.
- ✅ Compilación de producción (`npm run build`) y arranque
  (`npm run start`) sirviendo frontend y API bajo el mismo origen.

**No verificado en este entorno** (requiere credenciales o infraestructura
que no están disponibles aquí):

- ⏳ Respuestas reales del asistente con una `ANTHROPIC_API_KEY` válida
  (el código sigue la documentación oficial del SDK de Anthropic; el
  flujo de RAG, límites y registro de "no respondidas" si están
  verificados, pero la generación de texto real del modelo no se probó
  con una clave real).
- ⏳ Comportamiento en el hosting/dominio/HTTPS definitivos.
- ⏳ Métricas de rendimiento (Lighthouse/Web Vitals) en producción real.

---

## 11. Costos (estimados, para presentar al cliente)

**Costo inicial (una sola vez):**

- Desarrollo/personalización del sitio a partir de esta plantilla: desde
  **$5,000 MXN**, según cantidad de servicios, fotografías propias,
  ajustes de diseño y contenido a redactar.

**Gastos recurrentes (aproximados, variables según proveedor y tráfico):**

- Dominio (.com/.mx): ~$200–$400 MXN/año.
- Hosting con almacenamiento persistente (VPS pequeño o equivalente):
  ~$100–$400 MXN/mes.
- API de inteligencia artificial (Anthropic): consumo variable según
  volumen de conversaciones; para un negocio pequeño con los límites por
  defecto de este proyecto (30 mensajes por sesión, 500 mensajes globales
  al día, respuestas cortas), el costo mensual esperado es bajo, pero debe
  monitorearse en el panel de Anthropic ya que depende directamente del
  uso real.

Estas cifras son estimaciones para cotización; deben confirmarse con los
proveedores reales elegidos por cada cliente.

---

## 12. Seguridad — resumen de lo implementado

- Contraseñas con hash `bcrypt` (12 rondas), nunca en texto plano.
- Sesiones de administrador: cookies `HttpOnly`, `SameSite=Lax`, `Secure`
  en producción, expiración de 4 horas con renovación en cada actividad.
- Protección CSRF (token de sesión validado en cada operación de
  escritura del panel).
- Límite de intentos de login (bloqueo temporal tras 8 intentos fallidos)
  y límite de tasa en `/api/auth/login`.
- Validación de entradas con `zod` en todos los endpoints que reciben
  datos del cliente.
- Consultas parametrizadas (better-sqlite3 con placeholders `?`, sin
  concatenación de SQL).
- Subida de archivos restringida por tipo MIME/extensión (JPG/PNG/WebP) y
  tamaño (5 MB), con nombres de archivo generados por el servidor.
- Claves de IA y secretos de sesión solo en variables de entorno del
  servidor; nunca se envían al frontend.
- El asistente de IA tiene acceso de solo lectura al contenido **publicado
  y aprobado**; no tiene permisos administrativos ni puede modificar el
  sitio.
- Reglas del sistema del bot explícitamente protegidas contra instrucciones
  de visitantes o contenido citado que intenten cambiarlas.
- `/admin` y `/api/admin` excluidos de `robots.txt` y protegidos por
  autenticación en el backend (no solo ocultos en el frontend).
- `.env.example` sin credenciales reales; `.env` real excluido de git.

---

## 13. Créditos e imágenes

Ver `LICENCIAS.md` para el origen y licencia de las imágenes de
demostración (ilustraciones SVG generadas para este proyecto, no
fotografías de stock ni del negocio real).
