import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';
import { RegisterForm } from './RegisterForm';
export const metadata: Metadata = { title: 'Crear cuenta' };
export default function Page() {
  return (
    <PublicShell narrow>
      <h1 className="text-3xl font-semibold mt-4">Crear cuenta</h1>
      <p className="mt-2 text-ink-soft">Solo para mayores de 18 años. Tu correo se verifica antes de aparecer en Descubrir.</p>
      <RegisterForm />
    </PublicShell>
  );
}
