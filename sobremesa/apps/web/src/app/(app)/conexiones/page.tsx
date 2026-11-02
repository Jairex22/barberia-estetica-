import type { Metadata } from 'next';
import { Connections } from './Connections';
export const metadata: Metadata = { title: 'Conexiones' };
export default function Page() { return <Connections />; }
