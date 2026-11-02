import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { BRAND } from '@sobremesa/shared';
import { WaitlistForm } from './WaitlistForm';

export default function Landing() {
  return (
    <PublicShell>
      <section className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center pt-8 sm:pt-16">
        <div className="rise-in">
          <p className="text-sm uppercase tracking-[0.2em] text-ember font-semibold">Guadalajara · beta privada</p>
          <h1 className="mt-4 text-4xl sm:text-6xl leading-[1.05] font-semibold text-wine-deep">{BRAND.tagline_es}</h1>
          <p className="mt-6 text-lg text-ink-soft max-w-prose">
            {BRAND.name} es para personas de 18 años en adelante que quieren conocer a alguien con intención real, a partir de un plan concreto: un café, una caminata, una exposición. Sin perfiles inventados, sin bots que coquetean, sin trucos para que no canceles.
          </p>
          <ul className="mt-6 space-y-2 text-ink-soft">
            <li>• Entre una mujer y un hombre, ella da el primer paso. Lo hacemos cumplir en nuestros servidores.</li>
            <li>• Te explicamos por qué te mostramos a alguien: intereses y planes en común, nada de "porcentajes de compatibilidad".</li>
            <li>• Distancia solo aproximada, fotos sin metadatos, bloqueo y denuncia siempre gratis.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/registro" className="btn-primary">Crear cuenta</Link>
            <Link href="/premium" className="btn-secondary">Qué incluye Premium</Link>
          </div>
        </div>
        <div className="card p-6 sm:p-8 fade-in">
          <h2 className="text-2xl font-semibold">Lista de espera</h2>
          <p className="mt-2 text-ink-soft">Abrimos por zonas para que haya personas compatibles de verdad. Déjanos tu correo y te avisamos cuando tu ciudad esté activa.</p>
          <WaitlistForm />
        </div>
      </section>
      <section className="max-w-5xl mx-auto mt-20 grid gap-6 sm:grid-cols-3">
        {[
          ['Honestidad por diseño', 'Si no hay personas compatibles, te lo decimos. Nunca verás likes inventados ni "alguien te escribió" detrás de un muro de pago.'],
          ['Premium por ventajas reales', 'Ver quién te dio like, filtros adicionales, deshacer descartes y navegación privada. Cancelas en dos toques.'],
          ['Seguridad práctica', 'Verificación por selfie revisada por personas, moderación de fotos, consejos para la primera cita y 911 a un toque.'],
        ].map(([t, b]) => (
          <article key={t} className="card p-6"><h3 className="text-xl font-semibold">{t}</h3><p className="mt-2 text-ink-soft">{b}</p></article>
        ))}
      </section>
    </PublicShell>
  );
}
