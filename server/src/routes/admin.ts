import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { env } from "../env.js";
import { requireAuth, requireCsrf } from "../middleware/requireAuth.js";
import { upload } from "../middleware/upload.js";
import { getContent, saveDraft, publishDraft } from "../lib/content.js";
import { siteContentSchema } from "../lib/contentSchema.js";
import {
  addApprovedProposalToKnowledge,
  removeProposalFromKnowledge,
} from "../lib/knowledge.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

// ---------- Contenido (borrador / publicación) ----------

adminRouter.get("/content/draft", (_req, res) => {
  const draft = getContent("draft");
  res.json(draft);
});

adminRouter.get("/content/published", (_req, res) => {
  res.json(getContent("published"));
});

adminRouter.put("/content/draft", requireCsrf, (req, res) => {
  const parsed = siteContentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Contenido inválido: " + (parsed.error.issues[0]?.message || ""),
      issues: parsed.error.issues.slice(0, 10),
    });
  }
  saveDraft(parsed.data);
  db.prepare(
    "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'save_draft', NULL)"
  ).run(req.session.adminEmail!);
  res.json({ ok: true });
});

adminRouter.post("/content/publish", requireCsrf, (req, res) => {
  try {
    const published = publishDraft();
    db.prepare(
      "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'publish', NULL)"
    ).run(req.session.adminEmail!);
    res.json({ ok: true, publishedAt: new Date().toISOString(), content: published });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "No se pudo publicar." });
  }
});

// ---------- Subida de imágenes ----------

adminRouter.post("/uploads", requireCsrf, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo." });
    res.json({ url: `/media/uploads/${req.file.filename}` });
  });
});

// ---------- Solicitudes de contacto (leads) ----------

adminRouter.get("/leads", (req, res) => {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : null;
  const rows = statusFilter
    ? db
        .prepare("SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC")
        .all(statusFilter)
    : db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
  res.json(rows);
});

const leadStatusSchema = z.object({
  status: z.enum(["nuevo", "seguimiento", "atendido"]),
});

adminRouter.patch("/leads/:id", requireCsrf, (req, res) => {
  const parsed = leadStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Estado inválido." });
  const result = db
    .prepare("UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(parsed.data.status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Solicitud no encontrada." });
  res.json({ ok: true });
});

// ---------- Bot: preguntas sin responder y propuestas ----------

adminRouter.get("/bot/unanswered", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM bot_unanswered WHERE resolved = 0 ORDER BY created_at DESC LIMIT 200")
    .all();
  res.json(rows);
});

adminRouter.get("/bot/proposals", (req, res) => {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : "pending";
  const rows = db
    .prepare("SELECT * FROM bot_proposals WHERE status = ? ORDER BY created_at DESC LIMIT 200")
    .all(statusFilter);
  res.json(rows);
});

const proposalSchema = z.object({
  question: z.string().trim().min(3).max(300),
  proposedAnswer: z.string().trim().min(3).max(2000),
});

adminRouter.post("/bot/proposals", requireCsrf, (req, res) => {
  const parsed = proposalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos." });
  const info = db
    .prepare(
      "INSERT INTO bot_proposals (question, proposed_answer, origin) VALUES (?, ?, 'manual')"
    )
    .run(parsed.data.question, parsed.data.proposedAnswer);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  editedAnswer: z.string().trim().max(2000).optional(),
});

adminRouter.post("/bot/proposals/:id/review", requireCsrf, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos." });
  const id = Number(req.params.id);
  const proposal = db.prepare("SELECT * FROM bot_proposals WHERE id = ?").get(id) as
    | { id: number; question: string; proposed_answer: string; status: string }
    | undefined;
  if (!proposal) return res.status(404).json({ error: "Propuesta no encontrada." });
  if (proposal.status !== "pending") {
    return res.status(400).json({ error: "Esta propuesta ya fue revisada." });
  }

  if (parsed.data.action === "approve") {
    const finalAnswer = parsed.data.editedAnswer?.trim() || proposal.proposed_answer;
    db.prepare(
      "UPDATE bot_proposals SET status = 'approved', proposed_answer = ?, reviewed_at = datetime('now') WHERE id = ?"
    ).run(finalAnswer, id);
    addApprovedProposalToKnowledge(id, proposal.question, finalAnswer);
    db.prepare(
      "UPDATE bot_unanswered SET resolved = 1 WHERE question = ? AND resolved = 0"
    ).run(proposal.question);
  } else {
    db.prepare(
      "UPDATE bot_proposals SET status = 'rejected', reviewed_at = datetime('now') WHERE id = ?"
    ).run(id);
    removeProposalFromKnowledge(id);
  }

  db.prepare(
    "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'review_proposal', ?)"
  ).run(req.session.adminEmail!, `${parsed.data.action}:${id}`);

  res.json({ ok: true });
});

// ---------- Conversaciones del bot: retención y borrado ----------

adminRouter.get("/bot/conversations/stats", (_req, res) => {
  const sessions = (
    db.prepare("SELECT COUNT(*) as c FROM chat_sessions").get() as { c: number }
  ).c;
  const messages = (
    db.prepare("SELECT COUNT(*) as c FROM chat_messages").get() as { c: number }
  ).c;
  res.json({ sessions, messages, retentionDays: env.aiConversationRetentionDays });
});

adminRouter.post("/bot/conversations/purge", requireCsrf, (req, res) => {
  const days = Number(req.body?.olderThanDays ?? env.aiConversationRetentionDays);
  const deleted = db
    .prepare("DELETE FROM chat_sessions WHERE last_active_at < datetime('now', ?)")
    .run(`-${days} days`);
  db.prepare(
    "INSERT INTO admin_audit_log (admin_email, action, detail) VALUES (?, 'purge_conversations', ?)"
  ).run(req.session.adminEmail!, `days=${days};deleted=${deleted.changes}`);
  res.json({ ok: true, deletedSessions: deleted.changes });
});

// ---------- Auditoría ----------

adminRouter.get("/audit-log", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 100")
    .all();
  res.json(rows);
});

// ---------- Estado del proveedor de IA ----------

adminRouter.get("/bot/status", (_req, res) => {
  res.json({
    provider: env.aiProvider,
    model: env.aiModel,
    configured: !!env.anthropicApiKey,
  });
});
