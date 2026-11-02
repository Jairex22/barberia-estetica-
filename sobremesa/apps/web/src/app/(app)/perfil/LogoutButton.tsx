'use client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
export function LogoutButton() { const r = useRouter(); return <button className="btn-secondary" onClick={async () => { await api('/auth/logout', { method: 'POST' }); r.push('/'); r.refresh(); }}>Cerrar sesión</button>; }
