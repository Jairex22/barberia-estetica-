import type { Metadata } from 'next';
import { Inbox } from './Inbox';
export const metadata: Metadata = { title: 'Mensajes' };
export default function Page() { return <Inbox />; }
