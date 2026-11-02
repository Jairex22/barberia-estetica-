import { es } from './es.js';
import { en } from './en.js';
import type { Locale } from '../constants.js';
export const dictionaries = { es, en } as const;
export function t(locale: Locale) { return dictionaries[locale] ?? es; }
export type { Dictionary } from './es.js';
