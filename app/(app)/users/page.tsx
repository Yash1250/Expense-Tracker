import UsersClient from '@/components/UsersClient';
import { getUsers } from '@/lib/user-actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'User Management - Expense Tracker',
};

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');
  const users = await getUsers();
  return <UsersClient initialUsers={users} />;
}
