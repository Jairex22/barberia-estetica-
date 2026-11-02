'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ConversationSummary } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { StateView } from '@/components/StateView';
import { useRealtime } from '@/lib/useRealtime';
import { timeShort } from '@/lib/format';

const INIT: Record<string, string> = { them: 'Ella escribe primero', you: 'Tú das el primer paso', anyone: 'Cualquiera puede iniciar', started: '' };

export function Inbox() {
  const [convs, setConvs] = useState<ConversationSummary[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = () => api<{ conversations: ConversationSummary[] }>('/conversations').then((r) => setConvs(r.conversations)).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, []);
  useRealtime((e) => { if (e.type === 'message.new' || e.type === 'match.new' || e.type === 'conversation.removed') load(); });
  if (err) return <StateView state="error" body={err} action={<button className="btn-secondary" onClick={load}>Reintentar</button>} />;
  if (!convs) return <StateView state="loading" />;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Mensajes</h1>
      {convs.length === 0 ? <div className="mt-5"><StateView state="empty" title="Sin conversaciones" body="Aquí aparecerán tus conexiones. Nunca verás mensajes inventados ni avisos de personas que no existen." action={<Link href="/descubrir" className="btn-primary">Descubrir</Link>} /></div> : (
        <ul className="mt-4 divide-y divide-cream-2 card">
          {convs.map((c) => (
            <li key={c.id}><Link href={`/mensajes/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-cream">
              <div className="h-14 w-14 rounded-full bg-cream-2 overflow-hidden shrink-0">{c.other.photoUrl && <img src={c.other.photoUrl} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2"><p className="font-medium truncate">{c.other.displayName}{c.other.isDemo && <span className="badge-demo ml-2">Demo</span>}</p>{c.lastMessage && <time className="text-xs text-ink-muted shrink-0">{timeShort(c.lastMessage.createdAt)}</time>}</div>
                <p className="text-sm text-ink-muted truncate">{c.lastMessage ? c.lastMessage.body : INIT[c.initiation]}</p>
              </div>
              {c.unreadCount > 0 && <span className="rounded-full bg-ember text-white text-xs px-2 py-0.5" aria-label={`${c.unreadCount} sin leer`}>{c.unreadCount}</span>}
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
