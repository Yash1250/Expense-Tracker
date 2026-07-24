"use client";

import { useState } from 'react';
import { LayoutDashboard, Users, ShieldCheck, Activity, CreditCard, Layers, Eye } from 'lucide-react';
import UsersClient from './UsersClient';
import AuditLogsClient from './AuditLogsClient';

type SystemStats = {
  totalUsers: number;
  activeUsers: number;
  totalExpenses: number;
  totalIncomes: number;
  totalInvestments: number;
  totalAuditLogs: number;
};

type AdminDashboardProps = {
  initialStats: SystemStats;
  initialUsers: any[];
  initialLogs: any[];
};

export default function AdminDashboardClient({
  initialStats,
  initialUsers,
  initialLogs,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'logs'>('stats');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          System Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Monitor system metrics, review audit logs, and manage registered users.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stats'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard size={18} />
          System Stats
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Users size={18} />
          Manage Users
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <ShieldCheck size={18} />
          Audit Logs
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Users Stat */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Registered Users</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{initialStats.totalUsers}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    <span className="font-semibold text-emerald-500">{initialStats.activeUsers} Active</span> · {initialStats.totalUsers - initialStats.activeUsers} Inactive
                  </p>
                </div>
              </div>

              {/* Transactions Stat */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Total System Expenses</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{initialStats.totalExpenses} entries</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Expenses recorded by all tracker users.
                  </p>
                </div>
              </div>

              {/* Incomes Stat */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Total System Incomes</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{initialStats.totalIncomes} entries</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Incomes recorded by all tracker users.
                  </p>
                </div>
              </div>

              {/* Investments Stat */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Total System Investments</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{initialStats.totalInvestments} entries</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Investments logged across portfolios.
                  </p>
                </div>
              </div>

              {/* Audit Logs Stat */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Total Security Audit Logs</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-zinc-100">{initialStats.totalAuditLogs} entries</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Security actions tracked in database.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Overview Section */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Administrative Overview</h2>
              <div className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed space-y-2">
                <p>Welcome to the central command center of the Expense Tracker platform.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use the <strong>Manage Users</strong> tab to add new users, toggle access status, change passwords, or impersonate a user account to help diagnose issues.</li>
                  <li>Use the <strong>Audit Logs</strong> tab to verify action histories, logins, and database integrity actions.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UsersClient initialUsers={initialUsers} />
        )}

        {activeTab === 'logs' && (
          <AuditLogsClient logs={initialLogs} />
        )}
      </div>
    </div>
  );
}
