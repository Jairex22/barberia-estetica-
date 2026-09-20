import { useSite } from "../context/SiteContext";

export function PrivacyPage() {
  const { content, loading, error } = useSite();

  if (loading) return <div className="state-loading">Cargando…</div>;
  if (error || !content) return <div className="state-error">{error}</div>;

  return (
    <main className="container legal-page">
      <a href="/">← Volver al sitio</a>
      <h1>{content.privacy.title}</h1>
      <p style={{ whiteSpace: "pre-line" }}>{content.privacy.body}</p>
      {content.privacy.pendingFields.length > 0 && (
        <>
          <h2>Datos pendientes de completar por el negocio</h2>
          <ul>
            {content.privacy.pendingFields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
