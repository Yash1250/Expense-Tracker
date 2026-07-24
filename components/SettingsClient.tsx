"use client";

import { useState, useTransition } from 'react';
import { Moon, Sun, Monitor, DollarSign, Download, Wallet, CreditCard, Save } from 'lucide-react';
import { updateTheme, updateCurrency, updateBudget } from '@/lib/actions';

export default function SettingsClient({ initialSettings, initialBudget }: { initialSettings: any; initialBudget: any }) {
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState(initialSettings?.theme || 'system');
  const [currency, setCurrency] = useState(initialSettings?.currency || 'INR');
  const [monthlyLimit, setMonthlyLimit] = useState(initialBudget?.monthlyLimit ?? 50000);
  const [weeklyLimit, setWeeklyLimit] = useState(initialBudget?.weeklyLimit ?? 12000);
  const [dailyLimit, setDailyLimit] = useState(initialBudget?.dailyLimit ?? 1500);
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (t: string) => {
    setTheme(t);
    startTransition(() => { updateTheme(t); });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
    startTransition(() => { updateCurrency(e.target.value); });
  };

  const handleSaveBudgets = () => {
    startTransition(async () => {
      await updateBudget({
        monthlyLimit: Number(monthlyLimit),
        weeklyLimit: Number(weeklyLimit),
        dailyLimit: Number(dailyLimit),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="pb-6 space-y-6">

      {/* ── Mobile header ── */}
      <header className="md:hidden sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md z-10 px-4 py-3">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      {/* ── Desktop two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-0">

        {/* Budgets */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-1">Budgets</h2>
            <button
              onClick={handleSaveBudgets}
              disabled={isPending}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${saved ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
            >
              <Save size={12} />{saved ? 'Saved!' : 'Save'}
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <BudgetRow
              icon={<Wallet size={18} />} iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              label="Monthly" value={monthlyLimit} onChange={setMonthlyLimit}
            />
            <BudgetRow
              icon={<CreditCard size={18} />} iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              label="Weekly" value={weeklyLimit} onChange={setWeeklyLimit} border
            />
            <BudgetRow
              icon={<DollarSign size={18} />} iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
              label="Daily" value={dailyLimit} onChange={setDailyLimit} border
            />
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 ml-1">Preferences</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-0">
            {/* Theme */}
            <div className="flex flex-col p-3 border-b border-zinc-100 dark:border-zinc-800 gap-3">
              <span className="font-medium text-sm">Theme</span>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {[
                  { key: 'system', icon: Monitor, label: 'System' },
                  { key: 'light', icon: Sun, label: 'Light' },
                  { key: 'dark', icon: Moon, label: 'Dark' },
                ].map(({ key, icon: Icon, label }) => (
                  <button key={key} onClick={() => handleThemeChange(key)}
                    className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-colors ${theme === key ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="flex items-center justify-between p-3">
              <span className="font-medium text-sm">Currency</span>
              <select value={currency} onChange={handleCurrencyChange}
                className="bg-transparent text-zinc-500 font-medium outline-none text-right cursor-pointer text-sm">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data / Export */}
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 ml-1">Data</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              {['Export CSV', 'Export Excel', 'Export PDF'].map(label => (
                <button key={label}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                    <Download size={16} />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function BudgetRow({
  icon, iconBg, label, value, onChange, border
}: {
  icon: React.ReactNode; iconBg: string; label: string;
  value: number | string; onChange: (v: string) => void; border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 ${border ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${iconBg}`}>{icon}</div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1 font-medium">
        <span className="text-zinc-400 text-sm">₹</span>
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          className="w-24 text-right bg-transparent outline-none border-b border-zinc-200 dark:border-zinc-700 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>
    </div>
  );
}
