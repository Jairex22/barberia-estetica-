'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
export default function Page() {
  const [s, setS] = useState<Record<string, any> | null>(null); const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { api<any>('/admin/settings').then((r) => setS(r.settings)); }, []);
  if (!s) return <p>Cargando…</p>;
  const save = async (k: string, v: unknown) => { try { await api(`/admin/settings/${k}`, { method: 'PUT', json: { value: v } }); setS({ ...s, [k]: v }); setMsg(`Guardado ${k}`); } catch (e) { setMsg((e as ApiError).message); } };
  return (<div className="space-y-4 max-w-xl">
    <section className="card p-5 space-y-3 text-sm">
      <label className="flex items-center justify-between min-h-[44px]"><span>Registro abierto</span><input type="checkbox" className="h-5 w-5 accent-wine" checked={!!s.registration_open} onChange={(e) => save('registration_open', e.target.checked)} /></label>
      <label className="flex items-center justify-between min-h-[44px]"><span>Descubrir habilitado</span><input type="checkbox" className="h-5 w-5 accent-wine" checked={!!s.discovery_enabled} onChange={(e) => save('discovery_enabled', e.target.checked)} /></label>
      <label className="flex items-center justify-between gap-3 min-h-[44px]"><span>Precio Premium MXN (centavos, IVA incl.)</span><input type="number" className="input w-36" defaultValue={s.premium_price_mxn_minor} onBlur={(e) => save('premium_price_mxn_minor', Number(e.target.value))} /></label>
      <label className="flex items-center justify-between gap-3 min-h-[44px]"><span>Precio Premium USD (centavos)</span><input type="number" className="input w-36" defaultValue={s.premium_price_usd_minor} onBlur={(e) => save('premium_price_usd_minor', Number(e.target.value))} /></label>
      <label className="flex items-center justify-between gap-3 min-h-[44px]"><span>Ciudades de lanzamiento (coma)</span><input className="input w-56" defaultValue={(s.launch_cities ?? []).join(', ')} onBlur={(e) => save('launch_cities', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></label>
      <p className="text-xs text-ink-muted">El precio mostrado debe coincidir con el configurado en Stripe y en las tiendas; cambiarlo aquí no cambia el cobro del proveedor.</p>
    </section>
    <section className="card p-5 text-sm"><h2 className="font-semibold">Tareas programadas</h2><div className="flex flex-wrap gap-2 mt-2">{['expire_sessions_and_tokens', 'reconcile_billing', 'purge_deleted_accounts', 'unread_digest', 'cleanup_exports'].map((j) => <button key={j} className="btn-secondary py-2 text-xs" onClick={async () => setMsg(JSON.stringify(await api(`/admin/jobs/${j}/run`, { method: 'POST' })))}>{j}</button>)}</div></section>
    {msg && <p role="status" className="text-sm text-ink-soft break-all">{msg}</p>}
  </div>);
}
