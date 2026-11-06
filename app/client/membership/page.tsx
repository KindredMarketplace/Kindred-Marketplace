import type { Metadata } from 'next';
import { MembershipPage } from '@/components/membership/MembershipPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Membership' };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <MembershipPage role="client" status={status} />;
}
