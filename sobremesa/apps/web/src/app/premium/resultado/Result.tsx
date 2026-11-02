'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StateView } from '@/components/StateView';
/** La redirección de éxito NO activa nada: consultamos el estado real (que solo cambia con el webhook verificado). */
export function Result() {
  const [plan, setPlan] = useState<'free' | 'premium' | null>(null); const [tries, setTries] = useState(0);
  useEffect(() => {
    let alive = true;
    const tick = async () => { try { const r = await api<any>('/billing/entitlement'); if (!alive) return; setPlan(r.entitlement.plan); if (r.entitlement.plan !== 'premium' && tries < 10) setTimeout(() => setTries((t) => t + 1), 2000); } catch { if (alive) setPlan('free'); } };
    tick(); return () => { alive = false; };
  }, [tries]);
  if (plan === 'premium') return <div className="mt-8"><StateView state="empty" title="Premium activo" body="El proveedor confirmó tu pago. Ya puedes usar todas las ventajas." action={<Link href="/descubrir" className="btn-primary">Ir a Descubrir</Link>} /></div>;
  if (plan === null || tries < 10) return <div className="mt-8"><StateView state="payment_pending" action={<Link href="/perfil/suscripcion" className="btn-secondary">Ver mi suscripción</Link>} /></div>;
  return <div className="mt-8"><StateView state="payment_pending" title="Todavía sin confirmación" body="Si el proveedor no confirma el cobro, no se te cobrará y no se activará Premium. Puedes revisar el estado en tu suscripción o escribirnos desde Ayuda." action={<Link href="/perfil/suscripcion" className="btn-secondary">Ver mi suscripción</Link>} /></div>;
}
