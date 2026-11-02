import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';
import { currentUser } from '@/lib/server-api';
import { Premium } from './Premium';
export const metadata: Metadata = { title: 'Premium' };
export default async function Page() {
  const { user } = await currentUser();
  return (<PublicShell><Premium loggedIn={Boolean(user)} verified={Boolean(user?.emailVerifiedAt)} plan={user?.plan ?? 'free'} /></PublicShell>);
}
