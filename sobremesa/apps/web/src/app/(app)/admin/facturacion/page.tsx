'use client';
import { useState } from 'react';
import { AdminList, Small, dateTime } from '../AdminTable';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
export default function Page() {
  const [rec, setRec] = useState<string | null>(null);
  return (<div className="space-y-6">
    <div className="flex gap-2 items-center"><button className="btn-secondary py-2" onClick={async () => setRec(JSON.stringify(await api('/admin/billing/reconcile', { method: 'POST' })))}>Conciliar ahora con proveedores</button>{rec && <Small>Resultado: {rec}</Small>}</div>
    <AdminList path="/admin/subscriptions" pick="subscriptions" title="Suscripciones" render={(s: any) => <><p>{s.channel} · <strong>{s.status}</strong>{s.cancelAtPeriodEnd ? ' · no renueva' : ''} · hasta {s.currentPeriodEnd ? dateTime(s.currentPeriodEnd) : '—'}</p><Small>Usuario {s.userId} · {s.providerSubscriptionId}</Small></>} empty="Sin suscripciones." />
    <AdminList path="/admin/payments" pick="payments" title="Pagos registrados (conciliados)" render={(p: any) => <><p>{p.kind} · {money(p.amountMinor, p.currency)} · {p.channel}</p><Small>{dateTime(p.occurredAt)} · {p.providerPaymentId}</Small></>} empty="Sin pagos." />
    <AdminList path="/admin/billing-events" pick="events" title="Webhooks recibidos" render={(e: any) => <><p>{e.channel} · {e.type} · <strong>{e.status}</strong></p><Small>{dateTime(e.receivedAt)} · {e.providerEventId}{e.error ? ` · ${e.error}` : ''}</Small></>} empty="Sin eventos." />
  </div>);
}
