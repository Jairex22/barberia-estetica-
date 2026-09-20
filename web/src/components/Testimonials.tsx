import type { TestimonialItem } from "../types";

export function Testimonials({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null;
  return (
    <section id="opiniones" className="section testimonials">
      <div className="container">
        <span className="eyebrow">Lo que dicen los clientes</span>
        <h2>Opiniones</h2>
        <div className="grid grid--testimonials">
          {items.map((t) => (
            <figure key={t.id} className="card testimonial-card">
              <div className="testimonial-card__rating" aria-label={`Calificación ${t.rating} de 5`}>
                {"★".repeat(t.rating)}
                {"☆".repeat(5 - t.rating)}
              </div>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                {t.name}
                {t.isDemo && <span className="badge-demo">Demostración</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
