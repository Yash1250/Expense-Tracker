import { getIncomes, getAccounts, getSettings } from '@/lib/actions';
import IncomeClient from '@/components/IncomeClient';

export const dynamic = 'force-dynamic';

export default async function IncomePage() {
  const [data, accounts, { settings }] = await Promise.all([getIncomes(), getAccounts(), getSettings()]);
  return <IncomeClient initialData={data as any} accounts={accounts} currency={settings?.currencySymbol || '₹'} />;
}
