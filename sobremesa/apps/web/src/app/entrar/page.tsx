import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { LoginForm } from './LoginForm';
export const metadata: Metadata = { title: 'Entrar' };
export default function Page() {
  return (<PublicShell narrow><h1 className="text-3xl font-semibold mt-4">Entrar</h1><Suspense fallback={<p role="status" className="mt-6">Cargando…</p>}><LoginForm /></Suspense></PublicShell>);
}
