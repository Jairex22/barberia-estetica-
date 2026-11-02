import type { Metadata } from 'next';
import { EditProfile } from './EditProfile';
export const metadata: Metadata = { title: 'Editar perfil' };
export default function Page() { return <EditProfile />; }
