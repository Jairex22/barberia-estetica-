'use client';
import { useEffect, useRef, useState } from 'react';
import type { WsServerEvent } from '@sobremesa/shared';
import { api } from '@/lib/api';

/**
 * WebSocket con ticket de corta duración, reconexión exponencial y heartbeat.
 * La cola de envío pendiente vive en el componente de chat (idempotente por clientId).
 */
export function useRealtime(onEvent: (e: WsServerEvent) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null); const handler = useRef(onEvent); handler.current = onEvent;
  const attempt = useRef(0); const closed = useRef(false);
  useEffect(() => {
    closed.current = false;
    let hb: ReturnType<typeof setInterval> | null = null; let retry: ReturnType<typeof setTimeout> | null = null;
    async function connect() {
      if (closed.current) return;
      try {
        const { ticket } = await api<{ ticket: string }>('/auth/ws-ticket', { method: 'POST' });
        const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/^http/, 'ws');
        const ws = new WebSocket(`${base}/ws?ticket=${encodeURIComponent(ticket)}`);
        wsRef.current = ws;
        ws.onopen = () => { attempt.current = 0; setConnected(true); hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ type: 'ping' })), 25_000); };
        ws.onmessage = (m) => { try { handler.current(JSON.parse(m.data)); } catch { /* ignorar */ } };
        ws.onclose = () => { setConnected(false); if (hb) clearInterval(hb); schedule(); };
        ws.onerror = () => ws.close();
      } catch { schedule(); }
    }
    function schedule() { if (closed.current) return; const delay = Math.min(30_000, 1000 * 2 ** attempt.current++); retry = setTimeout(connect, delay); }
    connect();
    const onOnline = () => { if (!wsRef.current || wsRef.current.readyState > 1) { attempt.current = 0; connect(); } };
    window.addEventListener('online', onOnline);
    return () => { closed.current = true; window.removeEventListener('online', onOnline); if (hb) clearInterval(hb); if (retry) clearTimeout(retry); wsRef.current?.close(); };
  }, []);
  return { connected, send: (payload: unknown) => { const ws = wsRef.current; if (ws && ws.readyState === 1) { ws.send(JSON.stringify(payload)); return true; } return false; } };
}
