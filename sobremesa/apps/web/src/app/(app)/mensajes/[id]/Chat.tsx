'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Message } from '@sobremesa/shared';
import { api, ApiError, isOffline } from '@/lib/api';
import { StateView } from '@/components/StateView';
import { ReportDialog } from '@/components/ReportDialog';
import { useRealtime } from '@/lib/useRealtime';
import { timeShort, label } from '@/lib/format';

type Conv = { id: string; matchId: string; other: { id: string; displayName: string; photoUrl: string | null; isDemo: boolean }; otherProfile: { interests: string[]; planTypes: string[]; idealPlan: string | null; intent: string | null } | null; initiation: 'you' | 'them' | 'anyone' | 'started' };
type Pending = { clientId: string; body: string; status: 'sending' | 'queued' | 'failed'; error?: string };
const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function Chat({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [conv, setConv] = useState<Conv | null>(null); const [me, setMe] = useState<string | null>(null); const [msgs, setMsgs] = useState<Message[]>([]); const [pending, setPending] = useState<Pending[]>([]);
  const [err, setErr] = useState<ApiError | null>(null); const [text, setText] = useState(''); const [suggestions, setSuggestions] = useState<{ text: string; kind: string }[] | null>(null); const [report, setReport] = useState(false); const [menu, setMenu] = useState(false);
  const bottom = useRef<HTMLDivElement>(null); const lastSeq = useRef(0);

  const sync = useCallback(async () => {
    const r = await api<{ messages: Message[] }>(`/conversations/${conversationId}/messages?after=${lastSeq.current}&limit=100`);
    if (r.messages.length) { setMsgs((m) => merge(m, r.messages)); lastSeq.current = Math.max(lastSeq.current, ...r.messages.map((x) => x.seq)); api(`/conversations/${conversationId}/read`, { method: 'POST', json: { seq: lastSeq.current } }).catch(() => {}); }
  }, [conversationId]);

  useEffect(() => {
    Promise.all([api<{ conversation: Conv }>(`/conversations/${conversationId}`), api<{ user: { id: string } }>('/auth/me')])
      .then(async ([c, u]) => { setConv(c.conversation); setMe(u.user.id); await sync(); })
      .catch((e: ApiError) => setErr(e));
  }, [conversationId, sync]);

  const { connected, send } = useRealtime((e) => {
    if (e.type === 'message.new' && e.message.conversationId === conversationId) {
      setMsgs((m) => merge(m, [e.message])); lastSeq.current = Math.max(lastSeq.current, e.message.seq);
      setPending((p) => p.filter((x) => x.clientId !== e.message.clientId));
      if (conv && conv.initiation !== 'started') setConv({ ...conv, initiation: 'started' });
      api(`/conversations/${conversationId}/read`, { method: 'POST', json: { seq: e.message.seq } }).catch(() => {});
    }
    if (e.type === 'message.ack') setPending((p) => p.filter((x) => x.clientId !== e.clientId));
    if (e.type === 'error' && (e as any).clientId) setPending((p) => p.map((x) => (x.clientId === (e as any).clientId ? { ...x, status: 'failed', error: e.message } : x)));
    if (e.type === 'conversation.removed' && e.conversationId === conversationId) router.push('/mensajes');
  });
  useEffect(() => { if (connected) { sync(); flush(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [connected]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, pending.length]);

  async function deliver(p: Pending) {
    try {
      const r = await api<{ message: Message }>(`/conversations/${conversationId}/messages`, { method: 'POST', json: { clientId: p.clientId, body: p.body } });
      setMsgs((m) => merge(m, [r.message])); lastSeq.current = Math.max(lastSeq.current, r.message.seq);
      setPending((q) => q.filter((x) => x.clientId !== p.clientId)); if (conv && conv.initiation !== 'started') setConv({ ...conv, initiation: 'started' });
    } catch (e) {
      const a = e as ApiError;
      setPending((q) => q.map((x) => (x.clientId === p.clientId ? { ...x, status: a.status === 0 ? 'queued' : 'failed', error: a.status === 0 ? undefined : a.message } : x)));
    }
  }
  function flush() { setPending((q) => { q.filter((x) => x.status === 'queued').forEach((x) => deliver({ ...x, status: 'sending' })); return q.map((x) => (x.status === 'queued' ? { ...x, status: 'sending' } : x)); }); }
  useEffect(() => { const on = () => flush(); window.addEventListener('online', on); return () => window.removeEventListener('online', on); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault(); const body = text.trim(); if (!body) return;
    const p: Pending = { clientId: newId(), body, status: isOffline() ? 'queued' : 'sending' };
    setPending((q) => [...q, p]); setText(''); setSuggestions(null);
    if (p.status === 'queued') return;
    if (!send({ type: 'message.send', conversationId, clientId: p.clientId, body })) deliver(p);
  }

  if (err) return <StateView state={err.status === 404 ? 'empty' : 'error'} title={err.status === 404 ? 'Conversación no disponible' : undefined} body={err.status === 404 ? 'Esta conexión terminó o ya no está disponible.' : err.message} action={<Link href="/mensajes" className="btn-secondary">Volver a Mensajes</Link>} />;
  if (!conv || !me) return <StateView state="loading" />;
  const canWrite = conv.initiation !== 'them';
  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-5rem)]">
      <header className="flex items-center gap-3 pb-3 border-b border-cream-2">
        <Link href="/mensajes" className="btn-ghost px-3" aria-label="Volver">←</Link>
        <div className="h-10 w-10 rounded-full bg-cream-2 overflow-hidden">{conv.other.photoUrl && <img src={conv.other.photoUrl} alt="" className="h-full w-full object-cover" />}</div>
        <div className="min-w-0 flex-1"><h1 className="font-semibold truncate">{conv.other.displayName}{conv.other.isDemo && <span className="badge-demo ml-2">Demo</span>}</h1><p className="text-xs text-ink-muted">{connected ? 'En línea con el servidor' : 'Reconectando…'}</p></div>
        <div className="relative">
          <button className="btn-ghost px-3" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} aria-label="Más opciones">⋯</button>
          {menu && <ul role="menu" className="absolute right-0 mt-1 card p-1 w-56 z-10">
            <li><button role="menuitem" className="w-full text-left px-3 py-2 rounded-lg hover:bg-cream" onClick={() => { setMenu(false); setReport(true); }}>Denunciar o bloquear</button></li>
            <li><button role="menuitem" className="w-full text-left px-3 py-2 rounded-lg hover:bg-cream" onClick={async () => { if (confirm('¿Deshacer esta conexión? La conversación desaparecerá para ambos.')) { await api(`/matches/${conv.matchId}`, { method: 'DELETE' }); router.push('/mensajes'); } }}>Deshacer conexión</button></li>
          </ul>}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto py-4 space-y-2" role="log" aria-live="polite" aria-label="Mensajes">
        {msgs.length === 0 && (
          <div className="card p-5 text-center text-ink-soft">
            <p>{conv.initiation === 'them' ? 'En esta conexión, ella da el primer paso. Cuando escriba, podrás responder.' : conv.initiation === 'you' ? 'Tú das el primer paso. Escribe cuando quieras; sin prisa.' : 'Cualquiera de los dos puede iniciar.'}</p>
            {conv.otherProfile && (conv.otherProfile.interests.length > 0) && <p className="mt-2 text-sm">Intereses de {conv.other.displayName}: {conv.otherProfile.interests.slice(0, 5).map(label).join(', ')}</p>}
          </div>
        )}
        {msgs.map((m) => <Bubble key={m.id} mine={m.senderId === me} body={m.body} time={timeShort(m.createdAt)} />)}
        {pending.map((p) => <Bubble key={p.clientId} mine body={p.body} time={p.status === 'queued' ? 'En cola (sin conexión)' : p.status === 'failed' ? `No enviado: ${p.error ?? 'error'}` : 'Enviando…'} pending={p.status !== 'failed'} failed={p.status === 'failed'} onRetry={p.status === 'failed' ? () => deliver({ ...p, status: 'sending' }) : undefined} />)}
        <div ref={bottom} />
      </div>
      {suggestions && (
        <div className="mb-2 card p-3 text-sm">
          <p className="text-ink-muted mb-2">Sugerencias (plantillas; nada se envía hasta que pulses Enviar):</p>
          <ul className="flex flex-col gap-1">{suggestions.map((s, i) => <li key={i}><button className="text-left w-full rounded-lg px-3 py-2 hover:bg-cream" onClick={() => { setText(s.text); setSuggestions(null); }}>{s.kind === 'plan' ? '📍 ' : '💬 '}{s.text}</button></li>)}</ul>
        </div>
      )}
      <form onSubmit={submit} className="flex items-end gap-2 pt-2 border-t border-cream-2 safe-bottom">
        <button type="button" className="btn-secondary px-3" aria-label="Ver rompehielos y propuestas de plan" disabled={!canWrite} onClick={async () => { const r = await api<{ suggestions: any[] }>(`/conversations/${conversationId}/icebreakers`); setSuggestions(r.suggestions); }}>✦</button>
        <label htmlFor="msg" className="sr-only">Mensaje</label>
        <textarea id="msg" className="input flex-1 max-h-32 resize-none" rows={1} maxLength={2000} value={text} disabled={!canWrite} placeholder={canWrite ? 'Escribe un mensaje…' : 'Ella escribe primero'} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }} />
        <button className="btn-primary" disabled={!canWrite || !text.trim()}>Enviar</button>
      </form>
      {report && <ReportDialog target={conv.other} conversationId={conversationId} onClose={(done) => { setReport(false); if (done) router.push('/mensajes'); }} />}
    </div>
  );
}
function Bubble({ mine, body, time, pending, failed, onRetry }: { mine: boolean; body: string; time: string; pending?: boolean; failed?: boolean; onRetry?: () => void }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-wine text-cream rounded-br-md' : 'bg-paper text-ink rounded-bl-md shadow-[var(--shadow-soft)]'} ${pending ? 'opacity-70' : ''} ${failed ? 'ring-2 ring-danger' : ''}`}>
        <p className="whitespace-pre-wrap break-words">{body}</p>
        <p className={`mt-1 text-[11px] ${mine ? 'text-cream/70' : 'text-ink-muted'}`}>{time}{onRetry && <button className="underline ml-2" onClick={onRetry}>Reintentar</button>}</p>
      </div>
    </div>
  );
}
function merge(a: Message[], b: Message[]) { const map = new Map(a.map((m) => [m.id, m])); for (const m of b) map.set(m.id, m); return [...map.values()].sort((x, y) => x.seq - y.seq); }
