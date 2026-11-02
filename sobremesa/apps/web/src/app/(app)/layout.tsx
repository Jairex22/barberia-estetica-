import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/server-api';
import { AppNav } from '@/components/AppNav';
import { StateView } from '@/components/StateView';
import { Logo } from '@/components/Logo';

export const metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, apiDown } = await currentUser();
  if (apiDown) return (<div className="min-h-dvh p-6 flex flex-col items-center justify-center gap-6"><Logo /><StateView state="unavailable" title="Servicio no disponible" body="No pudimos conectar con el servidor. Inténtalo en unos minutos." /></div>);
  if (!user) redirect('/entrar');
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <AppNav user={user} />
      <main id="contenido" className="px-4 sm:px-8 pt-4 pb-28 lg:pb-10 max-w-4xl w-full mx-auto">
        {!user.emailVerifiedAt && (
          <div role="status" className="mb-4 rounded-xl bg-ember-soft px-4 py-3 text-sm text-ink-soft flex flex-wrap items-center justify-between gap-2">
            <span>Verifica tu correo para aparecer en Descubrir y dar likes.</span>
            <a href="/verificar-correo" className="text-wine font-medium underline">Reenviar correo</a>
          </div>
        )}
        {user.status === 'paused' && <div role="status" className="mb-4 rounded-xl bg-cream-2 px-4 py-3 text-sm">Tu cuenta está en pausa: no apareces en Descubrir. <a href="/perfil/cuenta" className="underline text-wine">Reactivar</a></div>}
        {children}
      </main>
    </div>
  );
}
