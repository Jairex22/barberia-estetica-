import type { ZodType } from 'zod';
import { errors } from '../services/errors.js';

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of r.error.issues) {
      const k = issue.path.join('.') || '_';
      (fieldErrors[k] ??= []).push(issue.message);
    }
    throw errors.badRequest('validation', 'Datos inválidos', fieldErrors);
  }
  return r.data;
}
