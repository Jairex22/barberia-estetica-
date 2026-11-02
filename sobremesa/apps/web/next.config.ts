import type { NextConfig } from 'next';

const API = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sobremesa/shared'],
  poweredByHeader: false,
  async rewrites() {
    // El navegador habla con /api/* (mismo origen → cookies httpOnly funcionan) y Next lo reenvía al API.
    return [{ source: '/api/:path*', destination: `${API}/:path*` }];
  },
  async headers() {
    const noIndex = { key: 'X-Robots-Tag', value: 'noindex, nofollow, noimageindex' };
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
    ];
    return [
      { source: '/:path*', headers: security },
      // Perfiles, mensajes y panel nunca se indexan.
      { source: '/(descubrir|conexiones|mensajes|perfil|premium|admin|ayuda|verificacion)(.*)', headers: [noIndex] },
    ];
  },
};
export default nextConfig;
