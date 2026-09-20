import { useState, type FormEvent } from "react";
import type { BusinessInfo } from "../types";
import { api, ApiError } from "../api";

type Status = "idle" | "loading" | "success" | "error";

export function Contact({ business }: { business: BusinessInfo }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      service: String(form.get("service") || ""),
      message: String(form.get("message") || ""),
      website: String(form.get("website") || ""),
    };
    try {
      await api.post("/api/public/contact", payload);
      setStatus("success");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? err.message : "No se pudo enviar tu solicitud.");
    }
  }

  const whatsappLink = business.whatsapp
    ? `https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hola, quiero más información.")}`
    : null;

  return (
    <section id="contacto" className="section section--alt contact">
      <div className="container contact__grid">
        <div className="contact__info">
          <span className="eyebrow">Hablemos</span>
          <h2>Contacto</h2>
          <ul className="contact__list">
            <li>
              <strong>Dirección:</strong> {business.address}
            </li>
            <li>
              <strong>Horarios:</strong> {business.hours}
            </li>
            <li>
              <strong>Teléfono:</strong> <a href={`tel:${business.phone}`}>{business.phone}</a>
            </li>
            <li>
              <strong>Correo:</strong> <a href={`mailto:${business.email}`}>{business.email}</a>
            </li>
            {business.mapUrl && (
              <li>
                <a href={business.mapUrl} target="_blank" rel="noopener noreferrer">
                  Ver ubicación en el mapa
                </a>
              </li>
            )}
          </ul>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              Escribir por WhatsApp
            </a>
          )}
        </div>

        <form className="card contact__form" onSubmit={handleSubmit} noValidate>
          <h3>Solicitar cotización</h3>

          {/* Campo honeypot anti-spam, oculto para personas */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="visually-hidden"
            aria-hidden="true"
          />

          <label htmlFor="contact-name">Nombre completo</label>
          <input id="contact-name" name="name" type="text" required minLength={2} maxLength={150} />

          <label htmlFor="contact-phone">Teléfono / WhatsApp</label>
          <input id="contact-phone" name="phone" type="tel" required minLength={7} maxLength={30} />

          <label htmlFor="contact-email">Correo (opcional)</label>
          <input id="contact-email" name="email" type="email" maxLength={200} />

          <label htmlFor="contact-service">Servicio de interés (opcional)</label>
          <input id="contact-service" name="service" type="text" maxLength={150} />

          <label htmlFor="contact-message">Cuéntanos qué necesitas</label>
          <textarea id="contact-message" name="message" required minLength={5} maxLength={2000} rows={4} />

          <button type="submit" className="btn btn--primary" disabled={status === "loading"}>
            {status === "loading" ? "Enviando…" : "Solicitar cotización"}
          </button>

          <div role="status" aria-live="polite">
            {status === "success" && (
              <p className="contact__feedback contact__feedback--success">
                ¡Gracias! Recibimos tu solicitud y te contactaremos pronto.
              </p>
            )}
            {status === "error" && (
              <p className="contact__feedback contact__feedback--error">
                {errorMsg || "Ocurrió un error. Intenta de nuevo."}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
