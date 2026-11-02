export const GENDERS = ['mujer', 'hombre', 'no_binario', 'otro'] as const;
export type Gender = (typeof GENDERS)[number];

export const INTERESTED_IN = ['mujeres', 'hombres', 'todas'] as const;
export type InterestedIn = (typeof INTERESTED_IN)[number];

export const RELATIONSHIP_INTENTS = [
  'relacion_seria',
  'conocer_gente',
  'algo_casual',
  'no_lo_se',
] as const;
export type RelationshipIntent = (typeof RELATIONSHIP_INTENTS)[number];

/** Intereses "de plan": la propuesta de valor es quedar para hacer algo concreto. */
export const INTERESTS = [
  'cafe', 'cena', 'cerveza_artesanal', 'mezcal_y_vino', 'cine', 'teatro', 'conciertos', 'museos',
  'senderismo', 'ciclismo', 'running', 'gimnasio', 'futbol', 'yoga', 'escalada',
  'cocinar', 'reposteria', 'fotografia', 'lectura', 'juegos_de_mesa', 'videojuegos',
  'viajes_cortos', 'playa', 'baile', 'salsa_y_cumbia', 'karaoke', 'perros', 'gatos',
  'emprender', 'tecnologia', 'arte', 'voluntariado', 'mercados_y_tianguis', 'cafeterías_nuevas',
] as const;
export type Interest = (typeof INTERESTS)[number];

export const PLAN_TYPES = ['cafe', 'comida', 'cena', 'copa', 'caminata', 'actividad', 'cultural', 'otro'] as const;

export const REPORT_REASONS = [
  'perfil_falso', 'menor_de_edad', 'contenido_sexual', 'acoso', 'estafa_o_spam', 'violencia_o_amenaza', 'fuera_de_la_app', 'otro',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const PLANS = {
  free: { id: 'free', name: 'Gratis' },
  premium: { id: 'premium', name: 'Premium' },
} as const;
export type PlanId = keyof typeof PLANS;

/** Límites anti-spam. Premium amplía, nunca elimina. */
export const LIMITS = {
  free: { likesPerDay: 25, rewindsPerDay: 0, newConversationsPerDay: 10, messagesPerMinute: 20, activeFilters: 'basic' },
  premium: { likesPerDay: 100, rewindsPerDay: 10, newConversationsPerDay: 25, messagesPerMinute: 20, activeFilters: 'extended' },
} as const;

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
