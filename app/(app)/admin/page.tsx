import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getSystemStats, getUsers, getAuditLogs } from '@/lib/user-actions';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'System Administration - Expense Tracker',
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/');
  }

  const [stats, users, logs] = await Promise.all([
    getSystemStats(),
    getUsers(),
    getAuditLogs(),
  ]);

  return (
    <AdminDashboardClient
      initialStats={stats}
      initialUsers={users}
      initialLogs={logs}
    />
  );
}
