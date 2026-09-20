import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { getContent } from "../lib/content.js";

export const publicRouter = Router();

publicRouter.get("/content", (_req, res) => {
  const content = getContent("published");
  if (!content) return res.status(404).json({ error: "Sitio no configurado todavía." });
  res.json(content);
});

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
});

const leadSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre completo.").max(150),
  phone: z.string().trim().min(7, "Ingresa un teléfono válido.").max(30),
  email: z.string().trim().email("Correo inválido.").max(200).optional().or(z.literal("")),
  service: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Cuéntanos brevemente qué necesitas.").max(2000),
  // honeypot anti-spam: debe llegar vacío
  website: z.string().max(0).optional().or(z.literal("")),
});

publicRouter.post("/contact", contactLimiter, (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Datos inválidos." });
  }
  const { name, phone, email, service, message } = parsed.data;

  const info = db
    .prepare(
      "INSERT INTO leads (name, phone, email, service, message, source) VALUES (?, ?, ?, ?, ?, 'formulario')"
    )
    .run(name, phone, email || null, service || null, message);

  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});
