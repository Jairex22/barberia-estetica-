'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AdminList, Small, dateTime } from '../AdminTable';
export default function Page() {
  const [c, setC] = useState<any>(null);
  useEffect(() => { api('/admin/assistant/costs').then(setC); }, []);
  return (<div className="space-y-6">
    {c && <section className="card p-5 text-sm"><h2 className="font-semibold">Costos del asistente</h2><p>Modelo: {c.model} · {c.configured ? 'clave configurada' : 'sin clave (modo FAQ)'} · Mes: US$ {Number(c.monthToDateUsd).toFixed(4)} de US$ {c.budgetUsd}</p>
      <table className="mt-3 w-full text-left"><thead><tr className="text-ink-muted"><th>Día</th><th>Respuestas</th><th>Tokens in/out</th><th>US$</th><th>Degradadas</th><th>Latencia</th></tr></thead><tbody>{c.days.map((d: any) => <tr key={d.day}><td>{d.day}</td><td>{d.replies}</td><td>{d.tokens_in}/{d.tokens_out}</td><td>{Number(d.cost_usd).toFixed(4)}</td><td>{d.degraded}</td><td>{Math.round(d.avg_latency_ms ?? 0)} ms</td></tr>)}</tbody></table></section>}
    <AdminList path="/admin/assistant/handoffs" pick="handoffs" title="Conversaciones que piden soporte humano" render={(h: any) => <><Small>{h.userId ? `Usuario ${h.userId}` : 'Anónimo'} · {dateTime(h.createdAt)}</Small><div className="mt-1 space-y-1 max-h-60 overflow-y-auto">{h.messages.map((m: any, i: number) => <p key={i}><span className="text-ink-muted">{m.role === 'user' ? 'Usuario' : 'IA'}:</span> {m.content}</p>)}</div></>} empty="Nadie ha pedido soporte humano." />
  </div>);
}
