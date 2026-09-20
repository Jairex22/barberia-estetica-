import { useEffect, useState, type ReactNode } from "react";
import type { SiteContent, SectionToggle } from "../types";
import { api, ApiError } from "../api";
import { ImageUploadField } from "./ImageUploadField";
import { ListEditor, newId } from "./ListEditor";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function ContentEditor() {
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api
      .get<SiteContent>("/api/admin/content/draft")
      .then(setDraft)
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/api/admin/content/draft", draft);
      setMessage({ type: "success", text: "Borrador guardado." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Error al guardar." });
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!draft) return;
    setPublishing(true);
    setMessage(null);
    try {
      await api.put("/api/admin/content/draft", draft);
      await api.post("/api/admin/content/publish");
      setMessage({ type: "success", text: "Sitio publicado. Los cambios ya están en vivo." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Error al publicar." });
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <p className="state-loading">Cargando contenido…</p>;
  if (!draft) return <p className="state-error">No se pudo cargar el borrador.</p>;

  return (
    <div className="content-editor">
      <div className="content-editor__toolbar">
        <button className="btn btn--secondary" onClick={() => setShowPreview((v) => !v)} type="button">
          {showPreview ? "Ocultar vista previa" : "Vista previa privada"}
        </button>
        <button className="btn btn--secondary" onClick={saveDraft} disabled={saving} type="button">
          {saving ? "Guardando…" : "Guardar borrador"}
        </button>
        <button className="btn btn--primary" onClick={publish} disabled={publishing} type="button">
          {publishing ? "Publicando…" : "Publicar cambios"}
        </button>
      </div>
      {message && (
        <p className={message.type === "success" ? "contact__feedback--success" : "contact__feedback--error"}>
          {message.text}
        </p>
      )}

      {showPreview && (
        <p className="preview-note">
          La vista previa usa el borrador actual y solo es visible aquí, dentro del panel. El
          sitio público sigue mostrando la última versión publicada hasta que hagas clic en
          "Publicar cambios".
        </p>
      )}

      <details open className="admin-panel">
        <summary>Negocio, marca y SEO</summary>
        <div className="admin-panel__body">
          <Field label="Nombre del negocio">
            <input value={draft.business.name} onChange={(e) => update("business", { ...draft.business, name: e.target.value })} />
          </Field>
          <Field label="Giro">
            <input value={draft.business.giro} onChange={(e) => update("business", { ...draft.business, giro: e.target.value })} />
          </Field>
          <Field label="Ciudad">
            <input value={draft.business.city} onChange={(e) => update("business", { ...draft.business, city: e.target.value })} />
          </Field>
          <Field label="Zona de atención">
            <input value={draft.business.zone} onChange={(e) => update("business", { ...draft.business, zone: e.target.value })} />
          </Field>
          <Field label="Público objetivo">
            <textarea value={draft.business.audience} onChange={(e) => update("business", { ...draft.business, audience: e.target.value })} />
          </Field>
          <Field label="WhatsApp (con código de país, solo números)">
            <input value={draft.business.whatsapp} onChange={(e) => update("business", { ...draft.business, whatsapp: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input value={draft.business.phone} onChange={(e) => update("business", { ...draft.business, phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <input value={draft.business.email} onChange={(e) => update("business", { ...draft.business, email: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <input value={draft.business.address} onChange={(e) => update("business", { ...draft.business, address: e.target.value })} />
          </Field>
          <Field label="Horarios">
            <input value={draft.business.hours} onChange={(e) => update("business", { ...draft.business, hours: e.target.value })} />
          </Field>
          <Field label="Enlace al mapa">
            <input value={draft.business.mapUrl} onChange={(e) => update("business", { ...draft.business, mapUrl: e.target.value })} />
          </Field>
          <ImageUploadField
            label="Logotipo"
            value={draft.business.logoUrl}
            onChange={(url) => update("business", { ...draft.business, logoUrl: url })}
          />
          <Field label="Este sitio es una demostración">
            <label className="switch">
              <input
                type="checkbox"
                checked={draft.business.isDemo}
                onChange={(e) => update("business", { ...draft.business, isDemo: e.target.checked })}
              />
              Mostrar aviso de contenido de demostración
            </label>
          </Field>
          <Field label="Acción principal del sitio">
            <select value={draft.primaryAction} onChange={(e) => update("primaryAction", e.target.value as SiteContent["primaryAction"])}>
              <option value="cotizar">Cotizar</option>
              <option value="agendar">Agendar</option>
              <option value="contactar">Contactar</option>
            </select>
          </Field>

          <h4>Colores</h4>
          <div className="color-grid">
            {(
              [
                ["colorBg", "Fondo"],
                ["colorSurface", "Superficie / tarjetas"],
                ["colorText", "Texto"],
                ["colorPrimary", "Primario"],
                ["colorPrimaryDark", "Primario oscuro"],
                ["colorAccent", "Acento"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="color"
                  value={draft.theme[key]}
                  onChange={(e) => update("theme", { ...draft.theme, [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <Field label="Fuente de títulos">
            <input value={draft.theme.fontHeading} onChange={(e) => update("theme", { ...draft.theme, fontHeading: e.target.value })} />
          </Field>
          <Field label="Fuente de texto">
            <input value={draft.theme.fontBody} onChange={(e) => update("theme", { ...draft.theme, fontBody: e.target.value })} />
          </Field>

          <h4>SEO</h4>
          <Field label="Título (pestaña del navegador)">
            <input value={draft.seo.title} onChange={(e) => update("seo", { ...draft.seo, title: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <textarea value={draft.seo.description} onChange={(e) => update("seo", { ...draft.seo, description: e.target.value })} />
          </Field>
          <ImageUploadField label="Imagen para redes (Open Graph)" value={draft.seo.ogImageUrl} onChange={(url) => update("seo", { ...draft.seo, ogImageUrl: url })} />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Secciones: mostrar, ocultar y ordenar</summary>
        <div className="admin-panel__body">
          <SectionsManager sections={draft.sections} onChange={(sections) => update("sections", sections)} />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Inicio (Hero)</summary>
        <div className="admin-panel__body">
          <Field label="Texto superior (eyebrow)">
            <input value={draft.hero.eyebrow} onChange={(e) => update("hero", { ...draft.hero, eyebrow: e.target.value })} />
          </Field>
          <Field label="Título principal">
            <input value={draft.hero.title} onChange={(e) => update("hero", { ...draft.hero, title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <textarea value={draft.hero.subtitle} onChange={(e) => update("hero", { ...draft.hero, subtitle: e.target.value })} />
          </Field>
          <ImageUploadField label="Imagen principal" value={draft.hero.imageUrl} onChange={(url) => update("hero", { ...draft.hero, imageUrl: url })} />
          <Field label="Botón primario">
            <input value={draft.hero.ctaPrimaryLabel} onChange={(e) => update("hero", { ...draft.hero, ctaPrimaryLabel: e.target.value })} />
          </Field>
          <Field label="Botón secundario">
            <input value={draft.hero.ctaSecondaryLabel} onChange={(e) => update("hero", { ...draft.hero, ctaSecondaryLabel: e.target.value })} />
          </Field>
        </div>
      </details>

      <details className="admin-panel">
        <summary>Nosotros</summary>
        <div className="admin-panel__body">
          <Field label="Título">
            <input value={draft.about.title} onChange={(e) => update("about", { ...draft.about, title: e.target.value })} />
          </Field>
          <Field label="Historia">
            <textarea rows={4} value={draft.about.story} onChange={(e) => update("about", { ...draft.about, story: e.target.value })} />
          </Field>
          <Field label="Enfoque">
            <textarea rows={3} value={draft.about.approach} onChange={(e) => update("about", { ...draft.about, approach: e.target.value })} />
          </Field>
          <ImageUploadField label="Imagen" value={draft.about.imageUrl} onChange={(url) => update("about", { ...draft.about, imageUrl: url })} />
          <ListEditor
            title="Elementos de confianza (cifras verificables)"
            items={draft.about.trustPoints.map((tp, i) => ({ id: String(i), ...tp }))}
            onChange={(items) => update("about", { ...draft.about, trustPoints: items.map(({ id: _id, ...rest }) => rest) })}
            createNew={() => ({ id: newId("trust"), label: "Nueva métrica", value: "0" })}
            itemLabel={(i) => `${i.value} — ${i.label}`}
            maxItems={6}
            renderItem={(item, upd) => (
              <>
                <Field label="Valor (ej. 6, 1200+, 4.8/5)">
                  <input value={item.value} onChange={(e) => upd({ value: e.target.value })} />
                </Field>
                <Field label="Descripción corta">
                  <input value={item.label} onChange={(e) => upd({ label: e.target.value })} />
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Servicios</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Catálogo de servicios"
            items={draft.services}
            onChange={(items) => update("services", items)}
            createNew={() => ({
              id: newId("svc"),
              name: "Nuevo servicio",
              description: "",
              imageUrl: "",
              price: null,
              durationMinutes: null,
            })}
            itemLabel={(i) => i.name}
            renderItem={(item, upd) => (
              <>
                <Field label="Nombre">
                  <input value={item.name} onChange={(e) => upd({ name: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <textarea value={item.description} onChange={(e) => upd({ description: e.target.value })} />
                </Field>
                <ImageUploadField label="Imagen" value={item.imageUrl} onChange={(url) => upd({ imageUrl: url })} />
                <Field label="Precio (vacío = 'Solicitar cotización')">
                  <input value={item.price ?? ""} onChange={(e) => upd({ price: e.target.value || null })} />
                </Field>
                <Field label="Duración aproximada (minutos)">
                  <input
                    type="number"
                    value={item.durationMinutes ?? ""}
                    onChange={(e) => upd({ durationMinutes: e.target.value ? Number(e.target.value) : null })}
                  />
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Beneficios</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Diferenciadores"
            items={draft.benefits}
            onChange={(items) => update("benefits", items)}
            createNew={() => ({ id: newId("ben"), title: "Nuevo beneficio", description: "", icon: "check" })}
            itemLabel={(i) => i.title}
            maxItems={12}
            renderItem={(item, upd) => (
              <>
                <Field label="Título">
                  <input value={item.title} onChange={(e) => upd({ title: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <textarea value={item.description} onChange={(e) => upd({ description: e.target.value })} />
                </Field>
                <Field label="Ícono">
                  <select value={item.icon} onChange={(e) => upd({ icon: e.target.value })}>
                    {["shield", "check", "truck", "clipboard", "star", "clock"].map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Cómo trabajamos (proceso)</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Pasos (entre 3 y 5)"
            items={draft.process}
            onChange={(items) => update("process", items)}
            createNew={() => ({ id: newId("step"), title: "Nuevo paso", description: "" })}
            itemLabel={(i, idx) => `${idx + 1}. ${i.title}`}
            minItems={3}
            maxItems={5}
            renderItem={(item, upd) => (
              <>
                <Field label="Título">
                  <input value={item.title} onChange={(e) => upd({ title: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <textarea value={item.description} onChange={(e) => upd({ description: e.target.value })} />
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Galería</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Trabajos"
            items={draft.gallery}
            onChange={(items) => update("gallery", items)}
            createNew={() => ({ id: newId("gal"), imageUrl: "", category: "General", caption: "" })}
            itemLabel={(i) => i.caption || i.category}
            renderItem={(item, upd) => (
              <>
                <ImageUploadField label="Imagen" value={item.imageUrl} onChange={(url) => upd({ imageUrl: url })} />
                <Field label="Categoría">
                  <input value={item.category} onChange={(e) => upd({ category: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <input value={item.caption} onChange={(e) => upd({ caption: e.target.value })} />
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Opiniones</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Testimonios"
            items={draft.testimonials}
            onChange={(items) => update("testimonials", items)}
            createNew={() => ({ id: newId("test"), name: "Nombre (Demostración)", quote: "", rating: 5, isDemo: true })}
            itemLabel={(i) => i.name}
            renderItem={(item, upd) => (
              <>
                <Field label="Nombre">
                  <input value={item.name} onChange={(e) => upd({ name: e.target.value })} />
                </Field>
                <Field label="Testimonio">
                  <textarea value={item.quote} onChange={(e) => upd({ quote: e.target.value })} />
                </Field>
                <Field label="Calificación (1-5)">
                  <input type="number" min={1} max={5} value={item.rating} onChange={(e) => upd({ rating: Number(e.target.value) })} />
                </Field>
                <Field label="Es un ejemplo de demostración (no real)">
                  <label className="switch">
                    <input type="checkbox" checked={item.isDemo} onChange={(e) => upd({ isDemo: e.target.checked })} />
                    Marcar como demostración
                  </label>
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Paquetes y precios</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Paquetes"
            items={draft.packages}
            onChange={(items) => update("packages", items)}
            createNew={() => ({
              id: newId("pkg"),
              name: "Nuevo paquete",
              description: "",
              price: null,
              requestQuoteOnly: true,
              features: [],
              highlighted: false,
            })}
            itemLabel={(i) => i.name}
            maxItems={10}
            renderItem={(item, upd) => (
              <>
                <Field label="Nombre">
                  <input value={item.name} onChange={(e) => upd({ name: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <textarea value={item.description} onChange={(e) => upd({ description: e.target.value })} />
                </Field>
                <Field label="Solo mostrar 'Solicitar cotización' (sin precio fijo)">
                  <label className="switch">
                    <input type="checkbox" checked={item.requestQuoteOnly} onChange={(e) => upd({ requestQuoteOnly: e.target.checked })} />
                    Ocultar precio
                  </label>
                </Field>
                {!item.requestQuoteOnly && (
                  <Field label="Precio (ej. $1,800 MXN)">
                    <input value={item.price ?? ""} onChange={(e) => upd({ price: e.target.value })} />
                  </Field>
                )}
                <Field label="Incluye (una línea por elemento)">
                  <textarea
                    rows={3}
                    value={item.features.join("\n")}
                    onChange={(e) => upd({ features: e.target.value.split("\n").filter(Boolean) })}
                  />
                </Field>
                <Field label="Destacar este paquete">
                  <label className="switch">
                    <input type="checkbox" checked={item.highlighted} onChange={(e) => upd({ highlighted: e.target.checked })} />
                    Marcar como más elegido
                  </label>
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Preguntas frecuentes</summary>
        <div className="admin-panel__body">
          <ListEditor
            title="Preguntas"
            items={draft.faqs}
            onChange={(items) => update("faqs", items)}
            createNew={() => ({ id: newId("faq"), question: "Nueva pregunta", answer: "", includeInBot: true })}
            itemLabel={(i) => i.question}
            renderItem={(item, upd) => (
              <>
                <Field label="Pregunta">
                  <input value={item.question} onChange={(e) => upd({ question: e.target.value })} />
                </Field>
                <Field label="Respuesta">
                  <textarea value={item.answer} onChange={(e) => upd({ answer: e.target.value })} />
                </Field>
                <Field label="Usar como conocimiento del asistente virtual">
                  <label className="switch">
                    <input type="checkbox" checked={item.includeInBot} onChange={(e) => upd({ includeInBot: e.target.checked })} />
                    Incluir en el bot
                  </label>
                </Field>
              </>
            )}
          />
        </div>
      </details>

      <details className="admin-panel">
        <summary>Asistente virtual (bot)</summary>
        <div className="admin-panel__body">
          <Field label="Mensaje de bienvenida">
            <textarea value={draft.bot.welcomeMessage} onChange={(e) => update("bot", { ...draft.bot, welcomeMessage: e.target.value })} />
          </Field>
          <Field label="Tono">
            <input value={draft.bot.tone} onChange={(e) => update("bot", { ...draft.bot, tone: e.target.value })} />
          </Field>
          <Field label="Preguntas sugeridas (una por línea, máx. 8)">
            <textarea
              rows={4}
              value={draft.bot.suggestedQuestions.join("\n")}
              onChange={(e) => update("bot", { ...draft.bot, suggestedQuestions: e.target.value.split("\n").filter(Boolean).slice(0, 8) })}
            />
          </Field>
          <Field label="Texto de aviso de IA (antes del primer envío)">
            <textarea value={draft.bot.disclosureText} onChange={(e) => update("bot", { ...draft.bot, disclosureText: e.target.value })} />
          </Field>
          <Field label="Texto de contacto humano">
            <textarea value={draft.bot.humanHandoffText} onChange={(e) => update("bot", { ...draft.bot, humanHandoffText: e.target.value })} />
          </Field>
        </div>
      </details>

      <details className="admin-panel">
        <summary>Aviso de privacidad</summary>
        <div className="admin-panel__body">
          <Field label="Título">
            <input value={draft.privacy.title} onChange={(e) => update("privacy", { ...draft.privacy, title: e.target.value })} />
          </Field>
          <Field label="Contenido">
            <textarea rows={6} value={draft.privacy.body} onChange={(e) => update("privacy", { ...draft.privacy, body: e.target.value })} />
          </Field>
          <Field label="Campos pendientes (uno por línea)">
            <textarea
              rows={3}
              value={draft.privacy.pendingFields.join("\n")}
              onChange={(e) => update("privacy", { ...draft.privacy, pendingFields: e.target.value.split("\n").filter(Boolean) })}
            />
          </Field>
        </div>
      </details>

      <div className="content-editor__toolbar content-editor__toolbar--bottom">
        <button className="btn btn--secondary" onClick={saveDraft} disabled={saving} type="button">
          {saving ? "Guardando…" : "Guardar borrador"}
        </button>
        <button className="btn btn--primary" onClick={publish} disabled={publishing} type="button">
          {publishing ? "Publicando…" : "Publicar cambios"}
        </button>
      </div>
    </div>
  );
}

function SectionsManager({
  sections,
  onChange,
}: {
  sections: SectionToggle[];
  onChange: (sections: SectionToggle[]) => void;
}) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const next = sorted.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  }

  function toggleVisible(id: string) {
    onChange(sorted.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  }

  function toggleMore(id: string) {
    onChange(sorted.map((s) => (s.id === id ? { ...s, inMoreMenu: !s.inMoreMenu } : s)));
  }

  return (
    <ul className="sections-manager">
      {sorted.map((s, index) => (
        <li key={s.id} className="sections-manager__item">
          <span className="sections-manager__label">{s.label} <code>#{s.id}</code></span>
          <span className="sections-manager__controls">
            <button type="button" onClick={() => move(index, -1)} aria-label={`Mover ${s.label} arriba`}>↑</button>
            <button type="button" onClick={() => move(index, 1)} aria-label={`Mover ${s.label} abajo`}>↓</button>
            <label className="switch">
              <input type="checkbox" checked={s.visible} onChange={() => toggleVisible(s.id)} />
              Visible
            </label>
            <label className="switch">
              <input type="checkbox" checked={!!s.inMoreMenu} onChange={() => toggleMore(s.id)} />
              En "Más" (escritorio)
            </label>
          </span>
        </li>
      ))}
    </ul>
  );
}
