import { useEffect, useState } from "react";
import { api, ApiError } from "../api";

interface Unanswered {
  id: number;
  session_id: string | null;
  question: string;
  created_at: string;
  resolved: number;
}

interface Proposal {
  id: number;
  question: string;
  proposed_answer: string;
  status: "pending" | "approved" | "rejected";
  origin: string;
  created_at: string;
}

interface BotStatus {
  provider: string;
  model: string;
  configured: boolean;
}

export function BotOps() {
  const [unanswered, setUnanswered] = useState<Unanswered[] | null>(null);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [stats, setStats] = useState<{ sessions: number; messages: number; retentionDays: number } | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [newProposal, setNewProposal] = useState({ question: "", proposedAnswer: "" });
  const [error, setError] = useState<string | null>(null);

  function loadAll() {
    api.get<Unanswered[]>("/api/admin/bot/unanswered").then(setUnanswered);
    api.get<Proposal[]>("/api/admin/bot/proposals?status=pending").then(setProposals);
    api.get<BotStatus>("/api/admin/bot/status").then(setStatus);
    api.get("/api/admin/bot/conversations/stats").then(setStats as any);
  }

  useEffect(loadAll, []);

  async function review(id: number, action: "approve" | "reject", editedAnswer?: string) {
    setError(null);
    try {
      await api.post(`/api/admin/bot/proposals/${id}/review`, { action, editedAnswer });
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo procesar la revisión.");
    }
  }

  async function createProposalFromQuestion(question: string) {
    const answer = window.prompt(`Escribe la respuesta aprobada para:\n"${question}"`);
    if (!answer) return;
    await api.post("/api/admin/bot/proposals", { question, proposedAnswer: answer });
    loadAll();
  }

  async function submitManualProposal() {
    if (!newProposal.question.trim() || !newProposal.proposedAnswer.trim()) return;
    await api.post("/api/admin/bot/proposals", newProposal);
    setNewProposal({ question: "", proposedAnswer: "" });
    loadAll();
  }

  async function purgeConversations() {
    if (!stats) return;
    if (!window.confirm(`¿Eliminar conversaciones con más de ${stats.retentionDays} días de antigüedad?`)) return;
    await api.post("/api/admin/bot/conversations/purge", { olderThanDays: stats.retentionDays });
    loadAll();
  }

  return (
    <div>
      {status && (
        <p className={status.configured ? "contact__feedback--success" : "contact__feedback--error"}>
          Proveedor: {status.provider} · Modelo: {status.model} ·{" "}
          {status.configured ? "Configurado correctamente." : "Sin clave de API configurada (el bot muestra un aviso honesto a los visitantes)."}
        </p>
      )}
      {stats && (
        <p>
          Sesiones registradas: {stats.sessions} · Mensajes: {stats.messages} · Retención configurada:{" "}
          {stats.retentionDays} días{" "}
          <button className="btn btn--secondary btn--sm" onClick={purgeConversations} type="button">
            Purgar conversaciones vencidas
          </button>
        </p>
      )}
      {error && <p className="contact__feedback--error">{error}</p>}

      <details open className="admin-panel">
        <summary>Preguntas que el bot no pudo responder ({unanswered?.filter((u) => !u.resolved).length ?? 0})</summary>
        <div className="admin-panel__body">
          {unanswered === null && <p className="state-loading">Cargando…</p>}
          {unanswered !== null && unanswered.filter((u) => !u.resolved).length === 0 && (
            <p className="state-empty">No hay preguntas pendientes de revisión.</p>
          )}
          <ul className="unanswered-list">
            {unanswered
              ?.filter((u) => !u.resolved)
              .map((u) => (
                <li key={u.id}>
                  <span>{u.question}</span>
                  <button className="btn btn--secondary btn--sm" onClick={() => createProposalFromQuestion(u.question)} type="button">
                    Proponer respuesta
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </details>

      <details open className="admin-panel">
        <summary>Propuestas pendientes de aprobación ({proposals?.length ?? 0})</summary>
        <div className="admin-panel__body">
          {proposals !== null && proposals.length === 0 && <p className="state-empty">No hay propuestas pendientes.</p>}
          {proposals?.map((p) => (
            <div key={p.id} className="card proposal-card">
              <p>
                <strong>Pregunta:</strong> {p.question}
              </p>
              <textarea
                rows={3}
                value={drafts[p.id] ?? p.proposed_answer}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
              />
              <div className="content-editor__toolbar">
                <button className="btn btn--primary btn--sm" onClick={() => review(p.id, "approve", drafts[p.id])} type="button">
                  Aprobar
                </button>
                <button className="btn btn--secondary btn--sm" onClick={() => review(p.id, "reject")} type="button">
                  Rechazar
                </button>
              </div>
            </div>
          ))}

          <h4>Agregar propuesta manual</h4>
          <div className="field">
            <label>Pregunta</label>
            <input value={newProposal.question} onChange={(e) => setNewProposal((n) => ({ ...n, question: e.target.value }))} />
          </div>
          <div className="field">
            <label>Respuesta propuesta</label>
            <textarea value={newProposal.proposedAnswer} onChange={(e) => setNewProposal((n) => ({ ...n, proposedAnswer: e.target.value }))} />
          </div>
          <button className="btn btn--secondary btn--sm" onClick={submitManualProposal} type="button">
            Guardar como propuesta
          </button>
        </div>
      </details>
    </div>
  );
}
