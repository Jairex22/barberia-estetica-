'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Field } from '@/components/Field';
export function WaitlistForm() {
  const [email, setEmail] = useState(''); const [city, setCity] = useState('Guadalajara'); const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  return (
    <form className="mt-5 space-y-4" onSubmit={async (e) => { e.preventDefault(); setState('busy'); try { await api('/waitlist', { method: 'POST', json: { email, city } }); setState('ok'); } catch { setState('err'); } }}>
      <Field label="Correo" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <Field label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
      <button className="btn-primary w-full" disabled={state === 'busy'}>{state === 'busy' ? 'Enviando…' : 'Avísame'}</button>
      {state === 'ok' && <p role="status" className="text-sage">Listo. Te escribiremos solo para avisarte del lanzamiento en tu zona.</p>}
      {state === 'err' && <p role="alert" className="text-danger">No pudimos guardar tu correo. Inténtalo de nuevo.</p>}
    </form>
  );
}
