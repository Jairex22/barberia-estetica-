'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PublicShell } from '@/components/PublicShell';
import { api, ApiError } from '@/lib/api';
function Inner() {
  const token = useSearchParams().get('token') ?? ''; const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle'); const [msg, setMsg] = useState('');
  return (<PublicShell narrow><div className="card p-8 mt-8">
    {state === 'ok' ? <><h1 className="text-2xl font-semibold">Cuenta eliminada</h1><p className="mt-2 text-ink-soft">Tu perfil ya no es visible. Los datos se borran definitivamente en 30 días. Si tenías una suscripción de App Store o Google Play, recuerda cancelarla en la tienda.</p><Link href="/" className="btn-secondary mt-6">Volver al inicio</Link></> :
    <><h1 className="text-2xl font-semibold">Confirmar eliminación</h1><p className="mt-2 text-ink-soft">Esta acción es definitiva: se borran tu perfil, fotos, conexiones y mensajes. Si tienes Premium por la web, dejará de renovarse.</p>
    {msg && <p role="alert" className="mt-3 text-danger">{msg}</p>}
    <div className="mt-6 flex gap-3"><button className="btn-danger" disabled={state === 'busy'} onClick={async () => { setState('busy'); try { await api('/account/delete/confirm', { method: 'POST', json: { token } }); setState('ok'); } catch (e) { setMsg((e as ApiError).message); setState('err'); } }}>Sí, eliminar mi cuenta</button><Link href="/perfil" className="btn-secondary">Cancelar</Link></div></>}
  </div></PublicShell>);
}

export default function Page() { return <Suspense fallback={null}><Inner /></Suspense>; }
