import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { runMigrations } from "./migrate.js";
import { initContentIfMissing } from "./lib/content.js";
import { demoContent } from "./demoContent.js";
import { getContent } from "./lib/content.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter } from "./routes/public.js";
import { chatRouter } from "./routes/chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

runMigrations();
initContentIfMissing(demoContent);

const app = express();
app.set("trust proxy", 1);

if (!env.isProd) {
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const SQLiteStore = SQLiteStoreFactory(session);
app.use(
  session({
    store: new SQLiteStore({
      db: path.basename(env.databasePath).replace(/\.sqlite$/, "") + ".sessions.sqlite",
      dir: path.dirname(env.databasePath),
    }) as any,
    name: "cf.sid",
    secret: env.sessionSecret || "dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 4, // 4 horas
    },
  })
);

// Medios: imagenes subidas por el administrador y medios de demostracion
app.use("/media/uploads", express.static(env.uploadsPath, { maxAge: "7d" }));
app.use(
  "/media/demo",
  express.static(path.resolve(__dirname, "..", "public-media", "demo"), { maxAge: "1d" })
);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/public", publicRouter);
app.use("/api/chat", chatRouter);

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Disallow: /admin", "Disallow: /api/admin", `Sitemap: ${env.publicUrl}/sitemap.xml`].join("\n")
  );
});

app.get("/sitemap.xml", (_req, res) => {
  const content = getContent("published");
  const sections = (content?.sections || []).filter((s) => s.visible).map((s) => s.id);
  const urls = [env.publicUrl, ...sections.map((id) => `${env.publicUrl}/#${id}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join("\n")}\n</urlset>`;
  res.type("application/xml").send(xml);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// En produccion, servir el build del frontend bajo el mismo origen
const webDist = path.resolve(__dirname, "..", "..", "web", "dist");
if (env.isProd && fs.existsSync(webDist)) {
  app.use(express.static(webDist, { maxAge: "1h", index: false }));
  app.get(/^(?!\/api|\/media).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(env.port, () => {
  console.log(`ClickFlow Digital — servidor escuchando en puerto ${env.port} (${env.nodeEnv})`);
});
