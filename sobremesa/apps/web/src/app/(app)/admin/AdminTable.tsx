'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { StateView } from '@/components/StateView';
import { dateTime } from '@/lib/format';

/** Lista genérica con acciones; cada acción llama al API y recarga. */
export function AdminList<T extends { id: string }>({ path, pick, title, render, actions, empty = 'Nada pendiente.' }: {
  path: string; pick: string; title: string; render: (row: T) => React.ReactNode; empty?: string;
  actions?: (row: T, reload: () => void) => React.ReactNode;
}) {
  const [rows, setRows] = useState<T[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = () => api<any>(path).then((r) => setRows(r[pick])).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [path]);
  if (err) return <StateView state="error" body={err} />;
  if (!rows) return <StateView state="loading" />;
  return (<section><h2 className="font-semibold mb-2">{title} ({rows.length})</h2>{rows.length === 0 ? <p className="text-ink-muted text-sm">{empty}</p> : <ul className="card divide-y divide-cream-2">{rows.map((r) => <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3"><div className="flex-1 min-w-0 text-sm">{render(r)}</div>{actions && <div className="flex flex-wrap gap-2">{actions(r, load)}</div>}</li>)}</ul>}</section>);
}
export const Small = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-ink-muted">{children}</p>;
export { dateTime };
export async function act(path: string, json?: unknown, method = 'PATCH') { try { await api(path, { method, json }); } catch (e) { alert((e as ApiError).message); } }
