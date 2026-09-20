import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SiteContent } from "../types";
import { api } from "../api";

interface SiteContextValue {
  content: SiteContent | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const SiteContext = createContext<SiteContextValue>({
  content: null,
  loading: true,
  error: null,
  reload: () => {},
});

function applyTheme(content: SiteContent) {
  const root = document.documentElement;
  const t = content.theme;
  root.style.setProperty("--color-bg", t.colorBg);
  root.style.setProperty("--color-surface", t.colorSurface);
  root.style.setProperty("--color-text", t.colorText);
  root.style.setProperty("--color-primary", t.colorPrimary);
  root.style.setProperty("--color-primary-dark", t.colorPrimaryDark);
  root.style.setProperty("--color-accent", t.colorAccent);
  root.style.setProperty("--font-heading", `"${t.fontHeading}", "Inter", sans-serif`);
  root.style.setProperty("--font-body", `"${t.fontBody}", sans-serif`);

  document.title = content.seo.title;
  const setMeta = (name: string, value: string, attr: "name" | "property" = "name") => {
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  setMeta("description", content.seo.description);
  setMeta("og:title", content.seo.title, "property");
  setMeta("og:description", content.seo.description, "property");
  setMeta("og:image", content.seo.ogImageUrl, "property");
  setMeta("og:type", "website", "property");

  const favicon = document.getElementById("favicon-link") as HTMLLinkElement | null;
  if (favicon && content.seo.faviconUrl) favicon.href = content.seo.faviconUrl;
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<SiteContent>("/api/public/content")
      .then((data) => {
        if (cancelled) return;
        setContent(data);
        applyTheme(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "No se pudo cargar el contenido del sitio.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <SiteContext.Provider
      value={{ content, loading, error, reload: () => setTick((t) => t + 1) }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
