import { z } from "zod";

const str = (max = 2000) => z.string().max(max);

export const siteContentSchema = z.object({
  business: z.object({
    agencyName: str(120),
    name: str(120),
    giro: str(120),
    city: str(120),
    zone: str(200),
    audience: str(400),
    whatsapp: str(20),
    phone: str(30),
    email: str(200),
    address: str(300),
    hours: str(300),
    mapUrl: str(500),
    logoUrl: str(500),
    isDemo: z.boolean(),
  }),
  theme: z.object({
    colorBg: str(20),
    colorSurface: str(20),
    colorText: str(20),
    colorPrimary: str(20),
    colorPrimaryDark: str(20),
    colorAccent: str(20),
    fontHeading: str(60),
    fontBody: str(60),
  }),
  seo: z.object({
    title: str(200),
    description: str(400),
    ogImageUrl: str(500),
    faviconUrl: str(500),
  }),
  primaryAction: z.enum(["cotizar", "agendar", "contactar"]),
  sections: z
    .array(
      z.object({
        id: z.enum([
          "inicio",
          "nosotros",
          "servicios",
          "beneficios",
          "proceso",
          "galeria",
          "opiniones",
          "precios",
          "preguntas",
          "contacto",
        ]),
        label: str(60),
        visible: z.boolean(),
        order: z.number().int(),
        inMoreMenu: z.boolean().optional(),
      })
    )
    .length(10),
  hero: z.object({
    eyebrow: str(150),
    title: str(200),
    subtitle: str(400),
    imageUrl: str(500),
    ctaPrimaryLabel: str(60),
    ctaSecondaryLabel: str(60),
  }),
  about: z.object({
    title: str(200),
    story: str(3000),
    approach: str(2000),
    trustPoints: z.array(z.object({ label: str(100), value: str(60) })).max(6),
    imageUrl: str(500),
  }),
  services: z
    .array(
      z.object({
        id: str(80),
        name: str(150),
        description: str(1000),
        imageUrl: str(500),
        price: str(60).nullable(),
        durationMinutes: z.number().int().positive().nullable(),
      })
    )
    .max(60),
  benefits: z
    .array(
      z.object({
        id: str(80),
        title: str(150),
        description: str(500),
        icon: str(40),
      })
    )
    .max(12),
  process: z
    .array(
      z.object({ id: str(80), title: str(150), description: str(500) })
    )
    .min(3)
    .max(5),
  gallery: z
    .array(
      z.object({
        id: str(80),
        imageUrl: str(500),
        category: str(80),
        caption: str(200),
      })
    )
    .max(100),
  testimonials: z
    .array(
      z.object({
        id: str(80),
        name: str(150),
        quote: str(1000),
        rating: z.number().min(1).max(5),
        isDemo: z.boolean(),
      })
    )
    .max(50),
  packages: z
    .array(
      z.object({
        id: str(80),
        name: str(150),
        description: str(500),
        price: str(60).nullable(),
        requestQuoteOnly: z.boolean(),
        features: z.array(str(200)).max(20),
        highlighted: z.boolean(),
      })
    )
    .max(10),
  faqs: z
    .array(
      z.object({
        id: str(80),
        question: str(300),
        answer: str(2000),
        includeInBot: z.boolean(),
      })
    )
    .max(60),
  bot: z.object({
    welcomeMessage: str(500),
    tone: str(200),
    suggestedQuestions: z.array(str(200)).max(8),
    disclosureText: str(400),
    humanHandoffText: str(400),
  }),
  privacy: z.object({
    title: str(150),
    body: str(5000),
    pendingFields: z.array(str(300)).max(20),
  }),
});
