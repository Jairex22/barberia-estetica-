import { useState } from "react";
import { api } from "../api";
import { ContentEditor } from "./ContentEditor";
import { Leads } from "./Leads";
import { BotOps } from "./BotOps";
import { AccountSettings } from "./AccountSettings";

type Tab = "contenido" | "leads" | "bot" | "cuenta";

const TABS: { id: Tab; label: string }[] = [
  { id: "contenido", label: "Contenido del sitio" },
  { id: "leads", label: "Solicitudes" },
  { id: "bot", label: "Asistente virtual" },
  { id: "cuenta", label: "Mi cuenta" },
];

export function Dashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("contenido");

  async function handleLogout() {
    await api.post("/api/auth/logout", undefined, false).catch(() => {});
    onLogout();
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <strong>ClickFlow Digital — Panel de administración</strong>
        <div className="admin-shell__header-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
            Ver sitio
          </a>
          <button className="btn btn--secondary btn--sm" onClick={handleLogout} type="button">
            Cerrar sesión ({email})
          </button>
        </div>
      </header>

      <nav className="admin-shell__tabs" aria-label="Secciones del panel">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-shell__tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="admin-shell__content">
        {tab === "contenido" && <ContentEditor />}
        {tab === "leads" && <Leads />}
        {tab === "bot" && <BotOps />}
        {tab === "cuenta" && <AccountSettings email={email} />}
      </main>
    </div>
  );
}
