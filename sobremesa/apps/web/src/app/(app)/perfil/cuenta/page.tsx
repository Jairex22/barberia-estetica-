import type { Metadata } from 'next';
import { Account } from './Account';
export const metadata: Metadata = { title: 'Cuenta' };
export default function Page() { return <Account />; }
