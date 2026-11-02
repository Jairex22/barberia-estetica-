'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Field, Check } from '@/components/Field';
import { GENDERS, INTERESTED_IN } from '@sobremesa/shared';
import { label } from '@/lib/format';

export function RegisterForm() {
  const router = useRouter();
  const [f, setF] = useState({ email: '', password: '', birthdate: '', gender: '' as string, interestedIn: '' as string, displayName: '', acceptTerms: false, acceptPrivacy: false, confirmAdult: false, marketingOptIn: false });
  const [errors, setErrors] = useState<Record<string, string[]>>({}); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form className="mt-6 space-y-5" noValidate onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErrors({}); setMsg(null);
      try { await api('/auth/register', { method: 'POST', json: f }); router.push('/verificar-correo?enviado=1'); }
      catch (err) { const a = err as ApiError; if (a.details) setErrors(a.details as any); setMsg(a.message); }
      finally { setBusy(false); }
    }}>
      <Field label="Nombre que verán los demás" value={f.displayName} onChange={(e) => set('displayName', e.target.value)} error={errors.displayName} autoComplete="nickname" maxLength={30} required />
      <Field label="Correo" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="email" required />
      <Field label="Contraseña" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} error={errors.password} hint="Mínimo 10 caracteres." autoComplete="new-password" required />
      <Field label="Fecha de nacimiento" type="date" value={f.birthdate} onChange={(e) => set('birthdate', e.target.value)} error={errors.birthdate} hint="Debes tener 18 años o más. No se muestra; solo tu edad, si quieres." required />
      <fieldset>
        <legend className="label">Me identifico como</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {GENDERS.map((g) => <button type="button" key={g} role="radio" aria-checked={f.gender === g} onClick={() => set('gender', g)} className={f.gender === g ? 'chip-on' : 'chip'}>{label(g)}</button>)}
        </div>
        {errors.gender && <p role="alert" className="text-sm text-danger mt-1">{errors.gender.join(' ')}</p>}
        <p className="text-sm text-ink-muted mt-1">Solo usamos lo que declaras; nunca lo deducimos de tus fotos.</p>
      </fieldset>
      <fieldset>
        <legend className="label">Quiero conocer</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {INTERESTED_IN.map((g) => <button type="button" key={g} role="radio" aria-checked={f.interestedIn === g} onClick={() => set('interestedIn', g)} className={f.interestedIn === g ? 'chip-on' : 'chip'}>{label(g)}</button>)}
        </div>
        {errors.interestedIn && <p role="alert" className="text-sm text-danger mt-1">{errors.interestedIn.join(' ')}</p>}
      </fieldset>
      <div className="space-y-2">
        <Check checked={f.confirmAdult} onChange={(e) => set('confirmAdult', e.target.checked)} error={errors.confirmAdult} label="Confirmo que tengo 18 años o más." />
        <Check checked={f.acceptTerms} onChange={(e) => set('acceptTerms', e.target.checked)} error={errors.acceptTerms} label={<>Acepto los <Link className="underline" href="/legal/terminos" target="_blank">Términos</Link> y las <Link className="underline" href="/legal/comunidad" target="_blank">Normas de comunidad</Link>.</>} />
        <Check checked={f.acceptPrivacy} onChange={(e) => set('acceptPrivacy', e.target.checked)} error={errors.acceptPrivacy} label={<>He leído el <Link className="underline" href="/legal/privacidad" target="_blank">Aviso de privacidad</Link>.</>} />
        <Check checked={f.marketingOptIn} onChange={(e) => set('marketingOptIn', e.target.checked)} label="Quiero recibir novedades y eventos por correo (opcional, máximo 1 por semana, baja en un clic)." />
      </div>
      {msg && <p role="alert" className="text-danger">{msg}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button>
      <p className="text-center text-sm text-ink-muted">¿Ya tienes cuenta? <Link href="/entrar" className="text-wine underline">Entrar</Link></p>
    </form>
  );
}
