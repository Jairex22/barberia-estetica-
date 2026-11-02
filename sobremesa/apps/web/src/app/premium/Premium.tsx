'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PriceDisplay } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { money, label } from '@/lib/format';

export function Premium({ loggedIn, verified, plan }: { loggedIn: boolean; verified: boolean; plan: string }) {
  const [prices, setPrices] = useState<PriceDisplay[]>([]); const [benefits, setBenefits] = useState<{ key: string; es: string }[]>([]); const [sel, setSel] = useState<PriceDisplay | null>(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { api<any>('/billing/prices').then((r) => { setPrices(r.prices); setBenefits(r.premiumBenefits); const first = r.prices.find((p: PriceDisplay) => p.available); setSel(first ?? r.prices[0] ?? null); }).catch(() => setMsg('No pudimos cargar los precios.')); }, []);
  async function pay() {
    if (!sel) return; setBusy(true); setMsg(null);
    try { const r = await api<{ url: string }>('/billing/checkout', { method: 'POST', json: { channel: sel.channel, currency: sel.currency } }); window.location.href = r.url; }
    catch (e) { const a = e as ApiError; setMsg(a.message); setBusy(false); }
  }
  return (
    <div className="max-w-3xl mx-auto pt-6">
      <h1 className="text-4xl font-semibold text-wine-deep">Premium</h1>
      <p className="mt-3 text-ink-soft">Conocer personas y chatear tras una conexión es gratis y lo seguirá siendo. Premium añade ventajas reales. Sin trucos: no cambia quién inicia, no garantiza respuestas ni citas y no hay mensajes "ocultos".</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">{benefits.map((b) => <li key={b.key} className={`card p-4 ${b.key === 'never' ? 'sm:col-span-2 bg-cream-2 text-ink-soft text-sm' : ''}`}>{b.es}</li>)}</ul>
      <section className="card p-6 mt-8">
        <h2 className="text-2xl font-semibold">Precio</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {prices.map((p, i) => (
            <button key={i} disabled={!p.available} aria-pressed={sel === p} onClick={() => setSel(p)} className={`text-left rounded-xl border p-4 ${sel === p ? 'border-wine bg-ember-soft/40' : 'border-cream-2'} disabled:opacity-60`}>
              <p className="text-2xl font-semibold">{money(p.amountMinor, p.currency)} <span className="text-sm font-normal text-ink-muted">/ mes</span></p>
              <p className="text-sm text-ink-soft">{label(p.channel)} · {p.currency}{p.taxIncluded ? ' · IVA incluido' : ' · sin impuestos locales'}</p>
              {!p.available && <p className="text-xs text-ember mt-1">No disponible: {p.unavailableReason}</p>}
            </button>
          ))}
          {prices.length === 0 && <p className="text-ink-muted">Cargando precios…</p>}
        </div>
        {sel && (
          <div className="mt-5 rounded-xl bg-cream p-4 text-sm text-ink-soft space-y-1">
            <p><strong>Antes de confirmar:</strong> pagarás <strong>{money(sel.amountMinor, sel.currency)}</strong> hoy y cada mes, con renovación automática, por {label(sel.channel)}.</p>
            <p>{sel.cancelInstructions}</p>
            <p>El pago se hace en una página segura del proveedor; nunca guardamos tu número de tarjeta. Premium se activa cuando el proveedor confirma el cobro (normalmente segundos). Recibirás un comprobante de pago (no es factura CFDI).</p>
          </div>
        )}
        {msg && <p role="alert" className="mt-3 text-danger">{msg}</p>}
        <div className="mt-5">
          {!loggedIn ? <Link href="/entrar?next=/premium" className="btn-primary">Entra para continuar</Link> : !verified ? <Link href="/verificar-correo" className="btn-primary">Verifica tu correo para continuar</Link> : plan === 'premium' ? <Link href="/perfil/suscripcion" className="btn-secondary">Ya tienes Premium · gestionar</Link> : <button className="btn-primary" disabled={!sel?.available || busy} onClick={pay}>{busy ? 'Abriendo pago seguro…' : `Continuar al pago (${sel ? money(sel.amountMinor, sel.currency) : ''})`}</button>}
        </div>
        <p className="mt-3 text-xs text-ink-muted">En iOS y Android, Premium se compra con App Store o Google Play a su precio local; el acceso se sincroniza con tu cuenta en todos los dispositivos.</p>
      </section>
    </div>
  );
}
