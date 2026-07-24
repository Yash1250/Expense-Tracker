"use client";

import { useState, useTransition } from 'react';
import { Wallet, DollarSign, CreditCard, Save, AlertTriangle } from 'lucide-react';
import { updateBudget } from '@/lib/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

export default function BudgetClient({ stats, budget, currency }: { stats: any; budget: any; currency: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [monthly, setMonthly] = useState(budget?.monthlyLimit ?? 50000);
  const [weekly, setWeekly] = useState(budget?.weeklyLimit ?? 12000);
  const [daily, setDaily] = useState(budget?.dailyLimit ?? 1500);

  const handleSave = () => {
    startTransition(async () => {
      await updateBudget({ monthly: Number(monthly), weekly: Number(weekly), daily: Number(daily) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  };

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = 'Budget Performance Report';
    const filterText = {};
    const summary = [
      { label: 'Highest Expense', value: `${currency}${stats.stats.highestExpense.toFixed(2)}` },
      { label: 'Avg Expense', value: `${currency}${stats.stats.avgExpense.toFixed(2)}` },
      { label: 'Total Transactions', value: stats.stats.totalExpenses.toString() },
      { label: 'Net Savings', value: `${currency}${stats.netSavings.toFixed(2)}` }
    ];
    const columns = ['Budget Period', 'Limit', 'Spent', 'Remaining', 'Status', 'Usage %'];
    
    const periods = [
      { name: 'Monthly Budget', limit: Number(monthly), used: stats.monthTotal },
      { name: 'Weekly Budget', limit: Number(weekly), used: stats.weekTotal },
      { name: 'Daily Budget', limit: Number(daily), used: stats.todayTotal }
    ];

    const rows = periods.map(p => {
      const remaining = Math.max(p.limit - p.used, 0);
      const pct = p.limit > 0 ? (p.used / p.limit) * 100 : 0;
      const status = pct >= 100 ? 'Exceeded' : pct >= 80 ? 'Warning' : 'On Track';
      return [
        p.name,
        `${currency}${p.limit.toFixed(2)}`,
        `${currency}${p.used.toFixed(2)}`,
        `${currency}${remaining.toFixed(2)}`,
        status,
        `${pct.toFixed(0)}%`
      ];
    });

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV('budget-report', columns, rows);
    } else if (type === 'excel') {
      exportToExcel('budget-report', columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };

  return (
    <div className="pb-6 space-y-6">
      <header className="md:hidden sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md z-10 px-4 py-3">
        <h1 className="text-2xl font-bold">Budget</h1>
      </header>

      {/* Budget cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-4 md:px-0">
        <BudgetCard icon={<Wallet size={22} />} iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600" label="Monthly Budget" limit={Number(monthly)} used={stats.monthTotal} currency={currency} />
        <BudgetCard icon={<CreditCard size={22} />} iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" label="Weekly Budget" limit={Number(weekly)} used={stats.weekTotal} currency={currency} />
        <BudgetCard icon={<DollarSign size={22} />} iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600" label="Daily Budget" limit={Number(daily)} used={stats.todayTotal} currency={currency} />
      </div>

      {/* Edit limits */}
      <div className="px-4 md:px-0">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg">Edit Budget Limits</h2>
            <div className="flex items-center gap-2">
              <ExportDropdown onExport={handleExport} />
              <button onClick={handleSave} disabled={isPending} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors ${saved ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                <Save size={15} />{saved ? 'Saved!' : isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Monthly Limit', value: monthly, setter: setMonthly, color: 'blue' },
              { label: 'Weekly Limit', value: weekly, setter: setWeekly, color: 'emerald' },
              { label: 'Daily Limit', value: daily, setter: setDaily, color: 'orange' },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label} ({currency})</label>
                <input type="number" value={value} onChange={e => setter(e.target.value)} className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="px-4 md:px-0 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">Highest Expense</p><p className="text-lg font-bold">{currency}{stats.stats.highestExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">Avg Expense</p><p className="text-lg font-bold">{currency}{stats.stats.avgExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">Total Transactions</p><p className="text-lg font-bold">{stats.stats.totalExpenses}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">Net Savings</p><p className={`text-lg font-bold ${stats.netSavings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{currency}{stats.netSavings.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function BudgetCard({ icon, iconBg, label, limit, used, currency }: { icon: React.ReactNode; iconBg: string; label: string; limit: number; used: number; currency: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isExceeded = pct >= 100, isWarning = pct >= 80;
  const barColor = isExceeded ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-blue-500';
  const statusLabel = isExceeded ? 'Exceeded' : isWarning ? 'Warning' : 'On Track';
  const statusColor = isExceeded ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-emerald-500';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className={`p-2.5 rounded-2xl ${iconBg}`}>{icon}</div><span className="font-semibold">{label}</span></div>
        <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>
      {isExceeded && <div className="flex items-center gap-1 text-red-500 text-xs"><AlertTriangle size={13} /><span>Budget exceeded!</span></div>}
      <div>
        <div className="flex justify-between text-sm mb-2"><span className="text-zinc-500">Spent: {currency}{used.toFixed(2)}</span><span className="font-medium">{Math.round(pct)}%</span></div>
        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>Remaining: {currency}{Math.max(limit - used, 0).toFixed(2)}</span>
          <span>Limit: {currency}{limit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
