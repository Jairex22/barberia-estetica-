'use client';
import { useState } from 'react';
import { AdminList, Small, act, dateTime } from '../AdminTable';
import { api } from '@/lib/api';
import { label } from '@/lib/format';
export default function Page() {
  const [ctx, setCtx] = useState<any>(null);
  return (<div className="space-y-6">
    <AdminList path="/admin/reports?status=open" pick="reports" title="Reportes abiertos" render={(r: any) => <><p><strong>{label(r.reason)}</strong> · {r.details ?? 'sin detalles'}</p><Small>Reportado: {r.targetId} · {dateTime(r.createdAt)}{r.conversationId ? ' · con conversación' : ''}</Small></>}
      actions={(r: any, reload) => <>
        <button className="btn-secondary py-2" onClick={async () => setCtx(await api(`/admin/reports/${r.id}/context`))}>Ver contexto</button>
        <button className="btn-secondary py-2" onClick={() => act(`/admin/reports/${r.id}`, { status: 'dismissed', resolution: 'Sin infracción' }).then(reload)}>Descartar</button>
        <button className="btn-secondary py-2" onClick={() => { const res = prompt('Resolución (se guarda en auditoría):') ?? ''; act(`/admin/reports/${r.id}`, { status: 'resolved', resolution: res, action: 'warn' }).then(reload); }}>Resolver (advertir)</button>
        <button className="btn-danger py-2" onClick={() => { const res = prompt('Motivo de suspensión:'); if (res) act(`/admin/reports/${r.id}`, { status: 'resolved', resolution: res, action: 'suspend' }).then(reload); }}>Suspender</button>
      </>} />
    {ctx && <section className="card p-5" aria-live="polite"><div className="flex justify-between"><h2 className="font-semibold">Contexto del reporte</h2><button className="btn-ghost py-1" onClick={() => setCtx(null)}>Cerrar</button></div>
      <p className="text-sm mt-2">Perfil reportado: <strong>{ctx.target?.displayName}</strong> · estado {ctx.target?.status} · reportes previos: {ctx.priorReports}</p><p className="text-sm text-ink-soft">{ctx.target?.bio}</p>
      <div className="flex gap-2 mt-3 flex-wrap">{ctx.photos.map((p: any) => <img key={p.id} src={p.url} alt="" className="h-28 w-20 object-cover rounded-lg" />)}</div>
      {ctx.messages.length > 0 && <div className="mt-3 max-h-72 overflow-y-auto rounded-xl bg-cream p-3 text-sm space-y-1">{ctx.messages.map((m: any, i: number) => <p key={i}><span className={m.senderId === ctx.report.targetId ? 'text-danger font-medium' : 'text-ink-muted'}>{m.senderId === ctx.report.targetId ? 'Reportado' : 'Denunciante'}:</span> {m.body}</p>)}</div>}
      <Small>Solo se muestra la información necesaria para el caso; el acceso queda registrado en auditoría.</Small></section>}
  </div>);
}
