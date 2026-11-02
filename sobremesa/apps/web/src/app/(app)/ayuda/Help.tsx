'use client';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { BRAND } from '@sobremesa/shared';

type Turn = { role: 'user' | 'assistant'; text: string; sources?: { title: string }[]; degraded?: boolean; handoff?: boolean };
export function Help() {
  const [faq, setFaq] = useState<{ id: string; title: string; body: string }[]>([]); const [open, setOpen] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [convId, setConvId] = useState<string | undefined>(); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { api<{ articles: any[] }>('/assistant/faq?locale=es').then((r) => setFaq(r.articles)).catch(() => {}); }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [turns.length]);
  async function ask(e: React.FormEvent) {
    e.preventDefault(); const q = text.trim(); if (!q) return; setText(''); setTurns((t) => [...t, { role: 'user', text: q }]); setBusy(true);
    try { const r = await api<any>('/assistant/chat', { method: 'POST', json: { message: q, conversationId: convId, locale: 'es' } }); setConvId(r.conversationId); setTurns((t) => [...t, { role: 'assistant', text: r.reply, sources: r.sources, degraded: r.degraded, handoff: r.handoffSuggested }]); }
    catch (err) { setTurns((t) => [...t, { role: 'assistant', text: (err as ApiError).message, degraded: true, handoff: true }]); } finally { setBusy(false); }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5 flex flex-col h-[70dvh]">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Ayuda</h1><span className="badge-ai" title="Asistente automatizado">🤖 Asistente de IA</span></div>
        <p className="text-sm text-ink-muted mt-1">Esto es una inteligencia artificial, no una persona. Puede equivocarse; si no tiene información suficiente te lo dirá y te ofreceremos contacto humano ({BRAND.supportEmail}).</p>
        <div className="flex-1 overflow-y-auto mt-4 space-y-3" role="log" aria-live="polite">
          {turns.length === 0 && <p className="text-ink-muted text-sm">Pregunta sobre tu cuenta, pagos, suscripción, privacidad o cómo funciona la app.</p>}
          {turns.map((t, i) => (
            <div key={i} className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${t.role === 'user' ? 'ml-auto bg-wine text-cream' : 'bg-cream text-ink'}`}>
              {t.role === 'assistant' && <p className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">Asistente de IA{t.degraded ? ' · modo FAQ (modelo no disponible)' : ''}</p>}
              <p className="whitespace-pre-wrap">{t.text}</p>
              {t.sources && t.sources.length > 0 && <p className="mt-2 text-xs text-ink-muted">Fuentes: {t.sources.map((s) => s.title).join(' · ')}</p>}
              {t.handoff && t.role === 'assistant' && <p className="mt-2 text-xs"><a className="underline text-wine" href={`mailto:${BRAND.supportEmail}`}>Hablar con una persona</a></p>}
            </div>
          ))}
          {busy && <p className="text-sm text-ink-muted" role="status">Pensando…</p>}
          <div ref={end} />
        </div>
        <form onSubmit={ask} className="flex gap-2 pt-3 border-t border-cream-2">
          <label htmlFor="q" className="sr-only">Tu pregunta</label>
          <input id="q" className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} placeholder="Escribe tu pregunta…" />
          <button className="btn-primary" disabled={busy || !text.trim()}>Enviar</button>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
        <ul className="mt-3 card divide-y divide-cream-2">
          {faq.map((a) => (
            <li key={a.id}><button className="w-full text-left px-4 py-3 font-medium flex justify-between items-center" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>{a.title}<span aria-hidden>{open === a.id ? '−' : '+'}</span></button>{open === a.id && <p className="px-4 pb-4 text-ink-soft whitespace-pre-line">{a.body}</p>}</li>
          ))}
          {faq.length === 0 && <li className="px-4 py-3 text-ink-muted">Sin artículos publicados por ahora.</li>}
        </ul>
        <div className="mt-4 text-sm text-ink-muted"><p>Emergencias en México: <strong>911</strong>. Soporte humano: <a className="underline" href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a> (respuesta habitual: 1 día hábil).</p></div>
      </section>
    </div>
  );
}
