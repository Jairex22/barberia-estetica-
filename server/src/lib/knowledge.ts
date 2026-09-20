import { db } from "../db.js";
import type { SiteContent } from "../types.js";

// Reconstruye la base de conocimiento publicada (usada por el bot) a partir
// del contenido publicado + propuestas aprobadas. Se ejecuta en cada
// publicacion y en cada aprobacion de propuesta, para que el bot nunca
// consulte informacion no aprobada.
export function rebuildKnowledgeFromContent(content: SiteContent) {
  const deleteAll = db.prepare(
    "DELETE FROM knowledge_chunks WHERE source_type != 'proposal'"
  );
  const insert = db.prepare(
    "INSERT INTO knowledge_chunks (source_type, source_id, title, content) VALUES (?, ?, ?, ?)"
  );

  const run = db.transaction(() => {
    deleteAll.run();

    insert.run(
      "business",
      "info",
      "Informacion general del negocio",
      [
        `Nombre: ${content.business.name}`,
        `Giro: ${content.business.giro}`,
        `Ciudad y zona de atencion: ${content.business.city}, ${content.business.zone}`,
        `Direccion: ${content.business.address}`,
        `Horarios: ${content.business.hours}`,
        `Telefono: ${content.business.phone}`,
        `WhatsApp: ${content.business.whatsapp}`,
        `Correo: ${content.business.email}`,
      ].join("\n")
    );

    for (const s of content.services) {
      insert.run(
        "service",
        s.id,
        `Servicio: ${s.name}`,
        [
          `Nombre: ${s.name}`,
          `Descripcion: ${s.description}`,
          s.price ? `Precio: ${s.price}` : `Precio: consultar cotizacion, no publicado`,
          s.durationMinutes ? `Duracion aproximada: ${s.durationMinutes} minutos` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
    }

    for (const p of content.packages) {
      insert.run(
        "package",
        p.id,
        `Paquete: ${p.name}`,
        [
          `Nombre: ${p.name}`,
          `Descripcion: ${p.description}`,
          `Incluye: ${p.features.join(", ")}`,
          p.requestQuoteOnly || !p.price
            ? "Precio: solo mediante cotizacion, no publicado"
            : `Precio: ${p.price}`,
        ].join("\n")
      );
    }

    for (const f of content.faqs) {
      if (!f.includeInBot) continue;
      insert.run("faq", f.id, f.question, `Pregunta: ${f.question}\nRespuesta: ${f.answer}`);
    }

    insert.run(
      "policy",
      "privacidad",
      "Politica de privacidad",
      content.privacy.body
    );
  });
  run();
}

// Incorpora una propuesta aprobada al conocimiento del bot, disponible de
// inmediato para consultas posteriores sin necesidad de redeploy.
export function addApprovedProposalToKnowledge(id: number, question: string, answer: string) {
  db.prepare(
    "INSERT INTO knowledge_chunks (source_type, source_id, title, content) VALUES ('proposal', ?, ?, ?)"
  ).run(String(id), question, `Pregunta: ${question}\nRespuesta aprobada: ${answer}`);
}

export function removeProposalFromKnowledge(id: number) {
  db.prepare("DELETE FROM knowledge_chunks WHERE source_type = 'proposal' AND source_id = ?").run(
    String(id)
  );
}

export interface KnowledgeMatch {
  title: string;
  content: string;
  rank: number;
}

function sanitizeFtsQuery(raw: string): string {
  const tokens = raw
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 12);
  if (tokens.length === 0) return "";
  return tokens.map((t) => `${t}*`).join(" OR ");
}

export function searchKnowledge(query: string, limit = 6): KnowledgeMatch[] {
  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery) return [];
  try {
    const rows = db
      .prepare(
        `SELECT k.title as title, k.content as content, bm25(knowledge_fts) as rank
         FROM knowledge_fts f
         JOIN knowledge_chunks k ON k.id = f.rowid
         WHERE knowledge_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(ftsQuery, limit) as KnowledgeMatch[];
    return rows;
  } catch {
    return [];
  }
}
