import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra as any)?.apiUrl ?? 'http://10.0.2.2:4000';
const TOKEN_KEY = 'sobremesa_session_token';
let memToken: string | null = null;

export async function getToken() { if (memToken) return memToken; memToken = await SecureStore.getItemAsync(TOKEN_KEY); return memToken; }
export async function setToken(t: string | null) { memToken = t; if (t) await SecureStore.setItemAsync(TOKEN_KEY, t); else await SecureStore.deleteItemAsync(TOKEN_KEY); }

export class ApiError extends Error { constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); } }

/** Cliente HTTP móvil: token Bearer guardado en el almacén seguro del sistema. */
export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...rest, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(headers ?? {}) }, body: json !== undefined ? JSON.stringify(json) : rest.body });
  } catch { throw new ApiError(0, 'offline', 'Sin conexión. Revisa tu internet.'); }
  let data: any = null; try { data = await res.json(); } catch { /* vacío */ }
  if (!res.ok) { const e = data?.error ?? {}; throw new ApiError(res.status, e.code ?? 'error', e.message ?? 'Error inesperado', e.details); }
  return data as T;
}
