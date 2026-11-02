'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Field } from '@/components/Field';
export function LoginForm() {
  const router = useRouter(); const sp = useSearchParams();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return (
    <form className="mt-6 space-y-5" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMsg(null);
      try { await api('/auth/login', { method: 'POST', json: { email, password, device: 'web' } }); router.push(sp.get('next') ?? '/descubrir'); router.refresh(); }
      catch (err) { setMsg((err as ApiError).message); } finally { setBusy(false); }
    }}>
      <Field label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <Field label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      {msg && <p role="alert" className="text-danger">{msg}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      <div className="flex justify-between text-sm"><Link href="/olvide" className="text-wine underline">Olvidé mi contraseña</Link><Link href="/registro" className="text-wine underline">Crear cuenta</Link></div>
    </form>
  );
}
