'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StateView } from '@/components/StateView';
export function Notifications() {
  const [p, setP] = useState<any>(null); const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { api<{ prefs: any }>('/notifications/prefs').then((r) => setP(r.prefs)); }, []);
  if (!p) return <StateView state="loading" />;
  const save = async (patch: any) => { const r = await api<{ prefs: any }>('/notifications/prefs', { method: 'PATCH', json: patch }); setP(r.prefs); setMsg('Guardado'); };
  const Row = ({ k, t, d }: { k: string; t: string; d: string }) => <label className="flex items-start gap-3 py-3 min-h-[44px]"><input type="checkbox" className="mt-1 h-5 w-5 accent-wine" checked={p[k]} onChange={(e) => save({ [k]: e.target.checked })} /><span><span className="font-medium block">{t}</span><span className="text-sm text-ink-muted">{d}</span></span></label>;
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Notificaciones</h1>
      <p className="text-sm text-ink-muted mt-1">Todos nuestros correos y avisos están identificados como mensajes del sistema; nunca te escribiremos fingiendo ser otra persona. Los avisos de seguridad y pagos siempre se envían.</p>
      <div className="card px-5 mt-4 divide-y divide-cream-2">
        <Row k="pushMatches" t="Nuevas conexiones" d="Aviso cuando haya like mutuo" />
        <Row k="pushMessages" t="Mensajes nuevos" d="Aviso de mensajes reales sin leer" />
        <Row k="emailProduct" t="Correos de actividad" d="Resumen de no leídos (máximo 1 al día, solo si hay mensajes reales)" />
        <Row k="emailMarketing" t="Novedades y eventos" d={`Promocional, máximo ${p.maxPromoPerWeek} por semana, baja en un clic`} />
      </div>
      <div className="card p-5 mt-4"><p className="font-medium">Horas tranquilas</p><p className="text-sm text-ink-muted">No enviamos correos de actividad ni promocionales en este rango (hora de México).</p>
        <div className="mt-3 flex gap-3 items-center"><label className="text-sm">De <input type="number" min={0} max={23} className="input w-20 inline-block ml-1" value={p.quietStartHour} onChange={(e) => setP({ ...p, quietStartHour: Number(e.target.value) })} onBlur={() => save({ quietStartHour: p.quietStartHour })} /></label><label className="text-sm">a <input type="number" min={0} max={23} className="input w-20 inline-block ml-1" value={p.quietEndHour} onChange={(e) => setP({ ...p, quietEndHour: Number(e.target.value) })} onBlur={() => save({ quietEndHour: p.quietEndHour })} /></label></div>
      </div>
      {msg && <p role="status" className="mt-3 text-sm text-sage">{msg}</p>}
    </div>
  );
}
