'use client';
import { AdminList, Small, act, dateTime } from '../AdminTable';
export default function Page() {
  return <AdminList path="/admin/photos/pending" pick="photos" title="Fotos por revisar" render={(p: any) => <div className="flex gap-3"><img src={p.url} alt="" className="h-36 w-28 object-cover rounded-lg" /><div><Small>Usuario {p.userId}</Small><Small>{dateTime(p.createdAt)}</Small>{p.notes && <Small>Auto: {p.notes}</Small>}<p className="text-xs mt-2 text-ink-soft">Rechaza desnudez, menores, fotos sin persona o de otra persona.</p></div></div>}
    actions={(p: any, reload) => <><button className="btn-primary py-2" onClick={() => act(`/admin/photos/${p.id}`, { status: 'approved' }).then(reload)}>Aprobar</button><button className="btn-danger py-2" onClick={() => { const n = prompt('Motivo visible para la persona:') ?? 'No cumple las normas de fotos'; act(`/admin/photos/${p.id}`, { status: 'rejected', notes: n }).then(reload); }}>Rechazar</button></>} />;
}
