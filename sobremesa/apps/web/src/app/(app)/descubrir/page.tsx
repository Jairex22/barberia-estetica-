import type { Metadata } from 'next';
import { Discover } from './Discover';
export const metadata: Metadata = { title: 'Descubrir' };
export default function Page() { return <Discover />; }
