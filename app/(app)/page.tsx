import { getDashboardStats } from '@/lib/actions';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const stats = await getDashboardStats();
  return <DashboardClient stats={stats} />;
}
