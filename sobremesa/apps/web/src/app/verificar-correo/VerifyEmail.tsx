'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
export function VerifyEmail() {
  const sp = useSearchParams(); const token = sp.get('token'); const sent = sp.get('enviado');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>(token ? 'busy' : 'idle'); const [msg, setMsg] = useState('');
  useEffect(() => { if (!token) return; api('/auth/verify-email', { method: 'POST', json: { token } }).then(() => setState('ok')).catch((e: ApiError) => { setMsg(e.message); setState('err'); }); }, [token]);
  if (state === 'ok') return (<div className="card p-8 mt-8 text-center"><h1 className="text-2xl font-semibold">Correo verificado</h1><p className="mt-2 text-ink-soft">Ya puedes completar tu perfil y empezar a descubrir personas.</p><Link href="/perfil/editar" className="btn-primary mt-6">Completar mi perfil</Link></div>);
  if (state === 'err') return (<div className="card p-8 mt-8 text-center" role="alert"><h1 className="text-2xl font-semibold">Enlace no válido</h1><p className="mt-2 text-ink-soft">{msg}</p><Resend /></div>);
  if (state === 'busy') return <p role="status" className="mt-8 text-center">Verificando…</p>;
  return (<div className="card p-8 mt-8 text-center"><h1 className="text-2xl font-semibold">Revisa tu correo</h1><p className="mt-2 text-ink-soft">{sent ? 'Te enviamos un enlace para confirmar tu cuenta. Es válido 24 horas.' : 'Necesitas verificar tu correo para continuar.'}</p><Resend /></div>);
}
function Resend() {
  const [s, setS] = useState<'idle' | 'ok' | 'err'>('idle');
  return (<div className="mt-6"><button className="btn-secondary" onClick={() => api('/auth/resend-verification', { method: 'POST' }).then(() => setS('ok')).catch(() => setS('err'))}>Reenviar correo</button>
    {s === 'ok' && <p role="status" className="mt-2 text-sage text-sm">Enviado. Revisa también tu carpeta de spam.</p>}
    {s === 'err' && <p role="alert" className="mt-2 text-danger text-sm">Inicia sesión para reenviar el correo. <Link href="/entrar" className="underline">Entrar</Link></p>}</div>);
}
