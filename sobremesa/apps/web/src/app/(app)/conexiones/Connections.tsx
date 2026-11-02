'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicProfile } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { StateView } from '@/components/StateView';
import { ProfileCard } from '@/components/ProfileCard';

type Match = { id: string; conversationId: string; createdAt: string; hasMessages: boolean; other: { id: string; displayName: string; photoUrl: string | null; isDemo: boolean } };
type Likes = { count: number; profiles: PublicProfile[] | null; premiumRequired: boolean };

export function Connections() {
  const [matches, setMatches] = useState<Match[] | null>(null); const [likes, setLikes] = useState<Likes | null>(null); const [err, setErr] = useState<string | null>(null); const [tab, setTab] = useState<'matches' | 'likes'>('matches'); const [open, setOpen] = useState<PublicProfile | null>(null);
  const load = () => Promise.all([api<{ matches: Match[] }>('/matches'), api<Likes>('/discover/likes')]).then(([m, l]) => { setMatches(m.matches); setLikes(l); }).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, []);
  if (err) return <StateView state="error" body={err} action={<button className="btn-secondary" onClick={load}>Reintentar</button>} />;
  if (!matches || !likes) return <StateView state="loading" />;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Conexiones</h1>
      <div role="tablist" aria-label="Secciones" className="mt-4 flex gap-2">
        <button role="tab" aria-selected={tab === 'matches'} className={tab === 'matches' ? 'chip-on' : 'chip'} onClick={() => setTab('matches')}>Conexiones ({matches.length})</button>
        <button role="tab" aria-selected={tab === 'likes'} className={tab === 'likes' ? 'chip-on' : 'chip'} onClick={() => setTab('likes')}>Likes recibidos ({likes.count})</button>
      </div>
      {tab === 'matches' && (matches.length === 0 ? <StateView state="empty" title="Aún no tienes conexiones" body="Cuando tú y otra persona se den like, aparecerá aquí. No apresuramos nada ni inventamos conexiones." action={<Link href="/descubrir" className="btn-primary">Descubrir</Link>} /> : (
        <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {matches.map((m) => (
            <li key={m.id}><Link href={`/mensajes/${m.conversationId}`} className="card block overflow-hidden focus-visible:outline-ember">
              <div className="aspect-[3/4] bg-cream-2">{m.other.photoUrl ? <img src={m.other.photoUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
              <div className="p-3"><p className="font-medium truncate">{m.other.displayName}</p><p className="text-xs text-ink-muted">{m.hasMessages ? 'Conversación iniciada' : 'Sin mensajes aún'}{m.other.isDemo ? ' · Demo' : ''}</p></div>
            </Link></li>
          ))}
        </ul>
      ))}
      {tab === 'likes' && (likes.premiumRequired ? (
        <div className="card p-6 mt-5">
          <p className="text-lg">{likes.count === 0 ? 'Por ahora nadie te ha dado like. Es el número real.' : `${likes.count} ${likes.count === 1 ? 'persona te dio' : 'personas te dieron'} like.`}</p>
          <p className="mt-2 text-ink-soft">Con Premium puedes ver quiénes son y decidir con calma. Si prefieres no pagar, también los verás si coinciden contigo en Descubrir.</p>
          {likes.count > 0 && <Link href="/premium" className="btn-primary mt-4">Ver qué incluye Premium</Link>}
        </div>
      ) : (likes.profiles?.length ? (
        <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">{likes.profiles.map((p) => <li key={p.id}><button className="card block overflow-hidden w-full text-left" onClick={() => setOpen(p)}><div className="aspect-[3/4] bg-cream-2">{p.photos[0] && <img src={p.photos[0].url} alt="" className="h-full w-full object-cover" />}</div><div className="p-3"><p className="font-medium truncate">{p.displayName}{p.age ? `, ${p.age}` : ''}</p></div></button></li>)}</ul>
      ) : <StateView state="empty" title="Sin likes nuevos" body="Nadie te ha dado like todavía. Te lo mostramos tal cual es." />))}
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-4" onClick={() => setOpen(null)}>
          <div className="max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <ProfileCard p={open}>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="btn-secondary" onClick={async () => { await api('/discover/swipe', { method: 'POST', json: { targetId: open.id, action: 'pass' } }); setOpen(null); load(); }}>Pasar</button>
                <button className="btn-primary" onClick={async () => { const r = await api('/discover/swipe', { method: 'POST', json: { targetId: open.id, action: 'like' } }); setOpen(null); load(); if (r.matched) setTab('matches'); }}>Me gusta</button>
              </div>
            </ProfileCard>
            <button className="btn-secondary w-full mt-3" onClick={() => setOpen(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
