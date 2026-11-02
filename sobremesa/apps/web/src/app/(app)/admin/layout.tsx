import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/server-api';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await currentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) redirect('/descubrir');
  const isAdmin = user.role === 'admin';
  const links = [['/admin', 'Resumen', true], ['/admin/reportes', 'Reportes', false], ['/admin/fotos', 'Fotos', false], ['/admin/verificaciones', 'Verificaciones', false], ['/admin/apelaciones', 'Apelaciones', false], ['/admin/usuarios', 'Usuarios', true], ['/admin/facturacion', 'Facturación', true], ['/admin/asistente', 'Asistente IA', true], ['/admin/conocimiento', 'Conocimiento', true], ['/admin/auditoria', 'Auditoría', true], ['/admin/ajustes', 'Ajustes', true]] as const;
  return (
    <div>
      <div className="flex items-baseline justify-between"><h1 className="text-2xl font-semibold">Panel {isAdmin ? 'administrativo' : 'de moderación'}</h1><span className="text-xs text-ink-muted">Acceso: {user.role}</span></div>
      <nav aria-label="Panel" className="mt-3 flex gap-2 overflow-x-auto pb-2">{links.filter(([, , adminOnly]) => isAdmin || !adminOnly).map(([h, l]) => <Link key={h} href={h} className="chip whitespace-nowrap hover:bg-ember-soft">{l}</Link>)}</nav>
      <div className="mt-4">{children}</div>
    </div>
  );
}
