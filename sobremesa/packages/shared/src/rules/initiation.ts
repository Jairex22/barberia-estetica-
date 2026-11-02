import type { Gender } from '../constants.js';

/**
 * Política para combinaciones que no son mujer-hombre, mujer-mujer u hombre-hombre.
 * 'either' (por defecto, inclusiva): cualquiera puede iniciar.
 * 'non_man_first': quien NO se declaró hombre inicia (si solo uno es hombre).
 * Se configura en el servidor con INITIATION_POLICY_MIXED; nunca se infiere el género.
 */
export type MixedInitiationPolicy = 'either' | 'non_man_first';

export type InitiationVerdict =
  | { allowed: true; reason: 'same_gender' | 'woman_first' | 'mixed_either' | 'mixed_non_man' }
  | { allowed: false; reason: 'woman_initiates' | 'mixed_non_man' };

/**
 * Decide si `actor` puede enviar el PRIMER mensaje a `other` en un match.
 * Regla central: entre mujer y hombre, la mujer inicia. Premium no cambia esto.
 */
export function canInitiateConversation(
  actor: Gender,
  other: Gender,
  policy: MixedInitiationPolicy = 'either',
): InitiationVerdict {
  const pair = new Set<Gender>([actor, other]);
  if (pair.has('mujer') && pair.has('hombre') && pair.size === 2) {
    return actor === 'mujer'
      ? { allowed: true, reason: 'woman_first' }
      : { allowed: false, reason: 'woman_initiates' };
  }
  if (actor === other) return { allowed: true, reason: 'same_gender' };
  // Combinaciones con no_binario / otro
  if (policy === 'non_man_first') {
    const menCount = [actor, other].filter((g) => g === 'hombre').length;
    if (menCount === 1) {
      return actor === 'hombre'
        ? { allowed: false, reason: 'mixed_non_man' }
        : { allowed: true, reason: 'mixed_non_man' };
    }
  }
  return { allowed: true, reason: 'mixed_either' };
}
