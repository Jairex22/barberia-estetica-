'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { dateTime, label } from '@/lib/format';
import { act } from '../AdminTable';
export default function Page() {
  const [q, setQ] = useState(''); const [rows, setRows] = useState<any[]>([]); const [detail, setDetail] = useState<any>(null); const [err, setErr] = useState<string | null>(null);
  const search = async () => { try { setRows((await api<any>(`/admin/users?q=${encodeURIComponent(q)}`)).users); } catch (e) { setErr((e as ApiError).message); } };
  return (<div className="space-y-4">
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}><label className="sr-only" htmlFor="q">Buscar</label><input id="q" className="input" placeholder="Correo o id" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn-primary">Buscar</button></form>
    {err && <p role="alert" className="text-danger text-sm">{err}</p>}
    <ul className="card divide-y divide-cream-2">{rows.map((u) => <li key={u.id} className="p-3 flex justify-between items-center text-sm"><span>{u.email} · {u.status} · {u.role}{u.isDemo ? ' · DEMO' : ''}</span><button className="btn-secondary py-1" onClick={async () => setDetail(await api(`/admin/users/${u.id}`))}>Ver</button></li>)}</ul>
    {detail && <section className="card p-5 text-sm space-y-2"><div className="flex justify-between"><h2 className="font-semibold">{detail.user.email}</h2><button className="btn-ghost py-1" onClick={() => setDetail(null)}>Cerrar</button></div>
      <p>Estado: {detail.user.status}{detail.user.suspendedReason ? ` (${detail.user.suspendedReason})` : ''} · Rol: {detail.user.role} · Alta: {dateTime(detail.user.createdAt)} · Verificado: {detail.user.emailVerifiedAt ? 'sí' : 'no'}</p>
      <p>Perfil: {detail.profile?.displayName} · {label(detail.profile?.gender)} · completo: {detail.profile?.completedAt ? 'sí' : 'no'}</p>
      <p>Suscripciones: {detail.subscriptions.map((s: any) => `${s.channel}/${s.status}`).join(', ') || 'ninguna'}</p>
      <p>Pagos: {detail.payments.map((p: any) => `${p.kind} ${p.amountMinor / 100} ${p.currency}`).join(', ') || 'ninguno'}</p>
      <p>Reportes en su contra: {detail.reportsAgainst.length}</p>
      <div className="flex gap-2 flex-wrap pt-2">
        {detail.user.status === 'suspended' ? <button className="btn-secondary py-2" onClick={() => act(`/admin/users/${detail.user.id}/reinstate`, undefined, 'POST').then(() => setDetail(null))}>Reactivar</button> : <button className="btn-danger py-2" onClick={() => { const r = prompt('Motivo de suspensión:'); if (r) act(`/admin/users/${detail.user.id}/suspend`, { reason: r }, 'POST').then(() => setDetail(null)); }}>Suspender</button>}
        <button className="btn-secondary py-2" onClick={() => { const r = prompt('Nuevo rol (user|moderator|admin):'); if (r) act(`/admin/users/${detail.user.id}/role`, { role: r }, 'POST').then(() => setDetail(null)); }}>Cambiar rol</button>
      </div></section>}
  </div>);
}
