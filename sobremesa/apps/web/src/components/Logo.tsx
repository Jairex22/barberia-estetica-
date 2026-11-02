import Link from 'next/link';
import { BRAND } from '@sobremesa/shared';
export function Logo({ href = '/', size = 'md' }: { href?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl';
  return (
    <Link href={href} className={`display ${cls} font-semibold text-wine inline-flex items-center gap-2`} aria-label={`${BRAND.name}, inicio`}>
      <span aria-hidden className="inline-block h-[0.6em] w-[0.6em] rounded-full bg-ember" />
      {BRAND.name}
    </Link>
  );
}
