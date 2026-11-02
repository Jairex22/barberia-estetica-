import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionUser } from '@sobremesa/shared';
import { api, getToken, setToken } from './api';
import { configurePurchases, logoutPurchases } from './purchases';

type Ctx = { user: SessionUser | null; loading: boolean; refresh: () => Promise<void>; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; setSession: (token: string) => Promise<void> };
const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const t = await getToken(); if (!t) { setUser(null); return; } const r = await api<{ user: SessionUser | null }>('/auth/me'); setUser(r.user); if (r.user) await configurePurchases(r.user.id); }
    catch (e: any) { if (e?.status === 401) { await setToken(null); setUser(null); } }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const setSession = async (token: string) => { await setToken(token); await refresh(); };
  const login = async (email: string, password: string) => { const r = await api<{ token: string }>('/auth/login', { method: 'POST', json: { email, password, device: 'móvil' } }); await setSession(r.token); };
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ya cerrada */ } await setToken(null); await logoutPurchases(); setUser(null); };
  return <AuthCtx.Provider value={{ user, loading, refresh, login, logout, setSession }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
