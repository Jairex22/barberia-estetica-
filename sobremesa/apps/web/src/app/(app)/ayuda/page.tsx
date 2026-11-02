import type { Metadata } from 'next';
import { Help } from './Help';
export const metadata: Metadata = { title: 'Ayuda' };
export default function Page() { return <Help />; }
