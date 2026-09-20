import type { PackageItem } from "../types";

function whatsappLink(whatsapp: string, pkgName: string) {
  const text = encodeURIComponent(`Hola, quiero cotizar el paquete: ${pkgName}`);
  return `https://wa.me/${whatsapp}?text=${text}`;
}

export function Pricing({ packages, whatsapp }: { packages: PackageItem[]; whatsapp: string }) {
  if (packages.length === 0) return null;
  return (
    <section id="precios" className="section section--alt pricing">
      <div className="container">
        <span className="eyebrow">Paquetes y precios</span>
        <h2>Elige la opción que más te conviene</h2>
        <p className="pricing__note">Precios en pesos mexicanos (MXN). Sujetos a diagnóstico cuando se indique.</p>
        <div className="grid grid--pricing">
          {packages.map((p) => (
            <div key={p.id} className={`card pricing-card ${p.highlighted ? "pricing-card--highlight" : ""}`}>
              {p.highlighted && <span className="pricing-card__tag">Más elegido</span>}
              <h3>{p.name}</h3>
              <p className="pricing-card__desc">{p.description}</p>
              <p className="pricing-card__price">
                {p.requestQuoteOnly || !p.price ? "Solicitar cotización" : p.price}
              </p>
              <ul className="pricing-card__features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a
                className="btn btn--primary"
                href={whatsapp ? whatsappLink(whatsapp, p.name) : "#contacto"}
                target={whatsapp ? "_blank" : undefined}
                rel={whatsapp ? "noopener noreferrer" : undefined}
              >
                Solicitar cotización
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
