import Link from 'next/link';
import { Logo } from './Logo';
import { BRAND } from '@sobremesa/shared';
export function PublicShell({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="safe-top px-4 sm:px-8 py-4 flex items-center justify-between">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-2 text-sm">
          <Link href="/entrar" className="btn-ghost py-2">Entrar</Link>
          <Link href="/registro" className="btn-primary py-2">Crear cuenta</Link>
        </nav>
      </header>
      <main id="contenido" className={`flex-1 px-4 sm:px-8 pb-12 ${narrow ? 'max-w-md mx-auto w-full' : ''}`}>{children}</main>
      <footer className="px-4 sm:px-8 py-8 text-sm text-ink-muted border-t border-cream-2">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <span>© {new Date().getFullYear()} {BRAND.name}. Solo mayores de 18 años.</span>
          <Link href="/legal/privacidad" className="hover:text-wine">Aviso de privacidad</Link>
          <Link href="/legal/terminos" className="hover:text-wine">Términos</Link>
          <Link href="/legal/comunidad" className="hover:text-wine">Normas de comunidad</Link>
          <Link href="/ayuda" className="hover:text-wine">Ayuda</Link>
        </div>
      </footer>
    </div>
  );
}
