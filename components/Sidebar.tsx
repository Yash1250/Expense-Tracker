"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, List, PieChart, Wallet, Tag, Settings, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, CreditCard, ShieldCheck } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: List },
  { href: '/income', label: 'Income', icon: TrendingDown },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/reports', label: 'Reports', icon: PieChart },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/admin', label: 'System Admin', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  role = 'USER',
  user,
  bannerOffset = '0px',
}: {
  role?: 'ADMIN' | 'USER';
  user?: { fullName: string; email: string } | null;
  bannerOffset?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // bannerOffset is accepted for API compatibility but the parent layout
  // already handles the offset — sidebar simply fills the parent shell height.
  void bannerOffset;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const isAdmin = role === 'ADMIN';
  const visibleItems = navItems.filter((item) => {
    if (item.href === '/admin') return isAdmin;
    return true;
  });

  const initials = user?.fullName ? getInitials(user.fullName) : 'YM';
  const name = user?.fullName || 'Yash Mehta';
  const emailLabel = user?.email || 'Personal';

  return (
    <aside
      className={`
        hidden md:flex flex-col h-full shrink-0
        bg-white dark:bg-zinc-900
        border-r border-zinc-200 dark:border-zinc-800
        transition-all duration-300 overflow-hidden
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Logo / Collapse Toggle */}
      <div className={`flex items-center h-16 px-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">ExpenseTracker</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Add Expense CTA */}
      <div className="px-2 pt-4 pb-2 shrink-0">
        <Link
          href="/expenses/add"
          title={collapsed ? 'Add Expense' : undefined}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/30 transition-all active:scale-95 ${collapsed ? 'px-0' : 'px-3'}`}
        >
          <Plus size={18} className="shrink-0" />
          {!collapsed && <span>Add Expense</span>}
        </Link>
      </div>

      {/* Nav Items — scrolls internally if too many */}
      <nav className="flex-1 py-2 space-y-1 px-2 overflow-y-auto overflow-x-hidden">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Icon size={18} className="shrink-0 group-hover:translate-x-0.5 group-hover:scale-110 transition-transform duration-200" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className={`p-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'px-2'}`}>
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{initials}</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{name}</p>
              <p className="text-xs text-zinc-500 truncate">{emailLabel}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
