import type { ReactNode } from "react";
import { useSite } from "./context/SiteContext";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Services } from "./components/Services";
import { Benefits } from "./components/Benefits";
import { Process } from "./components/Process";
import { Gallery } from "./components/Gallery";
import { Testimonials } from "./components/Testimonials";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { ChatWidget } from "./components/ChatWidget";
import { WhatsAppButton } from "./components/WhatsAppButton";
import type { SectionId } from "./types";

const ctaLabelByAction: Record<string, string> = {
  cotizar: "Solicitar cotización",
  agendar: "Agendar cita",
  contactar: "Contactar",
};

export function PublicSite() {
  const { content, loading, error, reload } = useSite();

  if (loading) {
    return (
      <div className="state-loading" role="status">
        Cargando sitio…
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="state-error" role="alert">
        <p>{error || "No se pudo cargar el sitio."}</p>
        <button className="btn btn--secondary" onClick={reload}>
          Reintentar
        </button>
      </div>
    );
  }

  const visibleSections = new Set(
    content.sections.filter((s) => s.visible).map((s) => s.id as SectionId)
  );

  const sectionComponents: Record<SectionId, ReactNode> = {
    inicio: <Hero key="inicio" hero={content.hero} whatsapp={content.business.whatsapp} />,
    nosotros: <About key="nosotros" about={content.about} />,
    servicios: (
      <Services key="servicios" services={content.services} whatsapp={content.business.whatsapp} />
    ),
    beneficios: <Benefits key="beneficios" benefits={content.benefits} />,
    proceso: <Process key="proceso" steps={content.process} />,
    galeria: <Gallery key="galeria" items={content.gallery} />,
    opiniones: <Testimonials key="opiniones" items={content.testimonials} />,
    precios: (
      <Pricing key="precios" packages={content.packages} whatsapp={content.business.whatsapp} />
    ),
    preguntas: <FAQ key="preguntas" faqs={content.faqs} />,
    contacto: <Contact key="contacto" business={content.business} />,
  };

  const orderedSections = [...content.sections]
    .sort((a, b) => a.order - b.order)
    .filter((s) => visibleSections.has(s.id as SectionId));

  return (
    <>
      <a href="#inicio" className="skip-link">
        Saltar al contenido principal
      </a>
      <Header
        agencyName={content.business.agencyName}
        businessName={content.business.name}
        logoUrl={content.business.logoUrl}
        sections={content.sections}
        primaryCtaLabel={ctaLabelByAction[content.primaryAction] || "Cotizar"}
      />
      <main id="main">
        {content.business.isDemo && (
          <div className="demo-banner" role="note">
            Sitio de demostración de ClickFlow Digital — todo el contenido marcado como
            "Demostración" es ficticio y debe sustituirse desde el panel de administración.
          </div>
        )}
        {orderedSections.map((s) => sectionComponents[s.id as SectionId])}
      </main>
      <Footer business={content.business} />
      <WhatsAppButton whatsapp={content.business.whatsapp} businessName={content.business.name} />
      <ChatWidget businessName={content.business.name} />
    </>
  );
}
