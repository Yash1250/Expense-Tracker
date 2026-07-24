import ProfileClient from '@/components/ProfileClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Profile - Expense Tracker',
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <ProfileClient user={session} />;
}
