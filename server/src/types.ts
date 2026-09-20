export interface ThemeConfig {
  colorBg: string;
  colorSurface: string;
  colorText: string;
  colorPrimary: string;
  colorPrimaryDark: string;
  colorAccent: string;
  fontHeading: string;
  fontBody: string;
}

export interface SectionToggle {
  id:
    | "inicio"
    | "nosotros"
    | "servicios"
    | "beneficios"
    | "proceso"
    | "galeria"
    | "opiniones"
    | "precios"
    | "preguntas"
    | "contacto";
  label: string;
  visible: boolean;
  order: number;
  inMoreMenu?: boolean;
}

export interface BusinessInfo {
  agencyName: string;
  name: string;
  giro: string;
  city: string;
  zone: string;
  audience: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  mapUrl: string;
  logoUrl: string;
  isDemo: boolean;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
}

export interface AboutContent {
  title: string;
  story: string;
  approach: string;
  trustPoints: { label: string; value: string }[];
  imageUrl: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string | null;
  durationMinutes: number | null;
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  category: string;
  caption: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  quote: string;
  rating: number;
  isDemo: boolean;
}

export interface PackageItem {
  id: string;
  name: string;
  description: string;
  price: string | null;
  requestQuoteOnly: boolean;
  features: string[];
  highlighted: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  includeInBot: boolean;
}

export interface SeoConfig {
  title: string;
  description: string;
  ogImageUrl: string;
  faviconUrl: string;
}

export interface BotConfig {
  welcomeMessage: string;
  tone: string;
  suggestedQuestions: string[];
  disclosureText: string;
  humanHandoffText: string;
}

export interface PrivacyPolicyContent {
  title: string;
  body: string;
  pendingFields: string[];
}

export interface SiteContent {
  business: BusinessInfo;
  theme: ThemeConfig;
  seo: SeoConfig;
  sections: SectionToggle[];
  hero: HeroContent;
  about: AboutContent;
  services: ServiceItem[];
  benefits: BenefitItem[];
  process: ProcessStep[];
  gallery: GalleryItem[];
  testimonials: TestimonialItem[];
  packages: PackageItem[];
  faqs: FaqItem[];
  bot: BotConfig;
  privacy: PrivacyPolicyContent;
  primaryAction: "cotizar" | "agendar" | "contactar";
}
