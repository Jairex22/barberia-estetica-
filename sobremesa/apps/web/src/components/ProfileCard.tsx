'use client';
import { useState } from 'react';
import type { PublicProfile } from '@sobremesa/shared';
import { label } from '@/lib/format';

export function ProfileCard({ p, children }: { p: PublicProfile; children?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const photo = p.photos[i] ?? p.photos[0];
  return (
    <article className="card overflow-hidden rise-in" aria-label={`Perfil de ${p.displayName}`}>
      <div className="relative aspect-[3/4] max-h-[520px] bg-cream-2">
        {photo ? <img src={photo.url} alt={`Foto ${i + 1} de ${p.displayName}`} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-ink-muted">Sin foto</div>}
        {p.photos.length > 1 && (
          <div className="absolute inset-x-0 top-0 flex gap-1 p-2" role="tablist" aria-label="Fotos">
            {p.photos.map((ph, k) => <button key={ph.id} role="tab" aria-selected={k === i} aria-label={`Foto ${k + 1}`} onClick={() => setI(k)} className={`h-1.5 flex-1 rounded-full ${k === i ? 'bg-paper' : 'bg-paper/40'}`} />)}
          </div>
        )}
        <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
          {p.isDemo && <span className="badge-demo bg-paper">Demostración</span>}
          {p.verified && <span className="inline-flex items-center gap-1 rounded-md bg-paper/90 px-2 py-0.5 text-xs font-semibold text-sage">✓ Verificado</span>}
          {p.distanceBucket && <span className="rounded-md bg-paper/90 px-2 py-0.5 text-xs text-ink-soft">{label(p.distanceBucket)}</span>}
        </div>
      </div>
      <div className="p-5">
        <h2 className="text-2xl font-semibold">{p.displayName}{p.age ? <span className="text-ink-muted font-normal">, {p.age}</span> : null}</h2>
        <p className="text-sm text-ink-muted">{[p.occupation, p.city, p.intent ? label(p.intent) : null].filter(Boolean).join(' · ')}</p>
        {p.bio && <p className="mt-3 text-ink-soft whitespace-pre-line">{p.bio}</p>}
        {p.idealPlan && <p className="mt-3 text-ink"><span className="text-ink-muted text-sm">Plan ideal: </span>{p.idealPlan}</p>}
        {p.signals && (p.signals.sharedInterests.length > 0 || p.signals.sameIntent) && (
          <div className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm">
            <p className="font-medium text-ink-soft">Por qué te mostramos a {p.displayName}</p>
            <ul className="mt-1 text-ink-soft">
              {p.signals.sharedInterests.length > 0 && <li>• Comparten: {p.signals.sharedInterests.map(label).join(', ')}</li>}
              {p.signals.sameIntent && <li>• Misma intención: {label(p.intent)}</li>}
              {p.signals.sharedPlanTypes.length > 0 && <li>• Les gusta el mismo tipo de plan: {p.signals.sharedPlanTypes.map(label).join(', ')}</li>}
            </ul>
          </div>
        )}
        {p.interests.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{p.interests.map((x) => <span key={x} className={p.signals?.sharedInterests.includes(x) ? 'chip-on' : 'chip'}>{label(x)}</span>)}</div>}
        {children}
      </div>
    </article>
  );
}
