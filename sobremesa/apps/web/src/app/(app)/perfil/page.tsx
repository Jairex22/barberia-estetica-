import type { Metadata } from 'next';
import Link from 'next/link';
import { serverApi, currentUser } from '@/lib/server-api';
import { label, dateLong } from '@/lib/format';
import { LogoutButton } from './LogoutButton';
export const metadata: Metadata = { title: 'Perfil' };
export default async function Page() {
  const { user } = await currentUser();
  const p = (await serverApi<{ profile: any }>('/profile/me')).data?.profile;
  const ent = (await serverApi<{ entitlement: any }>('/billing/entitlement')).data?.entitlement;
  const items = [
    ['/perfil/editar', 'Editar perfil', 'Fotos, presentación, intereses, plan ideal y preferencias'],
    ['/perfil/suscripcion', ent?.plan === 'premium' ? `Premium activo hasta ${dateLong(ent.premiumUntil)}` : 'Suscripción', ent?.plan === 'premium' ? `Canal: ${label(ent.channel)} · ${ent.cancelAtPeriodEnd ? 'No se renovará' : 'Renovación automática'}` : 'Plan gratis. Ver qué incluye Premium y precios'],
    ['/perfil/privacidad', 'Privacidad y datos', 'Qué mostramos, descarga de datos, bloqueados'],
    ['/perfil/notificaciones', 'Notificaciones', 'Correos, horas tranquilas, promociones'],
    ['/verificacion', p?.verifiedAt ? 'Perfil verificado ✓' : 'Verificar mi perfil', 'Selfie revisada por una persona del equipo'],
    ['/perfil/cuenta', 'Cuenta', 'Contraseña, sesiones, pausar o eliminar'],
    ['/ayuda', 'Ayuda', 'Asistente de IA y preguntas frecuentes'],
  ] as const;
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-cream-2 overflow-hidden">{p?.photos?.[0] && <img src={p.photos[0].url} alt="" className="h-full w-full object-cover" />}</div>
        <div><h1 className="text-2xl font-semibold">{p?.displayName}{p?.age ? <span className="text-ink-muted font-normal">, {p.age}</span> : null}</h1><p className="text-sm text-ink-muted">{user?.email} · {user?.plan === 'premium' ? 'Premium' : 'Gratis'}</p>{!p?.completedAt && <p className="text-sm text-ember mt-1">Perfil incompleto: no apareces en Descubrir todavía.</p>}</div>
      </div>
      <ul className="mt-6 card divide-y divide-cream-2">
        {items.map(([href, t, d]) => <li key={href}><Link href={href} className="block px-5 py-4 hover:bg-cream"><p className="font-medium">{t}</p><p className="text-sm text-ink-muted">{d}</p></Link></li>)}
      </ul>
      <div className="mt-6"><LogoutButton /></div>
    </div>
  );
}
