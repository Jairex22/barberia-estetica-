const INTEREST_LABELS: Record<string, string> = {
  cafe: 'Café', cena: 'Cena', cerveza_artesanal: 'Cerveza artesanal', mezcal_y_vino: 'Mezcal y vino', cine: 'Cine', teatro: 'Teatro', conciertos: 'Conciertos', museos: 'Museos',
  senderismo: 'Senderismo', ciclismo: 'Ciclismo', running: 'Running', gimnasio: 'Gimnasio', futbol: 'Fútbol', yoga: 'Yoga', escalada: 'Escalada', cocinar: 'Cocinar', reposteria: 'Repostería',
  fotografia: 'Fotografía', lectura: 'Lectura', juegos_de_mesa: 'Juegos de mesa', videojuegos: 'Videojuegos', viajes_cortos: 'Viajes cortos', playa: 'Playa', baile: 'Baile', salsa_y_cumbia: 'Salsa y cumbia',
  karaoke: 'Karaoke', perros: 'Perros', gatos: 'Gatos', emprender: 'Emprender', tecnologia: 'Tecnología', arte: 'Arte', voluntariado: 'Voluntariado', mercados_y_tianguis: 'Mercados y tianguis', 'cafeterías_nuevas': 'Cafeterías nuevas',
  comida: 'Comida', copa: 'Una copa', caminata: 'Caminata', actividad: 'Actividad', cultural: 'Plan cultural', otro: 'Otro',
};
export const LABELS: Record<string, string> = {
  ...INTEREST_LABELS,
  relacion_seria: 'Relación seria', conocer_gente: 'Conocer gente', algo_casual: 'Algo casual', no_lo_se: 'Aún no lo sé',
  muy_cerca: 'Muy cerca', cerca: 'Cerca', misma_zona: 'Misma zona', lejos: 'Lejos',
  mujer: 'Mujer', hombre: 'Hombre', no_binario: 'No binario', otro: 'Otro', mujeres: 'Mujeres', hombres: 'Hombres', todas: 'Todas las personas',
  free: 'Gratis', premium: 'Premium', active: 'Activa', past_due: 'Pago pendiente', canceled: 'Cancelada', expired: 'Vencida', refunded: 'Reembolsada', revoked: 'Revocada', pending: 'Pendiente', incomplete: 'Incompleta',
  stripe: 'Tarjeta (Stripe)', mercadopago: 'Mercado Pago', apple: 'App Store', google: 'Google Play', manual: 'Manual',
  perfil_falso: 'Perfil falso', menor_de_edad: 'Parece menor de edad', contenido_sexual: 'Contenido sexual', acoso: 'Acoso', estafa_o_spam: 'Estafa o spam', violencia_o_amenaza: 'Violencia o amenaza', fuera_de_la_app: 'Comportamiento fuera de la app', otro_motivo: 'Otro',
};
export const label = (k: string | null | undefined) => { if (!k) return ''; const v = LABELS[k]; if (v) return v; const t = k.replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
export const money = (minor: number, currency: string) => new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', { style: 'currency', currency }).format(minor / 100);
export const dateLong = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'long' }) : '—');
export const timeShort = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
export const dateTime = (iso: string) => new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
