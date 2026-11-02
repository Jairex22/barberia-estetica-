import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND } from '@sobremesa/shared';

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline_es,
  applicationName: BRAND.name,
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#6b1f2b' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:px-4 focus:py-2 focus:rounded-lg">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
