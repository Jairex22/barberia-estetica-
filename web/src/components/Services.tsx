import type { ServiceItem } from "../types";

function whatsappLink(whatsapp: string, serviceName: string) {
  const text = encodeURIComponent(`Hola, quiero información sobre: ${serviceName}`);
  return `https://wa.me/${whatsapp}?text=${text}`;
}

export function Services({
  services,
  whatsapp,
}: {
  services: ServiceItem[];
  whatsapp: string;
}) {
  if (services.length === 0) {
    return (
      <section id="servicios" className="section services">
        <div className="container">
          <h2>Servicios</h2>
          <p className="state-empty">Aún no se han publicado servicios.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="servicios" className="section services">
      <div className="container">
        <span className="eyebrow">Catálogo</span>
        <h2>Nuestros servicios</h2>
        <div className="grid grid--services">
          {services.map((s) => (
            <article key={s.id} className="card service-card">
              <img src={s.imageUrl} alt={s.name} loading="lazy" className="service-card__image" />
              <div className="service-card__body">
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="service-card__footer">
                  <span className="service-card__price">
                    {s.price ? s.price : "Solicitar cotización"}
                  </span>
                  <a
                    className="btn btn--secondary btn--sm"
                    href={whatsapp ? whatsappLink(whatsapp, s.name) : "#contacto"}
                    target={whatsapp ? "_blank" : undefined}
                    rel={whatsapp ? "noopener noreferrer" : undefined}
                  >
                    Consultar
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
