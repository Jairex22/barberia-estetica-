'use client';
import { AdminList, Small, dateTime } from '../AdminTable';
export default function Page() {
  return <AdminList path="/admin/audit" pick="entries" title="Auditoría (últimas 200 acciones)" render={(e: any) => <><p><strong>{e.action}</strong>{e.targetType ? ` · ${e.targetType} ${e.targetId ?? ''}` : ''}</p><Small>{dateTime(e.createdAt)} · actor {e.actorId ?? 'sistema'} ({e.actorRole ?? '—'}){e.metadata ? ` · ${JSON.stringify(e.metadata).slice(0, 160)}` : ''}</Small></>} empty="Sin entradas." />;
}
