'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Field } from '@/components/Field';
export default function Page() {
  const [rows, setRows] = useState<any[]>([]); const [f, setF] = useState({ slug: '', locale: 'es', title: '', body: '', tags: '' }); const [msg, setMsg] = useState<string | null>(null);
  const load = () => api<any>('/admin/knowledge').then((r) => setRows(r.articles));
  useEffect(() => { load(); }, []);
  return (<div className="grid gap-6 lg:grid-cols-2">
    <section className="card p-5"><h2 className="font-semibold">Nuevo artículo / nueva versión</h2>
      <form className="mt-3 space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await api('/admin/knowledge', { method: 'POST', json: { ...f, tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean), publish: true } }); setMsg('Publicado como nueva versión.'); setF({ slug: '', locale: 'es', title: '', body: '', tags: '' }); load(); } catch (er) { setMsg((er as ApiError).message); } }}>
        <Field label="Slug (a-z, 0-9, guiones)" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} required /><div><label className="label" htmlFor="loc">Idioma</label><select id="loc" className="input" value={f.locale} onChange={(e) => setF({ ...f, locale: e.target.value })}><option value="es">es</option><option value="en">en</option></select></div>
        <Field label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /><div><label className="label" htmlFor="body">Contenido</label><textarea id="body" className="input min-h-[160px]" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required /></div>
        <Field label="Etiquetas (separadas por coma)" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /><button className="btn-primary">Publicar versión</button>{msg && <p role="status" className="text-sm text-ink-soft">{msg}</p>}</form></section>
    <section><h2 className="font-semibold mb-2">Artículos ({rows.length})</h2><ul className="card divide-y divide-cream-2 text-sm">{rows.map((a) => <li key={a.id} className="p-3 flex justify-between gap-2"><span><strong>{a.title}</strong> · {a.slug} · {a.locale} · v{a.version} · {a.status}</span><div className="flex gap-1">{a.status !== 'archived' && <button className="btn-ghost py-1 text-xs" onClick={() => api(`/admin/knowledge/${a.id}`, { method: 'PATCH', json: { status: 'archived' } }).then(load)}>Archivar</button>}<button className="btn-ghost py-1 text-xs" onClick={() => setF({ slug: a.slug, locale: a.locale, title: a.title, body: a.body, tags: a.tags.join(', ') })}>Editar como nueva versión</button></div></li>)}</ul></section>
  </div>);
}
