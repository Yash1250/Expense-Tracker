import { getAccounts } from '@/lib/actions';
import AccountsClient from '@/components/AccountsClient';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const accounts = await getAccounts();
  return <AccountsClient initialAccounts={accounts as any} />;
}
