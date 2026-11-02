import type { Metadata } from 'next';
import { Subscription } from './Subscription';
export const metadata: Metadata = { title: 'Suscripción' };
export default function Page() { return <Subscription />; }
