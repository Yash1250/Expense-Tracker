"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Plus, Search, Filter, Pencil, Trash2, X, Check,
  DollarSign, PieChart as PieIcon, BarChart2, ShieldCheck, ArrowUpRight, ArrowDownRight,
  Briefcase, Wallet, Tag, Layers, RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { addInvestment, updateInvestment, deleteInvestment, InvestmentInput } from '@/lib/actions';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

const INVESTMENT_TYPES = [
  'Stocks', 'Mutual Funds', 'SIP', 'IPO', 'Gold', 'Silver',
  'Fixed Deposit (FD)', 'Recurring Deposit (RD)', 'PPF', 'NPS',
  'Bonds', 'Crypto', 'ETF', 'Real Estate', 'Other'
];

const BROKERS_SUGGESTIONS = ['Zerodha', 'Groww', 'AngelOne', 'Upstox', 'Paytm Money', 'ICICI Direct', 'HDFC Securities', 'SBI Bank', 'Binance', 'WazirX'];

const TYPE_COLORS: Record<string, string> = {
  'Stocks': '#3b82f6',
  'Mutual Funds': '#10b981',
  'SIP': '#8b5cf6',
  'IPO': '#f97316',
  'Gold': '#f59e0b',
  'Silver': '#64748b',
  'Fixed Deposit (FD)': '#06b6d4',
  'Recurring Deposit (RD)': '#0284c7',
  'PPF': '#059669',
  'NPS': '#7c3aed',
  'Bonds': '#d97706',
  'Crypto': '#ec4899',
  'ETF': '#14b8a6',
  'Real Estate': '#84cc16',
  'Other': '#6b7280',
};

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  color: string;
  icon: string;
};

type Investment = {
  id: string;
  investmentType: string;
  investmentName: string;
  broker: string | null;
  accountId: string | null;
  account?: Account | null;
  investmentDate: Date | string;
  amount: number;
  units: number | null;
  purchasePrice: number | null;
  currentPrice: number | null;
  currentValue: number;
  brokerCharges: number | null;
  tax: number | null;
  notes: string | null;
  tags: string | null;
  status: string;
};

type Props = {
  initialInvestments: Investment[];
  stats: {
    totalInvested: number;
    currentPortfolioValue: number;
    totalProfitLoss: number;
    returnPercentage: number;
    activeCount: number;
    totalCount: number;
    bestPerformer: any;
    worstPerformer: any;
    typeData: Array<{ type: string; invested: number; currentValue: number; profitLoss: number }>;
    brokerData: Array<{ broker: string; amount: number }>;
    brokers: string[];
    years: number[];
  };
  accounts: Account[];
  currency: string;
  initialFilters: any;
};

