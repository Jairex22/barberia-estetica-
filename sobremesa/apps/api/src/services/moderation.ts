import { config } from '../config.js';

export type ModerationVerdict = { decision: 'allow' | 'review' | 'reject'; notes?: string; provider: string };

/**
 * Moderación de imágenes. Sin proveedor configurado, TODA foto queda 'pending' para revisión humana
 * (nunca se aprueba sola). Con Sightengine, se rechaza desnudez explícita y se marca el resto para revisión.
 */
export async function moderateImage(data: Buffer): Promise<ModerationVerdict> {
  if (config.IMAGE_MODERATION_PROVIDER === 'sightengine' && config.SIGHTENGINE_USER && config.SIGHTENGINE_SECRET) {
    try {
      const form = new FormData();
      form.append('media', new Blob([new Uint8Array(data)], { type: 'image/webp' }), 'photo.webp');
      form.append('models', 'nudity-2.1,weapon,offensive-2.0');
      form.append('api_user', config.SIGHTENGINE_USER);
      form.append('api_secret', config.SIGHTENGINE_SECRET);
      const res = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: form, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return { decision: 'review', notes: `sightengine ${res.status}`, provider: 'sightengine' };
      const json = (await res.json()) as any;
      const explicit = Math.max(json?.nudity?.sexual_activity ?? 0, json?.nudity?.sexual_display ?? 0, json?.nudity?.erotica ?? 0);
      if (explicit > 0.6) return { decision: 'reject', notes: 'Contenido sexual explícito detectado automáticamente', provider: 'sightengine' };
      return { decision: 'review', notes: `auto: nudity=${explicit.toFixed(2)}`, provider: 'sightengine' };
    } catch (e) {
      return { decision: 'review', notes: 'proveedor de moderación no disponible', provider: 'sightengine' };
    }
  }
  return { decision: 'review', provider: 'none' };
}

/** Señales simples de spam/estafa en texto (heurísticas, no IA). Devuelve motivos para la cola de moderación. */
export function textRiskSignals(text: string): string[] {
  const reasons: string[] = [];
  const t = text.toLowerCase();
  if (/(https?:\/\/|www\.)/.test(t)) reasons.push('enlace');
  if (/(whats?app|telegram|instagram|ig:|snap|onlyfans)/.test(t)) reasons.push('redirige fuera de la app');
  if (/(\+?52\s?)?\d{2}[\s-]?\d{4}[\s-]?\d{4}/.test(t)) reasons.push('número de teléfono');
  if (/(cripto|bitcoin|usdt|inversi[oó]n|forex|gana dinero|dep[oó]sito)/.test(t)) reasons.push('posible estafa financiera');
  if (/(clabe|cuenta bancaria|transfiere|env[ií]ame dinero)/.test(t)) reasons.push('solicitud de dinero');
  return reasons;
}
