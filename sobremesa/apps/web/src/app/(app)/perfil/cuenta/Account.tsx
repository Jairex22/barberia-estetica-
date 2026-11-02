'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Field } from '@/components/Field';
export function Account() {
  const r = useRouter(); const [me, setMe] = useState<any>(null); const [sessions, setSessions] = useState<any[]>([]); const [pw, setPw] = useState({ current: '', next: '' }); const [msg, setMsg] = useState<string | null>(null); const [del, setDel] = useState<any>(null);
  const load = () => { api<any>('/auth/me').then((x) => setMe(x.user)); api<any>('/account/sessions').then((x) => setSessions(x.sessions)); };
  useEffect(load, []);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Cuenta</h1>
      <section className="card p-5"><h2 className="font-semibold">Cambiar contraseña</h2>
        <form className="mt-3 space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await api('/account/change-password', { method: 'POST', json: pw }); setMsg('Contraseña actualizada; cerramos tus otras sesiones.'); setPw({ current: '', next: '' }); load(); } catch (er) { setMsg((er as ApiError).message); } }}>
          <Field label="Contraseña actual" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required />
          <Field label="Nueva contraseña" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" hint="Mínimo 10 caracteres" required />
          <button className="btn-secondary">Actualizar</button>
        </form></section>
      <section className="card p-5"><h2 className="font-semibold">Sesiones activas ({sessions.length})</h2>
        <ul className="mt-2 text-sm divide-y divide-cream-2">{sessions.map((s) => <li key={s.id} className="py-2 flex justify-between"><span>{s.device ?? 'Dispositivo'}{s.current && ' · esta sesión'}</span><span className="text-ink-muted">{new Date(s.lastSeenAt).toLocaleString('es-MX')}</span></li>)}</ul>
        <button className="btn-ghost text-sm px-0 mt-2" onClick={async () => { await api('/auth/logout-all', { method: 'POST' }); load(); setMsg('Cerramos las demás sesiones.'); }}>Cerrar las demás sesiones</button></section>
      <section className="card p-5"><h2 className="font-semibold">{me?.status === 'paused' ? 'Cuenta en pausa' : 'Pausar cuenta'}</h2><p className="text-sm text-ink-soft mt-1">Ideal si encontraste pareja o necesitas un descanso: dejas de aparecer en Descubrir y no recibes likes nuevos, pero conservas conexiones y mensajes.</p>
        <button className="btn-secondary mt-3" onClick={async () => { await api(me?.status === 'paused' ? '/account/resume' : '/account/pause', { method: 'POST' }); load(); r.refresh(); }}>{me?.status === 'paused' ? 'Reactivar cuenta' : 'Pausar cuenta'}</button></section>
      <section className="card p-5 border border-danger-soft"><h2 className="font-semibold text-danger">Eliminar cuenta</h2><p className="text-sm text-ink-soft mt-1">Definitivo. Te enviamos un correo para confirmar. Los datos se borran en 30 días.</p>
        {del ? <div className="mt-3 text-sm space-y-2" role="status"><p>Revisa tu correo para confirmar.</p>{del.storeSubscriptions?.length > 0 && <p className="text-danger">Tienes una suscripción comprada en {del.storeSubscriptions.join(' y ')}: eliminar la cuenta NO la cancela. Cancélala en la tienda para evitar cargos.</p>}{del.webSubscriptions?.length > 0 && <p>Tu suscripción web dejará de renovarse al confirmar.</p>}</div>
        : <button className="btn-danger mt-3" onClick={async () => { try { setDel(await api('/account/delete/request', { method: 'POST' })); } catch (e) { setMsg((e as ApiError).message); } }}>Solicitar eliminación</button>}</section>
      {msg && <p role="status" className="text-sm text-ink-soft">{msg}</p>}
    </div>
  );
}
