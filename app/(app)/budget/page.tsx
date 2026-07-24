import { getDashboardStats, getSettings } from '@/lib/actions';
import BudgetClient from '@/components/BudgetClient';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
  const [stats, { settings, budget }] = await Promise.all([getDashboardStats(), getSettings()]);
  return <BudgetClient stats={stats} budget={budget} currency={settings?.currencySymbol || '₹'} />;
}
