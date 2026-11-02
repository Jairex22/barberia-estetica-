import type { Gender, InterestedIn } from '../constants.js';

/** ¿La preferencia `interestedIn` de A incluye el género declarado de B? */
export function wantsGender(interestedIn: InterestedIn, other: Gender): boolean {
  if (interestedIn === 'todas') return true;
  if (interestedIn === 'mujeres') return other === 'mujer';
  if (interestedIn === 'hombres') return other === 'hombre';
  return false;
}

/** Señales explicables de afinidad. Nunca es un "porcentaje científico". */
export function sharedSignals(
  a: { interests: readonly string[]; intent: string; planTypes?: readonly string[] },
  b: { interests: readonly string[]; intent: string; planTypes?: readonly string[] },
) {
  const interests = a.interests.filter((i) => b.interests.includes(i));
  const plans = (a.planTypes ?? []).filter((p) => (b.planTypes ?? []).includes(p));
  return { sharedInterests: interests, sharedPlanTypes: plans, sameIntent: a.intent === b.intent };
}

/** Distancia aproximada en kilómetros entre coordenadas redondeadas (haversine). */
export function approxDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Se muestra SOLO un rango, nunca la distancia exacta (protección contra triangulación). */
export function distanceBucket(km: number): 'muy_cerca' | 'cerca' | 'misma_zona' | 'lejos' {
  if (km < 5) return 'muy_cerca';
  if (km < 15) return 'cerca';
  if (km < 40) return 'misma_zona';
  return 'lejos';
}

/** Redondeo de coordenadas a ~1 km para almacenar; nunca se guardan coordenadas exactas. */
export function coarsenCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}
