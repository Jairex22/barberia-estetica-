'use client';
import { AdminList, Small, act } from '../AdminTable';
export default function Page() {
  return <AdminList path="/admin/verifications/pending" pick="verifications" title="Verificaciones por selfie" render={(v: any) => <div><p className="text-sm">Pose pedida: <strong>{v.pose}</strong></p><div className="flex gap-2 mt-2 flex-wrap items-end">{v.selfieUrl && <figure><img src={v.selfieUrl} alt="Selfie" className="h-40 w-32 object-cover rounded-lg ring-2 ring-ember" /><figcaption className="text-xs">Selfie</figcaption></figure>}{v.profilePhotos.map((u: string, i: number) => <img key={i} src={u} alt={`Foto de perfil ${i + 1}`} className="h-40 w-32 object-cover rounded-lg" />)}</div><Small>Aprueba solo si la pose coincide y es la misma persona de las fotos.</Small></div>}
    actions={(v: any, reload) => <><button className="btn-primary py-2" onClick={() => act(`/admin/verifications/${v.id}`, { status: 'approved' }).then(reload)}>Aprobar</button><button className="btn-danger py-2" onClick={() => { const n = prompt('Motivo:') ?? 'La selfie no coincide'; act(`/admin/verifications/${v.id}`, { status: 'rejected', notes: n }).then(reload); }}>Rechazar</button></>} />;
}
