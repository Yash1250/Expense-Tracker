"use client";

import { useState, useTransition } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { getReportData } from '@/lib/actions';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

const PERIODS = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }] as const;

export default function ReportsClient({ initialData, currency }: { initialData: any; currency: string }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [data, setData] = useState(initialData);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = `${period.toUpperCase()} Financial Report`;
    const filterText = {
      Period: period.charAt(0).toUpperCase() + period.slice(1),
      Range: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Dates'
    };
    const summary = [
      { label: 'Total Expense', value: `${currency}${data.total.toFixed(2)}` },
      { label: 'Transactions Count', value: data.count.toString() },
      { label: 'Average Expense', value: `${currency}${data.average.toFixed(2)}` },
      { label: 'Highest Expense', value: `${currency}${data.highest.toFixed(2)}` }
    ];
    const columns = ['Date', 'Category', 'Merchant', 'Notes', 'Amount', 'Method'];
    const rows = data.expenses.map((e: any) => [
      e.date,
      e.category,
      e.merchant || '-',
      e.notes || '-',
      `${currency}${e.amount.toFixed(2)}`,
      e.method
    ]);

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV(`report-${period}`, columns, rows);
    } else if (type === 'excel') {
      exportToExcel(`report-${period}`, columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };

  const loadData = (p: typeof period, from = dateFrom, to = dateTo) => {
    startTransition(async () => {
      const result = await getReportData(p, from || undefined, to || undefined);
      setData(result);
    });
  };

  return (
    <div className="pb-6 space-y-6">
      {/* Period tabs */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mx-4 md:mx-0 md:max-w-xs">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => { setPeriod(p.value); loadData(p.value); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${period === p.value ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <div className="flex items-center gap-3 px-4 md:px-0 flex-wrap">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none" />
        <span className="text-zinc-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none" />
        <button onClick={() => loadData(period)} disabled={isPending} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-60">
          {isPending ? '…' : 'Apply'}
        </button>
        {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); loadData(period, '', ''); }} className="text-sm text-zinc-500">Clear</button>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0">
        {[
          { label: 'Total Expense', value: `${currency}${data.total.toFixed(2)}` },
          { label: 'Transactions', value: data.count.toString() },
          { label: 'Average', value: `${currency}${data.average.toFixed(2)}` },
          { label: 'Highest', value: `${currency}${data.highest.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
            <p className="text-zinc-500 text-xs font-medium mb-1">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-0">
        <ChartCard title="Spending Trend">
          <div className="h-56">
            {data.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData}>
                  <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [`${currency}${v}`, 'Amount']} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#rg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>

        <ChartCard title="Category Breakdown">
          <div className="h-48">
            {data.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categoryData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {data.categoryData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${currency}${v.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {data.categoryData.slice(0, 5).map((d: any) => (
              <div key={d.name} className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-zinc-500">{d.name}</span></div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Payment Methods">
          <div className="h-48">
            {data.methodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.methodData} layout="vertical" barSize={14}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={70} />
                  <Tooltip formatter={(v: any) => `${currency}${v.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>

        <ChartCard title="Category Comparison">
          <div className="h-48">
            {data.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryData.slice(0, 6)} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip formatter={(v: any) => `${currency}${v.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.categoryData.slice(0, 6).map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>
      </div>

      {/* Expense table */}
      {data.expenses.length > 0 && (
        <div className="px-4 md:px-0">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="font-semibold">Transactions ({data.expenses.length})</h3>
              <ExportDropdown onExport={handleExport} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>{['Date','Category','Merchant','Amount','Method'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.expenses.slice(0, 20).map((e: any) => (
                    <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-4 py-2.5 text-zinc-600">{e.date}</td>
                      <td className="px-4 py-2.5 font-medium">{e.category}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{e.merchant || '-'}</td>
                      <td className="px-4 py-2.5 font-semibold text-red-500">-{currency}{e.amount.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{e.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-700"><h3 className="font-semibold mb-4">{title}</h3>{children}</section>;
}
function EmptyChart() {
  return <div className="flex items-center justify-center h-full text-zinc-400 text-sm">No data for this period</div>;
}
