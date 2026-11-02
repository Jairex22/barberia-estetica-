import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';
import { Result } from './Result';
export const metadata: Metadata = { title: 'Resultado del pago' };
export default function Page() { return (<PublicShell narrow><Result /></PublicShell>); }
