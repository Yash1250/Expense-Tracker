import { getInvestments, getInvestmentStats, getAccounts, getSettings, InvestmentFilters } from '@/lib/actions';
import InvestmentsClient from '@/components/InvestmentsClient';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function InvestmentsPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: InvestmentFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    type: typeof params.type === 'string' ? params.type : undefined,
    broker: typeof params.broker === 'string' ? params.broker : undefined,
    accountId: typeof params.accountId === 'string' ? params.accountId : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : undefined,
    month: typeof params.month === 'string' ? params.month : undefined,
    year: typeof params.year === 'string' ? params.year : undefined,
    minAmount: typeof params.minAmount === 'string' ? Number(params.minAmount) : undefined,
    maxAmount: typeof params.maxAmount === 'string' ? Number(params.maxAmount) : undefined,
    profitLoss: (params.profitLoss === 'profit' || params.profitLoss === 'loss') ? params.profitLoss : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
  };

  const [investments, stats, accounts, { settings }] = await Promise.all([
    getInvestments(filters),
    getInvestmentStats(),
    getAccounts(),
    getSettings(),
  ]);

  return (
    <InvestmentsClient
      initialInvestments={investments}
      stats={stats}
      accounts={accounts}
      currency={settings?.currencySymbol || '₹'}
      initialFilters={filters}
    />
  );
}
