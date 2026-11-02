'use client';
import { useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { Field } from '@/components/Field';
import { api } from '@/lib/api';
export default function Page() {
  const [email, setEmail] = useState(''); const [done, setDone] = useState(false);
  return (<PublicShell narrow><h1 className="text-3xl font-semibold mt-4">Recuperar acceso</h1>
    {done ? <p role="status" className="mt-6 card p-6">Si existe una cuenta con ese correo, te enviamos un enlace válido 30 minutos.</p> :
    <form className="mt-6 space-y-5" onSubmit={async (e) => { e.preventDefault(); await api('/auth/forgot-password', { method: 'POST', json: { email } }).catch(() => {}); setDone(true); }}>
      <Field label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <button className="btn-primary w-full">Enviar enlace</button></form>}
  </PublicShell>);
}
