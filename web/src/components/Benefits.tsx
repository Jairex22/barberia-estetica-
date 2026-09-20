import type { BenefitItem } from "../types";

const ICONS: Record<string, string> = {
  shield: "🛡️",
  check: "✅",
  truck: "🚚",
  clipboard: "📋",
  star: "⭐",
  clock: "⏱️",
};

export function Benefits({ benefits }: { benefits: BenefitItem[] }) {
  if (benefits.length === 0) return null;
  return (
    <section id="beneficios" className="section section--alt benefits">
      <div className="container">
        <span className="eyebrow">Por qué elegirnos</span>
        <h2>Beneficios</h2>
        <div className="grid grid--benefits">
          {benefits.map((b) => (
            <div key={b.id} className="card benefit-card">
              <span className="benefit-card__icon" aria-hidden="true">
                {ICONS[b.icon] || "✨"}
              </span>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
