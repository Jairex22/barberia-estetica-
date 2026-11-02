import { PublicShell } from '@/components/PublicShell';
export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (<PublicShell><article className="prose-like max-w-3xl mx-auto pt-6 text-ink-soft [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-8 [&_p]:mt-3 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-6">
    <h1 className="text-3xl font-semibold text-ink">{title}</h1><p className="text-sm text-ink-muted">Última actualización: {updated}. <strong>Borrador operativo</strong>: este texto está adaptado a México pero requiere revisión por un profesional legal antes del lanzamiento (se marcan los puntos).</p>{children}</article></PublicShell>);
}
