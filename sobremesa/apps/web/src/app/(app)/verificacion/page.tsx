import type { Metadata } from 'next';
import { Verification } from './Verification';
export const metadata: Metadata = { title: 'Verificación' };
export default function Page() { return <Verification />; }
