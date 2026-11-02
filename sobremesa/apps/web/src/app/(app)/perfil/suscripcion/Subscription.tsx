'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Entitlement } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { StateView } from '@/components/StateView';
import { label, dateLong } from '@/lib/format';
export function Subscription() {
  const [ent, setEnt] = useState<Entitlement | null>(null); const [err, setErr] = useState<string | null>(null); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = () => api<{ entitlement: Entitlement }>('/billing/entitlement').then((r) => setEnt(r.entitlement)).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, []);
  if (err) return <StateView state="error" body={err} />;
  if (!ent) return <StateView state="loading" />;
  const store = ent.channel === 'apple' || ent.channel === 'google';
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Suscripción</h1>
      <div className="card p-6 mt-4">
        <p className="text-lg font-medium">{ent.plan === 'premium' ? 'Premium activo' : 'Plan gratis'}</p>
        {ent.status && <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-muted">Estado</dt><dd>{label(ent.status)}{ent.status === 'past_due' && ' · no pudimos cobrar la renovación; actualiza tu método de pago'}</dd>
          <dt className="text-ink-muted">Canal</dt><dd>{label(ent.channel)}</dd>
          <dt className="text-ink-muted">{ent.cancelAtPeriodEnd ? 'Premium hasta' : 'Se renueva el'}</dt><dd>{dateLong(ent.premiumUntil)}</dd>
          <dt className="text-ink-muted">Renovación</dt><dd>{ent.cancelAtPeriodEnd ? 'Cancelada: no habrá más cargos' : 'Automática cada mes'}</dd>
        </dl>}
        {ent.plan !== 'premium' && <Link href="/premium" className="btn-primary mt-5">Ver Premium y precios</Link>}
        {ent.plan === 'premium' && !ent.cancelAtPeriodEnd && (
          <div className="mt-5 flex flex-col gap-2">
            {store ? <p className="text-sm text-ink-soft">Compraste Premium en {label(ent.channel)}. Para cancelar o cambiar el método de pago, hazlo en la tienda; nosotros no podemos cancelarla por ti.</p> : null}
            {ent.manageUrl && <a href={ent.manageUrl} target="_blank" rel="noreferrer" className="btn-secondary">{store ? `Gestionar en ${label(ent.channel)}` : 'Gestionar método de pago y recibos'}</a>}
            {!store && <button className="btn-danger" disabled={busy} onClick={async () => { if (!confirm('¿Cancelar la renovación? Conservas Premium hasta el fin del periodo pagado.')) return; setBusy(true); try { const r = await api<{ premiumUntil: string }>('/billing/cancel', { method: 'POST' }); setMsg(`Listo. No habrá más cargos; Premium sigue hasta ${dateLong(r.premiumUntil)}.`); load(); } catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); } }}>Cancelar renovación</button>}
          </div>
        )}
        {msg && <p role="status" className="mt-3 text-sm text-ink-soft">{msg}</p>}
      </div>
      <div className="card p-6 mt-4 text-sm text-ink-soft space-y-2">
        <p><strong>Cancelar</strong> detiene renovaciones futuras y conservas Premium hasta la fecha pagada. <strong>Reembolso</strong> devuelve un cobro ya hecho y retira Premium de inmediato; se evalúa caso por caso desde Ayuda (compras de tienda: según políticas de App Store / Google Play).</p>
        <p>Los recibos de la web son comprobantes de pago, no facturas CFDI (integración fiscal pendiente).</p>
        <button className="btn-ghost text-sm px-0" onClick={async () => { const r = await api<any>('/billing/restore', { method: 'POST' }); setMsg(r.available ? `Compras restauradas: ${r.restored}` : `Restaurar compras: ${r.reason}`); }}>Restaurar compras de App Store / Google Play</button>
      </div>
    </div>
  );
}
