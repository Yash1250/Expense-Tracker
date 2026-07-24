import { getExpenses, getCategories, getAccounts, getSettings, getExpenseYears, type ExpenseFilters } from '@/lib/actions';
import ExpensesListClient from '@/components/ExpensesListClient';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExpensesList({ searchParams }: Props) {
  const params = (await searchParams) || {};

  const initialFilters: ExpenseFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    categoryId: typeof params.categoryId === 'string' ? params.categoryId : undefined,
    paymentMethod: typeof params.paymentMethod === 'string' ? params.paymentMethod : undefined,
    accountId: typeof params.accountId === 'string' ? params.accountId : undefined,
    month: typeof params.month === 'string' ? params.month : undefined,
    year: typeof params.year === 'string' ? params.year : undefined,
    singleDate: typeof params.singleDate === 'string' ? params.singleDate : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : undefined,
    quickFilter: typeof params.quickFilter === 'string' ? params.quickFilter : undefined,
    minAmount: typeof params.minAmount === 'string' && params.minAmount !== '' ? Number(params.minAmount) : undefined,
    maxAmount: typeof params.maxAmount === 'string' && params.maxAmount !== '' ? Number(params.maxAmount) : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : 'newest',
  };

  const [data, categories, accounts, years, { settings }] = await Promise.all([
    getExpenses(initialFilters),
    getCategories(),
    getAccounts(),
    getExpenseYears(),
    getSettings(),
  ]);

  return (
    <ExpensesListClient
      initialData={data}
      categories={categories}
      accounts={accounts}
      years={years}
      currency={settings?.currencySymbol || '₹'}
      initialFilters={initialFilters}
    />
  );
}
