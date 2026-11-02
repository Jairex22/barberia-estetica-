import { serverApi, currentUser } from '@/lib/server-api';
import { money } from '@/lib/format';
export default async function Page() {
  const { user } = await currentUser();
  if (user?.role !== 'admin') return <p className="card p-5">Como moderador tienes acceso a Reportes, Fotos, Verificaciones y Apelaciones.</p>;
  const m = (await serverApi<any>('/admin/metrics')).data;
  if (!m) return <p className="card p-5">No se pudieron cargar las métricas.</p>;
  const Tile = ({ t, v, d }: { t: string; v: string | number; d?: string }) => <div className="card p-4"><p className="text-xs uppercase tracking-wide text-ink-muted">{t}</p><p className="text-2xl font-semibold mt-1">{v}</p>{d && <p className="text-xs text-ink-muted">{d}</p>}</div>;
  return (
    <div className="space-y-6">
      <section><h2 className="font-semibold mb-2">Usuarios</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Tile t="Registrados" v={m.users.total} d={`${m.users.demo} demo`} /><Tile t="Correo verificado" v={m.users.verified} /><Tile t="Perfil completo" v={m.profiles.complete} /><Tile t="Activos 7 / 30 días" v={`${m.users.wau} / ${m.users.mau}`} d="por último acceso" /></div></section>
      <section><h2 className="font-semibold mb-2">Conexiones y chat</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Tile t="Matches activos" v={m.matches.active} d={`${m.matches.last7} en 7 días`} /><Tile t="Conversaciones iniciadas" v={`${m.chat.started} / ${m.chat.conversations}`} /><Tile t="Recíprocas" v={m.chat.reciprocal} d="ambas personas escribieron" /><Tile t="Verificados" v={m.profiles.verified} /></div></section>
      <section><h2 className="font-semibold mb-2">Ingresos conciliados (últimos 30 días, cobros reales registrados por webhooks)</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{m.revenueLast30d.length === 0 && <p className="text-ink-muted text-sm">Sin cobros registrados.</p>}{m.revenueLast30d.map((r: any) => <Tile key={r.currency} t={`${r.currency} cobrado`} v={money(Number(r.charged_minor ?? 0), r.currency)} d={`${r.charges} cobros · reembolsos ${money(Number(r.refunded_minor ?? 0), r.currency)} · contracargos ${money(Number(r.chargeback_minor ?? 0), r.currency)}`} />)}</div>
        <ul className="mt-3 text-sm text-ink-soft flex flex-wrap gap-x-4">{m.subscriptions.map((s: any) => <li key={s.channel + s.status}>{s.channel}/{s.status}: <strong>{s.n}</strong></li>)}</ul></section>
      <section><h2 className="font-semibold mb-2">Colas de trabajo</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3"><Tile t="Reportes abiertos" v={m.queues.open_reports} /><Tile t="Fotos por revisar" v={m.queues.pending_photos} /><Tile t="Verificaciones" v={m.queues.pending_verifications} /><Tile t="Apelaciones" v={m.queues.open_appeals} /><Tile t="Soporte humano (IA)" v={m.queues.handoffs} /><Tile t="Errores de webhooks" v={m.queues.billing_errors} /></div></section>
      <section><h2 className="font-semibold mb-2">Asistente de IA</h2><div className="grid grid-cols-2 gap-3"><Tile t="Gasto del mes" v={`US$ ${Number(m.ai.monthToDateUsd).toFixed(4)}`} d={`presupuesto US$ ${m.ai.budgetUsd}`} /><Tile t="Modelo" v={m.ai.configured ? 'Configurado' : 'Sin clave (modo FAQ)'} /></div></section>
    </div>
  );
}
