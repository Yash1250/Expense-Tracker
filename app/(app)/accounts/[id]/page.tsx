import { getAccountDetails, getSettings } from '@/lib/actions';
import AccountDetailsClient from '@/components/AccountDetailsClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailsPage({ params }: Props) {
  const { id } = await params;
  const [{ settings }, details] = await Promise.all([
    getSettings(),
    getAccountDetails(id),
  ]);

  if (!details) {
    notFound();
  }

  return (
    <AccountDetailsClient
      details={details}
      currency={settings?.currencySymbol || '₹'}
    />
  );
}
