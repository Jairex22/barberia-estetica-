import { useEffect, useRef, useState } from 'react';
import type { WsServerEvent } from '@sobremesa/shared';
import { API_URL, getToken } from './api';
/** WebSocket con token Bearer (móvil), reconexión exponencial y latido. */
export function useRealtime(onEvent: (e: WsServerEvent) => void) {
  const [connected, setConnected] = useState(false); const ws = useRef<WebSocket | null>(null); const h = useRef(onEvent); h.current = onEvent; const attempt = useRef(0); const closed = useRef(false);
  useEffect(() => {
    closed.current = false; let hb: any = null; let retry: any = null;
    async function connect() {
      if (closed.current) return; const token = await getToken(); if (!token) return;
      const s = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`); ws.current = s;
      s.onopen = () => { attempt.current = 0; setConnected(true); hb = setInterval(() => s.readyState === 1 && s.send(JSON.stringify({ type: 'ping' })), 25000); };
      s.onmessage = (m) => { try { h.current(JSON.parse(String(m.data))); } catch { /* ignorar */ } };
      s.onclose = () => { setConnected(false); if (hb) clearInterval(hb); if (!closed.current) { retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt.current++)); } };
      s.onerror = () => s.close();
    }
    connect();
    return () => { closed.current = true; if (hb) clearInterval(hb); if (retry) clearTimeout(retry); ws.current?.close(); };
  }, []);
  return { connected, send: (p: unknown) => { const s = ws.current; if (s && s.readyState === 1) { s.send(JSON.stringify(p)); return true; } return false; } };
}
