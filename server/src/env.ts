import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Raiz del repositorio, calculada a partir de este archivo (server/src o
// server/dist) en lugar de process.cwd(): npm workspaces ejecuta los scripts
// con cwd=server/, lo que rompe rutas relativas basadas en el directorio
// de trabajo (ej. "./server/data/..." se duplicaria en "server/server/data").
const repoRoot = path.resolve(__dirname, "..", "..");
const repoRootEnv = path.join(repoRoot, ".env");
dotenv.config({ path: fs.existsSync(repoRootEnv) ? repoRootEnv : undefined });

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH || "./server/data/app.sqlite";
  const resolved = path.isAbsolute(configured) ? configured : path.resolve(repoRoot, configured);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

function resolveUploadsPath(): string {
  const configured = process.env.UPLOADS_PATH || "./server/uploads";
  const resolved = path.isAbsolute(configured) ? configured : path.resolve(repoRoot, configured);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  publicUrl: process.env.PUBLIC_URL || "http://localhost:4000",
  databasePath: resolveDbPath(),
  uploadsPath: resolveUploadsPath(),
  sessionSecret: process.env.SESSION_SECRET || "",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  adminBootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || "",
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || "",
  aiProvider: process.env.AI_PROVIDER || "anthropic",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  aiModel: process.env.AI_MODEL || "claude-haiku-4-5-20251001",
  aiMaxMessagesPerSession: Number(process.env.AI_MAX_MESSAGES_PER_SESSION || 30),
  aiMaxInputChars: Number(process.env.AI_MAX_INPUT_CHARS || 800),
  aiMaxTokensResponse: Number(process.env.AI_MAX_TOKENS_RESPONSE || 500),
  aiGlobalDailyMessageLimit: Number(process.env.AI_GLOBAL_DAILY_MESSAGE_LIMIT || 500),
  aiConversationRetentionDays: Number(process.env.AI_CONVERSATION_RETENTION_DAYS || 30),
  defaultWhatsapp: process.env.DEFAULT_WHATSAPP_NUMBER || "",
};

if (env.isProd && (!env.sessionSecret || env.sessionSecret.length < 16)) {
  throw new Error(
    "SESSION_SECRET debe estar configurado con un valor largo y aleatorio en produccion."
  );
}
