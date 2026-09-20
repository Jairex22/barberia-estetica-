import type { BusinessInfo } from "../types";

export function Footer({ business }: { business: BusinessInfo }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          © {year} {business.name}. Sitio desarrollado por ClickFlow Digital.
        </p>
        <nav aria-label="Enlaces legales">
          <a href="/privacidad">Aviso de privacidad</a>
        </nav>
      </div>
    </footer>
  );
}
