'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@sobremesa/shared';
import { Logo } from './Logo';

const ITEMS = [
  { href: '/descubrir', label: 'Descubrir', icon: 'M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z' },
  { href: '/conexiones', label: 'Conexiones', icon: 'M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z' },
  { href: '/mensajes', label: 'Mensajes', icon: 'M4 5h16v10H8l-4 4z' },
  { href: '/perfil', label: 'Perfil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0z' },
];
export function AppNav({ user }: { user: SessionUser }) {
  const path = usePathname();
  const items = user.role === 'admin' || user.role === 'moderator' ? [...ITEMS, { href: '/admin', label: 'Panel', icon: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z' }] : ITEMS;
  return (
    <>
      <aside className="hidden lg:flex flex-col gap-2 border-r border-cream-2 p-6 sticky top-0 h-dvh">
        <div className="mb-6"><Logo href="/descubrir" /></div>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {items.map((it) => { const on = path.startsWith(it.href); return (
            <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base ${on ? 'bg-wine text-cream' : 'text-ink-soft hover:bg-cream-2'}`}>
              <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d={it.icon} /></svg>{it.label}
            </Link>); })}
        </nav>
        <div className="mt-auto text-xs text-ink-muted">
          <p>{user.plan === 'premium' ? 'Premium activo' : 'Plan gratis'}</p>
          <Link href="/ayuda" className="underline">Ayuda</Link>
        </div>
      </aside>
      <nav aria-label="Principal" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-cream-2 safe-bottom">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((it) => { const on = path.startsWith(it.href); return (
            <li key={it.href}><Link href={it.href} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs ${on ? 'text-wine font-semibold' : 'text-ink-muted'}`}>
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d={it.icon} /></svg>{it.label}
            </Link></li>); })}
        </ul>
      </nav>
    </>
  );
}
