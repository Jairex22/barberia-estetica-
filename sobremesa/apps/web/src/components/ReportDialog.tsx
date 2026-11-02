'use client';
import { useEffect, useRef, useState } from 'react';
import { REPORT_REASONS } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { label } from '@/lib/format';

export function ReportDialog({ target, conversationId, onClose }: { target: { id: string; displayName: string }; conversationId?: string; onClose: (done: boolean) => void }) {
  const [reason, setReason] = useState<string>(''); const [details, setDetails] = useState(''); const [alsoBlock, setAlsoBlock] = useState(true); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null); const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLElement>('button, input')?.focus(); const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="rep-t" className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/60 p-0 sm:p-4" onClick={() => onClose(done)}>
      <div ref={ref} className="card w-full max-w-md p-6 rounded-b-none sm:rounded-b-[var(--radius-card)] max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {done ? (<><h2 id="rep-t" className="text-xl font-semibold">Gracias por avisarnos</h2><p className="mt-2 text-ink-soft">Revisaremos el caso. La otra persona no sabrá quién lo reportó.{alsoBlock ? ' También quedó bloqueada.' : ''}</p><button className="btn-primary mt-6 w-full" onClick={() => onClose(true)}>Cerrar</button></>) : (<>
          <h2 id="rep-t" className="text-xl font-semibold">Denunciar o bloquear a {target.displayName}</h2>
          <fieldset className="mt-4"><legend className="label">Motivo</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">{REPORT_REASONS.map((r) => <button type="button" key={r} role="radio" aria-checked={reason === r} className={reason === r ? 'chip-on' : 'chip'} onClick={() => setReason(r)}>{label(r === 'otro' ? 'otro_motivo' : r)}</button>)}</div>
          </fieldset>
          <label className="label mt-4" htmlFor="rep-d">Detalles (opcional)</label>
          <textarea id="rep-d" className="input min-h-[90px]" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
          <label className="mt-3 flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5 accent-wine" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} /><span className="text-sm">Bloquear también (termina la conexión y deja de verse)</span></label>
          {msg && <p role="alert" className="mt-2 text-danger text-sm">{msg}</p>}
          <div className="mt-5 flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => onClose(false)}>Cancelar</button>
            <button className="btn-danger flex-1" disabled={!reason || busy} onClick={async () => { setBusy(true); try { if (reason) await api('/safety/report', { method: 'POST', json: { targetUserId: target.id, reason, details: details || undefined, conversationId, alsoBlock } }); setDone(true); } catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); } }}>Enviar</button>
          </div>
          <button className="btn-ghost w-full mt-2 text-sm" onClick={async () => { setBusy(true); try { await api('/safety/block', { method: 'POST', json: { targetUserId: target.id } }); setAlsoBlock(true); setDone(true); } catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); } }}>Solo bloquear, sin denunciar</button>
        </>)}
      </div>
    </div>
  );
}
