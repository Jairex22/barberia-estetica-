'use client';
import { AdminList, Small, act, dateTime } from '../AdminTable';
export default function Page() {
  return <AdminList path="/admin/appeals" pick="appeals" title="Apelaciones abiertas" render={(a: any) => <><p className="font-medium">{a.subject}</p><p className="text-ink-soft whitespace-pre-line">{a.body}</p><Small>Usuario {a.userId} · {dateTime(a.createdAt)}</Small></>}
    actions={(a: any, reload) => <><button className="btn-primary py-2" onClick={() => act(`/admin/appeals/${a.id}`, { status: 'accepted', decisionNotes: prompt('Notas (opcional):') ?? undefined }).then(reload)}>Aceptar (reactiva)</button><button className="btn-danger py-2" onClick={() => act(`/admin/appeals/${a.id}`, { status: 'rejected', decisionNotes: prompt('Motivo:') ?? undefined }).then(reload)}>Rechazar</button></>} />;
}
