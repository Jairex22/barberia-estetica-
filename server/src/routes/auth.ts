import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth, requireCsrf } from "../middleware/requireAuth.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LOCK_THRESHOLD = 8;
const LOCK_MINUTES = 15;

authRouter.get("/csrf", (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  }
  res.json({ csrfToken: req.session.csrfToken });
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Correo o contraseña inválidos." });
  }
  const { email, password } = parsed.data;
  const admin = db
    .prepare(
      "SELECT id, email, password_hash, failed_attempts, locked_until FROM admins WHERE email = ?"
    )
    .get(email.toLowerCase().trim()) as
    | {
        id: number;
        email: string;
        password_hash: string;
        failed_attempts: number;
        locked_until: string | null;
      }
    | undefined;

  const genericError = { error: "Correo o contraseña incorrectos." };

  if (!admin) return res.status(401).json(genericError);

  if (admin.locked_until && new Date(admin.locked_until + "Z").getTime() > Date.now()) {
    return res.status(423).json({
      error: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta después de ${LOCK_MINUTES} minutos.`,
    });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    const attempts = admin.failed_attempts + 1;
    if (attempts >= LOCK_THRESHOLD) {
      const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        .toISOString()
        .slice(0, 19);
      db.prepare(
        "UPDATE admins SET failed_attempts = 0, locked_until = ? WHERE id = ?"
      ).run(lockUntil, admin.id);
    } else {
      db.prepare("UPDATE admins SET failed_attempts = ? WHERE id = ?").run(attempts, admin.id);
    }
    return res.status(401).json(genericError);
  }

  db.prepare(
    "UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?"
  ).run(admin.id);

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "No se pudo iniciar sesión." });
    req.session.adminEmail = admin.email;
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    db.prepare(
      "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'login', NULL)"
    ).run(admin.email);
    res.json({ email: admin.email, csrfToken: req.session.csrfToken });
  });
});

authRouter.post("/logout", requireAuth, (req, res) => {
  const email = req.session.adminEmail;
  req.session.destroy(() => {
    res.clearCookie("cf.sid");
    if (email) {
      db.prepare(
        "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'logout', NULL)"
      ).run(email);
    }
    res.json({ ok: true });
  });
});

authRouter.get("/me", (req, res) => {
  if (req.session.adminEmail) {
    return res.json({ authenticated: true, email: req.session.adminEmail });
  }
  res.json({ authenticated: false });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, "La nueva contraseña debe tener al menos 10 caracteres."),
});

authRouter.post("/change-password", requireAuth, requireCsrf, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Datos inválidos." });
  }
  const admin = db
    .prepare("SELECT id, password_hash FROM admins WHERE email = ?")
    .get(req.session.adminEmail) as { id: number; password_hash: string } | undefined;
  if (!admin) return res.status(401).json({ error: "No autenticado." });

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.password_hash);
  if (!valid) return res.status(400).json({ error: "La contraseña actual no es correcta." });

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  db.prepare("UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
    newHash,
    admin.id
  );
  db.prepare(
    "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'change_password', NULL)"
  ).run(req.session.adminEmail!);
  res.json({ ok: true });
});
