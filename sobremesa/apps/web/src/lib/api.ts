/** Cliente HTTP para el navegador: habla con /api/* (proxy de Next al API). Incluye cookies httpOnly. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    ...rest, credentials: 'include',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 204) return undefined as T;
  let data: any = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'error', e.message ?? (res.status === 0 ? 'Sin conexión' : 'Error inesperado'), e.details);
  }
  return data as T;
}
export const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;
