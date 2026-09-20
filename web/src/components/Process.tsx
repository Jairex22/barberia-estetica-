import type { ProcessStep } from "../types";

export function Process({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  return (
    <section id="proceso" className="section process">
      <div className="container">
        <span className="eyebrow">Cómo trabajamos</span>
        <h2>De tu contacto a la entrega</h2>
        <ol className="process__list">
          {steps.map((step, i) => (
            <li key={step.id} className="process__step">
              <span className="process__number" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
