import type { HeroContent } from "../types";

export function Hero({ hero, whatsapp }: { hero: HeroContent; whatsapp: string }) {
  return (
    <section id="inicio" className="section hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <span className="eyebrow">{hero.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p className="hero__subtitle">{hero.subtitle}</p>
          <div className="hero__actions">
            <a href="#contacto" className="btn btn--primary">
              {hero.ctaPrimaryLabel}
            </a>
            <a href="#servicios" className="btn btn--secondary">
              {hero.ctaSecondaryLabel}
            </a>
          </div>
        </div>
        <div className="hero__media">
          <img src={hero.imageUrl} alt={hero.title} loading="eager" />
        </div>
      </div>
      {whatsapp && (
        <p className="visually-hidden">Contacto directo por WhatsApp disponible en la sección de contacto.</p>
      )}
    </section>
  );
}
