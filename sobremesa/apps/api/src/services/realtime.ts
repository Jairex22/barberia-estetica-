import type { Sql } from '../db/client.js';
import type { WsServerEvent } from '@sobremesa/shared';

type SocketLike = { send(data: string): void; readyState: number };
const CHANNEL = 'sobremesa_events';

/**
 * Bus de eventos en tiempo real. Entrega local a sockets conectados y, además, publica por
 * Postgres NOTIFY para que otras instancias del API entreguen a sus propios sockets.
 */
export class RealtimeBus {
  private sockets = new Map<string, Set<SocketLike>>();
  private unlisten: (() => Promise<void>) | null = null;
  constructor(private sql: Sql, private instanceId: string) {}

  async start() {
    const { unlisten } = await this.sql.listen(CHANNEL, (payload) => {
      try {
        const msg = JSON.parse(payload) as { from: string; userIds: string[]; event: WsServerEvent };
        if (msg.from === this.instanceId) return; // ya entregado localmente
        for (const id of msg.userIds) this.deliverLocal(id, msg.event);
      } catch { /* ignorar payload corrupto */ }
    });
    this.unlisten = unlisten;
  }
  async stop() { try { if (this.unlisten) await this.unlisten(); } catch { /* conexión ya cerrada */ } this.unlisten = null; }

  subscribe(userId: string, socket: SocketLike) {
    if (!this.sockets.has(userId)) this.sockets.set(userId, new Set());
    this.sockets.get(userId)!.add(socket);
    return () => { const set = this.sockets.get(userId); set?.delete(socket); if (set && set.size === 0) this.sockets.delete(userId); };
  }
  connectedCount() { let n = 0; for (const s of this.sockets.values()) n += s.size; return n; }

  private deliverLocal(userId: string, event: WsServerEvent) {
    const set = this.sockets.get(userId);
    if (!set) return;
    const data = JSON.stringify(event);
    for (const s of set) { if (s.readyState === 1) { try { s.send(data); } catch { /* socket cerrado */ } } }
  }

  async publish(userIds: string[], event: WsServerEvent) {
    for (const id of userIds) this.deliverLocal(id, event);
    const payload = JSON.stringify({ from: this.instanceId, userIds, event });
    if (payload.length < 7900) { try { await this.sql.notify(CHANNEL, payload); } catch { /* best effort */ } }
  }
}
