import { useEffect, useRef, useState } from "react";
import type { SectionToggle } from "../types";

interface Props {
  agencyName: string;
  businessName: string;
  logoUrl: string;
  sections: SectionToggle[];
  primaryCtaLabel: string;
}

export function Header({ businessName, logoUrl, sections, primaryCtaLabel }: Props) {
  const visible = sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);
  const mainLinks = visible.filter((s) => !s.inMoreMenu);
  const moreLinks = visible.filter((s) => s.inMoreMenu);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(visible[0]?.id || "");
  const moreRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const targets = visible
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const topMost = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )[0];
          setActiveId(topMost.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 1] }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((s) => s.id).join(",")]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href="#inicio" className="site-header__brand" onClick={closeMobile}>
          {logoUrl ? (
            <img src={logoUrl} alt={`Logotipo de ${businessName}`} className="site-header__logo" />
          ) : (
            <span className="site-header__brand-text">{businessName}</span>
          )}
        </a>

        <nav className="site-header__nav site-header__nav--desktop" aria-label="Navegación principal">
          <ul>
            {mainLinks.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={activeId === s.id ? "true" : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
            {moreLinks.length > 0 && (
              <li className="site-header__more" ref={moreRef}>
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                  className="site-header__more-btn"
                >
                  Más ▾
                </button>
                {moreOpen && (
                  <ul className="site-header__more-menu">
                    {moreLinks.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          aria-current={activeId === s.id ? "true" : undefined}
                          onClick={() => setMoreOpen(false)}
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>

        <a href="#contacto" className="btn btn--primary site-header__cta">
          {primaryCtaLabel}
        </a>

        <button
          type="button"
          className="site-header__toggle"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {mobileOpen && (
        <nav className="site-header__nav--mobile" aria-label="Navegación móvil">
          <ul>
            {visible.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={closeMobile}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
