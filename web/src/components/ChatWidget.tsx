import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api";

interface BootstrapResponse {
  aiAvailable: boolean;
  welcomeMessage: string;
  suggestedQuestions: string[];
  disclosureText: string;
  humanHandoffText: string;
  whatsapp: string;
  remainingMessages: number;
  history: { role: "user" | "assistant"; content: string }[];
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatWidget({ businessName }: { businessName: string }) {
  const [open, setOpen] = useState(false);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [disclosureShown, setDisclosureShown] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || bootstrap) return;
    api
      .get<BootstrapResponse>("/api/chat/bootstrap")
      .then((data) => {
        setBootstrap(data);
        setDisclosureShown(data.history.length > 0);
        if (data.history.length > 0) {
          setMessages(data.history);
        } else {
          setMessages([{ role: "assistant", content: data.welcomeMessage }]);
        }
      })
      .catch(() => setLoadError("No se pudo cargar el asistente. Intenta más tarde."));
  }, [open, bootstrap]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setDisclosureShown(true);
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<{
        reply: string;
        aiAvailable: boolean;
        humanHandoffText: string;
      }>("/api/chat/message", { message: trimmed });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Ocurrió un error de conexión con el asistente.";
      setMessages((m) => [...m, { role: "system", content: msg }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar asistente virtual" : "Abrir asistente virtual"}
      >
        <span aria-hidden="true">{open ? "✕" : "💬 IA"}</span>
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label={`Asistente virtual de ${businessName}`}>
          <header className="chat-panel__header">
            <strong>Asistente virtual</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
              ✕
            </button>
          </header>

          {loadError && <p className="state-error">{loadError}</p>}

          {!loadError && (
            <>
              <div className="chat-panel__messages" ref={listRef}>
                {!disclosureShown && bootstrap?.disclosureText && (
                  <p className="chat-panel__disclosure">{bootstrap.disclosureText}</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
                    {m.content}
                  </div>
                ))}
                {sending && (
                  <div className="chat-bubble chat-bubble--assistant chat-bubble--typing" aria-live="polite">
                    Escribiendo…
                  </div>
                )}
                {bootstrap && !bootstrap.aiAvailable && messages.length <= 1 && (
                  <p className="chat-panel__notice">
                    El asistente de IA no está disponible en este momento. Puedes usar las preguntas
                    frecuentes o contactarnos directamente.
                  </p>
                )}
              </div>

              {bootstrap && bootstrap.suggestedQuestions.length > 0 && messages.length <= 1 && (
                <div className="chat-panel__suggestions">
                  {bootstrap.suggestedQuestions.map((q) => (
                    <button key={q} type="button" onClick={() => sendMessage(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="chat-panel__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
              >
                <label htmlFor="chat-input" className="visually-hidden">
                  Escribe tu mensaje
                </label>
                <input
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={800}
                  placeholder="Escribe tu pregunta…"
                  disabled={sending}
                />
                <button type="submit" className="btn btn--primary btn--sm" disabled={sending || !input.trim()}>
                  Enviar
                </button>
              </form>

              {bootstrap?.humanHandoffText && (
                <p className="chat-panel__handoff">{bootstrap.humanHandoffText}</p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
