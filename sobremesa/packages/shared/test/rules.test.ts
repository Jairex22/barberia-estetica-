import { describe, it, expect } from 'vitest';
import { canInitiateConversation, isAdult, ageFromBirthdate, distanceBucket, coarsenCoordinate, wantsGender } from '../src/index.js';

describe('canInitiateConversation', () => {
  it('mujer-hombre: solo la mujer inicia', () => {
    expect(canInitiateConversation('mujer', 'hombre').allowed).toBe(true);
    expect(canInitiateConversation('hombre', 'mujer').allowed).toBe(false);
  });
  it('mismo género: cualquiera inicia', () => {
    expect(canInitiateConversation('mujer', 'mujer').allowed).toBe(true);
    expect(canInitiateConversation('hombre', 'hombre').allowed).toBe(true);
    expect(canInitiateConversation('no_binario', 'no_binario').allowed).toBe(true);
  });
  it('combinaciones mixtas: política por defecto inclusiva (either)', () => {
    expect(canInitiateConversation('hombre', 'no_binario').allowed).toBe(true);
    expect(canInitiateConversation('no_binario', 'hombre').allowed).toBe(true);
    expect(canInitiateConversation('mujer', 'otro').allowed).toBe(true);
  });
  it('combinaciones mixtas: política non_man_first', () => {
    expect(canInitiateConversation('hombre', 'no_binario', 'non_man_first').allowed).toBe(false);
    expect(canInitiateConversation('no_binario', 'hombre', 'non_man_first').allowed).toBe(true);
    expect(canInitiateConversation('no_binario', 'otro', 'non_man_first').allowed).toBe(true);
  });
});

describe('edad', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  it('calcula edad con cumpleaños pendiente', () => {
    expect(ageFromBirthdate('2008-11-03', now)).toBe(17);
    expect(ageFromBirthdate('2008-11-02', now)).toBe(18);
  });
  it('isAdult', () => {
    expect(isAdult('2008-11-03', 18, now)).toBe(false);
    expect(isAdult('1990-01-01', 18, now)).toBe(true);
  });
});

describe('ubicación aproximada', () => {
  it('redondea a ~1 km', () => expect(coarsenCoordinate(20.67654321)).toBe(20.68));
  it('solo rangos', () => {
    expect(distanceBucket(2)).toBe('muy_cerca');
    expect(distanceBucket(10)).toBe('cerca');
    expect(distanceBucket(30)).toBe('misma_zona');
    expect(distanceBucket(100)).toBe('lejos');
  });
});

describe('preferencias', () => {
  it('wantsGender', () => {
    expect(wantsGender('todas', 'no_binario')).toBe(true);
    expect(wantsGender('mujeres', 'hombre')).toBe(false);
    expect(wantsGender('hombres', 'hombre')).toBe(true);
  });
});
