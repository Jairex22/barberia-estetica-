'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicProfile, SwipeResult } from '@sobremesa/shared';
import { api, ApiError, isOffline } from '@/lib/api';
import { ProfileCard } from '@/components/ProfileCard';
import { StateView, type UiState } from '@/components/StateView';
import { ReportDialog } from '@/components/ReportDialog';

export function Discover() {
  const [queue, setQueue] = useState<PublicProfile[]>([]); const [state, setState] = useState<UiState | 'ready'>('loading'); const [err, setErr] = useState<ApiError | null>(null);
  const [likesRemaining, setLikesRemaining] = useState<number | null>(null); const [match, setMatch] = useState<SwipeResult | null>(null); const [report, setReport] = useState<PublicProfile | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (isOffline()) { setState('offline'); return; }
    setState('loading'); setErr(null);
    try { const r = await api<{ profiles: PublicProfile[]; likesRemaining: number }>('/discover?limit=10'); setQueue(r.profiles); setLikesRemaining(r.likesRemaining); setState(r.profiles.length ? 'ready' : 'empty'); }
    catch (e) { const a = e as ApiError; setErr(a); setState(a.status === 503 ? 'unavailable' : a.status === 0 ? 'offline' : 'error'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const current = queue[0];
  async function act(action: 'like' | 'pass') {
    if (!current || busy) return; setBusy(true);
    try {
      const r = await api<SwipeResult>('/discover/swipe', { method: 'POST', json: { targetId: current.id, action } });
      if (r.remainingLikes != null) setLikesRemaining(r.remainingLikes);
      if (r.matched) setMatch(r);
      const rest = queue.slice(1); setQueue(rest); if (!rest.length) load();
    } catch (e) { const a = e as ApiError; if (a.code === 'like_limit') alert(a.message); else if (a.status === 404) { setQueue((q) => q.slice(1)); } else alert(a.message); }
    finally { setBusy(false); }
  }
  if (state === 'loading') return <StateView state="loading" />;
  if (state === 'empty') return <StateView state="empty" action={<Link href="/perfil/editar" className="btn-secondary">Revisar mis preferencias</Link>} />;
  if (state !== 'ready') return <StateView state={state} title={err?.status === 403 ? 'Falta un paso' : undefined} body={err?.status === 403 ? err.message : undefined} action={err?.status === 403 ? <Link href={err.message.includes('correo') ? '/verificar-correo' : '/perfil/editar'} className="btn-primary">{err.message.includes('correo') ? 'Verificar correo' : 'Completar perfil'}</Link> : <button className="btn-secondary" onClick={load}>Reintentar</button>} />;
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3 text-sm text-ink-muted"><h1 className="text-2xl font-semibold text-ink">Descubrir</h1>{likesRemaining != null && <span aria-live="polite">{likesRemaining} likes hoy</span>}</div>
      {current && (
        <ProfileCard p={current}>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="btn-secondary w-full min-h-[52px]" disabled={busy} onClick={() => act('pass')} aria-label={`Pasar de ${current.displayName}`}>Pasar</button>
            <button className="btn-primary w-full min-h-[52px]" disabled={busy} onClick={() => act('like')} aria-label={`Me gusta ${current.displayName}`}>Me gusta</button>
          </div>
          <div className="mt-2 text-center"><button className="btn-ghost text-sm py-2" onClick={() => setReport(current)} aria-label={`Denunciar o bloquear a ${current.displayName}`}>Denunciar o bloquear</button></div>
        </ProfileCard>
      )}
      <p className="mt-4 text-center text-xs text-ink-muted">Botones accesibles: no necesitas deslizar. Pasar no avisa a la otra persona.</p>
      {match && (
        <div role="dialog" aria-modal="true" aria-labelledby="match-t" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
          <div className="card p-8 max-w-sm w-full text-center fade-in">
            <h2 id="match-t" className="text-3xl font-semibold text-wine">¡Conexión!</h2>
            <p className="mt-2 text-ink-soft">Ambos se dieron like. Revisa quién puede escribir primero en la conversación.</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href={`/mensajes/${match.conversationId}`} className="btn-primary">Ir a la conversación</Link>
              <button className="btn-secondary" onClick={() => setMatch(null)}>Seguir descubriendo</button>
            </div>
          </div>
        </div>
      )}
      {report && <ReportDialog target={report} onClose={(done) => { setReport(null); if (done) setQueue((q) => q.filter((p) => p.id !== report.id)); }} />}
    </div>
  );
}
