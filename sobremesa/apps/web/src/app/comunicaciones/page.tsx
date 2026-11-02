'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicShell } from '@/components/PublicShell';
import { api } from '@/lib/api';
function Inner() {
  const token = useSearchParams().get('token'); const [s, setS] = useState<'busy' | 'ok' | 'err'>('busy');
  useEffect(() => { if (!token) { setS('err'); return; } api('/notifications/unsubscribe', { method: 'POST', json: { token } }).then((r: any) => setS(r.ok ? 'ok' : 'err')).catch(() => setS('err')); }, [token]);
  return (<PublicShell narrow><div className="card p-8 mt-8 text-center" role="status">
    {s === 'busy' && <p>Procesando…</p>}
    {s === 'ok' && <><h1 className="text-2xl font-semibold">Listo</h1><p className="mt-2 text-ink-soft">Ya no recibirás correos promocionales. Seguirás recibiendo avisos imprescindibles de tu cuenta (seguridad, pagos).</p></>}
    {s === 'err' && <><h1 className="text-2xl font-semibold">Enlace no válido</h1><p className="mt-2 text-ink-soft">Puedes gestionar tus comunicaciones desde Perfil → Notificaciones.</p></>}
  </div></PublicShell>);
}

export default function Page() { return <Suspense fallback={null}><Inner /></Suspense>; }
