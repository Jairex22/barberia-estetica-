'use client';
import { useId, useState } from 'react';
type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | string[] };
export function Field({ label, hint, error, id, type, ...rest }: Props) {
  const auto = useId(); const fid = id ?? auto; const err = Array.isArray(error) ? error.join(' ') : error;
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <label htmlFor={fid} className="label">{label}</label>
      <div className="relative">
        <input id={fid} type={isPw && show ? 'text' : type} aria-invalid={Boolean(err)} aria-describedby={err ? `${fid}-err` : hint ? `${fid}-hint` : undefined} className={`input ${err ? 'border-danger' : ''} ${isPw ? 'pr-24' : ''}`} {...rest} />
        {isPw && <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-wine px-2 py-1 min-h-[36px]" aria-pressed={show}>{show ? 'Ocultar' : 'Mostrar'}</button>}
      </div>
      {hint && !err && <p id={`${fid}-hint`} className="mt-1 text-sm text-ink-muted">{hint}</p>}
      {err && <p id={`${fid}-err`} role="alert" className="mt-1 text-sm text-danger">{err}</p>}
    </div>
  );
}
export function Check({ label, error, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; error?: string | string[] }) {
  const id = useId(); const err = Array.isArray(error) ? error.join(' ') : error;
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer min-h-[44px]">
        <input id={id} type="checkbox" className="mt-1 h-5 w-5 accent-wine" aria-invalid={Boolean(err)} {...rest} />
        <span className="text-sm text-ink-soft">{label}</span>
      </label>
      {err && <p role="alert" className="text-sm text-danger ml-8">{err}</p>}
    </div>
  );
}
