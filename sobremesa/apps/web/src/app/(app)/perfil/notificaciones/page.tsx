import type { Metadata } from 'next';
import { Notifications } from './Notifications';
export const metadata: Metadata = { title: 'Notificaciones' };
export default function Page() { return <Notifications />; }
