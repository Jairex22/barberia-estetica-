import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { VerifyEmail } from './VerifyEmail';
export const metadata: Metadata = { title: 'Verificar correo' };
export default function Page() { return (<PublicShell narrow><Suspense fallback={<p role="status" className="mt-6">Cargando…</p>}><VerifyEmail /></Suspense></PublicShell>); }
