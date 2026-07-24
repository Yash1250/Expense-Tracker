import { getSettings, getAccounts } from '@/lib/actions';
import AddExpensePage from '@/components/AddExpensePage';

export default async function AddExpenseRoute() {
  const [{ settings }, accounts] = await Promise.all([getSettings(), getAccounts()]);
  return <AddExpensePage accounts={accounts} currency={settings?.currencySymbol || '₹'} />;
}
