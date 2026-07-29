"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, Landmark, PieChart as PieIcon, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardClient({ stats }: { stats: any }) {
  const {
    todayTotal, weekTotal, monthTotal, yearTotal, prevMonthTotal,
    totalIncome, netSavings, monthlyLimit, currency, budgetUsedPct,
    pieData, lineData, recent, topCategories, stats: s,
    totalAvailableBalance, currentPortfolioValue, netWorth
  } = stats;

  const isWarning = budgetUsedPct >= 80;
  const isExceeded = budgetUsedPct >= 100;
  const remaining = monthlyLimit - monthTotal;

  return (
    <div className="pb-8 space-y-6 bg-slate-50/50 dark:bg-zinc-950/50 min-h-screen animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Net Worth Hero Card */}
      <section className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mx-4 md:mx-0 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md hover:border-blue-500/80 cursor-pointer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Landmark size={18} />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Total Net Worth</p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {currency}{(netWorth || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Combined Available Cash ({currency}{(totalAvailableBalance || 0).toLocaleString('en-IN')}) & Investment Portfolio ({currency}{(currentPortfolioValue || 0).toLocaleString('en-IN')})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl px-4 py-3 border border-slate-200/60 dark:border-zinc-800 transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Available Cash</p>
              <p className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                {currency}{(totalAvailableBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl px-4 py-3 border border-slate-200/60 dark:border-zinc-800 transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Investments</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {currency}{(currentPortfolioValue || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Key Financial Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
        {/* Income */}
        <div className="group bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 active:scale-95 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Total Income</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <ArrowDownRight size={16} />
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{currency}{totalIncome.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">All Time Earned</p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="group bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 active:scale-95 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">This Month Spent</span>
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">
              -{currency}{monthTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Prev: {currency}{prevMonthTotal.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Investment Portfolio */}
        <div className="group bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 active:scale-95 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Portfolio Assets</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <TrendingUp size={16} />
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currency}{(currentPortfolioValue || 0).toLocaleString('en-IN')}
            </p>
            <Link href="/investments" className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1 inline-block">
              View Portfolio →
            </Link>
          </div>
        </div>

        {/* Net Savings */}
        <div className="group bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md hover:border-blue-500/80 active:scale-95 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Net Savings</span>
            <span className={`p-2 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ${netSavings >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
              <Wallet size={16} />
            </span>
          </div>
          <div>
            <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {netSavings >= 0 ? '+' : ''}{currency}{netSavings.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Income minus Month Spent</p>
          </div>
        </div>
      </div>

      {/* Budget Status Section */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mx-4 md:mx-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" /> Monthly Budget Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Budget Limit: {currency}{monthlyLimit.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Spent: </span>
              <span className="font-bold text-slate-900 dark:text-zinc-100">{currency}{monthTotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Remaining: </span>
              <span className={`font-bold ${remaining < 0 ? 'text-red-500' : 'text-slate-900 dark:text-zinc-100'}`}>
                {currency}{remaining.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Progress</span>
            <span className={isExceeded ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-600'}>
              {budgetUsedPct}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
            />
          </div>

          {isExceeded && (
            <div className="flex items-center text-red-500 text-xs font-medium gap-1.5 mt-2 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-100 dark:border-red-900/50">
              <AlertTriangle size={14} />
              <span>Budget exceeded by {currency}{Math.abs(remaining).toLocaleString('en-IN')}</span>
            </div>
          )}

          {!isExceeded && isWarning && (
            <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs font-medium gap-1.5 mt-2 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <AlertTriangle size={14} />
              <span>Warning: {budgetUsedPct}% of monthly budget used.</span>
            </div>
          )}
        </div>
      </section>

      {/* Account Balances Summary Row */}
      {stats.accounts && stats.accounts.length > 0 && (
        <section className="px-4 md:px-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" /> Account Balances
            </h3>
            <Link href="/accounts" className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline">
              View All Accounts →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.accounts.map((acc: any) => (
              <Link
                key={acc.id}
                href={`/accounts/${acc.id}`}
                className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center justify-between shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-zinc-800"
                    style={{ backgroundColor: acc.color + '15' }}
                  >
                    {acc.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate max-w-[110px]">
                      {acc.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{acc.type.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                    {currency}{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-0">
        {/* Category Breakdown Pie Chart */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <PieIcon size={18} className="text-blue-600" /> Category Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-medium">Expenses</span>
          </div>

          <div className="h-56 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={pieData} innerRadius={65} outerRadius={88} paddingAngle={4} dataKey="value">
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color || '#2563EB'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [`${currency}${Number(v).toFixed(2)}`, 'Amount']}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No expense data available</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {pieData.slice(0, 5).map((item: any) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || '#2563EB' }} />
                <span className="text-slate-600 dark:text-zinc-300 font-medium">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">{currency}{item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Expense Trend Bar Chart */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> Weekly Expense Trend
            </h3>
            <span className="text-xs text-slate-400 font-medium">This Week</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={lineData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(v: any) => [`${currency}${v}`, 'Spent']}
                />
                <Bar dataKey="amount" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Recent Transactions + Key Metrics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-0">
        {/* Recent Expenses List */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">Recent Expenses</h3>
            <Link href="/expenses" className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline">
              See All →
            </Link>
          </div>

          <div className="space-y-3">
            {recent.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-8">
                No recent expenses.{' '}
                <Link href="/expenses/add" className="text-blue-600 font-semibold underline">
                  Add one now
                </Link>
              </p>
            )}

            {recent.map((exp: any) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800/80 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 border border-slate-100 dark:border-zinc-800"
                    style={{ backgroundColor: (exp.categoryColor || '#2563EB') + '15' }}
                  >
                    {exp.categoryColor ? '💸' : '📦'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate max-w-[140px]">{exp.title}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{exp.category} · {exp.time}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-red-500">-{currency}{exp.amount.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{exp.method}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* High Level Analytics Summary */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 mb-4">Financial Overview</h3>
            <div className="space-y-2.5">
              <AnalyticsRow label="Highest Expense" value={`${currency}${s.highestExpense.toFixed(2)}`} />
              <AnalyticsRow label="Average Expense" value={`${currency}${s.avgExpense.toFixed(2)}`} />
              <AnalyticsRow label="This Month Total" value={`${currency}${monthTotal.toFixed(2)}`} />
              <AnalyticsRow label="Previous Month Total" value={`${currency}${prevMonthTotal.toFixed(2)}`} />
              <AnalyticsRow
                label="Net Savings"
                value={`${currency}${netSavings.toFixed(2)}`}
                highlight={netSavings >= 0 ? 'green' : 'red'}
              />
            </div>
          </div>

          {topCategories.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top Spending Categories</h4>
              <div className="space-y-2">
                {topCategories.slice(0, 4).map((cat: any) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#2563EB' }} />
                    <span className="flex-1 font-medium text-slate-600 dark:text-zinc-300 truncate">{cat.name}</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100">{currency}{cat.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AnalyticsRow({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/80 last:border-0">
      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{label}</span>
      <span
        className={`text-sm font-bold ${
          highlight === 'green'
            ? 'text-emerald-600 dark:text-emerald-400'
            : highlight === 'red'
            ? 'text-red-500'
            : 'text-slate-900 dark:text-zinc-100'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
