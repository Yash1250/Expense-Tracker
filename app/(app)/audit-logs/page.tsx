import AuditLogsClient from '@/components/AuditLogsClient';
import { getAuditLogs } from '@/lib/user-actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Audit Logs - Expense Tracker',
};

export default async function AuditLogsPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');
  const logs = await getAuditLogs();
  return <AuditLogsClient logs={logs} />;
}
