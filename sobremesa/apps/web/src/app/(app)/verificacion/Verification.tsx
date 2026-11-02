'use client';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { StateView } from '@/components/StateView';
const POSES: Record<string, string> = { mano_en_la_barbilla: 'una mano en la barbilla', pulgar_arriba: 'pulgar arriba', dos_dedos: 'dos dedos en V', mano_en_el_hombro: 'una mano sobre el hombro contrario', saludo_con_la_mano: 'saludando con la mano' };
export function Verification() {
  const [data, setData] = useState<any>(null); const [msg, setMsg] = useState<string | null>(null); const file = useRef<HTMLInputElement>(null);
  const load = () => api<any>('/safety/verification').then(setData);
  useEffect(() => { load(); }, []);
  if (!data) return <StateView state="loading" />;
  const pending = data.requests.find((r: any) => r.status === 'pending'); const approved = data.requests.find((r: any) => r.status === 'approved');
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Verificar mi perfil</h1>
      <p className="text-ink-soft mt-2">{data.note}</p>
      {approved ? <p className="card p-5 mt-4 text-sage">Tu perfil está verificado ✓</p> : pending ? <p className="card p-5 mt-4" role="status">Tu selfie está en revisión. Normalmente tarda menos de 24 horas.</p> : (
        <div className="card p-5 mt-4">
          <p>Tómate una selfie ahora mismo haciendo esta pose: <strong>{POSES[data.pose] ?? data.pose}</strong>.</p>
          <p className="text-sm text-ink-muted mt-1">La selfie solo se usa para la revisión y no aparece en tu perfil. No pedimos documentos.</p>
          <input ref={file} type="file" accept="image/*" capture="user" className="mt-4 block" aria-label="Selfie" />
          <button className="btn-primary mt-4" onClick={async () => { const f = file.current?.files?.[0]; if (!f) return setMsg('Elige o toma una selfie'); const fd = new FormData(); fd.append('pose', data.pose); fd.append('file', f); try { await api('/safety/verification/selfie', { method: 'POST', body: fd }); setMsg(null); load(); } catch (e) { setMsg((e as ApiError).message); } }}>Enviar selfie</button>
          {msg && <p role="alert" className="mt-2 text-danger text-sm">{msg}</p>}
        </div>
      )}
      {data.requests.filter((r: any) => r.status === 'rejected').map((r: any) => <p key={r.id} className="mt-3 text-sm text-danger">Una solicitud fue rechazada{r.notes ? `: ${r.notes}` : ''}. Puedes volver a intentarlo.</p>)}
    </div>
  );
}
