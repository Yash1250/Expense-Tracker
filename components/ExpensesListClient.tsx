"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Search, Filter, Tag, Trash2, Edit2, Copy, X, Plus, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { deleteExpense, duplicateExpense, bulkDeleteExpenses, getExpenses, type ExpenseFilters } from '@/lib/actions';
import ExpenseModal from './ExpenseModal';
import { useRouter, usePathname } from 'next/navigation';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Bank Transfer', 'Cheque'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Amount' },
  { value: 'lowest', label: 'Lowest Amount' },
  { value: 'cat_asc', label: 'Category A-Z' },
  { value: 'cat_desc', label: 'Category Z-A' },
  { value: 'merchant_asc', label: 'Merchant A-Z' },
  { value: 'merchant_desc', label: 'Merchant Z-A' },
];

const MONTH_OPTIONS = [
  { value: '', label: 'All Months' },
  { value: 'current', label: 'Current Month' },
  { value: 'previous', label: 'Previous Month' },
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
];

const QUICK_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'last_week', label: 'Last Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'last_90_days', label: 'Last 90 Days' },
];

type Props = {
  initialData: any[];
  categories: any[];
  accounts: any[];
  years: number[];
  currency: string;
  initialFilters?: ExpenseFilters;
};

export default function ExpensesListClient({ initialData, categories, accounts, years, currency, initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);

  // Filters state initialized from initialFilters
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [categoryId, setCategoryId] = useState(initialFilters?.categoryId || '');
  const [paymentMethod, setPaymentMethod] = useState(initialFilters?.paymentMethod || '');
  const [accountId, setAccountId] = useState(initialFilters?.accountId || '');
  const [month, setMonth] = useState(initialFilters?.month || '');
  const [year, setYear] = useState(initialFilters?.year || '');
  const [singleDate, setSingleDate] = useState(initialFilters?.singleDate || '');
  const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters?.dateTo || '');
  const [quickFilter, setQuickFilter] = useState(initialFilters?.quickFilter || '');
  const [minAmount, setMinAmount] = useState<string>(initialFilters?.minAmount !== undefined ? String(initialFilters.minAmount) : '');
  const [maxAmount, setMaxAmount] = useState<string>(initialFilters?.maxAmount !== undefined ? String(initialFilters.maxAmount) : '');
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'newest');

  // Filter options container toggle (collapsed by default unless filters are active)
  const initialHasFilters = Boolean(
    categoryId || paymentMethod || accountId || month || year || singleDate || dateFrom || dateTo || quickFilter || minAmount || maxAmount || (sortBy && sortBy !== 'newest')
  );
  const [showFilters, setShowFilters] = useState(initialHasFilters);

  // Modal & Selection states
  const [editItem, setEditItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isFirstRender = useRef(true);

  // Sync state with URL & call backend getExpenses
  const fetchFilteredData = useCallback(
    (currentFilters: ExpenseFilters) => {
      const params = new URLSearchParams();
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.categoryId) params.set('categoryId', currentFilters.categoryId);
      if (currentFilters.paymentMethod) params.set('paymentMethod', currentFilters.paymentMethod);
      if (currentFilters.accountId) params.set('accountId', currentFilters.accountId);
      if (currentFilters.month) params.set('month', currentFilters.month);
      if (currentFilters.year) params.set('year', currentFilters.year);
      if (currentFilters.singleDate) params.set('singleDate', currentFilters.singleDate);
      if (currentFilters.dateFrom) params.set('dateFrom', currentFilters.dateFrom);
      if (currentFilters.dateTo) params.set('dateTo', currentFilters.dateTo);
      if (currentFilters.quickFilter) params.set('quickFilter', currentFilters.quickFilter);
      if (currentFilters.minAmount !== undefined && currentFilters.minAmount !== null && !isNaN(currentFilters.minAmount)) {
        params.set('minAmount', String(currentFilters.minAmount));
      }
      if (currentFilters.maxAmount !== undefined && currentFilters.maxAmount !== null && !isNaN(currentFilters.maxAmount)) {
        params.set('maxAmount', String(currentFilters.maxAmount));
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== 'newest') params.set('sortBy', currentFilters.sortBy);

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      if (typeof window !== 'undefined') {
        window.history.replaceState(window.history.state, '', newUrl);
      }

      startTransition(async () => {
        const result = await getExpenses(currentFilters);
        setData(result);
      });
    },
    [pathname]
  );

  // Effect for debounced text search & instant filter changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      const filters: ExpenseFilters = {
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        paymentMethod: paymentMethod || undefined,
        accountId: accountId || undefined,
        month: month || undefined,
        year: year || undefined,
        singleDate: singleDate || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        quickFilter: quickFilter || undefined,
        minAmount: minAmount !== '' && !isNaN(Number(minAmount)) ? Number(minAmount) : undefined,
        maxAmount: maxAmount !== '' && !isNaN(Number(maxAmount)) ? Number(maxAmount) : undefined,
        sortBy: sortBy || 'newest',
      };
      fetchFilteredData(filters);
    }, 300);

    return () => clearTimeout(handler);
  }, [
    search,
    categoryId,
    paymentMethod,
    accountId,
    month,
    year,
    singleDate,
    dateFrom,
    dateTo,
    quickFilter,
    minAmount,
    maxAmount,
    sortBy,
    fetchFilteredData,
  ]);

  const clearAllFilters = () => {
    setSearch('');
    setCategoryId('');
    setPaymentMethod('');
    setAccountId('');
    setMonth('');
    setYear('');
    setSingleDate('');
    setDateFrom('');
    setDateTo('');
    setQuickFilter('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('newest');
  };

  const handleQuickFilterClick = (qId: string) => {
    if (quickFilter === qId) {
      setQuickFilter('');
    } else {
      setQuickFilter(qId);
      setSingleDate('');
      setDateFrom('');
      setDateTo('');
      setMonth('');
      setYear('');
    }
  };

  const handleSingleDateChange = (val: string) => {
    setSingleDate(val);
    if (val) {
      setQuickFilter('');
      setDateFrom('');
      setDateTo('');
      setMonth('');
      setYear('');
    }
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    if (val) {
      setQuickFilter('');
      setSingleDate('');
    }
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    if (val) {
      setQuickFilter('');
      setSingleDate('');
    }
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteExpense(id);
      setData(prev => prev.map(g => ({ ...g, items: g.items.filter((i: any) => i.id !== id) })).filter(g => g.items.length > 0));
      setDeletingId(null);
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      await duplicateExpense(id);
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    startTransition(async () => {
      await bulkDeleteExpenses([...selected]);
      setData(prev => prev.map(g => ({ ...g, items: g.items.filter((i: any) => !selected.has(i.id)) })).filter(g => g.items.length > 0));
      setSelected(new Set());
    });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const allIds = data.flatMap(g => g.items.map((i: any) => i.id));
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const totalFiltered = data.reduce((s, g) => s + g.total, 0);

  const activeFilterCount = [
    categoryId,
    paymentMethod,
    accountId,
    month,
    year,
    singleDate,
    dateFrom,
    dateTo,
    quickFilter,
    minAmount,
    maxAmount,
    sortBy !== 'newest' ? sortBy : '',
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(search) || activeFilterCount > 0;

  return (
    <div className="pb-6">
      {/* Search & Filter Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search title, category, merchant, notes, amount..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Filter size={16} />
            <span>Filter Options</span>
            {activeFilterCount > 0 && (
              <span className="bg-white/20 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-zinc-500 hover:text-red-600 font-medium px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Clear All
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm ml-auto sm:ml-0"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Collapsible Expanded Filter Options Container */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} /> Filter & Sort Criteria
            </h2>
            <button onClick={() => setShowFilters(false)} className="text-zinc-400 hover:text-zinc-600">
              <X size={16} />
            </button>
          </div>

          {/* Primary Select Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Filter */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Account</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Range Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Month Filter */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Month</label>
              <select
                value={month}
                onChange={e => {
                  setMonth(e.target.value);
                  if (e.target.value) {
                    setSingleDate('');
                    setQuickFilter('');
                  }
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {MONTH_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Year</label>
              <select
                value={year}
                onChange={e => {
                  setYear(e.target.value);
                  if (e.target.value) {
                    setSingleDate('');
                    setQuickFilter('');
                  }
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Single Date Filter */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Single Date</label>
              <input
                type="date"
                value={singleDate}
                onChange={e => handleSingleDateChange(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Date Range - Start */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => handleDateFromChange(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Date Range - End */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => handleDateToChange(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Amount Range & Clear Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount Range:</span>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{currency}</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-6 pr-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-xs text-zinc-400">–</span>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{currency}</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-6 pr-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isPending && <span className="text-xs text-blue-500 font-medium animate-pulse">Updating results…</span>}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <X size={14} /> Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[11px] font-semibold text-zinc-400 mb-2 block uppercase tracking-wider">Quick Date Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map(q => {
                const active = quickFilter === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleQuickFilterClick(q.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 md:px-0 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-3">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 flex-1">{selected.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="flex items-center gap-1 text-sm text-red-600 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <Trash2 size={14} /> Delete Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-zinc-500">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary bar */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-3">
          <button onClick={() => (allSelected ? setSelected(new Set()) : setSelected(new Set(allIds)))} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700">
            {allSelected ? <CheckSquare size={14} /> : <Square size={14} />} Select All
          </button>
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total: {currency}{totalFiltered.toFixed(2)}</span>
        </div>
      )}

      {/* Expense list & Empty State */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 text-center">
          <Tag size={40} className="mb-3 opacity-30 text-zinc-400" />
          <p className="font-semibold text-base text-zinc-700 dark:text-zinc-300">No expenses found for the selected filters.</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Try clearing or adjusting your search parameters.</p>
          <button onClick={clearAllFilters} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6 px-1 md:px-0">
          {data.map((group, idx) => (
            <section key={idx}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{group.date}</h3>
                <span className="text-xs font-semibold text-zinc-400">{currency}{group.total.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {group.items.map((item: any) => (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border transition-all cursor-pointer ${
                      selected.has(item.id) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-100 dark:border-zinc-800 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0" onClick={() => toggleSelect(item.id)}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: item.categoryColor + '22' }}>
                        {item.categoryIcon || '📦'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.category} · {item.time} {item.accountName ? `· ${item.accountName}` : ''}
                        </p>
                        {item.merchant && <p className="text-xs text-zinc-400">{item.merchant}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(item.id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-violet-500 transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-right ml-1">
                        <p className="font-bold text-sm text-red-500">
                          -{currency}{item.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">{item.method}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <ExpenseModal
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
            router.refresh();
          }}
          editData={editItem}
          accounts={accounts}
          currency={currency}
        />
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Delete Expense?</h3>
            <p className="text-zinc-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
