import type { Metadata } from 'next';
import { Chat } from './Chat';
export const metadata: Metadata = { title: 'Conversación' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Chat conversationId={id} />;
}
