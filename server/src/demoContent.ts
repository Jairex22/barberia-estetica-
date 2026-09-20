import type { SiteContent } from "./types.js";

// Contenido de demostracion ficticio. Todo lo marcado "isDemo" debe
// sustituirse desde /admin antes de lanzar el sitio con un cliente real.
export const demoContent: SiteContent = {
  business: {
    agencyName: "ClickFlow Digital",
    name: "NOVA Detailing",
    giro: "Estetica automotriz",
    city: "Guadalajara, Jalisco",
    zone: "Zona Metropolitana de Guadalajara",
    audience:
      "Personas dueñas de auto que buscan cuidado profesional de su vehiculo y talleres/agencias que buscan servicio de detallado para sus clientes",
    whatsapp: "5213312345678",
    phone: "33 1234 5678",
    email: "contacto@novadetailing-demo.mx",
    address: "Av. Patria 1234, Zapopan, Jalisco (Demostración)",
    hours: "Lunes a sábado, 9:00 a 19:00 h. Domingo cerrado.",
    mapUrl: "https://maps.google.com/?q=Zapopan+Jalisco",
    logoUrl: "/media/demo/logo-nova.svg",
    isDemo: true,
  },
  theme: {
    colorBg: "#F7F5F0",
    colorSurface: "#FFFFFF",
    colorText: "#1F2421",
    colorPrimary: "#0B3D2E",
    colorPrimaryDark: "#082C21",
    colorAccent: "#1E7A52",
    fontHeading: "Manrope",
    fontBody: "Inter",
  },
  seo: {
    title: "NOVA Detailing — Estética automotriz en Guadalajara (Demostración)",
    description:
      "Detallado, pulido y protección cerámica para tu auto en Zapopan y Guadalajara. Cotiza sin compromiso. Sitio de demostración de ClickFlow Digital.",
    ogImageUrl: "/media/demo/og-nova.svg",
    faviconUrl: "/media/demo/favicon.svg",
  },
  primaryAction: "cotizar",
  sections: [
    { id: "inicio", label: "Inicio", visible: true, order: 1 },
    { id: "nosotros", label: "Nosotros", visible: true, order: 2 },
    { id: "servicios", label: "Servicios", visible: true, order: 3 },
    { id: "beneficios", label: "Beneficios", visible: true, order: 4, inMoreMenu: true },
    { id: "proceso", label: "Cómo trabajamos", visible: true, order: 5, inMoreMenu: true },
    { id: "galeria", label: "Galería", visible: true, order: 6 },
    { id: "opiniones", label: "Opiniones", visible: true, order: 7, inMoreMenu: true },
    { id: "precios", label: "Paquetes", visible: true, order: 8 },
    { id: "preguntas", label: "Preguntas", visible: true, order: 9, inMoreMenu: true },
    { id: "contacto", label: "Contacto", visible: true, order: 10 },
  ],
  hero: {
    eyebrow: "Estética automotriz profesional en Guadalajara",
    title: "Tu auto, como recién salido de agencia",
    subtitle:
      "Detallado, pulido y protección cerámica con productos profesionales. Recogemos tu auto en zonas seleccionadas de Zapopan y Guadalajara.",
    imageUrl: "/media/demo/hero-nova.svg",
    ctaPrimaryLabel: "Solicitar cotización",
    ctaSecondaryLabel: "Ver servicios",
  },
  about: {
    title: "Cuidamos tu auto como si fuera nuestro",
    story:
      "NOVA Detailing (contenido de demostración) nace de la pasión por los autos y el trabajo bien hecho. Desde 2019 atendemos autos particulares y flotillas pequeñas en la Zona Metropolitana de Guadalajara, usando productos profesionales y procesos documentados para cada vehículo.",
    approach:
      "Antes de cualquier trabajo, inspeccionamos tu auto contigo y te explicamos qué necesita y por qué. No recomendamos servicios que tu auto no requiere.",
    trustPoints: [
      { label: "Años de operación", value: "6" },
      { label: "Autos atendidos", value: "1,200+" },
      { label: "Calificación promedio en reseñas", value: "4.8/5" },
    ],
    imageUrl: "/media/demo/nosotros-nova.svg",
  },
  services: [
    {
      id: "svc-lavado-premium",
      name: "Lavado premium exterior e interior",
      description:
        "Lavado a mano con shampoo de pH neutro, limpieza de rines, aspirado profundo y aromatizado.",
      imageUrl: "/media/demo/servicio-lavado.svg",
      price: "$450",
      durationMinutes: 60,
    },
    {
      id: "svc-pulido",
      name: "Pulido y corrección de pintura",
      description:
        "Eliminación de swirls, marcas de lavado y oxidación ligera. Devuelve el brillo original de la pintura.",
      imageUrl: "/media/demo/servicio-pulido.svg",
      price: "$1,800",
      durationMinutes: 240,
    },
    {
      id: "svc-ceramico",
      name: "Recubrimiento cerámico",
      description:
        "Protección de hasta 2 años contra rayos UV, lluvia ácida y contaminación. Facilita la limpieza diaria.",
      imageUrl: "/media/demo/servicio-ceramico.svg",
      price: null,
      durationMinutes: 480,
    },
    {
      id: "svc-interiores",
      name: "Limpieza profunda de interiores",
      description:
        "Shampoo de tapicería y alfombras, limpieza de piel, plásticos y desinfección con ozono.",
      imageUrl: "/media/demo/servicio-interiores.svg",
      price: "$900",
      durationMinutes: 120,
    },
  ],
  benefits: [
    {
      id: "ben-1",
      title: "Productos profesionales certificados",
      description: "Trabajamos con líneas reconocidas en la industria del detallado automotriz.",
      icon: "shield",
    },
    {
      id: "ben-2",
      title: "Diagnóstico honesto",
      description: "Te decimos exactamente qué necesita tu auto, sin venderte de más.",
      icon: "check",
    },
    {
      id: "ben-3",
      title: "Servicio a domicilio en zonas seleccionadas",
      description: "Recogemos y entregamos tu auto en puntos dentro de nuestra zona de cobertura.",
      icon: "truck",
    },
    {
      id: "ben-4",
      title: "Cotización clara antes de iniciar",
      description: "Recibes el precio y tiempo estimado antes de autorizar cualquier trabajo.",
      icon: "clipboard",
    },
  ],
  process: [
    { id: "step-1", title: "Contacto", description: "Nos escribes por WhatsApp, formulario o el asistente del sitio." },
    { id: "step-2", title: "Diagnóstico", description: "Revisamos tu auto (en sitio o con fotos) y te compartimos un diagnóstico." },
    { id: "step-3", title: "Cotización", description: "Te enviamos precio y tiempo estimado para tu aprobación." },
    { id: "step-4", title: "Servicio", description: "Realizamos el trabajo con checklist de calidad por etapa." },
    { id: "step-5", title: "Entrega", description: "Revisamos el resultado contigo antes de la entrega final." },
  ],
  gallery: [
    { id: "gal-1", imageUrl: "/media/demo/galeria-1.svg", category: "Pulido", caption: "Corrección de pintura en sedán (Demostración)" },
    { id: "gal-2", imageUrl: "/media/demo/galeria-2.svg", category: "Cerámico", caption: "Aplicación de recubrimiento cerámico (Demostración)" },
    { id: "gal-3", imageUrl: "/media/demo/galeria-3.svg", category: "Interiores", caption: "Limpieza profunda de interiores (Demostración)" },
    { id: "gal-4", imageUrl: "/media/demo/galeria-4.svg", category: "Lavado", caption: "Lavado premium exterior (Demostración)" },
  ],
  testimonials: [
    {
      id: "test-1",
      name: "Roberto M. (Demostración)",
      quote:
        "Ejemplo de testimonio de demostración: el servicio de pulido dejó mi auto como nuevo y me explicaron todo el proceso.",
      rating: 5,
      isDemo: true,
    },
    {
      id: "test-2",
      name: "Ana L. (Demostración)",
      quote:
        "Ejemplo de testimonio de demostración: puntualidad y buen trato. Recomiendo el servicio a domicilio.",
      rating: 5,
      isDemo: true,
    },
  ],
  packages: [
    {
      id: "pkg-basico",
      name: "Mantenimiento",
      description: "Ideal para el cuidado regular de tu auto.",
      price: "$450 MXN",
      requestQuoteOnly: false,
      features: ["Lavado premium exterior e interior", "Aromatizado", "Revisión visual sin costo"],
      highlighted: false,
    },
    {
      id: "pkg-completo",
      name: "Renovación",
      description: "Para autos que necesitan recuperar su brillo original.",
      price: "$1,800 MXN",
      requestQuoteOnly: false,
      features: ["Pulido y corrección de pintura", "Lavado premium incluido", "Limpieza de motor exterior"],
      highlighted: true,
    },
    {
      id: "pkg-proteccion",
      name: "Protección total",
      description: "Precio sujeto a diagnóstico según tamaño y estado del vehículo.",
      price: null,
      requestQuoteOnly: true,
      features: ["Recubrimiento cerámico", "Pulido previo incluido", "Limpieza profunda de interiores"],
      highlighted: false,
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "¿Cuánto tiempo tarda el servicio de pulido?",
      answer:
        "El pulido y corrección de pintura toma aproximadamente 4 horas, dependiendo del estado de la pintura y tamaño del vehículo.",
      includeInBot: true,
    },
    {
      id: "faq-2",
      question: "¿Ofrecen servicio a domicilio?",
      answer:
        "Sí, recogemos y entregamos tu auto en puntos seleccionados dentro de la Zona Metropolitana de Guadalajara. Pregunta por disponibilidad en tu zona.",
      includeInBot: true,
    },
    {
      id: "faq-3",
      question: "¿El recubrimiento cerámico tiene garantía?",
      answer:
        "El recubrimiento cerámico que aplicamos tiene una duración estimada de hasta 2 años con el mantenimiento adecuado. Te compartimos las recomendaciones de cuidado al finalizar el servicio.",
      includeInBot: true,
    },
    {
      id: "faq-4",
      question: "¿Cómo agendo una cita?",
      answer:
        "Puedes escribirnos por WhatsApp, llenar el formulario de contacto del sitio o usar el asistente virtual. Confirmamos disponibilidad y horario contigo.",
      includeInBot: true,
    },
  ],
  bot: {
    welcomeMessage:
      "Hola, soy el asistente virtual de NOVA Detailing (demostración). Puedo ayudarte con información sobre servicios, precios, horarios y ubicación. ¿En qué puedo ayudarte?",
    tone: "cercano, profesional y claro, en español de México",
    suggestedQuestions: [
      "¿Qué incluye el paquete de pulido?",
      "¿Cuánto cuesta el recubrimiento cerámico?",
      "¿Tienen servicio a domicilio?",
      "¿Cuáles son sus horarios de atención?",
    ],
    disclosureText:
      "Esta conversación es procesada mediante un servicio de inteligencia artificial para ayudarte más rápido. No compartas datos sensibles.",
    humanHandoffText:
      "Para continuar con una persona del equipo, escríbenos por WhatsApp o deja tus datos en el formulario de contacto.",
  },
  privacy: {
    title: "Aviso de privacidad (demostración)",
    body:
      "Este es un aviso de privacidad base de demostración. NOVA Detailing (demostración) recaba nombre, teléfono, correo y mensaje cuando usas el formulario de contacto o el asistente virtual, con el único fin de responder tu solicitud y dar seguimiento comercial. No compartimos tus datos con terceros salvo obligación legal.",
    pendingFields: [
      "Razón social y domicilio fiscal completos del responsable",
      "Datos de contacto del responsable de protección de datos",
      "Procedimiento detallado para ejercer derechos ARCO",
      "Vigencia y fecha de última actualización",
    ],
  },
};
