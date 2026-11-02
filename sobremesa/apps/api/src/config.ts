import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgres://citas:citas@127.0.0.1:5432/citas'),
  APP_ORIGIN: z.string().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().default('http://localhost:4000'),
  COOKIE_SECRET: z.string().min(16).default('dev-only-cookie-secret-change-me'),
  COOKIE_SECURE: bool.default(false),
  SESSION_TTL_DAYS: z.coerce.number().default(30),
  TRUST_PROXY: bool.default(false),
  /** IPs exentas de límite de tasa (solo desarrollo/pruebas E2E), separadas por coma. */
  RATE_LIMIT_ALLOWLIST: z.string().default(''),
  /** Política para combinaciones mixtas de género (ver packages/shared rules/initiation.ts). */
  INITIATION_POLICY_MIXED: z.enum(['either', 'non_man_first']).default('either'),
  DEMO_MODE: bool.default(false),
  /** Buzón de desarrollo: expone los correos enviados por el proveedor 'console' en GET /dev/outbox. Nunca en producción. */
  DEV_MAILBOX: bool.default(false),

  EMAIL_PROVIDER: z.enum(['console', 'resend', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default('Sobremesa <no-reply@localhost>'),
  RESEND_API_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage/private'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  MEDIA_SIGNING_SECRET: z.string().min(16).default('dev-only-media-secret-change-me'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MXN: z.string().optional(),
  STRIPE_PRICE_PREMIUM_USD: z.string().optional(),

  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  MP_PREMIUM_AMOUNT_MXN: z.coerce.number().default(199),

  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  REVENUECAT_SECRET_API_KEY: z.string().optional(),

  PREMIUM_PRICE_MXN_MINOR: z.coerce.number().default(19900),
  PREMIUM_PRICE_USD_MINOR: z.coerce.number().default(999),

  ANTHROPIC_API_KEY: z.string().optional(),
  ASSISTANT_MODEL: z.string().default('claude-haiku-5-5'),
  ASSISTANT_MAX_OUTPUT_TOKENS: z.coerce.number().default(600),
  ASSISTANT_TIMEOUT_MS: z.coerce.number().default(20000),
  ASSISTANT_DAILY_MSGS_PER_USER: z.coerce.number().default(30),
  ASSISTANT_MONTHLY_BUDGET_USD: z.coerce.number().default(20),
  /** Precios por millón de tokens para contabilizar costo (actualizar con docs oficiales). */
  ASSISTANT_PRICE_IN_PER_MTOK_USD: z.coerce.number().default(0.1),
  ASSISTANT_PRICE_OUT_PER_MTOK_USD: z.coerce.number().default(0.5),
  VOYAGE_API_KEY: z.string().optional(),

  IMAGE_MODERATION_PROVIDER: z.enum(['none', 'sightengine']).default('none'),
  SIGHTENGINE_USER: z.string().optional(),
  SIGHTENGINE_SECRET: z.string().optional(),

  JOBS_ENABLED: bool.default(true),
  DELETED_ACCOUNT_RETENTION_DAYS: z.coerce.number().default(30),
  LOG_LEVEL: z.string().default('info'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error('Configuración inválida: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const cfg = parsed.data;
  if (cfg.NODE_ENV === 'production') {
    const weak: string[] = [];
    if (cfg.COOKIE_SECRET.startsWith('dev-only')) weak.push('COOKIE_SECRET');
    if (cfg.MEDIA_SIGNING_SECRET.startsWith('dev-only')) weak.push('MEDIA_SIGNING_SECRET');
    if (weak.length) throw new Error('Secretos de desarrollo en producción: ' + weak.join(', '));
  }
  return cfg;
}

export const config = loadConfig();
