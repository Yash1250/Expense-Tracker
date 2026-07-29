"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Search, Filter, Tag, Trash2, Edit2, Copy, X, Plus, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { deleteExpense, duplicateExpense, bulkDeleteExpenses, getExpenses, type ExpenseFilters } from '@/lib/actions';
import ExpenseModal from './ExpenseModal';
import { useRouter, usePathname } from 'next/navigation';
import AppModal from '@/components/AppModal';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

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

  // Mobile bottom sheet filter states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [draftCategoryId, setDraftCategoryId] = useState('');
  const [draftPaymentMethod, setDraftPaymentMethod] = useState('');
  const [draftAccountId, setDraftAccountId] = useState('');
  const [draftMonth, setDraftMonth] = useState('');
  const [draftYear, setDraftYear] = useState('');
  const [draftDateMode, setDraftDateMode] = useState<'preset' | 'custom'>('preset');
  const [draftQuickFilter, setDraftQuickFilter] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [draftMinAmount, setDraftMinAmount] = useState('');
  const [draftMaxAmount, setDraftMaxAmount] = useState('');
  const [draftSortBy, setDraftSortBy] = useState('newest');

  const openMobileFilters = () => {
    setDraftCategoryId(categoryId);
    setDraftPaymentMethod(paymentMethod);
    setDraftAccountId(accountId);
    setDraftMonth(month);
    setDraftYear(year);
    setDraftQuickFilter(quickFilter);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setDraftMinAmount(minAmount);
    setDraftMaxAmount(maxAmount);
    setDraftSortBy(sortBy);
    if (dateFrom || dateTo) {
      setDraftDateMode('custom');
    } else {
      setDraftDateMode('preset');
    }
    setShowMobileFilters(true);
  };

  const applyMobileFilters = () => {
    setCategoryId(draftCategoryId);
    setPaymentMethod(draftPaymentMethod);
    setAccountId(draftAccountId);
    setMonth(draftMonth);
    setYear(draftYear);
    if (draftDateMode === 'preset') {
      setQuickFilter(draftQuickFilter);
      setSingleDate('');
      setDateFrom('');
      setDateTo('');
    } else {
      setQuickFilter('');
      setSingleDate('');
      setDateFrom(draftDateFrom);
      setDateTo(draftDateTo);
    }
    setMinAmount(draftMinAmount);
    setMaxAmount(draftMaxAmount);
    setSortBy(draftSortBy);
    setShowMobileFilters(false);
  };

  const resetMobileFilters = () => {
    setDraftCategoryId('');
    setDraftPaymentMethod('');
    setDraftAccountId('');
    setDraftMonth('');
    setDraftYear('');
    setDraftQuickFilter('');
    setDraftDateFrom('');
    setDraftDateTo('');
    setDraftMinAmount('');
    setDraftMaxAmount('');
    setDraftSortBy('newest');
    setDraftDateMode('preset');
  };

  // Modal & Selection states
  const [editItem, setEditItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync local data with fresh server-fetched initialData after router.refresh()
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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
      router.refresh();
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
      router.refresh();
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

  // Lock body scroll when delete confirmation or bulk deletes are open
  useEffect(() => {
    if (deletingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [deletingId]);

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = 'Expenses List Report';
    const filterText = {
      Category: categoryId ? categories.find(c => c.id === categoryId)?.name || '' : '',
      Method: paymentMethod,
      Account: accountId ? accounts.find(a => a.id === accountId)?.name || '' : '',
      Month: month,
      Search: search.trim() ? search : ''
    };
    const allExpenses = data.flatMap(g => g.items);
    const totalAmountSum = allExpenses.reduce((s: number, e: any) => s + e.amount, 0);
    const summary = [
      { label: 'Total Expenses', value: `${currency}${totalAmountSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Transactions Count', value: allExpenses.length.toString() }
    ];
    const columns = ['Date', 'Category', 'Merchant', 'Notes', 'Amount', 'Payment Method'];
    const rows = allExpenses.map((e: any) => [
      typeof e.date === 'string' ? e.date.split('T')[0] : (e.date ? e.date : '-'),
      e.category || '-',
      e.merchant || '-',
      e.notes || '-',
      `${currency}${e.amount.toFixed(2)}`,
      e.method || '-'
    ]);

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV('expenses-report', columns, rows);
    } else if (type === 'excel') {
      exportToExcel('expenses-report', columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };

  return (
    <div className="pb-6">
      {/* Search & Action Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search input - always visible */}
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

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 w-full md:flex md:w-auto md:items-center md:gap-3 md:justify-end shrink-0">
            {/* Desktop Filter Button (Visible on md and up) */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-white/20 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Mobile Filter Button (Hidden on md and up) */}
            <button
              onClick={openMobileFilters}
              className={`flex md:hidden items-center justify-center gap-1.5 h-11 w-full rounded-xl text-xs font-semibold border transition-all ${
                activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Filter size={15} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-white/20 dark:bg-black/20 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <ExportDropdown onExport={handleExport} className="w-full md:w-auto h-11 md:h-auto" />

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold h-11 md:h-auto px-2 md:px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap w-full md:w-auto"
            >
              <Plus size={15} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Expanded Filter Options Container (Desktop/Tablet Only) */}
      {showFilters && (
        <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 px-1 md:px-0">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
            Active Filters:
          </span>

          {/* Quick Date preset */}
          {quickFilter && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>{QUICK_FILTERS.find(q => q.id === quickFilter)?.label || quickFilter}</span>
              <button onClick={() => setQuickFilter('')} className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Single Date */}
          {singleDate && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>Date: {singleDate}</span>
              <button onClick={() => setSingleDate('')} className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Custom Date Range */}
          {(dateFrom || dateTo) && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>
                {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : dateFrom ? `From ${dateFrom}` : `Until ${dateTo}`}
              </span>
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Category */}
          {categoryId && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>{categories.find(c => c.id === categoryId)?.name || 'Category'}</span>
              <button onClick={() => setCategoryId('')} className="p-0.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Account */}
          {accountId && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>{accounts.find(a => a.id === accountId)?.name || 'Account'}</span>
              <button onClick={() => setAccountId('')} className="p-0.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Payment Method */}
          {paymentMethod && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>{paymentMethod}</span>
              <button onClick={() => setPaymentMethod('')} className="p-0.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Month */}
          {month && (
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>Month: {MONTH_OPTIONS.find(m => m.value === month)?.label || month}</span>
              <button onClick={() => setMonth('')} className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Year */}
          {year && (
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>Year: {year}</span>
              <button onClick={() => setYear('')} className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Min Amount */}
          {minAmount && (
            <span className="inline-flex items-center gap-1 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>Min: {currency}{minAmount}</span>
              <button onClick={() => setMinAmount('')} className="p-0.5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Max Amount */}
          {maxAmount && (
            <span className="inline-flex items-center gap-1 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>Max: {currency}{maxAmount}</span>
              <button onClick={() => setMaxAmount('')} className="p-0.5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Sort By */}
          {sortBy && sortBy !== 'newest' && (
            <span className="inline-flex items-center gap-1 text-xs bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 rounded-full pl-3 pr-1.5 py-1 font-medium">
              <span>Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label || sortBy}</span>
              <button onClick={() => setSortBy('newest')} className="p-0.5 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}

          {/* Clear All */}
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold px-2.5 py-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Record Count */}
      <div className="px-1 mb-2 flex items-center justify-between text-xs text-zinc-500 font-medium">
        <span>Showing {data.flatMap(g => g.items).length} {data.flatMap(g => g.items).length === 1 ? 'expense' : 'expenses'}</span>
        {isPending && <span className="text-blue-500 animate-pulse">Updating...</span>}
      </div>

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
      <AppModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Expense?"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium">
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deletingId!)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="text-zinc-500 text-sm">This action cannot be undone.</p>
      </AppModal>

      {/* Mobile Filter Bottom Sheet */}
      <AppModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filter & Sort"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={resetMobileFilters}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={applyMobileFilters}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              Apply Filters
            </button>
          </div>
        }
      >
        <div className="space-y-5 text-left">
          {/* Date Picker Group */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">📅 Date Filter</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDraftDateMode('preset')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  draftDateMode === 'preset'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-900/50'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Quick Options
              </button>
              <button
                type="button"
                onClick={() => setDraftDateMode('custom')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  draftDateMode === 'custom'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-900/50'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Custom Range
              </button>
            </div>

            {draftDateMode === 'preset' ? (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last_7_days', label: 'Last 7 Days' },
                  { id: 'last_30_days', label: 'Last 30 Days' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                ].map(q => {
                  const active = draftQuickFilter === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setDraftQuickFilter(draftQuickFilter === q.id ? '' : q.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    value={draftDateFrom}
                    onChange={e => setDraftDateFrom(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    value={draftDateTo}
                    onChange={e => setDraftDateTo(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800/60" />

          {/* Category Group */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">📂 Category</label>
            <select
              value={draftCategoryId}
              onChange={e => setDraftCategoryId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Group */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">💳 Account</label>
            <select
              value={draftAccountId}
              onChange={e => setDraftAccountId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Group */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">💳 Payment Method</label>
            <select
              value={draftPaymentMethod}
              onChange={e => setDraftPaymentMethod(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800/60" />

          {/* Sort Group */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">📊 Sort By</label>
            <select
              value={draftSortBy}
              onChange={e => setDraftSortBy(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800/60" />

          {/* Month & Year Group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">📆 Month</label>
              <select
                value={draftMonth}
                onChange={e => setDraftMonth(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTH_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">📆 Year</label>
              <select
                value={draftYear}
                onChange={e => setDraftYear(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800/60" />

          {/* Amount Range Group */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">💵 Amount Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{currency}</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={draftMinAmount}
                  onChange={e => setDraftMinAmount(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{currency}</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={draftMaxAmount}
                  onChange={e => setDraftMaxAmount(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
