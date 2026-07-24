"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, FileText, Search, CreditCard, ShieldCheck, Clock, Calendar } from 'lucide-react';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

type LedgerItem = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  categoryIcon?: string;
  categoryColor?: string;
  description: string;
  dateStr: string;
  runningBalance: number;
};

type Props = {
  details: {
    account: {
      id: string;
      name: string;
      type: string;
      balance: number;
      openingBalance: number;
      currency: string;
      status: string;
      color: string;
      icon: string;
      createdAt: Date;
    };
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    ledger: LedgerItem[];
  };
  currency: string;
};

export default function AccountDetailsClient({ details, currency }: Props) {
  const { account, totalIncome, totalExpense, transactionCount, ledger } = details;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = `${account.name} Account Statement`;
    const filterText = {
      Type: filterType !== 'all' ? filterType.toUpperCase() : 'ALL',
      Search: search.trim() ? search : ''
    };
    const summary = [
      { label: 'Opening Balance', value: `${currency}${account.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Total Income', value: `${currency}${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Total Expense', value: `${currency}${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Current Balance', value: `${currency}${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
    ];
    const columns = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Running Balance'];
    const rows = filteredLedger.map(item => [
      item.dateStr,
      item.title,
      item.category,
      item.type.toUpperCase(),
      `${item.type === 'income' ? '+' : '-'}${currency}${item.amount.toFixed(2)}`,
      `${currency}${item.runningBalance.toFixed(2)}`
    ]);

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV(`${account.name.toLowerCase()}-statement`, columns, rows);
    } else if (type === 'excel') {
      exportToExcel(`${account.name.toLowerCase()}-statement`, columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };

  const filteredLedger = ledger.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.title.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.amount.toString().includes(term) ||
      item.dateStr.includes(term);

    return matchesType && matchesSearch;
  });

  return (
    <div className="pb-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Accounts
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {account.type.replace('_', ' ')}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <ShieldCheck size={12} /> {account.status}
          </span>
        </div>
      </div>

      {/* Account Info Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shrink-0 shadow-inner"
              style={{ backgroundColor: account.color + '22' }}
            >
              {account.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <span>Currency: {account.currency}</span>
                <span>•</span>
                <span>
                  Created{' '}
                  {new Date(account.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Current Available Balance</p>
            <p
              className={`text-3xl font-extrabold mt-0.5 ${
                account.balance < 0 ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {currency}{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Opening Balance</p>
          <p className="text-xl font-bold mt-1 text-zinc-700 dark:text-zinc-300">
            {currency}{account.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Income</p>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            +{currency}{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total Expenses</p>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-500">
            -{currency}{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transactions</p>
          <p className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">
            {transactionCount} records
          </p>
        </div>
      </div>

      {/* Account Bank Ledger Statement */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> Account Statement
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Chronological transaction history and running balance calculation.</p>
          </div>

          <div className="flex items-center gap-2">
            <ExportDropdown onExport={handleExport} />
            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('all')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'all' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 font-semibold shadow-sm' : 'text-zinc-500'
                }`}
              >
                Incomes
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'expense' ? 'bg-white dark:bg-zinc-700 text-red-500 font-semibold shadow-sm' : 'text-zinc-500'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredLedger.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <Wallet size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">No ledger transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Category / Source</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {filteredLedger.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3 text-xs text-zinc-500 whitespace-nowrap">{item.dateStr}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          item.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-900/30 text-red-500'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span>{item.categoryIcon || '📦'}</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-500 max-w-xs truncate">{item.title || item.description || '—'}</td>
                    <td className={`py-3 px-3 text-right font-bold ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {currency}{item.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
