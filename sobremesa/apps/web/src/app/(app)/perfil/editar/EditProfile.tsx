'use client';
import { useEffect, useRef, useState } from 'react';
import { INTERESTS, PLAN_TYPES, RELATIONSHIP_INTENTS, INTERESTED_IN, GENDERS } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { Field } from '@/components/Field';
import { StateView } from '@/components/StateView';
import { label } from '@/lib/format';

export function EditProfile() {
  const [p, setP] = useState<any>(null); const [err, setErr] = useState<string | null>(null); const [saved, setSaved] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [geo, setGeo] = useState<'idle' | 'busy' | 'denied' | 'ok'>('idle');
  const file = useRef<HTMLInputElement>(null);
  const load = () => api<{ profile: any }>('/profile/me').then((r) => setP(r.profile)).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, []);
  if (err) return <StateView state="error" body={err} />;
  if (!p) return <StateView state="loading" />;
  const toggle = (k: 'interests' | 'planTypes', v: string, max: number) => setP((s: any) => { const has = s[k].includes(v); if (!has && s[k].length >= max) return s; return { ...s, [k]: has ? s[k].filter((x: string) => x !== v) : [...s[k], v] }; });
  async function save() {
    setBusy(true); setSaved(null); setErrors({});
    try {
      const body: any = { displayName: p.displayName, bio: p.bio, gender: p.gender, interestedIn: p.interestedIn, intent: p.intent ?? undefined, interests: p.interests, planTypes: p.planTypes, idealPlan: p.idealPlan ?? '', occupation: p.occupation ?? '', city: p.city ?? '', showAge: p.showAge, showDistance: p.showDistance, prefAgeMin: p.prefAgeMin, prefAgeMax: p.prefAgeMax, prefMaxDistanceKm: p.prefMaxDistanceKm };
      if (p._location) body.location = p._location;
      const r = await api<{ profile: any }>('/profile/me', { method: 'PATCH', json: body }); setP(r.profile); setSaved(r.profile.completedAt ? 'Guardado. Tu perfil está completo.' : 'Guardado. Para aparecer en Descubrir faltan: ' + missing(r.profile).join(', ') + '.');
    } catch (e) { const a = e as ApiError; setErrors((a.details as any) ?? {}); setSaved(a.message); } finally { setBusy(false); }
  }
  async function upload(f: File) {
    const fd = new FormData(); fd.append('file', f); setBusy(true);
    try { await api('/profile/me/photos', { method: 'POST', body: fd }); await load(); setSaved('Foto subida. Pasará por revisión antes de mostrarse (sin metadatos de ubicación).'); } catch (e) { setSaved((e as ApiError).message); } finally { setBusy(false); if (file.current) file.current.value = ''; }
  }
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Editar perfil</h1>
      <section className="mt-6"><h2 className="label">Fotos (máx. 6) · se eliminan los metadatos y se revisan antes de publicarse</h2>
        <ul className="grid grid-cols-3 gap-3">
          {p.photos.map((ph: any) => (
            <li key={ph.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cream-2">
              <img src={ph.url} alt="" className="h-full w-full object-cover" />
              <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${ph.status === 'approved' ? 'bg-sage-soft text-sage' : ph.status === 'rejected' ? 'bg-danger-soft text-danger' : 'bg-paper/90 text-ink-soft'}`}>{ph.status === 'approved' ? 'Aprobada' : ph.status === 'rejected' ? 'Rechazada' : 'En revisión'}</span>
              <button className="absolute right-1 top-1 rounded-full bg-paper/90 h-8 w-8 text-sm" aria-label="Eliminar foto" onClick={async () => { await api(`/profile/me/photos/${ph.id}`, { method: 'DELETE' }); load(); }}>✕</button>
              {ph.moderationNotes && ph.status === 'rejected' && <p className="absolute bottom-0 inset-x-0 bg-paper/90 text-[11px] p-1">{ph.moderationNotes}</p>}
            </li>
          ))}
          {p.photos.length < 6 && <li><button className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-cream-2 text-ink-muted hover:border-wine" onClick={() => file.current?.click()} disabled={busy}>+ Añadir</button><input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} aria-label="Elegir foto" /></li>}
        </ul>
      </section>
      <div className="mt-6 space-y-5">
        <Field label="Nombre" value={p.displayName} onChange={(e) => setP({ ...p, displayName: e.target.value })} maxLength={30} error={errors.displayName} />
        <div><label className="label" htmlFor="bio">Presentación (mín. 20 caracteres)</label><textarea id="bio" className="input min-h-[110px]" maxLength={500} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} aria-describedby="bio-c" /><p id="bio-c" className="text-xs text-ink-muted mt-1">{p.bio.length}/500</p></div>
        <Field label="Plan ideal para una primera cita" value={p.idealPlan ?? ''} onChange={(e) => setP({ ...p, idealPlan: e.target.value })} maxLength={160} hint="Ej.: café en Americana y caminar sin rumbo" />
        <Field label="Ocupación (opcional)" value={p.occupation ?? ''} onChange={(e) => setP({ ...p, occupation: e.target.value })} maxLength={60} />
        <fieldset><legend className="label">Qué busco</legend><div className="flex flex-wrap gap-2" role="radiogroup">{RELATIONSHIP_INTENTS.map((i) => <button type="button" key={i} role="radio" aria-checked={p.intent === i} className={p.intent === i ? 'chip-on' : 'chip'} onClick={() => setP({ ...p, intent: i })}>{label(i)}</button>)}</div></fieldset>
        <fieldset><legend className="label">Intereses ({p.interests.length}/12, mínimo 2)</legend><div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <button type="button" key={i} aria-pressed={p.interests.includes(i)} className={p.interests.includes(i) ? 'chip-on' : 'chip'} onClick={() => toggle('interests', i, 12)}>{label(i)}</button>)}</div></fieldset>
        <fieldset><legend className="label">Tipos de plan que me gustan ({p.planTypes.length}/5)</legend><div className="flex flex-wrap gap-2">{PLAN_TYPES.map((i) => <button type="button" key={i} aria-pressed={p.planTypes.includes(i)} className={p.planTypes.includes(i) ? 'chip-on' : 'chip'} onClick={() => toggle('planTypes', i, 5)}>{label(i)}</button>)}</div></fieldset>
        <fieldset><legend className="label">Me identifico como</legend><div className="flex flex-wrap gap-2" role="radiogroup">{GENDERS.map((g) => <button type="button" key={g} role="radio" aria-checked={p.gender === g} className={p.gender === g ? 'chip-on' : 'chip'} onClick={() => setP({ ...p, gender: g })}>{label(g)}</button>)}</div><p className="text-xs text-ink-muted mt-1">Define quién inicia la conversación en tus conexiones (ver Ayuda). Nunca se deduce de tus fotos.</p></fieldset>
        <fieldset><legend className="label">Quiero conocer</legend><div className="flex flex-wrap gap-2" role="radiogroup">{INTERESTED_IN.map((g) => <button type="button" key={g} role="radio" aria-checked={p.interestedIn === g} className={p.interestedIn === g ? 'chip-on' : 'chip'} onClick={() => setP({ ...p, interestedIn: g })}>{label(g)}</button>)}</div></fieldset>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Edad mínima" type="number" min={18} max={99} value={p.prefAgeMin} onChange={(e) => setP({ ...p, prefAgeMin: Number(e.target.value) })} error={errors.prefAgeMin} />
          <Field label="Edad máxima" type="number" min={18} max={99} value={p.prefAgeMax} onChange={(e) => setP({ ...p, prefAgeMax: Number(e.target.value) })} error={errors.prefAgeMax} />
        </div>
        <div><label className="label" htmlFor="dist">Distancia máxima: {p.prefMaxDistanceKm} km</label><input id="dist" type="range" min={5} max={200} step={5} value={p.prefMaxDistanceKm} onChange={(e) => setP({ ...p, prefMaxDistanceKm: Number(e.target.value) })} className="w-full accent-wine" /></div>
        <div className="card p-4">
          <p className="font-medium">Ubicación aproximada</p>
          <p className="text-sm text-ink-muted">Guardamos tu posición redondeada a ~1 km y solo mostramos rangos. {p.hasLocation ? 'Ya tienes ubicación guardada.' : 'Aún no tienes ubicación.'}</p>
          <div className="mt-3 flex flex-wrap gap-2 items-end">
            <button type="button" className="btn-secondary" disabled={geo === 'busy'} onClick={() => { if (!navigator.geolocation) return setGeo('denied'); setGeo('busy'); navigator.geolocation.getCurrentPosition((pos) => { setP((s: any) => ({ ...s, _location: { lat: pos.coords.latitude, lng: pos.coords.longitude }, hasLocation: true })); setGeo('ok'); }, () => setGeo('denied'), { enableHighAccuracy: false, timeout: 10000 }); }}>{geo === 'busy' ? 'Obteniendo…' : 'Usar mi ubicación'}</button>
            <div className="flex-1 min-w-[160px]"><Field label="o indica tu ciudad" value={p.city ?? ''} onChange={(e) => setP({ ...p, city: e.target.value })} maxLength={80} /></div>
          </div>
          {geo === 'denied' && <p role="status" className="mt-2 text-sm text-ink-soft">Sin permiso de ubicación. No pasa nada: indica tu ciudad y seguirás apareciendo (sin rango de distancia).</p>}
          {geo === 'ok' && <p role="status" className="mt-2 text-sm text-sage">Ubicación lista; se guardará redondeada al pulsar Guardar.</p>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5 accent-wine" checked={p.showAge} onChange={(e) => setP({ ...p, showAge: e.target.checked })} /> Mostrar mi edad</label>
          <label className="flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5 accent-wine" checked={p.showDistance} onChange={(e) => setP({ ...p, showDistance: e.target.checked })} /> Mostrar mi distancia aproximada</label>
        </div>
        {saved && <p role="status" className={saved.startsWith('Guardado') || saved.startsWith('Foto') ? 'text-sage' : 'text-danger'}>{saved}</p>}
        <button className="btn-primary w-full" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </div>
  );
}
function missing(p: any) { const m: string[] = []; if (p.bio.length < 20) m.push('presentación de 20+ caracteres'); if (!p.intent) m.push('qué buscas'); if (p.interests.length < 2) m.push('2 intereses'); if (!p.photos.length) m.push('una foto'); return m; }
