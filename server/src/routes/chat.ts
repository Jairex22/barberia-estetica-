import { Router } from "express";
import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { env } from "../env.js";
import { getContent } from "../lib/content.js";
import { searchKnowledge } from "../lib/knowledge.js";
import { askAssistant, isAiConfigured, type ChatTurn } from "../lib/ai.js";

export const chatRouter = Router();

const CHAT_COOKIE = "cf.chat";
const BOOKING_KEYWORDS = /\b(cita|agendar|agenda|reservar|apartar|disponibilidad para|horario para)\b/i;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Estás enviando mensajes muy rápido. Espera un momento." },
});

function getOrCreateSession(req: any, res: any): string {
  let sessionId = req.cookies?.[CHAT_COOKIE] as string | undefined;
  const existing = sessionId
    ? db.prepare("SELECT id FROM chat_sessions WHERE id = ?").get(sessionId)
    : null;

  if (!sessionId || !existing) {
    sessionId = crypto.randomBytes(18).toString("hex");
    db.prepare("INSERT INTO chat_sessions (id) VALUES (?)").run(sessionId);
    res.cookie(CHAT_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.cookieSecure,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }
  return sessionId;
}

chatRouter.get("/bootstrap", (req, res) => {
  const sessionId = getOrCreateSession(req, res);
  const content = getContent("published");
  const session = db
    .prepare("SELECT message_count FROM chat_sessions WHERE id = ?")
    .get(sessionId) as { message_count: number } | undefined;
  const history = db
    .prepare(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT 50"
    )
    .all(sessionId) as ChatTurn[];

  res.json({
    aiAvailable: isAiConfigured(),
    welcomeMessage: content?.bot.welcomeMessage || "Hola, ¿en qué puedo ayudarte?",
    suggestedQuestions: content?.bot.suggestedQuestions || [],
    disclosureText: content?.bot.disclosureText || "",
    humanHandoffText: content?.bot.humanHandoffText || "",
    whatsapp: content?.business.whatsapp || "",
    remainingMessages: Math.max(
      0,
      env.aiMaxMessagesPerSession - (session?.message_count || 0)
    ),
    history,
  });
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(env.aiMaxInputChars),
});

chatRouter.post("/message", chatLimiter, async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: `Mensaje inválido. Máximo ${env.aiMaxInputChars} caracteres.`,
    });
  }

  const sessionId = getOrCreateSession(req, res);
  const content = getContent("published");
  if (!content) {
    return res.status(503).json({ error: "El sitio aún no tiene contenido publicado." });
  }

  const session = db
    .prepare("SELECT message_count FROM chat_sessions WHERE id = ?")
    .get(sessionId) as { message_count: number };

  if (session.message_count >= env.aiMaxMessagesPerSession) {
    return res.status(429).json({
      error: "Has alcanzado el límite de mensajes para esta conversación.",
      humanHandoffText: content.bot.humanHandoffText,
    });
  }

  const todayCount = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM chat_messages WHERE role = 'user' AND created_at > datetime('now', '-1 day')"
      )
      .get() as { c: number }
  ).c;
  if (todayCount >= env.aiGlobalDailyMessageLimit) {
    return res.status(503).json({
      error:
        "El asistente alcanzó su límite de uso por hoy. Por favor contáctanos directamente.",
      humanHandoffText: content.bot.humanHandoffText,
    });
  }

  const userMessage = parsed.data.message;

  db.prepare("INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)").run(
    sessionId,
    userMessage
  );
  db.prepare(
    "UPDATE chat_sessions SET message_count = message_count + 1, last_active_at = datetime('now') WHERE id = ?"
  ).run(sessionId);

  const isBookingRequest = BOOKING_KEYWORDS.test(userMessage);
  if (isBookingRequest) {
    db.prepare(
      "INSERT INTO leads (name, phone, email, service, message, status, source) VALUES (?, ?, ?, ?, ?, 'nuevo', 'bot')"
    ).run(
      "Visitante del asistente virtual",
      content.business.whatsapp,
      null,
      null,
      `Solicitud de cita detectada por el asistente (pendiente de confirmación): "${userMessage}"`
    );
  }

  const knowledge = searchKnowledge(userMessage);

  if (!isAiConfigured()) {
    db.prepare(
      "INSERT INTO bot_unanswered (session_id, question) VALUES (?, ?)"
    ).run(sessionId, userMessage);
    const fallback =
      "El asistente de inteligencia artificial no está disponible en este momento (falta configuración del proveedor). " +
      "Puedes revisar las Preguntas frecuentes o contactarnos directamente por WhatsApp para recibir ayuda de una persona del equipo.";
    db.prepare(
      "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)"
    ).run(sessionId, fallback);
    return res.json({
      reply: fallback,
      aiAvailable: false,
      isBookingRequest,
      humanHandoffText: content.bot.humanHandoffText,
    });
  }

  if (knowledge.length === 0) {
    db.prepare(
      "INSERT INTO bot_unanswered (session_id, question) VALUES (?, ?)"
    ).run(sessionId, userMessage);
  }

  const historyRows = db
    .prepare(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT 12"
    )
    .all(sessionId) as ChatTurn[];
  const history = historyRows.reverse();

  try {
    const reply = await askAssistant({
      business: content.business,
      bot: content.bot,
      knowledge,
      history,
      maxTokens: env.aiMaxTokensResponse,
    });

    const finalReply =
      reply ||
      "No pude generar una respuesta en este momento. Por favor contáctanos directamente para ayudarte mejor.";

    db.prepare(
      "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)"
    ).run(sessionId, finalReply);

    res.json({
      reply: finalReply,
      aiAvailable: true,
      isBookingRequest,
      humanHandoffText: content.bot.humanHandoffText,
    });
  } catch (err) {
    console.error("Error al consultar el proveedor de IA:", err);
    const fallback =
      "Tuvimos un problema técnico al conectar con el asistente de inteligencia artificial. " +
      "Puedes revisar las Preguntas frecuentes o escribirnos directamente por WhatsApp.";
    db.prepare(
      "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)"
    ).run(sessionId, fallback);
    res.status(502).json({
      reply: fallback,
      aiAvailable: false,
      isBookingRequest,
      humanHandoffText: content.bot.humanHandoffText,
    });
  }
});