export default function InvestmentsClient({ initialInvestments, stats, accounts, currency, initialFilters }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search and Filter states
  const [search, setSearch] = useState(initialFilters.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState(initialFilters.type || 'all');
  const [selectedBroker, setSelectedBroker] = useState(initialFilters.broker || 'all');
  const [selectedAccount, setSelectedAccount] = useState(initialFilters.accountId || 'all');
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status || 'all');
  const [selectedProfitLoss, setSelectedProfitLoss] = useState(initialFilters.profitLoss || 'all');
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'newest');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Investment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal || deletingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, deletingId]);

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = 'Investment Portfolio Report';
    const filterText = {
      Type: selectedType !== 'all' ? selectedType : '',
      Broker: selectedBroker !== 'all' ? selectedBroker : '',
      Account: selectedAccount !== 'all' ? selectedAccount : '',
      Performance: selectedProfitLoss !== 'all' ? selectedProfitLoss : '',
      Search: search.trim() ? search : ''
    };
    const summary = [
      { label: 'Total Value', value: `${currency}${stats.currentPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Total Invested', value: `${currency}${stats.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Total profit / loss', value: `${stats.totalProfitLoss >= 0 ? '+' : ''}${currency}${stats.totalProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
    ];
    const columns = ['Asset Name', 'Type', 'Broker', 'Invested', 'Current Value', 'P/L', 'Status', 'Date'];
    const rows = filteredInvestments.map(item => {
      const pl = item.currentValue - item.amount;
      const plPct = item.amount > 0 ? (pl / item.amount) * 100 : 0;
      const dStr = typeof item.investmentDate === 'string' ? item.investmentDate.split('T')[0] : item.investmentDate.toISOString().split('T')[0];
      return [
        item.investmentName,
        item.investmentType,
        item.broker || '-',
        `${currency}${item.amount.toFixed(2)}`,
        `${currency}${item.currentValue.toFixed(2)}`,
        `${pl >= 0 ? '+' : ''}${currency}${pl.toFixed(2)} (${plPct.toFixed(1)}%)`,
        item.status,
        dStr
      ];
    });

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV('investment-report', columns, rows);
    } else if (type === 'excel') {
      exportToExcel('investment-report', columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };

  // Form inputs
  const [invType, setInvType] = useState('Stocks');
  const [customType, setCustomType] = useState('');
  const [invName, setInvName] = useState('');
  const [broker, setBroker] = useState('');
  const [accountId, setAccountId] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [brokerCharges, setBrokerCharges] = useState('0');
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('active');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedBroker !== 'all') params.set('broker', selectedBroker);
    if (selectedAccount !== 'all') params.set('accountId', selectedAccount);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedProfitLoss !== 'all') params.set('profitLoss', selectedProfitLoss);
    if (sortBy !== 'newest') params.set('sortBy', sortBy);

    const query = params.toString();
    const newUrl = query ? `/investments?${query}` : '/investments';
    window.history.replaceState(window.history.state, '', newUrl);
  }, [debouncedSearch, selectedType, selectedBroker, selectedAccount, selectedStatus, selectedProfitLoss, sortBy]);

  // Auto-calculate current value when units or current price changes
  useEffect(() => {
    const u = parseFloat(units);
    const cp = parseFloat(currentPrice);
    if (!isNaN(u) && !isNaN(cp)) {
      setCurrentValue((u * cp).toFixed(2));
    }
  }, [units, currentPrice]);

  const activeFilterCount = [
    selectedType !== 'all',
    selectedBroker !== 'all',
    selectedAccount !== 'all',
    selectedStatus !== 'all',
    selectedProfitLoss !== 'all',
    sortBy !== 'newest',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedType('all');
    setSelectedBroker('all');
    setSelectedAccount('all');
    setSelectedStatus('all');
    setSelectedProfitLoss('all');
    setSortBy('newest');
  };

  const openCreate = () => {
    setEditItem(null);
    setInvType('Stocks');
    setCustomType('');
    setInvName('');
    setBroker('');
    setAccountId(accounts[0]?.id || '');
    setInvDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setUnits('');
    setPurchasePrice('');
    setCurrentPrice('');
    setCurrentValue('');
    setBrokerCharges('0');
    setTax('0');
    setNotes('');
    setTags('');
    setStatus('active');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: Investment) => {
    setEditItem(item);
    if (INVESTMENT_TYPES.includes(item.investmentType)) {
      setInvType(item.investmentType);
      setCustomType('');
    } else {
      setInvType('Other');
      setCustomType(item.investmentType);
    }
    setInvName(item.investmentName);
    setBroker(item.broker || '');
    setAccountId(item.accountId || '');
    const dStr = typeof item.investmentDate === 'string' ? item.investmentDate.split('T')[0] : item.investmentDate.toISOString().split('T')[0];
    setInvDate(dStr);
    setAmount(item.amount.toString());
    setUnits(item.units !== null ? item.units.toString() : '');
    setPurchasePrice(item.purchasePrice !== null ? item.purchasePrice.toString() : '');
    setCurrentPrice(item.currentPrice !== null ? item.currentPrice.toString() : '');
    setCurrentValue(item.currentValue.toString());
    setBrokerCharges(item.brokerCharges !== null ? item.brokerCharges.toString() : '0');
    setTax(item.tax !== null ? item.tax.toString() : '0');
    setNotes(item.notes || '');
    setTags(item.tags || '');
    setStatus(item.status || 'active');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    const finalType = invType === 'Other' && customType.trim() ? customType.trim() : invType;
    if (!invName.trim()) {
      setFormError('Investment Name is required.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid investment amount (> 0).');
      return;
    }

    const payload: InvestmentInput = {
      investmentType: finalType,
      investmentName: invName.trim(),
      broker: broker.trim() || undefined,
      accountId: accountId || undefined,
      investmentDate: invDate,
      amount: numAmount,
      units: units ? parseFloat(units) : undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
      currentValue: currentValue ? parseFloat(currentValue) : numAmount,
      brokerCharges: brokerCharges ? parseFloat(brokerCharges) : 0,
      tax: tax ? parseFloat(tax) : 0,
      notes: notes.trim() || undefined,
      tags: tags.trim() || undefined,
      status,
    };

    startTransition(async () => {
      const res = editItem ? await updateInvestment(editItem.id, payload) : await addInvestment(payload);
      if (res.success) {
        setShowModal(false);
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to save investment.');
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteInvestment(id);
      if (res.success) {
        setDeletingId(null);
        router.refresh();
      } else {
        setDeleteError(res.error || 'Failed to delete investment.');
      }
    });
  };

  // Filter local items if needed
  const filteredInvestments = initialInvestments.filter(item => {
    const term = debouncedSearch.toLowerCase().trim();
    if (term) {
      const match =
        item.investmentName.toLowerCase().includes(term) ||
        (item.broker && item.broker.toLowerCase().includes(term)) ||
        item.investmentType.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term)) ||
        (item.tags && item.tags.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Briefcase size={26} className="text-blue-600" /> Investment Portfolio
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Track your assets, stocks, mutual funds, SIPs, and wealth growth.</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl shadow-sm shadow-blue-500/30 transition-all active:scale-95 shrink-0"
        >
          <Plus size={18} /> Add Investment
        </button>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="group bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Current Portfolio Value</p>
          <p className="text-3xl font-extrabold mt-1">
            {currency}{stats.currentPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
            <span>{stats.activeCount} active investments</span>
          </p>
        </div>

        {/* Total Invested Amount */}
        <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 cursor-pointer">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Total Amount Invested</p>
          <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">
            {currency}{stats.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Principal Outlay</p>
        </div>

        {/* Profit / Loss */}
        <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 cursor-pointer">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Total Profit / Loss</p>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full group-hover:scale-110 transition-transform duration-300 ${
                stats.totalProfitLoss >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-500'
              }`}
            >
              {stats.totalProfitLoss >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stats.returnPercentage.toFixed(2)}%
            </span>
          </div>
          <p className={`text-2xl font-extrabold mt-1 ${stats.totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {stats.totalProfitLoss >= 0 ? '+' : ''}{currency}{stats.totalProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Unrealized Net Return</p>
        </div>

        {/* Best Performer */}
        <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 cursor-pointer">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Top Performer</p>
          {stats.bestPerformer ? (
            <div className="mt-1">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">{stats.bestPerformer.investmentName}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                +{currency}{(stats.bestPerformer.profitLoss || 0).toFixed(2)} ({stats.bestPerformer.returnPct ? stats.bestPerformer.returnPct.toFixed(1) : 0}%)
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-400 mt-2">No investments yet</p>
          )}
        </div>
      </div>

      {/* Analytics Charts Row */}
      {stats.typeData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Allocation Pie Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <PieIcon size={18} className="text-blue-600" /> Asset Allocation by Type
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={stats.typeData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="currentValue">
                    {stats.typeData.map(entry => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${currency}${Number(val).toLocaleString('en-IN')}`, 'Value']}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {stats.typeData.slice(0, 6).map(item => (
                <div key={item.type} className="flex items-center gap-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.type] || '#3b82f6' }} />
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">{item.type}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{currency}{item.currentValue.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Broker Breakdown Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-600" /> Portfolio by Broker / Platform
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={stats.brokerData} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="broker" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    formatter={(val: any) => [`${currency}${Number(val).toLocaleString('en-IN')}`, 'Invested']}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Portfolio List Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search assets, brokers, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border transition-all ${
                activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700'
              }`}
            >
              <Filter size={14} /> Filter Options
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">{filteredInvestments.length} records</span>
            <ExportDropdown onExport={handleExport} />
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Type</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="all">All Types</option>
                {INVESTMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Broker</label>
              <select
                value={selectedBroker}
                onChange={e => setSelectedBroker(e.target.value)}
                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="all">All Brokers</option>
                {stats.brokers.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Account</label>
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="all">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Returns</label>
              <select
                value={selectedProfitLoss}
                onChange={e => setSelectedProfitLoss(e.target.value as any)}
                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="all">All Performance</option>
                <option value="profit">Profit Only</option>
                <option value="loss">Loss Only</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_amount">Highest Amount</option>
                <option value="lowest_amount">Lowest Amount</option>
                <option value="highest_value">Highest Value</option>
                <option value="name_asc">Name A-Z</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-700 dark:text-zinc-200 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Table */}
        {filteredInvestments.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <Briefcase size={40} className="mx-auto mb-2 opacity-30" />
            <p className="font-bold text-base text-zinc-700 dark:text-zinc-300">No investments found</p>
            <p className="text-xs text-zinc-400 mt-1 mb-4">Start building your investment portfolio today.</p>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              + Add Investment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Asset Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Broker</th>
                  <th className="py-3 px-3 text-right">Invested</th>
                  <th className="py-3 px-3 text-right">Current Value</th>
                  <th className="py-3 px-3 text-right">P / L</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {filteredInvestments.map(item => {
                  const pl = item.currentValue - item.amount;
                  const plPct = item.amount > 0 ? (pl / item.amount) * 100 : 0;
                  const dStr = typeof item.investmentDate === 'string' ? item.investmentDate.split('T')[0] : item.investmentDate.toISOString().split('T')[0];

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.investmentName}</p>
                          <p className="text-[11px] text-zinc-400">{dStr} {item.account ? `• ${item.account.name}` : ''}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white"
                          style={{ backgroundColor: TYPE_COLORS[item.investmentType] || '#3b82f6' }}
                        >
                          {item.investmentType}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-zinc-600 dark:text-zinc-300 font-semibold">
                        {item.broker || '—'}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                        {currency}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {currency}{item.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className={`font-bold ${pl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {pl >= 0 ? '+' : ''}{currency}{pl.toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-bold ${pl >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                          {pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeleteError('');
                            }}
                            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Investment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white dark:bg-zinc-900 w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex-shrink-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-none">
              <h3 className="font-bold text-lg">{editItem ? 'Edit Investment' : 'Add New Investment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              {formError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl mb-4 border border-red-200 dark:border-red-900">
                  {formError}
                </p>
              )}
              {/* Type & Custom Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Investment Type</label>
                  <select
                    value={invType}
                    onChange={e => setInvType(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INVESTMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {invType === 'Other' && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Custom Type Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Venture Capital"
                      value={customType}
                      onChange={e => setCustomType(e.target.value)}
                      className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Broker / Platform</label>
                  <input
                    type="text"
                    placeholder="e.g. Zerodha, Groww"
                    list="brokers-list"
                    value={broker}
                    onChange={e => setBroker(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="brokers-list">
                    {BROKERS_SUGGESTIONS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>

              {/* Investment Name */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Investment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Reliance Industries, Parag Parikh Flexi Cap"
                  value={invName}
                  onChange={e => setInvName(e.target.value)}
                  className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Account selection & Investment Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Deduct From Account</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Account Deduction</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currency}{a.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Investment Date</label>
                  <input
                    type="date"
                    value={invDate}
                    onChange={e => setInvDate(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Amount, Charges & Taxes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount ({currency}) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Brokerage Fee</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={brokerCharges}
                    onChange={e => setBrokerCharges(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Taxes / STT</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={tax}
                    onChange={e => setTax(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Units, Purchase Price & Current Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Units / Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={units}
                    onChange={e => setUnits(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Purchase Price</label>
                  <input
                    type="number"
                    placeholder="Per unit"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Current Price</label>
                  <input
                    type="number"
                    placeholder="Per unit"
                    value={currentPrice}
                    onChange={e => setCurrentPrice(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Total Current Value & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Current Value ({currency})</label>
                  <input
                    type="number"
                    placeholder="Defaults to Amount"
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="redeemed">Redeemed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Notes & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Long term SIP"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</label>
                  <input
                    type="text"
                    placeholder="e.g. #retirement, #equity"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1 transition-colors"
              >
                <Check size={16} />
                {isPending ? 'Saving…' : 'Save Investment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-left">
            <h3 className="font-bold text-lg mb-2">Delete Investment?</h3>
            {deleteError ? (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl mb-4 border border-red-200 dark:border-red-900">{deleteError}</p>
            ) : (
              <p className="text-zinc-500 text-sm mb-5">Money invested will be returned to your account balance.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingId(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={isPending || !!deleteError}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60 transition-colors"
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
