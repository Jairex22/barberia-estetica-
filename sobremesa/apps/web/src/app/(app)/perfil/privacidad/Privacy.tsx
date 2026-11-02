'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
export function Privacy() {
  const [blocks, setBlocks] = useState<{ blockedId: string; createdAt: string }[]>([]); const [exp, setExp] = useState<{ url: string; expiresAt: string } | null>(null); const [msg, setMsg] = useState<string | null>(null); const [plan, setPlan] = useState('free'); const [incognito, setIncognito] = useState(false);
  useEffect(() => { api<{ blocks: any[] }>('/safety/blocks').then((r) => setBlocks(r.blocks)); api<any>('/auth/me').then((r) => setPlan(r.user.plan)); api<any>('/profile/me').then((r) => setIncognito(r.profile.incognito)); }, []);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Privacidad y datos</h1>
      <section className="card p-5"><h2 className="font-semibold">Qué compartimos</h2><ul className="mt-2 text-sm text-ink-soft space-y-1"><li>• Ubicación: solo redondeada (~1 km) y mostrada como rango. Nunca coordenadas ni mapa.</li><li>• Fotos: sin metadatos; se sirven con enlaces firmados temporales; no se indexan en buscadores.</li><li>• Género y preferencias: solo lo que declaras. No inferimos orientación, salud ni otros atributos sensibles.</li><li>• Conversaciones del asistente de IA: no se usan para entrenar modelos.</li></ul></section>
      <section className="card p-5">
        <h2 className="font-semibold">Navegación privada</h2>
        <p className="text-sm text-ink-soft mt-1">Solo te ven las personas a las que diste like. {plan !== 'premium' && 'Función Premium.'}</p>
        <label className="mt-3 flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5 accent-wine" disabled={plan !== 'premium'} checked={incognito} onChange={async (e) => { try { await api('/profile/me/incognito', { method: 'POST', json: { enabled: e.target.checked } }); setIncognito(e.target.checked); } catch (er) { setMsg((er as ApiError).message); } }} /> Activar navegación privada</label>
        {plan !== 'premium' && <Link href="/premium" className="text-sm text-wine underline">Ver Premium</Link>}
      </section>
      <section className="card p-5"><h2 className="font-semibold">Personas bloqueadas ({blocks.length})</h2>
        {blocks.length === 0 ? <p className="text-sm text-ink-muted mt-1">No has bloqueado a nadie.</p> : <ul className="mt-2 divide-y divide-cream-2">{blocks.map((b) => <li key={b.blockedId} className="flex items-center justify-between py-2 text-sm"><span>Usuario bloqueado · {new Date(b.createdAt).toLocaleDateString('es-MX')}</span><button className="btn-ghost text-sm" onClick={async () => { await api(`/safety/block/${b.blockedId}`, { method: 'DELETE' }); setBlocks((x) => x.filter((y) => y.blockedId !== b.blockedId)); }}>Desbloquear</button></li>)}</ul>}
      </section>
      <section className="card p-5"><h2 className="font-semibold">Descargar mis datos</h2><p className="text-sm text-ink-soft mt-1">Genera un archivo JSON con tu cuenta, perfil, likes, conexiones, mensajes enviados y suscripciones (enlace válido 1 hora; máximo 3 al día).</p>
        <button className="btn-secondary mt-3" onClick={async () => { try { const r = await api<{ export: any }>('/account/export', { method: 'POST' }); setExp(r.export); } catch (e) { setMsg((e as ApiError).message); } }}>Generar archivo</button>
        {exp && <p className="mt-2 text-sm"><a className="underline text-wine" href={exp.url}>Descargar mis datos</a></p>}
      </section>
      {msg && <p role="alert" className="text-danger text-sm">{msg}</p>}
      <p className="text-sm text-ink-muted">Más detalle en el <Link className="underline" href="/legal/privacidad">Aviso de privacidad</Link>. Para ejercer derechos ARCO escríbenos desde Ayuda.</p>
    </div>
  );
}
