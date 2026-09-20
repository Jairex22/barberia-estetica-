import { useEffect, useMemo, useState } from "react";
import type { GalleryItem } from "../types";

export function Gallery({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );
  const [active, setActive] = useState("Todos");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = active === "Todos" ? items : items.filter((i) => i.category === active);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex]);

  if (items.length === 0) return null;

  return (
    <section id="galeria" className="section section--alt gallery">
      <div className="container">
        <span className="eyebrow">Trabajos realizados</span>
        <h2>Galería</h2>
        <div className="gallery__filters" role="tablist" aria-label="Filtrar galería por categoría">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={active === cat}
              className={`gallery__filter ${active === cat ? "is-active" : ""}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid--gallery">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              className="gallery__item"
              onClick={() => setOpenIndex(idx)}
              aria-label={`Ampliar imagen: ${item.caption}`}
            >
              <img src={item.imageUrl} alt={item.caption} loading="lazy" />
              <span className="gallery__caption">{item.caption}</span>
            </button>
          ))}
        </div>
      </div>

      {openIndex !== null && filtered[openIndex] && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={filtered[openIndex].caption}
          onClick={() => setOpenIndex(null)}
        >
          <button
            className="lightbox__close"
            aria-label="Cerrar imagen ampliada"
            onClick={() => setOpenIndex(null)}
          >
            ✕
          </button>
          <img
            src={filtered[openIndex].imageUrl}
            alt={filtered[openIndex].caption}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="lightbox__caption">{filtered[openIndex].caption}</p>
        </div>
      )}
    </section>
  );
}
