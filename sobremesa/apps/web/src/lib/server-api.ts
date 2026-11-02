import { cookies } from 'next/headers';
import type { SessionUser } from '@sobremesa/shared';

const API = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/** Llamadas al API desde componentes de servidor, reenviando la cookie de sesión. */
export async function serverApi<T = any>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T | null }> {
  const jar = await cookies();
  const cookie = jar.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  try {
    const res = await fetch(`${API}${path}`, { ...init, headers: { cookie, ...(init.headers ?? {}) }, cache: 'no-store' });
    let data: T | null = null;
    try { data = (await res.json()) as T; } catch { /* vacío */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
export async function currentUser(): Promise<{ user: SessionUser | null; apiDown: boolean }> {
  const r = await serverApi<{ user: SessionUser | null }>('/auth/me');
  return { user: r.data?.user ?? null, apiDown: r.status === 0 };
}
