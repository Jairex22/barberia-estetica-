'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PublicShell } from '@/components/PublicShell';
import { Field } from '@/components/Field';
import { api, ApiError } from '@/lib/api';
function Inner() {
  const sp = useSearchParams(); const token = sp.get('token') ?? '';
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [ok, setOk] = useState(false);
  return (<PublicShell narrow><h1 className="text-3xl font-semibold mt-4">Nueva contraseña</h1>
    {ok ? <div className="card p-6 mt-6" role="status"><p>Contraseña actualizada. Cerramos tus otras sesiones por seguridad.</p><Link href="/entrar" className="btn-primary mt-4">Entrar</Link></div> :
    <form className="mt-6 space-y-5" onSubmit={async (e) => { e.preventDefault(); if (pw !== pw2) return setMsg('Las contraseñas no coinciden'); try { await api('/auth/reset-password', { method: 'POST', json: { token, password: pw } }); setOk(true); } catch (err) { setMsg((err as ApiError).message); } }}>
      <Field label="Nueva contraseña" type="password" value={pw} onChange={(e) => setPw(e.target.value)} hint="Mínimo 10 caracteres." autoComplete="new-password" required />
      <Field label="Repite la contraseña" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
      {msg && <p role="alert" className="text-danger">{msg}</p>}
      <button className="btn-primary w-full">Guardar</button></form>}
  </PublicShell>);
}

export default function Page() { return <Suspense fallback={null}><Inner /></Suspense>; }
