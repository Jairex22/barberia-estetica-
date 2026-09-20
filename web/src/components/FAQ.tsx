import { useState } from "react";
import type { FaqItem } from "../types";

export function FAQ({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  if (faqs.length === 0) return null;

  return (
    <section id="preguntas" className="section faq">
      <div className="container">
        <span className="eyebrow">Resolvemos tus dudas</span>
        <h2>Preguntas frecuentes</h2>
        <div className="faq__list">
          {faqs.map((f) => {
            const isOpen = openId === f.id;
            return (
              <div key={f.id} className="faq__item">
                <h3>
                  <button
                    type="button"
                    className="faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${f.id}`}
                    id={`faq-header-${f.id}`}
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                  >
                    <span>{f.question}</span>
                    <span aria-hidden="true" className="faq__chevron">{isOpen ? "−" : "+"}</span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${f.id}`}
                  role="region"
                  aria-labelledby={`faq-header-${f.id}`}
                  className="faq__answer"
                  hidden={!isOpen}
                >
                  <p>{f.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
