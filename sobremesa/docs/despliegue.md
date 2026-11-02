# Despliegue

## Topología recomendada (económica)

- **API**: contenedor Node 22 (`apps/api`, `node dist/server.js`) en Fly.io, Render o Railway (≈USD 5–15/mes). Variables de `.env.example`. Escalar a 2 instancias es seguro (tiempo real coordinado por NOTIFY).
- **PostgreSQL 16**: Neon o Supabase (solo Postgres) o el Postgres del mismo proveedor (≈USD 0–25/mes). Respaldos automáticos activados.
- **Web**: Vercel (plan Pro para uso comercial, USD 20/asiento) o el mismo proveedor del API. Variables `API_INTERNAL_URL` y `NEXT_PUBLIC_API_URL`.
- **Archivos**: Cloudflare R2 (`STORAGE_PROVIDER=s3`, USD 0.015/GB, sin salida).
- **Correo**: Resend (`EMAIL_PROVIDER=resend`), dominio verificado con SPF/DKIM/DMARC.
- **Dominio**: `sobremesa.mx` o `.app` (no verificado). Subdominios: `app.` (web) y `api.` (API). HTTPS automático del proveedor.
- **Observabilidad**: Sentry (gratuito 5k errores), logs del proveedor, `GET /health` para monitor externo (UptimeRobot).

## Pasos

1. Crear BD y ejecutar `DATABASE_URL=... pnpm --filter @sobremesa/api db:migrate` y `db:seed:kb`.
2. Configurar variables del API: `NODE_ENV=production`, `APP_ORIGIN=https://app.<dominio>`, `API_PUBLIC_URL=https://api.<dominio>`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`, secretos aleatorios de 32+ caracteres, proveedores según `docs/servicios-externos.md`. **Nunca** `DEMO_MODE=true` ni `DEV_MAILBOX=true` en producción.
3. Cookies entre `app.` y `api.`: la web habla con el API a través del proxy `/api/*` de Next (mismo origen), así que no hace falta `Domain` en la cookie. El WebSocket usa ticket, no cookie.
4. Desplegar API; verificar `/health`. Desplegar web; verificar login.
5. Configurar webhooks de Stripe/RevenueCat/Mercado Pago apuntando a `api.<dominio>`.
6. Crear el primer admin (`UPDATE users SET role='admin' ...`).
7. Activar monitor de `/health`, respaldos y alertas de errores.
8. Antes de abrir registro público: lista de verificación legal (`docs/seguridad.md`) y de pagos (`docs/pagos.md`).

## Dockerfile de referencia (API)

```Dockerfile
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN CI=true pnpm install --frozen-lockfile --filter @sobremesa/api... 
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @sobremesa/shared build && pnpm --filter @sobremesa/api build
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
```
(No probado en esta sesión: Docker no estaba disponible.)
